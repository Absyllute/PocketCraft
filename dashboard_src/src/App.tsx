import React, { useEffect, useState, useRef } from 'react';
import { 
  auth, 
  googleProvider, 
  db, 
  signInWithPopup, 
  signOut 
} from './firebase';
import { onAuthStateChanged, type User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, collection, addDoc, onSnapshot, Timestamp } from 'firebase/firestore';

// --- Icons ---
const ServerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/>
    <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/>
    <line x1="6" x2="6.01" y1="6" y2="6"/>
    <line x1="6" x2="6.01" y1="18" y2="18"/>
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ConsoleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5"/>
    <line x1="12" x2="20" y1="19" y2="19"/>
  </svg>
);

const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8"/>
    <rect width="16" height="12" x="4" y="8" rx="2"/>
    <path d="M2 14h2"/>
    <path d="M20 14h2"/>
    <path d="M15 13v2"/>
    <path d="M9 13v2"/>
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/>
  </svg>
);

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" x2="22" y1="12" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const PowerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v10"/>
    <path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>
  </svg>
);

const RefreshCwIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M16 3h5v5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 21H3v-5"/>
  </svg>
);

// --- Type definitions ---
interface Player {
  name: string;
  uuid: string;
}

interface DashboardStatus {
  serverRunning: boolean;
  playersOnline: Player[];
  uptimeSeconds: number;
  tps: number | null;
  afkBotEnabled: boolean;
  subdomain: string | null;
  whitelist: string[];
  lastSeen: Timestamp;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  text: string;
}

interface ConsoleLine {
  type: 'input' | 'output' | 'error';
  text: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helper
  const showToast = (type: 'success' | 'error', text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('success', 'Logged in successfully!');
    } catch (e: any) {
      showToast('error', e.message || 'Login failed.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('success', 'Logged out.');
    } catch (e: any) {
      showToast('error', e.message || 'Logout failed.');
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>
        Loading Session...
      </div>
    );
  }

  return (
    <>
      {user ? (
        <DashboardPage user={user} onLogout={handleLogout} showToast={showToast} />
      ) : (
        <LoginPage onLoginWithGoogle={handleLogin} showToast={showToast} />
      )}

      {/* Toast Render */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            <span style={{ fontSize: '16px' }}>{t.type === 'error' ? '❌' : '✅'}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// --- Login Page Component ---
function LoginPage({ 
  onLoginWithGoogle, 
  showToast 
}: { 
  onLoginWithGoogle: () => void; 
  showToast: (type: 'success' | 'error', text: string) => void;
}) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('success', 'Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('success', 'Logged in successfully!');
      }
    } catch (err: any) {
      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'That email is already registered.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password.';
      }
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '400px', width: '90%' }}>
        <h1 className="auth-title">PocketCraft</h1>
        <p className="auth-subtitle">Server Web Control Dashboard</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{ width: '100%', marginTop: '4px', padding: '10px 14px' }}
              required
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{ width: '100%', marginTop: '4px', padding: '10px 14px' }}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p style={{ fontSize: '13px', marginTop: '14px', color: 'var(--text-secondary)' }}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <span 
            onClick={() => setIsSignUp(!isSignUp)} 
            style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </span>
        </p>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <button 
          type="button"
          className="btn btn-secondary" 
          onClick={onLoginWithGoogle} 
          style={{ width: '100%', padding: '12px' }}
          disabled={loading}
        >
          Sign In with Google
        </button>
      </div>
    </div>
  );
}

