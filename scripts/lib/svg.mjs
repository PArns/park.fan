/**
 * The `viewBox` of an SVG source as numbers; throws when there is none, because every measurement
 * the brand generators take is in its units.
 *
 * @param {string} svg
 * @param {string} file named in the error
 * @returns {{ x: number, y: number, w: number, h: number }}
 */
export function viewBoxOf(svg, file) {
  const match = svg.match(/viewBox="([\d.\s-]+)"/);
  if (!match) throw new Error(`${file}: no viewBox`);
  const [x, y, w, h] = match[1].trim().split(/\s+/).map(Number);
  return { x, y, w, h };
}
