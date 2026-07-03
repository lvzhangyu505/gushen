import type { AnalysisTask } from "./analysis";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export function getAnalysisTaskEventsUrl(taskId: string): string {
  return `${API_BASE_URL}/analysis-tasks/${taskId}/events`;
}

export async function createAnalysisTask(stockCode: string, timeHorizon: string): Promise<AnalysisTask> {
  const response = await fetch(`${API_BASE_URL}/analysis-tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      stock_code: stockCode,
      time_horizon: timeHorizon,
    }),
  });

  if (!response.ok) {
    throw new Error("分析任务创建失败，请检查后端服务是否已启动。");
  }

  return response.json();
}

export async function getAnalysisTask(taskId: string): Promise<AnalysisTask> {
  const response = await fetch(`${API_BASE_URL}/analysis-tasks/${taskId}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("分析任务查询失败，请检查后端服务状态。");
  }

  return response.json();
}
