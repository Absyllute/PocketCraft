#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ZIP_NAME="pocketcraft-deploy.zip"

cd "$PROJECT_ROOT"

echo "Building production assets..."
npm run build

echo "Creating $ZIP_NAME in Hostinger upload format..."
rm -f "$ZIP_NAME"

# Create a temporary directory for zipping the dashboard compiled assets
rm -rf dashboard_deploy
mkdir -p dashboard_deploy
cp -r dashboard/dist/* dashboard_deploy/

# Temporarily swap dashboard source and built directories for zipping
mv dashboard dashboard_src
mv dashboard_deploy dashboard

# Create the deployment ZIP containing both the website and dashboard
zip -r "$ZIP_NAME" package.json package-lock.json index.html vite.config.ts src server.ts public dist dashboard > /dev/null

# Restore source dashboard directory
rm -rf dashboard
mv dashboard_src dashboard

echo "Done: $PROJECT_ROOT/$ZIP_NAME"
echo "Package includes: package.json, package-lock.json, index.html, vite.config.ts, src/, server.ts, public/, dist/, dashboard/"