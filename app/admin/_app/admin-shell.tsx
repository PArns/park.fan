'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  LogOut,
  Menu,
  PanelRight,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_LABELS, type AdminRole } from '@/lib/admin/roles';
import type { NavSignal } from '@/lib/admin/health';
import { AdminBrand } from '../_ui/admin-brand';
import { Kbd } from '../_ui/primitives';
import { formatDisplayName } from '../_lib/format';
import { useAdmin } from '../_lib/admin-context';
import { useAdminHealth } from '../_lib/use-admin-health';
import { useToast } from '../_ui/toast';
import { useLocalPreference } from '../_lib/use-local-preference';
import {
  activeNavItem,
  flatNavItems,
  navParent,
  visibleGroups,
  type NavGroup,
  type NavItem,
} from './nav';
import { useSession } from './session';
import { CommandPalette } from './command-palette';
import { InspectorPanel, useInspector } from './inspector';
import { NewContributionsNotice } from './new-contributions-notice';

/**
 * The frame every admin page sits in: a sidebar whose entries carry the state of what they lead
 * to, the page on an inset surface under a slim topbar, and the inspector beside it. ⌘K and the
 * `g`-then-letter jumps are advertised in the chrome, because a shortcut nobody is told about is a
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
  f: '/admin/capture',
  b: '/admin/blog-editor',
  y: '/admin/system',
  q: '/admin/queues',
  t: '/admin/traffic',
  l: '/admin/traffic/live',
  u: '/admin/traffic/search',
  o: '/admin/traffic/seo',
};

const PaletteContext = createContext<() => void>(() => undefined);

/** Opens the ⌘K palette from a page, for a button that offers "everything else". */
export function useOpenPalette(): () => void {
  return useContext(PaletteContext);
}

/** The hover and focus surface of every row and icon button in the chrome. */
const CHROME_HOVER = 'hover:bg-white/[0.05] hover:text-foreground';

