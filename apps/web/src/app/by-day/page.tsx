'use client';

import { useState, useMemo } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  subWeeks, 
  addWeeks, 
  eachDayOfInterval, 
  isSameDay 
} from 'date-fns';
import { ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { useTopByBank } from '@/lib/hooks';
import { getBankColor } from '@/lib/constants';
import { ChartSkeleton } from '@/components/loading-skeletons';

export default function ByDayPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // The 7 days of the current week (Monday-Sunday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  const weekDays = useMemo(() => 
    eachDayOfInterval({ start: weekStart, end: weekEnd }), 
    [weekStart, weekEnd]
  );
  
  // Default: all 7 days selected
  const [selectedDates, setSelectedDates] = useState<string[]>(
    weekDays.map(d => format(d, 'yyyy-MM-dd'))
  );

  // If user navigates week, reset selected dates to all 7 days of new week
  const handlePrevWeek = () => {
    const newDate = subWeeks(currentDate, 1);
    setCurrentDate(newDate);
    const start = startOfWeek(newDate, { weekStartsOn: 1 });
    const end = endOfWeek(newDate, { weekStartsOn: 1 });
    setSelectedDates(eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd')));
  };

  const handleNextWeek = () => {
    const newDate = addWeeks(currentDate, 1);
    setCurrentDate(newDate);
    const start = startOfWeek(newDate, { weekStartsOn: 1 });
    const end = endOfWeek(newDate, { weekStartsOn: 1 });
    setSelectedDates(eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd')));
  };

  const toggleDate = (dateStr: string) => {
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr) 
        : [...prev, dateStr]
    );
  };

  const { data, isLoading } = useTopByBank({
    from: weekStart.toISOString(),
    to: weekEnd.toISOString(),
    limit: 100 // ensure we get enough rows for all banks x 7 days
  });

  // Transform data for chart: Filter by selectedDates, and format
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.filter(item => selectedDates.includes(item.date));
  }, [data, selectedDates]);

  // To build a vertical bar chart grouped by day x bank, we need to know all banks in the filtered data, and min/max prices to scale bars.
  const minPrice = chartData.length > 0 ? Math.min(...chartData.map(d => d.topPrice)) * 0.95 : 0;
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map(d => d.topPrice)) : 100;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-accent-cyan" />
          Highest Price by Bank (Per Day)
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Compare daily maximum prices across banks
        </p>
      </header>

      <div className="glass-card p-6 space-y-6">
        {/* Week Navigator */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <button 
            onClick={handlePrevWeek}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-secondary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <div className="text-sm font-medium text-text-primary">
              {format(weekStart, 'MMM d, yyyy')} - {format(weekEnd, 'MMM d, yyyy')}
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {weekDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isSelected = selectedDates.includes(dateStr);
                return (
                  <button
                    key={dateStr}
                    onClick={() => toggleDate(dateStr)}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                      isSelected 
                        ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 shadow-sm' 
                        : 'bg-surface-secondary text-text-muted hover:bg-surface-hover border border-transparent'
                    }`}
                  >
                    {format(day, 'EEE')}
                  </button>
                )
              })}
            </div>
          </div>

          <button 
            onClick={handleNextWeek}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-secondary"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Chart Area */}
        {isLoading ? (
          <ChartSkeleton />
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-text-muted">
            No data available for the selected dates.
          </div>
        ) : (
          <div className="w-full overflow-x-auto pb-8">
            <div className="relative h-[400px] flex items-end gap-8 pt-20 px-4 min-w-max">
              {selectedDates.sort().map(dateStr => {
                const dayData = chartData.filter(d => d.date === dateStr);
                if (dayData.length === 0) return null;
                
                return (
                  <div key={dateStr} className="flex flex-col items-center flex-shrink-0 gap-4">
                    <div className="flex items-end gap-2 h-[300px]">
                    {dayData.map(item => {
                      const heightPct = Math.max(5, ((item.topPrice - minPrice) / (maxPrice - minPrice)) * 100);
                      const color = getBankColor(item.bankName);
                      return (
                        <div key={item.bankId} className="flex flex-col items-center justify-end h-full">
                          <div 
                            className="relative group w-8 sm:w-10 rounded-t-sm transition-all hover:brightness-125"
                            style={{ 
                              height: `${heightPct}%`, 
                              backgroundColor: color,
                              boxShadow: `0 -4px 12px -2px ${color}66`
                            }}
                          >
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 w-max bg-surface-primary/90 backdrop-blur-md border border-white/10 p-2 rounded shadow-xl">
                              <span className="text-xs font-bold text-text-primary">{item.bankName}</span>
                              <span className="text-sm font-mono text-accent-cyan">{item.topPrice.toFixed(2)} VES</span>
                              <span className="text-[10px] text-text-muted truncate max-w-[150px]">{item.merchantName}</span>
                            </div>
                          </div>
                          {/* Bank Name X-Axis Label */}
                          <div className="mt-2 text-[10px] text-text-secondary w-8 sm:w-10 text-center truncate" title={item.bankName}>
                            {item.bankName}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-xs font-bold text-text-primary mt-2 border-t border-border pt-2 w-full text-center">
                    {format(new Date(dateStr + 'T12:00:00'), 'MMM d, yyyy')}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
