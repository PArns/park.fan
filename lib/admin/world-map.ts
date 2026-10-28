/**
 * The pure half of the admin's world maps (`app/admin/traffic`): how strongly a country is shaded
 * and where on the map a country sits. The paths come from `public/world.svg`, read in the browser
 * by `useCountryPaths`.
 */

/**
 * How strongly a country is shaded, as the percentage of the brand colour in its fill: 0 for none,
 * then 18 to 90 by its share of the biggest raised to `exponent`. The default square root keeps a
 * window's long tail apart, or Germany would leave every other country the same pale shade; the
 * live map passes 1, since there the brightest country has to be the busiest one, and a large
 * country in a middling shade outweighs a small one in a bright one.
 */
export function countryShadePercent(count: number, max: number, exponent = 0.5): number {
  if (count <= 0 || max <= 0) return 0;
  return Math.round(18 + Math.min(1, count / max) ** exponent * 72);
}

/** A closed outline of a path: its area and the point a marker on it is drawn at. */
export interface PathRing {
  area: number;
  x: number;
  y: number;
}

const PATH_TOKEN = /[MmLlHhVvZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

/** The area and centroid of one outline, the centre of its box when it has no area to speak of. */
function ringOf(points: readonly [number, number][]): PathRing | null {
  if (points.length === 0) return null;
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % points.length];
    const cross = x0 * y1 - x1 * y0;
    twiceArea += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  const area = Math.abs(twiceArea) / 2;
  if (area > 1e-6) return { area, x: cx / (3 * twiceArea), y: cy / (3 * twiceArea) };
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    area: 0,
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
}

/**
 * The largest outline of an SVG path (`M`, `L`, `H`, `V`, `Z` in both cases, which is all
 * `public/world.svg` uses), so a marker for the United States lands on the mainland and not between
 * it and Alaska. `null` for a path without points.
 */
export function largestRing(d: string): PathRing | null {
  const tokens = d.match(PATH_TOKEN) ?? [];
  const rings: [number, number][][] = [];
  let ring: [number, number][] = [];
  let command = 'M';
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let i = 0;

  const close = () => {
    if (ring.length > 0) rings.push(ring);
    ring = [];
  };
  const number = () => Number(tokens[i++]);

  while (i < tokens.length) {
    const token = tokens[i];
    if (/^[A-Za-z]$/.test(token)) {
      command = token;
      i++;
      if (command === 'Z' || command === 'z') {
        close();
        x = startX;
        y = startY;
      }
      continue;
    }
    switch (command) {
      case 'M':
      case 'm': {
        close();
        const dx = number();
        const dy = number();
        x = command === 'm' ? x + dx : dx;
        y = command === 'm' ? y + dy : dy;
        startX = x;
        startY = y;
        ring.push([x, y]);
        // Pairs after a moveto are lines, in the moveto's own case.
        command = command === 'm' ? 'l' : 'L';
        break;
      }
      case 'L':
        x = number();
        y = number();
        ring.push([x, y]);
        break;
      case 'l':
        x += number();
        y += number();
        ring.push([x, y]);
        break;
      case 'H':
        x = number();
        ring.push([x, y]);
        break;
      case 'h':
        x += number();
        ring.push([x, y]);
        break;
      case 'V':
        y = number();
        ring.push([x, y]);
        break;
      case 'v':
        y += number();
        ring.push([x, y]);
        break;
      default:
        i++;
    }
  }
  close();

  let best: PathRing | null = null;
  for (const points of rings) {
    const candidate = ringOf(points);
    if (candidate && (!best || candidate.area > best.area)) best = candidate;
  }
  return best;
}
