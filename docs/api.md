# 后端接口设计

## 1. API 约定

Base URL: `/api/v1`

建议、日报、研究卡、问答统一返回：

```json
{
  "facts": {},
  "analysis": "",
  "suggestions": [],
  "risks": [],
  "evidence": [],
  "disclaimer": "本系统仅用于个人研究辅助，不构成确定性投资承诺。"
}
```

如果证据不足：

```json
{
  "facts": {},
  "analysis": "信息不足，无法形成建议。",
  "suggestions": [],
  "risks": [],
  "evidence": [],
  "disclaimer": "本系统仅用于个人研究辅助，不构成确定性投资承诺。"
}
```

## 2. Auth 占位

首期可单用户运行，但保留接口。

- `GET /auth/me`：获取当前用户。
- `POST /auth/dev-login`：开发环境登录占位。

## 3. 自选股

- `GET /watchlists`：获取自选股列表。
- `POST /watchlists`：创建自选股分组。
- `GET /watchlists/{watchlist_id}`：获取分组详情。
- `PATCH /watchlists/{watchlist_id}`：更新分组。
- `DELETE /watchlists/{watchlist_id}`：删除分组。
- `POST /watchlists/{watchlist_id}/items`：添加股票。
- `PATCH /watchlists/{watchlist_id}/items/{item_id}`：更新标签、优先级、关注理由。
- `DELETE /watchlists/{watchlist_id}/items/{item_id}`：移除股票。

请求示例：

```json
{
  "market": "A_SHARE",
  "symbol": "300750",
  "tags": ["新能源", "电池"],
  "priority": 1,
  "thesis": "跟踪动力电池需求和海外扩产。"
}
```

## 4. 证券与市场信息

- `GET /securities/search?q=宁德时代&market=A_SHARE`：搜索证券。
- `GET /market/indices`：指数概览。
- `GET /market/sectors`：板块概览。
- `GET /securities/{security_id}/events`：股票相关公告、新闻、政策、财报、研报摘要。

## 5. 个股研究卡

- `GET /securities/{security_id}/research-card`：获取最新研究卡。
- `POST /securities/{security_id}/research-card/generate`：生成研究卡。
- `GET /research-cards/{card_id}`：获取指定研究卡。

生成接口返回字段必须包含：

- `facts`
- `analysis.fundamental`
- `analysis.technical`
- `analysis.capital_flow`
- `analysis.sentiment`
- `analysis.risk`
- `suggestions`
- `risks`
- `evidence`
- `disclaimer`

## 6. 投资建议

- `GET /suggestions?security_id=&label=&from=&to=`：查询建议。
- `GET /suggestions/{suggestion_id}`：建议详情。

约束：

- `label` 只能是：值得关注、继续观察、风险偏高、暂不建议介入、等待确认信号。
- 每条建议必须至少绑定一条证据。

## 7. 每日投研日报

- `GET /reports/daily?date=YYYY-MM-DD&type=morning`：获取日报。
- `POST /reports/daily/generate`：生成日报。
- `GET /reports/daily/latest`：获取最新日报。

日报类型：

- `morning`
- `close_review`
- `night_deep_dive`

## 8. 风险提醒

- `GET /risk-alerts?security_id=&risk_type=&status=&severity=`：查询风险。
- `GET /risk-alerts/{risk_id}`：风险详情。
- `PATCH /risk-alerts/{risk_id}`：更新状态。
- `POST /risk-alerts/scan`：扫描风险。

## 9. 投资笔记

- `GET /notes?security_id=&q=&from=&to=`：查询笔记。
- `POST /notes`：创建笔记。
- `GET /notes/{note_id}`：笔记详情。
- `PATCH /notes/{note_id}`：更新笔记。
- `DELETE /notes/{note_id}`：删除笔记。

## 10. 搜索问答

- `POST /qa/sessions`：创建问答会话。
- `GET /qa/sessions`：会话列表。
- `POST /qa/sessions/{session_id}/messages`：提问并生成回答。

请求示例：

```json
{
  "question": "我的自选股里谁风险最高？",
  "scope": {
    "watchlist_id": "uuid",
    "date_range": "last_7_days"
  }
}
```

## 11. 数据源与采集任务

- `GET /data-sources`：数据源列表和授权状态。
- `GET /collection-tasks`：采集任务列表。
- `POST /collection-tasks/run`：手动触发采集。
- `GET /collection-tasks/{task_id}`：采集任务详情。

## 12. 禁止接口

不得创建以下接口或等价能力：

- `/brokerage/*`
- `/orders/*`
- `/trades/*`
- `/positions/sync`
- `/accounts/sync`
- `/funds/*`
- 任何下单、撤单、自动交易、账户托管接口。
