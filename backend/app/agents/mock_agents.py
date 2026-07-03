from abc import ABC, abstractmethod

from app.schemas.analysis import EvidenceItem, ExpertSignal, SignalDirection
from app.tasks.task_store import list_market_snapshots


def evidence(title: str, source_type: str, summary: str, relevance: str, evidence_level: str = "D") -> EvidenceItem:
    return EvidenceItem(
        title=title,
        source_type=source_type,
        source_name="Phase 1 Mock 数据集",
        evidence_level=evidence_level,
        summary=summary,
        relevance=relevance,
        published_at="2026-07-03",
        url=None,
    )


class BaseMockAgent(ABC):
    agent_name: str
    signal_direction: SignalDirection
    confidence: float
    weight: float

    @abstractmethod
    def analyze(self, stock_code: str, time_horizon: str) -> ExpertSignal:
        raise NotImplementedError


class FinancialAgent(BaseMockAgent):
    agent_name = "财务分析 Agent"
    signal_direction = SignalDirection.neutral
    confidence = 0.64
    weight = 0.16

    def analyze(self, stock_code: str, time_horizon: str) -> ExpertSignal:
        return ExpertSignal(
            agent_name=self.agent_name,
            signal_direction=self.signal_direction,
            confidence=self.confidence,
            weight=self.weight,
            time_horizon=time_horizon,
            analysis_period=f"Phase 1 Mock {time_horizon}研究周期",
            core_evidence=[
                evidence("营收韧性 Mock 记录", "财务摘要", f"{stock_code} 近几期收入保持温和修复，费用率未见异常扩张。", "支持基本面仍可跟踪", "C"),
                evidence("现金流 Mock 记录", "财务摘要", "经营性现金流波动可控，但仍需后续报表验证质量。", "支持研究继续推进", "C"),
            ],
            negative_evidence=[
                evidence("利润率压力 Mock 记录", "财务摘要", "产品结构与成本变化可能压制阶段性利润弹性。", "提示盈利修复仍不充分"),
            ],
            risk_flags=["利润率修复节奏不确定", "后续财报验证不足"],
            missing_info=["最新季度详细财务报表", "分业务收入与毛利率拆分"],
            assumptions=["Mock 数据假设公司主营业务未发生重大变化", "中期观察以经营质量变化为主"],
            conclusion_summary="财务侧呈中性，具备继续研究价值，但需要等待更完整的报表证据。",
        )


class TechnicalAgent(BaseMockAgent):
    agent_name = "技术指标 Agent"
    signal_direction = SignalDirection.positive
    confidence = 0.68
    weight = 0.12

    def analyze(self, stock_code: str, time_horizon: str) -> ExpertSignal:
        snapshots = list_market_snapshots(stock_code, limit=20)
        if len(snapshots) >= 5:
            first = snapshots[0]
            latest = snapshots[-1]
            avg_volume = sum(item.volume for item in snapshots) / len(snapshots)
            recent_volume = sum(item.volume for item in snapshots[-3:]) / 3
            price_change = (latest.close - first.close) / first.close
            volume_ratio = recent_volume / avg_volume if avg_volume else 1
            direction = SignalDirection.positive if price_change > 0.03 and volume_ratio >= 1 else SignalDirection.cautious if price_change < -0.03 else SignalDirection.neutral
            confidence = min(0.82, 0.55 + abs(price_change) + min(volume_ratio / 10, 0.15))
            return ExpertSignal(
                agent_name=self.agent_name,
                signal_direction=direction,
                confidence=round(confidence, 2),
                weight=self.weight,
                time_horizon=time_horizon,
                analysis_period=f"{snapshots[0].trade_date} 至 {snapshots[-1].trade_date}",
                core_evidence=[
                    evidence(
                        "行情快照趋势计算",
                        "行情快照",
                        f"{stock_code} 样本期收盘价变化 {price_change:.2%}，近三期量能相对均值为 {volume_ratio:.2f} 倍。",
                        "用于判断趋势与量能确认程度",
                        "B",
                    )
                ],
                negative_evidence=[
                    evidence("样本长度限制", "行情快照", "当前仅使用本地录入快照，样本长度和数据来源仍需扩展。", "提示计算置信度边界", "C")
                ],
                risk_flags=["样本长度有限"] if len(snapshots) < 20 else [],
                missing_info=[] if len(snapshots) >= 20 else ["更长周期行情序列"],
                assumptions=["技术指标基于用户或数据源录入的本地行情快照计算"],
                conclusion_summary="技术侧已基于本地行情快照完成规则计算，仍需结合更长周期数据复核。",
            )
        return ExpertSignal(
            agent_name=self.agent_name,
            signal_direction=self.signal_direction,
            confidence=self.confidence,
            weight=self.weight,
            time_horizon=time_horizon,
            analysis_period=f"Phase 1 Mock {time_horizon}研究周期",
            core_evidence=[
                evidence("均线修复 Mock 记录", "技术指标", "中短期均线出现修复迹象，价格重回阶段震荡区间上沿附近。", "提示趋势环境改善", "C"),
            ],
            negative_evidence=[
                evidence("量能确认不足 Mock 记录", "技术指标", "成交活跃度尚未连续放大，趋势延续性需要观察。", "提示确认信号不足"),
            ],
            risk_flags=["波动率抬升", "量能连续性不足"],
            missing_info=["真实行情序列", "分时成交结构"],
            assumptions=["Mock 技术信号仅用于界面闭环验证", "不据此形成确定性操作结论"],
            conclusion_summary="技术侧偏正向，但需要成交活跃度和持续性共同验证。",
        )


