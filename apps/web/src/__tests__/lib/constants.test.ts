import { describe, it, expect } from 'vitest';
import {
  getBankColor,
  DEFAULT_BANK_COLOR,
  formatPrice,
  getPriceDirection,
  isQuincena,
  isLastWeekOfMonth,
} from '@/lib/constants';

describe('constants', () => {
  describe('getBankColor', () => {
    it('returns correct color for known bank', () => {
      expect(getBankColor('Provincial')).toBe('#8b5cf6');
      expect(getBankColor('Banesco')).toBe('#10b981');
    });

    it('returns default color for unknown bank', () => {
      expect(getBankColor('UnknownBank')).toBe(DEFAULT_BANK_COLOR);
    });
  });

  describe('formatPrice', () => {
    it('formats numbers using es-VE locale', () => {
      // Intl might format spaces differently depending on node version (e.g., non-breaking space)
      // So we check if it correctly adds 2 decimals
      const formatted = formatPrice(42.5);
      expect(formatted).toMatch(/42,50/);
    });

    it('formats large numbers correctly', () => {
      const formatted = formatPrice(1234.5);
      expect(formatted).toMatch(/1(\.|,)234,50/);
    });
  });

  describe('getPriceDirection', () => {
    it('returns up when current > previous', () => {
      expect(getPriceDirection(10, 5)).toBe('up');
    });

    it('returns down when current < previous', () => {
      expect(getPriceDirection(5, 10)).toBe('down');
    });

    it('returns neutral when current === previous', () => {
      expect(getPriceDirection(10, 10)).toBe('neutral');
    });
  });

  describe('isQuincena', () => {
    it('returns true for 14th, 15th, 16th', () => {
      expect(isQuincena(new Date('2026-06-14T10:00:00'))).toBe(true);
      expect(isQuincena(new Date('2026-06-15T10:00:00'))).toBe(true);
      expect(isQuincena(new Date('2026-06-16T10:00:00'))).toBe(true);
    });

    it('returns false for other days', () => {
      expect(isQuincena(new Date('2026-06-13T10:00:00'))).toBe(false);
      expect(isQuincena(new Date('2026-06-17T10:00:00'))).toBe(false);
    });
  });

  describe('isLastWeekOfMonth', () => {
    it('returns true for the last 7 days of the month', () => {
      // June 2026 has 30 days. Last 7 days are 24-30.
      expect(isLastWeekOfMonth(new Date('2026-06-25T10:00:00'))).toBe(true);
      expect(isLastWeekOfMonth(new Date('2026-06-30T10:00:00'))).toBe(true);
    });

    it('returns false for earlier days', () => {
      expect(isLastWeekOfMonth(new Date('2026-06-20T10:00:00'))).toBe(false);
      expect(isLastWeekOfMonth(new Date('2026-06-01T10:00:00'))).toBe(false);
    });
  });
});
