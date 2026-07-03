from __future__ import annotations

import math
import threading
from datetime import datetime, timedelta, timezone
from typing import Optional, TypeVar

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Float, Integer, String, Text, create_engine, delete, select
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import DEFAULT_SQLITE_PATH, settings
from app.schemas.analysis import (
    AgentRunStatus,
    AnalysisTask,
    DailyReport,
    Document,
    DocumentChunk,
    DocumentCreate,
    MarketSnapshot,
    MarketSnapshotCreate,
    OrchestratorResult,
    ResearchReview,
    ResearchReviewCreate,
    SignalDirection,
    SystemHealth,
    TaskStatus,
    TaskStatusValue,
    TriggerAlert,
    TriggerAlertCreate,
    WatchlistItem,
    WatchlistItemCreate,
    WeeklyReviewReport,
)


T = TypeVar("T", bound=BaseModel)
Base = declarative_base()
_LOCK = threading.RLock()

if settings.database_url.startswith("sqlite:///"):
    DEFAULT_SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
    future=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class JsonRecord(Base):
    __tablename__ = "json_records"

    id = Column(String(80), primary_key=True)
    record_type = Column(String(60), nullable=False, index=True)
    stock_code = Column(String(20), nullable=True, index=True)
    task_id = Column(String(80), nullable=True, index=True)
    payload = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)


class ChunkRecord(Base):
    __tablename__ = "document_chunks"

    id = Column(String(80), primary_key=True)
    document_id = Column(String(80), nullable=False, index=True)
    stock_code = Column(String(20), nullable=True, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)


class MarketSnapshotRecord(Base):
    __tablename__ = "market_snapshots"

    id = Column(String(80), primary_key=True)
    stock_code = Column(String(20), nullable=False, index=True)
    trade_date = Column(String(20), nullable=False, index=True)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)
    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    fund_flow = Column(Float, nullable=True)
    payload = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


init_db()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _dump(model: BaseModel) -> str:
    return model.model_dump_json()


def _load(raw: str, model: type[T]) -> T:
    return model.model_validate_json(raw)


def _save_json(
    session: Session,
    record_type: str,
    model: BaseModel,
    stock_code: Optional[str] = None,
    task_id: Optional[str] = None,
    record_id: Optional[str] = None,
) -> None:
    now = _utcnow()
    model_id = record_id or getattr(model, "id")
    existing = session.get(JsonRecord, model_id)
    if existing is None:
        session.add(
            JsonRecord(
                id=model_id,
                record_type=record_type,
                stock_code=stock_code,
                task_id=task_id,
                payload=_dump(model),
                created_at=getattr(model, "created_at", now),
                updated_at=getattr(model, "updated_at", now),
            )
        )
    else:
        existing.record_type = record_type
        existing.stock_code = stock_code
        existing.task_id = task_id
        existing.payload = _dump(model)
        existing.updated_at = getattr(model, "updated_at", now)


def _list_json(record_type: str, model: type[T], stock_code: Optional[str] = None, task_id: Optional[str] = None) -> list[T]:
    with SessionLocal() as session:
        statement = select(JsonRecord).where(JsonRecord.record_type == record_type)
        if stock_code is not None:
            statement = statement.where(JsonRecord.stock_code == stock_code)
        if task_id is not None:
            statement = statement.where(JsonRecord.task_id == task_id)
        rows = session.execute(statement.order_by(JsonRecord.updated_at.desc())).scalars().all()
    return [_load(row.payload, model) for row in rows]


def reset_store() -> None:
    with _LOCK, SessionLocal() as session:
        session.execute(delete(JsonRecord))
        session.execute(delete(ChunkRecord))
        session.execute(delete(MarketSnapshotRecord))
        session.commit()


