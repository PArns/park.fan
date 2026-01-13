import fs from 'fs';
import path from 'path';

// Define the structure for parsed SVG paths
interface StartPath {
  id: string | null; // ISO Code
  name: string | null; // Country Name
  cssClass: string | null; // Class (often Country Name)
  d: string; // Path data
}

// Bounding Box Interface
interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

let cachedPaths: StartPath[] | null = null;

/**
 * Loads and parses the world.svg file to extract path data.
 */
function getStartPaths(): StartPath[] {
  if (cachedPaths) return cachedPaths;

  try {
    const svgPath = path.join(process.cwd(), 'public', 'world.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf-8');

    const paths: StartPath[] = [];

    // Regex to match <path ... >
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
 * Calculates the bounding box of an SVG path string.
 * Handles absolute/relative Move (M/m), Line (L/l), Horizontal (H/h), Vertical (V/v), and closing (Z/z).
 * Assumes simple paths (no curves) as verified in world.svg.
 */
function calculatePathBBox(d: string): BBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  let currentX = 0;
  let currentY = 0;

  // Tokenize: match commands or numbers
  const tokens = d.match(/([MmLlHhVvZz])|([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/g);

  if (!tokens || tokens.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
  }

  let currentCmd = 'M'; // Default start, though path usually starts with M
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    // Check if token is a command
    if (/^[MmLlHhVvZz]$/.test(token)) {
      currentCmd = token;
      i++;

      // Z command doesn't take arguments
      if (currentCmd === 'Z' || currentCmd === 'z') {
        continue;
      }
    }

    // Process arguments based on currentCmd (or implicit repetition)
    // Note: 'M' implies subsequent 'L', 'm' implies subsequent 'l' according to spec

    // Helper to safely get next number
    const nextNum = () => {
      const val = parseFloat(tokens[i]);
      i++;
      return val;
    };

    let targetCmd = currentCmd;
    if (currentCmd === 'M' && i > 1 && !/^[MmLlHhVvZz]$/.test(tokens[i - 1])) targetCmd = 'L'; // Subsequent M args are L
    if (currentCmd === 'm' && i > 1 && !/^[MmLlHhVvZz]$/.test(tokens[i - 1])) targetCmd = 'l'; // Subsequent m args are l

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
        // Skip unknown or Z
        i++;
        break;
    }

    // Update BBox with current absolute position
    if (currentX < minX) minX = currentX;
    if (currentX > maxX) maxX = currentX;
    if (currentY < minY) minY = currentY;
    if (currentY > maxY) maxY = currentY;
  }

  // Handle case with no valid points found
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
 * Returns the SVG ViewBox and Paths for a given identifier list (ISO codes or Country Names).
 */
export function getRegionGeoSVG(identifiers: string[]) {
  const allPaths = getStartPaths();

  // Clean identifiers for loose matching (optional, but good for names involving spaces)
  const targets = identifiers.map((i) => i.toLowerCase());

  const selectedPaths = allPaths.filter((p) => {
    const idMatch = p.id && targets.includes(p.id.toLowerCase());
    const nameMatch = p.name && targets.includes(p.name.toLowerCase());
    const classMatch = p.cssClass && targets.includes(p.cssClass.toLowerCase());

    return idMatch || nameMatch || classMatch;
  });

  if (selectedPaths.length === 0) return null;

  // Calculate BBoxes for all candidate paths
  const pathStats = selectedPaths.map((p) => {
    const bbox = calculatePathBBox(p.d);
    const area = bbox.width * bbox.height;
    // Diagonal can be a better metric for line-like shapes, but area is okay for countries
    return { p, bbox, area };
  });

  // Find the largest path to use as a reference baseline
  const maxArea = Math.max(...pathStats.map((s) => s.area));

  // Filter out paths that are "noise" (e.g. tiny islands far away, like Svalbard/Canaries vs Mainland)
  // Threshold: Keep paths that are at least 5% of the largest path
  const interestingPaths =
    pathStats.length > 1 ? pathStats.filter((s) => s.area > maxArea * 0.05) : pathStats;

  // 4. Determine viewBox based on remaining paths
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  // Use filtered paths for bounding box unless empty, then fallback to original
  const pathsToMeasure =
    interestingPaths.length > 0 ? interestingPaths.map((s) => s.p) : selectedPaths;

  pathsToMeasure.forEach((p) => {
    const bounds = calculatePathBBox(p.d); // Assuming getPathBounds is calculatePathBBox
    if (bounds) {
      minX = Math.min(minX, bounds.minX);
      minY = Math.min(minY, bounds.minY);
      maxX = Math.max(maxX, bounds.maxX);
      maxY = Math.max(maxY, bounds.maxY);
    }
  });

  // If no valid bounds found (should rare), fallback to world bounds
  if (minX === Infinity) {
    minX = 0;
    minY = 0;
    maxX = 1009.6727;
    maxY = 665.96301;
  }

  // Add padding (5%)
  const paddingX = (maxX - minX) * 0.05;
  const paddingY = (maxY - minY) * 0.05;
  minX -= paddingX;
  minY -= paddingY;
  maxX += paddingX;
  maxY += paddingY;

  const width = maxX - minX;
  const height = maxY - minY;

  // We REMOVED the Aspect Ratio enforcement here.
  // We want the tightest BBox possible.
  // The 'preserveAspectRatio' on the SVG element in the consumer (route.tsx) will handle positioning (e.g. aligning right).

  // We aligned strict padding above (lines 247-252).
  // So minX, minY, width, height now essentially represent the padded SVG area.
  const viewBox = `${minX} ${minY} ${width} ${height}`;

  return {
    viewBox,
    paths: selectedPaths.map((p) => ({ d: p.d, id: p.id || p.name || 'path' })),
  };
}
