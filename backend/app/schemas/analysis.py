from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Literal, Optional, Union
from uuid import uuid4

from pydantic import BaseModel, Field


DISCLAIMER = "本系统仅用于个人研究辅助，不构成确定性投资承诺。"


class SignalDirection(str, Enum):
    positive = "positive"
    neutral = "neutral"
    cautious = "cautious"
    negative = "negative"


class ResearchGrade(str, Enum):
    worth_attention = "值得关注"
    keep_observing = "继续观察"
    high_risk = "风险偏高"
    not_suggested = "暂不建议介入"
    wait_for_confirmation = "等待确认信号"


class EvidenceLevel(str, Enum):
    S = "S"
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class TaskStatus(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    partial = "partial"
    failed = "failed"


class EvidenceItem(BaseModel):
    title: str
    source_type: str
    source_name: str
    evidence_level: EvidenceLevel = EvidenceLevel.D
    summary: str
    relevance: str
    published_at: str
    url: Optional[str] = None


class ExpertSignal(BaseModel):
    agent_name: str
    signal_direction: SignalDirection
    confidence: float = Field(ge=0, le=1)
    weight: float = Field(ge=0, le=1)
    time_horizon: str
    analysis_period: str
    core_evidence: list[EvidenceItem]
    negative_evidence: list[EvidenceItem]
    risk_flags: list[str]
    missing_info: list[str]
    assumptions: list[str]
    conclusion_summary: str


class AgentRunStatus(BaseModel):
    agent_name: str
    status: TaskStatus = TaskStatus.pending
    signal_direction: Optional[SignalDirection] = None
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class DivergenceItem(BaseModel):
    topic: str
    positive_view: str
    cautious_view: str
    interpretation: str
    related_agents: list[str]


class OrchestratorResult(BaseModel):
    stock_code: str
    time_horizon: str
    research_grade: ResearchGrade
    overall_direction: SignalDirection
    convergence_score: float = Field(ge=0, le=1)
    divergence_score: float = Field(ge=0, le=1)
    core_evidence: list[EvidenceItem]
    counter_evidence: list[EvidenceItem]
    key_supporting_points: list[str]
    key_risk_points: list[str]
    key_divergences: list[DivergenceItem]
    missing_info: list[str]
    next_observation_points: list[str]
    agent_signals: list[ExpertSignal]
    disclaimer: str = DISCLAIMER


class AnalysisTaskCreate(BaseModel):
    stock_code: str = Field(min_length=1, max_length=20)
    time_horizon: str = Field(default="中期", min_length=1, max_length=20)


class AnalysisTask(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    stock_code: str
    time_horizon: str
    status: TaskStatus
    agent_states: list[AgentRunStatus] = Field(default_factory=list)
    result: Optional[OrchestratorResult] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WatchlistItemCreate(BaseModel):
    stock_code: str = Field(min_length=1, max_length=20)
    stock_name: str = Field(min_length=1, max_length=80)
    industry: str = Field(default="未分类", max_length=80)
    notes: str = Field(default="", max_length=500)


class WatchlistItem(WatchlistItemCreate):
    id: str = Field(default_factory=lambda: str(uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DocumentCreate(BaseModel):
    stock_code: Optional[str] = Field(default=None, max_length=20)
    title: str = Field(min_length=1, max_length=200)
    source_type: str = Field(min_length=1, max_length=80)
    source_name: str = Field(min_length=1, max_length=120)
    evidence_level: EvidenceLevel = EvidenceLevel.C
    content: str = Field(min_length=1)
    published_at: str = Field(default="")
    url: Optional[str] = None


class Document(DocumentCreate):
    id: str = Field(default_factory=lambda: str(uuid4()))
    summary: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DocumentChunk(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    document_id: str
    stock_code: Optional[str] = None
    chunk_index: int
    content: str
    embedding: list[float] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MarketSnapshotCreate(BaseModel):
    stock_code: str = Field(min_length=1, max_length=20)
    trade_date: str
    close: float = Field(gt=0)
    volume: float = Field(ge=0)
    open: Optional[float] = Field(default=None, gt=0)
    high: Optional[float] = Field(default=None, gt=0)
    low: Optional[float] = Field(default=None, gt=0)
    fund_flow: Optional[float] = None


class MarketSnapshot(MarketSnapshotCreate):
    id: str = Field(default_factory=lambda: str(uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TriggerAlertCreate(BaseModel):
    stock_code: str = Field(min_length=1, max_length=20)
    title: str = Field(min_length=1, max_length=200)
    risk_level: str = Field(default="中", max_length=20)
    description: str = Field(min_length=1, max_length=1000)


class TriggerAlert(TriggerAlertCreate):
    id: str = Field(default_factory=lambda: str(uuid4()))
    status: str = "unread"
    disclaimer: str = DISCLAIMER
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ResearchReviewCreate(BaseModel):
    task_id: str
    observation_period: str = Field(default="中期", max_length=20)
    follow_up_summary: str = Field(min_length=1, max_length=1200)
    invalidation_triggered: bool = False
    review_result: str = Field(default="待继续观察", max_length=80)


class ResearchReview(ResearchReviewCreate):
    id: str = Field(default_factory=lambda: str(uuid4()))
    disclaimer: str = DISCLAIMER
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DailyReport(BaseModel):
    report_date: str
    watchlist_count: int
    alerts: list[TriggerAlert]
    research_tasks: list[AnalysisTask]
    summary: list[str]
    disclaimer: str = DISCLAIMER


class SystemHealth(BaseModel):
    status: str
    database: str
    data_sources: str
    agents: str
    compliance_guard: str
    disclaimer: str = DISCLAIMER


class WeeklyReviewReport(BaseModel):
    week_start: str
    week_end: str
    total_tasks: int
    reviewed_count: int
    agent_quality: dict[str, dict[str, Union[float, int]]]
    summary: list[str]
    disclaimer: str = DISCLAIMER


TaskStatusValue = Literal["pending", "running", "completed", "partial", "failed"]
