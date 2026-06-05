import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/banks/route';
import { NextRequest } from 'next/server';

// Mock DB module
vi.mock('@/app/api/_lib/db', () => {
  return {
    getDb: vi.fn(() => ({
      select: vi.fn(() => ({
        from: vi.fn().mockResolvedValue([
          { id: 1, name: 'Banesco', isActive: true },
          { id: 2, name: 'Mercantil', isActive: true },
        ])
      }))
    }))
  };
});

describe('GET /api/banks', () => {
  it('returns active banks', async () => {
    const req = new NextRequest('http://localhost/api/banks');
    const res = await GET(req);
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].name).toBe('Banesco');
  });
});
