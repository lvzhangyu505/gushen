#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FORBIDDEN_REGEX='券商账户|自动交易|自动下单|下单|撤单|资金托管|保证收益|稳赚|无风险|必须买入|必须卖出|建议买入|建议卖出|目标价|仓位'

echo "Scanning for forbidden trading/account capabilities..."
if rg -n "$FORBIDDEN_REGEX" "$ROOT_DIR" \
  --glob '!docs/**' \
  --glob '!AGENTS.md' \
  --glob '!README.md' \
  --glob '!scripts/compliance_scan.sh' \
  --glob '!backend/app/services/compliance_guard.py' \
  --glob '!backend/tests/**' \
  --glob '!frontend/.next/**' \
  --glob '!frontend/node_modules/**' \
  --glob '!backend/.venv/**'; then
  echo "Compliance scan found terms that need review."
  exit 1
fi

echo "Compliance scan passed."
