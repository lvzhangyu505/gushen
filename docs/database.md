# 数据库表设计

更新时间：2026-07-03

## 1. 设计原则

- PostgreSQL 作为主数据库。
- pgvector 存储文档 chunk embedding。
- 原始来源元数据、检索证据、Agent Signal、Orchestrator 结果、模型生成分析分开保存。
- 所有建议、研究卡、日报、风险提醒和问答结果必须可追溯到 `evidence_items` 或来源文档。
- 首期单用户可用，但保留 `users` 表便于未来扩展。
- 不保存券商账户、交易密码、资金账户、下单凭证或任何交易执行数据。

## 2. 枚举

```sql
CREATE TYPE market_code AS ENUM ('A_SHARE', 'HK', 'US');
CREATE TYPE source_type AS ENUM ('announcement', 'news', 'policy', 'financial_report', 'research_summary', 'market_data', 'industry_data', 'sentiment', 'manual_note');
CREATE TYPE source_grade AS ENUM ('S', 'A', 'B', 'C', 'D');
CREATE TYPE suggestion_label AS ENUM ('值得关注', '继续观察', '风险偏高', '暂不建议介入', '等待确认信号');
CREATE TYPE risk_type AS ENUM ('业绩下滑', '监管处罚', '重大诉讼', '减持', '质押', '舆情异常', '股价异动', '财务异常', '政策不利', '退市风险', '立案调查', '重大违约', '业绩暴雷');
CREATE TYPE report_type AS ENUM ('morning', 'close_review', 'night_deep_dive');
CREATE TYPE task_status AS ENUM ('pending', 'running', 'completed', 'failed', 'partial', 'cancelled');
CREATE TYPE agent_status AS ENUM ('pending', 'running', 'completed', 'failed', 'partial');
CREATE TYPE signal_direction AS ENUM ('bullish', 'neutral', 'bearish');
CREATE TYPE time_horizon AS ENUM ('short', 'mid', 'long');
CREATE TYPE research_grade AS ENUM ('A_focus_tracking', 'B_observe', 'C_insufficient_info', 'D_risk_elevated', 'E_stop_tracking');
```

## 3. 用户、证券与自选股

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE securities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market market_code NOT NULL DEFAULT 'A_SHARE',
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  exchange TEXT,
  industry TEXT,
  sector TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (market, symbol)
);

CREATE TABLE watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  security_id UUID NOT NULL REFERENCES securities(id),
  tags TEXT[] NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 3,
  thesis TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (watchlist_id, security_id)
);
```

## 4. 市场与来源数据

```sql
CREATE TABLE market_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_id UUID REFERENCES securities(id),
  market market_code NOT NULL,
  index_symbol TEXT,
  index_name TEXT,
  snapshot_at TIMESTAMPTZ NOT NULL,
  open NUMERIC,
  close NUMERIC,
  high NUMERIC,
  low NUMERIC,
  change_pct NUMERIC,
  volume NUMERIC,
  amount NUMERIC,
  source_name TEXT NOT NULL,
  source_url TEXT
);

CREATE TABLE sector_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market market_code NOT NULL,
  sector_name TEXT NOT NULL,
  snapshot_at TIMESTAMPTZ NOT NULL,
  change_pct NUMERIC,
  turnover NUMERIC,
  leading_security_id UUID REFERENCES securities(id),
  source_name TEXT NOT NULL,
  source_url TEXT
);

CREATE TABLE source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type source_type NOT NULL,
  source_grade source_grade NOT NULL DEFAULT 'C',
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT,
  source_authorization TEXT NOT NULL DEFAULT 'public_or_authorized',
  published_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  credibility_score NUMERIC NOT NULL DEFAULT 0.7 CHECK (credibility_score BETWEEN 0 AND 1),
  raw_hash TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  UNIQUE (raw_hash)
);

