import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangePicker } from '@/components/date-range-picker';

describe('DateRangePicker', () => {
  it('renders correctly with given dates', () => {
    const from = '2026-06-01';
    const to = '2026-06-05';
    const onFromChange = vi.fn();
    const onToChange = vi.fn();

    render(<DateRangePicker fromDate={from} toDate={to} onFromChange={onFromChange} onToChange={onToChange} />);

    const fromInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
    const toInput = screen.getByLabelText(/end date/i) as HTMLInputElement;

    expect(fromInput.value).toBe(from);
    expect(toInput.value).toBe(to);
  });

  it('calls onChange when dates are changed', () => {
    const from = '2026-06-01';
    const to = '2026-06-05';
    const onFromChange = vi.fn();
    const onToChange = vi.fn();

    render(<DateRangePicker fromDate={from} toDate={to} onFromChange={onFromChange} onToChange={onToChange} />);

    const fromInput = screen.getByLabelText(/start date/i);
    const toInput = screen.getByLabelText(/end date/i);

    fireEvent.change(fromInput, { target: { value: '2026-06-02' } });
    expect(onFromChange).toHaveBeenCalledWith('2026-06-02');

    fireEvent.change(toInput, { target: { value: '2026-06-10' } });
    expect(onToChange).toHaveBeenCalledWith('2026-06-10');
  });
});
