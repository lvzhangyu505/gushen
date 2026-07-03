# 任务包 08：真实 Agent 与 ModelRouter

## 目标

在 mock 闭环基础上，逐步替换部分 Agent 为真实规则计算、RAG 分析或 LLM 分析，并通过 ModelRouter 控制模型选择和成本。

## 范围

需要做：

- 增加 `ModelRouter`。
- 通过环境变量配置模型，不把模型名和密钥写死：
  - `MODEL_LIGHT`
  - `MODEL_LONG_CONTEXT`
  - `MODEL_REASONING`
  - `MODEL_COMPLIANCE`
  - `EMBEDDING_MODEL`
- 技术指标和资金流优先用 Python 规则计算，不调用 LLM。
- 财务、行业可先用结构化数据和轻量模型。
- 宏观、舆情使用长文本理解或分类总结模型。
- RiskAgent、Orchestrator、ComplianceGuard 使用更强推理能力或更严格规则。
- 每个 Agent 都必须输出统一 `ExpertSignal`。
- 每个 Agent 都必须包含 `time_horizon`、证据、缺失信息、风险 flags、数据时间戳。

不需要做：

- 不一次性替换全部 Agent。
- 不接交易接口。
- 不输出买卖点、仓位、目标价。

## 推荐替换顺序

1. TechnicalAgent：真实行情序列 + Python 指标。
2. FundFlowAgent：资金流或成交活跃度规则。
3. FinancialAgent：财报结构化摘要。
4. SentimentAgent：新闻和舆情情绪分类。
5. MacroAgent / IndustryAgent：政策和行业文档 RAG。
6. RiskAgent：重大风险规则 + 文档检索。

## 验收标准

- 至少 1-2 个 Agent 不再使用 mock 数据。
- ModelRouter 可以根据 task type 返回模型或 `NO_LLM`。
- 未配置模型时，系统能降级为 mock/规则或返回清晰错误。
- Agent 输出仍通过 schema 校验。
- 结果中明确显示数据时间戳和缺失信息。

## 建议开线程提示词

```text
请执行 docs/task-packages/08-real-agents-and-model-router.md。

请先建立 ModelRouter 和 provider-neutral 接口，再选择最稳妥的 1-2 个 Agent 从 mock 替换为真实规则或 RAG 实现。不要硬编码模型和密钥。
```

