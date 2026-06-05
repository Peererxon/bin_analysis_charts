'use client';

import { getBankColor, formatPrice } from '@/lib/constants';
import type { TopByBankResult } from '@/lib/api';

interface BankBarChartProps {
  data: TopByBankResult[];
  isLoading: boolean;
}

export function BankBarChart({ data, isLoading }: BankBarChartProps) {
  if (isLoading) {
    return (
      <div className="glass-card p-6" role="status" aria-label="Loading bar chart">
        <div className="mb-4 h-5 w-48 animate-shimmer rounded" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-20 animate-shimmer rounded" />
              <div className="h-8 animate-shimmer rounded" style={{ width: `${80 - i * 12}%` }} />
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
          Highest Price by Bank
        </h3>
        <p className="mt-4 text-center text-sm text-text-muted">
          No data available
        </p>
      </div>
    );
  }

  const maxPrice = Math.max(...data.map((d) => d.topPrice));

  return (
    <section className="glass-card p-6" aria-label="Highest price by bank">
      <h3 className="mb-4 text-sm font-medium text-text-secondary">
        Highest Price by Bank (Per Day)
      </h3>

      {/* Accessible data table (screen readers) */}
      <table className="sr-only" aria-label="Highest price by bank data">
        <thead>
          <tr>
            <th scope="col">Bank</th>
            <th scope="col">Top Price (VES)</th>
            <th scope="col">Merchant</th>
            <th scope="col">Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={`${item.bankName}-${item.date}`}>
              <td>{item.bankName}</td>
              <td>{formatPrice(item.topPrice)}</td>
              <td>{item.merchantName ?? '—'}</td>
              <td>{item.date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Visual bars */}
      <div className="space-y-3" aria-hidden="true">
        {data.map((item) => {
          const width = (item.topPrice / maxPrice) * 100;
          const color = getBankColor(item.bankName);

          return (
            <div key={`${item.bankName}-${item.date}`} className="group">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-text-secondary">
                  {item.bankName}
                </span>
                <span className="tabular-nums text-text-muted">
                  {formatPrice(item.topPrice)} VES
                </span>
              </div>
              <div className="h-7 w-full overflow-hidden rounded-md bg-surface-secondary">
                <div
                  className="flex h-full items-center rounded-md px-2 transition-all duration-700 ease-out"
                  style={{
                    width: `${width}%`,
                    background: `linear-gradient(90deg, ${color}30, ${color}80)`,
                    boxShadow: `0 0 12px ${color}25`,
                  }}
                >
                  <span className="text-xs font-medium text-white/90 drop-shadow-sm truncate pr-2">
                    {item.merchantName ?? 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
