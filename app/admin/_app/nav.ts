import {
  Activity,
  Archive,
  Brain,
  Camera,
  CalendarRange,
  Copy,
  Flame,
  GitCompare,
  HeartPulse,
  History,
  ImageIcon,
  Images,
  LayoutDashboard,
  ListChecks,
  MapPin,
  PenLine,
  Radar,
  Search,
  Server,
  TrendingUp,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { roleAtLeast, type AdminRole } from '@/lib/admin/roles';

/**
 * The admin's map of itself, read by the sidebar, the command palette and the breadcrumb.
 * `minRole` is a display filter, not a security boundary: the API enforces roles.
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
  /**
   * Routes that belong to this entry without sitting under its href (`/admin/attractions/<id>`),
   * so the breadcrumb and the sidebar still place them.
   */
  covers?: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
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
        // A ride is edited on its own route; it belongs here.
        covers: ['/admin/attractions'],
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
        href: '/admin/capture',
        label: 'Vor Ort',
        icon: Camera,
        description: 'Im Park fotografieren: was fehlt, und direkt hochladen',
        keywords: ['foto', 'kamera', 'knipsen', 'handy', 'mobil', 'park', 'shooting'],
      },
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
        description: 'Live-Zahlen aus den Parks: offene Bahnen, Ticker, Regionen',
        keywords: ['realtime', 'ticker', 'geo'],
      },
      {
        href: '/admin/traffic',
        label: 'Traffic',
        icon: TrendingUp,
        description: 'Besucher, Seiten, Herkunft und Ereignisse aus dem eigenen Zähler',
        keywords: [
          'besucher',
          'aufrufe',
          'visits',
          'pageviews',
          'umami',
          'ereignisse',
          'events',
          'herkunft',
          'referrer',
          'realtime',
        ],
      },
      {
        href: '/admin/traffic/seo',
        label: 'SEO',
        icon: Radar,
        description: 'Besuche aus Suche und KI-Assistenten, 404, Seiten ohne Besuch',
        keywords: [
          'seo',
          'google',
          'bing',
          'suchmaschine',
          'organisch',
          'chatgpt',
          'ki',
          'ai',
          '404',
          'landingpage',
          'einstiegsseiten',
        ],
      },
      {
        href: '/admin/traffic/search',
        label: 'Suche',
        icon: Search,
        description: 'Hero oder Header, von welcher Seite, auf welchem Gerät',
        keywords: ['hero', 'header', 'suchfeld', 'suchen', 'treffer', 'tastenkürzel'],
      },
      {
        href: '/admin/popularity',
        label: 'Beliebtheit',
        icon: Flame,
        description: 'Was gelesen wird, und in welcher Sprache',
        keywords: ['meistgelesen', 'aufrufe', 'page views', 'top', 'sprache', 'beliebt'],
      },
      {
        href: '/admin/ml',
        label: 'ML-Zentrale',
        icon: Brain,
        description: 'Was ansteht, welches Modell besser ist, ob alles läuft',
        keywords: ['ml', 'catboost', 'tft', 'pcn', 'chronos', 'prognose', 'entscheidung', 'drift'],
      },
      {
        href: '/admin/ml/vergleich',
        label: 'Modellvergleich',
        icon: GitCompare,
        description: 'Welches Modell wo besser trifft als das, was die App zeigt',
        keywords: ['modelle', 'vergleich', 'matrix', 'chronos', 'tft', 'pcn', 'prognose'],
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
        description: 'Passwort, Zwei-Faktor, aktive Sitzungen, API-Zugriff',
        keywords: ['profil', 'passwort', '2fa', 'totp', 'sitzungen', 'mcp', 'token', 'api'],
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

const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

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
      .find((item) => {
        if (item.covers?.some((prefix) => pathname.startsWith(prefix))) return true;
        return item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
      }) ?? null
  );
}

/**
 * Returns the navigation groups with the entries below the given role's rank removed, and empty
 * groups dropped. A display filter only: the API enforces roles.
 */
export function visibleGroups(role: AdminRole): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.minRole || roleAtLeast(role, item.minRole)),
  })).filter((group) => group.items.length > 0);
}
