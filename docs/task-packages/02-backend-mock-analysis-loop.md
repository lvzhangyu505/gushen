# 任务包 02：后端 Mock 分析闭环加固

## 目标

完成并加固 Phase 1 后端 mock 闭环：输入股票代码，创建分析任务，运行 7 个 mock Agent，经过 Orchestrator 和 ComplianceGuard，返回结构化研究结果。

## 当前状态

项目已存在后端基础文件：

- `backend/app/main.py`
- `backend/app/schemas/analysis.py`
- `backend/app/agents/mock_agents.py`
- `backend/app/services/orchestrator.py`
- `backend/app/tasks/task_store.py`
- `backend/tests/test_analysis_api.py`

本任务应先检查这些文件，而不是从零重写。

## 范围

需要做：

- 确认 FastAPI 应用可启动。
- 确认 API 路由文件完整存在，例如 `backend/app/api/v1/router.py`。
- 对齐 Pydantic schema：
  - `EvidenceItem`
  - `ExpertSignal`
  - `DivergenceItem`
  - `OrchestratorResult`
  - `AnalysisTask`
- 确认 7 个 mock Agent 都可运行：
  - FinancialAgent
  - TechnicalAgent
  - FundFlowAgent
  - MacroAgent
  - IndustryAgent
  - SentimentAgent
  - RiskAgent
- 确认每个 Agent 输出证据、风险、缺失信息、假设、分析周期。
- 补齐 Orchestrator：
  - 聚合 signal。
  - 计算分歧。
  - 输出允许枚举内的研究标签。
  - 输出风险点、观察点、免责声明。
- 增加 ComplianceGuard 或等价服务：
  - 拦截“建议买入、建议卖出、仓位、目标价、保证收益、无风险、一定上涨”等表达。
- 提供接口：
  - `POST /api/v1/analysis-tasks`
  - `GET /api/v1/analysis-tasks/{task_id}`
- 使用内存存储即可，但接口结构要为后续数据库持久化保留空间。

不需要做：

- 不接真实行情、新闻、公告、财务数据。
- 不做 SSE。
- 不接 pgvector。
- 不接任何券商或交易能力。

## 验收标准

- `uvicorn app.main:app --reload` 可以在 `backend/` 启动。
- `POST /api/v1/analysis-tasks` 输入 `002436` 能返回 `task_id`。
- `GET /api/v1/analysis-tasks/{task_id}` 能返回 completed 任务和完整 mock 结果。
- 结果包含 7 个 Agent 的结构化 signal。
- 结果包含研究分级、核心证据、反方证据、风险点、缺失信息、下一步观察、免责声明。
- 无违规表达。
- 后端测试通过。

## 建议开线程提示词

```text
请执行 docs/task-packages/02-backend-mock-analysis-loop.md。

先检查现有 backend 代码，再补齐 Phase 1 mock 闭环。不要接真实数据源，不要实现任何交易能力。完成后运行后端测试，并告诉我 API 如何本地调用。
```

