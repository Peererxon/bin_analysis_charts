'use client';

import { useState, useMemo, useCallback } from 'react';
import { subHours, subDays, format } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { DateRangePicker } from '@/components/date-range-picker';
import { MarketChart } from '@/components/market-chart';
import { PriceTicker } from '@/components/price-ticker';
import { TopPricesTable } from '@/components/top-prices-table';
import { ChartControls } from '@/components/chart-controls';
import { ChartSkeleton } from '@/components/loading-skeletons';
import {
  useLatestSnapshot,
  useSnapshots,
  useBanks,
  useTopByDayHour,
} from '@/lib/hooks';
import { INTERVAL_OPTIONS, type IntervalValue, type TimeRangeValue } from '@/lib/constants';
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

  // Custom dialog state
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customInterval, setCustomInterval] = useState<IntervalValue>('1h');
  const [isCustomActive, setIsCustomActive] = useState(false);

  // ─── Queries ───────────────────────────────────────────────
  const { data: banks, isLoading: banksLoading } = useBanks();
  const { data: latestSnapshot, isLoading: latestLoading, isFetching: latestFetching } =
    useLatestSnapshot();

  const dateRange = useMemo(() => {
    if (isCustomActive) {
      return { 
        from: new Date(customFrom).toISOString(), 
        to: new Date(customTo + 'T23:59:59.999Z').toISOString() 
      };
    }
    return getTimeRange(timeRange);
  }, [timeRange, isCustomActive, customFrom, customTo]);

  const { data: snapshots, isLoading: snapshotsLoading } = useSnapshots({
    from: dateRange.from,
    to: dateRange.to,
    interval,
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
        const all = activeBanks.map((b) => b.name);
        return all.filter((n) => n !== bankName);
      }
      if (prev.includes(bankName)) {
        const next = prev.filter((n) => n !== bankName);
        return next.length === 0 ? [] : next;
      }
      return [...prev, bankName];
    });
  }, [activeBanks]);

  const handleIntervalChange = useCallback((newInterval: IntervalValue) => {
    setInterval(newInterval);
    if (isCustomActive) setIsCustomActive(false);
    if (timeRange === 'custom') setTimeRange('7d');
  }, [isCustomActive, timeRange]);

  const handleTimeRangeChange = useCallback((newRange: TimeRangeValue) => {
    setTimeRange(newRange);
    if (isCustomActive) setIsCustomActive(false);
  }, [isCustomActive]);

  const applyCustomRange = () => {
    setTimeRange('custom');
    setInterval(customInterval);
    setIsCustomActive(true);
    setIsCustomOpen(false);
  };

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
            onIntervalChange={handleIntervalChange}
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
            showStdDev={showStdDev}
            onToggleStdDev={() => setShowStdDev((p) => !p)}
            onCustomOpen={() => setIsCustomOpen(true)}
            customActive={isCustomActive}
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

      {/* Bottom Grid: Top 5 Table */}
      <div className="grid gap-6">
        <TopPricesTable
          data={topByDayHour ?? []}
          isLoading={topByDayHourLoading}
        />
      </div>

      <Dialog.Root open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border bg-surface-primary p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-text-primary">
                Custom Range
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-text-muted hover:text-text-secondary transition-colors" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <DateRangePicker
                fromDate={customFrom}
                toDate={customTo}
                onFromChange={setCustomFrom}
                onToChange={setCustomTo}
              />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Interval</label>
                <select
                  value={customInterval}
                  onChange={(e) => setCustomInterval(e.target.value as IntervalValue)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {INTERVAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Dialog.Close asChild>
                  <button className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-secondary rounded-md transition-colors">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  onClick={applyCustomRange}
                  className="px-4 py-2 text-sm font-medium bg-accent-blue text-white rounded-md hover:bg-accent-blue/90 transition-colors shadow-sm"
                >
                  Apply Custom Range
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
