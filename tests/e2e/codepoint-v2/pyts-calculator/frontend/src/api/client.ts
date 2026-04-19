export interface CalcRequest {
  expression: string;
}

export interface CalcResponse {
  expression: string;
  result: string;
  error?: string;
}

export interface HistoryRecord {
  id: number;
  expression: string;
  result: string;
}

export interface HistoryDetailResponse {
  id: number;
  expression: string;
  result: string;
  recomputed?: string;
  error?: string;
}

export interface BatchResult {
  expression: string;
  output: string;
  error: string;
}

export async function calculate(expression: string): Promise<CalcResponse> {
  const res = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression }),
  });
  return res.json();
}

export async function getHistory(): Promise<HistoryRecord[]> {
  const res = await fetch('/api/history');
  return res.json();
}

export async function getHistoryDetail(id: number): Promise<HistoryDetailResponse> {
  const res = await fetch(`/api/history/${id}`);
  return res.json();
}

export async function batchCalculate(expressions: string[]): Promise<BatchResult[]> {
  const res = await fetch('/api/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expressions: expressions.join('\n') }),
  });
  const data = await res.json();
  return data.results || data;
}
