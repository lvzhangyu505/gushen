# 后端接口设计

更新时间：2026-07-03

## 1. API 约定

Base URL: `/api/v1`

所有建议、日报、个股研究卡和问答结果必须包含：

```json
{
  "facts": {},
  "analysis": "",
  "suggestions": [],
  "risks": [],
  "evidence": [],
  "disclaimer": "本系统仅用于个人研究辅助，不构成确定性投资承诺。"
}
```

证据不足时：

```json
{
  "facts": {},
  "analysis": "信息不足，无法形成建议。",
  "suggestions": [],
  "risks": [],
  "evidence": [],
  "disclaimer": "本系统仅用于个人研究辅助，不构成确定性投资承诺。"
}
```

## 2. Phase 1 Mock 闭环接口

Phase 1 只跑通前后端闭环，不接真实数据源、不接真实 AI 模型、不做真实 RAG、不写入 pgvector。

- `GET /health`：服务健康检查。
- `POST /analysis-tasks`：创建 Mock 分析任务，运行 7 个 Mock Agent，并返回任务状态和结果。
- `GET /analysis-tasks/{task_id}`：读取单个任务。
- `GET /analysis-tasks`：读取任务列表。

### 2.1 创建分析任务

```http
POST /api/v1/analysis-tasks
```

请求：

```json
{
  "stock_input": "002436",
  "stock_code": "002436",
  "stock_name": "兴森科技",
  "time_horizon": "mid",
  "analysis_mode": "standard"
}
```

字段说明：

- `stock_input`：用户输入的股票名称或代码。
- `stock_code`：标准股票代码，解析后保存。
- `stock_name`：股票名称，可为空。
- `time_horizon`：`short`、`mid`、`long`。
- `analysis_mode`：`quick`、`standard`、`deep`，MVP 默认 `standard`。

Phase 1 可以同步返回 `completed`，Phase 2 起应立即返回 `task_id` 和 `processing`。

Phase 1 返回：

```json
{
  "task_id": "task_20260703_000001",
  "status": "completed",
  "stock_code": "002436",
  "stock_name": "兴森科技",
  "time_horizon": "mid",
  "agent_signals": [],
  "orchestrator_result": {},
  "created_at": "2026-07-03T09:30:00",
  "updated_at": "2026-07-03T09:30:03",
  "disclaimer": "本系统仅用于个人研究辅助，不构成确定性投资承诺。"
}
```

Phase 2 目标返回：

```json
{
  "task_id": "task_20260703_000001",
  "status": "processing"
}
```

### 2.2 查询任务

```http
GET /api/v1/analysis-tasks/{task_id}
```

返回：

```json
{
  "task_id": "task_20260703_000001",
  "status": "completed",
  "expert_signals": [],
  "orchestrator_result": {},
  "errors": [],
  "created_at": "2026-07-03T09:30:00",
  "updated_at": "2026-07-03T09:30:03"
}
```

任务状态枚举：

- `pending`
- `running`
- `completed`
- `failed`
- `partial`
- `cancelled`

Agent 状态枚举：

- `pending`
- `running`
- `completed`
- `failed`
- `partial`

### 2.3 SSE 事件接口

Phase 2 新增：

```http
GET /api/v1/analysis-tasks/{task_id}/events
```

事件示例：

```json
{
  "event": "agent_completed",
  "task_id": "task_20260703_000001",
  "agent_name": "FinancialAgent",
  "status": "completed",
  "signal_direction": "neutral",
  "confidence": 0.68
}
```

推荐事件类型：

- `task_created`
- `agent_started`
- `agent_completed`
- `agent_failed`
- `orchestrator_started`
- `orchestrator_completed`
- `compliance_checked`
- `task_completed`
- `task_failed`

## 3. 标准分析结构

### 3.1 EvidenceItem

```json
{
  "evidence_id": "ev_001",
  "title": "公告标题",
  "summary": "证据摘要",
  "source_name": "交易所公告",
  "source_type": "announcement",
  "source_grade": "S",
  "published_at": "2026-07-03T08:00:00",
  "url": "https://example.com",
  "quote": "短摘录",
  "relevance_score": 0.92,
  "freshness_score": 0.88
}
```

证据等级：`S`、`A`、`B`、`C`、`D`。

### 3.2 ExpertSignal

```json
{
  "task_id": "task_20260703_000001",
  "stock_code": "002436",
  "stock_name": "兴森科技",
  "agent_name": "FinancialAgent",
  "agent_status": "completed",
  "signal_direction": "neutral",
  "confidence": 0.68,
  "weight": 0.16,
  "time_horizon": "mid",
  "core_evidence": [],
  "negative_evidence": [],
  "risk_flags": [],
  "missing_info": [],
  "assumptions": [],
  "data_timestamp": "2026-07-03T09:20:00",
  "generated_at": "2026-07-03T09:30:01",
  "expires_at": "2026-07-04T09:30:01",
  "conclusion_summary": "研究辅助摘要"
}
```

### 3.3 OrchestratorResult

