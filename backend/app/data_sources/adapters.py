from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.schemas.analysis import DocumentCreate, EvidenceLevel


@dataclass(frozen=True)
class DataSourceStatus:
    name: str
    authorization_status: str
    endpoint_type: str
    refresh_frequency: str
    terms_notes: str
    status: str = "ok"


class DataSourceAdapter(ABC):
    name: str

    @abstractmethod
    def health(self) -> DataSourceStatus:
        raise NotImplementedError

    @abstractmethod
    def fetch_documents(self, stock_code: str) -> list[DocumentCreate]:
        raise NotImplementedError


class MockPublicDataAdapter(DataSourceAdapter):
    name = "mock_public_data"

    def health(self) -> DataSourceStatus:
        return DataSourceStatus(
            name=self.name,
            authorization_status="mock only",
            endpoint_type="local fixture",
            refresh_frequency="manual",
            terms_notes="用于本地 MVP 验证，不代表真实数据源授权。",
        )

    def fetch_documents(self, stock_code: str) -> list[DocumentCreate]:
        return [
            DocumentCreate(
                stock_code=stock_code,
                title=f"{stock_code} Mock 公告摘要",
                source_type="公告摘要",
                source_name="Mock Public Fixture",
                evidence_level=EvidenceLevel.C,
                content="本地 Mock 文档用于验证 RAG 与证据链流程。真实结论需要公开公告、财报、政策和授权新闻交叉验证。",
                published_at="2026-07-03",
            )
        ]


def available_adapters() -> list[DataSourceAdapter]:
    return [MockPublicDataAdapter()]

