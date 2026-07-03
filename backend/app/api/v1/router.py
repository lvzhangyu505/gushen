from __future__ import annotations

import json
from datetime import date
from time import sleep
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.schemas.analysis import (
    AnalysisTask,
    AnalysisTaskCreate,
    DISCLAIMER,
    Document,
    DocumentChunk,
    DocumentCreate,
    MarketSnapshot,
    MarketSnapshotCreate,
    ResearchReview,
    ResearchReviewCreate,
    TriggerAlert,
    TriggerAlertCreate,
    WatchlistItem,
    WatchlistItemCreate,
)
from app.data_sources.adapters import available_adapters
from app.services.compliance_guard import ComplianceViolation
from app.services.orchestrator import agent_names, combine_signals, run_agent
from app.tasks.task_store import (
    add_document,
    add_market_snapshot,
    add_watchlist_item,
    build_daily_report,
    create_alert,
    create_review,
    create_task,
    delete_watchlist_item,
    get_system_health,
    get_task,
    list_alerts,
    list_documents,
    list_document_chunks,
    list_market_snapshots,
    list_reviews,
    list_tasks,
    list_watchlist,
    mark_alert_read,
    search_documents,
    search_document_chunks,
    build_weekly_review_report,
    update_agent_state,
    update_task,
)

api_router = APIRouter()


@api_router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "gushen-backend", "phase": "mvp-loop", "disclaimer": DISCLAIMER}


def execute_analysis_task(task_id: str) -> None:
    task = get_task(task_id)
    if task is None:
        return
    signals = []
    failed_agents: list[str] = []
    update_task(task_id, status="running")

    for name in agent_names():
        try:
            update_agent_state(task_id, name, "running")
            signal = run_agent(name, task.stock_code, task.time_horizon)
            signals.append(signal)
            update_agent_state(task_id, name, "completed", signal.signal_direction.value, signal.confidence)
        except Exception as exc:
            failed_agents.append(name)
            update_agent_state(task_id, name, "failed", error_message=str(exc))

    try:
        result = combine_signals(task.stock_code, task.time_horizon, signals, failed_agents)
    except ComplianceViolation as exc:
        update_task(task_id, status="failed", error_message=str(exc))
        return
    except Exception as exc:
        update_task(task_id, status="failed", error_message=f"analysis task failed: {exc}")
        return

    status = "partial" if failed_agents else "completed"
    update_task(task_id, status=status, result=result)


@api_router.post("/analysis-tasks", response_model=AnalysisTask)
def create_analysis_task(payload: AnalysisTaskCreate, background_tasks: BackgroundTasks) -> AnalysisTask:
    task = create_task(payload.stock_code, payload.time_horizon, agent_names())
    background_tasks.add_task(execute_analysis_task, task.id)
    return update_task(task.id, status="running")


@api_router.get("/analysis-tasks/{task_id}", response_model=AnalysisTask)
def read_analysis_task(task_id: str) -> AnalysisTask:
    task = get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="analysis task not found")
    return task


@api_router.get("/analysis-tasks/{task_id}/events")
def stream_analysis_task_events(task_id: str) -> StreamingResponse:
    def event_stream():
        last_payload = ""
        for _ in range(60):
            task = get_task(task_id)
            if task is None:
                yield "event: error\ndata: {\"detail\":\"analysis task not found\"}\n\n"
                return
            payload = json.dumps(task.model_dump(mode="json"), ensure_ascii=False)
            if payload != last_payload:
                yield f"event: task_update\ndata: {payload}\n\n"
                last_payload = payload
            if task.status.value in {"completed", "partial", "failed"}:
                return
            sleep(1)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@api_router.get("/analysis-tasks", response_model=list[AnalysisTask])
def read_analysis_tasks() -> list[AnalysisTask]:
    return list_tasks()


@api_router.get("/watchlist", response_model=list[WatchlistItem])
def read_watchlist() -> list[WatchlistItem]:
    return list_watchlist()


@api_router.post("/watchlist", response_model=WatchlistItem)
def create_watchlist_item(payload: WatchlistItemCreate) -> WatchlistItem:
    return add_watchlist_item(payload)


@api_router.delete("/watchlist/{stock_code}")
def remove_watchlist_item(stock_code: str) -> dict[str, bool]:
    deleted = delete_watchlist_item(stock_code)
    if not deleted:
        raise HTTPException(status_code=404, detail="watchlist item not found")
    return {"deleted": True}


@api_router.get("/documents", response_model=list[Document])
def read_documents(stock_code: Optional[str] = None, q: Optional[str] = Query(default=None)) -> list[Document]:
    if q:
        return search_documents(q, stock_code)
    return list_documents(stock_code)


@api_router.post("/documents", response_model=Document)
def create_document(payload: DocumentCreate) -> Document:
    return add_document(payload)


@api_router.get("/document-chunks", response_model=list[DocumentChunk])
def read_document_chunks(stock_code: Optional[str] = None, q: Optional[str] = Query(default=None)) -> list[DocumentChunk]:
    if q:
        return search_document_chunks(q, stock_code)
    return list_document_chunks(stock_code)


@api_router.post("/market-snapshots", response_model=MarketSnapshot)
def create_market_snapshot(payload: MarketSnapshotCreate) -> MarketSnapshot:
    return add_market_snapshot(payload)


@api_router.get("/market-snapshots/{stock_code}", response_model=list[MarketSnapshot])
def read_market_snapshots(stock_code: str, limit: int = 60) -> list[MarketSnapshot]:
    return list_market_snapshots(stock_code, limit)


@api_router.get("/data-sources")
def data_sources():
    return [adapter.health() for adapter in available_adapters()]


@api_router.get("/alerts", response_model=list[TriggerAlert])
def read_alerts() -> list[TriggerAlert]:
    return list_alerts()


@api_router.post("/alerts", response_model=TriggerAlert)
def add_alert(payload: TriggerAlertCreate) -> TriggerAlert:
    return create_alert(payload)


@api_router.post("/alerts/{alert_id}/mark-read", response_model=TriggerAlert)
def read_alert(alert_id: str) -> TriggerAlert:
    alert = mark_alert_read(alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="alert not found")
    return alert


@api_router.get("/daily-report")
def daily_report(report_date: Optional[str] = None):
    return build_daily_report(report_date or date.today().isoformat())


@api_router.get("/research-history", response_model=list[AnalysisTask])
def research_history() -> list[AnalysisTask]:
    return list_tasks()


@api_router.get("/research-history/{task_id}", response_model=AnalysisTask)
def read_research_history_item(task_id: str) -> AnalysisTask:
    return read_analysis_task(task_id)


@api_router.get("/research-reviews", response_model=list[ResearchReview])
def read_reviews() -> list[ResearchReview]:
    return list_reviews()


@api_router.post("/research-reviews", response_model=ResearchReview)
def add_review(payload: ResearchReviewCreate) -> ResearchReview:
    if get_task(payload.task_id) is None:
        raise HTTPException(status_code=404, detail="analysis task not found")
    return create_review(payload)


@api_router.get("/weekly-review")
def weekly_review(week_start: Optional[str] = None, week_end: Optional[str] = None):
    return build_weekly_review_report(week_start, week_end)


@api_router.get("/system-health")
def system_health():
    return get_system_health()
