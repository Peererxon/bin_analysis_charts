'use client';

import React from 'react';

export interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  label?: string;
  className?: string;
}

export function DateRangePicker({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  label,
  className = '',
}: DateRangePickerProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => onFromChange(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <span className="text-slate-500">to</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => onToChange(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
