import 'server-only';
import { cache } from 'react';
import { getAttractionByGeoPath } from '@/lib/api/parks';
import { getListItemByLocaleSlug, hasPublishedPosts } from '@/lib/blog/listing';
import { postPath } from '@/lib/blog/paths';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import type { AttractionResponse } from '@/lib/api/types';
import type { Locale } from '@/i18n/config';

/**
 * A ride that closed for good keeps its page.
 *
 * The park payload leaves retired rides out, so a ride page that cannot find its slug there used
 * to answer 404 — X2 at Six Flags Magic Mountain, retired on 2026-07-13, did so while its own news
 * post linked to it. The attraction detail endpoint keeps answering for a retired ride, and this
 * is the one place that asks it and decides whether what came back is a page.
 *
 * Only `retiredKind === 'closed'` is. A `reclassified` row is one the source now lists as a show
 * or a restaurant: nothing closed, so a page saying so would be wrong, and it stays a 404 as it
 * was. The same goes for a slug the park payload dropped as a name duplicate, which comes back
 * from the detail endpoint with no `retiredKind` at all.
 *
 * Asked only after the park payload missed, so a live ride costs nothing. The fetch is the cached
 * detail read the blog's ride references already share; `generateMetadata` and the page body ask
 * the same question and `cache()` makes it one.
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

export function isClosedRide(detail: AttractionResponse | null | undefined): detail is ClosedRide {
  return detail?.retiredKind === 'closed' && typeof detail.retiredAt === 'string';
}

/**
 * The day a ride closed, written out in the reader's locale.
 *
 * `retiredAt` is the day an editor entered, stored as midnight UTC, so it is formatted in UTC: in
 * the park's own timezone Magic Mountain's 13 July would read 12 July.
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
 *
 * The reason is free English text an editor typed, often nothing but a URL, and X2's is our news
 * post's English address. That address is looked up in the blog manifest and the reader gets the
 * translation of the same post (or the English one where there is none), under the URL `postPath`
 * gives it — never the English slug on a German page.
 *
 * Null when the reason names no post of ours, when the post is not in the manifest (a draft), or
 * when this locale has no blog at all.
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
 * The first outside source the reason links, for a retirement that names no post of ours.
 *
 * Shown as the source's host name and nothing more: the rest of the reason is an editor's English
 * note, and printing it on a page in five other languages would be a sentence the reader did not
 * ask for in a language they may not read.
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
