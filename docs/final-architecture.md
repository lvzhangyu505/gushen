# Gushen｜AI 投研 Agent 平台最终规划文档

更新时间：2026-07-03  
阶段定位：从静态 Mock 原型进入可运行 MVP  
适用对象：个人自用 AI 股票研究助手 / AI 投研工作台  
当前版本：Final Planning v1.0

---

## 0. 项目上下文摘要

Gushen 当前已经完成了产品方向、文档体系、前端原型、GitHub 仓库和 Vercel 线上预览。现有项目基础包括：

- 前端：Next.js、React、TypeScript、Tailwind CSS、lucide-react、pnpm。
- 后端规划：Python、FastAPI、Pydantic、SQLAlchemy/SQLModel。
- 数据库规划：PostgreSQL + pgvector。
- AI 架构规划：RAG、多 Agent、统一 Signal Schema、Orchestrator 仲裁、合规审查 Agent。
- 当前产品形态：AI 投研分析台，包括股票输入入口、7 个专家 Agent Signal 表、Orchestrator 仲裁结果、证据链、风险提醒、投研日报和合规免责声明。
- 参考方案：WorkBuddy / Rena 多 Agent 股票分析流程，核心思路是输入股票名称或代码后，由 7 个专家 Skill / Agent 进行分析并输出 Signal。

本最终版文档将现有项目想法、Rena/WorkBuddy 参考方案、Gemini 的工程落地建议，以及补充的产品逻辑、合规边界、证据系统、复盘机制进行合并，形成可交给 Codex 继续开发的统一规划文档。

---

## 1. 项目最终定位

### 1.1 一句话定义

> Gushen 是一个面向个人投资者的 AI 股票研究工作台：围绕自选股自动收集可信信息，通过多 Agent 分析、证据链追踪、风险校验、分歧解释与历史复盘，辅助用户形成更清晰的研究判断。

### 1.2 项目不是交易系统

Gushen 明确不是券商交易系统，也不是自动交易系统。

系统必须遵守以下边界：

- 不接入券商账户。
- 不接入交易 API。
- 不做账户同步。
- 不自动下单。
- 不自动撤单。
- 不托管任何资金账户。
- 不给出“必须买入”“必须卖出”“保证收益”等确定性指令。
- 不输出具体仓位建议，例如“建议仓位 30%”。
- 不输出明确买入点位、卖出点位、目标价承诺。
- 不替用户做最终投资决策。
- 所有输出仅用于个人研究辅助。

统一免责声明：

> 本系统仅用于个人研究辅助，不构成证券投资咨询意见，不构成确定性投资承诺，不能替代用户独立判断。

### 1.3 产品定位从“投资建议平台”调整为“投研辅助工作台”

原定位：

> 信息收集 + 投资研究 + 决策辅助

最终调整为：

> 信息收集 + 多维研究 + 证据追踪 + 风险校验 + 分歧解释 + 历史复盘

关键区别：

- 不强调“让 AI 给我买卖建议”。
- 强调“让 AI 帮我看清信息、矛盾、风险和观察重点”。
- Orchestrator 不是交易决策器，而是信号合成器、矛盾解释器、风险校验器。

---

## 2. 默认投资研究边界

### 2.1 默认研究市场

MVP 阶段只支持：

- A 股。
- 单只股票查询。
- 用户手动输入股票代码或股票名称。
- 用户自选股研究。
- 事件驱动型研究。
- 日报、提醒和复盘围绕用户自选股展开。

MVP 阶段暂不支持：

- 港股、美股、基金、期货、期权、外汇、加密资产。
- 全市场自动扫股。
- 高频交易。
- 日内盘口交易。
- 自动组合调仓。
- 自动跟单。
- 自动执行交易。

### 2.2 默认分析周期

系统必须在每次分析中明确分析周期。不同周期不能混用。

默认周期：

| 周期 | 时间范围 | 适用问题 |
|---|---:|---|
| 短线 | 3—10 个交易日 | 量价、资金、舆情、短期事件 |
| 中期 | 1—3 个月 | 行业景气、财报预期、政策影响 |
| 长期 | 6 个月以上 | 公司基本面、产业趋势、长期风险 |

所有 Agent Signal 必须包含 `time_horizon` 字段。  
Orchestrator 最终输出必须说明当前判断主要适用于哪个周期。

### 2.3 研究对象类型

MVP 支持以下研究对象：

- 用户自选股。
- 热点题材相关股票。
- 财报/公告驱动股票。
- 政策/行业事件影响股票。
- 用户临时输入的单只股票。

