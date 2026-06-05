'use client';

import { useState, useMemo, useCallback } from 'react';
import { subHours, subDays } from 'date-fns';
import { MarketChart } from '@/components/market-chart';
import { PriceTicker } from '@/components/price-ticker';
import { BankBarChart } from '@/components/bank-bar-chart';
import { TopPricesTable } from '@/components/top-prices-table';
import { ChartControls } from '@/components/chart-controls';
import { ChartSkeleton } from '@/components/loading-skeletons';
import {
  useLatestSnapshot,
  useSnapshots,
  useBanks,
  useTopByBank,
  useTopByDayHour,
} from '@/lib/hooks';
import type { IntervalValue, TimeRangeValue } from '@/lib/constants';
import type { ChartDataPoint } from '@/components/market-chart';

function getTimeRange(range: TimeRangeValue): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();

  switch (range) {
    case '24h':
      return { from: subHours(now, 24).toISOString(), to };
    case '7d':
      return { from: subDays(now, 7).toISOString(), to };
    case '30d':
      return { from: subDays(now, 30).toISOString(), to };
    case 'custom':
    default:
      return { from: subDays(now, 7).toISOString(), to };
  }
}

export default function DashboardPage() {
  // ─── State ─────────────────────────────────────────────────
  const [interval, setInterval] = useState<IntervalValue>('1h');
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('24h');
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [showStdDev, setShowStdDev] = useState(false);

  // ─── Queries ───────────────────────────────────────────────
  const { data: banks, isLoading: banksLoading } = useBanks();
  const { data: latestSnapshot, isLoading: latestLoading, isFetching: latestFetching } =
    useLatestSnapshot();

  const dateRange = useMemo(() => getTimeRange(timeRange), [timeRange]);

  const { data: snapshots, isLoading: snapshotsLoading } = useSnapshots({
    from: dateRange.from,
    to: dateRange.to,
    interval,
  });

  const { data: topByBank, isLoading: topByBankLoading } = useTopByBank({
    from: dateRange.from,
    to: dateRange.to,
    limit: 10,
  });

  const { data: topByDayHour, isLoading: topByDayHourLoading } =
    useTopByDayHour({
      from: dateRange.from,
      to: dateRange.to,
      limit: 5,
    });

  // ─── Initialize selected banks ────────────────────────────
  const activeBanks = useMemo(() => {
    if (!banks) return [];
    return banks.filter((b) => b.isActive);
  }, [banks]);

  // Default to all active banks if nothing selected
  const effectiveSelectedBanks = useMemo(() => {
    if (selectedBanks.length === 0 && activeBanks.length > 0) {
      return activeBanks.map((b) => b.name);
    }
    return selectedBanks;
  }, [selectedBanks, activeBanks]);

  // ─── Transform snapshot data to chart points ──────────────
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!snapshots) return [];
    return snapshots.map((snapshot) => ({
      time: snapshot.timestamp,
      price: snapshot.price,
      bankId: 0,
      bankName: snapshot.bankName,
      merchantName: snapshot.merchantName,
      stdDev: snapshot.stdDeviation,
    }));
  }, [snapshots]);

  // ─── Ticker data ──────────────────────────────────────────
  const currentPrice = useMemo(() => {
    if (!latestSnapshot?.offers?.[0]) return null;
    return latestSnapshot.offers[0].price;
  }, [latestSnapshot]);

  const previousPrice = useMemo(() => {
    if (!chartData.length) return null;
    // Get second-to-last unique timestamp
    const times = [...new Set(chartData.map((d) => d.time))].sort();
    if (times.length < 2) return currentPrice;
    const prevTime = times[times.length - 2];
    const prevPoints = chartData.filter((d) => d.time === prevTime);
    return prevPoints.length > 0
      ? Math.max(...prevPoints.map((d) => d.price))
      : null;
  }, [chartData, currentPrice]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleToggleBank = useCallback((bankName: string) => {
    setSelectedBanks((prev) => {
      if (prev.length === 0) {
        // Was showing all — now exclude this one
        const all = activeBanks.map((b) => b.name);
        return all.filter((n) => n !== bankName);
      }
      if (prev.includes(bankName)) {
        const next = prev.filter((n) => n !== bankName);
        return next.length === 0 ? [] : next; // Empty = show all
      }
      return [...prev, bankName];
    });
  }, [activeBanks]);

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Market Dashboard
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Real-time USDT/VES P2P market analytics — Binance
        </p>
      </header>

      {/* Price Ticker */}
      <PriceTicker
        currentPrice={currentPrice}
        previousPrice={previousPrice}
        bankName={latestSnapshot?.bankName ?? null}
        capturedAt={latestSnapshot?.capturedAt ?? null}
        isLoading={latestLoading}
        isFetching={latestFetching}
      />

      {/* Main Chart Section */}
      <section className="glass-card p-6 space-y-4" aria-label="Price chart">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-secondary">
            USDT/VES Price Chart
          </h3>
        </div>

        {!banksLoading && activeBanks.length > 0 && (
          <ChartControls
            banks={activeBanks}
            selectedBanks={effectiveSelectedBanks}
            onToggleBank={handleToggleBank}
            interval={interval}
            onIntervalChange={setInterval}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            showStdDev={showStdDev}
            onToggleStdDev={() => setShowStdDev((p) => !p)}
          />
        )}

        {snapshotsLoading ? (
          <div className="h-[450px] animate-shimmer rounded-lg" />
        ) : (
          <MarketChart
            data={chartData}
            selectedBanks={effectiveSelectedBanks}
            showStdDev={showStdDev}
            height={450}
          />
        )}
      </section>

      {/* Bottom Grid: Bar Chart + Top 5 Table */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BankBarChart
          data={topByBank ?? []}
          isLoading={topByBankLoading}
        />
        <TopPricesTable
          data={topByDayHour ?? []}
          isLoading={topByDayHourLoading}
        />
      </div>
    </div>
  );
}