def create_task(stock_code: str, time_horizon: str, agent_names: Optional[list[str]] = None) -> AnalysisTask:
    agent_states = [AgentRunStatus(agent_name=name) for name in agent_names or []]
    task = AnalysisTask(stock_code=stock_code, time_horizon=time_horizon, status=TaskStatus.pending, agent_states=agent_states)
    save_task(task)
    return task


def save_task(task: AnalysisTask) -> AnalysisTask:
    with _LOCK, SessionLocal() as session:
        _save_json(session, "analysis_task", task, stock_code=task.stock_code, task_id=task.id)
        if task.result:
            _save_json(session, "orchestrator_result", task.result, stock_code=task.stock_code, task_id=task.id, record_id=f"{task.id}:orchestrator")
            for signal in task.result.agent_signals:
                signal_id = f"{task.id}:{signal.agent_name}"
                wrapped = signal.model_copy(update={"id": signal_id}) if hasattr(signal, "id") else signal
                session.merge(
                    JsonRecord(
                        id=signal_id,
                        record_type="expert_signal",
                        stock_code=task.stock_code,
                        task_id=task.id,
                        payload=wrapped.model_dump_json(),
                        created_at=task.created_at,
                        updated_at=task.updated_at,
                    )
                )
        session.commit()
    return task


def get_task(task_id: str) -> Optional[AnalysisTask]:
    with SessionLocal() as session:
        row = session.get(JsonRecord, task_id)
    return _load(row.payload, AnalysisTask) if row and row.record_type == "analysis_task" else None


def list_tasks() -> list[AnalysisTask]:
    return _list_json("analysis_task", AnalysisTask)


def update_task(
    task_id: str,
    status: TaskStatusValue,
    result: Optional[OrchestratorResult] = None,
    error_message: Optional[str] = None,
    agent_states: Optional[list[AgentRunStatus]] = None,
) -> AnalysisTask:
    task = get_task(task_id)
    if task is None:
        raise KeyError(f"analysis task not found: {task_id}")
    updated = task.model_copy(
        update={
            "status": TaskStatus(status),
            "result": result if result is not None else task.result,
            "error_message": error_message,
            "agent_states": agent_states if agent_states is not None else task.agent_states,
            "updated_at": _utcnow(),
        }
    )
    return save_task(updated)


def update_agent_state(
    task_id: str,
    agent_name: str,
    status: TaskStatusValue,
    signal_direction: Optional[str] = None,
    confidence: Optional[float] = None,
    error_message: Optional[str] = None,
) -> AnalysisTask:
    task = get_task(task_id)
    if task is None:
        raise KeyError(f"analysis task not found: {task_id}")
    states = list(task.agent_states)
    index = next((idx for idx, state in enumerate(states) if state.agent_name == agent_name), None)
    base = states[index] if index is not None else AgentRunStatus(agent_name=agent_name)
    now = _utcnow()
    started_at = base.started_at or (now if status == "running" else None)
    completed_at = now if status in {"completed", "partial", "failed"} else base.completed_at
    updated = base.model_copy(
        update={
            "status": TaskStatus(status),
            "signal_direction": SignalDirection(signal_direction) if signal_direction else None,
            "confidence": confidence,
            "error_message": error_message,
            "started_at": started_at,
            "completed_at": completed_at,
        }
    )
    if index is None:
        states.append(updated)
    else:
        states[index] = updated
    return update_task(task_id, status=task.status.value, agent_states=states)


def add_watchlist_item(payload: WatchlistItemCreate) -> WatchlistItem:
    existing = next((item for item in list_watchlist() if item.stock_code == payload.stock_code), None)
    item = existing.model_copy(update={**payload.model_dump(), "updated_at": _utcnow()}) if existing else WatchlistItem(**payload.model_dump())
    with _LOCK, SessionLocal() as session:
        _save_json(session, "watchlist", item, stock_code=item.stock_code)
        session.commit()
    return item


def list_watchlist() -> list[WatchlistItem]:
    return _list_json("watchlist", WatchlistItem)


