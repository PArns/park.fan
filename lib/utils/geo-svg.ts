import fs from 'fs';
import path from 'path';

/** One `<path>` from `public/world.svg`. */
interface StartPath {
  id: string | null; // ISO Code
  name: string | null; // Country Name
  cssClass: string | null; // often the country name
  d: string; // Path data
}

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

let cachedPaths: StartPath[] | null = null;

/** Loads and parses `public/world.svg` once per process. */
function getStartPaths(): StartPath[] {
  if (cachedPaths) return cachedPaths;

  try {
    const svgPath = path.join(process.cwd(), 'public', 'world.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf-8');

    const paths: StartPath[] = [];

    const pathRegex = /<path\s+([^>]+)>/g;
    let match;

    while ((match = pathRegex.exec(svgContent)) !== null) {
      const attributes = match[1];

      const idMatch = attributes.match(/id=["']([^"']+)["']/);
      const dMatch = attributes.match(/d=["']([^"']+)["']/);
      const nameMatch = attributes.match(/name=["']([^"']+)["']/);
      const classMatch = attributes.match(/class=["']([^"']+)["']/);

      if (dMatch) {
        paths.push({
          id: idMatch ? idMatch[1] : null,
          name: nameMatch ? nameMatch[1] : null,
          cssClass: classMatch ? classMatch[1] : null,
          d: dMatch[1],
        });
      }
    }

    cachedPaths = paths;
    return paths;
  } catch (error) {
    console.error('Error loading world.svg:', error);
    return [];
  }
}

/**
 * Bounding box of an SVG path string, for the absolute and relative M, L, H, V and Z commands
 * only: world.svg has no curves.
 */
function calculatePathBBox(d: string): BBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  let currentX = 0;
  let currentY = 0;

  const tokens = d.match(/([MmLlHhVvZz])|([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/g);

  if (!tokens || tokens.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
  }

  let currentCmd = 'M';
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (/^[MmLlHhVvZz]$/.test(token)) {
      currentCmd = token;
      i++;

      if (currentCmd === 'Z' || currentCmd === 'z') {
        continue;
      }
    }

    // Per the SVG spec, extra coordinate pairs after `M` are `L` (and after `m`, `l`).
    const nextNum = () => {
      const val = parseFloat(tokens[i]);
      i++;
      return val;
    };

    let targetCmd = currentCmd;
    if (currentCmd === 'M' && i > 1 && !/^[MmLlHhVvZz]$/.test(tokens[i - 1])) targetCmd = 'L';
    if (currentCmd === 'm' && i > 1 && !/^[MmLlHhVvZz]$/.test(tokens[i - 1])) targetCmd = 'l';

    switch (targetCmd) {
      case 'M': // Absolute Move x y
      case 'L': // Absolute Line x y
        if (i + 1 < tokens.length) {
          const x = nextNum();
          const y = nextNum();
          if (!isNaN(x)) currentX = x;
          if (!isNaN(y)) currentY = y;
        }
        break;

      case 'm': // Relative Move dx dy
      case 'l': // Relative Line dx dy
        if (i + 1 < tokens.length) {
          const dx = nextNum();
          const dy = nextNum();
          if (!isNaN(dx)) currentX += dx;
          if (!isNaN(dy)) currentY += dy;
        }
        break;

      case 'H': // Absolute Horizontal x
        const x = nextNum();
        if (!isNaN(x)) currentX = x;
        break;

      case 'h': // Relative Horizontal dx
        const dx = nextNum();
        if (!isNaN(dx)) currentX += dx;
        break;

      case 'V': // Absolute Vertical y
        const y = nextNum();
        if (!isNaN(y)) currentY = y;
        break;

      case 'v': // Relative Vertical dy
        const dy = nextNum();
        if (!isNaN(dy)) currentY += dy;
        break;

      default:
        i++;
        break;
    }

    if (currentX < minX) minX = currentX;
    if (currentX > maxX) maxX = currentX;
    if (currentY < minY) minY = currentY;
    if (currentY > maxY) maxY = currentY;
  }

  if (minX === Infinity) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * The viewBox and paths for a set of countries, matched by ISO code, name or class, for the OG
 * image's map.
 */
export function getRegionGeoSVG(identifiers: string[]) {
  const allPaths = getStartPaths();

  const targets = identifiers.map((i) => i.toLowerCase());

  const selectedPaths = allPaths.filter((p) => {
    const idMatch = p.id && targets.includes(p.id.toLowerCase());
    const nameMatch = p.name && targets.includes(p.name.toLowerCase());
    const classMatch = p.cssClass && targets.includes(p.cssClass.toLowerCase());

    return idMatch || nameMatch || classMatch;
  });

  if (selectedPaths.length === 0) return null;

  const pathStats = selectedPaths.map((p) => {
    const bbox = calculatePathBBox(p.d);
    const area = bbox.width * bbox.height;
    return { p, bbox, area };
  });

  const maxArea = Math.max(...pathStats.map((s) => s.area));

  // Drop far-off specks (Svalbard, the Canaries) under 5 % of the largest shape, or they stretch
  // the viewBox around empty sea.
  const interestingPaths =
    pathStats.length > 1 ? pathStats.filter((s) => s.area > maxArea * 0.05) : pathStats;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const pathsToMeasure =
    interestingPaths.length > 0 ? interestingPaths.map((s) => s.p) : selectedPaths;

  pathsToMeasure.forEach((p) => {
    const bounds = calculatePathBBox(p.d);
    if (bounds) {
      minX = Math.min(minX, bounds.minX);
      minY = Math.min(minY, bounds.minY);
      maxX = Math.max(maxX, bounds.maxX);
      maxY = Math.max(maxY, bounds.maxY);
    }
  });

  // Nothing measurable: fall back to the whole world.
  if (minX === Infinity) {
    minX = 0;
    minY = 0;
    maxX = 1009.6727;
    maxY = 665.96301;
  }

  const paddingX = (maxX - minX) * 0.05;
  const paddingY = (maxY - minY) * 0.05;
  minX -= paddingX;
  minY -= paddingY;
  maxX += paddingX;
  maxY += paddingY;

  const width = maxX - minX;
  const height = maxY - minY;

  // No aspect-ratio enforcement: the tightest box, positioned by the consumer's
  // `preserveAspectRatio`.
  const viewBox = `${minX} ${minY} ${width} ${height}`;

  return {
    viewBox,
    paths: selectedPaths.map((p) => ({ d: p.d, id: p.id || p.name || 'path' })),
  };
}
