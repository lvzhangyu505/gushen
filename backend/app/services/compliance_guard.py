from __future__ import annotations

import json
from typing import Any

from pydantic import BaseModel


FORBIDDEN_EXPRESSIONS = [
    "建议买入",
    "建议卖出",
    "必须买入",
    "必须卖出",
    "立即买入",
    "立即卖出",
    "仓位",
    "目标价",
    "保证收益",
    " guaranteed profit",
    "risk-free",
    "无风险",
    "一定上涨",
    "稳赚",
]


class ComplianceViolation(ValueError):
    def __init__(self, violations: list[str]) -> None:
        self.violations = violations
        super().__init__("Detected forbidden investment expressions: " + ", ".join(violations))


class ComplianceGuard:
    def validate(self, payload: BaseModel | dict[str, Any] | list[Any] | str) -> None:
        text = self._to_text(payload)
        violations = [expression for expression in FORBIDDEN_EXPRESSIONS if expression in text]
        if violations:
            raise ComplianceViolation(violations)

    def _to_text(self, payload: BaseModel | dict[str, Any] | list[Any] | str) -> str:
        if isinstance(payload, BaseModel):
            return json.dumps(payload.model_dump(mode="json"), ensure_ascii=False)
        if isinstance(payload, str):
            return payload
        if isinstance(payload, dict):
            return " ".join(self._to_text(value) for value in payload.values())
        if isinstance(payload, list):
            return " ".join(self._to_text(item) for item in payload)
        return str(payload)
