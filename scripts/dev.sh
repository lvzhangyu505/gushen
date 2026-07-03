#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Backend: cd '$ROOT_DIR/backend' && uvicorn app.main:app --reload"
echo "Frontend: cd '$ROOT_DIR/frontend' && NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1 pnpm dev"