---

## 3. 核心用户流程

### 3.1 单只股票分析流程

```text
用户输入股票名称或代码
        ↓
后端创建 analysis_task
        ↓
返回 task_id
        ↓
前端进入分析中状态
        ↓
系统读取股票基础信息、行情快照、公告、新闻、财务、行业、舆情、风险数据
        ↓
7 个专家 Agent 并行或准并行运行
        ↓
每个 Agent 输出标准 ExpertSignal
        ↓
Orchestrator 聚合信号、处理冲突、计算分歧度、触发风险校验
        ↓
生成 ResearchResult
        ↓
前端展示最终研究卡、专家信号表、证据链、风险提醒、缺失信息
        ↓
保存历史分析记录
        ↓
后续进入复盘系统
```

### 3.2 自选股日报流程

```text
系统定时扫描自选股
        ↓
抓取公告、新闻、行情、资金、行业、政策、舆情变化
        ↓
判断是否存在重大变化
        ↓
生成每日投研日报
        ↓
按股票展示：新增信息、核心变化、风险变化、需要重新分析的股票
```

### 3.3 触发式提醒流程

```text
自选股出现异常事件
        ↓
系统识别触发条件
        ↓
生成提醒
        ↓
提示用户是否重新运行相关 Agent
```

触发条件包括：

- 发布重大公告。
- 发布财报或业绩预告。
- 股价异常波动。
- 成交量异常放大。
- 资金连续流入或流出。
- 所属行业出现重大政策变化。
- 舆情突然升温或转负。
- 风险新闻出现。
- 原研究结论的失效条件被触发。

---

## 4. 多 Agent 架构

### 4.1 7 个专家 Agent

系统保留 Rena / WorkBuddy 的 7 个专家方向，但重新定义职责和输出边界。

| Agent | 中文名称 | 核心任务 | 主要数据 | 是否必须用 LLM |
|---|---|---|---|---|
| FinancialAgent | 财务专家 | 分析营收、利润、现金流、负债、ROE、毛利率、业绩变化 | 财报、公告、财务指标 | 可用轻量模型或规则 |
| TechnicalAgent | 技术指标专家 | 分析趋势、均线、成交量、波动率、支撑压力 | 行情、K线、成交量 | 不需要 LLM，优先 Python |
| FundFlowAgent | 资金流专家 | 分析主力资金、北向资金、成交活跃度、量能变化 | 资金流、成交数据 | 不需要 LLM，优先 Python |
| MacroAgent | 宏观专家 | 分析宏观政策、利率、流动性、监管环境 | 政策、宏观新闻、官方信息 | 需要长文本理解模型 |
| IndustryAgent | 行业专家 | 分析行业景气度、产业链位置、行业政策、竞争格局 | 行业数据、研报摘要、政策 | 可用轻量或中等模型 |
| SentimentAgent | 舆情专家 | 分析新闻情绪、市场关注度、社媒热度、负面信息 | 新闻、舆情、互动平台 | 需要文本分类/总结模型 |
| RiskAgent | 风险专家 | 检测财务风险、监管风险、退市风险、诉讼风险、暴雷风险 | 公告、监管、财报、新闻 | 建议使用强推理模型 |

### 4.2 Agent 输出原则

每个 Agent 只能输出结构化 Signal，不能直接输出买卖结论。

禁止 Agent 输出：

- 建议买入。
- 建议卖出。
- 满仓。
- 梭哈。
- 目标价。
- 必须持有。
- 具体仓位比例。
- 保证上涨。
- 保证收益。

允许 Agent 输出：

- 偏多 / 中性 / 偏空。
- 置信度。
- 权重。
- 核心证据。
- 反方证据。
- 缺失信息。
- 风险标记。
- 分析周期。
- 数据更新时间。
- 判断假设。

---

## 5. 统一 Signal Schema

### 5.1 ExpertSignal 数据结构

建议在后端使用 Pydantic 定义统一结构。

