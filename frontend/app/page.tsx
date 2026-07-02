import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpenText,
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Database,
  FileSearch,
  Gauge,
  Layers3,
  LineChart,
  NotebookPen,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

const disclaimer = "本系统仅用于个人研究辅助，不构成确定性投资承诺。";

const navItems = [
  ["分析台", LineChart],
  ["自选股", BookOpenText],
  ["投研日报", FileSearch],
  ["风险中心", AlertTriangle],
  ["投资笔记", NotebookPen],
  ["搜索问答", Search],
  ["数据源", Database],
] as const;

const metrics = [
  ["自选股", "24", "+3 今日更新", "覆盖 7 个行业"],
  ["来源文档", "128", "92% 已入库", "公告 / 新闻 / 政策 / 财报"],
  ["风险提醒", "7", "3 条高优先级", "减持 / 舆情 / 异动"],
  ["建议覆盖", "18", "100% 绑定证据", "无证据不形成建议"],
];

const agentSignals = [
  {
    agent: "财务分析",
    signal: "neutral",
    label: "中性",
    confidence: 62,
    weight: "14%",
    evidence: "收入增速稳定，利润率仍需等待财报确认",
  },
  {
    agent: "技术指标",
    signal: "bullish",
    label: "偏多",
    confidence: 71,
    weight: "12%",
    evidence: "趋势修复，但量能确认不足",
  },
  {
    agent: "资金流向",
    signal: "neutral",
    label: "中性",
    confidence: 58,
    weight: "12%",
    evidence: "主力净流入不连续，北向变化不显著",
  },
  {
    agent: "宏观政策",
    signal: "bullish",
    label: "偏多",
    confidence: 67,
    weight: "16%",
    evidence: "产业政策对新能源链条偏正向",
  },
  {
    agent: "行业景气",
    signal: "neutral",
    label: "中性",
    confidence: 64,
    weight: "16%",
    evidence: "订单预期改善，交付节奏仍待验证",
  },
  {
    agent: "舆情情绪",
    signal: "bearish",
    label: "偏空",
    confidence: 56,
    weight: "10%",
    evidence: "渠道价格和竞争格局讨论升温",
  },
  {
    agent: "风险预警",
    signal: "bearish",
    label: "偏空",
    confidence: 78,
    weight: "20%",
    evidence: "股价波动放大，等待确认信号",
  },
];

const watchlist = [
  ["300750", "宁德时代", "新能源", "继续观察", "中", "海外扩产与订单交付需持续验证"],
  ["601899", "紫金矿业", "有色金属", "值得关注", "中", "金属价格与项目投产节奏构成主要变量"],
  ["688981", "中芯国际", "半导体", "等待确认信号", "高", "政策、产能利用率和设备约束需要交叉验证"],
  ["600519", "贵州茅台", "消费", "风险偏高", "中", "需求预期与渠道价格变化需要跟踪"],
] as const;

const evidence = [
  ["公告", "上市公司经营更新公告", "交易所公告", "09:10", "高"],
  ["政策", "新能源产业链相关政策变化", "公开政策文件", "11:25", "高"],
  ["新闻", "行业需求与订单交付跟踪", "授权财经资讯", "14:45", "中"],
] as const;

const risks = [
  ["股价异动", "半导体板块波动放大，等待成交量确认。", "高"],
  ["质押/减持", "自选股中有 1 条股东行为需要复核。", "中"],
  ["舆情异常", "消费板块渠道价格讨论热度上升。", "中"],
] as const;

