import type { Metadata } from 'next';
import { locales, localeToOpenGraphLocale } from '@/i18n/config';

/**
 * Google truncates the SERP title around 60 characters, and a keyword past that disappears behind
 * an ellipsis. Templates fit typical names; a long name pushes them over on its own.
 */
export const MAX_TITLE_LENGTH = 60;
/** Google's snippet length, past which the description is cut. */
export const MAX_DESCRIPTION_LENGTH = 160;

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

/** Builds the openGraph and twitter metadata that are the same on every page. */
export function buildOpenGraphMetadata({
  locale,
  title,
  description,
  url,
  ogImageUrl,
  imageAlt,
}: {
  locale: string;
  title: string;
  description: string;
  url: string;
  ogImageUrl: string;
  /** Defaults to the title. */
  imageAlt?: string;
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  const alt = imageAlt ?? title;
  return {
    openGraph: {
      title,
      description,
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url,
      siteName: 'park.fan',
      type: 'website',
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
