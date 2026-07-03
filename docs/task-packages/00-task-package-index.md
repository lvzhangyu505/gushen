# Gushen 任务包索引

更新时间：2026-07-03

本目录用于把 `gushen-final-architecture.md` 拆成多个可以分别开 Codex 线程执行的任务包。每个任务包都是一个独立 MD，可以直接复制到新线程作为开发指令。

## 使用方式

1. 优先按编号顺序执行。
2. 每次新开线程时，附上对应任务包全文，并提醒 Codex 遵守根目录 `AGENTS.md`。
3. 每个线程只完成一个任务包，除非任务包明确依赖前置包的验收结果。
4. 每个任务包完成后，要求线程更新相关文档，并运行对应测试或检查。

## 全局合规边界

- 不接入券商账户。
- 不实现交易 API、下单、撤单、自动交易、账户同步、资金托管。
- 不输出确定性买卖指令、目标价承诺、仓位比例、保证收益、无风险表述。
- 所有研究建议必须带证据、分析依据、风险提示和免责声明。
- 证据不足时返回：`信息不足，无法形成建议。`
- 所有建议、报告、个股研究卡必须显示：`本系统仅用于个人研究辅助，不构成确定性投资承诺。`

## 推荐执行顺序

| 顺序 | 任务包 | 目标 |
|---:|---|---|
| 1 | `01-architecture-docs-alignment.md` | 把最终架构沉淀进项目文档，统一术语和边界 |
| 2 | `02-backend-mock-analysis-loop.md` | 加固 Phase 1 后端 mock 分析闭环 |
| 3 | `03-frontend-api-integration.md` | 让前端开始分析按钮接入后端真实 mock API |
| 4 | `04-database-and-persistence.md` | 建立 PostgreSQL/SQLite 过渡持久化与核心表结构 |
| 5 | `05-async-task-status-and-sse.md` | 加入异步任务状态机，后续升级 SSE |
| 6 | `06-data-source-adapters.md` | 建立合法公开数据源 adapter 抽象和缓存 |
| 7 | `07-rag-evidence-chain.md` | 建立 documents、chunks、evidence 和检索链路 |
| 8 | `08-real-agents-and-model-router.md` | 将部分 mock Agent 替换为真实规则/LLM/RAG Agent |
| 9 | `09-orchestrator-risk-compliance.md` | 强化仲裁、RiskAgent 一票降级和 ComplianceGuard |
| 10 | `10-daily-alerts-review-loop.md` | 实现日报、提醒、历史复盘闭环 |
| 11 | `11-testing-benchmark-release.md` | 补测试、自检脚本、合规扫描和发布验收 |

## 当前项目状态提示

截至 2026-07-03，项目已有：

- `frontend/` Next.js 静态投研台页面。
- `backend/` FastAPI mock 分析基础文件。
- `backend/app/schemas/analysis.py`
- `backend/app/agents/mock_agents.py`
- `backend/app/services/orchestrator.py`
- `backend/app/tasks/task_store.py`
- `backend/tests/test_analysis_api.py`

所以前几个任务不是纯从零开始，而是检查、补齐、加固、联调。

