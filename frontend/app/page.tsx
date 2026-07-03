"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  FileSearch,
  Gauge,
  Layers3,
  LineChart,
  Loader2,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { createAnalysisTask, getAnalysisTask, getAnalysisTaskEventsUrl } from "@/lib/api";
import type { AgentRunStatus, AnalysisTask, EvidenceItem, ExpertSignal, SignalDirection } from "@/lib/analysis";

const directionLabel: Record<SignalDirection, string> = {
  positive: "偏正向",
  neutral: "中性",
  cautious: "偏谨慎",
  negative: "偏负向",
};

const navItems = ["即时分析", "Agent Signal", "研究卡", "证据与风险", "下一步观察"];
const timeHorizons = ["短期", "中期", "长期"];

function DirectionBadge({ value }: { value: SignalDirection }) {
  const styles =
    value === "positive"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : value === "cautious" || value === "negative"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";

  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ring-1 ${styles}`}>{directionLabel[value]}</span>;
}

function PercentBar({ value }: { value: number }) {
  const percent = Math.round(value * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-24 rounded bg-[#e4e9f0]">
        <div className="h-2 rounded bg-[#1b7463]" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-10 text-xs text-[#344054]">{percent}%</span>
    </div>
  );
}

function EvidenceList({ title, items }: { title: string; items: EvidenceItem[] }) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold">{title}</div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={`${item.title}-${item.summary}`} className="rounded border border-[#e4e9f0] bg-[#f8fafc] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded bg-[#eef2ff] px-2 py-1 text-xs text-[#344e9f]">
                {item.source_type} · {item.evidence_level}
              </span>
              <span className="text-xs text-[#667085]">{item.published_at}</span>
            </div>
            <div className="mt-2 text-sm font-medium">{item.title}</div>
            <p className="mt-1 text-sm leading-6 text-[#475467]">{item.summary}</p>
            <div className="mt-2 text-xs text-[#667085]">
              {item.source_name} · {item.relevance}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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

  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ring-1 ${styles}`}>{labels[value]}</span>;
}

