import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpenText,
  Bot,
  Database,
  FileSearch,
  LineChart,
  NotebookPen,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const disclaimer = "本系统仅用于个人研究辅助，不构成确定性投资承诺。";

const watchlist = [
  {
    code: "300750",
    name: "宁德时代",
    sector: "新能源",
    suggestion: "继续观察",
    risk: "中",
    event: "海外扩产与订单交付需持续验证",
  },
  {
    code: "601899",
    name: "紫金矿业",
    sector: "有色金属",
    suggestion: "值得关注",
    risk: "中",
    event: "金属价格与项目投产节奏构成主要变量",
  },
  {
    code: "688981",
    name: "中芯国际",
    sector: "半导体",
    suggestion: "等待确认信号",
    risk: "高",
    event: "政策、产能利用率和设备约束需要交叉验证",
  },
  {
    code: "600519",
    name: "贵州茅台",
    sector: "消费",
    suggestion: "风险偏高",
    risk: "中",
    event: "需求预期与渠道价格变化需要跟踪",
  },
];

const evidence = [
  {
    type: "公告",
    title: "上市公司经营更新公告",
    source: "交易所公告",
    time: "09:10",
    confidence: "高",
  },
  {
    type: "政策",
    title: "新能源产业链相关政策变化",
    source: "公开政策文件",
    time: "11:25",
    confidence: "高",
  },
  {
    type: "新闻",
    title: "行业需求与订单交付跟踪",
    source: "授权财经资讯",
    time: "14:45",
    confidence: "中",
  },
];

const risks = [
  "股价异动：半导体板块波动放大，等待成交量确认。",
  "质押/减持：自选股中有 1 条股东行为需要复核。",
  "舆情异常：消费板块渠道价格讨论热度上升。",
];

