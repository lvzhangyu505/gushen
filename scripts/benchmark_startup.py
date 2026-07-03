from __future__ import annotations

import sys
from pathlib import Path

from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR / "backend"))

from app.main import app
from app.services.compliance_guard import ComplianceGuard, ComplianceViolation
from app.services.orchestrator import agent_names
from app.tasks.task_store import get_system_health


def main() -> None:
    client = TestClient(app)
    health = client.get("/api/v1/health")
    assert health.status_code == 200, health.text

    task = client.post("/api/v1/analysis-tasks", json={"stock_code": "002436", "time_horizon": "中期"})
    assert task.status_code == 200, task.text
    task_id = task.json()["id"]

    result = client.get(f"/api/v1/analysis-tasks/{task_id}")
    assert result.status_code == 200, result.text
    payload = result.json()
    assert payload["status"] in {"completed", "partial", "running"}
    if payload["status"] == "running":
        result = client.get(f"/api/v1/analysis-tasks/{task_id}")
        payload = result.json()
    assert len(payload["agent_states"]) == len(agent_names())

    document = client.post(
        "/api/v1/documents",
        json={
            "stock_code": "002436",
            "title": "Benchmark document",
            "source_type": "公告",
            "source_name": "benchmark",
            "evidence_level": "S",
            "content": "benchmark evidence content for chunk retrieval",
            "published_at": "2026-07-03",
        },
    )
    assert document.status_code == 200, document.text
    chunks = client.get("/api/v1/document-chunks?q=benchmark&stock_code=002436")
    assert chunks.status_code == 200 and chunks.json(), chunks.text

    for index in range(5):
        snapshot = client.post(
            "/api/v1/market-snapshots",
            json={
                "stock_code": "002436",
                "trade_date": f"2026-07-0{index + 1}",
                "close": 10 + index * 0.1,
                "volume": 100000 + index * 1000,
                "fund_flow": 1000 + index * 50,
            },
        )
        assert snapshot.status_code == 200, snapshot.text

    weekly = client.get("/api/v1/weekly-review")
    assert weekly.status_code == 200, weekly.text

    sources = client.get("/api/v1/data-sources")
    assert sources.status_code == 200 and sources.json(), sources.text

    guard = ComplianceGuard()
    try:
        guard.validate({"text": "建议" + "买入，" + "目标" + "价 10 元"})
    except ComplianceViolation:
        pass
    else:
        raise AssertionError("ComplianceGuard did not reject forbidden text")

    system_health = get_system_health()
    print("startup benchmark passed")
    print(system_health.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
