/**
 * Hex-grid math for the Queue Tactics board.
 *
 * Layout mirrors Teamfight Tactics (researched reference: TFT uses a 7-column
 * × 8-row pointy-top hex board with 4 rows per player, odd rows shifted
 * right — "odd-r offset" coordinates).
 *
 * Global board: col 0..6, row 0..7. Player 1 owns rows 0..3 (row 3 is their
 * front line), player 2 owns rows 4..7 (row 4 is their front line).
 *
 * The two halves are 180°-point-symmetric: rotating (col,row) →
 * (6-col, 7-row) maps the grid exactly onto itself (odd-r parity flips with
 * the row, which the rotation preserves). This is what makes a mirror match
 * perfectly symmetric — and therefore an exact draw in an RNG-free combat.
 */

export const BOARD_COLS = 7;
export const BOARD_ROWS = 8;
export const HALF_ROWS = 4;
export const BENCH_SLOTS = 9;

export interface Hex {
  col: number;
  row: number;
}

export function hexKey(h: Hex): string {
  return `${h.col},${h.row}`;
}

export function parseHexKey(key: string): Hex {
  const [c, r] = key.split(',').map(Number);
  return { col: c, row: r };
}

export function inBoard(h: Hex): boolean {
  return h.col >= 0 && h.col < BOARD_COLS && h.row >= 0 && h.row < BOARD_ROWS;
}

/** 180° rotation mapping a player-2-local hex into global coordinates. */
export function rotate180(h: Hex): Hex {
  return { col: BOARD_COLS - 1 - h.col, row: BOARD_ROWS - 1 - h.row };
}

/** odd-r offset → cube coordinates (for distance math). */
function toCube(h: Hex): [number, number, number] {
  const q = h.col - (h.row - (h.row & 1)) / 2;
  const r = h.row;
  return [q, r, -q - r];
}

/** True hex distance between two cells. */
export function hexDistance(a: Hex, b: Hex): number {
  const [aq, ar, as] = toCube(a);
  const [bq, br, bs] = toCube(b);
  return Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs(as - bs));
}

/**
 * Neighbour offsets for odd-r: [even-row set, odd-row set].
 *
 * IMPORTANT: the odd-row list is the NEGATED even-row list in the SAME order
 * (odd[i] === -even[i]). A 180° rotation flips row parity and negates the
 * offset, so this makes the priority order used for movement tie-breaks
 * point-symmetric — required for the mirror-match-is-an-exact-draw gate.
 */
const NEIGHBOURS: [number, number][][] = [
  [
    [1, 0],
    [0, -1],
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
  ],
  [
    [-1, 0],
    [0, 1],
    [1, 1],
    [1, 0],
    [1, -1],
    [0, -1],
  ],
];

/** In-board neighbours of a hex, in a stable deterministic order. */
export function hexNeighbours(h: Hex): Hex[] {
  const set = NEIGHBOURS[h.row & 1];
  const out: Hex[] = [];
  for (const [dc, dr] of set) {
    const n = { col: h.col + dc, row: h.row + dr };
    if (inBoard(n)) out.push(n);
  }
  return out;
}

/**
 * World-space position of a hex centre (pointy-top, unit spacing 1).
 * x grows with col (odd rows shifted +0.5), z grows with row.
 * Used by both the renderer and any spatial reasoning that needs it.
 */
export function hexToWorld(h: Hex, spacing = 1): { x: number; z: number } {
  const x = (h.col + 0.5 * (h.row & 1) - (BOARD_COLS - 1) / 2 - 0.25) * spacing;
  const z = (h.row - (BOARD_ROWS - 1) / 2) * spacing * 0.866; // sqrt(3)/2 row pitch
  return { x, z };
}
