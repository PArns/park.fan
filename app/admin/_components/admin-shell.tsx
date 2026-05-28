'use client';

import { useCallback, useState, useSyncExternalStore, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Brain,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  MapPin,
  RefreshCw,
  Server,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AdminProvider, SESSION_KEY, useAdmin } from '../_lib/admin-context';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ href: '/admin', label: 'Overview', icon: LayoutDashboard }],
  },
  {
    label: 'Monitoring',
    items: [
      { href: '/admin/system', label: 'System', icon: Server },
      { href: '/admin/queues', label: 'Queues', icon: ListChecks },
      { href: '/admin/analytics', label: 'Analytics', icon: Activity },
    ],
  },
  {
    label: 'Machine Learning',
    items: [{ href: '/admin/ml', label: 'ML Models', icon: Brain }],
  },
  {
    label: 'Management',
    items: [{ href: '/admin/parks', label: 'Parks', icon: MapPin }],
  },
  {
    label: 'Operations',
    items: [{ href: '/admin/actions', label: 'Maintenance', icon: Wrench }],
  },
];

const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

function navTitle(pathname: string): string {
  const match = [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((n) => (n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href)));
  return match?.label ?? 'Admin';
}

// ─── login ────────────────────────────────────────────────────────────────────

function LoginScreen({
  onLogin,
  error,
  loading,
}: {
  onLogin: (pass: string) => void;
  error: string | null;
  loading: boolean;
}) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) onLogin(value.trim());
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="bg-primary/15 border-primary/20 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border">
            <ShieldCheck className="text-primary h-7 w-7" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
              park.fan
            </p>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
        </div>

        <Card className="border-border/60">
          <CardContent className="space-y-4 pt-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <KeyRound className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  type="password"
                  placeholder="Admin password"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="pl-9"
                  autoFocus
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !value.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            {error && (
              <div className="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── sidebar ──────────────────────────────────────────────────────────────────

function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="border-border/40 bg-card/30 sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r md:flex">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <div className="bg-primary/15 border-primary/20 flex h-8 w-8 items-center justify-center rounded-lg border">
          <ShieldCheck className="text-primary h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
            park.fan
          </p>
          <p className="text-sm font-semibold">Admin</p>
        </div>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group, i) => (
          <div key={group.label ?? i} className="space-y-0.5">
            {group.label && (
              <p className="text-muted-foreground/70 px-3 pt-1 pb-1 text-[10px] font-semibold tracking-widest uppercase">
                {group.label}
              </p>
            )}
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:bg-card hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

// ─── topbar ───────────────────────────────────────────────────────────────────

function Topbar() {
  const pathname = usePathname();
  const { refreshing, lastUpdated, triggerRefresh, logout } = useAdmin();
  return (
    <header className="border-border/40 bg-background/80 sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-6 py-3 backdrop-blur-md">
      <h1 className="text-lg font-semibold">{navTitle(pathname)}</h1>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground hidden items-center gap-2 text-xs sm:flex">
          {refreshing && (
            <span className="bg-primary inline-block h-1.5 w-1.5 animate-pulse rounded-full" />
          )}
          {lastUpdated && (
            <span className="tabular-nums">Updated {lastUpdated.toLocaleTimeString('en-GB')}</span>
          )}
        </span>
        <button
          onClick={triggerRefresh}
          className="border-border/60 hover:border-primary/40 hover:text-primary text-foreground/70 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
          title="Refresh"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
        </button>
        <button
          onClick={logout}
          className="border-border/60 text-foreground/70 flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors hover:border-red-500/40 hover:text-red-400"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" /> Logout
        </button>
      </div>
    </header>
  );
}

// ─── shell ────────────────────────────────────────────────────────────────────

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const [savedPass, setSavedPass] = useState<string | null>(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_KEY) : null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async (pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/system-health?pass=${encodeURIComponent(pass)}`);
      if (res.status === 401 || res.status === 403) {
        setError('Wrong password.');
        return;
      }
      if (!res.ok) {
        setError(`API error: ${res.status}`);
        return;
      }
      sessionStorage.setItem(SESSION_KEY, pass);
      setSavedPass(pass);
    } catch {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSavedPass(null);
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!savedPass) {
    return <LoginScreen onLogin={handleLogin} error={error} loading={loading} />;
  }

  return (
    <AdminProvider pass={savedPass} onLogout={handleLogout}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-6 py-8">{children}</main>
        </div>
      </div>
    </AdminProvider>
  );
}
