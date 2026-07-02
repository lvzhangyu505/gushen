# Codex 项目目录结构

## 1. 目标结构

```text
.
├── AGENTS.md
├── docs/
│   ├── PRD.md
│   ├── pages.md
│   ├── database.md
│   ├── api.md
│   ├── ai-agents.md
│   ├── data-pipeline.md
│   ├── templates.md
│   ├── mvp-plan.md
│   └── project-structure.md
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── styles/
│   └── tests/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── agents/
│   │   ├── core/
│   │   ├── data_sources/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── tasks/
│   │   └── main.py
│   ├── migrations/
│   └── tests/
├── infra/
│   ├── docker-compose.yml
│   └── postgres/
├── scripts/
│   ├── dev.sh
│   └── compliance_scan.sh
└── README.md
```

## 2. Frontend

- `app/`：Next.js App Router 页面。
- `components/`：通用 UI、研究卡、日报、风险提醒、证据链组件。
- `lib/`：API client、类型、格式化工具。
- `tests/`：页面和组件测试。

## 3. Backend

- `api/`：FastAPI route。
- `agents/`：RAG 和 Agent 编排。
- `core/`：配置、日志、数据库连接、安全占位。
- `data_sources/`：合法数据源适配器。
- `models/`：数据库模型。
- `schemas/`：Pydantic request/response schema。
- `services/`：业务服务。
- `tasks/`：APScheduler/Celery 任务。

## 4. Infra

- PostgreSQL + pgvector 本地开发环境。
- 后续可加入 observability、backup、deployment 配置。

## 5. Scripts

- `dev.sh`：启动本地开发服务。
- `compliance_scan.sh`：扫描禁止交易、账户、下单相关能力。