```python
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import datetime

SignalDirection = Literal["bullish", "neutral", "bearish"]
TimeHorizon = Literal["short", "mid", "long"]
EvidenceGrade = Literal["S", "A", "B", "C", "D"]
AgentStatus = Literal["pending", "running", "completed", "failed", "partial"]

class EvidenceItem(BaseModel):
    evidence_id: str
    title: str
    summary: str
    source_name: str
    source_type: str
    source_grade: EvidenceGrade
    published_at: Optional[datetime] = None
    url: Optional[str] = None
    quote: Optional[str] = None
    relevance_score: float = Field(..., ge=0, le=1)
    freshness_score: float = Field(..., ge=0, le=1)

class ExpertSignal(BaseModel):
    task_id: str
    stock_code: str
    stock_name: Optional[str] = None

    agent_name: str
    agent_status: AgentStatus

    signal_direction: SignalDirection
    confidence: float = Field(..., ge=0, le=1)
    weight: float = Field(..., ge=0, le=1)
    time_horizon: TimeHorizon

    core_evidence: List[EvidenceItem] = Field(default_factory=list, max_items=3)
    negative_evidence: List[EvidenceItem] = Field(default_factory=list, max_items=3)

    risk_flags: List[str] = Field(default_factory=list)
    missing_info: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)

    data_timestamp: Optional[datetime] = None
    generated_at: datetime
    expires_at: Optional[datetime] = None

    conclusion_summary: str
```

### 5.2 OrchestratorResult 数据结构

```python
from typing import Dict

ResearchGrade = Literal[
    "A_focus_tracking",
    "B_observe",
    "C_insufficient_info",
    "D_risk_elevated",
    "E_stop_tracking"
]

class DivergenceItem(BaseModel):
    topic: str
    bullish_agents: List[str] = Field(default_factory=list)
    bearish_agents: List[str] = Field(default_factory=list)
    explanation: str

class OrchestratorResult(BaseModel):
    task_id: str
    stock_code: str
    stock_name: Optional[str] = None

    research_grade: ResearchGrade
    primary_time_horizon: TimeHorizon

    overall_direction: SignalDirection
    confidence: float = Field(..., ge=0, le=1)

    convergence_score: float = Field(..., ge=0, le=1)
    divergence_score: float = Field(..., ge=0, le=1)

    key_supporting_points: List[str] = Field(default_factory=list, max_items=5)
    key_risk_points: List[str] = Field(default_factory=list, max_items=5)
    key_divergences: List[DivergenceItem] = Field(default_factory=list)

    evidence_summary: List[EvidenceItem] = Field(default_factory=list, max_items=8)
    missing_info: List[str] = Field(default_factory=list)

    invalidation_conditions: List[str] = Field(default_factory=list)
    next_observation_points: List[str] = Field(default_factory=list)

    compliance_disclaimer: str
    generated_at: datetime
```

---

## 6. 证据链与可信度体系

### 6.1 证据等级

所有证据必须分级。

| 等级 | 来源类型 | 使用规则 |
|---|---|---|
| S 级 | 交易所公告、上市公司公告、定期报告、监管文件 | 可作为主要结论依据 |
| A 级 | 官方政策、权威财经媒体、行业协会数据 | 可作为主要结论依据 |
| B 级 | 券商研报摘要、机构观点、行业数据库 | 可作为辅助结论依据 |
| C 级 | 普通财经新闻、互动平台、社交舆情 | 只能作为情绪或事件参考 |
| D 级 | 论坛传闻、短视频观点、未经验证消息 | 不得作为投资研究结论依据 |

Orchestrator 规则：

- 主要结论只能基于 S/A/B 级证据。
- C 级证据只能作为舆情和市场热度参考。
- D 级证据默认不进入最终结论。
- 如果只有 C/D 级证据，则必须输出：`信息不足，无法形成稳定研究判断。`

### 6.2 级联式 RAG

为避免 7 个 Agent 输出大量碎片化证据，采用级联式 RAG。

```text
原始数据源
    ↓
Document / Chunk 入库
    ↓
Agent 级检索
    ↓
每个 Agent 只提炼最多 3 条核心证据 + 3 条反方证据
    ↓
Orchestrator 只读取各 Agent 的结构化 Signal 和精选证据
    ↓
前端默认展示精简结论
    ↓
用户点击后展开原始证据链
```

### 6.3 证据展示规则

前端展示层级：

1. 最终研究结论。
2. 主要支持证据。
3. 主要风险证据。
4. 专家 Agent 分歧点。
5. 原始证据展开。
6. 数据缺失提示。
7. 免责声明。

---

## 7. Orchestrator 仲裁逻辑

### 7.1 Orchestrator 的定位

Orchestrator 不做交易决策。  
Orchestrator 的角色是：

- 信号合成器。
- 矛盾显性化工具。
- 风险校验器。
- 证据整合器。
- 合规表达控制器。

### 7.2 三层仲裁流程

