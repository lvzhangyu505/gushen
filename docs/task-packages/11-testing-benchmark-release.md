# 任务包 11：测试、自检与发布验收

## 目标

补齐后端测试、RAG 证据测试、前端免责声明检查、合规扫描和启动自检脚本，让 MVP 进入可稳定迭代状态。

## 范围

需要做：

- 后端测试：
  - watchlist CRUD。
  - evidence requirements。
  - suggestion enum validation。
  - risk alert creation。
  - report generation。
  - analysis task lifecycle。
- RAG 测试：
  - unsupported suggestion 被拒绝。
  - 只有 C/D 级证据时返回信息不足。
  - 每个 Agent 证据数量不超过限制。
- 合规测试：
  - forbidden phrases 扫描。
  - 最终输出必须包含免责声明。
  - 仓位、目标价、保证收益表达被拦截。
- 前端测试或检查：
  - suggestions 页面展示免责声明。
  - daily reports 展示免责声明。
  - stock research cards 展示免责声明。
  - 后端异常时页面不崩溃。
- 脚本：
  - `scripts/compliance_scan.sh`
  - `scripts/benchmark_startup.py`
  - `scripts/dev.sh`
- `benchmark_startup.py` 检查：
  - 数据库连接。
  - pgvector 可用。
  - 模型 API 配置或降级状态。
  - 7 个 Agent 可运行。
  - Orchestrator 可生成结果。
  - ComplianceGuard 可拦截违规表达。
  - mock 数据跑通完整分析链路。

不需要做：

- 不追求生产级监控。
- 不做复杂 CI/CD。
- 不上线付费或多用户系统。

## 验收标准

- 后端测试通过。
- 前端 lint/type check/test 通过或明确记录暂未配置的原因。
- 合规扫描未发现交易、券商账户、下单、撤单、自动交易相关能力。
- 启动自检脚本能输出清晰结果。
- README 记录本地启动、测试和自检命令。

## 建议开线程提示词

```text
请执行 docs/task-packages/11-testing-benchmark-release.md。

请为当前 MVP 补齐测试、自检脚本和合规扫描。重点验证免责声明、证据要求、禁止交易能力和 mock 分析链路。完成后更新 README 的启动与验收说明。
```

