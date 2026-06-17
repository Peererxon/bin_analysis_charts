import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopPricesTable } from '@/components/top-prices-table';
import type { TopByDayHourResult } from '@/lib/api';

describe('TopPricesTable', () => {
  it('renders successfully even with duplicate bankId, date, and hour combinations', () => {
    const mockData: TopByDayHourResult[] = [
      {
        bankId: 2,
        bankName: 'Banesco',
        price: 45.5,
        merchantName: 'Merchant A',
        date: '2026-06-03',
        hour: 22,
      },
      {
        bankId: 2,
        bankName: 'Banesco',
        price: 45.6,
        merchantName: 'Merchant B',
        date: '2026-06-03',
        hour: 22,
      },
    ];

    const { container } = render(<TopPricesTable data={mockData} isLoading={false} />);
    
    // The table should have rendered both rows
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);

    expect(screen.getByText('Merchant A')).toBeDefined();
    expect(screen.getByText('Merchant B')).toBeDefined();
  });

  it('renders loading state correctly', () => {
    render(<TopPricesTable data={[]} isLoading={true} />);
    expect(screen.getByRole('status', { name: /loading table/i })).toBeDefined();
  });

  it('renders empty state when no data is provided', () => {
    render(<TopPricesTable data={[]} isLoading={false} />);
    expect(screen.getByText(/no data available/i)).toBeDefined();
  });
});