```text
第一层：数据有效性检查
    - 数据是否过期
    - 是否缺少公告、财报、行情关键数据
    - 是否存在重大风险未覆盖
    - 证据等级是否足够支撑结论

第二层：多 Agent 冲突处理
    - 财务与技术冲突：标记为“基本面与短期走势分歧”
    - 行业与公司财务冲突：标记为“行业强/公司弱”或“行业弱/公司强”
    - 舆情与风险冲突：优先采纳 RiskAgent
    - 资金与基本面冲突：标记为“短期资金行为与中期基本面错配”

第三层：合规输出控制
    - 禁止买卖指令
    - 禁止仓位建议
    - 禁止保证收益
    - 信息不足时返回“信息不足，无法形成稳定研究判断”
```

### 7.3 RiskAgent 一票降级权

RiskAgent 具备一票降级权。

触发条件：

- RiskAgent 输出 `bearish`。
- 置信度大于等于 0.85。
- 风险类型属于重大财务、监管、退市、诉讼、立案调查、重大违约、业绩暴雷、大股东爆仓等。

触发结果：

- Orchestrator 必须将最终结论降级。
- 最终卡片顶部显示风险提醒。
- 即便其他 Agent 偏多，也不得输出“重点跟踪”级别。
- 输出格式应强调风险，而不是强行给出方向。

### 7.4 动态权重与时效性衰减

不同 Agent 的数据时间颗粒度不同：

| Agent | 数据频率 | 默认衰减 |
|---|---|---|
| FinancialAgent | 季度 / 年度 | 慢衰减 |
| IndustryAgent | 月度 / 季度 | 中慢衰减 |
| MacroAgent | 周 / 月 | 中等衰减 |
| TechnicalAgent | 日 / 分钟 | 快衰减 |
| FundFlowAgent | 日 / 分钟 | 快衰减 |
| SentimentAgent | 分钟 / 小时 | 极快衰减 |
| RiskAgent | 事件驱动 | 风险事件长期有效 |

动态权重场景：

| 场景 | 权重调整 |
|---|---|
| 财报披露期 | FinancialAgent、IndustryAgent 权重上升 |
| 股价或成交量异常波动 | TechnicalAgent、FundFlowAgent 权重上升 |
| 政策密集期 | MacroAgent、IndustryAgent 权重上升 |
| 负面舆情爆发 | SentimentAgent、RiskAgent 权重上升 |
| 出现重大风险公告 | RiskAgent 权重最高，并触发降级 |

### 7.5 分歧度输出

当多空信号严重对立时，Orchestrator 不应强行给出单一方向，而应输出：

```text
当前个股存在高分歧：
- 财务与行业偏多
- 资金与舆情偏空
- 风险 Agent 发现若干不确定因素

核心矛盾：
短期资金行为与中期基本面判断不一致。

研究处理：
暂不形成强方向结论，建议继续观察指定验证条件。
```

---

## 8. 研究结论分级

为了避免直接输出买入/卖出/持有，系统使用研究辅助分级。

| 等级 | 名称 | 含义 |
|---|---|---|
| A | 重点跟踪 | 多数高可信证据支持，风险可控，但不构成买入建议 |
| B | 可以继续观察 | 存在一定支持信号，但仍需等待验证 |
| C | 信息不足 | 证据不足、数据缺失或分歧过高，暂不形成判断 |
| D | 风险升高 | 存在明显风险，需要谨慎观察 |
| E | 不建议继续跟踪 | 风险较高、证据恶化或研究价值较低 |

前端展示示例：

```text
最终结论：B｜可以继续观察
主要周期：中期
方向判断：短期中性偏多，中期中性
核心原因：行业信息改善，但财务确认不足
主要风险：资金波动较大，缺少最新公告验证
下一步观察：等待财报、订单、政策或成交量变化确认
免责声明：本系统仅用于个人研究辅助，不构成证券投资咨询意见。
```

---

## 9. 后端工程架构

### 9.1 总体架构

```text
Frontend: Next.js / React / Tailwind
        ↓
Backend: FastAPI
        ↓
Task Layer: BackgroundTasks / APScheduler / 后续 Celery
        ↓
Agent Layer: 7 Expert Agents + Orchestrator + ComplianceGuard
        ↓
ModelRouter: 按任务选择模型或纯规则计算
        ↓
Data Layer: PostgreSQL + pgvector
        ↓
Data Pipeline: 公告 / 财报 / 新闻 / 行情 / 行业 / 舆情 / 风险
```

### 9.2 异步任务与流式刷新

不建议使用单一同步接口等待全部 Agent 运行结束。  
建议采用两阶段接口：

