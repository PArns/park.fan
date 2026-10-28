import type { MostReadPost } from '@/lib/blog/most-read';

/**
 * Rows of parks (or, in a park, rides) the hero's resting list holds below `md`, above the two
 * posts. Five fit because the phone's plate sits higher and wider, its headline, intro and badge
 * row are shorter and the rows are compact; the plate still ends inside a 360 × 740 screen. The
 * measurements are in docs/features/homepage-hero.md#what-the-list-holds-at-rest.
 */
export const HERO_REST_ROWS_PHONE = 5;

/**
 * Rows from `md` up, above the two posts. Four parks and the posts take the room the pill rows
 * left, so the plate keeps its height.
 */
export const HERO_REST_ROWS_DESKTOP = 4;

/**
 * Rows of the step card's copy of the field, from `md` up; it shows no posts and no list on a
 * phone, where its field opens the palette.
 */
export const STEP_REST_ROWS_DESKTOP = 3;

/**
 * The anchor of the homepage's nearby chapter, which lists more of the visitor's nearby parks; the
 * hero's list links to it.
 */
export const NEARBY_CHAPTER_ID = 'parks-in-deiner-naehe';

/** The two posts the hero's resting list closes with, resolved on the server. */
export interface HeroReading {
  /** The most read news post of the build's ranking, or the newest one when nothing was read. */
  news: MostReadPost | null;
  /** The newest guide, new or with new content (`listArticlesByRecency`). */
  guide: MostReadPost | null;
  /** The news post the badge row's chip already shows, which the news pick skips. */
  skipNewsSlug: string | null;
  /** The news section's label in this locale (`categories.json`). */
  newsLabel: string;
  /**
   * Teasers by post key, cut on the server: the guide's and those of every news post the live
   * ranking is likely to pick, so the swap after load finds its post's teaser without a request.
   */
  excerpts: Record<string, string>;
}

/** The first news post of a ranking that the chip above does not already show. */
export function pickHeroNews(
  ranking: readonly MostReadPost[],
  skipSlug: string | null
): MostReadPost | null {
  return ranking.find((post) => post.slug !== skipSlug) ?? null;
}
