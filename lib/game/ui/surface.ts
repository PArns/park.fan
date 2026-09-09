/**
 * The HUD's materials, as class strings.
 *
 * They are constants in a `.ts` file rather than utilities in a stylesheet for the reason
 * `components/common/glass-card.tsx` gives for `HEAVY_GLASS` and `TILE_GLASS`: a material is a
 * stack of decisions (body, gloss, three rims, contour, lift) that only reads as one material if
 * every surface takes the whole stack, and a call site that writes four of the six is how a park
 * page ended up with three different glasses in one column. The tokens they are built from live
 * in `lib/game/core/game.css`.
 *
 * ## The spine, and every call site is bound by it
 *
 * **RAISED MEANS YOU CAN PRESS IT, SUNK MEANS IT IS TELLING YOU SOMETHING.** A figure never sits
 * on a raised key; a button is never a groove. That is what lets a reader tell a control from a
 * readout before reading either, which the flat HUD did not allow — in the before/after pair
 * under `.game-render/hud-skin/` the stat row and the tool row are the same material, and the
 * only way to tell which of them does something is to click one.
 *
 * ## Two accents, and a call site may not blur them
 *
 * `--game-accent` is **ON**: a state that persists — the active speed key, the open panel's rail
 * key, snap, the active tab, the selected tile, the primary button. `--game-accent-2` is
 * **ARMED**: what the next click on the park does. Exactly one armed ring exists on screen at a
 * time, and the ring is a ring rather than a fill so it can ride any body, including a lit one.
 *
 * ## Every class here is a whole literal
 *
 * Tailwind extracts class names by reading the source text, so a recipe may be joined from these
 * constants with spaces and may never be assembled from fragments — no `'bg-' + tone`, and no
 * template literal splicing a constant into `shadow-[…]`. That produces a class nothing generates
 * and a control with no bevel at all: green build, flat button.
 *
 * ## The gloss is a background LAYER, never a `::before`
 *
 * The two look identical on a plain key and are not identical over a picture: an overlay milks
 * the top of an item tile's picture well, a background layer under the tile's own body leaves it
 * clean. The background form also needs no `content:''`, no `isolate` and no z-index rule on
 * children — which matters, because these strings are handed to foreign modules through the panel
 * registry.
 *
 * ## The scrims are not decoration
 *
 * `backdrop-blur` blurs what is behind a surface; it does nothing for the gap between two
 * surfaces, and the top row of this HUD is two clusters with a kilometre of bright sky between
 * them. They are lighter than they were, because the heavier surfaces now carry work the scrims
 * were doing.
 */

// ── RAISE: the body of anything you can press ─────────────────────────────────────────────

/** The body: gloss over the key's own gradient, the engraved label, a fast state transition. */
export const RAISE_BODY =
  'rounded-(--game-radius-key) bg-(--game-key-bottom) bg-[image:var(--game-gloss),linear-gradient(180deg,var(--game-key-top),var(--game-key-bottom))] text-white/88 [text-shadow:var(--game-engrave)] transition-[background-image,box-shadow,translate] duration-100 hover:text-white';

/** Hover swaps the body pair. Nothing else moves. */
export const RAISE_HOVER =
  'hover:bg-[image:var(--game-gloss),linear-gradient(180deg,var(--game-key-top-hover),var(--game-key-bottom-hover))]';

/** Press inverts the body pair, drops the gloss and sinks by a pixel. */
export const RAISE_PRESS =
  'active:translate-y-px active:bg-[image:linear-gradient(180deg,var(--game-key-bottom),var(--game-key-top))] active:shadow-(--game-sink)';

/** `.on` — a state that persists. It reads LIT rather than merely coloured. */
export const RAISE_ON_BODY =
  'bg-[image:var(--game-gloss-lit),linear-gradient(180deg,var(--game-accent-lit),var(--game-accent-deep))] text-white hover:bg-[image:var(--game-gloss-lit),linear-gradient(180deg,var(--game-accent-lit),var(--game-accent-deep))]';

/**
 * The four lifts, written out in full.
 *
 * A box-shadow is one property, so a ring "laid over whatever the body already is" has to be the
 * complete list for that state — a call site that appends its own `shadow-…` replaces all of it.
 */
const LIFT_IDLE =
  'shadow-[inset_0_1px_0_var(--game-rim-light),inset_1px_0_0_var(--game-rim-side),inset_-1px_0_0_rgb(0_0_0/0.28),inset_0_-1px_0_var(--game-rim-dark),0_0_0_1px_var(--game-contour),var(--game-lift-key)]';
