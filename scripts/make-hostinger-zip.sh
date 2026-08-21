#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ZIP_NAME="pocketcraft-deploy.zip"

cd "$PROJECT_ROOT"

echo "Building main website production assets..."
npm run build

echo "Building web dashboard production assets..."
cd dashboard_src
npm install
npm run build
cd ..

echo "Updating compiled dashboard directory..."
rm -rf dashboard
mkdir -p dashboard
cp -r dashboard_src/dist/* dashboard/

echo "Creating $ZIP_NAME in Hostinger upload format (excluding heavy APK binaries)..."
rm -f "$ZIP_NAME"
zip -r "$ZIP_NAME" package.json package-lock.json index.html vite.config.ts src server.ts public dist dashboard -x "*.apk" > /dev/null

echo "Done: $PROJECT_ROOT/$ZIP_NAME"
echo "Package size: $(du -sh "$ZIP_NAME" | cut -f1)"