```text
POST /api/v1/analysis-tasks
    → 创建分析任务
    → 立即返回 task_id

GET /api/v1/analysis-tasks/{task_id}/events
    → SSE 流式返回每个 Agent 的运行状态

GET /api/v1/analysis-tasks/{task_id}
    → 查询任务最终结果
```

### 9.3 SSE 交互流程

```text
[用户点击开始分析]
        ↓
POST /api/v1/analysis-tasks
        ↓
后端返回 task_id
        ↓
前端打开 SSE 连接
        ↓
FinancialAgent completed → 前端财务行亮起
TechnicalAgent completed → 前端技术行亮起
FundFlowAgent completed → 前端资金行亮起
MacroAgent completed → 前端宏观行亮起
IndustryAgent completed → 前端行业行亮起
SentimentAgent completed → 前端舆情行亮起
RiskAgent completed → 前端风险行亮起
        ↓
Orchestrator completed
        ↓
最终研究卡片解锁
```

MVP 第一版可以先用轮询替代 SSE，后续升级为 SSE。

---

## 10. ModelRouter 模型路由

### 10.1 原则

不能让所有 Agent 都调用最强、最贵的大模型。  
应按任务类型分层：

| 层级 | 任务 | 推荐策略 |
|---|---|---|
| 规则计算层 | 技术指标、资金指标、涨跌幅、成交量 | 不调用 LLM，使用 Python |
| 信息抽取层 | 财务指标、公告摘要、行业摘要 | 使用低成本模型 |
| 长文本理解层 | 宏观政策、舆情情感、新闻聚合 | 使用长上下文模型 |
| 强推理层 | Orchestrator、RiskAgent、ComplianceGuard | 使用强推理模型 |

### 10.2 模型配置不要写死

文档中不锁死具体模型名称。  
推荐配置方式：

```env
MODEL_LIGHT=xxx
MODEL_LONG_CONTEXT=xxx
MODEL_REASONING=xxx
MODEL_COMPLIANCE=xxx
```

后端通过 `ModelRouter` 读取配置：

```python
class ModelRouter:
    def select_model(self, task_type: str) -> str:
        if task_type in ["technical", "fund_flow"]:
            return "NO_LLM"
        if task_type in ["financial_extract", "industry_extract"]:
            return settings.MODEL_LIGHT
        if task_type in ["sentiment", "macro"]:
            return settings.MODEL_LONG_CONTEXT
        if task_type in ["risk", "orchestrator", "compliance"]:
            return settings.MODEL_REASONING
        return settings.MODEL_LIGHT
```

---

## 11. 数据管道与缓存策略

### 11.1 不做实时全链路爬取

错误方式：

```text
用户输入股票
    ↓
实时爬公告
    ↓
实时爬新闻
    ↓
实时 embedding
    ↓
实时写入 pgvector
    ↓
实时检索
    ↓
实时调用 7 个 Agent
```

这种方式耗时不可控。

### 11.2 推荐方式：盘前预处理 + 盘中增量更新

```text
盘前 / 定时任务
    ↓
批量更新自选股公告、新闻、财务、行业、风险信息
    ↓
清洗与结构化
    ↓
Embedding
    ↓
写入 PostgreSQL + pgvector
    ↓
用户点击分析时优先查本地索引
```

### 11.3 数据更新频率

| 数据类型 | 更新频率 | 存储方式 |
|---|---|---|
| 股票基础信息 | 每周或手动更新 | PostgreSQL |
| 财报数据 | 财报发布后更新 | PostgreSQL |
| 公告数据 | 每日 / 每小时 | PostgreSQL + pgvector |
| 新闻数据 | 每小时 / 每数小时 | PostgreSQL + pgvector |
| 行业数据 | 每周 / 每月 | PostgreSQL |
| 行情数据 | 分析时获取最新快照 | PostgreSQL 缓存 |
| 舆情数据 | 每小时 / 触发式 | PostgreSQL + pgvector |
| 风险事件 | 事件驱动 | PostgreSQL + pgvector |

### 11.4 响应时间预期

不写死“必须 5 秒”。

建议目标：

| 场景 | 目标响应 |
|---|---|
| 已缓存数据 + mock Agent | 1—3 秒 |
| 已缓存数据 + 部分真实 Agent | 5—15 秒 |
| 完整真实 Agent + RAG | 15—60 秒 |
| 数据源异常 | 返回部分结果，并标记缺失数据 |

---

## 12. 数据库设计建议

### 12.1 核心表