const LIFT_ON =
  'shadow-[inset_0_1px_0_rgb(255_255_255/0.55),inset_1px_0_0_var(--game-rim-side),inset_-1px_0_0_rgb(0_0_0/0.28),inset_0_-1px_0_rgb(0_0_0/0.4),0_0_0_1px_var(--game-contour),0_0_0_2px_oklch(0.75_0.14_242/0.32),var(--game-lift-key),var(--game-glow-accent)]';
const LIFT_ARMED =
  'shadow-[inset_0_1px_0_var(--game-rim-light),inset_1px_0_0_var(--game-rim-side),inset_-1px_0_0_rgb(0_0_0/0.28),inset_0_-1px_0_var(--game-rim-dark),0_0_0_1px_var(--game-contour),0_0_0_3px_var(--game-accent-2),var(--game-lift-key),var(--game-glow-armed)]';
const LIFT_ON_ARMED =
  'shadow-[inset_0_1px_0_rgb(255_255_255/0.55),inset_1px_0_0_var(--game-rim-side),inset_-1px_0_0_rgb(0_0_0/0.28),inset_0_-1px_0_rgb(0_0_0/0.4),0_0_0_1px_var(--game-contour),0_0_0_3px_var(--game-accent-2),var(--game-lift-key),var(--game-glow-armed)]';

/** `.off` keeps the rims and loses the lift, so a disabled key still reads as a key. */
const LIFT_OFF =
  'disabled:shadow-[inset_0_1px_0_var(--game-rim-light),inset_1px_0_0_var(--game-rim-side),inset_-1px_0_0_rgb(0_0_0/0.28),inset_0_-1px_0_var(--game-rim-dark),0_0_0_1px_var(--game-contour)] disabled:translate-y-0 disabled:opacity-[0.38]';

/**
 * The destructive key: a warning body with a dark label, not `--game-danger`.
 *
 * The danger token is a figure's colour — a number that has gone wrong — and a key wearing it
 * would be the one control on screen the same colour as an alarm. This is the amber key beside
 * the switch, which is what a demolish button is.
 */
export const RAISE_DANGER_BODY =
  'bg-[image:var(--game-gloss-lit),linear-gradient(180deg,var(--game-warning),var(--game-warning-deep))] font-bold text-[oklch(0.2_0.04_60)] [text-shadow:none] hover:bg-[image:var(--game-gloss-lit),linear-gradient(180deg,var(--game-warning),var(--game-warning-deep))]';

export interface RaiseState {
  /** A state that persists: the panel is open, the speed is this one, snap is on. */
  on?: boolean;
  /** What the next click on the park does. Exactly one of these exists at a time. */
  armed?: boolean;
  /** The one key that destroys something. */
  danger?: boolean;
}

/**
 * The RAISE recipe for one control.
 *
 * Exactly one body class is emitted, because two `bg-[image:…]` utilities on one element are a
 * question about stylesheet order rather than about class order.
 */
export function raise(state: RaiseState = {}): string {
  const lift = state.on
    ? state.armed
      ? LIFT_ON_ARMED
      : LIFT_ON
    : state.armed
      ? LIFT_ARMED
      : LIFT_IDLE;
  const body = state.danger ? RAISE_DANGER_BODY : state.on ? RAISE_ON_BODY : RAISE_HOVER;
  return [RAISE_BODY, body, RAISE_PRESS, lift, LIFT_OFF, 'disabled:cursor-not-allowed'].join(' ');
}

/** RAISE in its resting state, for anything that is not a button and never lights up. */
export const RAISE = raise();

// ── SINK: a recessed readout. Never a control. ────────────────────────────────────────────
export const SINK =
  'rounded-(--game-radius-well) bg-[image:linear-gradient(180deg,rgb(0_0_0/0.34),rgb(0_0_0/0.14))] shadow-(--game-sink)';

/**
 * SINK, but the ground a picture stands on: a lit stage, never a dark hole.
 *
 * A thumbnail rendered from an unlit mesh is frequently dark. On `--game-hud-well` a wooden
 * coaster loses its track and a top spin loses its supports; on the stage both read.
 */
export const SINK_STAGE =
  'rounded-(--game-radius-well) bg-[image:var(--game-stage)] shadow-(--game-sink)';

// ── TRAY and PANEL: the two grades of floating surface ────────────────────────────────────
/**
 * The chrome clusters — clock, figures, rail, a notice.
 *
 * A tray gets the sheen band rather than the key's gloss: a 52 % highlight on a 1000 px surface
 * reads as a rendering mistake, not as plastic.
 */
