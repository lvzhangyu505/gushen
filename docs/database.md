# 数据库表设计

## 1. 设计原则

- PostgreSQL 作为主数据库。
- pgvector 存储文档 chunk embedding。
- 原始来源、结构化事实、AI 分析、投资建议和风险提示分表保存。
- 所有建议通过 `evidence_links` 绑定来源证据。
- 首期单用户可用，但保留 `users` 表便于未来扩展。

## 2. 枚举

```sql
CREATE TYPE market_code AS ENUM ('A_SHARE', 'HK', 'US');
CREATE TYPE source_type AS ENUM ('announcement', 'news', 'policy', 'financial_report', 'research_summary', 'market_data', 'manual_note');
CREATE TYPE suggestion_label AS ENUM ('值得关注', '继续观察', '风险偏高', '暂不建议介入', '等待确认信号');
CREATE TYPE risk_type AS ENUM ('业绩下滑', '监管处罚', '重大诉讼', '减持', '质押', '舆情异常', '股价异动', '财务异常', '政策不利');
CREATE TYPE report_type AS ENUM ('morning', 'close_review', 'night_deep_dive');
CREATE TYPE task_status AS ENUM ('pending', 'running', 'success', 'failed', 'skipped');
```

## 3. 核心表

```sql
CREATE EXTENSION IF NOT EXISTS vector;

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
  market market_code NOT NULL,
  index_symbol TEXT NOT NULL,
  index_name TEXT NOT NULL,
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
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT,
  source_authorization TEXT NOT NULL DEFAULT 'public_or_authorized',
  published_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  credibility_score NUMERIC NOT NULL DEFAULT 0.7,
  raw_hash TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  UNIQUE (raw_hash)
);

CREATE TABLE document_security_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
  security_id UUID NOT NULL REFERENCES securities(id) ON DELETE CASCADE,
  relevance_score NUMERIC NOT NULL DEFAULT 0.5,
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

## 5. AI 分析、建议与证据

```sql
CREATE TABLE stock_research_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_id UUID NOT NULL REFERENCES securities(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_start DATE,
  period_end DATE,
  facts JSONB NOT NULL DEFAULT '{}',
  fundamental_analysis TEXT,
  technical_analysis TEXT,
  capital_flow_analysis TEXT,
  sentiment_analysis TEXT,
  risk_analysis TEXT,
  model_name TEXT,
  disclaimer TEXT NOT NULL DEFAULT '本系统仅用于个人研究辅助，不构成确定性投资承诺。'
);

CREATE TABLE investment_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_id UUID REFERENCES securities(id),
  research_card_id UUID REFERENCES stock_research_cards(id) ON DELETE SET NULL,
  label suggestion_label NOT NULL,
  rationale TEXT NOT NULL,
  risk_note TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0.5,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  disclaimer TEXT NOT NULL DEFAULT '本系统仅用于个人研究辅助，不构成确定性投资承诺。'
);

CREATE TABLE evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID REFERENCES investment_suggestions(id) ON DELETE CASCADE,
  research_card_id UUID REFERENCES stock_research_cards(id) ON DELETE CASCADE,
  risk_alert_id UUID,
  report_id UUID,
  document_id UUID NOT NULL REFERENCES source_documents(id),
  chunk_id UUID REFERENCES document_chunks(id),
  evidence_text TEXT NOT NULL,
  relevance_score NUMERIC NOT NULL DEFAULT 0.5
);

CREATE TABLE risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  security_id UUID REFERENCES securities(id),
  risk_type risk_type NOT NULL,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  disclaimer TEXT NOT NULL DEFAULT '本系统仅用于个人研究辅助，不构成确定性投资承诺。'
);
```

## 6. 日报、笔记、问答和任务

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
```

## 7. Indexes

```sql
CREATE INDEX idx_source_documents_type_time ON source_documents (source_type, published_at DESC);
CREATE INDEX idx_source_documents_hash ON source_documents (raw_hash);
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_watchlist_items_security ON watchlist_items (security_id);
CREATE INDEX idx_risk_alerts_security_status ON risk_alerts (security_id, status);
CREATE INDEX idx_daily_reports_date_type ON daily_reports (report_date, report_type);
```