CREATE TABLE document_security_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
  security_id UUID NOT NULL REFERENCES securities(id) ON DELETE CASCADE,
  relevance_score NUMERIC NOT NULL DEFAULT 0.5 CHECK (relevance_score BETWEEN 0 AND 1),
  UNIQUE (document_id, security_id)
);

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB NOT NULL DEFAULT '{}',
  UNIQUE (document_id, chunk_index)
);
```

## 5. 分析任务、专家信号与仲裁结果

```sql
CREATE TABLE analysis_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  security_id UUID REFERENCES securities(id),
  stock_input TEXT NOT NULL,
  stock_code TEXT,
  stock_name TEXT,
  time_horizon time_horizon NOT NULL DEFAULT 'mid',
  analysis_mode TEXT NOT NULL DEFAULT 'standard',
  status task_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES analysis_tasks(id) ON DELETE SET NULL,
  document_id UUID REFERENCES source_documents(id) ON DELETE SET NULL,
  chunk_id UUID REFERENCES document_chunks(id) ON DELETE SET NULL,
  security_id UUID REFERENCES securities(id),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type source_type NOT NULL,
  source_grade source_grade NOT NULL,
  published_at TIMESTAMPTZ,
  url TEXT,
  quote TEXT,
  relevance_score NUMERIC NOT NULL CHECK (relevance_score BETWEEN 0 AND 1),
  freshness_score NUMERIC NOT NULL CHECK (freshness_score BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE expert_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES analysis_tasks(id) ON DELETE CASCADE,
  security_id UUID REFERENCES securities(id),
  agent_name TEXT NOT NULL,
  agent_status agent_status NOT NULL,
  signal_direction signal_direction NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  weight NUMERIC NOT NULL CHECK (weight BETWEEN 0 AND 1),
  time_horizon time_horizon NOT NULL,
  risk_flags TEXT[] NOT NULL DEFAULT '{}',
  missing_info TEXT[] NOT NULL DEFAULT '{}',
  assumptions TEXT[] NOT NULL DEFAULT '{}',
  data_timestamp TIMESTAMPTZ,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  conclusion_summary TEXT NOT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}',
  UNIQUE (task_id, agent_name)
);

CREATE TABLE expert_signal_evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_signal_id UUID NOT NULL REFERENCES expert_signals(id) ON DELETE CASCADE,
  evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  evidence_role TEXT NOT NULL CHECK (evidence_role IN ('core', 'negative')),
  UNIQUE (expert_signal_id, evidence_item_id, evidence_role)
);

CREATE TABLE orchestrator_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL UNIQUE REFERENCES analysis_tasks(id) ON DELETE CASCADE,
  security_id UUID REFERENCES securities(id),
  research_grade research_grade NOT NULL,
  primary_time_horizon time_horizon NOT NULL,
  overall_direction signal_direction NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  convergence_score NUMERIC NOT NULL CHECK (convergence_score BETWEEN 0 AND 1),
  divergence_score NUMERIC NOT NULL CHECK (divergence_score BETWEEN 0 AND 1),
  key_supporting_points JSONB NOT NULL DEFAULT '[]',
  key_risk_points JSONB NOT NULL DEFAULT '[]',
  key_divergences JSONB NOT NULL DEFAULT '[]',
  missing_info JSONB NOT NULL DEFAULT '[]',
  invalidation_conditions JSONB NOT NULL DEFAULT '[]',
  next_observation_points JSONB NOT NULL DEFAULT '[]',
  risk_veto_triggered BOOLEAN NOT NULL DEFAULT false,
  compliance_checked BOOLEAN NOT NULL DEFAULT false,
  compliance_disclaimer TEXT NOT NULL DEFAULT '本系统仅用于个人研究辅助，不构成确定性投资承诺。',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_payload JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE orchestrator_evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orchestrator_result_id UUID NOT NULL REFERENCES orchestrator_results(id) ON DELETE CASCADE,
  evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  UNIQUE (orchestrator_result_id, evidence_item_id)
);
```

## 6. 研究卡、建议与风险

```sql
CREATE TABLE stock_research_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_id UUID NOT NULL REFERENCES securities(id),
  task_id UUID REFERENCES analysis_tasks(id) ON DELETE SET NULL,
  orchestrator_result_id UUID REFERENCES orchestrator_results(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_start DATE,
  period_end DATE,
  facts JSONB NOT NULL DEFAULT '{}',
  analysis JSONB NOT NULL DEFAULT '{}',
  suggestions JSONB NOT NULL DEFAULT '[]',
  risks JSONB NOT NULL DEFAULT '[]',
  model_name TEXT,
  disclaimer TEXT NOT NULL DEFAULT '本系统仅用于个人研究辅助，不构成确定性投资承诺。'
);

CREATE TABLE investment_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_id UUID REFERENCES securities(id),
  research_card_id UUID REFERENCES stock_research_cards(id) ON DELETE SET NULL,
  task_id UUID REFERENCES analysis_tasks(id) ON DELETE SET NULL,
  label suggestion_label NOT NULL,
  rationale TEXT NOT NULL,
  risk_note TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  disclaimer TEXT NOT NULL DEFAULT '本系统仅用于个人研究辅助，不构成确定性投资承诺。'
);

CREATE TABLE risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_id UUID REFERENCES securities(id),
  task_id UUID REFERENCES analysis_tasks(id) ON DELETE SET NULL,
  risk_type risk_type NOT NULL,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  disclaimer TEXT NOT NULL DEFAULT '本系统仅用于个人研究辅助，不构成确定性投资承诺。'
);

