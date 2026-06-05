'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitCompareArrows,
  Settings,
  Activity,
  Menu,
  X,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/by-day', label: 'By Day', icon: BarChart3 },
  { href: '/compare', label: 'Compare', icon: GitCompareArrows },
  { href: '/admin', label: 'Admin', icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        className="fixed top-4 left-4 z-50 flex items-center justify-center rounded-lg p-2 lg:hidden glass-surface"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? (
          <X className="h-5 w-5 text-text-secondary" />
        ) : (
          <Menu className="h-5 w-5 text-text-secondary" />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 flex h-full w-64 flex-col border-r border-border bg-surface-primary/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-cyan/15">
            <Activity className="h-5 w-5 text-accent-cyan" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-text-primary">
              BIN Analysis
            </h1>
            <p className="text-xs text-text-muted">USDT/VES Market</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-accent-cyan/10 text-accent-cyan shadow-glow-cyan'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={cn(
                    'h-4.5 w-4.5 shrink-0 transition-colors',
                    isActive
                      ? 'text-accent-cyan'
                      : 'text-text-muted group-hover:text-text-primary',
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3">
          <p className="text-center text-xs text-text-muted">
            Binance P2P Analytics
          </p>
        </div>
      </aside>
    </>
  );
}
