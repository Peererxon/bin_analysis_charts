import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges tailwind classes correctly', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
    });

    it('handles conditional classes', () => {
      expect(cn('p-4', true && 'flex', false && 'hidden')).toBe('p-4 flex');
    });

    it('resolves tailwind conflicts using tailwind-merge', () => {
      expect(cn('p-4 p-8')).toBe('p-8');
      expect(cn('bg-red-500 bg-blue-500')).toBe('bg-blue-500');
    });
  });
});
