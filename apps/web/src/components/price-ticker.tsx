'use client';

import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { formatPrice, formatDate, getPriceDirection } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface PriceTickerProps {
  currentPrice: number | null;
  previousPrice: number | null;
  bankName: string | null;
  capturedAt: string | null;
  isLoading: boolean;
  isFetching: boolean;
}

export function PriceTicker({
  currentPrice,
  previousPrice,
  bankName,
  capturedAt,
  isLoading,
  isFetching,
}: PriceTickerProps) {
  const direction =
    currentPrice != null && previousPrice != null
      ? getPriceDirection(currentPrice, previousPrice)
      : 'neutral';

  const change =
    currentPrice != null && previousPrice != null
      ? ((currentPrice - previousPrice) / previousPrice) * 100
      : null;

  if (isLoading) {
    return (
      <div className="glass-card p-6" role="status" aria-label="Loading price data">
        <div className="flex items-center gap-6">
          <div className="space-y-3">
            <div className="h-4 w-24 animate-shimmer rounded" />
            <div className="h-10 w-48 animate-shimmer rounded" />
            <div className="h-3 w-32 animate-shimmer rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="glass-card p-6" aria-label="Current market price">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
              USDT/VES Best Price
            </span>
            {isFetching && (
              <RefreshCw
                className="h-3 w-3 animate-spin text-accent-cyan"
                aria-label="Refreshing data"
              />
            )}
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-pulse-live rounded-full bg-price-up opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-price-up" />
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span
              className={cn(
                'text-4xl font-bold tabular-nums tracking-tight transition-colors',
                direction === 'up' && 'text-price-up',
                direction === 'down' && 'text-price-down',
                direction === 'neutral' && 'text-text-primary',
              )}
            >
              {currentPrice != null ? formatPrice(currentPrice) : '—'}
            </span>
            <span className="text-lg text-text-muted">VES</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {direction === 'up' && (
              <TrendingUp className="h-4 w-4 text-price-up" aria-hidden="true" />
            )}
            {direction === 'down' && (
              <TrendingDown className="h-4 w-4 text-price-down" aria-hidden="true" />
            )}
            {direction === 'neutral' && (
              <Minus className="h-4 w-4 text-text-muted" aria-hidden="true" />
            )}
            {change != null && (
              <span
                className={cn(
                  'font-medium',
                  direction === 'up' && 'text-price-up',
                  direction === 'down' && 'text-price-down',
                  direction === 'neutral' && 'text-text-muted',
                )}
              >
                {change > 0 ? '+' : ''}
                {change.toFixed(2)}%
              </span>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="space-y-1 text-right">
          {bankName && (
            <p className="text-sm text-text-secondary">
              <span className="text-text-muted">Best bank: </span>
              <span className="font-medium text-accent-cyan">{bankName}</span>
            </p>
          )}
          {capturedAt && (
            <p className="text-xs text-text-muted">
              Last updated: {formatDate(capturedAt, 'short')}
            </p>
          )}
          <p className="text-xs text-text-muted">
            Timezone: America/Caracas (UTC-4)
          </p>
        </div>
      </div>
    </section>
  );
}
