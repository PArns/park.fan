import type { Metadata } from 'next';
import { locales, localeToOpenGraphLocale, SITE_URL, type Locale } from '@/i18n/config';

/**
 * Google cuts a result's title by its width, the 600 px of a desktop result's column in 20 px Arial,
 * not by a count of characters, and a keyword past the cut disappears behind an ellipsis. Lower
 * case is narrow and Title Case and digits are wide, so „Phantasialand: Wartezeiten LIVE &
 * Auslastung heute“ fits where an English title of the same length may not. {@link titleWidth}
 * estimates the width, {@link fitTitle} picks by it.
 */
export const MAX_TITLE_WIDTH_PX = 600;

/** Arial's advance widths in thousandths of an em, grouped, for the characters titles use. */
const ARIAL_WIDTH_GROUPS: ReadonlyArray<readonly [number, string]> = [
  [191, "'"],
  [222, 'ijl’‘'],
  [260, '|'],
  [278, ' !,./:;I[]\\ft·'],
  [333, '()-r“”„'],
  [355, '"'],
  [389, '*'],
  [500, 'Jcksvxyz'],
  [556, '0123456789abdeghnopqu?#$L–«»_'],
  [584, '+<=>~'],
  [611, 'FTZß'],
  [667, 'ABEKPSVXY&'],
  [722, 'CDHNRUw'],
  [778, 'GOQ'],
  [833, 'Mm'],
  [889, '%'],
  [944, 'W'],
  [1000, '—…'],
  [1015, '@'],
];
const ARIAL_WIDTHS = new Map(
  ARIAL_WIDTH_GROUPS.flatMap(([width, chars]) => [...chars].map((ch) => [ch, width] as const))
);

/**
 * The estimated width of a title in px on Google's desktop result page (20 px Arial). Accents add
 * nothing to their letter; a character Arial's table here does not list counts as a digit, a CJK or
 * other full-width one as a full em.
 */
export function titleWidth(text: string): number {
  let units = 0;
  for (const ch of text.normalize('NFD')) {
    if (/\p{M}/u.test(ch)) continue;
    units += ARIAL_WIDTHS.get(ch) ?? ((ch.codePointAt(0) ?? 0) >= 0x2e80 ? 1000 : 556);
  }
  return (units / 1000) * 20;
}

/**
 * The first title candidate whose estimated width fits {@link MAX_TITLE_WIDTH_PX}, else the
 * narrowest; never truncates mid-word. Pass candidates richest-first.
 */
export function fitTitle(...candidates: string[]): string {
  const usable = candidates.filter((c) => c && c.trim().length > 0);
  if (usable.length === 0) return '';
  return (
    usable.find((c) => titleWidth(c) <= MAX_TITLE_WIDTH_PX) ??
    usable.reduce((narrowest, c) => (titleWidth(c) < titleWidth(narrowest) ? c : narrowest))
  );
}
/** Google's snippet length, past which the description is cut. */
export const MAX_DESCRIPTION_LENGTH = 160;

/**
 * A date that ends a sentence on its abbreviation („16. Nov.“, „7–16 sept.“) prints two full stops
 * with the sentence's own; one stays. Run it on each candidate before {@link fitWithin}, so the
 * length is the printed one.
 */
export function oneFullStop(text: string): string {
  return text.replace(/\.\./g, '.');
}

/**
 * Picks the first candidate that fits, else the shortest; never truncates mid-word. Pass
 * candidates richest-first. When even the shortest overruns, it still wins: a clipped bare name
 * costs less than a clipped template.
 */
export function fitWithin(limit: number, ...candidates: string[]): string {
  const usable = candidates.filter((c) => c && c.trim().length > 0);
  if (usable.length === 0) return '';
  return (
    usable.find((c) => c.length <= limit) ??
    usable.reduce((shortest, c) => (c.length < shortest.length ? c : shortest))
  );
}

/**
 * A sentence ends at `.`, `!`, `?` or `…` followed by a space and an upper-case letter (or an
 * opening quote) — but not after a single letter or a known abbreviation, so "z. B. Taron",
 * "Dr. Seuss" and "e.g. Taron" stay one sentence.
 */