/**
 * Admin frame around every page: the sidebar (folding groups, status dots, the account at its
 * foot), the topbar with the page's place, search, refresh and the inspector toggle, then the page
 * on its inset surface, the inspector column and the ⌘K command palette. It also binds the
 * `g`-then-letter section jumps, which stay off while typing, under a dialog or with unsaved edits.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { identity } = useSession();
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
    ? groups.find(
        (group) =>
          !group.placement && flatNavItems(group.items).some((item) => item.href === active.href)
      )?.label
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
  const openPalette = useCallback(() => {
    setMobileOpen(false);
    setPaletteOpen(true);
  }, []);

  const ActiveIcon = active?.icon;

  return (
    // `--admin-chrome-height` is everything above a page: the topbar, and from `md` the inset's
    // margin and border. A page that fills the viewport subtracts it instead of a number.
    <div className="flex min-h-[100dvh] [--admin-chrome-height:3.5rem] md:[--admin-chrome-height:calc(3.5rem+1rem+2px)]">
      <Sidebar
        groups={groups}
        activeHref={active?.href}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
        onToggleCollapsed={toggleCollapsed}
        onSearch={openPalette}
      />

      <div className="flex min-w-0 flex-1 flex-col md:py-2 md:pr-2">
        <div className="flex min-w-0 flex-1 flex-col bg-white/[0.012] md:rounded-2xl md:border md:border-white/[0.06] md:shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
          <header className="bg-background/75 sticky top-0 z-30 flex h-14 items-center gap-1.5 border-b border-white/[0.06] px-3 backdrop-blur-xl sm:px-4 md:rounded-t-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Navigation öffnen"
              className={cn('text-muted-foreground rounded-lg p-2 md:hidden', CHROME_HOVER)}
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              {ActiveIcon && (
                <ActiveIcon
                  aria-hidden="true"
                  className="text-muted-foreground hidden h-4 w-4 shrink-0 sm:block"
                />
              )}
              <div className="flex min-w-0 items-baseline gap-1.5 text-sm">
                {activeGroup && (
                  <span className="text-muted-foreground hidden shrink-0 lg:inline">
                    {activeGroup}
                    <span className="mx-1.5 opacity-40">/</span>
                  </span>
                )}
                {activeParent && (
                  <Link
                    href={activeParent.href}
                    className="text-muted-foreground hover:text-foreground hidden shrink-0 sm:inline"
                  >
                    {activeParent.label}
                    <span className="mx-1.5 opacity-40">/</span>
                  </Link>
                )}
                <h1 className="truncate font-medium">{active?.label ?? 'Admin'}</h1>
              </div>
              {active?.description && (
                <p
                  className="text-muted-foreground hidden min-w-0 truncate text-xs xl:block"
                  title={active.description}
                >
                  <span className="mr-2.5 opacity-40">·</span>
                  {active.description}
                </p>
              )}
            </div>

            <a
              href="https://park.fan"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'text-muted-foreground hidden items-center gap-1.5 rounded-lg border border-white/[0.07] px-2.5 py-1.5 text-xs transition-colors lg:inline-flex',
                CHROME_HOVER
              )}
            >
              park.fan
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>

            <button
              type="button"
              onClick={triggerRefresh}
              title={
                lastUpdated
                  ? `Zuletzt aktualisiert ${lastUpdated.toLocaleTimeString('de-DE')}`
                  : 'Aktualisieren'
              }
              aria-label="Aktualisieren"
              className={cn('text-muted-foreground rounded-lg p-2', CHROME_HOVER)}
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </button>

            {inspector.content && (
              <button
                type="button"
                onClick={inspector.toggle}
                aria-label="Inspektor umschalten"
                className={cn(
                  'text-muted-foreground rounded-lg p-2',
                  CHROME_HOVER,
                  inspector.open && 'text-primary'
                )}
              >
                <PanelRight className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Suchen"
              className={cn(
                'text-muted-foreground flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] p-2 text-xs transition-colors sm:py-1.5 sm:pr-1.5 sm:pl-2.5',
                CHROME_HOVER
              )}
            >
              <Search className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Suchen</span>
              <span className="hidden sm:inline-flex">
                <Kbd>⌘K</Kbd>
              </span>
            </button>
          </header>

          <main className="min-w-0 flex-1">
            <PaletteContext.Provider value={openPalette}>{children}</PaletteContext.Provider>
          </main>
        </div>
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
  onSearch,
}: {
  groups: NavGroup[];
  activeHref: string | undefined;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
  onSearch: () => void;
}) {
  const { identity, signOut } = useSession();
  const { health } = useAdminHealth();
  // The drawer on a phone is always the full sidebar; the rail exists from `md`.
  const rail = collapsed && !mobileOpen;
  const top = groups.filter((group) => group.placement === 'top');
  const folding = groups.filter((group) => !group.placement);
  const footer = groups.find((group) => group.placement === 'footer');

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
        aria-label="Admin"
        className={cn(
          'bg-sidebar fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] transition-[width,transform] duration-200',
          'md:bg-background md:sticky md:top-0 md:z-auto md:h-[100dvh] md:translate-x-0 md:border-r-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-64 md:w-[4.25rem]' : 'w-64 md:w-60'
        )}
      >
        <div className={cn('flex h-14 items-center gap-2.5 px-3', rail && 'md:justify-center')}>
          <Link
            href="/admin"
            onClick={onCloseMobile}
            className={cn(
              'flex min-w-0 flex-1 items-center rounded-lg px-1.5 py-1',
              rail && 'md:justify-center md:px-0'
            )}
          >
            <AdminBrand pinOnly={rail} />
          </Link>
          {!rail && (
            <button
              type="button"
              onClick={onSearch}
              aria-label="Suchen"
              title="Suchen (⌘K)"
              className={cn('text-muted-foreground rounded-lg p-2', CHROME_HOVER)}
            >
              <Search className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Schließen"
            className={cn('text-muted-foreground rounded-lg p-2 md:hidden', CHROME_HOVER)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2.5 pt-1 pb-3">
          {top.map((group) => (
            <ul key={group.label} className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <SidebarLink
                    item={item}
                    active={item.href === activeHref}
                    rail={rail}
                    onNavigate={onCloseMobile}
                    signal={health.signals[item.href]}
                    emphasis
                  />
                </li>
              ))}
            </ul>
          ))}
          {folding.map((group) => (
            <SidebarGroup
              key={group.label}
              group={group}
              activeHref={activeHref}
              rail={rail}
              onNavigate={onCloseMobile}
              signals={health.signals}
            />
          ))}
        </div>

        <div className="space-y-1 border-t border-white/[0.06] p-2.5">
          <AccountMenu
            name={identity.displayName}
            email={identity.email}
            role={identity.role}
            items={footer?.items ?? []}
            rail={rail}
            onNavigate={onCloseMobile}
            onSignOut={() => void signOut()}
          />
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Seitenleiste ausklappen' : 'Seitenleiste einklappen'}
            className={cn(
              'text-muted-foreground hidden w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] md:flex',
              CHROME_HOVER,
              rail && 'justify-center px-0'
            )}
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
 * A group under its heading, which folds it. The choice is kept per group; a folded group still
 * shows the entry of the current page, so the sidebar never hides where you are. The rail has no
 * headings, only a hairline between groups.
 */
