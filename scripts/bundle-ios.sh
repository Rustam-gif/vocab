#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Detect entry file
ENTRY="index.ts"
if [[ -f "index.js" ]]; then
  ENTRY="index.js"
elif [[ -f "index.tsx" ]]; then
  ENTRY="index.tsx"
fi

echo "Bundling iOS JS from $ENTRY -> ios/main.jsbundle"
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file "$ENTRY" \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios

echo "Bundle written to ios/main.jsbundle"