class FundFlowAgent(BaseMockAgent):
    agent_name = "资金流向 Agent"
    signal_direction = SignalDirection.neutral
    confidence = 0.59
    weight = 0.12

    def analyze(self, stock_code: str, time_horizon: str) -> ExpertSignal:
        snapshots = [item for item in list_market_snapshots(stock_code, limit=20) if item.fund_flow is not None]
        if len(snapshots) >= 5:
            total_flow = sum(item.fund_flow or 0 for item in snapshots)
            recent_flow = sum(item.fund_flow or 0 for item in snapshots[-3:])
            positive_days = sum(1 for item in snapshots if (item.fund_flow or 0) > 0)
            consistency = positive_days / len(snapshots)
            direction = SignalDirection.positive if total_flow > 0 and consistency >= 0.6 else SignalDirection.cautious if total_flow < 0 and consistency <= 0.4 else SignalDirection.neutral
            return ExpertSignal(
                agent_name=self.agent_name,
                signal_direction=direction,
                confidence=round(min(0.88, 0.55 + abs(consistency - 0.5)), 2),
                weight=self.weight,
                time_horizon=time_horizon,
                analysis_period=f"{snapshots[0].trade_date} 至 {snapshots[-1].trade_date}",
                core_evidence=[
                    evidence(
                        "资金流快照计算",
                        "资金快照",
                        f"{stock_code} 样本期资金净变化 {total_flow:.2f}，近三期净变化 {recent_flow:.2f}，正向天数占比 {consistency:.0%}。",
                        "用于判断资金行为连续性",
                        "B",
                    )
                ],
                negative_evidence=[
                    evidence("资金流口径限制", "资金快照", "当前资金流字段来自本地数据源，需确认供应商口径和更新频率。", "提示数据口径差异", "C")
                ],
                risk_flags=["资金口径需核验"],
                missing_info=[] if len(snapshots) >= 20 else ["更长周期资金流数据"],
                assumptions=["资金流计算基于本地录入或合法数据源缓存字段"],
                conclusion_summary="资金侧已基于本地资金快照完成规则计算，重点观察连续性是否维持。",
            )
        return ExpertSignal(
            agent_name=self.agent_name,
            signal_direction=self.signal_direction,
            confidence=self.confidence,
            weight=self.weight,
            time_horizon=time_horizon,
            analysis_period=f"Phase 1 Mock {time_horizon}研究周期",
            core_evidence=[
                evidence("资金活跃度 Mock 记录", "资金摘要", "阶段性资金关注度改善，但连续性较弱。", "支持继续观察资金行为"),
            ],
            negative_evidence=[
                evidence("流入稳定性 Mock 记录", "资金摘要", "资金净变化在不同交易日之间波动明显，尚难形成一致判断。", "削弱信号可靠性"),
            ],
            risk_flags=["资金流向分歧", "短期情绪影响较大"],
            missing_info=["真实逐日资金流数据", "机构席位与大单结构"],
            assumptions=["资金流 Mock 样本只表达相对活跃度", "资金信息不代表后续价格确定变化"],
            conclusion_summary="资金侧中性，观察价值存在，但当前证据的连续性不足。",
        )


