/** Bank name → chart line color mapping */
export const BANK_COLORS: Record<string, string> = {
  BDV: '#06b6d4',
  Provincial: '#8b5cf6',
  Mercantil: '#f59e0b',
  Banesco: '#10b981',
  BNC: '#f43f5e',
  Bancamiga: '#6366f1',
};

export const DEFAULT_BANK_COLOR = '#94a3b8';

export function getBankColor(bankName: string): string {
  return BANK_COLORS[bankName] ?? DEFAULT_BANK_COLOR;
}

/** All bank color entries as an array for iteration */
export const BANK_COLOR_ENTRIES = Object.entries(BANK_COLORS);

/** Interval options for chart resolution */
export const INTERVAL_OPTIONS = [
  { value: '10m', label: '10m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
] as const;

/** Time range presets */
export const TIME_RANGE_OPTIONS = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: 'custom', label: 'Custom' },
] as const;

export type IntervalValue = (typeof INTERVAL_OPTIONS)[number]['value'];
export type TimeRangeValue = (typeof TIME_RANGE_OPTIONS)[number]['value'];

/** Format a price in VES with proper locale */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/** Format a date for the Venezuela timezone */
export function formatDate(
  date: string | Date,
  style: 'short' | 'long' | 'time' = 'short',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Caracas',
  };

  switch (style) {
    case 'short':
      options.month = 'short';
      options.day = 'numeric';
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
    case 'long':
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
    case 'time':
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
  }

  return new Intl.DateTimeFormat('es-VE', options).format(d);
}

/** Determine price direction */
export function getPriceDirection(
  current: number,
  previous: number,
): 'up' | 'down' | 'neutral' {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'neutral';
}

/** Check if a date falls in "quincena" (15th of month) */
export function isQuincena(date: Date): boolean {
  const day = date.getDate();
  return day >= 14 && day <= 16;
}

/** Check if a date is in the last week of the month */
export function isLastWeekOfMonth(date: Date): boolean {
  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  return date.getDate() >= lastDay - 6;
}
