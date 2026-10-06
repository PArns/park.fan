import 'server-only';
import { cache } from 'react';
import { getAttractionByGeoPath } from '@/lib/api/parks';
import { getListItemByLocaleSlug, hasPublishedPosts } from '@/lib/blog/listing';
import { postPath } from '@/lib/blog/paths';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { stripNewPrefix } from '@/lib/utils';
import type { AttractionResponse, ClosedAttraction } from '@/lib/api/types';
import type { ClosedRideSearchItem } from '@/components/parks/closed-ride-matches';
import type { Locale } from '@/i18n/config';

/**
 * A ride that closed for good keeps its page. The park payload leaves retired rides out, but the
 * attraction detail endpoint still answers for them; this asks it (only after the park payload
 * missed) and decides whether the answer is a page. Only `retiredKind === 'closed'` is: a
 * `reclassified` row or a dropped duplicate closed nothing and stays a 404. `cache()` makes the
 * metadata and page reads one. See docs/rules/a-closed-ride-keeps-its-page.md.
 */
export const getClosedRide = cache(
  async (
    continent: string,
    country: string,
    city: string,
    parkSlug: string,
    attractionSlug: string
  ): Promise<ClosedRide | null> => {
    const detail = await getAttractionByGeoPath(continent, country, city, parkSlug, attractionSlug);
    return isClosedRide(detail) ? detail : null;
  }
);

/** An attraction response that is a ride closed for good, with the date it closed. */
export type ClosedRide = AttractionResponse & { retiredAt: string; retiredKind: 'closed' };

/** Whether an attraction detail response is a ride closed for good. */
export function isClosedRide(detail: AttractionResponse | null | undefined): detail is ClosedRide {
  return detail?.retiredKind === 'closed' && typeof detail.retiredAt === 'string';
}

/**
 * The day a ride closed, written out in the reader's locale. `retiredAt` is an editor's date stored
 * as midnight UTC, so it is formatted in UTC; the park's zone would move it to the day before.
 */
export function formatClosedOn(retiredAt: string, locale: string): string {
  const day = new Date(retiredAt);
  if (Number.isNaN(day.getTime())) return retiredAt.slice(0, 10);
  return getDateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(day);
}

/** Month and year only, for a list where the day is noise. */
export function formatClosedMonth(retiredAt: string, locale: string): string {
  const day = new Date(retiredAt);
  if (Number.isNaN(day.getTime())) return retiredAt.slice(0, 7);
  return getDateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(day);
}

/** `https://park.fan/news/<slug>`, `/blog/<slug>`, with or without a locale segment. */
const PARK_FAN_POST_URL =
  /https?:\/\/(?:www\.)?park\.fan(?:\/[a-z]{2})?\/(?:news|blog)\/([a-z0-9-]+)/i;

const HTTP_URL = /https?:\/\/[^\s<>"')\]]+/gi;

/**
 * Our own post about the closure, in the reader's language, when the retirement reason links one.
 * The reason is an editor's free English text, often just our post's English URL; the slug is
 * looked up in the manifest and the reader gets that post's translation under `postPath`, never
 * the English slug on a German page. Null when no post of ours is linked or published.
 */
export function closedRidePost(
  retiredReason: string | null | undefined,
  locale: Locale
): { href: string; title: string } | null {
  if (!retiredReason || !hasPublishedPosts(locale)) return null;
  const slug = PARK_FAN_POST_URL.exec(retiredReason)?.[1]?.toLowerCase();
  if (!slug) return null;

  const post = getListItemByLocaleSlug(slug, locale);
  if (!post) return null;
  return { href: postPath(post), title: post.frontmatter.title };
}

/**
 * The first outside source the reason links, for a retirement that names no post of ours. Shown
 * as the host name only: the rest of the reason is an editor's English note.
 */
export function closedRideSource(
  retiredReason: string | null | undefined
): { href: string; host: string } | null {
  if (!retiredReason) return null;
  for (const match of retiredReason.matchAll(HTTP_URL)) {
    const href = match[0].replace(/[.,;:]+$/, '');
    let url: URL;
    try {
      url = new URL(href);
    } catch {
      continue;
    }
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'park.fan') continue;
    return { href: url.toString(), host };
  }
  return null;
}

/**
 * The park's closed rides as its ride search takes them: name, slug, themed area and the month it
 * closed as finished text, so the client tree formats nothing. `undefined` for a park without one,
 * so the prop is simply absent from the payload.
 */
export function closedRidesForSearch(
  rides: readonly ClosedAttraction[] | undefined,
  locale: string,
  since: (month: string) => string
): ClosedRideSearchItem[] | undefined {
  if (!rides?.length) return undefined;
  return rides.map((ride) => ({
    id: ride.id,
    name: stripNewPrefix(ride.name),
    slug: ride.slug,
    land: ride.land ?? null,
    since: since(formatClosedMonth(ride.retiredAt, locale)),
  }));
}