export const TRAY =
  'rounded-(--game-hud-radius) bg-(--game-hud) bg-[image:var(--game-sheen)] shadow-[inset_0_1px_0_rgb(255_255_255/0.28),inset_0_-1px_0_rgb(0_0_0/0.5),inset_1px_0_0_rgb(255_255_255/0.07),inset_-1px_0_0_rgb(0_0_0/0.25),0_0_0_1px_var(--game-contour),var(--game-lift-tray)] backdrop-blur-[24px] backdrop-saturate-[1.25]';

/**
 * A panel body: the solid grade, and the one that stands off the park on 44 px of shadow travel.
 *
 * A panel is forty rows of small type in a muted colour, and at the tray's 0.80 over a noon sky
 * the second line of a row is the same problem the park page's entry tiles had — the label clears
 * AA and the hint does not.
 */
export const PANEL =
  'rounded-(--game-hud-radius) bg-(--game-hud-strong) bg-[image:var(--game-sheen),linear-gradient(180deg,rgb(255_255_255/0.05),transparent_180px)] shadow-[inset_0_1px_0_rgb(255_255_255/0.28),inset_0_-1px_0_rgb(0_0_0/0.5),inset_1px_0_0_rgb(255_255_255/0.07),inset_-1px_0_0_rgb(0_0_0/0.25),0_0_0_1px_var(--game-contour),var(--game-lift-panel)] backdrop-blur-[28px] backdrop-saturate-[1.3]';

/** A panel's own 40 px raised strip: lighter than the body, with a hard shadow under it. */
export const PANEL_HEAD =
  'bg-[image:var(--game-gloss),linear-gradient(180deg,oklch(0.30_0.04_246),oklch(0.24_0.038_247))] shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_1px_0_rgb(0_0_0/0.55)]';

// ── the build tray's tab strip, for `tools` ───────────────────────────────────────────────
/** The trough the tabs stand in, along the tray's bottom edge. */
export const TAB_TROUGH =
  'rounded-b-(--game-hud-radius) bg-[image:linear-gradient(180deg,rgb(0_0_0/0.34),rgb(0_0_0/0.16))] shadow-[inset_0_2px_5px_rgb(0_0_0/0.5)]';

/**
 * The active tab.
 *
 * It grows UPWARD by `--game-tab-lip` into the palette's bottom padding while the strip's own row
 * height stays 36, so the tab eats the trough's top edge and merges into the palette above it.
 * The 8 px is an overlap and not a control height.
 */
export const TAB_ACTIVE =
  'bg-[image:var(--game-gloss-lit),linear-gradient(180deg,var(--game-accent-lit),var(--game-accent-deep))] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.5),inset_-1px_0_0_rgb(0_0_0/0.28),inset_1px_0_0_rgb(255_255_255/0.1),0_0_0_2px_oklch(0.75_0.14_242/0.32),0_-6px_16px_-4px_oklch(0.7_0.15_242/0.7)]';

// ── the small pieces ──────────────────────────────────────────────────────────────────────
/** A separator between two groups of keys. One dark line with a light one beside it. */
export const BELT_RULE = 'w-px shrink-0 bg-black/50 shadow-[1px_0_0_rgb(255_255_255/0.07)]';

/**
 * The rule that runs from a section's label to the right edge.
 *
 * Two lines rather than one: a hairline on a translucent body disappears over a bright sky, and
 * the dark line under it is what holds it there.
 */
export const HAIRLINE = 'h-px flex-1 bg-white/10 shadow-[0_1px_0_rgb(0_0_0/0.35)]';

/**
 * A 9.5 px uppercase micro-label. Never white/.45, which measured 4.12:1 on rendered pixels.
 *
 * It is the same string as {@link HUD_LABEL}; both names exist because a section head and a
 * tile's caption are the same type at two jobs, and `tools` asks for it by the second name.
 */
export const MICRO_LABEL =
  'text-[9.5px] font-semibold tracking-[0.10em] text-white/58 uppercase select-none';

/**
 * The band a figure's label sits on, inside a SUNK tile.
 *
 * A 9.5 px label floating on a translucent tray is at the mercy of whatever sky is behind it. On
 * its own darker band it measured 6.88:1 with a blown-out cloud directly behind, and the band is
 * what makes the four figures read as one instrument panel rather than as four captions.
 */
export const LABEL_BAND =
  'bg-black/34 shadow-[inset_0_1px_0_rgb(0_0_0/0.35)] text-[9.5px] leading-none font-semibold tracking-[0.10em] text-white/62 uppercase select-none';

