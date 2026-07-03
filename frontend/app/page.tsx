"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpenText,
  Bot,
  CheckCircle2,
  Database,
  FileSearch,
  Gauge,
  Layers3,
  LineChart,
  Loader2,
  NotebookPen,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { createAnalysisTask, getAnalysisTask, getAnalysisTaskEventsUrl } from "@/lib/api";
import type { AgentRunStatus, AnalysisTask, EvidenceItem, ExpertSignal, SignalDirection } from "@/lib/analysis";

type SectionId = "instant" | "dashboard" | "watchlist" | "daily" | "risk" | "notes" | "qa" | "sources";

const disclaimer = "本系统仅用于个人研究辅助，不构成确定性投资承诺。";
const timeHorizons = ["短期", "中期", "长期"];

const navItems: Array<{ id: SectionId; label: string; icon: LucideIcon }> = [
  { id: "instant", label: "即时分析", icon: Sparkles },
  { id: "dashboard", label: "仪表盘", icon: BarChart3 },
  { id: "watchlist", label: "自选股", icon: BookOpenText },
  { id: "daily", label: "每日投研日报", icon: FileSearch },
  { id: "risk", label: "风险中心", icon: AlertTriangle },
  { id: "notes", label: "投资笔记", icon: NotebookPen },
  { id: "qa", label: "搜索问答", icon: Search },
  { id: "sources", label: "数据源状态", icon: Database },
];

const sectionMeta: Record<SectionId, { title: string; subtitle: string }> = {
  instant: { title: "AI 股票研究工作台", subtitle: "输入股票代码和分析周期，运行 7 个 Agent 并生成研究卡。" },
  dashboard: { title: "投研仪表盘预览", subtitle: "A 股自选股、证据链、风险提醒和 AI 日报的一屏预览。" },
  watchlist: { title: "自选股", subtitle: "按股票查看研究标签、风险等级和今日证据摘要。" },
  daily: { title: "每日投研日报", subtitle: "聚合市场环境、政策行业、风险变化和今日关注。" },
  risk: { title: "风险中心", subtitle: "集中查看高优先级风险提醒和需要复核的触发条件。" },
  notes: { title: "投资笔记", subtitle: "记录研究假设、复盘线索和风险纪律。" },
  qa: { title: "搜索问答", subtitle: "围绕自选股、证据、风险提醒和日报摘要进行检索式问答。" },
  sources: { title: "数据源状态", subtitle: "查看 Demo API、本地后端和未来 pgvector 环境状态。" },
};

const directionLabel: Record<SignalDirection, string> = {
  positive: "偏正向",
  neutral: "中性",
  cautious: "偏谨慎",
  negative: "偏负向",
};

const watchlist = [
  ["宁德时代", "300750", "新能源", "继续观察", "中", "海外扩产与订单交付需持续验证"],
  ["紫金矿业", "601899", "有色金属", "值得关注", "中", "金属价格与项目投产节奏构成主要变量"],
  ["中芯国际", "688981", "半导体", "等待确认信号", "高", "政策、产能利用率和设备约束需要交叉验证"],
  ["贵州茅台", "600519", "消费", "风险偏高", "中", "需求预期与渠道价格变化需要跟踪"],
] as const;

const evidence = [
  ["公告", "上市公司经营更新公告", "交易所公告", "09:10", "高"],
  ["政策", "新能源产业链相关政策变化", "公开政策文件", "11:25", "高"],
  ["新闻", "行业需求与订单交付跟踪", "授权财经资讯", "14:45", "中"],
] as const;

const risks = [
  "股价异动：半导体板块波动放大，等待成交量确认。",
  "质押/减持：自选股中有 1 条股东行为需要复核。",
  "舆情异常：消费板块渠道价格讨论热度上升。",
];

const agents = ["采集清洗", "证据检索", "个股分析", "风险识别", "日报生成", "合规审查"];

