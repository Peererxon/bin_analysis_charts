'use client';

import { useState, useMemo } from 'react';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Calendar, Tag } from 'lucide-react';
import { MarketChart, type ChartDataPoint } from '@/components/market-chart';
import { ChartSkeleton } from '@/components/loading-skeletons';
import { DateRangePicker } from '@/components/date-range-picker';
import { useBanks, useCompareData } from '@/lib/hooks';
import {
  INTERVAL_OPTIONS,
  getBankColor,
  isQuincena,
  isLastWeekOfMonth,
  type IntervalValue,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function ComparePage() {
  // ─── State ─────────────────────────────────────────────────
  const [interval, setInterval] = useState<IntervalValue>('1h');
  const [dateA, setDateA] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [dateAEnd, setDateAEnd] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const [dateB, setDateB] = useState(format(subDays(new Date(), 14), 'yyyy-MM-dd'));
  const [dateBEnd, setDateBEnd] = useState(format(subDays(new Date(), 8), 'yyyy-MM-dd'));
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [timeSlider, setTimeSlider] = useState<[number, number]>([0, 24]);

  // ─── Queries ───────────────────────────────────────────────
  const { data: banks } = useBanks();
  const activeBanks = useMemo(
    () => (banks ?? []).filter((b) => b.isActive),
    [banks],
  );

  const compareParams = useMemo(
    () => ({
      rangeA: {
        from: startOfDay(new Date(dateA)).toISOString(),
        to: endOfDay(new Date(dateAEnd)).toISOString(),
      },
      rangeB: {
        from: startOfDay(new Date(dateB)).toISOString(),
        to: endOfDay(new Date(dateBEnd)).toISOString(),
      },
      interval,
      bankIds: selectedBanks.length > 0
        ? activeBanks.filter((b) => selectedBanks.includes(b.name)).map((b) => b.id)
        : undefined,
    }),
    [dateA, dateAEnd, dateB, dateBEnd, interval, selectedBanks, activeBanks],
  );

  const { data: compareData, isLoading } = useCompareData(compareParams);

  // ─── Transform Data ───────────────────────────────────────
  const chartDataA: ChartDataPoint[] = useMemo(() => {
    if (!compareData?.rangeA) return [];
    return compareData.rangeA.flatMap((snapshot) =>
      snapshot.offers.map((offer) => ({
        time: snapshot.capturedAt,
        price: offer.price,
        bankId: snapshot.bankId,
        bankName: snapshot.bank?.name ?? 'Unknown',
        merchantName: offer.merchantName,
      })),
    );
  }, [compareData?.rangeA]);

  const chartDataB: ChartDataPoint[] = useMemo(() => {
    if (!compareData?.rangeB) return [];
    return compareData.rangeB.flatMap((snapshot) =>
      snapshot.offers.map((offer) => ({
        time: snapshot.capturedAt,
        price: offer.price,
        bankId: snapshot.bankId,
        bankName: snapshot.bank?.name ?? 'Unknown',
        merchantName: offer.merchantName,
      })),
    );
  }, [compareData?.rangeB]);

  const effectiveSelectedBanks = useMemo(() => {
    if (selectedBanks.length === 0 && activeBanks.length > 0) {
      return activeBanks.map((b) => b.name);
    }
    return selectedBanks;
  }, [selectedBanks, activeBanks]);

  // ─── Date Label helpers ────────────────────────────────────
  function getDateLabel(dateStr: string): string | null {
    const d = new Date(dateStr);
    if (isQuincena(d)) return 'Quincena';
    if (isLastWeekOfMonth(d)) return 'Última semana del mes';
    return null;
  }

  const labelA = getDateLabel(dateA) || getDateLabel(dateAEnd);
  const labelB = getDateLabel(dateB) || getDateLabel(dateBEnd);

  // ─── Handlers ─────────────────────────────────────────────
  const handleToggleBank = (bankName: string) => {
    setSelectedBanks((prev) => {
      if (prev.length === 0) {
        return activeBanks.map((b) => b.name).filter((n) => n !== bankName);
      }
      if (prev.includes(bankName)) {
        const next = prev.filter((n) => n !== bankName);
        return next.length === 0 ? [] : next;
      }
      return [...prev, bankName];
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Compare Periods
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Side-by-side analysis of different date ranges
        </p>
      </header>

      {/* Controls */}
      <div className="glass-card p-6 space-y-4">
        {/* Date Pickers Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Range A */}
          <fieldset className="space-y-2">
            <legend className="flex items-center gap-2 text-sm font-medium text-accent-cyan">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Range A
              {labelA && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning">
                  <Tag className="h-3 w-3" aria-hidden="true" />
                  {labelA}
                </span>
              )}
            </legend>
            <DateRangePicker
              fromDate={dateA}
              toDate={dateAEnd}
              onFromChange={setDateA}
              onToChange={setDateAEnd}
            />
          </fieldset>

          {/* Range B */}
          <fieldset className="space-y-2">
            <legend className="flex items-center gap-2 text-sm font-medium text-accent-blue">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Range B
              {labelB && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning">
                  <Tag className="h-3 w-3" aria-hidden="true" />
                  {labelB}
                </span>
              )}
            </legend>
            <DateRangePicker
              fromDate={dateB}
              toDate={dateBEnd}
              onFromChange={setDateB}
              onToChange={setDateBEnd}
            />
          </fieldset>
        </div>

        {/* Bank Filters + Interval */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Bank toggles */}
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Bank filters">
            <span className="text-xs font-medium text-text-muted">Banks:</span>
            {activeBanks.map((bank) => {
              const isSelected =
                selectedBanks.length === 0 || selectedBanks.includes(bank.name);
              const color = getBankColor(bank.name);
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => handleToggleBank(bank.name)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-all border',
                    isSelected
                      ? 'shadow-sm'
                      : 'border-transparent bg-surface-secondary text-text-muted hover:bg-surface-hover',
                  )}
                  style={
                    isSelected
                      ? {
                          borderColor: `${color}60`,
                          backgroundColor: `${color}15`,
                          color: color,
                        }
                      : undefined
                  }
                  aria-pressed={isSelected}
                >
                  {bank.name}
                </button>
              );
            })}
          </div>

          {/* Interval selector */}
          <div
            className="ml-auto flex overflow-hidden rounded-md border border-border"
            role="radiogroup"
            aria-label="Chart interval"
          >
            {INTERVAL_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setInterval(value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  interval === value
                    ? 'bg-accent-cyan/15 text-accent-cyan'
                    : 'text-text-muted hover:bg-surface-hover',
                )}
                role="radio"
                aria-checked={interval === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Range Slider */}
        <div className="space-y-2">
          <label htmlFor="time-slider" className="text-xs font-medium text-text-muted">
            Hour Range: {timeSlider[0]}:00 — {timeSlider[1]}:00
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted tabular-nums">0h</span>
            <input
              id="time-slider"
              type="range"
              min={0}
              max={24}
              value={timeSlider[1]}
              onChange={(e) =>
                setTimeSlider([timeSlider[0], parseInt(e.target.value)])
              }
              className="flex-1 accent-accent-cyan"
              aria-label="End hour"
            />
            <span className="text-xs text-text-muted tabular-nums">24h</span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart A */}
        <section className="glass-card p-4 space-y-3" aria-label="Range A chart">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-accent-cyan">
              Range A — {dateA} to {dateAEnd}
            </h3>
            {labelA && (
              <span className="text-xs text-warning">{labelA}</span>
            )}
          </div>
          {isLoading ? (
            <div className="h-[350px] animate-shimmer rounded-lg" />
          ) : (
            <MarketChart
              data={chartDataA}
              selectedBanks={effectiveSelectedBanks}
              height={350}
            />
          )}
        </section>

        {/* Chart B */}
        <section className="glass-card p-4 space-y-3" aria-label="Range B chart">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-accent-blue">
              Range B — {dateB} to {dateBEnd}
            </h3>
            {labelB && (
              <span className="text-xs text-warning">{labelB}</span>
            )}
          </div>
          {isLoading ? (
            <div className="h-[350px] animate-shimmer rounded-lg" />
          ) : (
            <MarketChart
              data={chartDataB}
              selectedBanks={effectiveSelectedBanks}
              height={350}
            />
          )}
        </section>
      </div>
    </div>
  );
}
