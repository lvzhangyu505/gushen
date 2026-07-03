from __future__ import annotations

from app.agents import (
    FinancialAgent,
    FundFlowAgent,
    IndustryAgent,
    MacroAgent,
    RiskAgent,
    SentimentAgent,
    TechnicalAgent,
)
from app.schemas.analysis import DivergenceItem, ExpertSignal, OrchestratorResult, ResearchGrade, SignalDirection
from app.services.compliance_guard import ComplianceGuard


AGENTS = [
    FinancialAgent(),
    TechnicalAgent(),
    FundFlowAgent(),
    MacroAgent(),
    IndustryAgent(),
    SentimentAgent(),
    RiskAgent(),
]

compliance_guard = ComplianceGuard()


def agent_names() -> list[str]:
    return [agent.agent_name for agent in AGENTS]


def run_agent(agent_name: str, stock_code: str, time_horizon: str) -> ExpertSignal:
    agent = next(candidate for candidate in AGENTS if candidate.agent_name == agent_name)
    return agent.analyze(stock_code, time_horizon)


def combine_signals(stock_code: str, time_horizon: str, signals: list[ExpertSignal], failed_agents: list[str] | None = None) -> OrchestratorResult:
    failed_agents = failed_agents or []
    if not signals:
        raise ValueError("信息不足，无法形成建议。")
    positive_weight = sum(s.weight * s.confidence for s in signals if s.signal_direction == SignalDirection.positive)
    cautious_weight = sum(s.weight * s.confidence for s in signals if s.signal_direction in {SignalDirection.cautious, SignalDirection.negative})
    neutral_weight = sum(s.weight * s.confidence for s in signals if s.signal_direction == SignalDirection.neutral)
    total_weight = sum(s.weight for s in signals) or 1

    convergence_score = round((max(positive_weight, cautious_weight, neutral_weight) / total_weight), 2)
    divergence_score = round(min(0.95, 1 - convergence_score + 0.18), 2)

    risk_signal = next((signal for signal in signals if signal.agent_name == "风险预警 Agent"), None)
    risk_veto = risk_signal is None or (
        risk_signal.signal_direction in {SignalDirection.cautious, SignalDirection.negative} and risk_signal.confidence >= 0.7
    )
    high_grade_evidence = [
        item
        for signal in signals
        for item in [*signal.core_evidence, *signal.negative_evidence]
        if item.evidence_level.value in {"S", "A", "B"}
    ]
    low_evidence_only = not high_grade_evidence

    if risk_veto or len(failed_agents) > 3 or low_evidence_only:
        overall_direction = SignalDirection.cautious
        research_grade = ResearchGrade.high_risk if risk_signal is not None else ResearchGrade.wait_for_confirmation
    elif cautious_weight >= positive_weight:
        overall_direction = SignalDirection.cautious
        research_grade = ResearchGrade.keep_observing
    else:
        overall_direction = SignalDirection.neutral
        research_grade = ResearchGrade.wait_for_confirmation

    core_evidence = [item for signal in signals for item in signal.core_evidence[:1]]
    counter_evidence = [item for signal in signals for item in signal.negative_evidence[:1]]
    missing_info = sorted({item for signal in signals for item in signal.missing_info} | {f"{name} 未完成，本次结论已降级" for name in failed_agents})
    if low_evidence_only:
        missing_info.append("当前仅有 C/D 级证据，信息不足，无法形成建议。")

    result = OrchestratorResult(
        stock_code=stock_code,
        time_horizon=time_horizon,
        research_grade=research_grade,
        overall_direction=overall_direction,
        convergence_score=convergence_score,
        divergence_score=divergence_score,
        core_evidence=core_evidence,
        counter_evidence=counter_evidence,
        key_supporting_points=[
            "技术指标与宏观政策 Mock 信号偏正向，说明该标的具备继续跟踪的研究价值。",
            "财务和行业 Agent 未发现单一维度的重大异常，但仍需要真实公开资料验证。",
            "多 Agent 输出均保留证据、反方证据和缺失信息，便于后续接入真实数据源后复核。",
        ],
        key_risk_points=[
            "风险预警 Agent 触发审慎降级，研究标签已优先反映波动、竞争和信息缺口。",
            "风险预警 Agent 权重最高，提示价格波动、竞争格局和信息缺口需要优先检查。",
            "当前所有结果均来自 Mock 数据，不能替代公告、财报、行情和新闻的真实核验。",
            "舆情侧存在争议议题，行业修复预期尚未被真实订单和财务数据充分证明。",
            "若只有低等级证据，系统会维持信息不足或风险偏高口径。",
        ],
        key_divergences=[
            DivergenceItem(
                topic="趋势修复与风险约束的分歧",
                positive_view="技术指标和宏观政策 Agent 认为中期环境存在改善迹象。",
                cautious_view="风险预警和舆情情绪 Agent 认为波动、竞争和信息缺口仍需优先处理。",
                interpretation="该分歧意味着研究结论应保持观察口径，等待真实证据补全后再提高判断强度。",
                related_agents=["技术指标 Agent", "宏观政策 Agent", "风险预警 Agent", "舆情情绪 Agent"],
            ),
            DivergenceItem(
                topic="行业修复与盈利验证的分歧",
                positive_view="行业需求存在修复预期，部分下游方向关注度提升。",
                cautious_view="财务 Agent 提示利润率和现金流质量仍需要报表确认。",
                interpretation="行业景气需要通过公司层面的收入质量、利润率和现金流表现交叉验证。",
                related_agents=["行业景气 Agent", "财务分析 Agent"],
            ),
        ],
        missing_info=missing_info,
        next_observation_points=[
            "补充最新公告、定期报告和经营数据，核验 Mock 财务假设。",
            "跟踪成交活跃度、波动率和资金连续性，确认技术信号是否稳定。",
            "持续观察行业订单、价格竞争和产能利用率变化。",
            "对舆情样本进行来源分层，剔除低可信噪声后再更新研究卡。",
        ],
        agent_signals=signals,
    )
    compliance_guard.validate(result)
    return result


def run_mock_orchestrator(stock_code: str, time_horizon: str) -> OrchestratorResult:
    signals = [agent.analyze(stock_code, time_horizon) for agent in AGENTS]
    return combine_signals(stock_code, time_horizon, signals)
