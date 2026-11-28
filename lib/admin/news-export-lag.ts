import type { ExportFeed } from '@/lib/blog/news-export-feeds';
import { levelAbove, worstTone, type HealthTone, type Threshold } from './health';

/**
 * Whether the native app's export on media.park.fan is behind the website: which posts the site
 * lists that the export's lists do not, and for how long, and what starting a new run answers.
 * Pure, so the routes, the panel and `pnpm test:admin-news-export` read the same verdicts; the
 * lists and the site's posts are read in `lib/admin/news-export-report.ts`, the run is started in
 * `lib/admin/news-export-run.ts`.
 *
 * Posts are compared by slug, not by date: a post merged days after its own date is older than
 * the last run and would pass a comparison of `generatedAt` with the newest date.
 */

/**
 * Minutes a post may be on the site without being in the export. Amber after an hour, longer than
 * two runs back to back, so nothing that was on its way is still running. Red after six hours, the
 * window in which the API's push job still announces a post (`NEWS_MAX_AGE_MS` in the API): an
 * export that catches up later brings the post to the app without a notification. Background:
 * docs/features/media-database.md#watching-the-export.
 */
export const EXPORT_BEHIND_MINUTES: Threshold = { warn: 60, bad: 360 };

/** The locale whose titles the admin shows where a post has it, since the admin reads German. */
const DISPLAY_LOCALE = 'de';

/** A post as both sides know it; `publishedAt` carries Berlin's offset, as the export writes it. */
export interface ExportPostRef {
  slug: string;
  title: string;
  publishedAt: string;
}

/** A post on the site; the translation key ties its six locales together. */
export interface SitePostRef extends ExportPostRef {
  translationKey: string;
}

/** One export list as the check read it: when its run wrote it and its posts, or why it failed. */
export type ExportListReading =
  | { state: 'ok'; generatedAt: string; posts: ExportPostRef[] }
  | { state: 'failed'; message: string };

/** A post the site lists and the export does not, with the locales it is missing in. */
export interface MissingPost {
  translationKey: string;
  /** The German title where the post has one, else the first locale's. */
  title: string;
  publishedAt: string;
  locales: string[];
}

/** How one feed of the export stands against the site. */
export interface ExportFeedStatus {
  feed: ExportFeed;
  tone: HealthTone;
  /**
   * The oldest `generatedAt` of the lists read. One run writes all six, so they differ only when a
   * run stopped halfway, and then the oldest is the one that matters.
   */
  generatedAt: string | null;
  newestExported: ExportPostRef | null;
  newestOnSite: ExportPostRef | null;
  /** Newest first. */
  missing: MissingPost[];
  /**
   * Minutes the longest-missing post has been on the site, counted from its date or from this
   * deployment, whichever is later; null when nothing is missing.
   */
  behindMinutes: number | null;
  /** The locales whose list could not be read, with the reason. */
  unreadable: { locale: string; message: string }[];
}

/**
 * What `/api/admin/news-export` and `/api/news-export/status` answer: both feeds, and where a new
 * run is started.
 */
export interface NewsExportReport {
  /** When the oldest of the lists was fetched; the route keeps a list for a few minutes. */
  checkedAt: string;
  /** The build time of the deployment that answered. */
  deployedAt: string | null;
  feeds: ExportFeedStatus[];
  /** The workflow's page on GitHub, where „Run workflow“ starts a new export. */
  workflowUrl: string;
}

function isPostRef(value: unknown): value is ExportPostRef {
  if (!value || typeof value !== 'object') return false;
  const post = value as Record<string, unknown>;
  return (
    typeof post.slug === 'string' &&
    typeof post.title === 'string' &&
    typeof post.publishedAt === 'string'
  );
}

/**
 * An export list's JSON (`{schema, generatedAt, locale, posts}`) as the check needs it. Without a
 * readable `generatedAt` and a post array it failed; a post without slug, title or date is skipped,
 * as the API's push job skips it.
 */
