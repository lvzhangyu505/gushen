# 任务包 05：异步任务状态与 SSE

## 目标

把同步 mock 分析升级为异步任务体验：点击开始分析后立即返回 task_id，前端可以看到每个 Agent 的运行状态，后续支持 SSE 流式刷新。

## 范围

需要做：

- 设计任务状态机：
  - `pending`
  - `running`
  - `completed`
  - `failed`
  - `partial`
- 为每个 Agent 保存运行状态、开始时间、结束时间、错误信息。
- 后端 `POST /api/v1/analysis-tasks` 立即返回 task_id。
- 后端后台执行 7 个 Agent 和 Orchestrator。
- 先支持轮询接口：
  - `GET /api/v1/analysis-tasks/{task_id}`
- 增加 SSE 接口：
  - `GET /api/v1/analysis-tasks/{task_id}/events`
- 前端优先使用 SSE；如果暂时复杂，可以先轮询，但代码结构要方便替换。
- Agent 失败时不让整个任务崩溃，除非 RiskAgent 失败或失败数量超过规则阈值。
- Orchestrator 对 partial 结果降低可信度。

不需要做：

- 不接 Celery。
- 不做分布式 worker。
- 不接真实数据源。

## 验收标准

- 创建任务后，接口立即返回。
- 前端可以看到 Agent 从 pending/running 到 completed/failed 的变化。
- 单个非关键 Agent 失败时，最终结果标记 partial 并显示缺失信息。
- RiskAgent 失败时，系统不强行给出稳定研究判断。
- SSE 或轮询流程有测试覆盖。

## 建议开线程提示词

```text
请执行 docs/task-packages/05-async-task-status-and-sse.md。

目标是把现有分析接口升级为异步状态机，并让前端逐步显示 Agent 状态。优先做可验证的轮询，条件允许再加入 SSE。保持合规输出。
```

