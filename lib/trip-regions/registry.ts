import type { ComponentType } from 'react';
import type { Locale } from '../../i18n/config';
import type { TicketEntry } from './plan-tickets';
import { JAPAN } from './regions/japan';
import { ORLANDO } from './regions/orlando';
import { PARIS } from './regions/paris';
import { SOUTHERN_CALIFORNIA } from './regions/southern-california';

/**
 * The one list of trip regions: a region with a crowd calendar hub and a trip planner, and
 * everything about it that is not the API's (`/v1/trip-regions/:region`) or a sentence (the
 * messages under `tripRegions.<slug>`). A region is this entry, its file under `regions/`, its
 * messages and its Parky scene; no code outside this folder names one.
 *
 * `next.config.ts` builds its rewrites, redirects and edge windows from this list, and it loads
 * before the `@/` aliases exist, so this module and the region files import nothing at run time
 * but each other (type imports compile away; a scene is a lazy `import()` nobody calls there).
 * Client-safe. See docs/features/trip-regions.md.
 */

/**
 * What a region's illustration receives. The scene is decoration: its root `<svg>` carries
 * `aria-hidden` and `focusable="false"`, any motion it has plays once and only under
 * `prefers-reduced-motion: no-preference` (the band is glass, and nothing may run on under a
 * `backdrop-filter`), it takes its colours from Tailwind classes with `dark:` twins so it follows
 * the theme, and its gradient ids are its own, since the band stays in the document beside every
 * other drawing on the page.
 */
export interface TripRegionSceneProps {
  className?: string;
}

/** A region's illustration as a lazily loaded module, so its markup is in no page's HTML. */
export type TripRegionSceneLoader = () => Promise<{ default: ComponentType<TripRegionSceneProps> }>;

/** One of a region's best-time pages: the whole region, or one resort under its own segment. */
export interface TripBestTimePage {
  /**
   * The page's key in the messages (`tripRegions.<slug>.bestTime.title.<id>`) and in the OG card's
   * path: `region` for the whole region, else the resort segment.
   */
  id: string;
  /** The URL segment after the best-time segment; absent for the region's own page. */
  segment?: string;
  /** The API groups whose headliner parks the page plans. */
  groups: readonly string[];
  /** The hero photo, a media id; its credit and alt come from the media database. */
  photo: string;
  /** The park whose crowd calendar the page offers as its third next step. */
  calendarPark?: string;
}

/**
 * The ticket step's region-specific half: which resorts it offers tickets for, the entries a
 * visitor recognises a ticket by, and the products the step treats by name. The rules of a product
 * are the catalog's (`/tickets`); this only says how the step asks for them.
 */
export interface TripTicketStep {
  /** The groups the step offers tickets for, always in this order. */
  resorts: readonly string[];
  entries: readonly TicketEntry[];
  /**
   * The market code a ticket sold to anyone at the operator's carries (`us` in Orlando), for an
   * API that does not send the region's `ticketMarkets` yet.
   */
  homeMarket: string;
  /**
   * A resort's 14-day ticket sold abroad that is one product whatever the first day
   * (Disney's), the one "Not sure which" names for a 14-day ticket of that resort.
   */
  fortnight?: { resort: string; product: string };
  /**
   * A resort's 14-day tickets sold abroad whose product the first day decides, the one sold
   * without the add-on first, and the product the add-on (a water park) turns it into.
   */
  rollingFortnight?: { resort: string; products: readonly string[]; withAddon: string };
  /** One package of the two fortnights, offered where the catalog has both: the two entries. */
  combo?: readonly [{ resort: string; entry: string }, { resort: string; entry: string }];
  /** Two parks a ride connects only with a hopper, and the resort they belong to. */
  connectedParks?: { resort: string; parks: readonly string[] };
  /** The hopper's own name per resort, a key under `tripRegion.planner.tickets.hopperName`. */
  hopperNames: Readonly<Record<string, string>>;
}

/**
 * The hub's questions that need a park or a leg of the region's to be asked: each is asked where
 * the region names what it needs, the data answers it and the region has written its words. The
 * quietest days and the five questions on the figure and the forecast are every region's.
 */
export interface TripHubFaq {
  /** The park whose party nights close it early: "Which park on a <park> party night?" */
  partyPark?: string;
  /** The park asked about on weekends: "Is <park> busier on weekends?" */
  weekendPark?: string;
  /** The drive between the resorts: from a park to a near one and a far one with a transfer. */
  distance?: { from: string; near: string; far: string };
  /** Whether the hotels' early slots are compared, the first kind against the second. */
  earlySlots?: readonly ['early_entry', 'early_park_admission'];
  /**
   * The region's own questions with a fixed answer, by key under `tripRegions.<slug>.hub.faq`
   * (`{ q, a }`), asked after the data questions in this order: Japan's luggage between cities.
   */
  questions?: readonly string[];
}

/** What the hub shows of the region beside the API's answers. */
export interface TripHub {
  /** The hero photos as media sources, the first the catalog still has wins. */
  heroPhotos: readonly string[];
  /** The hotel area the day sheet's drive times start from before the reader picks one. */
  defaultArea?: string;
  faq: TripHubFaq;
}

