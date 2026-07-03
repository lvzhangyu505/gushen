#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DISCLAIMER="本系统仅用于个人研究辅助，不构成确定性投资承诺。"

echo "Checking frontend disclaimer display..."
if ! rg -q "$DISCLAIMER|result\\.disclaimer" "$ROOT_DIR/frontend/app" "$ROOT_DIR/frontend/lib"; then
  echo "Frontend disclaimer check failed."
  exit 1
fi

echo "Frontend disclaimer check passed."

