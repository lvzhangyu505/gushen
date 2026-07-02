# AI 投研信息与投资建议平台当前进展总结

更新时间：2026-07-02

## 1. 项目定位

本项目是一个个人自用的 AI 股票研究助手，定位为：

> 信息收集 + 投资研究 + 决策辅助

系统目标是帮助用户围绕自选股自动收集市场信息、上市公司公告、财经新闻、政策变化、行业动态、财报数据、研报摘要，并通过 AI 进行结构化分析，生成投资研究建议、风险提醒和每日投研日报。

项目明确不是券商交易系统：

- 不接入券商账户
- 不自动交易
- 不下单
- 不撤单
- 不托管任何资金账户
- 所有建议仅用于个人研究辅助，不构成确定性投资承诺

## 2. 已完成内容

### 2.1 项目文档体系

已经创建完整的产品与工程规划文档：

- `README.md`：项目入口说明。
- `AGENTS.md`：Codex 开发规范、合规红线、AI 输出约束。
- `docs/PRD.md`：产品 PRD。
- `docs/pages.md`：页面结构。
- `docs/database.md`：PostgreSQL + pgvector 数据库表设计。
- `docs/api.md`：FastAPI 后端接口设计。
- `docs/ai-agents.md`：RAG 与多 Agent 架构设计。
- `docs/data-pipeline.md`：数据采集流程。
- `docs/templates.md`：日报和个股研究卡模板。
- `docs/mvp-plan.md`：MVP 开发计划。
- `docs/project-structure.md`：项目目录结构。

### 2.2 工程目录结构

已经搭建基础目录：

```text
.
├── AGENTS.md
├── README.md
├── docs/
├── frontend/
├── backend/
├── infra/
└── scripts/
```

其中：

- `frontend/`：Next.js + Tailwind CSS 前端。
- `backend/`：FastAPI 后端预留目录。
- `infra/`：PostgreSQL、pgvector 等基础设施预留目录。
- `scripts/`：后续开发、部署、合规扫描脚本预留目录。

### 2.3 前端网页预览

已经完成一个可在线预览的 Next.js 页面。

当前 UI 已从普通仪表盘升级为更接近 Rena / WorkBuddy 思路的 **AI 投研分析台**，核心区域包括：

- 股票名称或代码输入入口
- “开始分析”按钮
- Orchestrator 仲裁结果
- 7 个专家 Agent Signal 表
- Agent 方向、置信度、权重、核心依据
- 自选股研究队列
- 今日投研日报
- 证据链
- 风险提醒
- 搜索问答入口
- 合规免责声明

当前页面仍是静态 mock 数据，但已经具备产品形态。

### 2.4 Rena / WorkBuddy PDF 解读

已读取并分析用户提供的文件：

`Work Buddy使用Rena 简易流程0524(6)(1).pdf`

从文件中提炼出的关键方向：

- WorkBuddy 是接入大模型的 Agent 容器。
- Rena 是多 Agent 架构。
- Rena 的核心是多个专家 Agent 输出标准 Signal。
- 用户输入股票名称或代码后，系统运行专家分析并输出仲裁结果。
- 参考架构包含财务、技术指标、资金、宏观、行业、舆情、风险等专家能力。

基于该文件，我们确定后续项目方向应从“投研看板”升级为：

> 输入股票 -> 7 个专家 Agent 分析 -> 输出标准 Signal -> Orchestrator 仲裁 -> 给出研究建议、风险和证据链

### 2.5 GitHub 仓库

已初始化本地 Git 仓库，并推送到 GitHub。

仓库地址：

https://github.com/lvzhangyu505/gushen.git

当前分支：

```text
main
```

当前最新提交：

```text
b1f9c49 Redesign investment research workspace UI
```

### 2.6 Vercel 线上部署

已部署到 Vercel，并确认生产部署状态为 `READY`。

线上地址：

https://frontend-ashen-psi-30.vercel.app