const agents = [
  "采集清洗",
  "证据检索",
  "个股分析",
  "风险识别",
  "日报生成",
  "合规审查",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#18202f]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#dfe5ef] bg-white px-4 py-5 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-[#1f8a70] text-white">
            <LineChart size={21} />
          </div>
          <div>
            <div className="text-base font-semibold">AI 投研助手</div>
            <div className="text-xs text-[#697386]">个人研究工作台</div>
          </div>
        </div>
        <nav className="space-y-1 text-sm">
          {[
            ["仪表盘", BarChart3],
            ["自选股", BookOpenText],
            ["每日投研日报", FileSearch],
            ["风险中心", AlertTriangle],
            ["投资笔记", NotebookPen],
            ["搜索问答", Search],
            ["数据源状态", Database],
          ].map(([label, Icon]) => (
            <div
              key={label as string}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-[#344054] hover:bg-[#eef4f1]"
            >
              <Icon size={17} />
              <span>{label as string}</span>
            </div>
          ))}
        </nav>
        <div className="absolute bottom-5 left-4 right-4 rounded-md border border-[#dfe5ef] bg-[#f8fafc] p-3 text-xs leading-5 text-[#697386]">
          <ShieldCheck className="mb-2 text-[#1f8a70]" size={18} />
          不接券商账户，不自动交易，不下单，不撤单，不托管资金账户。
        </div>
      </aside>

      <section className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-[#dfe5ef] bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-normal">投研仪表盘预览</h1>
              <p className="mt-1 text-sm text-[#697386]">A 股自选股、证据链、风险提醒和 AI 日报的一屏预览。</p>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[#dfe5ef] bg-[#f8fafc] px-3 py-2 text-sm text-[#344054]">
              <Bell size={16} />
              2026-07-02 盘前研究
            </div>
          </div>
        </header>

        <div className="px-5 py-6 lg:px-8">
          <div className="mb-5 rounded-md border border-[#b7dfd4] bg-[#eef8f5] px-4 py-3 text-sm text-[#146a55]">
            {disclaimer}
          </div>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["自选股", "24", "覆盖新能源、半导体、消费、有色"],
              ["今日来源", "128", "公告、新闻、政策、财报、研报摘要"],
              ["风险提醒", "7", "3 条高优先级需要复核"],
              ["建议生成", "18", "全部绑定证据链"],
            ].map(([title, value, desc]) => (
              <div key={title} className="rounded-md border border-[#dfe5ef] bg-white p-4">
                <div className="text-sm text-[#697386]">{title}</div>
                <div className="mt-2 text-3xl font-semibold">{value}</div>
                <div className="mt-2 text-xs leading-5 text-[#697386]">{desc}</div>
              </div>
            ))}
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
            <div className="rounded-md border border-[#dfe5ef] bg-white">
              <div className="flex items-center justify-between border-b border-[#dfe5ef] px-4 py-3">
                <div className="flex items-center gap-2 font-semibold">
                  <BookOpenText size={18} />
                  自选股研究卡
                </div>
                <span className="text-xs text-[#697386]">事实 / 分析 / 建议 / 风险分离展示</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead className="bg-[#f8fafc] text-left text-xs text-[#697386]">
                    <tr>
                      <th className="px-4 py-3 font-medium">股票</th>
                      <th className="px-4 py-3 font-medium">行业</th>
                      <th className="px-4 py-3 font-medium">研究建议</th>
                      <th className="px-4 py-3 font-medium">风险</th>
                      <th className="px-4 py-3 font-medium">今日证据摘要</th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchlist.map((stock) => (
                      <tr key={stock.code} className="border-t border-[#eef2f7]">
                        <td className="px-4 py-3">
                          <div className="font-medium">{stock.name}</div>
                          <div className="text-xs text-[#697386]">{stock.code}</div>
                        </td>
                        <td className="px-4 py-3">{stock.sector}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-[#eef4f1] px-2 py-1 text-xs font-medium text-[#146a55]">
                            {stock.suggestion}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={stock.risk === "高" ? "text-[#b42318]" : "text-[#b45309]"}>
                            {stock.risk}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#475467]">{stock.event}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-md border border-[#dfe5ef] bg-white">
              <div className="border-b border-[#dfe5ef] px-4 py-3 font-semibold">每日投研日报</div>
              <div className="space-y-4 p-4">
                <div>
                  <div className="text-xs font-medium text-[#697386]">市场环境</div>
                  <p className="mt-1 text-sm leading-6">主要指数震荡，资金继续围绕高景气行业做结构切换。</p>
                </div>
                <div>
                  <div className="text-xs font-medium text-[#697386]">政策与行业</div>
                  <p className="mt-1 text-sm leading-6">新能源和半导体政策信息需要结合订单与产能数据交叉验证。</p>
                </div>
                <div>
                  <div className="text-xs font-medium text-[#697386]">今日关注</div>
                  <p className="mt-1 text-sm leading-6">优先检查高风险提醒和建议变化，不输出强制买卖指令。</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-3">
            <div className="rounded-md border border-[#dfe5ef] bg-white p-4">
              <div className="mb-4 flex items-center gap-2 font-semibold">
                <AlertTriangle size={18} />
                风险提醒
              </div>
              <div className="space-y-3">
                {risks.map((risk) => (
                  <div key={risk} className="rounded-md border border-[#f2d4b5] bg-[#fff8ed] p-3 text-sm leading-6 text-[#7a3b00]">
                    {risk}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-[#dfe5ef] bg-white p-4">
              <div className="mb-4 flex items-center gap-2 font-semibold">
                <FileSearch size={18} />
                证据链
              </div>
              <div className="space-y-3">
                {evidence.map((item) => (
                  <div key={item.title} className="border-b border-[#eef2f7] pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-md bg-[#edf2ff] px-2 py-1 text-xs text-[#344e9f]">{item.type}</span>
                      <span className="text-xs text-[#697386]">{item.time}</span>
                    </div>
                    <div className="mt-2 text-sm font-medium">{item.title}</div>
                    <div className="mt-1 text-xs text-[#697386]">
                      {item.source} · 可信度 {item.confidence}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-[#dfe5ef] bg-white p-4">
              <div className="mb-4 flex items-center gap-2 font-semibold">
                <Bot size={18} />
                Agent 流程
              </div>
              <div className="space-y-2">
                {agents.map((agent, index) => (
                  <div key={agent} className="flex items-center gap-3">
                    <div className="grid size-7 shrink-0 place-items-center rounded-md bg-[#eef4f1] text-xs font-semibold text-[#146a55]">
                      {index + 1}
                    </div>
                    <div className="flex-1 rounded-md border border-[#dfe5ef] px-3 py-2 text-sm">{agent}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-md border border-[#dfe5ef] bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles size={18} />
                搜索问答预览
              </div>
              <span className="text-xs text-[#697386]">回答必须引用来源，证据不足则拒绝形成建议</span>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="rounded-md border border-[#dfe5ef] bg-[#f8fafc] px-3 py-3 text-sm text-[#697386]">
                我的自选股里谁风险最高？
              </div>
              <div className="rounded-md bg-[#1f8a70] px-4 py-3 text-center text-sm font-medium text-white">
                生成结构化回答
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
