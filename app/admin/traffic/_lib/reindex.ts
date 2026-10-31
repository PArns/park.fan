import { SEARCH_CONSOLE_REINDEX_PATH, searchConsolePropertyUrl } from '@/lib/admin/search-console';
import type {
  SearchConsoleReindexItem,
  SearchConsoleReindexRecord,
} from '@/lib/api/admin-search-console';
import { adminFetch } from '../../_lib/api';
import { formatAgo, formatDay } from '../../_lib/format';

const UNKNOWN_TO_GOOGLE = 'URL is unknown to Google';

/** Why a page is in the reindex queue, in one line: when it changed and when Google last crawled it. */
export function reindexReason(item: SearchConsoleReindexItem): string {
  const changed = `geändert am ${formatDay(item.changedOn)}`;
  if (item.state === 'unknown') {
    return item.coverageState === UNKNOWN_TO_GOOGLE
      ? `Google kennt die Seite nicht (${changed})`
      : `Von Google noch nie gecrawlt (${changed})`;
  }
  const crawled = `zuletzt gecrawlt am ${formatDay(item.lastCrawlAt)}`;
  return item.state === 'stale'
    ? `Google hat die alte Fassung: ${changed}, ${crawled}`
    : `Vielleicht schon gesehen: ${changed}, ${crawled}, kurz vor oder nach der Änderung`;
}

/** The chip of each state of a page in the reindex queue. */
export const REINDEX_STATE_CHIP: Record<
  SearchConsoleReindexItem['state'],
  { label: string; tone: 'danger' | 'warning' | 'muted' }
> = {
  unknown: { label: 'unbekannt', tone: 'danger' },
  stale: { label: 'veraltet', tone: 'warning' },
  uncertain: { label: 'unsicher', tone: 'muted' },
};

/** What became of a request for indexing, as a toast or a line under the button says it. */
export interface ReindexOutcome {
  title: string;
  description?: string;
  tone: 'success' | 'error' | 'info';
}

/**
 * Requests indexing of one page, from a click: copies its URL and opens the property in Search
 * Console, where it goes into the top bar, then records the request. Never throws; a refusal comes
 * back as an outcome with the `error` tone, as does a request past Google's daily limit.
 */
export async function requestReindex(
  siteUrl: string,
  item: Pick<SearchConsoleReindexItem, 'path' | 'url'>
): Promise<ReindexOutcome> {
  // Both inside the click, before any await, or the browser refuses them.
  const copied = navigator.clipboard?.writeText(item.url).then(
    () => true,
    () => false
  );
  window.open(searchConsolePropertyUrl(siteUrl), '_blank', 'noopener');
  try {
    const result = await adminFetch<SearchConsoleReindexRecord>(
      `${SEARCH_CONSOLE_REINDEX_PATH}/requests`,
      { method: 'POST', body: { path: item.path } }
    );
    if (!result.recorded) {
      return {
        title: 'Schon beantragt',
        description: `${item.path} wurde ${formatAgo(result.requestedAt)} beantragt. Nicht noch einmal klicken.`,
        tone: 'info',
      };
    }
    if (result.requestsLast24h > result.dailyLimit) {
      return {
        title: `${result.requestsLast24h} Anträge in 24 Stunden`,
        description: `Mehr als ${result.dailyLimit}: Google lehnt weitere meist ab. Gemerkt ist der Antrag trotzdem.`,
        tone: 'error',
      };
    }
    return {
      title: (await copied) ? 'URL kopiert und gemerkt' : 'Gemerkt',
      description: `In der Search Console oben bei „URL prüfen“ einfügen, dann „Indexierung beantragen“. ${result.requestsLast24h} von ${result.dailyLimit} Anträgen in 24 Stunden.`,
      tone: 'success',
    };
  } catch (err) {
    return {
      title: 'Antrag nicht gemerkt',
      description: err instanceof Error ? err.message : undefined,
      tone: 'error',
    };
  }
}
