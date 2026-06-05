'use client';

import { ReactNode } from 'react';

interface LoadingSkeletonProps {
  className?: string;
  children?: ReactNode;
}

export function ChartSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div
      className={`glass-card overflow-hidden ${className}`}
      role="status"
      aria-label="Loading chart"
    >
      <div className="p-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 animate-shimmer rounded" />
          <div className="flex gap-2">
            <div className="h-7 w-16 animate-shimmer rounded" />
            <div className="h-7 w-16 animate-shimmer rounded" />
            <div className="h-7 w-16 animate-shimmer rounded" />
          </div>
        </div>
      </div>
      <div className="px-6 pb-6">
        <div className="h-[400px] animate-shimmer rounded-lg" />
      </div>
    </div>
  );
}

export function CardSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div
      className={`glass-card p-6 ${className}`}
      role="status"
      aria-label="Loading content"
    >
      <div className="space-y-4">
        <div className="h-5 w-36 animate-shimmer rounded" />
        <div className="h-4 w-full animate-shimmer rounded" />
        <div className="h-4 w-3/4 animate-shimmer rounded" />
        <div className="h-4 w-1/2 animate-shimmer rounded" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card overflow-hidden" role="status" aria-label="Loading table">
      <div className="p-6 pb-3">
        <div className="h-5 w-48 animate-shimmer rounded" />
      </div>
      <div className="space-y-0">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-t border-border px-6 py-3"
          >
            <div className="h-4 w-6 animate-shimmer rounded" />
            <div className="h-4 w-20 animate-shimmer rounded" />
            <div className="h-4 w-24 animate-shimmer rounded" />
            <div className="h-4 w-16 animate-shimmer rounded" />
            <div className="h-4 w-28 animate-shimmer rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
