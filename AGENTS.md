# AGENTS.md

## Project

This repository is an AI-assisted stock research platform for personal use. It collects lawful market information, public disclosures, financial news, policy updates, industry information, financial data, research-summary data, and watchlist-related evidence, then uses AI to produce structured research notes, risk reminders, and daily research reports.

## Non-Negotiable Compliance Rules

- Do not build brokerage account integrations.
- Do not build trading APIs, order placement, order cancellation, automatic trading, portfolio custody, fund transfer, or account synchronization.
- Do not output deterministic instructions such as "must buy", "must sell", "guaranteed profit", or "risk-free".
- All investment suggestions must be framed as research assistance, not final investment commitments.
- Every suggestion must include evidence, source references, analysis basis, and risk notes.
- If evidence is insufficient, return: "信息不足，无法形成建议。"
- Every suggestion, report, and stock research card page must display: "本系统仅用于个人研究辅助，不构成确定性投资承诺。"
- Use only lawful public APIs, licensed data sources, user-provided files, or manually entered information. Do not bypass paywalls or scrape restricted systems.

## Technology Stack

- Frontend: Next.js, TypeScript, Tailwind CSS.
- Backend: Python, FastAPI, Pydantic, SQLAlchemy or SQLModel.
- Database: PostgreSQL with pgvector.
- Scheduled jobs: APScheduler for MVP; Celery may be introduced when distributed workers are needed.
- AI: RAG architecture with a provider-neutral LLM and embedding interface.

## Architecture Guidelines

- Keep frontend and backend separate under `frontend/` and `backend/`.
- Backend modules should be grouped by responsibility: `api/`, `services/`, `agents/`, `models/`, `schemas/`, `tasks/`, `data_sources/`.
- Persist original source metadata before any AI analysis.
- Store retrieved evidence separately from model-generated analysis.
- Separate response fields into `facts`, `analysis`, `suggestions`, `risks`, `evidence`, and `disclaimer`.
- Suggestion labels are limited to: `值得关注`, `继续观察`, `风险偏高`, `暂不建议介入`, `等待确认信号`.

## Coding Rules

- Prefer explicit schemas and enums over free-form strings for document types, risk types, suggestion labels, and report types.
- Validate that suggestion responses always include at least one evidence item unless returning "信息不足，无法形成建议。"
- Treat AI output as untrusted until it passes compliance checks.
- Do not hard-code one data vendor into core business logic; implement data-source adapters.
- Do not store secrets in code. Use `.env` files locally and environment variables in deployment.

## Testing Requirements

- Add backend tests for watchlist CRUD, evidence requirements, suggestion enum validation, risk alert creation, and report generation.
- Add RAG tests verifying that unsupported suggestions are rejected.
- Add frontend tests or checks verifying disclaimer display on suggestions, daily reports, and stock research cards.
- Add compliance tests scanning for forbidden trading/account capabilities before release.

## Documentation

- Keep `docs/PRD.md`, `docs/database.md`, `docs/api.md`, and `docs/ai-agents.md` updated when behavior changes.
- Document every new data source with its authorization status, endpoint type, refresh frequency, and terms-of-use notes.
