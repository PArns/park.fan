import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Shared park.fan marker icon (the map-pin logo) for dynamically rendered OG
 * images. Satori — the renderer behind `next/og` — decodes raster PNGs
 * reliably, so we hand it the dark logo variant.
 *
 * The assets are read off the deployment's own filesystem and inlined as data
 * URIs. They used to be referenced by absolute URL (`https://park.fan/logo-dark.png`),
 * which meant Satori fetched BOTH brand PNGs over the public internet — through
 * Cloudflare, through Vercel's CDN — on every single OG render. At ~9.5k renders
 * a day that was 63.7 KB + 13.9 KB each time: 734 MB/day, ~18% of the site's
 * entire Fast Data Transfer, spent re-downloading two files that ship inside the
 * bundle anyway. (They were served `max-age=0, must-revalidate`, so every fetch
 * was a full CDN miss.) Reading them locally removes that traffic entirely — and
 * removes two network round-trips from OG render latency.
 *
 * Requires the PNGs to be traced into the function bundle — see
 * `outputFileTracingIncludes` for `/api/og/[...path]` in next.config.ts.
 *
 * The aspect ratios are pinned to the source assets (`logo-dark.png` 569×683 ≈
 * 0.833, `parkfan-dark.png` 768×219 ≈ 3.507) so every caller only passes a
 * height and always gets an undistorted mark. Reused across all three OG
 * renderers (park/geo route, blog, glossary) so the logo is defined once.
 */
const MARKER_RATIO = 569 / 683; // ≈ 0.833 (width / height of logo-dark.png)
const WORDMARK_RATIO = 768 / 219; // ≈ 3.507 (width / height of parkfan-dark.png)

/**
 * Read once per warm function instance, not once per render. Lazy rather than
 * module-scope so a missing asset surfaces as a failed OG render instead of
 * breaking module evaluation while the build collects page data.
 */
const dataUriCache = new Map<string, string>();

function brandAssetDataUri(file: string): string {
  const cached = dataUriCache.get(file);
  if (cached) return cached;
  const bytes = readFileSync(join(process.cwd(), 'public', file));
  const dataUri = `data:image/png;base64,${bytes.toString('base64')}`;
  dataUriCache.set(file, dataUri);
  return dataUri;
}

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
