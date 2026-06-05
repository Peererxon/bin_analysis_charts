'use client';

import { Check } from 'lucide-react';
import { INTERVAL_OPTIONS, TIME_RANGE_OPTIONS, getBankColor, type IntervalValue, type TimeRangeValue } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Bank } from '@/lib/api';

interface ChartControlsProps {
  banks: Bank[];
  selectedBanks: string[];
  onToggleBank: (bankName: string) => void;
  interval: IntervalValue;
  onIntervalChange: (interval: IntervalValue) => void;
  timeRange: TimeRangeValue;
  onTimeRangeChange: (range: TimeRangeValue) => void;
  showStdDev: boolean;
  onToggleStdDev: () => void;
}

export function ChartControls({
  banks,
  selectedBanks,
  onToggleBank,
  interval,
  onIntervalChange,
  timeRange,
  onTimeRangeChange,
  showStdDev,
  onToggleStdDev,
}: ChartControlsProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Bank Filters */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Bank filters">
        <span className="text-xs font-medium text-text-muted mr-1">Banks:</span>
        {banks.map((bank) => {
          const isSelected = selectedBanks.includes(bank.name);
          const color = getBankColor(bank.name);
          return (
            <button
              key={bank.id}
              type="button"
              onClick={() => onToggleBank(bank.name)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
                isSelected
                  ? 'border shadow-sm'
                  : 'border border-transparent bg-surface-secondary text-text-muted hover:bg-surface-hover hover:text-text-secondary',
              )}
              style={
                isSelected
                  ? {
                      borderColor: `${color}60`,
                      backgroundColor: `${color}15`,
                      color: color,
                      boxShadow: `0 0 8px ${color}20`,
                    }
                  : undefined
              }
              aria-pressed={isSelected}
              aria-label={`${isSelected ? 'Hide' : 'Show'} ${bank.name} data`}
            >
              {isSelected && <Check className="h-3 w-3" aria-hidden="true" />}
              {bank.name}
            </button>
          );
        })}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Std Dev toggle */}
        <button
          type="button"
          onClick={onToggleStdDev}
          className={cn(
            'rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
            showStdDev
              ? 'bg-accent-indigo/15 text-accent-indigo border border-accent-indigo/40'
              : 'bg-surface-secondary text-text-muted hover:bg-surface-hover border border-transparent',
          )}
          aria-pressed={showStdDev}
          aria-label={`${showStdDev ? 'Hide' : 'Show'} standard deviation band`}
        >
          ±σ
        </button>

        {/* Interval selector */}
        <div
          className="flex overflow-hidden rounded-md border border-border"
          role="radiogroup"
          aria-label="Chart interval"
        >
          {INTERVAL_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onIntervalChange(value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                interval === value
                  ? 'bg-accent-cyan/15 text-accent-cyan'
                  : 'text-text-muted hover:bg-surface-hover hover:text-text-secondary',
              )}
              role="radio"
              aria-checked={interval === value}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Time range tabs */}
        <div
          className="flex overflow-hidden rounded-md border border-border"
          role="radiogroup"
          aria-label="Time range"
        >
          {TIME_RANGE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onTimeRangeChange(value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                timeRange === value
                  ? 'bg-accent-blue/15 text-accent-blue'
                  : 'text-text-muted hover:bg-surface-hover hover:text-text-secondary',
              )}
              role="radio"
              aria-checked={timeRange === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
