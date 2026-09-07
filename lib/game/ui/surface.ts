/**
 * The HUD's materials, as class strings.
 *
 * They are constants in a `.ts` file rather than utilities in a stylesheet for the reason
 * `components/common/glass-card.tsx` gives for `HEAVY_GLASS` and `TILE_GLASS`: the recipe is a
 * stack of four decisions (fill, blur, hairline, shadow) that only reads as one material if every
 * surface takes the whole stack, and a call site that writes three of the four is how a park page
 * ended up with three different glasses in one column. The game's own tokens
 * (`--game-hud`, `--game-hud-strong`, `--game-accent`, …) live in `lib/game/core/game.css`.
 *
 * ## Two grades, and the line between them is how much text is on the surface
 *
 * `HUD_CHIP` is the lighter fill (`--game-hud`, 0.72). It carries a clock, a figure, a row of
 * icon buttons — a handful of high-contrast glyphs with generous size, which survive a bright sky
 * showing through.
 *
 * `HUD_PANEL` is the solid one (`--game-hud-strong`, 0.86) and every panel body takes it. A panel
 * is forty rows of `text-xs` in a muted colour, and at 0.72 over a noon sky the second line of a
 * row is the same problem the park page's entry tiles had: the label clears AA and the hint does
 * not. It is the same reasoning, one step further along, because a HUD's backdrop is not a
 * photograph that stays put — it is a park that moves under it.
 *
 * ## The scrims are not decoration
 *
 * `backdrop-blur` blurs what is behind a surface; it does nothing for the gap between two
 * surfaces, and the top row of this HUD is two clusters with a kilometre of bright sky between
 * them. `SCRIM_TOP` and `SCRIM_BOTTOM` put a soft dark gradient under the whole row so a chip's
 * edge never has to be the only thing separating it from a cloud, and so the build bar reads
 * against pale paving. They are `pointer-events-none` and sit under everything.
 */

/** Chrome fill for the small clusters: clock, money, the rail. */
export const HUD_CHIP =
  'rounded-(--game-hud-radius) border border-white/10 bg-(--game-hud) shadow-[0_10px_30px_-12px_rgb(0_0_0/0.7),inset_0_1px_0_rgb(255_255_255/0.07)] backdrop-blur-xl';

/** The solid grade, for anything with a paragraph or a table on it. */
export const HUD_PANEL =
  'rounded-(--game-hud-radius) border border-white/12 bg-(--game-hud-strong) shadow-[0_18px_50px_-18px_rgb(0_0_0/0.85),inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-2xl';

/** A row inside a panel. The hover step is deliberately small; a list is not a menu. */
export const HUD_ROW =
  'rounded-lg border border-transparent bg-white/[0.03] transition-colors hover:border-white/10 hover:bg-white/[0.07]';

/** The selected row of a list. */
export const HUD_ROW_ACTIVE =
  'rounded-lg border border-(--game-accent)/45 bg-(--game-accent)/12 transition-colors';

/** A small inset block: a figure with its label, a meter's track. */
export const HUD_WELL = 'rounded-lg bg-black/25 ring-1 ring-inset ring-white/[0.06]';

/** Section label above a group of rows. */
export const HUD_LABEL =
  'text-[10px] font-medium tracking-[0.08em] text-white/45 uppercase select-none';

/** The muted body colour inside game glass. */
export const HUD_MUTED = 'text-white/60';

export const SCRIM_TOP =
  'pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/45 via-black/12 to-transparent';

export const SCRIM_BOTTOM =
  'pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/50 via-black/14 to-transparent';

/**
 * Tone → colour, for a status dot, a meter fill and a figure that has gone wrong.
 *
 * Four tones and no more: a park HUD that needs a fifth is a HUD whose reader has to learn a
 * legend. `warn` and `bad` are the two game tokens; `good` is the accent's warmer sibling so a
 * healthy figure does not read as an interactive control.
 */
export const TONE_TEXT: Record<'neutral' | 'good' | 'warn' | 'bad', string> = {
  neutral: 'text-white/90',
  good: 'text-[oklch(0.82_0.15_155)]',
  warn: 'text-(--game-warning)',
  bad: 'text-(--game-danger)',
};

export const TONE_FILL: Record<'neutral' | 'good' | 'warn' | 'bad', string> = {
  neutral: 'bg-white/55',
  good: 'bg-[oklch(0.82_0.15_155)]',
  warn: 'bg-(--game-warning)',
  bad: 'bg-(--game-danger)',
};

export const TONE_DOT: Record<'neutral' | 'good' | 'warn' | 'bad', string> = {
  neutral: 'bg-white/45',
  good: 'bg-[oklch(0.82_0.15_155)] shadow-[0_0_8px_oklch(0.82_0.15_155/0.55)]',
  warn: 'bg-(--game-warning) shadow-[0_0_8px_var(--game-warning)]',
  bad: 'bg-(--game-danger) shadow-[0_0_8px_var(--game-danger)]',
};

export type Tone = keyof typeof TONE_TEXT;

/** The state of a machine, as a tone. Used by the ride list and the ride inspector alike. */
export function rideTone(state: string): Tone {
  switch (state) {
    case 'broken':
      return 'bad';
    case 'maintenance':
      return 'warn';
    case 'closed':
    case 'unknown':
      return 'neutral';
    default:
      return 'good';
  }
}
