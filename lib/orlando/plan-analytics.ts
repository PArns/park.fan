import type {
  TicketLinkKind,
  TicketLinkSurface,
  TicketMode,
  SiteEventMap,
} from '@/lib/analytics/site-analytics';
import type { TicketLink } from './types';

/**
 * The Orlando planner's events as our own statistic counts them: the properties each event
 * carries, built from what the planner knows. Pure, so `scripts/test-orlando-plan.mjs` pins them;
 * the calls sit where the visitor acts. Low-cardinality values only, never anything a person typed
 * (docs/development/analytics.md#what-an-event-never-carries); docs/features/orlando-planner.md#analytics.
 */

/** A seller's name as a property value: the characters the statistic keeps, at most 60. */
export function sellerProp(seller: string): string {
  const clean = seller
    .replace(/[^\p{L}\p{N} ._:/+#-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  return clean || 'unknown';
}

/** A link's host without `www.`, or `unknown` for a url that is none. */
export function hostProp(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '') || 'unknown';
  } catch {
    return 'unknown';
  }
}

/** Which tickets a plan was made with, from the plan's own tickets and suggestions. */
export function ticketModeOf(owned: number, suggested: number): TicketMode {
  if (owned > 0 && suggested > 0) return 'mixed';
  return owned > 0 ? 'owned' : 'plan_first';
}

/** `ticket_link_clicked` for one link of the list a visitor saw, `index` 0-based in that list. */
export function ticketLinkClickProps(input: {
  product: string;
  link: TicketLink;
  index: number;
  visitor: { locale: string; market: 'us' | 'uk' | 'intl' | null };
  surface: TicketLinkSurface;
  ticketMode: TicketMode;
}): SiteEventMap['ticket_link_clicked'] {
  const { link, visitor } = input;
  const kind: TicketLinkKind = link.sponsored ? 'sponsored' : link.official ? 'official' : 'plain';
  return {
    product: input.product,
    seller: sellerProp(link.seller),
    host: hostProp(link.url),
    kind,
    position: input.index + 1,
    locale_match:
      Boolean(link.locales?.includes(visitor.locale)) ||
      Boolean(visitor.market && link.markets?.includes(visitor.market)),
    surface: input.surface,
    ticket_mode: input.ticketMode,
  };
}
