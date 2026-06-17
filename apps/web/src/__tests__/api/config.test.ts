import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchConfig, updateConfig } from '@/lib/api';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('api config endpoints', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('fetchConfig fetches filter config correctly', async () => {
    const mockConfig = {
      minCapitalUsd: 1200,
      minMaxOfferPct: 98.5,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockConfig }),
    });

    const result = await fetchConfig();

    expect(mockFetch).toHaveBeenCalledWith('/api/config', expect.any(Object));
    expect(result).toEqual(mockConfig);
  });

  it('updateConfig constructs payload and does PUT correctly for min_capital', async () => {
    const mockConfig = {
      minCapitalUsd: 1500,
      minMaxOfferPct: 98.5,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockConfig }),
    });

    const result = await updateConfig('min_capital', '1500');

    expect(mockFetch).toHaveBeenCalledWith('/api/config', {
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
      body: JSON.stringify({ min_capital_usd: 1500 }),
    });
    expect(result).toEqual(mockConfig);
  });

  it('updateConfig constructs payload and does PUT correctly for min_max_offer_pct', async () => {
    const mockConfig = {
      minCapitalUsd: 1200,
      minMaxOfferPct: 92.4,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockConfig }),
    });

    const result = await updateConfig('min_max_offer_pct', '92.4');

    expect(mockFetch).toHaveBeenCalledWith('/api/config', {
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
      body: JSON.stringify({ min_max_offer_pct: 92.4 }),
    });
    expect(result).toEqual(mockConfig);
  });
});