/** A kind of hotel the planner offers, and the hotel area such a stay is usually in. */
export interface TripHotelKind {
  key: string;
  /** The API's hotel-area key; the first kind of an area is the one that area plans with. */
  area?: string;
}

/** One trip region. Every field is the region's own; a sentence goes in the messages. */
export interface TripRegionConfig {
  /** The API's key (`/v1/trip-regions/<slug>`), the messages' (`tripRegions.<slug>`), analytics'. */
  slug: string;
  /**
   * Whether the region's pages answer and its links show. A region is added here with `false` and
   * goes live once its hub, its messages in six languages and its scene are in.
   */
  live: boolean;
  /** The hub's URL segment per locale: `/de/kalifornien`. One word, ASCII, as every slug here. */
  segments: Readonly<Record<Locale, string>>;
  /** The zone every park of the region runs on, and every "today" of its pages is read in. */
  timezone: string;
  /** The region's middle, for the Dataset's `spatialCoverage`. */
  centre: { latitude: number; longitude: number };
  /** The hub's own photo, a source in the media catalog: the tile's picture until the scene loads. */
  photo?: string;
  /** The Parky scene of the planner band's tile, loaded when the band first opens. */
  scene?: TripRegionSceneLoader;
  hub: TripHub;
  /** The best-time pages under `/<segment>/<best-time segment>`, the region's own first. */
  bestTime: readonly TripBestTimePage[];
  /** Place words a park's name ends in that a visitor drops: "SeaWorld Orlando" reads "SeaWorld". */
  parkNameSuffixes: readonly string[];
  /** A resort as a search snippet names it ("Disney"), by API group key; else its short name. */
  resortWords: Readonly<Record<string, string>>;
  /**
   * The hotel kinds the planner offers (`hotel=`), the API's keys, `offsite` last; each with the
   * hotel area a stay of that kind usually means, as the API reads it the other way round.
   */
  hotels: readonly TripHotelKind[];
  /**
   * The storm season the region's pages name (a FAQ, a month's note), or none: Orlando's
   * hurricanes, Japan's typhoons. The words are the region's (`bestTime.months.<kind>`,
   * `bestTime.faq.<kind>Q`).
   */
  stormSeason?: 'hurricane' | 'typhoon';
  /**
   * The two resorts whose days the planner keeps together (`blocks=`) and asks about: Disney and
   * Universal. Absent, a region has no such pair and the question is not asked.
   */
  blockResorts?: readonly [string, string];
  /** Whether the planner asks about a park's fireworks against its party nights (`fireworks=`). */
  fireworks?: boolean;
  /** The ticket step; absent, the planner plans without asking for tickets. */
  tickets?: TripTicketStep;
}

/** Every trip region, live or coming, in the order the planner band and the admin list them. */
export const TRIP_REGIONS: readonly TripRegionConfig[] = [
  ORLANDO,
  SOUTHERN_CALIFORNIA,
  JAPAN,
  PARIS,
];

/** The regions whose pages answer and whose links show. */
export const LIVE_TRIP_REGIONS: readonly TripRegionConfig[] = TRIP_REGIONS.filter((r) => r.live);

/** A region by its slug, live or not. */
export function tripRegionConfig(slug: string): TripRegionConfig | undefined {
  return TRIP_REGIONS.find((region) => region.slug === slug);
}

/** A live region by its slug, or `undefined`: what a page or a link may answer for. */
export function liveTripRegion(slug: string): TripRegionConfig | undefined {
  return LIVE_TRIP_REGIONS.find((region) => region.slug === slug);
}

/**
 * A region that has to exist, for code holding a slug that came from a page of that region. An
 * unknown slug is a programming error, never a visitor's, so it throws.
 */
export function requireTripRegion(slug: string): TripRegionConfig {
  const region = tripRegionConfig(slug);
  if (!region) throw new Error(`Unknown trip region: ${slug}`);
  return region;
}

/** A region's URL segment in a locale, the English one where a locale lacks its own. */
export function tripRegionSegment(region: TripRegionConfig, locale: string): string {
  return region.segments[locale as Locale] ?? region.segments.en;
}

/**
 * The live region and locale a URL segment belongs to: `kalifornien` is German, `california` is
 * English, Spanish and Italian. Every locale that spells the region so, in the list's order.
 */
export function tripRegionBySegment(
  segment: string
): { region: TripRegionConfig; locales: Locale[] } | null {
  for (const region of LIVE_TRIP_REGIONS) {
    const locales = (Object.entries(region.segments) as [Locale, string][])
      .filter(([, s]) => s === segment)
      .map(([locale]) => locale);
    if (locales.length > 0) return { region, locales };
  }
  return null;
}

/** The best-time page of a region by its id (`region` or a resort segment). */
export function bestTimePageOf(region: TripRegionConfig, id: string): TripBestTimePage | undefined {
  return region.bestTime.find((page) => page.id === id);
}

/**
 * A region as the admin names it, which writes in no reader's language: the slug in title case,
 * `southern-california` → „Southern California“.
 */
export function tripRegionTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Every park-name suffix of every region, for `shortParkName`, which is called without one. */
export const PARK_NAME_SUFFIXES: readonly string[] = [
  ...new Set(TRIP_REGIONS.flatMap((region) => region.parkNameSuffixes)),
];
