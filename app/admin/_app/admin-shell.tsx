'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronsLeft,
  ChevronsRight,
  Command as CommandIcon,
  ExternalLink,
  LogOut,
  Menu,
  PanelRight,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Kbd } from '../_ui/primitives';
import { Chip } from '../_ui/primitives';
import { useAdmin } from '../_lib/admin-context';
import { useToast } from '../_ui/toast';
import { useLocalPreference } from '../_lib/use-local-preference';
import { activeNavItem, visibleGroups, type NavItem } from './nav';
import { useSession } from './session';
import { CommandPalette } from './command-palette';
import { InspectorPanel, useInspector } from './inspector';

/**
 * The frame every admin page sits in.
 *
 * Three columns and three ways to drive them. On the left, navigation that
 * collapses to an icon rail so the middle keeps its width on a laptop. In the
 * middle, the page. On the right, the inspector — context beside the thing
 * being edited rather than under it.
 *
 * The keyboard is a first-class way through all of it, not a garnish: ⌘K opens
 * the palette, and `g` followed by a letter jumps between sections the way a
 * terminal-shaped tool does. Both are advertised in the chrome (see the hints
 * in the topbar and the palette), because a shortcut nobody is told about is a
 * shortcut nobody uses.
 */

const SIDEBAR_STORAGE_KEY = 'parkfan_admin_sidebar';

