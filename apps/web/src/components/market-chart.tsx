'use client';

import { useEffect, useRef, useMemo } from 'react';
import {
  createChart,
  LineSeries,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  ColorType,
  CrosshairMode,
  type Time,
} from 'lightweight-charts';
import { getBankColor } from '@/lib/constants';

// ─── Types ───────────────────────────────────────────────────────
export interface ChartDataPoint {
  time: string;
  price: number;
  bankName: string;
  bankId: number;
  merchantName?: string | null;
  stdDev?: number;
}

interface MarketChartProps {
  data: ChartDataPoint[];
  selectedBanks: string[];
  showStdDev?: boolean;
  height?: number;
  className?: string;
}

interface BankSeries {
  lineSeries: ISeriesApi<SeriesType>;
  areaSeries?: ISeriesApi<SeriesType>;
}

// ─── Helpers ─────────────────────────────────────────────────────

/** Convert ISO time string to lightweight-charts Time (UTC timestamp) */
function toChartTime(iso: string): Time {
  return Math.floor(new Date(iso).getTime() / 1000) as Time;
}

/** Group data by bank */
function groupByBank(data: ChartDataPoint[]): Map<string, ChartDataPoint[]> {
  const groups = new Map<string, ChartDataPoint[]>();
  for (const point of data) {
    const existing = groups.get(point.bankName);
    if (existing) {
      existing.push(point);
    } else {
      groups.set(point.bankName, [point]);
    }
  }
  return groups;
}

// ─── Component ───────────────────────────────────────────────────
export function MarketChart({
  data,
  selectedBanks,
  showStdDev = false,
  height = 450,
  className = '',
}: MarketChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesMapRef = useRef<Map<string, BankSeries>>(new Map());
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Group data by bank
  const groupedData = useMemo(() => groupByBank(data), [data]);

  // Create chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#0a0e1a' },
        textColor: '#94a3b8',
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.5)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.5)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(6, 182, 212, 0.3)',
          labelBackgroundColor: '#1a1f2e',
        },
        horzLine: {
          color: 'rgba(6, 182, 212, 0.3)',
          labelBackgroundColor: '#1a1f2e',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(30, 41, 59, 0.5)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(30, 41, 59, 0.5)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    // Responsive resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        chart.applyOptions({ width });
      }
    });
    resizeObserver.observe(containerRef.current);

    // Tooltip handling
    chart.subscribeCrosshairMove((param) => {
      if (!tooltipRef.current) return;

      if (
        !param.time ||
        !param.point ||
        param.point.x < 0 ||
        param.point.y < 0
      ) {
        tooltipRef.current.style.display = 'none';
        return;
      }

      const tooltipLines: string[] = [];
      const date = new Date((param.time as number) * 1000);
      const formattedTime = new Intl.DateTimeFormat('es-VE', {
        timeZone: 'America/Caracas',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);

      tooltipLines.push(
        `<div class="text-xs text-text-muted mb-1.5">${formattedTime}</div>`,
      );

      for (const [bankName, bankSeries] of seriesMapRef.current) {
        const seriesData = param.seriesData.get(bankSeries.lineSeries);
        if (seriesData && 'value' in seriesData) {
          const color = getBankColor(bankName);
          const value = (seriesData.value as number).toFixed(2);

          // Find the corresponding data point for merchant info
          const dataPoint = groupedData.get(bankName)?.find(
            (p) => toChartTime(p.time) === param.time,
          );

          let line = `<div class="flex items-center gap-2 py-0.5">`;
          line += `<span class="inline-block h-2 w-2 rounded-full" style="background:${color}"></span>`;
          line += `<span class="font-medium" style="color:${color}">${bankName}</span>`;
          line += `<span class="ml-auto font-mono text-text-primary">${value}</span>`;
          line += `</div>`;

          if (dataPoint?.merchantName) {
            line += `<div class="text-xs text-text-muted pl-4 -mt-0.5">${dataPoint.merchantName}</div>`;
          }

          if (showStdDev && dataPoint?.stdDev) {
            line += `<div class="text-xs text-text-muted pl-4">±${dataPoint.stdDev.toFixed(2)} σ</div>`;
          }

          tooltipLines.push(line);
        }
      }

      if (tooltipLines.length > 1) {
        tooltipRef.current.innerHTML = tooltipLines.join('');
        tooltipRef.current.style.display = 'block';

        // Position tooltip
        const containerWidth = containerRef.current?.clientWidth ?? 0;
        const tooltipWidth = 220;
        let left = param.point.x + 16;
        if (left + tooltipWidth > containerWidth) {
          left = param.point.x - tooltipWidth - 16;
        }

        tooltipRef.current.style.left = `${left}px`;
        tooltipRef.current.style.top = `${param.point.y - 20}px`;
      } else {
        tooltipRef.current.style.display = 'none';
      }
    });

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesMapRef.current.clear();
    };
  }, [height]); // Only recreate on height change

  // Update series data
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Remove old series
    for (const [, bankSeries] of seriesMapRef.current) {
      chart.removeSeries(bankSeries.lineSeries);
      if (bankSeries.areaSeries) {
        chart.removeSeries(bankSeries.areaSeries);
      }
    }
    seriesMapRef.current.clear();

    // Add series for each selected bank
    for (const bankName of selectedBanks) {
      const bankData = groupedData.get(bankName);
      if (!bankData || bankData.length === 0) continue;

      const color = getBankColor(bankName);

      // Sort by time
      const sorted = [...bankData].sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
      );

      const lineData = sorted.map((p) => ({
        time: toChartTime(p.time),
        value: p.price,
      }));

      // Line series
      const lineSeries = chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: color,
        crosshairMarkerBackgroundColor: '#0a0e1a',
      });
      lineSeries.setData(lineData);

      const bankSeriesEntry: BankSeries = { lineSeries };

      // Std deviation band as area series
      if (showStdDev) {
        const hasStdDev = sorted.some((p) => p.stdDev != null);
        if (hasStdDev) {
          const areaSeries = chart.addSeries(AreaSeries, {
            lineColor: 'transparent',
            topColor: `${color}15`,
            bottomColor: 'transparent',
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          });

          const areaData = sorted.map((p) => ({
            time: toChartTime(p.time),
            value: p.price + (p.stdDev ?? 0),
          }));
          areaSeries.setData(areaData);
          bankSeriesEntry.areaSeries = areaSeries;
        }
      }

      seriesMapRef.current.set(bankName, bankSeriesEntry);
    }

    // Fit content
    chart.timeScale().fitContent();
  }, [data, selectedBanks, showStdDev, groupedData]);

  return (
    <div className={`relative ${className}`} role="img" aria-label="USDT/VES price chart showing price data for selected banks over time">
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />
      {/* Custom tooltip */}
      <div
        ref={tooltipRef}
        className="absolute z-10 hidden min-w-[200px] rounded-lg border border-border bg-surface-primary/95 px-3 py-2 shadow-elevated backdrop-blur-xl pointer-events-none"
        role="tooltip"
        style={{ display: 'none' }}
      />
    </div>
  );
}
