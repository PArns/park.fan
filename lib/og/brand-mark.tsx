import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The park.fan marker and wordmark for dynamically rendered OG images, as PNG data URIs read out
 * of `og-assets/` (see `lib/og/background-photo.ts` for why that root matters) rather than URLs
 * Satori would fetch over the internet on every render. The aspect ratios are pinned to the
 * source assets, so callers pass only a height.
 */
const MARKER_RATIO = 569 / 683; // ≈ 0.833 (width / height of logo-dark.png)
const WORDMARK_RATIO = 768 / 219; // ≈ 3.507 (width / height of parkfan-dark.png)

/**
 * Read once per warm function instance, not once per render. Lazy rather than
 * module-scope so a missing asset surfaces as a failed OG render instead of
 * breaking module evaluation while the build collects page data.
 */
const dataUriCache = new Map<string, string>();

/** The two files `scripts/generate-og-assets.mjs` copies. Change one list and change the other. */
type BrandAsset = 'logo-dark.png' | 'parkfan-dark.png';

/**
 * Reads a brand PNG from the OG function's own asset root. The `public/` fallback covers
 * `next dev`, which skips prebuild, and names one literal path per asset on purpose: a path
 * computed from a variable makes the function tracer bundle all of `/public`.
 */
function readBrandAsset(file: BrandAsset): Buffer {
  try {
    return readFileSync(join(process.cwd(), 'og-assets', file));
  } catch {
    /* prebuild has not run — fall through to the copy under public/ */
  }
  return file === 'logo-dark.png'
    ? readFileSync(join(process.cwd(), 'public', 'logo-dark.png'))
    : readFileSync(join(process.cwd(), 'public', 'parkfan-dark.png'));
}

function brandAssetDataUri(file: BrandAsset): string {
  const cached = dataUriCache.get(file);
  if (cached) return cached;
  const dataUri = `data:image/png;base64,${readBrandAsset(file).toString('base64')}`;
  dataUriCache.set(file, dataUri);
  return dataUri;
}

/**
 * The park.fan map-pin marker for OG images, inlined as a data URI at the given height with its
 * width from the logo's aspect ratio.
 */
export function OgBrandMark({ height }: { height: number }) {
  const width = Math.round(height * MARKER_RATIO);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brandAssetDataUri('logo-dark.png')}
      alt=""
      width={width}
      height={height}
      style={{ width, height }}
    />
  );
}

/**
 * Full brand lockup: marker icon + the `park.fan` wordmark asset (dark-bg
 * variant — white "park", blue ".fan"). Uses the real wordmark PNG instead of
 * styled text so the wordmark is never rendered as a flat single-colour word.
 *
 * Proportions mirror the HOME OG card exactly (wordmark ≈ 0.93× marker height,
 * gap ≈ 0.19× marker height), so callers pass only the marker height.
 */
export function OgBrandLockup({ markerHeight }: { markerHeight: number }) {
  const wordmarkHeight = Math.round(markerHeight * (140 / 150));
  const wordmarkWidth = Math.round(wordmarkHeight * WORDMARK_RATIO);
  const gap = Math.round(markerHeight * (28 / 150));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      <OgBrandMark height={markerHeight} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brandAssetDataUri('parkfan-dark.png')}
        alt="park.fan"
        width={wordmarkWidth}
        height={wordmarkHeight}
        style={{ width: wordmarkWidth, height: wordmarkHeight }}
      />
    </div>
  );
}
