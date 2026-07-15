/**
 * Shared park.fan marker icon (the map-pin logo) for dynamically rendered OG
 * images. Satori — the renderer behind `next/og` — decodes raster PNGs
 * reliably, so we point at the dark logo variant via an absolute URL, the same
 * pattern the HOME OG card and its background images already use.
 *
 * The aspect ratio is pinned to the source asset (`logo-dark.png`, 569×683 ≈
 * 0.833) so every caller only passes a height and always gets an undistorted
 * mark. Reused across all three OG renderers (park/geo route, blog, glossary)
 * so the logo is defined in exactly one place.
 */
const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://park.fan';
const MARKER_RATIO = 569 / 683; // ≈ 0.833 (width / height of logo-dark.png)
const WORDMARK_RATIO = 768 / 219; // ≈ 3.507 (width / height of parkfan-dark.png)

export function OgBrandMark({ height }: { height: number }) {
  const width = Math.round(height * MARKER_RATIO);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${SITE_URL}/logo-dark.png`}
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
        src={`${SITE_URL}/parkfan-dark.png`}
        alt="park.fan"
        width={wordmarkWidth}
        height={wordmarkHeight}
        style={{ width: wordmarkWidth, height: wordmarkHeight }}
      />
    </div>
  );
}
