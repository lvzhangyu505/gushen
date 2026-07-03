from __future__ import annotations

from app.core.config import settings


class ModelRouter:
    def select_model(self, task_type: str) -> str:
        if task_type in {"technical", "fund_flow", "market_snapshot"}:
            return "NO_LLM"
        if task_type in {"financial_extract", "industry_extract"}:
            return settings.model_light
        if task_type in {"sentiment", "macro", "rag_summary"}:
            return settings.model_long_context
        if task_type in {"risk", "orchestrator", "compliance"}:
            return settings.model_reasoning
        return settings.model_light


model_router = ModelRouter()

