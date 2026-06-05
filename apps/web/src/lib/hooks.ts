'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSnapshots,
  fetchLatestSnapshot,
  fetchCompareData,
  fetchBanks,
  fetchTopByBank,
  fetchTopByDayHour,
  fetchAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  fetchConfig,
  updateConfig,
  createBank,
  toggleBank,
  fetchCronStatus,
  type FetchSnapshotsParams,
  type FetchCompareParams,
  type TopByBankParams,
  type TopByDayHourParams,
  type AlertRule,
} from '@/lib/api';

// ─── Query Keys ──────────────────────────────────────────────────
export const queryKeys = {
  snapshots: (params?: FetchSnapshotsParams) => ['snapshots', params] as const,
  latestSnapshot: ['snapshots', 'latest'] as const,
  compare: (params?: FetchCompareParams) => ['snapshots', 'compare', params] as const,
  banks: ['banks'] as const,
  topByBank: (params?: TopByBankParams) => ['stats', 'top-by-bank', params] as const,
  topByDayHour: (params?: TopByDayHourParams) => ['stats', 'top-by-day-hour', params] as const,
  alertRules: ['alerts'] as const,
  config: ['config'] as const,
  cronStatus: ['cron', 'status'] as const,
};

// ─── Snapshot Hooks ──────────────────────────────────────────────
export function useSnapshots(params: FetchSnapshotsParams = {}) {
  return useQuery({
    queryKey: queryKeys.snapshots(params),
    queryFn: () => fetchSnapshots(params),
  });
}

export function useLatestSnapshot() {
  return useQuery({
    queryKey: queryKeys.latestSnapshot,
    queryFn: fetchLatestSnapshot,
    // More aggressive polling for the live price ticker
    refetchInterval: 120_000,
  });
}

export function useCompareData(params: FetchCompareParams | null) {
  return useQuery({
    queryKey: queryKeys.compare(params ?? undefined),
    queryFn: () => fetchCompareData(params!),
    enabled: !!params,
  });
}

// ─── Bank Hooks ──────────────────────────────────────────────────
export function useBanks() {
  return useQuery({
    queryKey: queryKeys.banks,
    queryFn: fetchBanks,
    staleTime: Infinity, // Banks rarely change
  });
}

export function useCreateBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBank,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.banks }),
  });
}

export function useToggleBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleBank(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.banks }),
  });
}

// ─── Stats Hooks ─────────────────────────────────────────────────
export function useTopByBank(params: TopByBankParams = {}) {
  return useQuery({
    queryKey: queryKeys.topByBank(params),
    queryFn: () => fetchTopByBank(params),
  });
}

export function useTopByDayHour(params: TopByDayHourParams = {}) {
  return useQuery({
    queryKey: queryKeys.topByDayHour(params),
    queryFn: () => fetchTopByDayHour(params),
  });
}

// ─── Alert Hooks ─────────────────────────────────────────────────
export function useAlertRules() {
  return useQuery({
    queryKey: queryKeys.alertRules,
    queryFn: fetchAlertRules,
  });
}

export function useCreateAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAlertRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alertRules }),
  });
}

export function useUpdateAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Omit<AlertRule, 'id' | 'createdAt'>>;
    }) => updateAlertRule(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alertRules }),
  });
}

export function useDeleteAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAlertRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alertRules }),
  });
}

// ─── Config Hooks ────────────────────────────────────────────────
export function useAppConfig() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: fetchConfig,
  });
}

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      updateConfig(key, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.config }),
  });
}

// ─── Cron Status Hook ────────────────────────────────────────────
export function useCronStatus() {
  return useQuery({
    queryKey: queryKeys.cronStatus,
    queryFn: fetchCronStatus,
    refetchInterval: 60_000, // Check every minute
  });
}