```text
stocks
watchlist
market_snapshots
financial_reports
documents
document_chunks
evidence_items
analysis_tasks
expert_signals
orchestrator_results
research_reviews
trigger_alerts
system_health_checks
```

### 12.2 表说明

| 表名 | 作用 |
|---|---|
| `stocks` | 股票基础信息 |
| `watchlist` | 用户自选股 |
| `market_snapshots` | 行情快照 |
| `financial_reports` | 财报结构化数据 |
| `documents` | 公告、新闻、研报摘要、政策文件 |
| `document_chunks` | RAG 文档切片和向量 |
| `evidence_items` | Agent 使用过的证据 |
| `analysis_tasks` | 每次分析任务 |
| `expert_signals` | 7 个 Agent 的结构化输出 |
| `orchestrator_results` | 仲裁结果 |
| `research_reviews` | 历史复盘记录 |
| `trigger_alerts` | 触发式提醒 |
| `system_health_checks` | 系统自检记录 |

---

## 13. API 设计建议

### 13.1 分析任务 API

```http
POST /api/v1/analysis-tasks
```

请求：

```json
{
  "stock_input": "002436",
  "time_horizon": "mid",
  "analysis_mode": "standard"
}
```

响应：

```json
{
  "task_id": "task_20260703_000001",
  "status": "processing"
}
```

### 13.2 SSE 事件 API

```http
GET /api/v1/analysis-tasks/{task_id}/events
```

事件示例：

```json
{
  "event": "agent_completed",
  "agent_name": "FinancialAgent",
  "status": "completed",
  "signal_direction": "neutral",
  "confidence": 0.68
}
```

### 13.3 查询任务结果

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
  "created_at": "2026-07-03T09:30:00"
}
```

### 13.4 其他 API

```text
GET  /api/v1/watchlist
POST /api/v1/watchlist
DELETE /api/v1/watchlist/{stock_code}

GET  /api/v1/research-history
GET  /api/v1/research-history/{task_id}

GET  /api/v1/alerts
POST /api/v1/alerts/{alert_id}/mark-read

