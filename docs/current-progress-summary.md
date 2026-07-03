# Gushen 当前进展总结

更新时间：2026-07-03

## 1. 项目定位

Gushen 是个人自用的 AI 股票研究助手，定位为：

> 信息收集 + 多维研究 + 证据追踪 + 风险校验 + 分歧解释 + 历史复盘

系统围绕 A 股自选股和单只股票研究，使用合法公开 API、授权数据源、用户提供文件或手动录入信息，通过 7 个专家 Agent、Orchestrator、RiskAgent 和 ComplianceGuard 输出结构化研究辅助结果。

项目明确不是券商交易系统，也不是自动交易系统：

- 不接入券商账户。
- 不接入交易 API。
- 不做账户同步。
- 不自动交易。
- 不下单，不撤单。
- 不托管任何资金账户。
- 不输出仓位建议、目标价承诺、保证收益或无风险表述。
- 不替用户做最终投资决策。

统一免责声明：

> 本系统仅用于个人研究辅助，不构成确定性投资承诺。

## 2. 已完成内容

### 2.1 文档体系

已经创建并对齐以下文档：

- `README.md`
- `AGENTS.md`
- `docs/final-architecture.md`
- `docs/PRD.md`
- `docs/pages.md`
- `docs/database.md`
- `docs/api.md`
- `docs/ai-agents.md`
- `docs/data-pipeline.md`
- `docs/templates.md`
- `docs/mvp-plan.md`
- `docs/project-structure.md`
- `docs/task-packages/`

### 2.2 Phase 1：Mock 分析闭环

已完成可运行 FastAPI 后端：

- `POST /api/v1/analysis-tasks`
- `GET /api/v1/analysis-tasks/{task_id}`
- `GET /api/v1/analysis-tasks`
- 7 个 Mock Agent。
- Orchestrator 结构化聚合。
- ComplianceGuard 违规表达拦截。
- 后端测试覆盖 mock 分析链路。

### 2.3 Phase 2：异步任务状态与 SSE

已完成 MVP：

- 后端使用 `BackgroundTasks` 创建后台分析任务。
- 任务状态支持 `pending`、`running`、`completed`、`partial`、`failed`。
- 每个 Agent 保存运行状态、方向、置信度、错误信息和时间。
- 已提供 `GET /api/v1/analysis-tasks/{task_id}/events` SSE 接口。
- 前端优先使用 `EventSource` 消费 SSE，失败时回退轮询。

### 2.4 Phase 3：数据源 Adapter 与基础规则 Agent

已完成 MVP 骨架：

- `backend/app/data_sources/adapters.py`
- `MockPublicDataAdapter`。
- 数据源状态包含授权状态、endpoint 类型、刷新频率和 terms notes。
- 文档可通过 `POST /api/v1/documents` 手动入库。
- 行情快照可通过 `POST /api/v1/market-snapshots` 入库。
- TechnicalAgent 和 FundFlowAgent 在存在行情/资金快照时使用规则计算；数据不足时降级到 mock 输出。

说明：外部真实数据源仍需后续按授权逐个接入；当前已经具备合法 adapter 接口和本地数据路径。

### 2.5 Phase 4：RAG 与证据链

已完成 MVP 骨架：

- `documents` 本地持久化。
- `document_chunks` chunk 持久化。
- 证据等级 S/A/B/C/D。
- mock embedding 和 chunk 相似度检索。
- `backend/app/services/rag.py` 可检索到 `EvidenceItem`。
- Agent 输出中包含核心证据、反方证据、风险、缺失信息和假设。
- 前端展示证据来源、类型、等级、时间、摘要和相关性。

说明：当前 embedding provider 是本地 deterministic mock，便于无外部密钥运行；PostgreSQL + pgvector 环境和迁移已预留。

### 2.6 Phase 5：风险与合规

已完成 MVP：

- RiskAgent 参与 7 Agent 分析。
- Orchestrator 对 RiskAgent 谨慎/负向信号进行降级。
- 只有低等级证据时添加信息不足提示。
- ComplianceGuard 拦截 forbidden phrases。
- `scripts/compliance_scan.sh` 扫描禁止交易/账户能力。