function TagList({ items, tone = "slate" }: { items: string[]; tone?: "slate" | "amber" | "rose" | "green" }) {
  const styleMap = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`rounded px-2 py-1 text-xs font-medium ring-1 ${styleMap[tone]}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function AgentDetail({ signal }: { signal: ExpertSignal }) {
  return (
    <div className="rounded border border-[#d9e0ea] bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">{signal.agent_name}</div>
          <p className="mt-2 text-sm leading-6 text-[#475467]">{signal.conclusion_summary}</p>
        </div>
        <DirectionBadge value={signal.signal_direction} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-y border-[#e4e9f0] py-3 text-sm">
        <div>
          <div className="text-xs text-[#667085]">置信度</div>
          <div className="mt-1 font-semibold">{Math.round(signal.confidence * 100)}%</div>
        </div>
        <div>
          <div className="text-xs text-[#667085]">权重</div>
          <div className="mt-1 font-semibold">{Math.round(signal.weight * 100)}%</div>
        </div>
        <div>
          <div className="text-xs text-[#667085]">周期</div>
          <div className="mt-1 font-semibold">{signal.time_horizon}</div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 2xl:grid-cols-2">
        <EvidenceList title="核心证据" items={signal.core_evidence} />
        <EvidenceList title="反方证据" items={signal.negative_evidence} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div>
          <div className="mb-2 text-xs font-semibold text-[#667085]">风险点</div>
          <TagList items={signal.risk_flags} tone="amber" />
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold text-[#667085]">缺失信息</div>
          <TagList items={signal.missing_info} />
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold text-[#667085]">分析假设</div>
          <TagList items={signal.assumptions} tone="green" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
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

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#18202f]">
      <aside className="fixed inset-y-0 left-0 hidden w-68 border-r border-[#d9e0ea] bg-[#fdfefe] px-4 py-5 xl:block">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded bg-[#1b7463] text-white">
            <LineChart size={21} />
          </div>
          <div>
            <div className="text-base font-semibold">Gushen</div>
            <div className="text-xs text-[#667085]">Agent MVP 闭环</div>
          </div>
        </div>

        <nav className="space-y-1 text-sm">
          {navItems.map((label, index) => (
            <div key={label} className={`rounded px-3 py-2.5 ${index === 0 ? "bg-[#e8f3ef] text-[#155f51]" : "text-[#344054]"}`}>
              {label}
            </div>
          ))}
        </nav>

        <div className="mt-6 rounded border border-[#d9e0ea] bg-[#f7f9fb] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#344054]">
            <ShieldCheck size={16} className="text-[#1b7463]" />
            合规边界
          </div>
          <p className="mt-2 text-xs leading-5 text-[#667085]">仅做个人研究辅助。Phase 1 不接真实数据源，不接真实模型，不连接任何交易能力。</p>
        </div>
      </aside>

      <section className="xl:pl-68">
        <header className="sticky top-0 z-10 border-b border-[#d9e0ea] bg-white/95 px-7 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">AI 股票研究工作台</h1>
              <p className="mt-1 text-sm text-[#667085]">输入股票代码和分析周期，运行 7 个 Agent 并生成研究卡。</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded border border-[#bdd9d0] bg-[#edf8f4] px-3 py-2 text-sm text-[#155f51]">
              <CheckCircle2 size={16} />
              {task ? <StatusBadge value={task.status} /> : "服务待调用"}
            </span>
          </div>
        </header>

        <div className="px-7 py-5">
          <section className="grid gap-4 2xl:grid-cols-[1.35fr_0.65fr]">
            <form onSubmit={handleSubmit} className="rounded border border-[#d9e0ea] bg-white">
              <div className="border-b border-[#e4e9f0] px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles size={17} className="text-[#1b7463]" />
                  即时股票分析
                </div>
              </div>
              <div className="grid gap-4 p-4 lg:grid-cols-[1fr_240px_auto]">
                <label className="block">
                  <span className="text-xs font-medium text-[#667085]">股票代码</span>
                  <div className="mt-2 flex min-h-11 items-center gap-2 rounded border border-[#cfd7e3] bg-[#f8fafc] px-3">
                    <Search size={17} className="shrink-0 text-[#667085]" />
                    <input
                      value={stockCode}
                      onChange={(event) => setStockCode(event.target.value)}
                      className="w-full bg-transparent text-sm text-[#18202f] outline-none"
                      placeholder="例如 002436"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-[#667085]">分析周期</span>
                  <select
                    value={timeHorizon}
                    onChange={(event) => setTimeHorizon(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded border border-[#cfd7e3] bg-[#f8fafc] px-3 text-sm outline-none"
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
                  className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded bg-[#1b7463] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#155f51] disabled:cursor-not-allowed disabled:bg-[#8fb8ae]"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  开始分析
                </button>
              </div>
              {error ? <div className="border-t border-[#f3c9c2] bg-[#fff5f3] px-4 py-3 text-sm text-[#b42318]">{error}</div> : null}
            </form>

            <div className="rounded border border-[#d9e0ea] bg-[#19202b] p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Orchestrator 最终研究卡</div>
                <Gauge size={18} className="text-[#7dd3bd]" />
              </div>
              {result ? (
                <div className="mt-5 grid grid-cols-2 gap-3">
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
                  <div className="col-span-2 rounded border border-white/10 bg-white/5 p-3 text-xs leading-5 text-[#d1d7e0]">
                    {result.key_risk_points[0]}
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded border border-white/10 bg-white/5 p-3 text-sm leading-6 text-[#d1d7e0]">
                  {task?.status === "running" ? "Agent 正在运行，完成后这里会解锁仲裁结果。" : "输入 “002436”，选择 “中期”，点击开始分析后，这里会展示完整仲裁结果。"}
                </div>
              )}
            </div>
          </section>

          {task && !result ? (
            <section className="mt-4 rounded border border-[#d9e0ea] bg-white">
              <div className="flex items-center justify-between border-b border-[#e4e9f0] px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Bot size={17} />
                  Agent 运行状态
                </div>
                <StatusBadge value={task.status} />
              </div>
              <div className="grid gap-3 p-4 lg:grid-cols-2 2xl:grid-cols-4">
                {task.agent_states.map((state) => (
                  <div key={state.agent_name} className="rounded border border-[#e4e9f0] bg-[#f8fafc] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">{state.agent_name}</div>
                      <StatusBadge value={state.status} />
                    </div>
                    <div className="mt-3 text-xs text-[#667085]">
                      {state.confidence ? `置信度 ${Math.round(state.confidence * 100)}%` : state.error_message || "等待后端更新"}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {result ? (
            <>
              <div className="mt-4 rounded border border-[#bdd9d0] bg-[#edf8f4] px-4 py-3 text-sm text-[#155f51]">{result.disclaimer}</div>

              <section className="mt-4 rounded border border-[#d9e0ea] bg-white">
                <div className="flex items-center justify-between border-b border-[#e4e9f0] px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Bot size={17} />
                    7 个专家 Agent Signal
                  </div>
                  <span className="text-xs text-[#667085]">方向 / 置信度 / 权重 / 摘要</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] border-collapse text-sm">
                    <thead className="bg-[#f7f9fb] text-left text-xs text-[#667085]">
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
                        <tr key={signal.agent_name} className="border-t border-[#e4e9f0]">
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

              <section className="mt-4 grid gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded border border-[#d9e0ea] bg-white p-4">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                    <BarChart3 size={17} />
                    Orchestrator 汇总
                  </div>
                  <div className="grid gap-4">
                    <div>
                      <div className="mb-2 text-xs font-semibold text-[#667085]">核心证据</div>
                      <ul className="space-y-2 text-sm leading-6 text-[#344054]">
                        {result.key_supporting_points.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-semibold text-[#667085]">风险点</div>
                      <ul className="space-y-2 text-sm leading-6 text-[#7a3b00]">
                        {result.key_risk_points.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-semibold text-[#667085]">缺失信息</div>
                      <TagList items={allMissingInfo} tone="slate" />
                    </div>
                  </div>
                </div>

                <div className="rounded border border-[#d9e0ea] bg-white p-4">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                    <Layers3 size={17} />
                    分歧解释
                  </div>
                  <div className="space-y-3">
                    {result.key_divergences.map((item) => (
                      <div key={item.topic} className="rounded border border-[#e4e9f0] bg-[#f8fafc] p-3">
                        <div className="text-sm font-semibold">{item.topic}</div>
                        <div className="mt-2 grid gap-3 xl:grid-cols-2">
                          <p className="text-sm leading-6 text-[#155f51]">{item.positive_view}</p>
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

              <section className="mt-4 grid gap-4 2xl:grid-cols-2">
                <EvidenceList title="全部核心证据" items={allCoreEvidence} />
                <EvidenceList title="全部反方证据" items={allNegativeEvidence} />
              </section>

              <section className="mt-4 grid gap-4">
                {result.agent_signals.map((signal) => (
                  <AgentDetail key={signal.agent_name} signal={signal} />
                ))}
              </section>

              <section className="mt-4 rounded border border-[#d9e0ea] bg-white p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <FileSearch size={17} />
                  下一步观察
                </div>
                <div className="grid gap-3 xl:grid-cols-4">
                  {result.next_observation_points.map((item) => (
                    <div key={item} className="rounded border border-[#d9e0ea] bg-[#f8fafc] p-3 text-sm leading-6 text-[#344054]">
                      {item}
                    </div>
                  ))}
                </div>
              </section>

              <div className="mt-4 rounded border border-[#bdd9d0] bg-[#edf8f4] px-4 py-3 text-sm text-[#155f51]">{result.disclaimer}</div>
            </>
          ) : (
            <section className="mt-4 rounded border border-[#d9e0ea] bg-white p-8 text-center">
              <AlertTriangle className="mx-auto text-[#667085]" size={28} />
              <div className="mt-3 text-sm font-semibold">尚未生成分析结果</div>
              <p className="mt-2 text-sm text-[#667085]">验收路径：输入 002436，选择 中期，点击 开始分析。</p>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
