'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
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
import { ROLE_LABELS, type AdminRole } from '@/lib/admin/roles';
import { Kbd } from '../_ui/primitives';
import { Chip } from '../_ui/primitives';
import { formatDisplayName } from '../_lib/format';
import { useAdmin } from '../_lib/admin-context';
import { useToast } from '../_ui/toast';
import { useLocalPreference } from '../_lib/use-local-preference';
import { activeNavItem, flatNavItems, navParent, visibleGroups, type NavItem } from './nav';
import { useSession } from './session';
import { CommandPalette } from './command-palette';
import { InspectorPanel, useInspector } from './inspector';
import { NewContributionsNotice } from './new-contributions-notice';

/**
 * The frame every admin page sits in: navigation that collapses to an icon rail, the page, and
 * the inspector beside it. ⌘K and the `g`-then-letter jumps are advertised in the chrome, because
 * a shortcut nobody is told about is a shortcut nobody uses.
 */

const SIDEBAR_STORAGE_KEY = 'parkfan_admin_sidebar';

/** `g` then this letter jumps to that section. */
const JUMP_KEYS: Record<string, string> = {
  d: '/admin',
  p: '/admin/parks',
  s: '/admin/seasons',
  h: '/admin/history',
  m: '/admin/media',
  f: '/admin/capture',
  b: '/admin/blog-editor',
  y: '/admin/system',
  q: '/admin/queues',
  t: '/admin/traffic',
  l: '/admin/traffic/live',
  u: '/admin/traffic/search',
  o: '/admin/traffic/seo',
};

