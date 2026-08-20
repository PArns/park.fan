import {
  Activity,
  Archive,
  Brain,
  CalendarRange,
  Copy,
  HeartPulse,
  History,
  ImageIcon,
  Images,
  LayoutDashboard,
  ListChecks,
  MapPin,
  PenLine,
  Server,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { AdminRole } from '../_lib/types';

/**
 * The admin's map of itself.
 *
 * One list, read by three things: the sidebar, the command palette, and the
 * breadcrumb that names the current page. They used to be three separate
 * lists — the palette did not exist and the title was derived by a
 * longest-prefix match over the sidebar — and the cost of that was a page you
 * could reach but not find.
 *
 * `minRole` is a display filter, not a security boundary. The API enforces
 * roles; hiding a link an account cannot use is a courtesy that stops somebody
 * discovering their permissions by collecting 403s.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the command palette under the label. */
  description?: string;
  minRole?: AdminRole;
  /** Extra words the palette should match on. */
  keywords?: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Kuratieren',
    items: [
      {
        href: '/admin',
        label: 'Übersicht',
        icon: LayoutDashboard,
        description: 'Was zuletzt passiert ist und was ansteht',
        keywords: ['dashboard', 'start', 'home'],
      },
      {
        href: '/admin/parks',
        label: 'Parks',
        icon: MapPin,
        description: 'Stammdaten, kuratierte Felder, Fahrgeschäfte',
        keywords: ['park', 'attraktionen', 'rides', 'bahnen'],
      },
      {
        href: '/admin/seasons',
        label: 'Saisons',
        icon: CalendarRange,
        description: 'Halloween, Winterschließung, Wartungsfenster',
        keywords: ['halloween', 'weihnachten', 'events', 'termine'],
      },
      {
        href: '/admin/retirement',
        label: 'Stilllegungen',
        icon: Archive,
        description: 'Verstummte Bahnen beurteilen, stilllegen, zurückholen',
        minRole: 'editor',
        keywords: ['retire', 'abriss', 'kandidaten', 'verstummt', 'umbau'],
      },
      {
        href: '/admin/duplicates',
        label: 'Duplikate',
        icon: Copy,
        description: 'Doppelte Bahnen und Parks zusammenführen',
        minRole: 'editor',
        keywords: ['merge', 'doppelt', 'zusammenführen', 'dubletten'],
      },
      {
        href: '/admin/history',
        label: 'Änderungen',
        icon: History,
        description: 'Wer was wann geändert hat — und wie man es zurücknimmt',
        keywords: ['audit', 'log', 'undo', 'verlauf'],
      },
    ],
  },
  {
    label: 'Inhalte',
    items: [
      {
        href: '/admin/media',
        label: 'Medien',
        icon: Images,
        description: 'Bilder, Sidecars, Bildausschnitte',
        keywords: ['bilder', 'fotos', 'sidecar', 'focus'],
      },
      {
        href: '/admin/blog-editor',
        label: 'Blog',
        icon: PenLine,
        description: 'Beiträge in sechs Sprachen',
        keywords: ['artikel', 'post', 'schreiben'],
      },
      {
        href: '/admin/contributions',
        label: 'Einsendungen',
        icon: ImageIcon,
        description: 'Von Besuchern eingeschickte Fotos moderieren',
        keywords: ['upload', 'moderation', 'community'],
      },
    ],
  },
  {
    label: 'Betrieb',
    items: [
      {
        href: '/admin/system',
        label: 'System',
        icon: Server,
        description: 'Host, Postgres, Redis, ML-Dienste',
        keywords: ['health', 'cpu', 'ram', 'disk'],
      },
      {
        href: '/admin/queues',
        label: 'Queues',
        icon: ListChecks,
        description: 'Bull-Jobs und ihre Fehlerursachen',
        keywords: ['bull', 'jobs', 'worker'],
      },
      {
        href: '/admin/data-quality',
        label: 'Datenqualität',
        icon: HeartPulse,
        description: 'Verstummte Feeds, gescheiterte Jobs, kaputte Verweise',
        keywords: ['monitoring', 'silenced', 'fehler', 'audit', 'glossar'],
      },
      {
        href: '/admin/analytics',
        label: 'Analytics',
        icon: Activity,
        description: 'Live-Zahlen: Besucher, Ticker, Regionen',
        keywords: ['realtime', 'ticker', 'geo'],
      },
      {
        href: '/admin/ml',
        label: 'ML',
        icon: Brain,
        description: 'Modelle, Drift, Vorhersagegüte',
        keywords: ['catboost', 'tft', 'prognose', 'drift'],
      },
      {
        href: '/admin/actions',
        label: 'Wartung',
        icon: Wrench,
        description: 'Jobs anstoßen, Caches leeren, Parks reparieren',
        minRole: 'editor',
        keywords: ['sync', 'cache', 'repair', 'merge'],
      },
    ],
  },
  {
    label: 'Konto',
    items: [
      {
        href: '/admin/account',
        label: 'Mein Konto',
        icon: Users,
        description: 'Passwort, Zwei-Faktor, aktive Sitzungen',
        keywords: ['profil', 'passwort', '2fa', 'totp', 'sitzungen'],
      },
      {
        href: '/admin/users',
        label: 'Konten',
        icon: Users,
        description: 'Administratoren anlegen und Rollen vergeben',
        minRole: 'owner',
        keywords: ['benutzer', 'rollen', 'team'],
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/**
 * The nav entry a path belongs to.
 *
 * Longest match wins, so `/admin/parks/<id>` resolves to Parks rather than to
 * the dashboard — `/admin` would otherwise prefix-match everything.
 */
export function activeNavItem(pathname: string): NavItem | null {
  return (
    [...NAV_ITEMS]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) =>
        item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
      ) ?? null
  );
}

const ROLE_RANK: Record<AdminRole, number> = {
  owner: 30,
  editor: 20,
  author: 10,
  viewer: 0,
};

export function visibleGroups(role: AdminRole): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.minRole || ROLE_RANK[role] >= ROLE_RANK[item.minRole]
    ),
  })).filter((group) => group.items.length > 0);
}
