# 任务包 04：数据库与任务持久化

## 目标

为后端 mock 闭环增加持久化能力，为后续 RAG、证据链、历史复盘和日报打基础。

## 范围

需要做：

- 确认 MVP 使用 PostgreSQL + pgvector；如为了本地快速开发可临时支持 SQLite，但核心设计必须面向 PostgreSQL。
- 增加 `infra/docker-compose.yml`，启动 PostgreSQL 和 pgvector。
- 增加数据库配置读取，使用环境变量，不把密码写死进代码。
- 引入 SQLAlchemy 或 SQLModel，保持与项目约定一致。
- 建立迁移方案，可使用 Alembic。
- 创建或规划以下核心表：
  - `stocks`
  - `watchlist`
  - `market_snapshots`
  - `financial_reports`
  - `documents`
  - `document_chunks`
  - `evidence_items`
  - `analysis_tasks`
  - `expert_signals`
  - `orchestrator_results`
  - `research_reviews`
  - `trigger_alerts`
  - `system_health_checks`
- 将 `analysis_tasks`、`expert_signals`、`orchestrator_results` 从内存存储迁移到数据库或添加数据库实现。
- 保留清晰 repository/service 层，不让 API route 直接堆 SQL。

不需要做：

- 不实现完整 RAG embedding。
- 不接真实数据源。
- 不实现用户登录或多用户权限。

## 验收标准

- 本地可以通过 Docker Compose 启动数据库。
- 后端可以连接数据库。
- 创建分析任务后，任务、Agent signal、Orchestrator result 能保存。
- 重启后端后，历史任务仍可查询。
- 数据库 schema 与 `docs/database.md` 同步。
- 后端测试覆盖 watchlist CRUD 和分析任务持久化的基本路径。

## 建议开线程提示词

```text
请执行 docs/task-packages/04-database-and-persistence.md。

先读 docs/database.md 和当前 backend 实现。请为分析任务、专家信号、仲裁结果加入持久化，并补 Docker Compose/PostgreSQL/pgvector 基础设施。不要接交易或券商功能。
```

