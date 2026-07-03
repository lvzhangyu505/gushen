# Gushen｜AI 个人投研辅助工作台

个人自用的 AI 股票研究助手，定位为"信息收集 + 多维研究 + 证据追踪 + 风险校验 + 分歧解释 + 历史复盘"工作台。

本项目围绕 A 股自选股和单只股票研究，收集 lawful public APIs、授权数据源、用户提供文件或手动录入的信息，通过 7 个专家 Agent、Orchestrator、RiskAgent 和 ComplianceGuard 生成结构化研究辅助结果。

当前阶段：从静态 Mock 原型进入可运行 MVP。项目内最终架构文档见 [最终架构](docs/final-architecture.md)。

## 合规边界

- 不接入券商账户。
- 不接入交易 API、账户同步或资金托管能力。
- 不自动交易，不下单，不撤单。
- 不提供仓位建议、目标价承诺、保证收益或无风险表述。
- 不替用户做最终投资决策。
- 不托管任何资金账户。
- 所有建议仅用于个人研究辅助，不构成确定性投资承诺。
- 证据不足时返回：`信息不足，无法形成建议。`

统一免责声明：

> 本系统仅用于个人研究辅助，不构成确定性投资承诺。

## 文档入口

- [产品 PRD](docs/PRD.md)
- [页面结构](docs/pages.md)
- [数据库表设计](docs/database.md)
- [后端接口设计](docs/api.md)
- [AI Agent 架构](docs/ai-agents.md)
- [数据采集流程](docs/data-pipeline.md)
- [日报与个股研究卡模板](docs/templates.md)
- [MVP 开发计划](docs/mvp-plan.md)
- [项目目录结构](docs/project-structure.md)
- [最终架构](docs/final-architecture.md)
- [任务包索引](docs/task-packages/00-task-package-index.md)
- [Codex 开发规范](AGENTS.md)

## 默认技术栈

- Frontend: Next.js + Tailwind CSS
- Backend: Python FastAPI
- Database: MVP 使用本地 SQLite 持久化任务与研究对象；PostgreSQL + pgvector Docker Compose 已预留
- Scheduler: APScheduler for MVP, Celery when distributed workers are needed
- AI: RAG with traceable evidence

## 当前 MVP 能力

- 前端可输入股票代码和分析周期，调用后端创建分析任务并轮询状态。
- 后端提供异步 `analysis-tasks`、SSE 事件流、7 个 Mock Agent、Orchestrator 和 ComplianceGuard。
- 本地 SQLite 持久化分析任务、Agent 状态、文档、提醒、自选股和复盘记录。
- 已提供 watchlist、documents、alerts、daily-report、research-history、research-reviews、system-health API。
- 已提供 Mock 数据源 adapter、ModelRouter、简易 RAG 检索骨架。
- 已提供 pgvector Docker Compose、启动自检脚本和合规扫描脚本。

## 本地启动

后端：

```bash
cd backend
.venv/bin/uvicorn app.main:app --reload
```

前端：

```bash
cd frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1 pnpm dev
```

PostgreSQL + pgvector 预留环境：

```bash
cd infra
docker compose up -d
```

## 验证命令

后端测试：

```bash
cd backend
.venv/bin/pytest -q
```

前端构建：

```bash
cd frontend
pnpm build
```

启动自检：

```bash
backend/.venv/bin/python scripts/benchmark_startup.py
```

合规扫描：

```bash
scripts/compliance_scan.sh
```

前端免责声明检查：

```bash
scripts/check_frontend_disclaimer.sh
```

## MVP 路线

- Phase 0：文档与结构整理。已完成。
- Phase 1：Mock 闭环，跑通 `analysis-tasks`、7 个 Mock Agent、Orchestrator 和 ComplianceGuard。已完成。
- Phase 2：异步任务状态机与 SSE。MVP 已完成。
- Phase 3：真实数据源与基础计算 Agent。已完成 adapter、ModelRouter、market snapshot 缓存和 Technical/FundFlow 规则计算路径。
- Phase 4：RAG 与证据链。已完成文档入库、chunk、mock embedding 和检索骨架。
- Phase 5：RiskAgent 与合规强化。已完成基础降级、低证据等级拦截提示和合规扫描。
- Phase 6：日报、提醒和复盘闭环。已完成 MVP API、APScheduler 定时任务和周复盘统计。