export function parseExportList(json: unknown): ExportListReading {
  const record = json && typeof json === 'object' ? (json as Record<string, unknown>) : null;
  const generatedAt = record?.generatedAt;
  if (
    typeof generatedAt !== 'string' ||
    !Number.isFinite(Date.parse(generatedAt)) ||
    !Array.isArray(record?.posts)
  ) {
    return { state: 'failed', message: 'unerwartetes Format' };
  }
  const posts = record.posts
    .filter(isPostRef)
    .map(({ slug, title, publishedAt }) => ({ slug, title, publishedAt }));
  return { state: 'ok', generatedAt, posts };
}

/** The newest post of a list by its date; null for an empty list. */
function newest(posts: readonly ExportPostRef[]): ExportPostRef | null {
  let best: ExportPostRef | null = null;
  for (const post of posts) {
    if (!best || Date.parse(post.publishedAt) > Date.parse(best.publishedAt)) best = post;
  }
  return best ? { slug: best.slug, title: best.title, publishedAt: best.publishedAt } : null;
}

/** The German locale first, the rest in the order given. */
function displayOrder(locales: readonly string[]): string[] {
  return [
    ...locales.filter((l) => l === DISPLAY_LOCALE),
    ...locales.filter((l) => l !== DISPLAY_LOCALE),
  ];
}

