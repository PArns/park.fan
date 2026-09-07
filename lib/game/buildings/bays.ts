/**
 * The facade pattern language, and nothing else. Pure, node-safe, and the one part of this module a
 * `selftest` can hold to an exact number.
 *
 * A facade is written as a string of bay codes, one character per bay:
 *
 *   `"w d w"`      three bays: window, door, window. Exactly three, whatever the wall is.
 *   `"w* D w*"`    a grand door in the middle and as many windows either side as the wall affords.
 *   `"a*"`         an arcade of round-headed arches, as many as fit.
 *   `"w d w / w*"` ground floor, then every storey above it. The last pattern repeats upward.
 *
 * `*` marks a **flexible** group: the bay count comes from the wall's width over the style's bay
 * module, and the flexible groups absorb whatever is left after the fixed bays are placed. That is
 * what lets one blueprint sit on a 14 m frontage and a 34 m one and stay a building both times
 * instead of stretching three windows across a cinema screen.
 *
 * Spaces are ignored, so a pattern can be written with them for legibility.
 *
 * **The remainder goes to the outer groups first.** With two flexible groups either side of a door
 * and five bays to give away, 3 + 2 would put the door off centre by half a bay; the split here is
 * as even as the arithmetic allows and biased outwards, so an odd remainder widens the ends of the
 * facade rather than shoving its middle sideways.
 */

import type { BayCode } from './types';

const CODES = 'swtaodDgvnp';

export interface BayToken {
  code: BayCode;
  flexible: boolean;
}

export interface BayPlan {
  /** One entry per bay, left to right along the facade. */
  bays: BayCode[];
  /** Width of one bay, metres. */
  width: number;
}

export function isBayCode(c: string): c is BayCode {
  return CODES.includes(c);
}

/** Parse a pattern into tokens. Unknown characters are dropped rather than throwing. */
export function parsePattern(pattern: string): BayToken[] {
  const out: BayToken[] = [];
  const text = pattern.replace(/\s+/g, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (!isBayCode(c)) continue;
    const flexible = text[i + 1] === '*';
    if (flexible) i += 1;
    out.push({ code: c, flexible });
  }
  return out;
}

/** Split a multi-storey pattern (`"ground / upper"`) into one pattern per storey index. */
export function storeyPatterns(pattern: string): string[] {
  const parts = pattern.split('/');
  return parts.length ? parts : [pattern];
}

/** The pattern for storey `index`; the last one repeats upward. */
export function patternForStorey(pattern: string, index: number): string {
  const parts = storeyPatterns(pattern);
  return parts[Math.min(index, parts.length - 1)] ?? '';
}

/**
 * Lay a pattern out along a wall.
 *
 * `targetBay` is the style's bay module in metres — how wide a bay wants to be. The number of bays
 * is a whole number, so the real width is the wall over that count and lands within about 25 % of
 * the target; a wall too narrow for the fixed bays gets them anyway, squeezed, because dropping a
 * door because the wall is short is worse than a narrow door.
 */
export function planBays(width: number, pattern: string, targetBay: number): BayPlan {
  const tokens = parsePattern(pattern);
  if (!tokens.length) return { bays: [], width };
  const flex = tokens.filter((t) => t.flexible).length;
  const wanted = Math.max(1, Math.round(width / Math.max(0.5, targetBay)));
  const total = flex === 0 ? tokens.length : Math.max(tokens.length, wanted);
  let extra = total - tokens.length;

  // Hand the remainder out to the flexible groups from the outside in, so an odd bay lands at the
  // end of the facade rather than beside the door.
  const share = new Array<number>(tokens.length).fill(0);
  const flexIndices: number[] = [];
  tokens.forEach((t, i) => {
    if (t.flexible) flexIndices.push(i);
  });
  const ordered = orderOutwards(flexIndices);
  let cursor = 0;
  while (extra > 0 && ordered.length) {
    share[ordered[cursor % ordered.length]] += 1;
    cursor += 1;
    extra -= 1;
  }

  const bays: BayCode[] = [];
  tokens.forEach((t, i) => {
    const count = 1 + share[i];
    for (let k = 0; k < count; k++) bays.push(t.code);
  });
  return { bays, width: width / Math.max(1, bays.length) };
}

/** `[0, 1, 2, 3]` → `[0, 3, 1, 2]`: outermost first, then inwards. */
function orderOutwards(indices: number[]): number[] {
  const out: number[] = [];
  let lo = 0;
  let hi = indices.length - 1;
  while (lo <= hi) {
    if (lo === hi) out.push(indices[lo]);
    else {
      out.push(indices[lo]);
      out.push(indices[hi]);
    }
    lo += 1;
    hi -= 1;
  }
  return out;
}
