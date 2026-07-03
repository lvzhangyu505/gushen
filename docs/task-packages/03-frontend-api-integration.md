# 任务包 03：前端接入后端 Mock API

## 目标

把当前静态 Next.js 投研台改造成可交互页面：用户输入股票代码或名称，点击开始分析，调用后端 mock API，并动态展示 7 个 Agent 和 Orchestrator 结果。

## 当前状态

当前 `frontend/app/page.tsx` 是静态 mock 页面，已经有：

- 股票输入入口视觉区域。
- “开始分析”按钮。
- 7 个专家 Agent 表格。
- Orchestrator 仲裁卡。
- 证据链、风险提醒、免责声明。

本任务应复用现有视觉布局，尽量少做大改版。

## 范围

需要做：

- 新增前端 API client，例如 `frontend/lib/api.ts`。
- 新增前端类型定义，例如 `frontend/lib/types.ts`。
- 将股票输入框改成真实输入控件。
- 增加分析周期选择：短线 / 中期 / 长期。
- 点击“开始分析”时调用：
  - `POST /api/v1/analysis-tasks`
  - 然后 `GET /api/v1/analysis-tasks/{task_id}` 获取结果。
- 显示加载状态、成功状态、失败状态。
- 用后端结果渲染：
  - 7 个 Agent 状态或结果。
  - 方向、置信度、权重。
  - 核心证据和反方证据。
  - Orchestrator 最终研究卡。
  - 风险点、分歧点、缺失信息、下一步观察点。
  - 免责声明。
- 后端不可用时，给出清晰错误，不让页面崩溃。
- 配置本地 API 地址，优先用环境变量，例如 `NEXT_PUBLIC_API_BASE_URL`。

不需要做：

- 不做 SSE。
- 不做用户登录。
- 不做真实数据源。
- 不改为营销页。

## 验收标准

- 前端 dev server 可启动。
- 后端 dev server 可启动。
- 输入 `002436` 后，页面能展示后端返回的 mock 分析结果。
- 后端关闭时，前端显示错误提示。
- 页面始终显示免责声明。
- 不出现买入、卖出、仓位、目标价等违规表达。
- 前端 lint 或 type check 通过。

## 建议开线程提示词

```text
请执行 docs/task-packages/03-frontend-api-integration.md。

目标是复用当前前端页面，把静态 mock 改为调用后端 mock API。请不要大幅重做视觉设计，不要加入交易功能。完成后同时启动前后端验证一次输入 002436 的完整流程。
```