/** A meter's track: 11 px of groove, up from 6. A 6 px bar under this bevel is a scratch. */
export const GROOVE =
  'h-[11px] overflow-hidden rounded-full bg-[image:linear-gradient(180deg,rgb(0_0_0/0.34),rgb(0_0_0/0.14))] shadow-(--game-sink)';

/**
 * The lit fill inside it. The tone brings the colour; this brings the light on top of it.
 *
 * Rounded on the RIGHT only. The groove's own `overflow-hidden` gives the left end its round, and
 * a fill that rounds both ends draws a pill: at a 4 % fraction — a ride with five people in the
 * queue — an 11 px groove with a 17 px pill in it is a slider with a knob, which is a control, on
 * a surface whose whole job is to be a readout. Measured on the ride list, where every quiet ride
 * had one.
 */
export const GROOVE_FILL =
  'h-full rounded-r-full bg-[image:linear-gradient(180deg,rgb(255_255_255/0.3),rgb(255_255_255/0)_52%,rgb(0_0_0/0.18))]';

// ── the names the rest of the HUD asks for ────────────────────────────────────────────────
/** Chrome fill for the small clusters: clock, figures, the rail, a notice. */
export const HUD_CHIP = TRAY;

/** The solid grade, for anything with a paragraph or a table on it. */
export const HUD_PANEL = PANEL;

/**
 * A row inside a panel's list.
 *
 * Flat on purpose: it is neither a key nor a readout, and raising forty of them would make a list
 * look like a keyboard. The hover step is deliberately small; a list is not a menu.
 */
export const HUD_ROW =
  'rounded-(--game-radius-well) bg-white/[0.035] shadow-[inset_0_1px_0_rgb(255_255_255/0.06),inset_0_0_0_1px_rgb(0_0_0/0.25)] transition-colors hover:bg-white/[0.08]';

/** The selected row of a list. */
export const HUD_ROW_ACTIVE =
  'rounded-(--game-radius-well) bg-(--game-accent)/15 shadow-[inset_0_1px_0_rgb(255_255_255/0.12),inset_0_0_0_1px_var(--game-accent)] transition-colors';

/** A small inset block: a figure with its label, a meter's track, a code. */
export const HUD_WELL = SINK;

/** Section label above a group of rows. */
export const HUD_LABEL = MICRO_LABEL;

/** The muted body colour inside game glass. */
export const HUD_MUTED = 'text-white/72';

/** A value that sits ON the plastic rather than in it. */
export const HUD_VALUE =
  'font-semibold text-white/95 tabular-nums [text-shadow:var(--game-emboss)]';

/**
 * The two veils, and they are shorter than they were: 144 -> 112 px at the top, 240 -> 176 at the
 * bottom, each about a fifth lighter.
 *
 * They exist for the gap BETWEEN two surfaces, which is where a backdrop blur does nothing — and
 * the moulded trays carry far more of their own contrast than the flat chrome they replaced, so
 * the veil under them was doing a job twice. At 1280 x 720 the pair covered 14.6 % of the frame
 * on their own; a quarter of a park's sky was being dimmed for a row of chips.
 */
export const SCRIM_TOP =
  'pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/26 via-black/8 to-transparent';

export const SCRIM_BOTTOM =
  'pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/34 via-black/10 to-transparent';

/**
 * Tone → colour, for a status dot, a meter fill and a figure that has gone wrong.
 *
 * Four tones and no more: a park HUD that needs a fifth is a HUD whose reader has to learn a
 * legend. `good` is the accent's warmer sibling so a healthy figure does not read as an
 * interactive control — which matters more now that a control is a moulded key and a figure is a
 * groove.
 */
export const TONE_TEXT: Record<'neutral' | 'good' | 'warn' | 'bad', string> = {
  neutral: 'text-white/95',
  good: 'text-(--game-good)',
  warn: 'text-(--game-warning)',
  bad: 'text-(--game-danger)',
};

export const TONE_FILL: Record<'neutral' | 'good' | 'warn' | 'bad', string> = {
  neutral: 'bg-white/55 shadow-[0_0_8px_-1px_rgb(255_255_255/0.4)]',
  good: 'bg-(--game-good) shadow-[0_0_8px_-1px_oklch(0.82_0.15_155/0.6)]',
  warn: 'bg-(--game-warning) shadow-[0_0_8px_-1px_oklch(0.8_0.16_80/0.6)]',
  bad: 'bg-(--game-danger) shadow-[0_0_8px_-1px_oklch(0.72_0.18_25/0.6)]',
};

export const TONE_DOT: Record<'neutral' | 'good' | 'warn' | 'bad', string> = {
  neutral: 'bg-white/45',
  good: 'bg-(--game-good) shadow-[0_0_8px_var(--game-good)]',
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
