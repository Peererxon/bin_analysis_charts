/**
 * Shared timezone utilities for America/Caracas (UTC-4).
 *
 * All timestamps are stored as UTC in PostgreSQL. These helpers convert
 * UTC dates to Caracas local time for display and grouping — without
 * fragile manual offset math.
 */

const CARACAS_TZ = 'America/Caracas';

// ─── Caracas-aware Date Part Extractors ─────────────────────────────

/**
 * Get the Caracas-local hour (0-23) from a UTC Date.
 *
 * Uses `Intl.DateTimeFormat` so it respects any future offset changes
 * automatically.
 */
export function getCaracasHour(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CARACAS_TZ,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const hourPart = parts.find((p) => p.type === 'hour');
  // Intl returns '24' for midnight in hourCycle 'h24'; normalise to 0
  const hour = parseInt(hourPart?.value ?? '0', 10);
  return hour === 24 ? 0 : hour;
}

/**
 * Get the Caracas-local date string (yyyy-MM-dd) from a UTC Date.
 */
export function getCaracasDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    // en-CA gives yyyy-MM-dd by default
    timeZone: CARACAS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  return parts; // e.g. "2026-06-17"
}

// ─── Display Formatting ─────────────────────────────────────────────

/**
 * Format a UTC date for display in the Caracas timezone.
 *
 * @param date  - A `Date` object or ISO string
 * @param style - 'short' (default), 'long', or 'time'
 */
export function formatCaracas(
  date: Date | string,
  style: 'short' | 'long' | 'time' = 'short',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    timeZone: CARACAS_TZ,
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

// ─── Constants ──────────────────────────────────────────────────────

/** IANA timezone identifier for use in SQL `AT TIME ZONE` clauses. */
export const CARACAS_TIMEZONE = CARACAS_TZ;
