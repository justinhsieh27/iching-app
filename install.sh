#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "==> Checking required tools..."

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is not installed."
  echo "Please install Node.js 18 or newer from https://nodejs.org/ and run this script again."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed."
  echo "Please install npm, then run this script again."
  exit 1
fi

NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])")"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Error: Node.js 18 or newer is required. Current version: $(node -v)"
  exit 1
fi

echo "==> Installing dependencies..."
npm install

echo "==> Verifying production build..."
npm run build

echo
echo "Install complete."
echo "Start the app with:"
echo "  ./run.sh"