GET  /api/v1/daily-report
GET  /api/v1/system-health
```

---

## 14. 前端页面结构

### 14.1 页面模块

| 页面 | 功能 |
|---|---|
| Dashboard | 总览、自选股、系统状态、今日提醒 |
| Analyze | 单只股票输入与分析 |
| Agent Signals | 7 个专家 Agent 运行状态与信号 |
| Research Result | Orchestrator 最终研究卡 |
| Evidence Chain | 证据链展开 |
| Risk Center | 风险事件与风险等级 |
| Daily Report | 每日投研日报 |
| Review | 历史复盘 |
| Settings | 模型、数据源、合规配置 |

### 14.2 Analyze 页面第一版

必须包括：

- 股票名称 / 代码输入框。
- 分析周期选择：短线 / 中期 / 长期。
- “开始分析”按钮。
- 7 个 Agent 状态表。
- 每个 Agent 的方向、置信度、权重、核心依据。
- Orchestrator 最终卡片。
- 主要证据。
- 主要风险。
- 缺失信息。
- 下一步观察。
- 合规免责声明。

### 14.3 Agent 状态展示

状态包括：

- pending：未开始。
- running：分析中。
- completed：完成。
- failed：失败。
- partial：部分完成。

Agent 出错时，不能让整个页面崩溃。  
应展示：

```text
SentimentAgent 当前不可用，本次结论未纳入舆情分析，最终可信度已下调。
```

---

## 15. 合规审查机制

### 15.1 ComplianceGuard

新增 `ComplianceGuard`，在 Orchestrator 输出后进行文本审查。

需要拦截的表达：

- 建议买入。
- 建议卖出。
- 强烈买入。
- 满仓。
- 梭哈。
- 必须持有。
- 仓位 30%。
- 目标价 XX 元。
- 保证收益。
- 一定上涨。
- 无风险。
- 稳赚。

### 15.2 替代表达

将高风险表达替换为：

| 禁止表达 | 替代表达 |
|---|---|
| 建议买入 | 可列入重点跟踪 |
| 建议卖出 | 风险升高，需谨慎观察 |
| 持有 | 可以继续观察 |
| 仓位 30% | 不提供仓位建议 |
| 目标价 | 后续观察区间由用户自行判断 |
| 一定上涨 | 存在不确定性，需结合后续信息验证 |

### 15.3 信息不足规则

如果满足任一条件，必须输出“信息不足”：

- 关键数据缺失。
- 只有 C/D 级证据。
- 7 个 Agent 中超过 3 个失败。
- RiskAgent 未运行成功。
- 数据明显过期。
- 多空分歧极高且无高可信证据支撑。

标准输出：

```text
信息不足，无法形成稳定研究判断。当前仅展示已获得的信息与主要风险点。
```

---

## 16. 历史复盘系统

### 16.1 为什么必须做复盘

AI 投研系统不能只生成分析，还要知道自己过去判断得是否有效。  
没有复盘，只是 AI 报告生成器。  
有复盘，才是可持续校准的投研工作台。

### 16.2 每次分析需要保存

```text
股票代码
股票名称
分析时间
当时价格
分析周期
7 个 Agent 的 Signal
Orchestrator 最终分级
核心证据
反方证据
主要风险
缺失信息
失效条件
后续观察点
```

### 16.3 复盘字段

```text
复盘时间
观察周期
后续价格变化
是否触发失效条件
原判断是否有效
误判原因
哪个 Agent 贡献最大
哪个 Agent 噪音最大
是否需要调整权重
```

### 16.4 周复盘报告

每周生成：

- 本周分析过哪些股票。
- 哪些判断方向有效。
- 哪些判断失效。
- 哪些 Agent 经常误判。
- 哪些数据源噪音较大。
- 哪些股票不适合当前模型。
- 下周需要重点观察的股票。

---

## 17. 系统自检机制

### 17.1 启动自检

新增：

```text
scripts/benchmark_startup.py
```

作用：

- 检查数据库连接。
- 检查 pgvector 是否可用。
- 检查模型 API 是否可用。
- 检查 7 个 Agent 是否可运行。
- 检查 Orchestrator 是否可生成结果。
- 检查 ComplianceGuard 是否能拦截违规表达。
- 用 mock 数据跑通 `000001` 或 `002436` 的完整分析链路。

### 17.2 不建议阻断前端

不要因为某个数据源异常就禁止前端打开。  
更合理的方式：

- 前端正常打开。
- 顶部显示系统状态。
- 异常 Agent 灰掉。
- 缺失数据源显示“当前不可用”。
- 最终结果降低可信度。
- 严重异常时不输出最终研究分级。

---

## 18. MVP 开发路线

### Phase 0：文档与结构整理

目标：让 Codex 清楚项目边界和开发顺序。

任务：

- 更新 `README.md`。
- 更新 `AGENTS.md`。
- 更新 `docs/PRD.md`。
- 更新 `docs/ai-agents.md`。
- 更新 `docs/api.md`。
- 更新 `docs/database.md`。
- 更新 `docs/mvp-plan.md`。
- 将本文档放入 `docs/final-architecture.md`。

验收：

- 文档中不再出现“自动交易”“仓位建议”“目标价承诺”等方向。
- Orchestrator 定位改为“信号合成 + 分歧解释 + 风险校验”。

### Phase 1：Mock 闭环

目标：不接真实数据，先跑通完整分析闭环。

任务：

- 创建 FastAPI 后端。
- 创建 Pydantic Schema。
- 创建 7 个 Mock Agent。
- 创建 Mock Orchestrator。
- 创建 ComplianceGuard。
- 创建 `/api/v1/analysis-tasks`。
- 创建轮询式任务状态接口。
- 前端按钮接入后端。
- 前端动态展示 7 个 Agent 状态和最终卡片。

验收：

- 输入 `002436` 后，前端能展示 7 个 Agent 的 mock 结果。
- 最终结果显示研究分级、风险、证据、缺失信息。
- 所有结果保存到本地或数据库。

### Phase 2：异步任务与 SSE

目标：优化用户体验。

任务：

- 后端引入 BackgroundTasks。
- 新增 task 状态机。
- 新增 SSE 接口。
- 前端改为流式刷新。
- Agent 完成后逐行点亮。

验收：

- 点击分析后页面不阻塞。
- 每个 Agent 完成时前端即时刷新。
- Orchestrator 最后解锁。

### Phase 3：真实数据源与基础计算 Agent

目标：先接不依赖 LLM 的数据和计算。

任务：

- 接入股票基础信息。
- 接入行情快照。
- 实现 TechnicalAgent 的真实计算。
- 实现 FundFlowAgent 的真实计算。
- 实现数据缓存表。
- 增加数据更新时间显示。

验收：

- 技术指标和资金指标不再是 mock。
- 返回结果包含数据时间戳。
- 数据过期时前端明确提示。

### Phase 4：RAG 与证据链

目标：让结论有证据。

任务：

- 接入 PostgreSQL + pgvector。
- 创建 documents 和 document_chunks。
- 建立公告、新闻、政策、行业文本入库流程。
- 实现 Agent 级检索。
- 实现证据等级。
- 前端支持证据展开。

验收：

- 每个 Agent 最多返回 3 条核心证据。
- Orchestrator 只引用高价值证据。
- 只有低等级证据时，系统不形成稳定判断。

### Phase 5：RiskAgent 与合规强化

目标：降低错误输出和违规表达风险。

任务：

- 实现 RiskAgent。
- 实现重大风险规则库。
- 实现 Risk Veto。
- 实现 ComplianceGuard 拦截。
- 增加合规测试用例。

验收：

- 出现“建议买入”“仓位”“目标价”等表达时被拦截。
- RiskAgent 高置信偏空时，最终结果自动降级。
- 信息不足时不强行输出方向。

### Phase 6：日报、提醒、复盘

目标：形成长期投研闭环。

任务：

- 实现 watchlist。
- 实现每日自选股扫描。
- 实现触发式提醒。
- 实现历史分析记录。
- 实现周复盘报告。
- 统计 Agent 判断质量。

验收：

- 系统可以生成自选股日报。
- 可以查看历史分析。
- 可以对过去判断进行复盘。
- 可以识别常见误判来源。

---

## 19. 当前不做的功能

为避免 MVP 失控，以下功能暂不做：

- 用户登录体系。
- 多用户权限。
- 付费订阅。
- 券商接入。
- 自动交易。
- 自动调仓。
- 组合管理。
- 高级回测。
- 全市场自动选股。
- 移动端 App。
- 小程序。
- 复杂可视化大屏。

第一阶段目标只有一个：

> 输入单只股票，跑通多 Agent 分析、证据链、风险校验、合规输出和历史保存。

---

## 20. 给 Codex 的下一步开发指令

可以直接复制以下指令给 Codex：

```text
请根据 docs/final-architecture.md 对 Gushen 项目进行第一阶段开发。

