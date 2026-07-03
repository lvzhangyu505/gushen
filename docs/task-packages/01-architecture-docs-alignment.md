# 任务包 01：最终架构与项目文档对齐

## 目标

把外部最终规划文档 `/Users/lvzhangyu/Downloads/gushen-final-architecture.md` 沉淀到项目内，并同步更新现有 docs，确保后续线程都基于同一套产品定位、合规边界、Phase 路线和数据结构开发。

## 背景

当前项目已有 `docs/PRD.md`、`docs/api.md`、`docs/database.md`、`docs/ai-agents.md`、`docs/mvp-plan.md` 等文档，但最终规划文档中新增或强化了：

- AI 投研工作台定位，而不是交易系统。
- 7 个专家 Agent + Orchestrator + ComplianceGuard。
- `ExpertSignal`、`EvidenceItem`、`OrchestratorResult` 标准结构。
- 证据等级 S/A/B/C/D。
- RiskAgent 一票降级。
- 异步任务和 SSE 路线。
- 历史复盘、自检脚本、Phase 0-6 路线。

## 范围

需要做：

- 将最终规划文档复制或整理为 `docs/final-architecture.md`。
- 更新 `README.md` 的项目定位和当前阶段说明。
- 更新 `docs/PRD.md`，把“投资建议平台”统一调整为“个人投研辅助工作台”。
- 更新 `docs/ai-agents.md`，补齐 7 Agent、Signal Schema、Orchestrator、RiskAgent、ComplianceGuard。
- 更新 `docs/api.md`，补齐 `analysis-tasks`、任务状态、后续 SSE 接口。
- 更新 `docs/database.md`，补齐核心表：`analysis_tasks`、`expert_signals`、`orchestrator_results`、`evidence_items`、`research_reviews`、`trigger_alerts`。
- 更新 `docs/mvp-plan.md`，按 Phase 0-6 重新排序。
- 更新 `docs/current-progress-summary.md`，记录当前真实进展。

不需要做：

- 不写后端业务代码。
- 不改前端 UI。
- 不接真实数据源。

## 验收标准

- 项目内存在 `docs/final-architecture.md`。
- docs 中不再把系统描述为交易系统或自动决策系统。
- docs 中统一使用研究辅助措辞。
- docs 中明确禁止券商账户、交易 API、自动交易、下单、撤单、仓位建议、目标价承诺。
- docs 中每个涉及输出建议的页面或接口都要求展示免责声明。
- docs 与根目录 `AGENTS.md` 不冲突。

## 建议开线程提示词

```text
请执行 docs/task-packages/01-architecture-docs-alignment.md。

重点：
1. 读取 /Users/lvzhangyu/Downloads/gushen-final-architecture.md。
2. 将最终架构沉淀为 docs/final-architecture.md。
3. 同步更新 README.md 和 docs 下相关文档。
4. 保持合规边界，不加入任何交易、券商账户、下单、撤单、仓位、目标价功能。
5. 完成后列出修改的文件和文档一致性检查结果。
```

