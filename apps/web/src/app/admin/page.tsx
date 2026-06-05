'use client';

import { useState } from 'react';
import {
  Settings,
  Database,
  Bell,
  Activity,
  Plus,
  Trash2,
  Power,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useBanks,
  useCreateBank,
  useToggleBank,
  useAlertRules,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
  useAppConfig,
  useUpdateConfig,
  useCronStatus,
} from '@/lib/hooks';
import { getBankColor, formatDate } from '@/lib/constants';

// ─── Types ───────────────────────────────────────────────────
type AdminTab = 'filters' | 'banks' | 'alerts' | 'status';

const ADMIN_TABS = [
  { id: 'filters' as const, label: 'Filters', icon: Settings },
  { id: 'banks' as const, label: 'Banks', icon: Database },
  { id: 'alerts' as const, label: 'Alerts', icon: Bell },
  { id: 'status' as const, label: 'Status', icon: Activity },
];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('filters');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ─── Auth Handler ─────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        setLoginError('Invalid credentials');
      }
    } catch {
      setLoginError('Connection error');
    }
  };

  // ─── Login Screen ─────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="glass-card w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent-cyan/15">
              <Shield className="h-6 w-6 text-accent-cyan" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">
              Admin Access
            </h2>
            <p className="text-sm text-text-muted">
              Sign in to manage the analytics platform
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4" aria-label="Admin login">
            <div className="space-y-2">
              <label htmlFor="admin-email" className="text-sm font-medium text-text-secondary">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan"
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="text-sm font-medium text-text-secondary">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {loginError && (
              <div
                className="flex items-center gap-2 rounded-md bg-price-down/10 px-3 py-2 text-sm text-price-down"
                role="alert"
              >
                <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-md bg-accent-cyan px-4 py-2.5 text-sm font-medium text-text-inverse transition-all hover:bg-accent-cyan/90 hover:shadow-glow-cyan focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-surface-base"
            >
              <Lock className="mr-2 inline-block h-4 w-4" aria-hidden="true" />
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Authenticated Admin Panel ────────────────────────────
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Admin Panel
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Manage filters, banks, alerts, and system status
        </p>
      </header>

      {/* Tab Navigation */}
      <nav
        className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface-primary p-1"
        role="tablist"
        aria-label="Admin sections"
      >
        {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all',
              activeTab === id
                ? 'bg-accent-cyan/10 text-accent-cyan shadow-sm'
                : 'text-text-muted hover:bg-surface-hover hover:text-text-secondary',
            )}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`panel-${id}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>

      {/* Tab Panels */}
      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={activeTab}>
        {activeTab === 'filters' && <FiltersPanel />}
        {activeTab === 'banks' && <BanksPanel />}
        {activeTab === 'alerts' && <AlertsPanel />}
        {activeTab === 'status' && <StatusPanel />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Filters Panel
// ═══════════════════════════════════════════════════════════════
function FiltersPanel() {
  const { data: config, isLoading } = useAppConfig();
  const updateConfig = useUpdateConfig();

  const [minCapital, setMinCapital] = useState('');
  const [minMaxOfferPct, setMinMaxOfferPct] = useState('');
  const [saved, setSaved] = useState(false);

  // Initialize from config
  useState(() => {
    if (config) {
      const mc = config.find((c) => c.key === 'min_capital');
      const mo = config.find((c) => c.key === 'min_max_offer_pct');
      if (mc) setMinCapital(mc.value);
      if (mo) setMinMaxOfferPct(mo.value);
    }
  });

  const handleSave = async () => {
    try {
      if (minCapital) {
        await updateConfig.mutateAsync({ key: 'min_capital', value: minCapital });
      }
      if (minMaxOfferPct) {
        await updateConfig.mutateAsync({
          key: 'min_max_offer_pct',
          value: minMaxOfferPct,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <h3 className="text-lg font-semibold text-text-primary">
        Filter Configuration
      </h3>
      <p className="text-sm text-text-muted">
        Set minimum thresholds for P2P offer filtering
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="min-capital"
            className="text-sm font-medium text-text-secondary"
          >
            Minimum Capital ($)
          </label>
          <input
            id="min-capital"
            type="number"
            min={0}
            step={1}
            value={minCapital}
            onChange={(e) => setMinCapital(e.target.value)}
            className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan"
            placeholder="1000"
          />
          <p className="text-xs text-text-muted">
            Minimum merchant capital to include in analysis
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="min-max-offer"
            className="text-sm font-medium text-text-secondary"
          >
            Min Max Offer (%)
          </label>
          <input
            id="min-max-offer"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={minMaxOfferPct}
            onChange={(e) => setMinMaxOfferPct(e.target.value)}
            className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan"
            placeholder="95"
          />
          <p className="text-xs text-text-muted">
            Minimum max offer percentage threshold
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-accent-cyan px-4 py-2 text-sm font-medium text-text-inverse transition-all hover:bg-accent-cyan/90 hover:shadow-glow-cyan disabled:opacity-50"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {updateConfig.isPending ? 'Saving...' : 'Save Filters'}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-price-up animate-fade-in">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Banks Panel
// ═══════════════════════════════════════════════════════════════
function BanksPanel() {
  const { data: banks, isLoading } = useBanks();
  const createBankMutation = useCreateBank();
  const toggleBankMutation = useToggleBank();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankPayType, setNewBankPayType] = useState('');

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) return;

    try {
      await createBankMutation.mutateAsync({
        name: newBankName.trim(),
        binancePayType: newBankPayType.trim() || undefined,
      });
      setNewBankName('');
      setNewBankPayType('');
      setShowAddDialog(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">
          Banks Management
        </h3>
        <button
          type="button"
          onClick={() => setShowAddDialog(true)}
          className="inline-flex items-center gap-2 rounded-md bg-accent-cyan px-3 py-2 text-sm font-medium text-text-inverse transition-all hover:bg-accent-cyan/90 hover:shadow-glow-cyan"
          aria-label="Add new bank"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Bank
        </button>
      </div>

      {/* Add Bank Dialog */}
      {showAddDialog && (
        <div className="glass-card p-6 animate-fade-in">
          <h4 className="mb-4 text-sm font-medium text-text-secondary">
            Add New Bank
          </h4>
          <form onSubmit={handleAddBank} className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="new-bank-name" className="sr-only">Bank name</label>
              <input
                id="new-bank-name"
                type="text"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan"
                placeholder="Bank name"
                required
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="new-bank-pay-type" className="sr-only">Binance pay type</label>
              <input
                id="new-bank-pay-type"
                type="text"
                value={newBankPayType}
                onChange={(e) => setNewBankPayType(e.target.value)}
                className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan"
                placeholder="Binance pay type (optional)"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createBankMutation.isPending}
                className="rounded-md bg-accent-cyan px-4 py-2 text-sm font-medium text-text-inverse hover:bg-accent-cyan/90 disabled:opacity-50"
              >
                {createBankMutation.isPending ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddDialog(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-hover"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banks List */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border px-6 py-4"
              >
                <div className="h-4 w-24 animate-shimmer rounded" />
                <div className="h-6 w-16 animate-shimmer rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <ul role="list" aria-label="Banks list">
            {banks?.map((bank) => {
              const color = getBankColor(bank.name);
              return (
                <li
                  key={bank.id}
                  className="flex items-center justify-between border-b border-border px-6 py-4 last:border-b-0 transition-colors hover:bg-surface-hover/30"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <div>
                      <span className="font-medium text-text-primary">
                        {bank.name}
                      </span>
                      {bank.binancePayType && (
                        <span className="ml-2 text-xs text-text-muted">
                          ({bank.binancePayType})
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      toggleBankMutation.mutate({
                        id: bank.id,
                        isActive: !bank.isActive,
                      })
                    }
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all',
                      bank.isActive
                        ? 'bg-price-up/15 text-price-up'
                        : 'bg-surface-secondary text-text-muted',
                    )}
                    aria-label={`${bank.isActive ? 'Deactivate' : 'Activate'} ${bank.name}`}
                  >
                    <Power className="h-3 w-3" aria-hidden="true" />
                    {bank.isActive ? 'Active' : 'Inactive'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Alerts Panel
// ═══════════════════════════════════════════════════════════════
function AlertsPanel() {
  const { data: alerts, isLoading } = useAlertRules();
  const createAlert = useCreateAlertRule();
  const updateAlert = useUpdateAlertRule();
  const deleteAlert = useDeleteAlertRule();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: 'up' as 'up' | 'down',
    thresholdPct: '',
    telegramChatId: '',
    isActive: true,
    notifyCronStatus: false,
  });

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAlert.mutateAsync({
        type: newAlert.type,
        thresholdPct: parseFloat(newAlert.thresholdPct),
        telegramChatId: newAlert.telegramChatId,
        isActive: newAlert.isActive,
        notifyCronStatus: newAlert.notifyCronStatus,
      });
      setNewAlert({
        type: 'up',
        thresholdPct: '',
        telegramChatId: '',
        isActive: true,
        notifyCronStatus: false,
      });
      setShowAddDialog(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">
          Telegram Alert Rules
        </h3>
        <button
          type="button"
          onClick={() => setShowAddDialog(true)}
          className="inline-flex items-center gap-2 rounded-md bg-accent-cyan px-3 py-2 text-sm font-medium text-text-inverse transition-all hover:bg-accent-cyan/90 hover:shadow-glow-cyan"
          aria-label="Add new alert rule"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Rule
        </button>
      </div>

      {/* Add Alert Dialog */}
      {showAddDialog && (
        <div className="glass-card p-6 animate-fade-in">
          <h4 className="mb-4 text-sm font-medium text-text-secondary">
            New Alert Rule
          </h4>
          <form
            onSubmit={handleAddAlert}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Add alert rule"
          >
            <div className="space-y-1">
              <label htmlFor="alert-type" className="text-xs font-medium text-text-muted">
                Type
              </label>
              <select
                id="alert-type"
                value={newAlert.type}
                onChange={(e) =>
                  setNewAlert((p) => ({ ...p, type: e.target.value as 'up' | 'down' }))
                }
                className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan"
              >
                <option value="up">↑ Price Up</option>
                <option value="down">↓ Price Down</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="alert-threshold" className="text-xs font-medium text-text-muted">
                Threshold (%)
              </label>
              <input
                id="alert-threshold"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={newAlert.thresholdPct}
                onChange={(e) =>
                  setNewAlert((p) => ({ ...p, thresholdPct: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan"
                placeholder="2.5"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="alert-chat-id" className="text-xs font-medium text-text-muted">
                Telegram Chat ID
              </label>
              <input
                id="alert-chat-id"
                type="text"
                value={newAlert.telegramChatId}
                onChange={(e) =>
                  setNewAlert((p) => ({ ...p, telegramChatId: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan"
                placeholder="-100123456789"
                required
              />
            </div>

            <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-3">
              <label className="inline-flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAlert.notifyCronStatus}
                  onChange={(e) =>
                    setNewAlert((p) => ({
                      ...p,
                      notifyCronStatus: e.target.checked,
                    }))
                  }
                  className="rounded border-border bg-surface-secondary accent-accent-cyan"
                />
                Notify cron status
              </label>

              <div className="ml-auto flex gap-2">
                <button
                  type="submit"
                  disabled={createAlert.isPending}
                  className="rounded-md bg-accent-cyan px-4 py-2 text-sm font-medium text-text-inverse hover:bg-accent-cyan/90 disabled:opacity-50"
                >
                  {createAlert.isPending ? 'Adding...' : 'Add Rule'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-hover"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Alerts List */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border px-6 py-4"
              >
                <div className="h-4 w-48 animate-shimmer rounded" />
                <div className="h-6 w-20 animate-shimmer rounded" />
              </div>
            ))}
          </div>
        ) : alerts?.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-muted">
            No alert rules configured
          </div>
        ) : (
          <ul role="list" aria-label="Alert rules">
            {alerts?.map((rule) => (
              <li
                key={rule.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4 last:border-b-0 transition-colors hover:bg-surface-hover/30"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold',
                      rule.type === 'up'
                        ? 'bg-price-up/15 text-price-up'
                        : 'bg-price-down/15 text-price-down',
                    )}
                    aria-hidden="true"
                  >
                    {rule.type === 'up' ? '↑' : '↓'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {rule.type === 'up' ? 'Price Up' : 'Price Down'} ≥{' '}
                      {rule.thresholdPct}%
                    </p>
                    <p className="text-xs text-text-muted">
                      Chat: {rule.telegramChatId}
                      {rule.notifyCronStatus && ' • Cron notifications on'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateAlert.mutate({
                        id: rule.id,
                        data: { isActive: !rule.isActive },
                      })
                    }
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-all',
                      rule.isActive
                        ? 'bg-price-up/15 text-price-up'
                        : 'bg-surface-secondary text-text-muted',
                    )}
                    aria-label={`${rule.isActive ? 'Deactivate' : 'Activate'} alert rule`}
                  >
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAlert.mutate(rule.id)}
                    className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-price-down/10 hover:text-price-down"
                    aria-label="Delete alert rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Status Panel
// ═══════════════════════════════════════════════════════════════
function StatusPanel() {
  const { data: cronStatus, isLoading } = useCronStatus();

  return (
    <div className="glass-card p-6 space-y-6">
      <h3 className="text-lg font-semibold text-text-primary">
        System Status
      </h3>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 animate-shimmer rounded-lg" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 animate-shimmer rounded" />
                <div className="h-3 w-48 animate-shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Health */}
          <div className="glass-surface p-4 space-y-2">
            <div className="flex items-center gap-2">
              {cronStatus?.isHealthy ? (
                <CheckCircle2 className="h-5 w-5 text-price-up" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-warning" />
              )}
              <span className="text-sm font-medium text-text-primary">
                Cron Health
              </span>
            </div>
            <p
              className={cn(
                'text-lg font-bold',
                cronStatus?.isHealthy ? 'text-price-up' : 'text-warning',
              )}
            >
              {cronStatus?.isHealthy ? 'Healthy' : 'Unhealthy'}
            </p>
          </div>

          {/* Last Run */}
          <div className="glass-surface p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent-cyan" />
              <span className="text-sm font-medium text-text-primary">
                Last Snapshot
              </span>
            </div>
            <p className="text-sm font-medium text-text-secondary">
              {cronStatus?.lastRun
                ? formatDate(cronStatus.lastRun, 'long')
                : 'Never'}
            </p>
          </div>

          {/* Next Run */}
          <div className="glass-surface p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent-blue" />
              <span className="text-sm font-medium text-text-primary">
                Next Scheduled
              </span>
            </div>
            <p className="text-sm font-medium text-text-secondary">
              {cronStatus?.nextRun
                ? formatDate(cronStatus.nextRun, 'long')
                : 'Not scheduled'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
