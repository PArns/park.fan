/**
 * How the header's favorites band divides itself up, in pixels, once it has been measured.
 *
 * Pure and out of the component on purpose — the same split `lib/utils/weather-chart-axis.ts`
 * makes, and for the same reason: this arithmetic has broken once already in a way a green build
 * showed nothing of, and the only way to hold it is to run it. `pnpm test:favorites-band`.
 *
 * **Every card in the panel is the same width, and that is what this exists to guarantee.** It
 * used to give each group `flexGrow: <its card count>` and then fill that width with
 * `repeat(auto-fill, minmax(10.5rem, 1fr))` — the width followed the count, the column count
 * followed the width, and the quantization in between broke the proportion it was built on.
 * Three starred parks beside five rides got 336 px, which is 12 px short of two 168 px columns,
 * so the parks group drew ONE column of 336 px cards and stacked all three: park cards at twice
 * the width of the ride cards beside them, and a menu band 868 px tall — taller than the window
 * it hangs in — for eight favorites.
 *
 * So the tracks are laid out first and the groups are cut from them. The band is measured, the
 * card width is derived from it once, and each group gets a whole number of those cards. What a
 * group cannot show in `MAX_CARD_ROWS` rows goes behind the "+N" line it already had, which is
 * what keeps the panel's height bounded no matter how much somebody has starred.
 */

/**
 * The most cards a group may ever show, however wide the band is.
 *
 * The band's own limit is `MAX_CARD_ROWS` rows of whatever columns `planBand` gave the group,
 * which is almost always the smaller of the two; this is the ceiling over it — a cap on how much
 * of the menu one group may take, not a column count.
 */
export const MAX_CARDS = 8;

/**
 * The band's card track, in pixels, and the numbers the allocation below is built out of.
 *
 * `CARD_MIN` is the width at which a card still says what it is: under it the second line stops
 * being a place name and becomes an ellipsis. `CARD_MAX` is the other end — two starred parks in
 * a 1248 px band must not become two 600 px billboards.
 *
 * The two gaps differ on purpose: cards inside a group belong together, groups do not.
 */
export const CARD_MIN = 168; // 10.5rem
export const CARD_MAX = 248; // 15.5rem
export const CARD_GAP = 12; // gap-3
export const GROUP_GAP = 32; // gap-8

/**
 * Rows are rows: extra width only makes one longer, so a row group gets a slice and no more.
 *
 * Two groups are shaped like this — shows/restaurants, and the alerts group — and they take the
 * same slice, because the alternative is a band whose two row columns are different widths for
 * no reason a reader can see.
 */
export const VENUE_BASIS = 208; // 13rem

/** Card rows a group may take before the rest goes behind the "+N" line. */
export const MAX_CARD_ROWS = 2;

/**
 * Below this the band is too narrow for two groups beside each other and they stack.
 *
 * A floor rather than a breakpoint: the nav row that holds the trigger is itself gone below a
 * 1024 px header, so the narrowest band anybody can open is 992 px and nothing today reaches
 * this. It is here so that a future change to the header's tiers degrades into a column instead
 * of into a row that does not fit.
 *
 * `Math.max(1, …)` rather than the raw count: the value for one row group is the number this was
 * before the alerts group existed, and a band with none of them must not start stacking at a
 * width where it used not to.
 */
export function stackBelow(rowGroups: number): number {
  return 2 * CARD_MIN + CARD_GAP + Math.max(1, rowGroups) * (GROUP_GAP + VENUE_BASIS);
}

export interface BandPlan {
  /** Groups under each other instead of beside each other — the band is too narrow for a row. */
  stacked: boolean;
  /** The width of one card. The same number in every group. */
  card: number;
  /** Card columns per group. */
  parks: number;
  attractions: number;
}

/**
 * Hands `total` tracks to the groups: one each, then always to whoever is most crowded.
 *
 * Greedy on `wanted / (has + 1)`, so five rides outbid three parks for the fourth track and the
 * split lands on the counts rather than on a rounded percentage. A group never gets more tracks
 * than it has cards — a spare track would draw an empty column, and the group beside it can use
 * the room.
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
 * `null` until the band has a width — before the first layout pass there is nothing to divide.
 *
 * `rowGroups` is how many of the row-shaped groups are on screen (shows/restaurants, alerts).
 * They are counted rather than derived from `counts`, because whether the alerts group renders
 * is a question about this browser's push follows, which the favorites cookie knows nothing about.
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

  // What the cards may spend. Stacked, each group has the band to itself on its own line, so the
  // group gaps and the row-group slices come out of nothing.
  const forCards = stacked ? width : width - (groups - 1) * GROUP_GAP - rowGroups * VENUE_BASIS;
  const sharers = stacked ? 1 : cardGroups;
  const tracks = Math.max(sharers, Math.floor((forCards + CARD_GAP) / (CARD_MIN + CARD_GAP)));
  const cols = stacked ? wanted.map((w) => (w > 0 ? tracks : 0)) : shareTracks(tracks, wanted);

  // Off the tracks actually handed out, not off the tracks that fit: two favorites should use the
  // room the other six would have taken rather than leave it blank — up to `CARD_MAX`, past which
  // a card in a menu turns into a billboard. `floor`, so a rounded-up sub-pixel cannot push the
  // last column out of a group whose width the same numbers computed.
  const used = stacked ? tracks : cols.reduce((a, b) => a + b, 0);
  const card = Math.floor(Math.min(CARD_MAX, (forCards - (used - sharers) * CARD_GAP) / used));

  return { stacked, card, parks: cols[0], attractions: cols[1] };
}