/**
 * Admin frame around every page: collapsible sidebar, topbar with title, search, refresh and
 * account menu, then the page, the inspector column and the ⌘K command palette. It also binds the
 * `g`-then-letter section jumps, which stay off while typing, under a dialog or with unsaved edits.
 */
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
  // The title alone ("Duplikate") does not say whether you are in curation or in operations.
  const activeGroup = active
    ? groups.find((group) => flatNavItems(group.items).some((item) => item.href === active.href))
        ?.label
    : undefined;
  const activeParent = active ? navParent(groups, active.href) : null;

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

      // Dead while typing (writing "Gondoletta" must not jump to the dashboard) and under any
      // open dialog, which may hold unsaved work.
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;

      if (jumpArmed.current) {
        jumpArmed.current = false;
        const href = JUMP_KEYS[event.key.toLowerCase()];
        if (href) {
          event.preventDefault();
          // The curated-fields editor is neither a dialog nor an input, and its buttons keep focus
          // after a click, so unsaved corrections are checked for explicitly.
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
        activeHref={active?.href}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
        onToggleCollapsed={toggleCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border/50 bg-background/70 supports-[backdrop-filter]:bg-background/60 after:via-primary/30 relative sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 backdrop-blur-xl after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-gradient-to-r after:from-transparent after:to-transparent sm:px-4">
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
              {activeParent && (
                <Link
                  href={activeParent.href}
                  className="text-muted-foreground hover:text-foreground hidden text-[11px] tracking-wide uppercase sm:inline"
                >
                  {activeParent.label}
                  <span className="mx-1.5 opacity-40">/</span>
                </Link>
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
            aria-label="Suchen"
            className="border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors sm:px-2.5 sm:py-1.5"
          >
            <CommandIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Suchen</span>
            <span className="hidden sm:inline-flex">
              <Kbd>⌘K</Kbd>
            </span>
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
      <NewContributionsNotice />
    </div>
  );
}

function Sidebar({
  groups,
  activeHref,
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: {
  groups: ReturnType<typeof visibleGroups>;
  activeHref: string | undefined;
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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] md:hidden"
        />
      )}
      <nav
        className={cn(
          'bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-[width,transform] duration-200',
          'bg-gradient-to-b from-[oklch(1_0_0_/_0.02)] to-transparent',
          'md:sticky md:top-0 md:z-auto md:h-[100dvh] md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-60 md:w-16' : 'w-60'
        )}
      >
        <div className="flex h-14 items-center gap-2 px-3">
          <span className="from-primary/30 to-primary/5 border-primary/25 text-primary shadow-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br shadow-sm">
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

        {/* Dense enough that every group clears the footer on a laptop, where the last one
            sliding under "Zur Website" reads as a rendering fault rather than a scroll. */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2 py-2">
          {groups.map((group) => (
            <div key={group.label}>
              {(!collapsed || mobileOpen) && (
                <p className="text-muted-foreground px-2 pb-1 text-[10px] font-semibold tracking-widest uppercase">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) =>
                  item.children?.length ? (
                    <SidebarBranch
                      key={item.href}
                      item={item}
                      activeHref={activeHref}
                      collapsed={collapsed && !mobileOpen}
                      onNavigate={onCloseMobile}
                    />
                  ) : (
                    <SidebarLink
                      key={item.href}
                      item={item}
                      active={item.href === activeHref}
                      collapsed={collapsed && !mobileOpen}
                      onNavigate={onCloseMobile}
                    />
                  )
                )}
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

/**
 * An entry with sub-entries: the entry links to their overview, the chevron folds them. They stand
 * open while one of them is the current page; the collapsed rail shows the entry alone, lit for
 * the whole branch.
 */
function SidebarBranch({
  item,
  activeHref,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  activeHref: string | undefined;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const children = item.children ?? [];
  const inBranch = item.href === activeHref || children.some((child) => child.href === activeHref);
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? inBranch;

  if (collapsed) {
    return <SidebarLink item={item} active={inBranch} collapsed onNavigate={onNavigate} />;
  }
  return (
    <div>
      <div className="relative">
        <SidebarLink
          item={item}
          active={item.href === activeHref}
          collapsed={false}
          onNavigate={onNavigate}
          trailingSpace
        />
        <button
          type="button"
          onClick={() => setToggled(!open)}
          aria-expanded={open}
          aria-label={`${item.label} ${open ? 'zuklappen' : 'aufklappen'}`}
          className="text-muted-foreground hover:bg-accent hover:text-foreground absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-1"
        >
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !open && '-rotate-90')} />
        </button>
      </div>
      {open && (
        <div className="border-sidebar-border mt-0.5 ml-[18px] space-y-0.5 border-l pl-2">
          {children.map((child) => (
            <SidebarLink
              key={child.href}
              item={child}
              active={child.href === activeHref}
              collapsed={false}
              onNavigate={onNavigate}
              dense
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarLink({
  item,
  active,
  collapsed,
  onNavigate,
  dense = false,
  trailingSpace = false,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
  /** A sub-entry: smaller, under its parent's guide line. */
  dense?: boolean;
  /** Room on the right for the parent's fold button. */
  trailingSpace?: boolean;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        // The rail makes "where am I" readable at a glance: a tinted row alone reads as hover, and
        // the collapsed sidebar has no label to tell them apart.
        'relative flex items-center gap-2.5 rounded-lg pr-2.5 pl-3 transition-colors',
        dense ? 'py-1 text-[13px]' : 'py-1.5 text-sm',
        trailingSpace && 'pr-8',
        'before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-0.5 before:rounded-full before:transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground before:bg-primary font-medium before:shadow-[0_0_10px_var(--color-primary)]'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground before:bg-transparent'
      )}
    >
      <item.icon
        className={cn('shrink-0', dense ? 'h-3.5 w-3.5' : 'h-4 w-4', active && 'text-primary')}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function AccountMenu({
  name,
  email,
  role,
  onSignOut,
}: {
  name: string;
  email: string;
  role: AdminRole;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Outside clicks only: closing on every click in the capture phase unmounts the menu before
    // React's delegated listener reaches the button inside it, so its `onClick` never runs.
    const close = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener('click', close, { capture: true });
    return () => window.removeEventListener('click', close, { capture: true });
  }, [open]);

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="from-primary/35 to-primary/10 ring-primary/25 text-primary flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold ring-1 transition-[filter] hover:brightness-125"
        aria-label="Konto"
      >
        {initials || '?'}
      </button>

      {open && (
        <div className="border-border/60 bg-card absolute right-0 z-50 mt-2 w-60 rounded-xl border p-1 shadow-xl">
          <div className="border-border/50 border-b px-3 py-2.5">
            <p className="truncate text-sm font-medium">{formatDisplayName(name)}</p>
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
            onClick={() => {
              // Inside clicks do not close the menu (see above), so this one does.
              setOpen(false);
              onSignOut();
            }}
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
