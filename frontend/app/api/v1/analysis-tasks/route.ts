import { NextResponse } from "next/server";

const disclaimer = "本系统仅用于个人研究辅助，不构成确定性投资承诺。";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const stockCode = String(body.stock_code || "002436");
  const timeHorizon = String(body.time_horizon || "中期");
  const now = new Date().toISOString();
  const taskId = `demo_${Date.now()}`;
  const agents = [
    ["财务分析 Agent", "neutral", 0.64, 0.16, "财务侧呈中性，仍需等待更完整的报表证据。"],
    ["技术指标 Agent", "positive", 0.72, 0.12, "技术侧基于示例快照偏正向，但需要量能持续验证。"],
    ["资金流向 Agent", "neutral", 0.61, 0.12, "资金侧中性，观察价值存在，但连续性仍需确认。"],
    ["宏观政策 Agent", "positive", 0.66, 0.14, "宏观政策侧偏正向，政策传导仍需后续证据验证。"],
    ["行业景气 Agent", "neutral", 0.62, 0.14, "行业侧中性偏观察，需求修复和竞争压力同时存在。"],
    ["舆情情绪 Agent", "cautious", 0.57, 0.1, "舆情侧偏谨慎，关注度提升同时伴随争议信息。"],
    ["风险预警 Agent", "cautious", 0.74, 0.22, "风险侧偏谨慎，证据补全和分歧复核应优先处理。"],
  ] as const;

  const agentSignals = agents.map(([agentName, direction, confidence, weight, summary]) => ({
    agent_name: agentName,
    signal_direction: direction,
    confidence,
    weight,
    time_horizon: timeHorizon,
    analysis_period: `线上演示 ${timeHorizon}研究周期`,
    core_evidence: [
      {
        title: `${stockCode} 演示证据`,
        source_type: "线上演示数据",
        source_name: "Gushen Demo API",
        evidence_level: "C",
        summary: "该证据用于线上预览交互效果；真实研究需要接入合法公开或授权数据源。",
        relevance: "用于验证页面交互和证据链展示",
        published_at: "2026-07-03",
        url: null,
      },
    ],
    negative_evidence: [
      {
        title: "演示数据限制",
        source_type: "系统提示",
        source_name: "Gushen Demo API",
        evidence_level: "C",
        summary: "线上演示 API 不代表真实公告、财报、行情或新闻核验结果。",
        relevance: "提示结果边界",
        published_at: "2026-07-03",
        url: null,
      },
    ],
    risk_flags: ["演示数据", "真实数据待接入"],
    missing_info: ["真实公告", "真实行情", "真实财报", "真实新闻"],
    assumptions: ["当前线上环境使用演示 API，后端 FastAPI 可在本地运行完整 MVP。"],
    conclusion_summary: summary,
  }));

  return NextResponse.json({
    id: taskId,
    stock_code: stockCode,
    time_horizon: timeHorizon,
    status: "completed",
    agent_states: agentSignals.map((signal) => ({
      agent_name: signal.agent_name,
      status: "completed",
      signal_direction: signal.signal_direction,
      confidence: signal.confidence,
      error_message: null,
      started_at: now,
      completed_at: now,
    })),
    result: {
      stock_code: stockCode,
      time_horizon: timeHorizon,
      research_grade: "风险偏高",
      overall_direction: "cautious",
      convergence_score: 0.62,
      divergence_score: 0.56,
      core_evidence: agentSignals.map((signal) => signal.core_evidence[0]),
      counter_evidence: agentSignals.map((signal) => signal.negative_evidence[0]),
      key_supporting_points: [
        "线上演示已跑通 7 个 Agent、Orchestrator、证据链和免责声明展示。",
        "技术和宏观演示信号偏正向，但风险与信息缺口仍优先影响研究分级。",
      ],
      key_risk_points: [
        "当前线上结果来自演示 API，真实研究需要本地 FastAPI 或正式后端数据服务支撑。",
        "缺少真实公告、行情、财报和新闻核验时，系统维持审慎研究口径。",
      ],
      key_divergences: [
        {
          topic: "趋势修复与风险约束的分歧",
          positive_view: "技术指标和宏观政策演示信号存在改善迹象。",
          cautious_view: "风险预警和舆情情绪提示信息缺口仍需优先处理。",
          interpretation: "该分歧意味着研究结论应保持观察口径，等待真实证据补全后再提高判断强度。",
          related_agents: ["技术指标 Agent", "宏观政策 Agent", "风险预警 Agent", "舆情情绪 Agent"],
        },
      ],
      missing_info: ["真实公告", "真实行情", "真实财报", "真实新闻"],
      next_observation_points: [
        "接入合法公告与财报数据源。",
        "接入行情快照后复核技术和资金规则 Agent。",
        "用真实 embedding provider 替换演示检索。",
        "持续保留合规免责声明和证据不足提示。",
      ],
      agent_signals: agentSignals,
      disclaimer,
    },
    error_message: null,
    created_at: now,
    updated_at: now,
  });
}