/** Compares one feed of the export with the site's posts of that feed, locale by locale. */
export function compareExportFeed({
  feed,
  site,
  exported,
  deployedAt,
  now,
}: {
  feed: ExportFeed;
  /** The site's posts of the feed per locale, selected as the export selects them. */
  site: Readonly<Record<string, readonly SitePostRef[]>>;
  /** The export's list per locale; a locale without one counts as unreadable. */
  exported: Readonly<Record<string, ExportListReading | undefined>>;
  /** When this deployment was built. A post may have arrived with it, so no wait starts earlier. */
  deployedAt: string | null;
  now: number;
}): ExportFeedStatus {
  const deployed = deployedAt ? Date.parse(deployedAt) : Number.NaN;
  const missing = new Map<string, MissingPost>();
  const unreadable: ExportFeedStatus['unreadable'] = [];
  let generatedAt: string | null = null;
  let newestExported: ExportPostRef | null = null;
  let newestOnSite: ExportPostRef | null = null;

  for (const locale of displayOrder(Object.keys(site))) {
    const posts = site[locale] ?? [];
    newestOnSite ??= newest(posts);
    const reading = exported[locale] ?? { state: 'failed', message: 'nicht gelesen' };
    if (reading.state === 'failed') {
      unreadable.push({ locale, message: reading.message });
      continue;
    }
    if (generatedAt === null || Date.parse(reading.generatedAt) < Date.parse(generatedAt)) {
      generatedAt = reading.generatedAt;
    }
    newestExported ??= newest(reading.posts);
    const inExport = new Set(reading.posts.map((post) => post.slug));
    for (const post of posts) {
      if (inExport.has(post.slug)) continue;
      const entry = missing.get(post.translationKey);
      if (entry) entry.locales.push(locale);
      else {
        missing.set(post.translationKey, {
          translationKey: post.translationKey,
          title: post.title,
          publishedAt: post.publishedAt,
          locales: [locale],
        });
      }
    }
  }

  let behindMinutes: number | null = null;
  for (const post of missing.values()) {
    // A post dated before this deployment may have arrived with it, so the wait counts from the
    // later of the two.
    const known = [Date.parse(post.publishedAt), deployed].filter(Number.isFinite);
    if (known.length === 0) continue;
    const minutes = Math.max(0, (now - Math.max(...known)) / 60_000);
    behindMinutes = Math.max(behindMinutes ?? 0, minutes);
  }

  const tones: HealthTone[] = [];
  if (missing.size > 0) tones.push(levelAbove(behindMinutes, EXPORT_BEHIND_MINUTES));
  if (unreadable.length > 0) tones.push('bad');

  return {
    feed,
    tone: worstTone(tones),
    generatedAt,
    newestExported,
    newestOnSite,
    missing: [...missing.values()].sort(
      (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
    ),
    behindMinutes,
    unreadable,
  };
}

/** Whether a feed's missing posts have waited past the amber mark, so no run is still on its way. */
export function exportIsLate(status: ExportFeedStatus): boolean {
  return (
    status.missing.length > 0 && levelAbove(status.behindMinutes, EXPORT_BEHIND_MINUTES) !== 'ok'
  );
}

const NOUNS: Record<ExportFeed, { one: string; many: string }> = {
  news: { one: 'Meldung', many: 'Meldungen' },
  guides: { one: 'Guide', many: 'Guides' },
};

/**
 * A feed's verdict in a few words: `aktuell`, `1 Meldung noch nicht drin` while a run may still be
 * on its way, `2 Guides fehlen` after that, and the locales whose list could not be read.
 */
export function exportVerdict(status: ExportFeedStatus): string {
  if (status.generatedAt === null && status.unreadable.length > 0) return 'nicht lesbar';
  const parts: string[] = [];
  const count = status.missing.length;
  if (count > 0) {
    const noun = NOUNS[status.feed];
    const counted = count === 1 ? `1 ${noun.one}` : `${count} ${noun.many}`;
    const verb = exportIsLate(status) ? (count === 1 ? 'fehlt' : 'fehlen') : 'noch nicht drin';
    parts.push(`${counted} ${verb}`);
  }
  if (status.unreadable.length > 0) {
    const n = status.unreadable.length;
    parts.push(`${n} ${n === 1 ? 'Sprache' : 'Sprachen'} nicht lesbar`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'aktuell';
}

/** Whether a new run is the answer: a feed is late or a list could not be read. */
export function exportNeedsRun(feeds: readonly ExportFeedStatus[]): boolean {
  const tone = worstTone(feeds.map((feed) => feed.tone));
  return tone === 'warn' || tone === 'bad';
}

/** The export's workflow file in `.github/workflows/`, which a new run is started from. */
export const NEWS_EXPORT_WORKFLOW = 'publish-media.yml';

/**
 * What starting a run answers, from `/api/admin/news-export/run` and `/api/news-export/run` alike:
 * the workflow's page where the run shows up, or why it did not start, in German.
 */
export type NewsExportRunAnswer =
  { started: true; workflowUrl: string } | { started: false; reason: string };

/**
 * Why a run did not start: no token on this deployment, the status GitHub refused with, or no
 * answer from GitHub at all.
 */
export type NewsExportRunFailure = 'no-token' | 'unreachable' | number;

/** A refused start as the routes answer it: 503 without a token, 502 for anything GitHub did. */
export interface NewsExportRunRefusal {
  status: 502 | 503;
  answer: { started: false; reason: string };
}

const GITHUB_REFUSALS: Readonly<Record<number, string>> = {
  401: 'GitHub hat das Token abgelehnt (401), es ist abgelaufen oder widerrufen.',
  // A fine-grained token that sees the repository but may not run its workflows answers 403.
  403: 'GitHub hat den Start abgelehnt (403). Dem Token fehlt vermutlich die Berechtigung „Actions: Read and write“ für das Repository.',
  404: `GitHub findet den Workflow nicht (404). Entweder sieht das Token das Repository nicht, oder ${NEWS_EXPORT_WORKFLOW} fehlt auf dem Standard-Branch.`,
  422: `GitHub nimmt den Start nicht an (422): ${NEWS_EXPORT_WORKFLOW} hat auf dem Standard-Branch keinen workflow_dispatch-Trigger.`,
};

/** The answer to a start that failed, with the German sentence the panel shows. */
export function exportRunRefusal(failure: NewsExportRunFailure): NewsExportRunRefusal {
  if (failure === 'no-token') {
    return {
      status: 503,
      answer: {
        started: false,
        reason:
          'Auf dem Server ist kein GitHub-Token hinterlegt (BLOG_EDITOR_GITHUB_TOKEN). Der Lauf lässt sich auf GitHub mit „Run workflow“ starten.',
      },
    };
  }
  const reason =
    failure === 'unreachable'
      ? 'GitHub hat nicht geantwortet. In ein paar Minuten noch einmal versuchen oder den Lauf auf GitHub starten.'
      : (GITHUB_REFUSALS[failure] ?? `GitHub hat den Start mit ${failure} abgelehnt.`);
  return { status: 502, answer: { started: false, reason } };
}