CREATE TABLE suggestion_evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES investment_suggestions(id) ON DELETE CASCADE,
  evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  UNIQUE (suggestion_id, evidence_item_id)
);

CREATE TABLE research_card_evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_card_id UUID NOT NULL REFERENCES stock_research_cards(id) ON DELETE CASCADE,
  evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  UNIQUE (research_card_id, evidence_item_id)
);

CREATE TABLE risk_alert_evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_alert_id UUID NOT NULL REFERENCES risk_alerts(id) ON DELETE CASCADE,
  evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  UNIQUE (risk_alert_id, evidence_item_id)
);
```

## 7. 日报、笔记、问答、复盘与提醒

```sql
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL,
  report_type report_type NOT NULL,
  title TEXT NOT NULL,
  facts JSONB NOT NULL DEFAULT '{}',
  analysis TEXT NOT NULL,
  suggestions JSONB NOT NULL DEFAULT '[]',
  risks JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  disclaimer TEXT NOT NULL DEFAULT '本系统仅用于个人研究辅助，不构成确定性投资承诺。',
  UNIQUE (report_date, report_type)
);

CREATE TABLE daily_report_evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
  evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  UNIQUE (report_id, evidence_item_id)
);

CREATE TABLE investment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  security_id UUID REFERENCES securities(id),
  suggestion_id UUID REFERENCES investment_suggestions(id),
  report_id UUID REFERENCES daily_reports(id),
  risk_alert_id UUID REFERENCES risk_alerts(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  actual_action TEXT,
  review_result TEXT,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE research_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES analysis_tasks(id) ON DELETE SET NULL,
  security_id UUID REFERENCES securities(id),
  review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  observation_horizon time_horizon NOT NULL,
  price_change_pct NUMERIC,
  invalidation_triggered BOOLEAN,
  original_judgment_effective BOOLEAN,
  error_reason TEXT,
  best_agent_name TEXT,
  noisiest_agent_name TEXT,
  weight_adjustment_note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE trigger_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_id UUID REFERENCES securities(id),
  task_id UUID REFERENCES analysis_tasks(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'open',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE qa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE qa_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES qa_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  facts JSONB NOT NULL DEFAULT '{}',
  analysis TEXT,
  suggestions JSONB NOT NULL DEFAULT '[]',
  risks JSONB NOT NULL DEFAULT '[]',
  evidence JSONB NOT NULL DEFAULT '[]',
  disclaimer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 8. 采集任务与系统自检

```sql
CREATE TABLE collection_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL,
  source_name TEXT NOT NULL,
  status task_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  items_collected INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,
  database_ok BOOLEAN NOT NULL DEFAULT false,
  pgvector_ok BOOLEAN NOT NULL DEFAULT false,
  model_api_ok BOOLEAN NOT NULL DEFAULT false,
  agents_ok BOOLEAN NOT NULL DEFAULT false,
  orchestrator_ok BOOLEAN NOT NULL DEFAULT false,
  compliance_guard_ok BOOLEAN NOT NULL DEFAULT false,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB NOT NULL DEFAULT '{}'
);
```

## 9. Indexes

```sql
CREATE INDEX idx_source_documents_type_time ON source_documents (source_type, published_at DESC);
CREATE INDEX idx_source_documents_grade ON source_documents (source_grade);
CREATE INDEX idx_source_documents_hash ON source_documents (raw_hash);
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_watchlist_items_security ON watchlist_items (security_id);
CREATE INDEX idx_analysis_tasks_security_status ON analysis_tasks (security_id, status);
CREATE INDEX idx_analysis_tasks_created_at ON analysis_tasks (created_at DESC);
CREATE INDEX idx_expert_signals_task_agent ON expert_signals (task_id, agent_name);
CREATE INDEX idx_evidence_items_task_grade ON evidence_items (task_id, source_grade);
CREATE INDEX idx_orchestrator_results_task ON orchestrator_results (task_id);
CREATE INDEX idx_risk_alerts_security_status ON risk_alerts (security_id, status);
CREATE INDEX idx_trigger_alerts_security_status ON trigger_alerts (security_id, status);
CREATE INDEX idx_research_reviews_security_time ON research_reviews (security_id, review_at DESC);
CREATE INDEX idx_daily_reports_date_type ON daily_reports (report_date, report_type);
```

## 10. 约束提醒

- `investment_suggestions` 必须通过 `suggestion_evidence_links` 绑定至少一条证据，除非上层返回 `信息不足，无法形成建议。`
- 研究卡、日报、风险提醒、问答结果必须显示免责声明。
- `source_grade` 为 `C` 的证据只能作为情绪或事件参考。
- `source_grade` 为 `D` 的证据不得作为研究结论依据。
- 交易、账户、资金、订单、持仓同步相关表不得创建。