const SENTENCE_BREAK = /(?<=[.!?…])\s+(?=[\p{Lu}„"«¿¡])/u;
const ABBREVIATION_END =
  /(?:^|[\s(])(?:\p{L}|Dr|Mr|Mrs|St|ca|bzw|usw|etc|e\.g|i\.e|z\.\s?B|d\.\s?h)\.$/iu;

/** Below this, whole sentences lose to a clipped longer text in {@link fitSentences}. */
const MIN_SENTENCE_DESCRIPTION = 70;

function sentencesOf(text: string): string[] {
  const parts = text.split(SENTENCE_BREAK);
  const sentences: string[] = [];
  for (const part of parts) {
    const last = sentences.at(-1);
    if (last !== undefined && ABBREVIATION_END.test(last))
      sentences[sentences.length - 1] = `${last} ${part}`;
    else sentences.push(part);
  }
  return sentences;
}

/**
 * A description of at most `limit` characters cut from running text: as many whole sentences as
 * fit, else the first sentence cut at a word boundary with an ellipsis, so a snippet never ends
 * mid-clause.
 */
export function fitSentences(text: string, limit: number = MAX_DESCRIPTION_LENGTH): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  let out = '';
  for (const sentence of sentencesOf(clean)) {
    const next = out ? `${out} ${sentence}` : sentence;
    if (next.length > limit) break;
    out = next;
  }
  // A lone short sentence ("Airtime is a feeling.") says less than a clipped longer one.
  if (out.length >= MIN_SENTENCE_DESCRIPTION) return out;
  return `${clean.slice(0, limit - 1).replace(/[\s,;:–-]+\S*$/, '')}…`;
}

/**
 * Builds the openGraph and twitter metadata that are the same on every page. `type` is the page's
 * Open Graph type; a post adds its `article` facts. `alternateLocale` lists the other locales, left
 * out (`false`) where the page does not exist in all of them.
 */
export function buildOpenGraphMetadata({
  locale,
  title,
  description,
  url,
  ogImageUrl,
  imageAlt,
  type = 'website',
  alternateLocale = true,
  article,
}: {
  locale: string;
  title: string;
  description: string;
  url: string;
  ogImageUrl: string;
  /** Defaults to the title. */
  imageAlt?: string;
  type?: 'website' | 'article' | 'profile';
  alternateLocale?: boolean;
  /** A post's dates, section and tags, with `type: 'article'`. */
  article?: { publishedTime?: string; modifiedTime?: string; section?: string; tags?: string[] };
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  const alt = imageAlt ?? title;
  return {
    openGraph: {
      title,
      description,
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      ...(alternateLocale && {
        alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      }),
      url,
      siteName: 'park.fan',
      type,
      ...article,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

/**
 * The hreflang set of a page: the absolute URL in every locale `pathFor` names a path for (the path
 * after the locale, `''` for the locale's home), in the order of `locales`, then `x-default` on the
 * English one. `pathFor` answers `null` where the page does not exist in a locale; without an
 * English page there is no `x-default`.
 */
export function alternateLanguages(
  pathFor: (locale: Locale) => string | null
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    const path = pathFor(locale);
    if (path !== null) languages[locale] = `${SITE_URL}/${locale}${path}`;
  }
  if (languages.en) languages['x-default'] = languages.en;
  return languages;
}

/**
 * `alternates` of a page that exists in every locale: its canonical in `locale` and the hreflang
 * set ({@link alternateLanguages}), both from one `pathFor`, so the two cannot disagree. The same
 * shape `app/sitemap.ts` writes; a page and the sitemap disagreeing about `x-default` is an
 * hreflang conflict.
 */
export function buildAlternates(
  locale: string,
  pathFor: (locale: Locale) => string
): { canonical: string; languages: Record<string, string> } {
  return {
    canonical: `${SITE_URL}/${locale}${pathFor(locale as Locale)}`,
    languages: alternateLanguages(pathFor),
  };
}