/** `g` then this letter jumps to that section. */
const JUMP_KEYS: Record<string, string> = {
  d: '/admin',
  p: '/admin/parks',
  s: '/admin/seasons',
  h: '/admin/history',
  m: '/admin/media',
  b: '/admin/blog-editor',
  y: '/admin/system',
  q: '/admin/queues',
};

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { identity, signOut } = useSession();
  const { refreshing, lastUpdated, triggerRefresh } = useAdmin();
  const inspector = useInspector();
  const toast = useToast();

  const [sidebarState, setSidebarState] = useLocalPreference(SIDEBAR_STORAGE_KEY, 'expanded');
  const collapsed = sidebarState === 'collapsed';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const jumpArmed = useRef(false);

  const groups = visibleGroups(identity.role);
  const active = activeNavItem(pathname);
  // Which section of the admin this page lives in. Seventeen entries in four
  // groups, and the title alone ("Duplikate") does not say whether you are in
  // curation or in operations.
  const activeGroup = active
    ? groups.find((group) => group.items.some((item) => item.href === active.href))?.label
    : undefined;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }

      // The `g`-then-letter chord is deliberately dead while typing: an editor
      // writing "Gondoletta" into a name field must not be teleported to the
      // dashboard by their own second keystroke. It is equally dead under any
      // open dialog — the season editor and the account dialogs hold unsaved
      // work, and navigating out from under one throws it away silently.
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;

      if (jumpArmed.current) {
        jumpArmed.current = false;
        const href = JUMP_KEYS[event.key.toLowerCase()];
        if (href) {
          event.preventDefault();
          // The curated-fields editor is neither a dialog nor an input, and
          // several of its controls are buttons that leave themselves focused
          // after a click — a tri-state switch, a month, "Korrektur entfernen".
          // With focus on one of those the chord used to fire straight through
          // and take the unsaved corrections with it.
          if (document.querySelector('[data-admin-dirty="true"]')) {
            toast.push({
              title: 'Ungespeicherte Änderungen',
              description: 'Erst speichern oder verwerfen, dann wechseln.',
              tone: 'info',
            });
            return;
          }
          router.push(href);
        }
        return;
      }
      if (event.key.toLowerCase() === 'g') {
        jumpArmed.current = true;
        // Disarm after a beat so a stray `g` does not swallow the next
        // keystroke somebody types a second later.
        setTimeout(() => {
          jumpArmed.current = false;
        }, 1200);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router, toast]);

  const toggleCollapsed = useCallback(
    () => setSidebarState(collapsed ? 'expanded' : 'collapsed'),
    [collapsed, setSidebarState]
  );

  // The drawer closes from the link that navigated, not from an effect on
  // `pathname`: reacting to the route change would be a setState inside an
  // effect, which renders the drawer open for one frame after every tap.
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar
        groups={groups}
        pathname={pathname}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
        onToggleCollapsed={toggleCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border/50 bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 backdrop-blur-md sm:px-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Navigation öffnen"
            className="hover:bg-accent rounded-lg p-2 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              {activeGroup && (
                <span className="text-muted-foreground hidden text-[11px] tracking-wide uppercase sm:inline">
                  {activeGroup}
                  <span className="mx-1.5 opacity-40">/</span>
                </span>
              )}
              <h1 className="truncate text-sm font-semibold">{active?.label ?? 'Admin'}</h1>
            </div>
            {active?.description && (
              <p className="text-muted-foreground hidden truncate text-xs sm:block">
                {active.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground hidden items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors sm:flex"
          >
            <CommandIcon className="h-3.5 w-3.5" />
            <span>Suchen</span>
            <Kbd>⌘K</Kbd>
          </button>

          <button
            type="button"
            onClick={triggerRefresh}
            title={
              lastUpdated
                ? `Zuletzt aktualisiert ${lastUpdated.toLocaleTimeString('de-DE')}`
                : 'Aktualisieren'
            }
            aria-label="Aktualisieren"
            className="hover:bg-accent rounded-lg p-2"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </button>

          {inspector.content && (
            <button
              type="button"
              onClick={inspector.toggle}
              aria-label="Inspektor umschalten"
              className={cn('hover:bg-accent rounded-lg p-2', inspector.open && 'text-primary')}
            >
              <PanelRight className="h-4 w-4" />
            </button>
          )}

          <AccountMenu
            name={identity.displayName}
            email={identity.email}
            role={identity.role}
            onSignOut={() => void signOut()}
          />
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <InspectorPanel />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

// ─── sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  groups,
  pathname,
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: {
  groups: ReturnType<typeof visibleGroups>;
  pathname: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Navigation schließen"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
        />
      )}
      <nav
        className={cn(
          // The sidebar tokens have existed in globals.css since the theme was
          // set up and nothing has ever used them. This is what they are for.
          'bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-[width,transform] duration-200',
          'bg-gradient-to-b from-[oklch(1_0_0_/_0.02)] to-transparent',
          'md:sticky md:top-0 md:z-auto md:h-[100dvh] md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-60 md:w-16' : 'w-60'
        )}
      >
        <div className="flex h-14 items-center gap-2 px-3">
          <span className="bg-primary/15 border-primary/20 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
            <ShieldCheck className="h-4 w-4" />
          </span>
          {(!collapsed || mobileOpen) && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                park<span className="text-primary">.fan</span>
              </p>
              <p className="text-muted-foreground truncate text-[10px] font-medium tracking-[0.2em] uppercase">
                Verwaltung
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Schließen"
            className="hover:bg-accent rounded p-1.5 md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dense enough that four groups and seventeen entries clear the footer
            on a 900 px laptop: at the old rhythm the account group slid under
            "Zur Website" and read as a rendering fault rather than a scroll. */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2 py-2">
          {groups.map((group) => (
            <div key={group.label}>
              {(!collapsed || mobileOpen) && (
                <p className="text-muted-foreground px-2 pb-1 text-[10px] font-semibold tracking-widest uppercase">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    active={
                      item.href === '/admin'
                        ? pathname === '/admin'
                        : pathname.startsWith(item.href)
                    }
                    collapsed={collapsed && !mobileOpen}
                    onNavigate={onCloseMobile}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-sidebar-border space-y-1 border-t p-2">
          <a
            href="https://park.fan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {(!collapsed || mobileOpen) && <span className="truncate">Zur Website</span>}
          </a>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="text-muted-foreground hover:bg-accent hover:text-foreground hidden w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm md:flex"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronsLeft className="h-4 w-4 shrink-0" />
            )}
            {!collapsed && <span className="truncate">Einklappen</span>}
          </button>
        </div>
      </nav>
    </>
  );
}

function SidebarLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        // The rail is what makes "where am I" readable at a glance in a list of
        // seventeen entries: a tinted row alone reads as a hover state, and in
        // the collapsed sidebar there is no label to disambiguate it.
        'relative flex items-center gap-2.5 rounded-lg py-1.5 pr-2.5 pl-3 text-sm transition-colors',
        'before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-0.5 before:rounded-full before:transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground before:bg-primary font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground before:bg-transparent'
      )}
    >
      <item.icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

// ─── account ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  owner: 'Inhaber',
  editor: 'Redaktion',
  author: 'Autor',
  viewer: 'Lesend',
};

function AccountMenu({
  name,
  email,
  role,
  onSignOut,
}: {
  name: string;
  email: string;
  role: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    // Capture phase: a click on a link inside the menu should navigate AND
    // close, and a bubbling listener would close it before the link handled it.
    window.addEventListener('click', close, { capture: true });
    return () => window.removeEventListener('click', close, { capture: true });
  }, [open]);

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="bg-primary/15 text-primary hover:bg-primary/25 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
        aria-label="Konto"
      >
        {initials || '?'}
      </button>

      {open && (
        <div className="border-border/60 bg-card absolute right-0 z-50 mt-2 w-60 rounded-xl border p-1 shadow-xl">
          <div className="border-border/50 border-b px-3 py-2.5">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="text-muted-foreground truncate text-xs">{email}</p>
            <Chip tone="primary" className="mt-1.5">
              {ROLE_LABELS[role] ?? role}
            </Chip>
          </div>
          <Link
            href="/admin/account"
            className="hover:bg-accent block rounded-lg px-3 py-2 text-sm"
          >
            Mein Konto
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="hover:bg-accent text-destructive flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm"
          >
            <LogOut className="h-3.5 w-3.5" />
            Abmelden
          </button>
        </div>
      )}
    </div>
  );
}