Vercel 项目信息：

```text
Project: frontend
Project ID: prj_pFT0zS6kpi9dBRyhvNH4haw73TsY
Latest Deployment: dpl_52qBubZxo7N9eqzeDK9KNjSbSwd8
```

## 3. 当前技术栈

### 前端

- Next.js
- React
- TypeScript
- Tailwind CSS
- lucide-react 图标
- pnpm

### 后端规划

- Python
- FastAPI
- Pydantic
- SQLAlchemy 或 SQLModel
- PostgreSQL
- pgvector

### AI 架构规划

- RAG
- 多 Agent
- 统一 Signal schema
- Orchestrator 仲裁
- 合规审查 Agent

### 调度规划

- MVP 阶段：APScheduler
- 后续扩展：Celery

## 4. 当前产品状态

当前已经完成：

- 产品方向确定
- 文档体系完成
- 前端原型完成
- UI 初步优化完成
- GitHub 仓库建立并推送
- Vercel 线上预览完成

当前尚未完成：

- FastAPI 后端真实服务
- `/api/v1/analyze-stock` 分析接口
- 7 个专家 Agent 的真实实现
- Orchestrator 仲裁逻辑
- 前端与后端联调
- PostgreSQL 数据库和 pgvector
- 真实数据源采集
- RAG 检索与证据链生成
- 登录、用户体系和权限
- 自动日报生成任务

## 5. 当前 UI 设计方向

当前 UI 不再做普通营销页或轻量看板，而是偏向专业投研终端：

- 左侧固定导航
- 高密度信息布局
- 第一屏突出股票分析入口
- 深色仲裁卡突出最终研究结论
- 表格化展示专家 Agent 结果
- 信号方向使用颜色区分：
  - 偏多：绿色
  - 中性：灰色
  - 偏空：红色
- 风险提示使用橙色或红色
- 建议页面固定显示免责声明

## 6. 合规要求

项目持续遵守以下合规边界：

- 不能做券商接口
- 不能做交易 API
- 不能做账户同步
- 不能下单
- 不能撤单
- 不能自动交易
- 不能托管资金账户
- 不能输出“必须买入”“必须卖出”“保证收益”等确定性指令
- 所有建议必须有证据链
- 无证据时返回：`信息不足，无法形成建议。`
- 所有建议与日报页面必须显示免责声明：

> 本系统仅用于个人研究辅助，不构成确定性投资承诺。

## 7. 下一阶段建议

下一步建议从“静态 UI”进入“可运行 MVP”。

推荐开发顺序：

1. 建立 FastAPI 后端骨架。
2. 新增 `/api/v1/analyze-stock` 接口。
3. 定义统一 Signal schema。
4. 实现 7 个专家 Agent 的 mock 版本：
   - FinancialAgent
   - TechnicalAgent
   - FundFlowAgent
   - MacroAgent
   - IndustryAgent
   - SentimentAgent
   - RiskAgent
5. 实现 Orchestrator 仲裁逻辑。
6. 前端“开始分析”按钮接入后端。
7. 前端展示真实返回的 Agent 运行状态和分析结果。
8. 接入第一批真实数据源。
9. 引入 PostgreSQL + pgvector。
10. 开始做 RAG 证据检索。

## 8. 下一阶段目标定义

建议把下一阶段目标定义为：

> 输入“兴森科技 / 002436” -> 后端运行 7 个专家 Agent -> 返回标准 Signal -> Orchestrator 给出研究建议 -> 前端动态展示结果、风险和证据。

这一步完成后，系统就会从“产品原型”进入“真正可运行的 AI 投研 Agent MVP”。

## 9. 重要链接

GitHub 仓库：

https://github.com/lvzhangyu505/gushen.git

Vercel 线上预览：

https://frontend-ashen-psi-30.vercel.app

参考 PDF：

`Work Buddy使用Rena 简易流程0524(6)(1).pdf`
