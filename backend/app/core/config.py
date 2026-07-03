from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


DEFAULT_SQLITE_PATH = Path(__file__).resolve().parents[2] / ".data" / "gushen.sqlite3"


@dataclass(frozen=True)
class Settings:
    model_light: str = os.getenv("MODEL_LIGHT", "MOCK_LIGHT")
    model_long_context: str = os.getenv("MODEL_LONG_CONTEXT", "MOCK_LONG_CONTEXT")
    model_reasoning: str = os.getenv("MODEL_REASONING", "MOCK_REASONING")
    model_compliance: str = os.getenv("MODEL_COMPLIANCE", "MOCK_COMPLIANCE")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "MOCK_EMBEDDING")
    database_url: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")
    scheduler_enabled: bool = os.getenv("SCHEDULER_ENABLED", "true").lower() == "true"


settings = Settings()
