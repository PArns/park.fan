import type { MostReadPost } from '@/lib/blog/most-read';

/**
 * Rows of parks (or, in a park, rides) the hero's resting list holds below `md`, above the two
 * posts: as many as from `md` up, so the two lists show the same parks and the plate ends well
 * inside a 360 × 740 screen. The measurements are in
 * docs/features/homepage-hero.md#what-the-list-holds-at-rest.
 */
export const HERO_REST_ROWS_PHONE = 4;

/**
 * Rows of the phone's list for a visitor in or next to a park: the park's block (`useHeroPark`)
 * takes the room of the other rows and of the posts, so the list keeps its height. The block needs
 * three rows and the posts' box, which leaves one.
 */
export const HERO_PARK_ROWS_PHONE = 1;

/**
 * Rows from `md` up, above the two posts. Four parks and the posts take the room the pill rows
 * left, so the plate keeps its height.
 */
export const HERO_REST_ROWS_DESKTOP = 4;

/**
 * The anchor of the homepage's nearby chapter, which lists more of the visitor's nearby parks; the
 * hero's list links to it.
 */
export const NEARBY_CHAPTER_ID = 'parks-in-deiner-naehe';

/**
 * The homepage hero's `id`: the location banner waits below `md` until it is scrolled past, since
 * it would cover the hero's search list.
 */
export const HOME_HERO_ID = 'hero';

/** The two posts the hero's resting list closes with, resolved on the server. */
export interface HeroReading {
  /** The newest news post (`listNewsByDate`). */
  news: MostReadPost | null;
  /** The newest guide, new or with new content (`listArticlesByRecency`). */
  guide: MostReadPost | null;
  /** The two posts' teasers by post key, cut on the server. */
  excerpts: Record<string, string>;
}