function SignalBadge({ signal, label }: { signal: string; label: string }) {
  const styles =
    signal === "bullish"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : signal === "bearish"
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";

  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ring-1 ${styles}`}>{label}</span>;
}

function RiskBadge({ value }: { value: string }) {
  const styles = value === "高" ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-amber-50 text-amber-700 ring-amber-200";

  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ring-1 ${styles}`}>{value}</span>;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#18202f]">
      <aside className="fixed inset-y-0 left-0 hidden w-68 border-r border-[#d9e0ea] bg-[#fdfefe] px-4 py-5 xl:block">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded bg-[#1b7463] text-white">
            <LineChart size={21} />
          </div>
          <div>
            <div className="text-base font-semibold">股神投研台</div>
            <div className="text-xs text-[#667085]">RAG + Multi-Agent</div>
          </div>
        </div>

        <nav className="space-y-1 text-sm">
          {navItems.map(([label, Icon], index) => (
            <div
              key={label}
              className={`flex items-center justify-between rounded px-3 py-2.5 ${
                index === 0 ? "bg-[#e8f3ef] text-[#155f51]" : "text-[#344054] hover:bg-[#f0f3f6]"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon size={17} />
                {label}
              </span>
              {index === 0 ? <ChevronRight size={15} /> : null}
            </div>
          ))}
        </nav>

        <div className="mt-6 rounded border border-[#d9e0ea] bg-[#f7f9fb] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#344054]">
            <ShieldCheck size={16} className="text-[#1b7463]" />
            合规边界
          </div>
          <p className="mt-2 text-xs leading-5 text-[#667085]">不接券商账户，不自动交易，不下单，不撤单，不托管资金账户。</p>
        </div>
      </aside>

      <section className="xl:pl-68">
        <header className="sticky top-0 z-10 border-b border-[#d9e0ea] bg-white/95 px-4 py-3 backdrop-blur lg:px-7">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-semibold">AI 投研分析台</h1>
              <p className="mt-1 text-sm text-[#667085]">输入股票后由 7 个专家 Agent 输出 Signal，再由 Orchestrator 生成研究建议。</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded border border-[#d9e0ea] bg-[#f7f9fb] px-3 py-2 text-[#344054]">
                <CalendarClock size={16} />
                2026-07-02 盘前
              </span>
              <span className="inline-flex items-center gap-2 rounded border border-[#bdd9d0] bg-[#edf8f4] px-3 py-2 text-[#155f51]">
                <CheckCircle2 size={16} />
                数据链路正常
              </span>
            </div>
          </div>
        </header>

        <div className="px-4 py-5 lg:px-7">
          <section className="grid gap-4 2xl:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded border border-[#d9e0ea] bg-white">
              <div className="border-b border-[#e4e9f0] px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles size={17} className="text-[#1b7463]" />
                  即时股票分析
                </div>
              </div>
              <div className="grid gap-4 p-4 lg:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className="text-xs font-medium text-[#667085]">股票名称或代码</span>
                  <div className="mt-2 flex min-h-11 items-center gap-2 rounded border border-[#cfd7e3] bg-[#f8fafc] px-3">
                    <Search size={17} className="shrink-0 text-[#667085]" />
                    <span className="text-sm text-[#18202f]">兴森科技 002436</span>
                  </div>
                </label>
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-[#1b7463] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#155f51]">
                  <Play size={16} />
                  开始分析
                </button>
              </div>
              <div className="grid border-t border-[#e4e9f0] lg:grid-cols-4">
                {metrics.map(([title, value, delta, desc]) => (
                  <div key={title} className="border-t border-[#e4e9f0] p-4 first:border-t-0 lg:border-l lg:border-t-0 lg:first:border-l-0">
                    <div className="text-xs text-[#667085]">{title}</div>
                    <div className="mt-2 text-2xl font-semibold">{value}</div>
                    <div className="mt-1 text-xs font-medium text-[#1b7463]">{delta}</div>
                    <div className="mt-1 text-xs text-[#667085]">{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded border border-[#d9e0ea] bg-[#19202b] p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Orchestrator 仲裁</div>
                <Gauge size={18} className="text-[#7dd3bd]" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-[#aab4c2]">综合建议</div>
                  <div className="mt-1 text-lg font-semibold text-[#7dd3bd]">继续观察</div>
                </div>
                <div>
                  <div className="text-xs text-[#aab4c2]">综合方向</div>
                  <div className="mt-1 flex items-center gap-1 text-lg font-semibold">
                    <TrendingDown size={18} className="text-[#f7b267]" />
                    偏谨慎
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#aab4c2]">置信度</div>
                  <div className="mt-1 text-lg font-semibold">72%</div>
                </div>
                <div>
                  <div className="text-xs text-[#aab4c2]">研究优先级</div>
                  <div className="mt-1 text-lg font-semibold">中高</div>
                </div>
              </div>
              <div className="mt-4 rounded border border-white/10 bg-white/5 p-3 text-xs leading-5 text-[#d1d7e0]">
                风险 Agent 权重最高；技术和政策信号偏正向，但舆情与股价波动要求等待确认信号。
              </div>
            </div>
          </section>

          <div className="mt-4 rounded border border-[#bdd9d0] bg-[#edf8f4] px-4 py-3 text-sm text-[#155f51]">{disclaimer}</div>

          <section className="mt-4 grid gap-4 2xl:grid-cols-[1.45fr_0.55fr]">
            <div className="rounded border border-[#d9e0ea] bg-white">
              <div className="flex items-center justify-between border-b border-[#e4e9f0] px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Bot size={17} />
                  7 专家 Agent Signal
                </div>
                <span className="text-xs text-[#667085]">direction / confidence / evidence</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-sm">
                  <thead className="bg-[#f7f9fb] text-left text-xs text-[#667085]">
                    <tr>
                      <th className="px-4 py-3 font-medium">专家 Agent</th>
                      <th className="px-4 py-3 font-medium">方向</th>
                      <th className="px-4 py-3 font-medium">置信度</th>
                      <th className="px-4 py-3 font-medium">权重</th>
                      <th className="px-4 py-3 font-medium">核心依据</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentSignals.map((item) => (
                      <tr key={item.agent} className="border-t border-[#e4e9f0]">
                        <td className="px-4 py-3 font-medium">{item.agent}</td>
                        <td className="px-4 py-3">
                          <SignalBadge signal={item.signal} label={item.label} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-24 rounded bg-[#e4e9f0]">
                              <div className="h-2 rounded bg-[#1b7463]" style={{ width: `${item.confidence}%` }} />
                            </div>
                            <span className="text-xs text-[#344054]">{item.confidence}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#344054]">{item.weight}</td>
                        <td className="px-4 py-3 text-[#475467]">{item.evidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded border border-[#d9e0ea] bg-white">
              <div className="border-b border-[#e4e9f0] px-4 py-3 text-sm font-semibold">今日投研日报</div>
              <div className="divide-y divide-[#e4e9f0]">
                {[
                  ["市场环境", "主要指数震荡，资金继续围绕高景气行业做结构切换。"],
                  ["政策与行业", "新能源和半导体政策信息需要结合订单与产能数据交叉验证。"],
                  ["今日关注", "优先检查高风险提醒和建议变化，不输出强制买卖指令。"],
                ].map(([title, text]) => (
                  <div key={title} className="p-4">
                    <div className="text-xs font-medium text-[#667085]">{title}</div>
                    <p className="mt-1 text-sm leading-6">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded border border-[#d9e0ea] bg-white">
              <div className="flex items-center justify-between border-b border-[#e4e9f0] px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Layers3 size={17} />
                  自选股研究队列
                </div>
                <span className="text-xs text-[#667085]">按风险和建议排序</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead className="bg-[#f7f9fb] text-left text-xs text-[#667085]">
                    <tr>
                      <th className="px-4 py-3 font-medium">股票</th>
                      <th className="px-4 py-3 font-medium">行业</th>
                      <th className="px-4 py-3 font-medium">研究建议</th>
                      <th className="px-4 py-3 font-medium">风险</th>
                      <th className="px-4 py-3 font-medium">今日证据摘要</th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchlist.map(([code, name, sector, suggestion, risk, event]) => (
                      <tr key={code} className="border-t border-[#e4e9f0]">
                        <td className="px-4 py-3">
                          <div className="font-medium">{name}</div>
                          <div className="text-xs text-[#667085]">{code}</div>
                        </td>
                        <td className="px-4 py-3 text-[#344054]">{sector}</td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-[#edf8f4] px-2 py-1 text-xs font-medium text-[#155f51] ring-1 ring-[#bdd9d0]">
                            {suggestion}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <RiskBadge value={risk} />
                        </td>
                        <td className="px-4 py-3 text-[#475467]">{event}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="rounded border border-[#d9e0ea] bg-white p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <FileSearch size={17} />
                  证据链
                </div>
                <div className="space-y-3">
                  {evidence.map(([type, title, source, time, confidence]) => (
                    <div key={title} className="border-b border-[#e4e9f0] pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded bg-[#eef2ff] px-2 py-1 text-xs text-[#344e9f]">{type}</span>
                        <span className="text-xs text-[#667085]">{time}</span>
                      </div>
                      <div className="mt-2 text-sm font-medium">{title}</div>
                      <div className="mt-1 text-xs text-[#667085]">
                        {source} · 可信度 {confidence}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded border border-[#d9e0ea] bg-white p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle size={17} />
                  风险提醒
                </div>
                <div className="space-y-3">
                  {risks.map(([title, text, risk]) => (
                    <div key={title} className="rounded border border-[#f1d1b2] bg-[#fff8ed] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-[#7a3b00]">{title}</div>
                        <RiskBadge value={risk} />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#7a3b00]">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded border border-[#d9e0ea] bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Bell size={17} />
                搜索问答
              </div>
              <span className="text-xs text-[#667085]">回答必须引用来源，证据不足则拒绝形成建议</span>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="flex min-h-11 items-center gap-2 rounded border border-[#cfd7e3] bg-[#f8fafc] px-3 text-sm text-[#667085]">
                <Search size={16} />
                我的自选股里谁风险最高？
              </div>
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-[#19202b] px-4 text-sm font-semibold text-white">
                <TrendingUp size={16} />
                生成结构化回答
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