说明：重大风险规则库、时效性衰减和动态权重仍是基础实现；外部风险公告和监管数据可通过 adapter 接入。

### 2.7 Phase 6：日报、提醒、复盘 API

已完成 MVP API：

- `GET /api/v1/watchlist`
- `POST /api/v1/watchlist`
- `DELETE /api/v1/watchlist/{stock_code}`
- `GET /api/v1/alerts`
- `POST /api/v1/alerts`
- `POST /api/v1/alerts/{alert_id}/mark-read`
- `GET /api/v1/daily-report`
- `GET /api/v1/research-history`
- `GET /api/v1/research-reviews`
- `POST /api/v1/research-reviews`
- `GET /api/v1/weekly-review`
- APScheduler 启动后注册每日投研日报任务和周复盘任务。
- 周复盘报告包含 Agent 信号数量和平均置信度统计。

说明：日报和周复盘已具备自动任务骨架，真实数据触发条件后续通过 adapter 扩展。

### 2.8 基础设施与验证

已完成：

- SQLAlchemy 持久化，默认使用本地 SQLite：`backend/.data/gushen.sqlite3`，已加入 `.gitignore`。
- 可通过 `DATABASE_URL` 切换 PostgreSQL。
- Alembic 迁移骨架和初始迁移已添加。
- PostgreSQL + pgvector Docker Compose 预留：`infra/docker-compose.yml`。
- `scripts/benchmark_startup.py` 启动自检。
- `scripts/compliance_scan.sh` 合规扫描。
- `scripts/dev.sh` 本地启动提示。
- README 已记录启动与验证命令。

## 3. 当前真实技术状态

### 前端

- Next.js
- React
- TypeScript
- Tailwind CSS
- lucide-react
- pnpm
- 已接入后端 API、SSE EventSource 和轮询兜底。

### 后端

- Python
- FastAPI
- Pydantic
- SQLAlchemy。
- SQLite 默认本地数据库。
- PostgreSQL 可通过 `DATABASE_URL` 切换。
- Alembic 迁移骨架。

### AI / 数据

- 7 个 Agent。
- ModelRouter 骨架。
- Mock/file data adapter 骨架。
- mock embedding + chunk 检索。
- TechnicalAgent / FundFlowAgent 可使用本地 market snapshot 真实规则计算。
- 尚未接真实 LLM、外部 embedding、reranker 或外部真实数据源。

## 4. 已通过验证

后端测试：

```bash
cd backend
.venv/bin/pytest -q
```

结果：

```text
11 passed
```

前端构建：

```bash
cd frontend
pnpm build
```

结果：构建通过。

启动自检：

```bash
backend/.venv/bin/python scripts/benchmark_startup.py
```

结果：通过。

合规扫描：

```bash
scripts/compliance_scan.sh
```

结果：通过。

## 5. 仍未完整完成的内容

这些不是当前 12 个任务包的阻塞项，而是后续产品化增强：

1. 接入真实合法数据源，例如公告、行情、财报、新闻或政策接口。
2. 使用真实 embedding provider 替换 mock embedding。
3. 在 PostgreSQL 环境中启用 pgvector 原生向量索引。
4. 扩展更多真实 Agent 规则和风险规则库。
5. 增加前端测试框架；当前用 `pnpm build` 和免责声明检查脚本覆盖基础检查。

## 6. 下一步建议

如果继续推进，建议优先顺序：

1. 启动 PostgreSQL + pgvector，并把 `DATABASE_URL` 切到 PostgreSQL。
2. 接入一个合法行情或公告数据源 adapter。
3. 使用真实 embedding provider 替换 mock embedding。
4. 增加前端测试框架。

## 7. 重要链接

- GitHub: https://github.com/lvzhangyu505/gushen.git
- Vercel: https://frontend-ashen-psi-30.vercel.app
- 最终架构文档：`docs/final-architecture.md`
- 任务包索引：`docs/task-packages/00-task-package-index.md`