目标：
先完成 Phase 1：Mock 闭环。

要求：
1. 不接入真实券商账户。
2. 不实现任何交易、下单、撤单、仓位建议功能。
3. 后端使用 FastAPI。
4. 使用 Pydantic 定义 ExpertSignal、EvidenceItem、OrchestratorResult、AnalysisTask。
5. 创建 7 个 Mock Agent：
   - FinancialAgent
   - TechnicalAgent
   - FundFlowAgent
   - MacroAgent
   - IndustryAgent
   - SentimentAgent
   - RiskAgent
6. 每个 Agent 输出统一 ExpertSignal。
7. 创建 Orchestrator，用于合成信号、解释分歧、输出研究分级，不输出买卖建议。
8. 创建 ComplianceGuard，拦截“建议买入、建议卖出、仓位、目标价、保证收益”等表达。
9. 创建 POST /api/v1/analysis-tasks。
10. 创建 GET /api/v1/analysis-tasks/{task_id}。
11. 前端“开始分析”按钮接入后端。
12. 前端展示 7 个 Agent 的 mock 运行结果、最终研究卡、风险、证据和免责声明。
13. 先使用内存存储或简单 SQLite/PostgreSQL 表保存任务结果，后续再扩展 pgvector。
14. 所有输出必须保留免责声明：
    本系统仅用于个人研究辅助，不构成证券投资咨询意见，不构成确定性投资承诺，不能替代用户独立判断。

验收标准：
输入“002436”后，页面能展示完整 mock 分析结果；
结果包含研究分级、核心证据、反方证据、风险点、缺失信息和下一步观察；
不得出现买入、卖出、仓位、目标价等违规表达。
```

---

## 21. 最终判断

Gushen 的最终方向不应该是“AI 炒股助手”，而应该是：

> AI 投研工作台。

它的核心价值不是替用户决定买卖，而是帮助用户：

- 更快收集信息。
- 更清楚识别证据等级。
- 更系统理解多维信号。
- 更早发现风险。
- 更明确看到分歧。
- 更持续复盘自己的判断。

第一阶段不要追求功能大而全。  
先把“单只股票分析闭环”做扎实：

```text
单只股票输入
    ↓
7 个 Agent 输出结构化 Signal
    ↓
Orchestrator 合成并解释分歧
    ↓
ComplianceGuard 合规校验
    ↓
前端展示研究卡
    ↓
保存历史分析
```

这一步完成后，项目就从“漂亮的静态投研界面”进入“真正可运行的 AI 投研 Agent MVP”。
