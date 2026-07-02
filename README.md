# AI 投研信息与投资建议平台

个人自用的 AI 股票研究助手，定位为"信息收集 + 投资研究 + 决策辅助"平台。

## 合规边界

- 不接入券商账户。
- 不自动交易。
- 不下单，不撤单。
- 不托管任何资金账户。
- 所有建议仅用于个人研究辅助，不构成确定性投资承诺。

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
- [Codex 开发规范](AGENTS.md)

## 默认技术栈

- Frontend: Next.js + Tailwind CSS
- Backend: Python FastAPI
- Database: PostgreSQL + pgvector
- Scheduler: APScheduler for MVP, Celery when distributed workers are needed
- AI: RAG with traceable evidence