def delete_watchlist_item(stock_code: str) -> bool:
    with _LOCK, SessionLocal() as session:
        rows = session.execute(select(JsonRecord).where(JsonRecord.record_type == "watchlist", JsonRecord.stock_code == stock_code)).scalars().all()
        for row in rows:
            session.delete(row)
        session.commit()
    return bool(rows)


def _embed_text(text: str, dimensions: int = 16) -> list[float]:
    vector = [0.0] * dimensions
    for index, char in enumerate(text):
        vector[index % dimensions] += (ord(char) % 97) / 97
    norm = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [round(value / norm, 6) for value in vector]


def _split_chunks(content: str, size: int = 500) -> list[str]:
    text = content.strip()
    return [text[index : index + size] for index in range(0, len(text), size)] or [text]


def add_document(payload: DocumentCreate) -> Document:
    summary = payload.content[:160].strip()
    document = Document(**payload.model_dump(), summary=summary)
    with _LOCK, SessionLocal() as session:
        _save_json(session, "document", document, stock_code=document.stock_code)
        for index, content in enumerate(_split_chunks(document.content)):
            chunk = DocumentChunk(document_id=document.id, stock_code=document.stock_code, chunk_index=index, content=content, embedding=_embed_text(content))
            session.merge(
                ChunkRecord(
                    id=chunk.id,
                    document_id=chunk.document_id,
                    stock_code=chunk.stock_code,
                    chunk_index=chunk.chunk_index,
                    content=chunk.content,
                    embedding=",".join(str(value) for value in chunk.embedding),
                    created_at=chunk.created_at,
                )
            )
        session.commit()
    return document


def list_documents(stock_code: Optional[str] = None) -> list[Document]:
    return _list_json("document", Document, stock_code=stock_code)


def list_document_chunks(stock_code: Optional[str] = None) -> list[DocumentChunk]:
    with SessionLocal() as session:
        statement = select(ChunkRecord)
        if stock_code is not None:
            statement = statement.where(ChunkRecord.stock_code == stock_code)
        rows = session.execute(statement.order_by(ChunkRecord.created_at.desc())).scalars().all()
    return [
        DocumentChunk(
            id=row.id,
            document_id=row.document_id,
            stock_code=row.stock_code,
            chunk_index=row.chunk_index,
            content=row.content,
            embedding=[float(value) for value in row.embedding.split(",") if value],
            created_at=row.created_at,
        )
        for row in rows
    ]


def search_documents(query: str, stock_code: Optional[str] = None) -> list[Document]:
    query_lower = query.lower()
    return [
        document
        for document in list_documents(stock_code)
        if query_lower in document.title.lower() or query_lower in document.content.lower() or query_lower in document.summary.lower()
    ]


def search_document_chunks(query: str, stock_code: Optional[str] = None, limit: int = 5) -> list[DocumentChunk]:
    query_embedding = _embed_text(query)

    def score(chunk: DocumentChunk) -> float:
        return sum(left * right for left, right in zip(query_embedding, chunk.embedding))

    chunks = list_document_chunks(stock_code)
    return sorted(chunks, key=score, reverse=True)[:limit]


def add_market_snapshot(payload: MarketSnapshotCreate) -> MarketSnapshot:
    snapshot = MarketSnapshot(**payload.model_dump())
    with _LOCK, SessionLocal() as session:
        session.merge(
            MarketSnapshotRecord(
                id=snapshot.id,
                stock_code=snapshot.stock_code,
                trade_date=snapshot.trade_date,
                close=snapshot.close,
                volume=snapshot.volume,
                open=snapshot.open,
                high=snapshot.high,
                low=snapshot.low,
                fund_flow=snapshot.fund_flow,
                payload=snapshot.model_dump_json(),
                created_at=snapshot.created_at,
            )
        )
        session.commit()
    return snapshot