```json
{
  "task_id": "task_20260703_000001",
  "stock_code": "002436",
  "stock_name": "兴森科技",
  "research_grade": "B_observe",
  "primary_time_horizon": "mid",
  "overall_direction": "neutral",
  "confidence": 0.64,
  "convergence_score": 0.58,
  "divergence_score": 0.42,
  "key_supporting_points": [],
  "key_risk_points": [],
  "key_divergences": [],
  "evidence_summary": [],
  "missing_info": [],
  "invalidation_conditions": [],
  "next_observation_points": [],
  "compliance_disclaimer": "本系统仅用于个人研究辅助，不构成确定性投资承诺。",
  "generated_at": "2026-07-03T09:30:03"
}
```

研究分级：

- `A_focus_tracking`
- `B_observe`
- `C_insufficient_info`
- `D_risk_elevated`
- `E_stop_tracking`

## 4. Auth 占位

首期可单用户运行，但保留接口。

- `GET /auth/me`：获取当前用户。
- `POST /auth/dev-login`：开发环境登录占位。

## 5. 自选股

- `GET /watchlists`：获取自选股列表。
- `POST /watchlists`：创建自选股分组。
- `GET /watchlists/{watchlist_id}`：获取分组详情。
- `PATCH /watchlists/{watchlist_id}`：更新分组。
- `DELETE /watchlists/{watchlist_id}`：删除分组。
- `POST /watchlists/{watchlist_id}/items`：添加股票。
- `PATCH /watchlists/{watchlist_id}/items/{item_id}`：更新标签、优先级、关注理由。
- `DELETE /watchlists/{watchlist_id}/items/{item_id}`：移除股票。

请求示例：

```json
{
  "market": "A_SHARE",
  "symbol": "300750",
  "tags": ["新能源", "电池"],
  "priority": 1,
  "thesis": "跟踪动力电池需求和海外扩产。"
}
```

## 6. 证券与市场信息

- `GET /securities/search?q=宁德时代&market=A_SHARE`：搜索证券。
- `GET /market/indices`：指数概览。
- `GET /market/sectors`：板块概览。
- `GET /securities/{security_id}/events`：股票相关公告、新闻、政策、财报、研报摘要。

## 7. 个股研究卡

- `GET /securities/{security_id}/research-card`：获取最新研究卡。
- `POST /securities/{security_id}/research-card/generate`：生成研究卡。
- `GET /research-cards/{card_id}`：获取指定研究卡。

生成接口返回字段必须包含：

- `facts`
- `analysis.fundamental`
- `analysis.technical`
- `analysis.capital_flow`
- `analysis.sentiment`
- `analysis.risk`
- `suggestions`
- `risks`
- `evidence`
- `disclaimer`

## 8. 研究辅助建议

- `GET /suggestions?security_id=&label=&from=&to=`：查询建议。
- `GET /suggestions/{suggestion_id}`：建议详情。

约束：

- `label` 只能是：`值得关注`、`继续观察`、`风险偏高`、`暂不建议介入`、`等待确认信号`。
- 每条建议必须至少绑定一条证据。
- 证据不足时返回：`信息不足，无法形成建议。`

## 9. 每日投研日报

- `GET /reports/daily?date=YYYY-MM-DD&type=morning`：获取日报。
- `POST /reports/daily/generate`：生成日报。
- `GET /reports/daily/latest`：获取最新日报。

日报类型：

- `morning`
- `close_review`
- `night_deep_dive`

日报必须包含证据来源和免责声明。

## 10. 风险提醒

- `GET /risk-alerts?security_id=&risk_type=&status=&severity=`：查询风险。
- `GET /risk-alerts/{risk_id}`：风险详情。
- `PATCH /risk-alerts/{risk_id}`：更新状态。
- `POST /risk-alerts/scan`：扫描风险。

## 11. 投资笔记与复盘

- `GET /notes?security_id=&q=&from=&to=`：查询笔记。
- `POST /notes`：创建笔记。
- `GET /notes/{note_id}`：笔记详情。
- `PATCH /notes/{note_id}`：更新笔记。
- `DELETE /notes/{note_id}`：删除笔记。
- `GET /research-reviews?security_id=&from=&to=`：查询复盘记录。
- `POST /research-reviews`：创建复盘记录。

实际操作仅作为用户个人复盘记录，不连接券商账户，不触发交易。

## 12. 搜索问答

- `POST /qa/sessions`：创建问答会话。
- `GET /qa/sessions`：会话列表。
- `POST /qa/sessions/{session_id}/messages`：提问并生成回答。

请求示例：

```json
{
  "question": "我的自选股里谁风险最高？",
  "scope": {
    "watchlist_id": "uuid",
    "date_range": "last_7_days"
  }
}
```

## 13. 数据源与采集任务

- `GET /data-sources`：数据源列表和授权状态。
- `GET /collection-tasks`：采集任务列表。
- `POST /collection-tasks/run`：手动触发采集。
- `GET /collection-tasks/{task_id}`：采集任务详情。

## 14. 系统自检

后续新增：

- `GET /system-health`：读取系统健康状态。
- `POST /system-health/benchmark`：触发自检任务。

自检覆盖数据库连接、pgvector、模型 API、7 个 Agent、Orchestrator 和 ComplianceGuard。

## 15. 禁止接口

不得创建以下接口或等价能力：

- `/brokerage/*`
- `/orders/*`
- `/trades/*`
- `/positions/sync`
- `/accounts/sync`
- `/funds/*`
- 任何下单、撤单、自动交易、账户托管、资金转账、仓位建议、目标价承诺接口。
