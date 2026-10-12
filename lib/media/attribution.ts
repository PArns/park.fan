import { MEDIA_ATTRIBUTION } from './manifest-attribution';

/**
 * The on-image credit of a photo, looked up by the path a component already paints.
 *
 * Client-safe, like `@/lib/media/hero`: `manifest-attribution.ts` lists only the photos that need
 * a credit (`needsAttribution` in `./credit`), a handful of rows, so `PhotoCredit` can ask with
 * nothing but a `src` and no caller has to thread a credit prop from the server. A photo that is
 * not in the table, or not in the media database at all, answers `null`.
 */

/** What a photo's credit badge shows, and where the line may link to. */
export interface PhotoAttribution {
  /** `getCreditLine()` output, e.g. `© 2016 Alex234 (CC0 1.0)`. */
  line: string;
  /** The page the photo came from, when the sidecar records one. */
  url: string | null;
}

/** One generated row: the photo's source path and its crops, which share one credit. */
export interface PhotoAttributionEntry extends PhotoAttribution {
  paths: readonly string[];
}

let byPath: Map<string, PhotoAttribution> | null = null;

/**
 * The credit for a media path (`/media/heide-park/colossos-feuerfigur-16x9.jpg?v=…`), or `null`
 * when the photo is our own, uncredited or not a database image. The table lists every crop by
 * name, so a crop needs no suffix stripping, only the `?v=` query.
 */
export function getPhotoAttribution(src: string | null | undefined): PhotoAttribution | null {
  if (!src) return null;
  byPath ??= new Map(
    MEDIA_ATTRIBUTION.flatMap(({ paths, line, url }) =>
      paths.map((path) => [path, { line, url }] as const)
    )
  );
  return byPath.get(src.split('?')[0]) ?? null;
}