function SidebarGroup({
  group,
  activeHref,
  rail,
  onNavigate,
  signals,
}: {
  group: NavGroup;
  activeHref: string | undefined;
  rail: boolean;
  onNavigate: () => void;
  signals: Record<string, NavSignal>;
}) {
  const [state, setState] = useLocalPreference(`parkfan_admin_nav_${group.label}`, 'open');
  const open = state === 'open' || rail;
  const items = open
    ? group.items
    : group.items.filter((item) => flatNavItems([item]).some((entry) => entry.href === activeHref));

  return (
    <section>
      {rail ? (
        <div aria-hidden="true" className="mx-3 mb-2 h-px bg-white/[0.06]" />
      ) : (
        <button
          type="button"
          onClick={() => setState(open ? 'closed' : 'open')}
          aria-expanded={open}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md px-2.5 pb-1 text-xs font-medium transition-colors"
        >
          {group.label}
          <ChevronDown
            aria-hidden="true"
            className={cn('h-3 w-3 transition-transform', !open && '-rotate-90')}
          />
        </button>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.href}>
            {item.children?.length ? (
              <SidebarBranch
                item={item}
                activeHref={activeHref}
                rail={rail}
                onNavigate={onNavigate}
                signals={signals}
              />
            ) : (
              <SidebarLink
                item={item}
                active={item.href === activeHref}
                rail={rail}
                onNavigate={onNavigate}
                signal={signals[item.href]}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * An entry with sub-entries: the entry links to their overview, the chevron folds them. They stand
 * open while one of them is the current page; the rail shows the entry alone, lit for the whole
 * branch.
 */
function SidebarBranch({
  item,
  activeHref,
  rail,
  onNavigate,
  signals,
}: {
  item: NavItem;
  activeHref: string | undefined;
  rail: boolean;
  onNavigate: () => void;
  signals: Record<string, NavSignal>;
}) {
  const children = item.children ?? [];
  const inBranch = item.href === activeHref || children.some((child) => child.href === activeHref);
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? inBranch;

  if (rail) {
    return (
      <SidebarLink
        item={item}
        active={inBranch}
        rail
        onNavigate={onNavigate}
        signal={signals[item.href]}
      />
    );
  }
  return (
    <div>
      <div className="relative">
        <SidebarLink
          item={item}
          active={item.href === activeHref}
          rail={false}
          onNavigate={onNavigate}
          signal={signals[item.href]}
          trailingSpace
        />
        <button
          type="button"
          onClick={() => setToggled(!open)}
          aria-expanded={open}
          aria-label={`${item.label} ${open ? 'zuklappen' : 'aufklappen'}`}
          className={cn(
            'text-muted-foreground absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-1',
            CHROME_HOVER
          )}
        >
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !open && '-rotate-90')} />
        </button>
      </div>
      {open && (
        <ul className="mt-0.5 ml-[19px] space-y-0.5 border-l border-white/[0.07] pl-2">
          {children.map((child) => (
            <li key={child.href}>
              <SidebarLink
                item={child}
                active={child.href === activeHref}
                rail={false}
                onNavigate={onNavigate}
                signal={signals[child.href]}
                dense
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const SIGNAL_DOT: Record<NavSignal['tone'], string> = {
  ok: 'bg-emerald-400',
  warn: 'bg-amber-400 shadow-[0_0_8px_var(--color-amber-400)]',
  bad: 'bg-red-500 shadow-[0_0_8px_var(--color-red-500)]',
  unknown: 'bg-muted-foreground/50',
};

const SIGNAL_COUNT: Record<NavSignal['tone'], string> = {
  ok: 'bg-white/[0.06] text-muted-foreground',
  warn: 'bg-amber-400/12 text-amber-300 ring-1 ring-amber-400/25',
  bad: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30',
  unknown: 'bg-white/[0.06] text-muted-foreground',
};

/** The filled variant, for the overview's count: the one number the sidebar wants read first. */
const SIGNAL_COUNT_EMPHASIS: Record<NavSignal['tone'], string> = {
  ok: 'bg-white/10 text-foreground',
  warn: 'bg-amber-400 text-amber-950',
  bad: 'bg-red-500 text-white',
  unknown: 'bg-white/10 text-foreground',
};

/** The state an entry carries on its right: a count where there is one, otherwise a dot. */
function SignalMark({
  signal,
  emphasis,
  rail,
}: {
  signal: NavSignal;
  emphasis: boolean;
  rail: boolean;
}) {
  // On the rail there is no room for digits: the icon gets a dot in its corner.
  if (rail) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'ring-background absolute top-1 right-1.5 h-2 w-2 rounded-full ring-2',
          SIGNAL_DOT[signal.tone]
        )}
      />
    );
  }
  if (signal.count) {
    return (
      <span
        className={cn(
          'ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
          (emphasis ? SIGNAL_COUNT_EMPHASIS : SIGNAL_COUNT)[signal.tone]
        )}
      >
        {signal.count > 99 ? '99+' : signal.count}
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn('ml-auto h-1.5 w-1.5 shrink-0 rounded-full', SIGNAL_DOT[signal.tone])}
    />
  );
}

const SIGNAL_WORDS: Record<NavSignal['tone'], string> = {
  ok: 'alles in Ordnung',
  warn: 'wartet auf dich',
  bad: 'gestört',
  unknown: 'Zustand unbekannt',
};

function SidebarLink({
  item,
  active,
  rail,
  onNavigate,
  signal,
  emphasis = false,
  dense = false,
  trailingSpace = false,
}: {
  item: NavItem;
  active: boolean;
  rail: boolean;
  onNavigate: () => void;
  signal?: NavSignal;
  /** The overview entry: its count is filled. */
  emphasis?: boolean;
  /** A sub-entry: smaller, under its parent's guide line. */
  dense?: boolean;
  /** Room on the right for the parent's fold button. */
  trailingSpace?: boolean;
}) {
  const state = signal
    ? signal.count
      ? `${signal.count}, ${SIGNAL_WORDS[signal.tone]}`
      : SIGNAL_WORDS[signal.tone]
    : null;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={rail ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-2.5 rounded-lg px-2.5 transition-colors',
        dense ? 'py-1 text-[13px]' : 'py-[7px] text-sm',
        trailingSpace && 'pr-8',
        rail && 'justify-center px-0 py-2',
        active
          ? 'text-foreground bg-white/[0.07] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
          : cn('text-muted-foreground', CHROME_HOVER)
      )}
    >
      <item.icon
        aria-hidden="true"
        className={cn(
          'shrink-0',
          dense ? 'h-3.5 w-3.5' : 'h-4 w-4',
          active ? 'text-primary-ink' : 'opacity-80'
        )}
      />
      {rail ? (
        <span className="sr-only">{item.label}</span>
      ) : (
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      )}
      {state && <span className="sr-only">, {state}</span>}
      {signal && <SignalMark signal={signal} emphasis={emphasis} rail={rail} />}
    </Link>
  );
}

/**
 * Who is signed in, at the foot of the sidebar; it opens upwards to the account pages of the nav's
 * footer group, the public site and signing out.
 */
function AccountMenu({
  name,
  email,
  role,
  items,
  rail,
  onNavigate,
  onSignOut,
}: {
  name: string;
  email: string;
  role: AdminRole;
  items: NavItem[];
  rail: boolean;
  onNavigate: () => void;
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
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('click', close, { capture: true });
    window.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('click', close, { capture: true });
      window.removeEventListener('keydown', escape);
    };
  }, [open]);

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  const displayName = formatDisplayName(name);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        aria-expanded={open}
        aria-label={rail ? `Konto: ${displayName}` : undefined}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors',
          CHROME_HOVER,
          open && 'bg-white/[0.05]',
          rail && 'justify-center'
        )}
      >
        <span className="from-primary/40 to-primary/10 text-primary-ink flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold ring-1 ring-white/10">
          {initials || '?'}
        </span>
        {!rail && (
          <>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-medium">{displayName}</span>
              <span className="text-muted-foreground block truncate text-[11px]">
                {ROLE_LABELS[role] ?? role}
              </span>
            </span>
            <ChevronsUpDown aria-hidden="true" className="text-muted-foreground h-3.5 w-3.5" />
          </>
        )}
      </button>

      {open && (
        <div
          className={cn(
            'bg-popover absolute bottom-full z-50 mb-2 w-60 rounded-xl border border-white/10 p-1 shadow-2xl shadow-black/60',
            rail ? 'left-0' : 'inset-x-0 w-auto'
          )}
        >
          <div className="border-b border-white/[0.06] px-3 py-2.5">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="text-muted-foreground truncate text-xs">{email}</p>
          </div>
          <div className="py-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setOpen(false);
                  onNavigate();
                }}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm',
                  CHROME_HOVER
                )}
              >
                <item.icon className="text-muted-foreground h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <a
              href="https://park.fan"
              target="_blank"
              rel="noopener noreferrer"
              className={cn('flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm', CHROME_HOVER)}
            >
              <ArrowUpRight className="text-muted-foreground h-4 w-4" />
              Zur Website
            </a>
          </div>
          <div className="border-t border-white/[0.06] pt-1">
            <button
              type="button"
              onClick={() => {
                // Inside clicks do not close the menu (see above), so this one does.
                setOpen(false);
                onSignOut();
              }}
              className="text-destructive flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/[0.05]"
            >
              <LogOut className="h-4 w-4" />
              Abmelden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