// --- Dashboard Page Component ---
function DashboardPage({ 
  user, 
  onLogout, 
  showToast 
}: { 
  user: User; 
  onLogout: () => void; 
  showToast: (type: 'success' | 'error', text: string) => void; 
}) {
  const [status, setStatus] = useState<DashboardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneOnline, setPhoneOnline] = useState(false);
  const [proUser, setProUser] = useState(false);
  const [dashboardSecret, setDashboardSecret] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Real-time Player Stats States
  const [statsLoading, setStatsLoading] = useState(false);
  const [playerStats, setPlayerStats] = useState<{
    pos?: string;
    dimension?: string;
    health?: string;
    xp?: string;
    deathPos?: string;
    deathDim?: string;
  } | null>(null);

  // AFK Bot Spawn Form States
  const [botName, setBotName] = useState('');
  const [botX, setBotX] = useState('');
  const [botY, setBotY] = useState('64');
  const [botZ, setBotZ] = useState('');
  const [botOwner, setBotOwner] = useState('');
  const [botSpawning, setBotSpawning] = useState(false);

  // Command Pending States
  const [pendingActions, setPendingActions] = useState<Record<string, boolean>>({});

  // Confirm Modals State
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Snapshot Listeners
  useEffect(() => {
    // 1. Listen to dashboard status
    const statusRef = doc(db, 'users', user.uid, 'dashboard_status', 'status');
    const unsubscribeStatus = onSnapshot(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as DashboardStatus;
        setStatus(data);
      } else {
        setStatus(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to status:", error);
      showToast('error', 'Error sync status.');
      setLoading(false);
    });

    // 2. Fetch User Entitlement State and Dashboard Secret
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const tier = data.premiumTier || 'none';
        setProUser(tier === 'premium' || tier === 'supportive');
        setDashboardSecret(data.dashboardSecret || null);
      } else {
        setProUser(false);
        setDashboardSecret(null);
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeUser();
    };
  }, [user.uid]);

  const fetchPlayerStats = async (playerName: string) => {
    setStatsLoading(true);
    setPlayerStats(null);
    try {
      const posRes = await dispatchCommand('rcon', { command: `data get entity "${playerName}" Pos` });
      const dimRes = await dispatchCommand('rcon', { command: `data get entity "${playerName}" Dimension` });
      const hpRes = await dispatchCommand('rcon', { command: `data get entity "${playerName}" Health` });
      const xpRes = await dispatchCommand('rcon', { command: `xp query "${playerName}" levels` });
      const deathRes = await dispatchCommand('rcon', { command: `data get entity "${playerName}" LastDeathLocation` });

      const posMatches = posRes.match(/[-+]?[0-9]*\.?[0-9]+/g);
      const parsedPos = posMatches && posMatches.length >= 3 
        ? `X: ${Math.round(parseFloat(posMatches[0]))}, Y: ${Math.round(parseFloat(posMatches[1]))}, Z: ${Math.round(parseFloat(posMatches[2]))}`
        : 'Unknown';

      const parsedDim = dimRes.includes('the_nether') ? 'The Nether' 
        : dimRes.includes('the_end') ? 'The End' 
        : 'Overworld';

      const hpMatch = hpRes.match(/[0-9.]+/);
      const parsedHp = hpMatch ? `${Math.round(parseFloat(hpMatch[0]))} / 20` : 'Unknown';

      const xpMatch = xpRes.match(/has (\d+) experience/i) || xpRes.match(/(\d+)/);
      const parsedXp = xpMatch ? xpMatch[1] : '0';

      let deathPos = '';
      let deathDim = '';
      if (deathRes && !deathRes.includes('No data found')) {
        const deathMatches = deathRes.match(/[-+]?\d+/g);
        if (deathMatches && deathMatches.length >= 3) {
          const numbers = deathMatches.map(Number).filter(n => !isNaN(n));
          const coords = numbers.length > 3 ? numbers.slice(1, 4) : numbers.slice(0, 3);
          deathPos = `${coords[0]} ${coords[1]} ${coords[2]}`;
        }
        deathDim = deathRes.includes('the_nether') ? 'minecraft:the_nether'
          : deathRes.includes('the_end') ? 'minecraft:the_end'
          : 'minecraft:overworld';
      }

      setPlayerStats({
        pos: parsedPos,
        dimension: parsedDim,
        health: parsedHp,
        xp: parsedXp,
        deathPos: deathPos || undefined,
        deathDim: deathDim || undefined
      });
    } catch (e) {
      console.error(e);
      showToast('error', 'Failed to fetch player stats.');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPlayer) {
      fetchPlayerStats(selectedPlayer.name);
    } else {
      setPlayerStats(null);
    }
  }, [selectedPlayer]);

  const handleSpawnBot = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentStatus = status;
    if (!currentStatus || !phoneOnline || !currentStatus.serverRunning || botSpawning) return;

    const name = botName.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!name) {
      showToast('error', 'Please enter a valid bot name (letters/numbers/underscores only).');
      return;
    }

    const xVal = parseInt(botX);
    const yVal = parseInt(botY);
    const zVal = parseInt(botZ);
    if (isNaN(xVal) || isNaN(yVal) || isNaN(zVal)) {
      showToast('error', 'Coordinates must be valid numbers.');
      return;
    }

    const owner = currentStatus.playersOnline.find(p => p.name === botOwner);
    if (!owner) {
      showToast('error', 'Please select an online player to act as owner.');
      return;
    }

    setBotSpawning(true);
    try {
      await dispatchCommand('rcon', { command: `forceload add ${xVal} ${zVal}` });
      const spawnRes = await dispatchCommand('rcon', { 
        command: `dummy create "${name}" ${owner.uuid} world ${xVal} ${yVal} ${zVal}` 
      });
      await dispatchCommand('rcon', { command: `forceload remove ${xVal} ${zVal}` });

      if (spawnRes.includes('Created dummy') || spawnRes.includes('success') || !spawnRes.includes('failed')) {
        showToast('success', `AFK Bot AFK_${name} spawned successfully!`);
        setBotName('');
        setBotX('');
        setBotZ('');
      } else {
        showToast('error', spawnRes || 'Failed to spawn AFK bot.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to spawn AFK bot.');
    } finally {
      setBotSpawning(false);
    }
  };

  const handleDespawnBot = async (botName: string) => {
    try {
      await dispatchCommand('rcon', { command: `kick "${botName}"` });
      await dispatchCommand('rcon', { command: `kill @a[name="${botName}",limit=1]` });
      showToast('success', `Despawned AFK bot ${botName}`);
    } catch (err: any) {
      showToast('error', 'Failed to despawn bot.');
    }
  };

  // Heartbeat loop check (Phone offline if now - lastSeen > 30s)
  useEffect(() => {
    if (!status) {
      setPhoneOnline(false);
      return;
    }
    const checkOnline = () => {
      const lastSeenMillis = status.lastSeen?.toMillis() || 0;
      const diff = Date.now() - lastSeenMillis;
      setPhoneOnline(diff <= 30000);
    };

    checkOnline();
    const interval = setInterval(checkOnline, 5000);
    return () => clearInterval(interval);
  }, [status]);

  // Dispatch Command Utility
  const dispatchCommand = async (type: string, payload: Record<string, any> = {}) => {
    const actionKey = `${type}_${JSON.stringify(payload)}`;
    setPendingActions(prev => ({ ...prev, [actionKey]: true }));

    try {
      const cmdRef = await addDoc(collection(db, 'users', user.uid, 'dashboard_commands'), {
        type,
        payload,
        createdAt: Timestamp.now(),
        status: 'pending',
        result: null,
        errorMessage: null,
        secret: dashboardSecret
      });

      // Listen for command result
      return new Promise<string>((resolve, reject) => {
        const unsub = onSnapshot(cmdRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.status === 'done') {
              unsub();
              setPendingActions(prev => ({ ...prev, [actionKey]: false }));
              resolve(data.result || 'OK');
            } else if (data.status === 'failed') {
              unsub();
              setPendingActions(prev => ({ ...prev, [actionKey]: false }));
              reject(new Error(data.errorMessage || 'Command failed.'));
            }
          }
        });
      });
    } catch (e: any) {
      setPendingActions(prev => ({ ...prev, [actionKey]: false }));
      throw e;
    }
  };

  const handleAction = async (type: string, payload: Record<string, any> = {}, successMsg?: string) => {
    const actionKey = `${type}_${JSON.stringify(payload)}`;
    if (pendingActions[actionKey]) return;

    try {
      const res = await dispatchCommand(type, payload);
      if (successMsg) showToast('success', successMsg);
      return res;
    } catch (e: any) {
      showToast('error', e.message || 'Action failed.');
    }
  };

  const triggerConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmModal({
      show: true,
      title,
      description,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      }
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>
        Synchronizing Status...
      </div>
    );
  }

  // No status document yet
  if (!status) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ maxWidth: '500px' }}>
          <h2 className="auth-title" style={{ marginBottom: '16px' }}>No Server Found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
            Open **PocketCraft** on your phone, sign in with this Google account ({user.email}), and start hosting your Minecraft server to activate this web dashboard.
          </p>
          <button className="btn btn-secondary" onClick={onLogout}>Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="brand-section">
          <h1 className="brand-logo">PocketCraft</h1>
          <div className={`status-pill ${phoneOnline ? 'status-online' : 'status-offline'}`}>
            <span className="status-dot"></span>
            <span>{phoneOnline ? 'Online' : 'Phone Offline'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{user.email}</span>
          <button className="btn btn-secondary" onClick={onLogout}>Sign Out</button>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="dashboard-grid">
        {/* Server Control Card */}
        <div className="panel-card green-theme col-span-7">
          <h2 className="card-title"><ServerIcon /> Server Control</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Server Status</p>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: status.serverRunning ? 'var(--success-color)' : 'var(--text-secondary)' }}>
                {status.serverRunning ? 'Running' : 'Stopped'}
              </h3>
            </div>
            {status.serverRunning && (
              <>
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Uptime</p>
                  <h3 style={{ fontSize: '20px', fontWeight: '700' }}>
                    {formatUptime(status.uptimeSeconds)}
                  </h3>
                </div>
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>TPS</p>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: status.tps && status.tps < 18 ? 'var(--warning-color)' : 'var(--success-color)' }}>
                    {status.tps ? status.tps.toFixed(1) : '20.0'}
                  </h3>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {status.serverRunning ? (
              <>
                <button 
                  className="btn btn-danger" 
                  onClick={() => triggerConfirm(
                    'Stop Server', 
                    'Are you sure you want to stop the Minecraft server? This will disconnect all online players.',
                    () => handleAction('stop_server', {}, 'Server stop initiated.')
                  )}
                  disabled={!phoneOnline || pendingActions['stop_server_{}']}
                >
                  <PowerIcon /> {pendingActions['stop_server_{}'] ? 'Stopping...' : 'Stop Server'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ background: '#d97706', color: '#fff', borderColor: '#d97706' }}
                  onClick={() => triggerConfirm(
                    'Restart Server', 
                    'Are you sure you want to restart the Minecraft server? This will temporarily disconnect all online players.',
                    () => handleAction('restart_server', {}, 'Server restart initiated.')
                  )}
                  disabled={!phoneOnline || pendingActions['restart_server_{}']}
                >
                  <RefreshCwIcon /> {pendingActions['restart_server_{}'] ? 'Restarting...' : 'Restart Server'}
                </button>
              </>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => handleAction('start_server', {}, 'Server start initiated.')}
                disabled={!phoneOnline || pendingActions['start_server_{}']}
              >
                <PowerIcon /> {pendingActions['start_server_{}'] ? 'Starting...' : 'Start Server'}
              </button>
            )}
          </div>
        </div>

        {/* AFK Helper Card */}
        {(() => {
          const activeBots = status.playersOnline.filter(p => p.name.startsWith('AFK_'));
          const normalPlayers = status.playersOnline.filter(p => !p.name.startsWith('AFK_'));
          
          return (
            <>
              <div className="panel-card col-span-5">
                <h2 className="card-title"><BotIcon /> AFK Bots Manager</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                  Spawn persistent dummy players to keep chunks loaded and farm systems active.
                </p>

                {/* Form to spawn a new AFK bot */}
                <form onSubmit={handleSpawnBot} className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.15)', padding: '14px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--neutral-border)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Spawn AFK Bot</span>
                  
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Bot Name (e.g. IronFarm)" 
                    value={botName}
                    onChange={(e) => setBotName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    disabled={botSpawning || !phoneOnline || !status.serverRunning}
                    required
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  />

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="X" 
                      value={botX}
                      onChange={(e) => setBotX(e.target.value.replace(/[^0-9-]/g, ''))}
                      disabled={botSpawning || !phoneOnline || !status.serverRunning}
                      required
                      style={{ padding: '8px', fontSize: '13px', flex: 1, textAlign: 'center' }}
                    />
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Y" 
                      value={botY}
                      onChange={(e) => setBotY(e.target.value.replace(/[^0-9-]/g, ''))}
                      disabled={botSpawning || !phoneOnline || !status.serverRunning}
                      required
                      style={{ padding: '8px', fontSize: '13px', flex: 1, textAlign: 'center' }}
                    />
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Z" 
                      value={botZ}
                      onChange={(e) => setBotZ(e.target.value.replace(/[^0-9-]/g, ''))}
                      disabled={botSpawning || !phoneOnline || !status.serverRunning}
                      required
                      style={{ padding: '8px', fontSize: '13px', flex: 1, textAlign: 'center' }}
                    />
                  </div>

                  <select 
                    className="form-control" 
                    value={botOwner}
                    onChange={(e) => setBotOwner(e.target.value)}
                    disabled={botSpawning || !phoneOnline || !status.serverRunning}
                    required
                    style={{ padding: '8px', fontSize: '13px', background: '#06070a' }}
                  >
                    <option value="" disabled>Select Owner (Online Player)...</option>
                    {normalPlayers.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={botSpawning || !phoneOnline || !status.serverRunning || !botOwner}
                    style={{ padding: '10px', fontSize: '13px' }}
                  >
                    {botSpawning ? 'Spawning Bot...' : 'Spawn Bot'}
                  </button>
                </form>

                {/* List of active AFK bots */}
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Active AFK Bots ({activeBots.length})</span>
                  {activeBots.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                      No active bots.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                      {activeBots.map(bot => (
                        <div key={bot.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--neutral-border)' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{bot.name}</span>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '4px 8px', fontSize: '11px', boxShadow: 'none' }}
                            onClick={() => handleDespawnBot(bot.name)}
                            disabled={!phoneOnline || !status.serverRunning}
                          >
                            Despawn
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Players Online Card */}
              <div className="panel-card col-span-6">
                <h2 className="card-title"><UsersIcon /> Players Online ({normalPlayers.length})</h2>
                <div className="player-list">
                  {normalPlayers.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                      No players currently connected.
                    </div>
                  ) : (
                    normalPlayers.map(p => (
                      <div key={p.uuid || p.name} className="player-item">
                        <div className="player-name-wrapper" style={{ cursor: 'pointer' }} onClick={() => setSelectedPlayer(p)}>
                          <span className="player-name">{p.name}</span>
                          <span className={`player-badge ${p.name.startsWith('.') ? 'badge-bedrock' : 'badge-java'}`}>
                            {p.name.startsWith('.') ? 'Bedrock' : 'Java'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => handleAction('kick', { playerName: p.name }, `Kicked player ${p.name}`)}
                            disabled={!phoneOnline || !status.serverRunning}
                          >
                            Kick
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => triggerConfirm(
                              'Ban Player',
                              `Are you sure you want to permanently ban player ${p.name} from the server?`,
                              () => handleAction('ban', { playerName: p.name }, `Banned player ${p.name}`)
                            )}
                            disabled={!phoneOnline || !status.serverRunning}
                          >
                            Ban
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {/* Whitelist Card */}
        <WhitelistCardComponent 
          whitelist={status.whitelist} 
          phoneOnline={phoneOnline} 
          serverRunning={status.serverRunning}
          onDispatch={dispatchCommand}
        />

        {/* Console Command Card */}
        <ConsoleCardComponent 
          phoneOnline={phoneOnline} 
          serverRunning={status.serverRunning}
          onDispatch={dispatchCommand}
        />

        {/* Custom Subdomain Card */}
        <SubdomainCardComponent 
          currentSubdomain={status.subdomain}
          proUser={proUser}
          phoneOnline={phoneOnline}
          onDispatch={dispatchCommand}
          showToast={showToast}
        />
      </div>

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">{confirmModal.title}</h3>
            <p className="modal-desc">{confirmModal.description}</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmModal.onConfirm}>Confirm Action</button>
            </div>
          </div>
        </div>
      )}

      {/* Player Profile Modal */}
      {selectedPlayer && (
        <div className="modal-overlay" onClick={() => setSelectedPlayer(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Player Profile</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setSelectedPlayer(null)}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '18px' }}>
              <img 
                src={
                  selectedPlayer.name.startsWith('.')
                    ? `https://minotar.net/helm/Steve/100.png`
                    : `https://crafatar.com/renders/body/${selectedPlayer.uuid || selectedPlayer.name}?size=120&overlay`
                } 
                alt={selectedPlayer.name}
                style={{ height: '120px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://minotar.net/armor/body/${selectedPlayer.name}/120.png`;
                }}
              />
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>{selectedPlayer.name}</h4>
                <span className={`player-badge ${selectedPlayer.name.startsWith('.') ? 'badge-bedrock' : 'badge-java'}`} style={{ fontSize: '11px', padding: '4px 8px' }}>
                  {selectedPlayer.name.startsWith('.') ? 'Bedrock Edition' : 'Java Edition'}
                </span>
              </div>
            </div>

            {/* Real-time Stats scanner */}
            {selectedPlayer && (
              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Player Stats</label>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 8px', fontSize: '10px', boxShadow: 'none' }}
                    onClick={() => fetchPlayerStats(selectedPlayer.name)}
                    disabled={statsLoading}
                  >
                    Refresh Stats
                  </button>
                </div>
                
                {statsLoading ? (
                  <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Scanning player data...
                  </div>
                ) : playerStats ? (
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '14px', borderRadius: '12px', border: '1px solid var(--neutral-border)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Location:</span>
                      <span style={{ fontWeight: 'bold' }}>{playerStats.pos}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Dimension:</span>
                      <span style={{ fontWeight: 'bold' }}>{playerStats.dimension}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Health:</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>❤ {playerStats.health}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>XP Levels:</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>✨ {playerStats.xp}</span>
                    </div>
                    {playerStats.deathPos && (
                      <div style={{ borderTop: '1px solid var(--neutral-border)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Last Death:</span>
                        <button 
                          className="btn btn-warning" 
                          style={{ padding: '4px 8px', fontSize: '10px', boxShadow: 'none' }}
                          onClick={() => handleAction('rcon', { command: `execute in ${playerStats.deathDim} run tp "${selectedPlayer.name}" ${playerStats.deathPos}` }, `Teleported ${selectedPlayer.name} to last death location.`)}
                          disabled={!phoneOnline || !status.serverRunning}
                        >
                          TP to Death Location
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    No stats cached. Refresh to scan.
                  </div>
                )}
              </div>
            )}

            <div className="form-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Player UUID</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  value={selectedPlayer.uuid || 'N/A'} 
                  readOnly 
                  style={{ fontSize: '12px', padding: '8px 12px', flex: 1, fontFamily: 'var(--font-mono)' }}
                />
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                  onClick={() => {
                    navigator.clipboard.writeText(selectedPlayer.uuid || '');
                    showToast('success', 'UUID copied to clipboard!');
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Quick Admin Actions</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '12px', padding: '10px' }}
                  onClick={() => handleAction('rcon', { command: `op "${selectedPlayer.name}"` }, `OP granted to ${selectedPlayer.name}`)}
                  disabled={!phoneOnline || !status.serverRunning}
                >
                  Make OP
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '12px', padding: '10px' }}
                  onClick={() => handleAction('rcon', { command: `deop "${selectedPlayer.name}"` }, `OP revoked from ${selectedPlayer.name}`)}
                  disabled={!phoneOnline || !status.serverRunning}
                >
                  Remove OP
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '12px', padding: '10px' }}
                  onClick={() => handleAction('rcon', { command: `gamemode creative "${selectedPlayer.name}"` }, `Creative mode set for ${selectedPlayer.name}`)}
                  disabled={!phoneOnline || !status.serverRunning}
                >
                  Creative Mode
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '12px', padding: '10px' }}
                  onClick={() => handleAction('rcon', { command: `gamemode survival "${selectedPlayer.name}"` }, `Survival mode set for ${selectedPlayer.name}`)}
                  disabled={!phoneOnline || !status.serverRunning}
                >
                  Survival Mode
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ fontSize: '12px', padding: '10px', gridColumn: 'span 2' }}
                  onClick={() => {
                    setSelectedPlayer(null);
                    triggerConfirm(
                      'Ban Player',
                      `Are you sure you want to permanently ban player ${selectedPlayer.name} from the server?`,
                      () => handleAction('ban', { playerName: selectedPlayer.name }, `Banned player ${selectedPlayer.name}`)
                    );
                  }}
                  disabled={!phoneOnline || !status.serverRunning}
                >
                  Ban Player
                </button>
              </div>
            </div>

            {/* Teleportation Controls */}
            <div style={{ textAlign: 'left', marginTop: '18px', paddingTop: '18px', borderTop: '1px solid var(--neutral-border)' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Teleport Commands</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '12px', padding: '10px' }}
                  onClick={() => handleAction('rcon', { command: `tp "${selectedPlayer.name}" 0 80 0` }, `Teleported ${selectedPlayer.name} to spawn.`)}
                  disabled={!phoneOnline || !status.serverRunning}
                >
                  Teleport to Spawn
                </button>
                
                {/* TP to Player dropdown */}
                {status.playersOnline.filter(p => p.name !== selectedPlayer.name).length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <select 
                      id="tpTargetPlayer" 
                      className="form-control" 
                      style={{ flex: 1, padding: '8px', fontSize: '12px', background: '#06070a' }}
                      defaultValue=""
                    >
                      <option value="" disabled>Select target...</option>
                      {status.playersOnline
                        .filter(p => p.name !== selectedPlayer.name)
                        .map(p => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                    </select>
                    <button 
                      className="btn btn-secondary" 
                      style={{ fontSize: '12px', padding: '8px 12px' }}
                      onClick={() => {
                        const sel = document.getElementById('tpTargetPlayer') as HTMLSelectElement;
                        if (sel.value) {
                          handleAction('rcon', { command: `tp "${selectedPlayer.name}" "${sel.value}"` }, `Teleported ${selectedPlayer.name} to ${sel.value}`);
                        }
                      }}
                      disabled={!phoneOnline || !status.serverRunning}
                    >
                      TP to Player
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Console Card Sub-component ---
function ConsoleCardComponent({ 
  phoneOnline, 
  serverRunning, 
  onDispatch 
}: { 
  phoneOnline: boolean; 
  serverRunning: boolean; 
  onDispatch: (type: string, payload: Record<string, any>) => Promise<string>; 
}) {
  const [lines, setLines] = useState<ConsoleLine[]>([
    { type: 'output', text: 'Welcome to PocketCraft Command Prompt.' },
    { type: 'output', text: 'Commands are sent via RCON client link.' }
  ]);
  const [cmdInput, setCmdInput] = useState('');
  const [running, setRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const runCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCmd = cmdInput.trim();
    if (!cleanCmd || running || !phoneOnline || !serverRunning) return;

    setRunning(true);
    setLines(prev => [...prev, { type: 'input', text: `> ${cleanCmd}` }]);
    setCmdInput('');

    try {
      const response = await onDispatch('rcon', { command: cleanCmd });
      setLines(prev => [...prev, { type: 'output', text: response }]);
    } catch (err: any) {
      setLines(prev => [...prev, { type: 'error', text: err.message || 'RCON connection failure.' }]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="panel-card col-span-7">
      <h2 className="card-title"><ConsoleIcon /> RCON Console Command</h2>
      <div className="console-wrapper">
        <div className="console-scrollback" ref={scrollRef}>
          {lines.map((l, i) => (
            <div key={i} className={`console-line ${l.type}`}>
              {l.text}
            </div>
          ))}
          {running && <div className="console-line output" style={{ opacity: 0.5 }}>Processing command...</div>}
        </div>
        <form className="console-input-row" onSubmit={runCommand}>
          <input 
            type="text" 
            placeholder={!serverRunning ? "Start server to enter commands..." : "Enter command (e.g. op username, time set day)..."}
            value={cmdInput} 
            onChange={(e) => setCmdInput(e.target.value)}
            disabled={!phoneOnline || !serverRunning || running}
          />
          <button type="submit" disabled={!phoneOnline || !serverRunning || running || !cmdInput.trim()}>
            Run
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Whitelist Card Sub-component ---
function WhitelistCardComponent({
  whitelist,
  phoneOnline,
  serverRunning,
  onDispatch
}: {
  whitelist: string[];
  phoneOnline: boolean;
  serverRunning: boolean;
  onDispatch: (type: string, payload: Record<string, any>) => Promise<string>;
}) {
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = playerNameInput.trim();
    if (!name || submitting || !phoneOnline || !serverRunning) return;

    setSubmitting(true);
    try {
      await onDispatch('whitelist_add', { playerName: name });
      setPlayerNameInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (name: string) => {
    if (submitting || !phoneOnline || !serverRunning) return;
    setSubmitting(true);
    try {
      await onDispatch('whitelist_remove', { playerName: name });
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel-card col-span-6">
      <h2 className="card-title"><ShieldIcon /> Whitelist Manager ({whitelist.length})</h2>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Player username..." 
          value={playerNameInput}
          onChange={(e) => setPlayerNameInput(e.target.value)}
          disabled={!phoneOnline || !serverRunning || submitting}
          style={{ flex: 1, padding: '10px 14px' }}
        />
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!phoneOnline || !serverRunning || submitting || !playerNameInput.trim()}
        >
          {submitting ? '...' : 'Add'}
        </button>
      </form>
      <div className="player-list" style={{ maxHeight: '180px' }}>
        {whitelist.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '15px' }}>
            Whitelist is empty.
          </div>
        ) : (
          whitelist.map(name => (
            <div key={name} className="player-item" style={{ padding: '8px 14px' }}>
              <span className="player-name">{name}</span>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '11px' }}
                onClick={() => handleRemove(name)}
                disabled={!phoneOnline || !serverRunning || submitting}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- Custom IP Card Sub-component ---
function SubdomainCardComponent({
  currentSubdomain,
  proUser,
  phoneOnline,
  onDispatch,
  showToast
}: {
  currentSubdomain: string | null;
  proUser: boolean;
  phoneOnline: boolean;
  onDispatch: (type: string, payload: Record<string, any>) => Promise<string>;
  showToast: (type: 'success' | 'error', text: string) => void;
}) {
  const [subdomainInput, setSubdomainInput] = useState(currentSubdomain || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSubdomainInput(currentSubdomain || '');
  }, [currentSubdomain]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proUser || saving || !phoneOnline) return;

    const val = subdomainInput.trim().toLowerCase();
    if (!/^[a-z0-9-]{3,32}$/.test(val)) {
      showToast('error', 'Must be 3-32 characters using lowercase letters, numbers, or hyphens.');
      return;
    }

    setSaving(true);
    try {
      await onDispatch('set_subdomain', { subdomain: val });
      showToast('success', 'Custom IP updated! Restart server to apply.');
    } catch (e: any) {
      showToast('error', e.message || 'Could not update Custom IP.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel-card col-span-5">
      <h2 className="card-title"><GlobeIcon /> Custom IP</h2>
      
      {!proUser ? (
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Custom IP customization requires a Pro or Member tier.
          </p>
          <div className="status-pill status-offline" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '11px' }}>
            🔒 Feature Locked
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="form-group">
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Customize your relay routing IP (e.g. `yourname.pocketcraft.online`).
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="custom-ip" 
              value={subdomainInput}
              onChange={(e) => setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              disabled={saving || !phoneOnline}
              style={{ flex: 1 }}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving || !phoneOnline || subdomainInput.trim() === (currentSubdomain || '')}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          <p className="helper-text">
            Current Custom IP: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)' }}>
              {currentSubdomain ? `${currentSubdomain}.pocketcraft.online` : 'None'}
            </code>
          </p>
        </form>
      )}
    </div>
  );
}

// --- Helper Functions ---
function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default App;
