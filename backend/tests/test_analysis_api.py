from fastapi.testclient import TestClient

from app.main import app
from app.schemas.analysis import ResearchGrade
from app.services.compliance_guard import ComplianceGuard, ComplianceViolation
from app.tasks.task_store import reset_store


client = TestClient(app)


def setup_function() -> None:
    reset_store()


def _create_completed_task() -> dict:
    response = client.post("/api/v1/analysis-tasks", json={"stock_code": "002436", "time_horizon": "中期"})
    assert response.status_code == 200
    task_id = response.json()["id"]
    read_response = client.get(f"/api/v1/analysis-tasks/{task_id}")
    assert read_response.status_code == 200
    return read_response.json()


def test_health_endpoint() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_analysis_task_returns_mock_result_after_background_run() -> None:
    payload = _create_completed_task()
    assert payload["status"] in {"completed", "partial"}
    assert payload["result"]["stock_code"] == "002436"
    assert payload["result"]["time_horizon"] == "中期"
    assert len(payload["agent_states"]) == 7
    assert len(payload["result"]["agent_signals"]) == 7
    assert payload["result"]["research_grade"] in {grade.value for grade in ResearchGrade}
    assert payload["result"]["core_evidence"]
    assert payload["result"]["counter_evidence"]
    assert payload["result"]["key_risk_points"]
    assert payload["result"]["missing_info"]
    assert payload["result"]["disclaimer"] == "本系统仅用于个人研究辅助，不构成确定性投资承诺。"

    for signal in payload["result"]["agent_signals"]:
        assert signal["analysis_period"]
        assert signal["core_evidence"]
        assert signal["negative_evidence"]
        assert signal["risk_flags"]
        assert signal["missing_info"]
        assert signal["assumptions"]
        assert signal["time_horizon"] == "中期"

    serialized = str(payload)
    forbidden_terms = [
        "建议" + "买入",
        "建议" + "卖出",
        "仓" + "位",
        "目标" + "价",
        "保证" + "收益",
        "一定" + "上涨",
        "稳" + "赚",
        "无" + "风险",
    ]
    assert all(term not in serialized for term in forbidden_terms)


def test_created_analysis_task_can_be_read_back() -> None:
    payload = _create_completed_task()
    task_id = payload["id"]

    read_response = client.get(f"/api/v1/analysis-tasks/{task_id}")

    assert read_response.status_code == 200
    assert read_response.json()["id"] == task_id


def test_unknown_analysis_task_returns_404() -> None:
    response = client.get("/api/v1/analysis-tasks/not-found")

    assert response.status_code == 404


def test_watchlist_crud() -> None:
    create_response = client.post("/api/v1/watchlist", json={"stock_code": "002436", "stock_name": "兴森科技", "industry": "电子"})
    assert create_response.status_code == 200
    assert create_response.json()["stock_code"] == "002436"

    list_response = client.get("/api/v1/watchlist")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    delete_response = client.delete("/api/v1/watchlist/002436")
    assert delete_response.status_code == 200
    assert delete_response.json()["deleted"] is True


def test_documents_alerts_daily_report_and_review() -> None:
    document_response = client.post(
        "/api/v1/documents",
        json={
            "stock_code": "002436",
            "title": "Mock 公告",
            "source_type": "公告",
            "source_name": "本地测试",
            "evidence_level": "S",
            "content": "公司公告测试内容，用于验证证据链。",
            "published_at": "2026-07-03",
        },
    )
    assert document_response.status_code == 200
    assert document_response.json()["evidence_level"] == "S"

    search_response = client.get("/api/v1/documents?q=公告&stock_code=002436")
    assert search_response.status_code == 200
    assert len(search_response.json()) == 1

    chunk_response = client.get("/api/v1/document-chunks?stock_code=002436")
    assert chunk_response.status_code == 200
    assert chunk_response.json()

    vector_search_response = client.get("/api/v1/document-chunks?q=证据链&stock_code=002436")
    assert vector_search_response.status_code == 200
    assert vector_search_response.json()

    alert_response = client.post("/api/v1/alerts", json={"stock_code": "002436", "title": "Mock 风险提醒", "description": "成交波动需要复核。"})
    assert alert_response.status_code == 200
    alert_id = alert_response.json()["id"]

    read_alert_response = client.post(f"/api/v1/alerts/{alert_id}/mark-read")
    assert read_alert_response.status_code == 200
    assert read_alert_response.json()["status"] == "read"

    task = _create_completed_task()
    review_response = client.post(
        "/api/v1/research-reviews",
        json={"task_id": task["id"], "follow_up_summary": "后续继续观察财务和公告验证。"},
    )
    assert review_response.status_code == 200

    report_response = client.get("/api/v1/daily-report?report_date=2026-07-03")
    assert report_response.status_code == 200
    assert report_response.json()["disclaimer"] == "本系统仅用于个人研究辅助，不构成确定性投资承诺。"

    weekly_response = client.get("/api/v1/weekly-review?week_start=2026-07-01&week_end=2026-07-07")
    assert weekly_response.status_code == 200
    assert weekly_response.json()["disclaimer"] == "本系统仅用于个人研究辅助，不构成确定性投资承诺。"


def test_market_snapshots_drive_rule_based_agents() -> None:
    for index in range(6):
        response = client.post(
            "/api/v1/market-snapshots",
            json={
                "stock_code": "002436",
                "trade_date": f"2026-07-0{index + 1}",
                "close": 10 + index * 0.2,
                "volume": 100000 + index * 10000,
                "fund_flow": 1000 + index * 100,
            },
        )
        assert response.status_code == 200

    task = _create_completed_task()
    signals = {signal["agent_name"]: signal for signal in task["result"]["agent_signals"]}
    assert signals["技术指标 Agent"]["core_evidence"][0]["source_type"] == "行情快照"
    assert signals["资金流向 Agent"]["core_evidence"][0]["source_type"] == "资金快照"
    assert signals["技术指标 Agent"]["core_evidence"][0]["evidence_level"] == "B"


def test_sse_endpoint_streams_task_updates() -> None:
    create_response = client.post("/api/v1/analysis-tasks", json={"stock_code": "002436", "time_horizon": "中期"})
    task_id = create_response.json()["id"]
    with client.stream("GET", f"/api/v1/analysis-tasks/{task_id}/events") as response:
        assert response.status_code == 200
        body = "".join(response.iter_text())
    assert "task_update" in body
    assert task_id in body


def test_data_sources_endpoint() -> None:
    response = client.get("/api/v1/data-sources")
    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert payload[0]["authorization_status"]


def test_system_health() -> None:
    response = client.get("/api/v1/system-health")
    assert response.status_code == 200
    assert response.json()["compliance_guard"] == "enabled"


def test_compliance_guard_rejects_forbidden_expressions() -> None:
    guard = ComplianceGuard()

    try:
        guard.validate({"text": "这里出现建议买入和目标价等违规表达"})
    except ComplianceViolation as exc:
        assert "建议买入" in exc.violations
        assert "目标价" in exc.violations
    else:
        raise AssertionError("ComplianceGuard should reject forbidden expressions")
