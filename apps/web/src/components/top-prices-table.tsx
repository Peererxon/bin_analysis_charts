'use client';

import { getBankColor, formatPrice, formatDate } from '@/lib/constants';
import type { TopByDayHourResult } from '@/lib/api';

interface TopPricesTableProps {
  data: TopByDayHourResult[];
  isLoading: boolean;
}

export function TopPricesTable({ data, isLoading }: TopPricesTableProps) {
  if (isLoading) {
    return (
      <div className="glass-card overflow-hidden" role="status" aria-label="Loading table">
        <div className="p-6 pb-3">
          <div className="h-5 w-48 animate-shimmer rounded" />
        </div>
        <div className="space-y-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-t border-border px-6 py-3">
              <div className="h-4 w-6 animate-shimmer rounded" />
              <div className="h-4 w-20 animate-shimmer rounded" />
              <div className="h-4 w-24 animate-shimmer rounded" />
              <div className="h-4 w-16 animate-shimmer rounded" />
              <div className="h-4 w-28 animate-shimmer rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-medium text-text-secondary">
          Top 5 Prices
        </h3>
        <p className="mt-4 text-center text-sm text-text-muted">
          No data available
        </p>
      </div>
    );
  }

  return (
    <section className="glass-card overflow-hidden" aria-label="Top prices table">
      <div className="p-6 pb-3">
        <h3 className="text-sm font-medium text-text-secondary">
          Top 5 — Highest Prices by Bank, Day &amp; Hour
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Top 5 highest prices">
          <thead>
            <tr className="border-t border-border text-left">
              <th
                scope="col"
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-text-muted"
              >
                #
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-text-muted"
              >
                Bank
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-text-muted"
              >
                Price (VES)
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-text-muted"
              >
                Merchant
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-text-muted"
              >
                Date &amp; Hour
              </th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((item, index) => {
              const color = getBankColor(item.bankName);
              return (
                <tr
                  key={`${item.bankId}-${item.date}-${item.hour}`}
                  className="border-t border-border transition-colors hover:bg-surface-hover/50"
                >
                  <td className="px-6 py-3 tabular-nums text-text-muted">
                    {index + 1}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                      <span className="font-medium" style={{ color }}>
                        {item.bankName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 font-mono font-medium tabular-nums text-text-primary">
                    {formatPrice(item.price)}
                  </td>
                  <td className="px-6 py-3 text-text-secondary">
                    {item.merchantName ?? '—'}
                  </td>
                  <td className="px-6 py-3 tabular-nums text-text-muted">
                    {formatDate(item.date, 'short')}, {String(item.hour).padStart(2, '0')}:00
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