class MacroAgent(BaseMockAgent):
    agent_name = "宏观政策 Agent"
    signal_direction = SignalDirection.positive
    confidence = 0.66
    weight = 0.14

    def analyze(self, stock_code: str, time_horizon: str) -> ExpertSignal:
        return ExpertSignal(
            agent_name=self.agent_name,
            signal_direction=self.signal_direction,
            confidence=self.confidence,
            weight=self.weight,
            time_horizon=time_horizon,
            analysis_period=f"Phase 1 Mock {time_horizon}研究周期",
            core_evidence=[
                evidence("产业政策 Mock 记录", "政策信息", "电子制造与国产替代方向仍处于政策关注范围。", "支持中期研究框架", "C"),
            ],
            negative_evidence=[
                evidence("外部环境 Mock 记录", "宏观信息", "外需、汇率和供应链扰动可能影响订单节奏。", "提示宏观变量仍需跟踪"),
            ],
            risk_flags=["外部需求扰动", "政策落地节奏不确定"],
            missing_info=["最新政策细则", "外部需求高频指标"],
            assumptions=["宏观政策环境维持支持制造升级的基调", "政策影响需要通过订单和业绩验证"],
            conclusion_summary="宏观政策侧偏正向，但仍需观察政策传导到订单和盈利的证据。",
        )


class IndustryAgent(BaseMockAgent):
    agent_name = "行业景气 Agent"
    signal_direction = SignalDirection.neutral
    confidence = 0.62
    weight = 0.14

    def analyze(self, stock_code: str, time_horizon: str) -> ExpertSignal:
        return ExpertSignal(
            agent_name=self.agent_name,
            signal_direction=self.signal_direction,
            confidence=self.confidence,
            weight=self.weight,
            time_horizon=time_horizon,
            analysis_period=f"Phase 1 Mock {time_horizon}研究周期",
            core_evidence=[
                evidence("订单节奏 Mock 记录", "行业摘要", "行业需求存在修复预期，部分下游领域询单活跃。", "支持行业关注度提升"),
            ],
            negative_evidence=[
                evidence("竞争格局 Mock 记录", "行业摘要", "行业价格竞争与产能利用率仍可能压制盈利改善。", "提示景气度并不均衡"),
            ],
            risk_flags=["行业竞争加剧", "需求恢复不均衡"],
            missing_info=["真实订单数据", "产能利用率与价格跟踪"],
            assumptions=["行业修复以渐进方式体现", "公司弹性取决于产品结构和客户节奏"],
            conclusion_summary="行业侧中性偏观察，需求修复和竞争压力同时存在。",
        )


class SentimentAgent(BaseMockAgent):
    agent_name = "舆情情绪 Agent"
    signal_direction = SignalDirection.cautious
    confidence = 0.57
    weight = 0.10

    def analyze(self, stock_code: str, time_horizon: str) -> ExpertSignal:
        return ExpertSignal(
            agent_name=self.agent_name,
            signal_direction=self.signal_direction,
            confidence=self.confidence,
            weight=self.weight,
            time_horizon=time_horizon,
            analysis_period=f"Phase 1 Mock {time_horizon}研究周期",
            core_evidence=[
                evidence("关注度 Mock 记录", "舆情摘要", "市场讨论热度有所提升，议题集中在订单和行业修复。", "支持关注度改善"),
            ],
            negative_evidence=[
                evidence("争议议题 Mock 记录", "舆情摘要", "部分讨论聚焦价格压力与竞争扩散，情绪并不稳定。", "提示情绪扰动"),
            ],
            risk_flags=["舆情波动", "非结构化信息噪声较多"],
            missing_info=["真实新闻与社媒样本", "情绪来源可信度分层"],
            assumptions=["Mock 舆情仅用于模拟多源分歧", "舆情信息必须与公开证据交叉验证"],
            conclusion_summary="舆情侧偏谨慎，关注度提升同时伴随争议信息。",
        )


class RiskAgent(BaseMockAgent):
    agent_name = "风险预警 Agent"
    signal_direction = SignalDirection.cautious
    confidence = 0.74
    weight = 0.22

    def analyze(self, stock_code: str, time_horizon: str) -> ExpertSignal:
        return ExpertSignal(
            agent_name=self.agent_name,
            signal_direction=self.signal_direction,
            confidence=self.confidence,
            weight=self.weight,
            time_horizon=time_horizon,
            analysis_period=f"Phase 1 Mock {time_horizon}研究周期",
            core_evidence=[
                evidence("风险扫描 Mock 记录", "风险摘要", "价格波动、行业竞争和财务验证不足是主要约束项。", "支持提高风控关注", "C"),
            ],
            negative_evidence=[
                evidence("信息缺口 Mock 记录", "风险摘要", "缺少真实公告、行情和财务数据时，无法给出更高确定性的研究结论。", "限制结论强度"),
            ],
            risk_flags=["价格波动放大", "证据链仍为 Mock", "关键数据缺口"],
            missing_info=["真实公告核验", "真实行情与财务数据", "重大事项排查"],
            assumptions=["风险权重在 Phase 1 中高于单一正向信号", "证据不足时维持审慎研究口径"],
            conclusion_summary="风险侧偏谨慎，要求把证据补全和分歧复核放在下一步观察中。",
        )
