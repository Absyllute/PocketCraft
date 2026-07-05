import React from "react";

export function PlayStoreIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      {/* Left (Blue) */}
      <path d="M5 2.447L15 12L5 21.553C4.38 21.9 4 21.53 4 20.8V3.2C4 2.47 4.38 2.1 5 2.447Z" fill="#00A1F1" />
      {/* Top (Green) */}
      <path d="M15 12L5 2.447C5.62 2.1 6.88 2.82 7.5 3.174L17.5 8.874L15 12Z" fill="#60B230" />
      {/* Right (Red) */}
      <path d="M17.5 8.874L21.3 11.04c.93.53.93 1.39 0 1.92L17.5 15.126L15 12L17.5 8.874Z" fill="#EA4335" />
      {/* Bottom (Yellow) */}
      <path d="M15 12L17.5 15.126L7.5 20.826C6.88 21.18 5.62 21.9 5 21.553L15 12Z" fill="#FBBC05" />
    </svg>
  );
}
