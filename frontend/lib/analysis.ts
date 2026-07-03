export type SignalDirection = "positive" | "neutral" | "cautious" | "negative";

export interface EvidenceItem {
  title: string;
  source_type: string;
  source_name: string;
  evidence_level: "S" | "A" | "B" | "C" | "D";
  summary: string;
  relevance: string;
  published_at: string;
  url?: string | null;
}

export interface ExpertSignal {
  agent_name: string;
  signal_direction: SignalDirection;
  confidence: number;
  weight: number;
  time_horizon: string;
  analysis_period: string;
  core_evidence: EvidenceItem[];
  negative_evidence: EvidenceItem[];
  risk_flags: string[];
  missing_info: string[];
  assumptions: string[];
  conclusion_summary: string;
}

export interface DivergenceItem {
  topic: string;
  positive_view: string;
  cautious_view: string;
  interpretation: string;
  related_agents: string[];
}

export interface OrchestratorResult {
  stock_code: string;
  time_horizon: string;
  research_grade: "值得关注" | "继续观察" | "风险偏高" | "暂不建议介入" | "等待确认信号";
  overall_direction: SignalDirection;
  convergence_score: number;
  divergence_score: number;
  core_evidence: EvidenceItem[];
  counter_evidence: EvidenceItem[];
  key_supporting_points: string[];
  key_risk_points: string[];
  key_divergences: DivergenceItem[];
  missing_info: string[];
  next_observation_points: string[];
  agent_signals: ExpertSignal[];
  disclaimer: string;
}

export interface AgentRunStatus {
  agent_name: string;
  status: "pending" | "running" | "completed" | "partial" | "failed";
  signal_direction?: SignalDirection | null;
  confidence?: number | null;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface AnalysisTask {
  id: string;
  stock_code: string;
  time_horizon: string;
  status: "pending" | "running" | "completed" | "partial" | "failed";
  agent_states: AgentRunStatus[];
  result: OrchestratorResult | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}