function DirectionBadge({ value }: { value: SignalDirection }) {
  const styles =
    value === "positive"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : value === "cautious" || value === "negative"
        ? "bg-amber-50 text-amber-800 ring-amber-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";

  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ${styles}`}>{directionLabel[value]}</span>;
}

function StatusBadge({ value }: { value: AnalysisTask["status"] | AgentRunStatus["status"] }) {
  const labels = {
    pending: "等待中",
    running: "分析中",
    completed: "已完成",
    partial: "部分完成",
    failed: "失败",
  };
  const styles =
    value === "completed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : value === "failed"
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : value === "partial"
          ? "bg-amber-50 text-amber-800 ring-amber-200"
          : "bg-slate-100 text-slate-700 ring-slate-200";

  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ${styles}`}>{labels[value]}</span>;
}

function PercentBar({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-24 rounded bg-[#e4e9f0]">
        <div className="h-2 rounded bg-[#1f8a70]" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-10 text-xs text-[#344054]">{percent}%</span>
    </div>
  );
}

function TagList({ items, tone = "slate" }: { items: string[]; tone?: "slate" | "amber" | "rose" | "green" }) {
  const styles = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ${styles[tone]}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function EvidenceList({ title, items }: { title: string; items: EvidenceItem[] }) {
  return (
    <div className="rounded-md border border-[#dfe5ef] bg-white p-4">
      <div className="mb-3 text-sm font-semibold">{title}</div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={`${item.title}-${item.summary}`} className="rounded-md border border-[#eef2f7] bg-[#f8fafc] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-md bg-[#edf2ff] px-2 py-1 text-xs text-[#344e9f]">
                {item.source_type} · {item.evidence_level}
              </span>
              <span className="text-xs text-[#697386]">{item.published_at}</span>
            </div>
            <div className="mt-2 text-sm font-medium">{item.title}</div>
            <p className="mt-1 text-sm leading-6 text-[#475467]">{item.summary}</p>
            <div className="mt-2 text-xs text-[#697386]">
              {item.source_name} · {item.relevance}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentDetail({ signal }: { signal: ExpertSignal }) {
  return (
    <div className="rounded-md border border-[#dfe5ef] bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">{signal.agent_name}</div>
          <p className="mt-2 text-sm leading-6 text-[#475467]">{signal.conclusion_summary}</p>
        </div>
        <DirectionBadge value={signal.signal_direction} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-y border-[#eef2f7] py-3 text-sm">
        <div>
          <div className="text-xs text-[#697386]">置信度</div>
          <div className="mt-1 font-semibold">{Math.round(signal.confidence * 100)}%</div>
        </div>
        <div>
          <div className="text-xs text-[#697386]">权重</div>
          <div className="mt-1 font-semibold">{Math.round(signal.weight * 100)}%</div>
        </div>
        <div>
          <div className="text-xs text-[#697386]">周期</div>
          <div className="mt-1 font-semibold">{signal.time_horizon}</div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div>
          <div className="mb-2 text-xs font-semibold text-[#697386]">风险点</div>
          <TagList items={signal.risk_flags} tone="amber" />
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold text-[#697386]">缺失信息</div>
          <TagList items={signal.missing_info} />
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold text-[#697386]">分析假设</div>
          <TagList items={signal.assumptions} tone="green" />
        </div>
      </div>
    </div>
  );
}

function WatchlistView() {
  return (
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
            {watchlist.map(([name, code, sector, suggestion, risk, event]) => (
              <tr key={code} className="border-t border-[#eef2f7]">
                <td className="px-4 py-3">
                  <div className="font-medium">{name}</div>
                  <div className="text-xs text-[#697386]">{code}</div>
                </td>
                <td className="px-4 py-3">{sector}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-[#eef4f1] px-2 py-1 text-xs font-medium text-[#146a55]">{suggestion}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={risk === "高" ? "text-[#b42318]" : "text-[#b45309]"}>{risk}</span>
                </td>
                <td className="px-4 py-3 text-[#475467]">{event}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DailyReportView() {
  return (
    <div className="rounded-md border border-[#dfe5ef] bg-white">
      <div className="border-b border-[#dfe5ef] px-4 py-3 font-semibold">每日投研日报</div>
      <div className="grid gap-4 p-4 xl:grid-cols-3">
        {[
          ["市场环境", "主要指数震荡，资金继续围绕高景气行业做结构切换。"],
          ["政策与行业", "新能源和半导体政策信息需要结合订单与产能数据交叉验证。"],
          ["今日关注", "优先检查高风险提醒和建议变化，不输出强制买卖指令。"],
        ].map(([title, text]) => (
          <div key={title} className="rounded-md border border-[#eef2f7] bg-[#f8fafc] p-4">
            <div className="text-xs font-medium text-[#697386]">{title}</div>
            <p className="mt-2 text-sm leading-6">{text}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-[#eef2f7] px-4 py-3 text-sm text-[#146a55]">{disclaimer}</div>
    </div>
  );
}

function RiskCenterView() {
  return (
    <div className="rounded-md border border-[#dfe5ef] bg-white p-4">
      <div className="mb-4 flex items-center gap-2 font-semibold">
        <AlertTriangle size={18} />
        风险提醒
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        {risks.map((risk) => (
          <div key={risk} className="rounded-md border border-[#f2d4b5] bg-[#fff8ed] p-3 text-sm leading-6 text-[#7a3b00]">
            {risk}
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesView() {
  return (
    <div className="rounded-md border border-[#dfe5ef] bg-white p-4">
      <div className="mb-4 flex items-center gap-2 font-semibold">
        <NotebookPen size={18} />
        投资笔记
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {[
          ["002436 / 中期观察", "优先补充公告、财报和订单数据，再复核技术与资金信号。"],
          ["风险纪律", "RiskAgent 高置信谨慎时，研究卡自动降级，不形成强方向结论。"],
          ["证据要求", "核心结论优先引用 S/A/B 级证据，只有 C/D 级证据时维持信息不足口径。"],
          ["复盘重点", "记录后续是否触发失效条件，并统计哪个 Agent 贡献最大。"],
        ].map(([title, text]) => (
          <div key={title} className="rounded-md border border-[#eef2f7] bg-[#f8fafc] p-4 text-sm leading-6 text-[#344054]">
            <div className="text-xs font-medium text-[#697386]">{title}</div>
            <p className="mt-1">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function QaView() {
  return (
    <div className="rounded-md border border-[#dfe5ef] bg-white p-4">
      <div className="mb-4 flex items-center gap-2 font-semibold">
        <Search size={18} />
        搜索问答
      </div>
      <div className="rounded-md border border-[#dfe5ef] bg-[#f8fafc] px-3 py-2 text-sm text-[#697386]">
        搜索自选股、证据标题、风险提醒或日报摘要
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <div className="rounded-md border border-[#eef2f7] bg-[#f8fafc] p-4 text-sm leading-6">
          <div className="text-xs font-medium text-[#697386]">示例问题</div>
          <p className="mt-1">002436 当前主要缺失哪些证据？</p>
        </div>
        <div className="rounded-md border border-[#eef2f7] bg-[#f8fafc] p-4 text-sm leading-6">
          <div className="text-xs font-medium text-[#697386]">回答规则</div>
          <p className="mt-1">回答会优先引用证据链，证据不足时返回“信息不足，无法形成建议。”</p>
        </div>
      </div>
    </div>
  );
}

function DataSourcesView() {
  return (
    <div className="rounded-md border border-[#dfe5ef] bg-white p-4">
      <div className="mb-4 flex items-center gap-2 font-semibold">
        <Database size={18} />
        数据源状态
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        {[
          ["Mock / Demo API", "正常", "线上预览交互"],
          ["本地 FastAPI", "可运行", "完整 Agent MVP"],
          ["PostgreSQL + pgvector", "已预留", "等待正式环境接入"],
        ].map(([name, status, note]) => (
          <div key={name} className="flex items-center justify-between gap-3 rounded-md border border-[#eef2f7] bg-[#f8fafc] p-4">
            <div>
              <div className="font-medium">{name}</div>
              <div className="mt-1 text-xs text-[#697386]">{note}</div>
            </div>
            <span className="rounded-md bg-[#eef4f1] px-2 py-1 text-xs font-medium text-[#146a55]">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardView() {
  return (
    <div className="space-y-5">
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
      <section className="grid gap-5 xl:grid-cols-3">
        <RiskCenterView />
        <div className="rounded-md border border-[#dfe5ef] bg-white p-4">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <FileSearch size={18} />
            证据链
          </div>
          <div className="space-y-3">
            {evidence.map(([type, title, source, time, confidence]) => (
              <div key={title} className="border-b border-[#eef2f7] pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-md bg-[#edf2ff] px-2 py-1 text-xs text-[#344e9f]">{type}</span>
                  <span className="text-xs text-[#697386]">{time}</span>
                </div>
                <div className="mt-2 text-sm font-medium">{title}</div>
                <div className="mt-1 text-xs text-[#697386]">
                  {source} · 可信度 {confidence}
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
          <div className="space-y-3">
            {agents.map((agent, index) => (
              <div key={agent} className="flex items-center gap-3 text-sm">
                <div className="grid size-6 place-items-center rounded-full bg-[#eef4f1] text-xs font-semibold text-[#146a55]">{index + 1}</div>
                <span>{agent}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<SectionId>("instant");
  const [stockCode, setStockCode] = useState("002436");
  const [timeHorizon, setTimeHorizon] = useState("中期");
  const [task, setTask] = useState<AnalysisTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const result = task?.result;
  const allCoreEvidence = useMemo(() => result?.agent_signals.flatMap((signal) => signal.core_evidence) ?? [], [result]);
  const allNegativeEvidence = useMemo(() => result?.agent_signals.flatMap((signal) => signal.negative_evidence) ?? [], [result]);
  const allMissingInfo = useMemo(() => Array.from(new Set(result?.agent_signals.flatMap((signal) => signal.missing_info) ?? [])), [result]);
  const currentSection = sectionMeta[activeSection];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    eventSourceRef.current?.close();

    try {
      const nextTask = await createAnalysisTask(stockCode.trim(), timeHorizon);
      setTask(nextTask);
      if (["completed", "partial", "failed"].includes(nextTask.status)) {
        setIsLoading(false);
        return;
      }
      if (typeof EventSource === "undefined") {
        await pollTask(nextTask.id);
        return;
      }

      const eventSource = new EventSource(getAnalysisTaskEventsUrl(nextTask.id));
      eventSourceRef.current = eventSource;
      eventSource.addEventListener("task_update", (message) => {
        const updatedTask = JSON.parse(message.data) as AnalysisTask;
        setTask(updatedTask);
        if (["completed", "partial", "failed"].includes(updatedTask.status)) {
          eventSource.close();
          eventSourceRef.current = null;
          setIsLoading(false);
        }
      });
      eventSource.onerror = async () => {
        eventSource.close();
        eventSourceRef.current = null;
        await pollTask(nextTask.id);
      };
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "分析任务创建失败。");
      setIsLoading(false);
    }
  }

  async function pollTask(taskId: string) {
    try {
      let latestTask = await getAnalysisTask(taskId);
      setTask(latestTask);
      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (["completed", "partial", "failed"].includes(latestTask.status)) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 650));
        latestTask = await getAnalysisTask(taskId);
        setTask(latestTask);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "分析任务查询失败。");
    } finally {
      setIsLoading(false);
    }
  }

  function renderInstantAnalysis() {
    return (
      <div className="space-y-5">
        <div className="rounded-md border border-[#b7dfd4] bg-[#eef8f5] px-4 py-3 text-sm text-[#146a55]">{disclaimer}</div>
        <div className="rounded-md border border-[#dfe5ef] bg-white">
          <div className="border-b border-[#dfe5ef] px-4 py-3">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles size={18} className="text-[#1f8a70]" />
              即时股票分析
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 p-4 lg:grid-cols-[1fr_240px_auto]">
            <label className="block">
              <span className="text-xs font-medium text-[#697386]">股票代码</span>
              <div className="mt-2 flex min-h-11 items-center gap-2 rounded-md border border-[#dfe5ef] bg-[#f8fafc] px-3">
                <Search size={17} className="shrink-0 text-[#697386]" />
                <input
                  value={stockCode}
                  onChange={(event) => setStockCode(event.target.value)}
                  className="w-full bg-transparent text-sm text-[#18202f] outline-none"
                  placeholder="例如 002436"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#697386]">分析周期</span>
              <select
                value={timeHorizon}
                onChange={(event) => setTimeHorizon(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-md border border-[#dfe5ef] bg-[#f8fafc] px-3 text-sm outline-none"
              >
                {timeHorizons.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <button
              disabled={isLoading || stockCode.trim().length === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-md bg-[#1f7f68] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#146a55] disabled:cursor-not-allowed disabled:bg-[#8fb8ae]"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              开始分析
            </button>
          </form>
          {error ? <div className="border-t border-[#f3c9c2] bg-[#fff5f3] px-4 py-3 text-sm text-[#b42318]">{error}</div> : null}
        </div>

        <div className="rounded-md border border-[#111827] bg-[#151d2a] p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Orchestrator 最终研究卡</div>
            <Gauge size={18} className="text-[#7dd3bd]" />
          </div>
          {result ? (
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <div>
                <div className="text-xs text-[#aab4c2]">研究分级</div>
                <div className="mt-1 text-lg font-semibold text-[#7dd3bd]">{result.research_grade}</div>
              </div>
              <div>
                <div className="text-xs text-[#aab4c2]">综合方向</div>
                <div className="mt-1 text-lg font-semibold">{directionLabel[result.overall_direction]}</div>
              </div>
              <div>
                <div className="text-xs text-[#aab4c2]">收敛度</div>
                <div className="mt-1 text-lg font-semibold">{Math.round(result.convergence_score * 100)}%</div>
              </div>
              <div>
                <div className="text-xs text-[#aab4c2]">分歧度</div>
                <div className="mt-1 text-lg font-semibold">{Math.round(result.divergence_score * 100)}%</div>
              </div>
              <div className="md:col-span-4 rounded-md border border-white/10 bg-white/5 p-3 text-sm leading-6 text-[#d1d7e0]">
                {result.key_risk_points[0]}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-md border border-white/10 bg-white/5 p-3 text-sm leading-6 text-[#d1d7e0]">
              {task?.status === "running" ? "Agent 正在运行，完成后这里会解锁仲裁结果。" : "输入 “002436”，选择 “中期”，点击开始分析后，这里会展示完整仲裁结果。"}
            </div>
          )}
        </div>

        {task && !result ? (
          <section className="rounded-md border border-[#dfe5ef] bg-white">
            <div className="flex items-center justify-between border-b border-[#dfe5ef] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Bot size={17} />
                Agent 运行状态
              </div>
              <StatusBadge value={task.status} />
            </div>
            <div className="grid gap-3 p-4 lg:grid-cols-2 2xl:grid-cols-4">
              {task.agent_states.map((state) => (
                <div key={state.agent_name} className="rounded-md border border-[#eef2f7] bg-[#f8fafc] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{state.agent_name}</div>
                    <StatusBadge value={state.status} />
                  </div>
                  <div className="mt-3 text-xs text-[#697386]">
                    {state.confidence ? `置信度 ${Math.round(state.confidence * 100)}%` : state.error_message || "等待后端更新"}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {result ? (
          <>
            <section className="rounded-md border border-[#dfe5ef] bg-white">
              <div className="flex items-center justify-between border-b border-[#dfe5ef] px-4 py-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Bot size={18} />
                  7 个专家 Agent Signal
                </div>
                <span className="text-xs text-[#697386]">方向 / 置信度 / 权重 / 摘要</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-sm">
                  <thead className="bg-[#f8fafc] text-left text-xs text-[#697386]">
                    <tr>
                      <th className="px-4 py-3 font-medium">专家 Agent</th>
                      <th className="px-4 py-3 font-medium">方向</th>
                      <th className="px-4 py-3 font-medium">置信度</th>
                      <th className="px-4 py-3 font-medium">权重</th>
                      <th className="px-4 py-3 font-medium">结论摘要</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.agent_signals.map((signal) => (
                      <tr key={signal.agent_name} className="border-t border-[#eef2f7]">
                        <td className="px-4 py-3 font-medium">{signal.agent_name}</td>
                        <td className="px-4 py-3">
                          <DirectionBadge value={signal.signal_direction} />
                        </td>
                        <td className="px-4 py-3">
                          <PercentBar value={signal.confidence} />
                        </td>
                        <td className="px-4 py-3 text-[#344054]">{Math.round(signal.weight * 100)}%</td>
                        <td className="px-4 py-3 text-[#475467]">{signal.conclusion_summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-md border border-[#dfe5ef] bg-white p-4">
                <div className="mb-4 flex items-center gap-2 font-semibold">
                  <BarChart3 size={18} />
                  Orchestrator 汇总
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 text-xs font-semibold text-[#697386]">核心依据</div>
                    <ul className="space-y-2 text-sm leading-6 text-[#344054]">
                      {result.key_supporting_points.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold text-[#697386]">风险点</div>
                    <ul className="space-y-2 text-sm leading-6 text-[#7a3b00]">
                      {result.key_risk_points.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold text-[#697386]">缺失信息</div>
                    <TagList items={allMissingInfo} />
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-[#dfe5ef] bg-white p-4">
                <div className="mb-4 flex items-center gap-2 font-semibold">
                  <Layers3 size={18} />
                  分歧解释
                </div>
                <div className="space-y-3">
                  {result.key_divergences.map((item) => (
                    <div key={item.topic} className="rounded-md border border-[#eef2f7] bg-[#f8fafc] p-3">
                      <div className="text-sm font-semibold">{item.topic}</div>
                      <div className="mt-2 grid gap-3 xl:grid-cols-2">
                        <p className="text-sm leading-6 text-[#146a55]">{item.positive_view}</p>
                        <p className="text-sm leading-6 text-[#7a3b00]">{item.cautious_view}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#475467]">{item.interpretation}</p>
                      <div className="mt-3">
                        <TagList items={item.related_agents} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <EvidenceList title="全部核心证据" items={allCoreEvidence} />
              <EvidenceList title="全部反方证据" items={allNegativeEvidence} />
            </section>

            <section className="grid gap-4">
              {result.agent_signals.map((signal) => (
                <AgentDetail key={signal.agent_name} signal={signal} />
              ))}
            </section>

            <section className="rounded-md border border-[#dfe5ef] bg-white p-4">
              <div className="mb-4 flex items-center gap-2 font-semibold">
                <FileSearch size={18} />
                下一步观察
              </div>
              <div className="grid gap-3 xl:grid-cols-4">
                {result.next_observation_points.map((item) => (
                  <div key={item} className="rounded-md border border-[#dfe5ef] bg-[#f8fafc] p-3 text-sm leading-6 text-[#344054]">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <div className="rounded-md border border-[#b7dfd4] bg-[#eef8f5] px-4 py-3 text-sm text-[#146a55]">{result.disclaimer}</div>
          </>
        ) : null}
      </div>
    );
  }

  function renderActiveSection() {
    if (activeSection === "instant") return renderInstantAnalysis();
    if (activeSection === "dashboard") return <DashboardView />;
    if (activeSection === "watchlist") return <WatchlistView />;
    if (activeSection === "daily") return <DailyReportView />;
    if (activeSection === "risk") return <RiskCenterView />;
    if (activeSection === "notes") return <NotesView />;
    if (activeSection === "qa") return <QaView />;
    return <DataSourcesView />;
  }

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
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left ${
                activeSection === id ? "bg-[#e8f3ef] text-[#146a55]" : "text-[#344054] hover:bg-[#eef4f1]"
              }`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
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
              <h1 className="text-xl font-semibold tracking-normal">{currentSection.title}</h1>
              <p className="mt-1 text-sm text-[#697386]">{currentSection.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[#dfe5ef] bg-[#f8fafc] px-3 py-2 text-sm text-[#344054]">
              {task ? <CheckCircle2 size={16} className="text-[#1f8a70]" /> : <Bell size={16} />}
              {task ? <StatusBadge value={task.status} /> : "2026-07-02 盘前研究"}
            </div>
          </div>
        </header>

        <div className="px-5 py-6 lg:px-8">{renderActiveSection()}</div>
      </section>
    </main>
  );
}
