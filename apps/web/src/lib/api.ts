// ─── API Types (mirrors @bin-analysis/db schema) ────────────────
export interface Bank {
  id: number;
  name: string;
  binancePayType: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Offer {
  id: number;
  snapshotId: number;
  rank: number;
  price: number;
  merchantName: string | null;
  availableAmount: number | null;
  maxSingleTrans: number | null;
  minSingleTrans: number | null;
}

export interface Snapshot {
  id: number;
  bankId: number;
  capturedAt: string;
  createdAt: string;
}

export interface SnapshotWithDetails extends Snapshot {
  bank: Bank;
  offers: Offer[];
}

export interface AlertRule {
  id: number;
  type: 'up' | 'down';
  thresholdPct: number;
  telegramChatId: string;
  isActive: boolean;
  notifyCronStatus: boolean;
  createdAt: string;
}

export interface AppConfig {
  key: string;
  value: string;
  updatedAt: string;
}

// ─── API Params ──────────────────────────────────────────────────
export interface FetchSnapshotsParams {
  bankIds?: number[];
  from?: string;
  to?: string;
  interval?: '10m' | '30m' | '1h' | '4h';
  limit?: number;
}

export interface FetchCompareParams {
  rangeA: { from: string; to: string };
  rangeB: { from: string; to: string };
  bankIds?: number[];
  interval?: '10m' | '30m' | '1h' | '4h';
}

export interface TopByBankParams {
  from?: string;
  to?: string;
  limit?: number;
}

export interface TopByDayHourParams {
  from?: string;
  to?: string;
  limit?: number;
}

// ─── API Response Types ──────────────────────────────────────────
export interface ChartDataPoint {
  time: string;
  price: number;
  bankId: number;
  bankName: string;
  merchantName: string | null;
  stdDev?: number;
}

export interface TopByBankResult {
  bankName: string;
  bankId: number;
  topPrice: number;
  merchantName: string | null;
  date: string;
}

export interface TopByDayHourResult {
  bankName: string;
  bankId: number;
  price: number;
  merchantName: string | null;
  date: string;
  hour: number;
}

export interface CronStatus {
  lastRun: string | null;
  isHealthy: boolean;
  nextRun: string | null;
}

// ─── API Client ──────────────────────────────────────────────────
const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)));
    } else {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

// ─── Snapshot Endpoints ──────────────────────────────────────────
export interface BucketedSnapshot {
  timestamp: string;
  price: number;
  merchantName: string | null;
  bankName: string;
  stdDeviation: number;
  topFivePrices: number[];
}

export async function fetchSnapshots(
  params: FetchSnapshotsParams = {},
): Promise<BucketedSnapshot[]> {
  const qs = buildQuery({
    bankIds: params.bankIds,
    from: params.from,
    to: params.to,
    interval: params.interval,
    limit: params.limit,
  });
  return fetchJSON<BucketedSnapshot[]>(`${API_BASE}/snapshots${qs}`);
}

export interface LatestSnapshotResult {
  snapshotId: number;
  bankId: number;
  bankName: string;
  capturedAt: string;
  offers: {
    rank: number;
    price: number;
    merchantName: string | null;
    availableAmount: number | null;
    maxSingleTrans: number | null;
    minSingleTrans: number | null;
  }[];
}

export async function fetchLatestSnapshot(): Promise<LatestSnapshotResult | null> {
  const arr = await fetchJSON<LatestSnapshotResult[]>(`${API_BASE}/snapshots/latest`);
  return arr.length > 0 ? arr[0] : null;
}

export async function fetchCompareData(
  params: FetchCompareParams,
): Promise<{ rangeA: SnapshotWithDetails[]; rangeB: SnapshotWithDetails[] }> {
  const qs = buildQuery({
    'rangeA.from': params.rangeA.from,
    'rangeA.to': params.rangeA.to,
    'rangeB.from': params.rangeB.from,
    'rangeB.to': params.rangeB.to,
    bankIds: params.bankIds,
    interval: params.interval,
  });
  return fetchJSON(`${API_BASE}/snapshots/compare${qs}`);
}

// ─── Bank Endpoints ──────────────────────────────────────────────
export async function fetchBanks(): Promise<Bank[]> {
  return fetchJSON<Bank[]>(`${API_BASE}/banks`);
}

export async function createBank(
  data: { name: string; binancePayType?: string },
): Promise<Bank> {
  return fetchJSON<Bank>(`${API_BASE}/banks`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function toggleBank(
  id: number,
  isActive: boolean,
): Promise<Bank> {
  return fetchJSON<Bank>(`${API_BASE}/banks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

// ─── Stats Endpoints ─────────────────────────────────────────────
export async function fetchTopByBank(
  params: TopByBankParams = {},
): Promise<TopByBankResult[]> {
  const qs = buildQuery({ ...params });
  return fetchJSON<TopByBankResult[]>(`${API_BASE}/stats/top-by-bank${qs}`);
}

export async function fetchTopByDayHour(
  params: TopByDayHourParams = {},
): Promise<TopByDayHourResult[]> {
  const qs = buildQuery({ ...params });
  return fetchJSON<TopByDayHourResult[]>(`${API_BASE}/stats/top-by-day-hour${qs}`);
}

// ─── Alert Endpoints ─────────────────────────────────────────────
export async function fetchAlertRules(): Promise<AlertRule[]> {
  return fetchJSON<AlertRule[]>(`${API_BASE}/alerts`);
}

export async function createAlertRule(
  data: Omit<AlertRule, 'id' | 'createdAt'>,
): Promise<AlertRule> {
  return fetchJSON<AlertRule>(`${API_BASE}/alerts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAlertRule(
  id: number,
  data: Partial<Omit<AlertRule, 'id' | 'createdAt'>>,
): Promise<AlertRule> {
  return fetchJSON<AlertRule>(`${API_BASE}/alerts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAlertRule(id: number): Promise<void> {
  await fetchJSON<void>(`${API_BASE}/alerts/${id}`, { method: 'DELETE' });
}

// ─── Config Endpoints ────────────────────────────────────────────
export interface FilterConfig {
  minCapitalUsd: number;
  minMaxOfferPct: number;
}

export async function fetchConfig(): Promise<FilterConfig> {
  return fetchJSON<FilterConfig>(`${API_BASE}/config`);
}

export async function updateConfig(
  key: string,
  value: string,
): Promise<FilterConfig> {
  const bodyKey = key === 'min_capital' || key === 'min_capital_usd' ? 'min_capital_usd' : key;
  return fetchJSON<FilterConfig>(`${API_BASE}/config`, {
    method: 'PUT',
    body: JSON.stringify({ [bodyKey]: Number(value) }),
  });
}

// ─── Cron Status ─────────────────────────────────────────────────
export async function fetchCronStatus(): Promise<CronStatus> {
  return fetchJSON<CronStatus>(`${API_BASE}/cron/status`);
}
