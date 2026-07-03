# MVP 开发计划

更新时间：2026-07-03

## 1. MVP 范围

首期目标是把 Gushen 做成可运行的 A 股个人投研辅助工作台，围绕单只股票和自选股完成：

- 自选股池。
- 单只股票分析任务。
- 7 个专家 Agent 的标准 `ExpertSignal`。
- Orchestrator 研究分级、分歧解释和风险校验。
- ComplianceGuard 合规审查。
- 来源文档入库、证据等级和 RAG 检索。
- 个股研究卡、风险提醒、每日投研日报、搜索问答和历史复盘。

不包含：

- 券商账户接入。
- 交易 API。
- 自动交易、下单、撤单。
- 资金账户托管或资金转账。
- 仓位建议、目标价承诺或保证收益。
- 多用户商业化权限体系。

统一免责声明：

> 本系统仅用于个人研究辅助，不构成确定性投资承诺。

## 2. Phase 0：文档与结构整理

目标：让项目内文档统一最终架构、合规边界和开发顺序。

任务：

- 更新 `README.md`。
- 更新 `docs/PRD.md`。
- 更新 `docs/ai-agents.md`。
- 更新 `docs/api.md`。
- 更新 `docs/database.md`。
- 更新 `docs/mvp-plan.md`。
- 将最终规划沉淀为 `docs/final-architecture.md`。
- 更新 `docs/current-progress-summary.md`。

验收：

- 文档中不再把系统描述为交易系统或自动决策系统。
- Orchestrator 定位为信号合成、分歧解释、风险校验和合规表达控制。
- 所有建议、报告和研究卡要求显示免责声明。
- 明确禁止券商账户、交易 API、自动交易、下单、撤单、仓位建议和目标价承诺。

## 3. Phase 1：Mock 闭环

目标：不接真实数据，先跑通完整分析闭环。

任务：

- 创建 FastAPI 后端。
- 创建 Pydantic Schema：`EvidenceItem`、`ExpertSignal`、`OrchestratorResult`、`AnalysisTask`。
- 创建 7 个 Mock Agent：
  - `FinancialAgent`
  - `TechnicalAgent`
  - `FundFlowAgent`
  - `MacroAgent`
  - `IndustryAgent`
  - `SentimentAgent`
  - `RiskAgent`
- 创建 Mock Orchestrator。
- 创建 ComplianceGuard。
- 创建 `POST /api/v1/analysis-tasks`。
- 创建 `GET /api/v1/analysis-tasks/{task_id}`。
- 创建任务列表接口。
- 前端“开始分析”按钮接入后端。
- 前端动态展示 7 个 Agent 状态、最终研究卡、风险、证据和免责声明。

验收：

- 输入 `002436` 后，前端能展示 7 个 Agent 的 mock 结果。
- 最终结果显示研究分级、风险、证据、缺失信息和下一步观察。
- 不出现买入、卖出、仓位、目标价等违规表达。

## 4. Phase 2：异步任务与 SSE

目标：优化分析任务体验。

任务：

- 后端引入 BackgroundTasks。
- 新增任务状态机。
- 新增 `GET /api/v1/analysis-tasks/{task_id}/events` SSE 接口。
- 前端改为流式刷新。
- 每个 Agent 完成后逐行点亮。

验收：

- 点击分析后页面不阻塞。
- 每个 Agent 完成时前端即时刷新。
- Orchestrator 最后解锁最终卡片。
- Agent 失败时页面展示部分结果和缺失说明。

## 5. Phase 3：真实数据源与基础计算 Agent

目标：先接不依赖 LLM 的数据和计算。

任务：

- 接入股票基础信息。
- 接入行情快照。
- 实现 TechnicalAgent 的真实计算。
- 实现 FundFlowAgent 的真实计算。
- 实现数据缓存表。
- 增加数据更新时间显示。
- 所有数据源通过 adapter 抽象，不把单一供应商写入核心业务逻辑。

验收：

- 技术指标和资金指标不再是 mock。
- 返回结果包含数据时间戳。
- 数据过期时前端明确提示。
- 数据源授权状态有记录。

## 6. Phase 4：RAG 与证据链

目标：让结论有证据。

任务：

- 接入 PostgreSQL + pgvector。
- 创建 `source_documents`、`document_chunks`、`evidence_items`。
- 建立公告、新闻、政策、行业文本入库流程。
- 实现 Agent 级检索。
- 实现证据等级 S/A/B/C/D。
- 前端支持证据展开。

验收：

- 每个 Agent 最多返回 3 条核心证据和 3 条反方证据。
- Orchestrator 只引用高价值证据。
- 只有低等级证据时，系统不形成稳定判断。
- 无证据时返回：`信息不足，无法形成建议。`

## 7. Phase 5：RiskAgent 与合规强化

目标：降低错误输出和违规表达风险。

任务：

- 实现真实 RiskAgent。
- 实现重大风险规则库。
- 实现 RiskAgent 一票降级。
- 实现 ComplianceGuard 拦截。
- 增加合规测试用例。

验收：

- 出现“建议买入”“仓位”“目标价”“保证收益”等表达时被拦截。
- RiskAgent 高置信偏空且命中重大风险时，最终结果自动降级。
- 信息不足时不强行输出方向。

## 8. Phase 6：日报、提醒、复盘

目标：形成长期投研闭环。

任务：

- 实现 watchlist 自选股扫描。
- 实现每日投研日报。
- 实现触发式提醒。
- 实现历史分析记录。
- 实现周复盘报告。
- 统计 Agent 判断质量。
- 增加系统自检脚本 `scripts/benchmark_startup.py`。

验收：

- 系统可以生成自选股日报。
- 可以查看历史分析。
- 可以对过去判断进行复盘。
- 可以识别常见误判来源。
- 自检脚本覆盖数据库、pgvector、模型 API、7 Agent、Orchestrator 和 ComplianceGuard。

## 9. 总体验收标准

- 自选股可以添加、编辑、删除。
- 分析任务可以创建、查询和展示状态。
- 个股研究卡生成结果包含事实、分析、建议、风险、证据和免责声明。
- 无证据时返回：`信息不足，无法形成建议。`
- 建议标签仅使用允许枚举。
- 日报可以按日期和类型查询。
- 风险提醒可以创建、查询和标记状态。
- 搜索问答可以引用证据回答。
- UI 中建议、报告、个股研究卡和问答结果展示免责声明。
- 仓库中不存在交易或券商账户能力。

## 10. 默认技术选择

- Frontend：Next.js、TypeScript、Tailwind CSS。
- Backend：Python、FastAPI、Pydantic、SQLAlchemy 或 SQLModel。
- Database：PostgreSQL + pgvector。
- Scheduler：APScheduler for MVP，后续可迁移 Celery。
- AI：RAG 架构，provider-neutral LLM、embedding 和 reranker 接口。
