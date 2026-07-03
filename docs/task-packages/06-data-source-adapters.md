# 任务包 06：合法数据源 Adapter 与缓存

## 目标

建立数据源适配器层，先接入合法公开或用户手动提供的数据，避免把具体供应商写死在核心业务逻辑里。

## 合规边界

- 只能使用 lawful public APIs、授权数据源、用户提供文件、手动输入信息。
- 不绕过 paywall。
- 不抓取受限系统。
- 不接券商账户。
- 不接交易接口。

## 范围

需要做：

- 在 `backend/app/data_sources/` 下建立 adapter 抽象。
- 定义统一接口：
  - 股票基础信息查询。
  - 行情快照查询。
  - 公告/新闻/政策/行业文档拉取。
  - 财务摘要拉取或导入。
  - 数据源健康检查。
- 增加 mock adapter 或 file adapter，用于本地测试。
- 每个数据源记录：
  - 授权状态。
  - endpoint 类型。
  - refresh frequency。
  - terms-of-use notes。
- 增加缓存表或缓存策略：
  - `market_snapshots`
  - `financial_reports`
  - `documents`
  - `system_health_checks`
- 数据源异常时返回缺失信息，不让系统编造数据。
- 更新 `docs/data-pipeline.md`。

不需要做：

- 不追求一次接入全部真实数据源。
- 不做实时全链路爬取。
- 不做全市场自动扫股。

## 验收标准

- 核心业务代码不依赖具体 vendor 名称。
- 可以通过 mock/file adapter 跑通股票基础信息和文档导入。
- 每个数据源都有授权说明文档。
- 数据源失败时，分析结果显示缺失信息。
- 测试覆盖 adapter 成功和失败路径。

## 建议开线程提示词

```text
请执行 docs/task-packages/06-data-source-adapters.md。

请建立 data source adapter 抽象，先实现 mock/file adapter 和健康检查，不要绕过任何限制，不要接券商账户或交易接口。完成后更新 docs/data-pipeline.md。
```