def list_market_snapshots(stock_code: str, limit: int = 60) -> list[MarketSnapshot]:
    with SessionLocal() as session:
        rows = (
            session.execute(
                select(MarketSnapshotRecord)
                .where(MarketSnapshotRecord.stock_code == stock_code)
                .order_by(MarketSnapshotRecord.trade_date.desc())
                .limit(limit)
            )
            .scalars()
            .all()
        )
    return [_load(row.payload, MarketSnapshot) for row in reversed(rows)]


def create_alert(payload: TriggerAlertCreate) -> TriggerAlert:
    alert = TriggerAlert(**payload.model_dump())
    with _LOCK, SessionLocal() as session:
        _save_json(session, "trigger_alert", alert, stock_code=alert.stock_code)
        session.commit()
    return alert


def list_alerts() -> list[TriggerAlert]:
    return _list_json("trigger_alert", TriggerAlert)


def mark_alert_read(alert_id: str) -> Optional[TriggerAlert]:
    alert = next((item for item in list_alerts() if item.id == alert_id), None)
    if alert is None:
        return None
    updated = alert.model_copy(update={"status": "read", "updated_at": _utcnow()})
    with _LOCK, SessionLocal() as session:
        _save_json(session, "trigger_alert", updated, stock_code=updated.stock_code)
        session.commit()
    return updated


def create_review(payload: ResearchReviewCreate) -> ResearchReview:
    review = ResearchReview(**payload.model_dump())
    with _LOCK, SessionLocal() as session:
        _save_json(session, "research_review", review, task_id=review.task_id)
        session.commit()
    return review


def list_reviews() -> list[ResearchReview]:
    return _list_json("research_review", ResearchReview)


def build_daily_report(report_date: str) -> DailyReport:
    tasks = list_tasks()
    alerts = list_alerts()
    watchlist_count = len(list_watchlist())
    summary = [
        f"自选股数量：{watchlist_count}。",
        f"当日相关提醒：{len(alerts)} 条。",
        f"累计分析任务：{len(tasks)} 个。",
        "日报仅汇总研究信息和风险提醒，不构成确定性投资承诺。",
    ]
    return DailyReport(report_date=report_date, watchlist_count=watchlist_count, alerts=alerts, research_tasks=tasks[:10], summary=summary)


def build_weekly_review_report(week_start: Optional[str] = None, week_end: Optional[str] = None) -> WeeklyReviewReport:
    end_date = datetime.fromisoformat(week_end).date() if week_end else _utcnow().date()
    start_date = datetime.fromisoformat(week_start).date() if week_start else end_date - timedelta(days=6)
    tasks = [task for task in list_tasks() if start_date <= task.created_at.date() <= end_date]
    reviews = list_reviews()
    quality: dict[str, dict[str, float | int]] = {}
    for task in tasks:
        if not task.result:
            continue
        for signal in task.result.agent_signals:
            entry = quality.setdefault(signal.agent_name, {"signals": 0, "avg_confidence": 0.0})
            entry["signals"] = int(entry["signals"]) + 1
            entry["avg_confidence"] = float(entry["avg_confidence"]) + signal.confidence
    for entry in quality.values():
        signals = int(entry["signals"]) or 1
        entry["avg_confidence"] = round(float(entry["avg_confidence"]) / signals, 3)
    return WeeklyReviewReport(
        week_start=start_date.isoformat(),
        week_end=end_date.isoformat(),
        total_tasks=len(tasks),
        reviewed_count=len(reviews),
        agent_quality=quality,
        summary=[
            f"本周分析任务 {len(tasks)} 个，复盘记录 {len(reviews)} 条。",
            "Agent 质量统计基于信号数量和平均置信度，后续可接入真实结果校准。",
        ],
    )


def get_system_health() -> SystemHealth:
    database = "sqlalchemy:" + settings.database_url.split(":", 1)[0]
    return SystemHealth(status="ok", database=database, data_sources="mock/file adapters ready", agents="7 agents ready", compliance_guard="enabled")
