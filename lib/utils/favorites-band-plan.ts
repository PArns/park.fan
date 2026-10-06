/**
 * How the header's favorites band divides itself up, in pixels, once it has been measured. Pure so
 * `pnpm test:favorites-band` can run it.
 *
 * Every card in the panel is the same width. Letting each group's width follow its count and then
 * auto-filling columns quantized badly (cards at twice the width of their neighbours, a band taller
 * than the window), so the tracks are laid out first and the groups cut from them. What a group
 * cannot show in `MAX_CARD_ROWS` rows goes behind its „+N" line, which bounds the panel's height.
 * See docs/rules/the-header-menu-is-three-kinds-of-content-and-the-split-is.md.
 */

/**
 * The most cards a group may ever show, however wide the band: a cap on how much of the menu one
 * group may take. `MAX_CARD_ROWS` rows is usually the tighter limit.
 */
export const MAX_CARDS = 8;

/**
 * Smallest card width at which the second line still names a place instead of an ellipsis.
 * The gaps differ on purpose: cards inside a group belong together, groups do not.
 */
export const CARD_MIN = 168; // 10.5rem
/** Largest card width, so two favorites in a wide band do not become billboards. */
export const CARD_MAX = 248; // 15.5rem
/** Gap between cards inside a group. */
export const CARD_GAP = 12; // gap-3
/** Gap between groups. */
export const GROUP_GAP = 32; // gap-8

/**
 * Width of a row-shaped group (shows/restaurants, alerts): extra width only makes rows longer, so
 * such a group gets a fixed slice, the same for both so their columns match.
 */
export const VENUE_BASIS = 208; // 13rem

/** Card rows a group may take before the rest goes behind the "+N" line. */
export const MAX_CARD_ROWS = 2;

/**
 * Below this width the band is too narrow for groups side by side and they stack. A floor rather
 * than a breakpoint: no header width reaches it today, but a change to the header's tiers should
 * degrade into a column. `Math.max(1, …)` keeps a band with no row groups from stacking earlier.
 */
export function stackBelow(rowGroups: number): number {
  return 2 * CARD_MIN + CARD_GAP + Math.max(1, rowGroups) * (GROUP_GAP + VENUE_BASIS);
}

/** The band's layout: whether groups stack, the shared card width, and columns per group. */
export interface BandPlan {
  /** Groups under each other instead of beside each other. */
  stacked: boolean;
  /** The width of one card, the same in every group. */
  card: number;
  /** Card columns per group. */
  parks: number;
  attractions: number;
}

/**
 * Hands `total` tracks to the groups: one each, then greedily to whoever has the highest
 * `wanted / (has + 1)`, so the split follows the counts. A group never gets more tracks than
 * cards, since a spare track would draw an empty column.
 */
export function shareTracks(total: number, wanted: number[]): number[] {
  const cols: number[] = wanted.map((w) => (w > 0 ? 1 : 0));
  let left = total - cols.reduce((a, b) => a + b, 0);

  while (left > 0) {
    let best = -1;
    let bestScore = 0;
    wanted.forEach((want, i) => {
      if (cols[i] >= want) return;
      const score = want / (cols[i] + 1);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    if (best < 0) break;
    cols[best] += 1;
    left -= 1;
  }

  return cols;
}

/**
 * Plans the band for a measured width, or `null` before the first layout pass. `rowGroups` is
 * passed in rather than derived from `counts`, because whether the alerts group renders depends on
 * this browser's push follows, which the favorites cookie knows nothing about.
 */
export function planBand(
  width: number,
  counts: { parks: number; attractions: number },
  rowGroups: number
): BandPlan | null {
  if (width <= 0) return null;

  const wanted = [Math.min(counts.parks, MAX_CARDS), Math.min(counts.attractions, MAX_CARDS)];
  const cardGroups = wanted.filter((w) => w > 0).length;
  const groups = cardGroups + rowGroups;
  const stacked = groups > 1 && width < stackBelow(rowGroups);

  if (cardGroups === 0) return { stacked, card: 0, parks: 0, attractions: 0 };

  // Stacked, each group has the band to itself, so group gaps and row-group slices cost nothing.
  const forCards = stacked ? width : width - (groups - 1) * GROUP_GAP - rowGroups * VENUE_BASIS;
  const sharers = stacked ? 1 : cardGroups;
  const tracks = Math.max(sharers, Math.floor((forCards + CARD_GAP) / (CARD_MIN + CARD_GAP)));
  const cols = stacked ? wanted.map((w) => (w > 0 ? tracks : 0)) : shareTracks(tracks, wanted);

  // Off the tracks handed out, not the tracks that fit, so two favorites use the room up to
  // `CARD_MAX`. `floor`, so a rounded-up sub-pixel cannot push the last column out of its group.
  const used = stacked ? tracks : cols.reduce((a, b) => a + b, 0);
  const card = Math.floor(Math.min(CARD_MAX, (forCards - (used - sharers) * CARD_GAP) / used));

  return { stacked, card, parks: cols[0], attractions: cols[1] };
}
