/**
 * Build-time crop geometry, the one place that decides how big `<name>-16x9.jpg` is. Plain JS, so
 * `scripts/generate-image-crops.mjs` cuts the files with it and the runtime states their
 * dimensions with it: the crops are regenerated on every build and cannot be measured at render
 * time, and a second copy of the formula would let the reserved box drift from the image.
 */

/** Google's recommended structured-data aspect ratios, widest-first. */
export const CROP_ASPECTS = [
  { name: '16x9', w: 16, h: 9 },
  { name: '4x3', w: 4, h: 3 },
  { name: '1x1', w: 1, h: 1 },
];

/** Matches the ratio suffix on a crop's BASENAME (no extension), e.g. `taron-16x9`. */
export const ASPECT_SUFFIX_RE = /-(?:16x9|4x3|1x1)$/;

/** Matches the ratio suffix on a full path, capturing the ratio and the extension. */
const PATH_SUFFIX_RE = /-(16x9|4x3|1x1)(\.[A-Za-z0-9]+)$/;

/**
 * Largest crop box for a target ratio that fits inside WxH without upscaling.
 *
 * Never enlarges: a 4:3 source asked for 16:9 keeps its full width and loses height, and asked
 * for 1:1 keeps its full height and loses width. That asymmetry is why the answer cannot be
 * guessed from the ratio alone — it depends on which side of the target the source sits.
 */
export function cropBox(width, height, ratioW, ratioH) {
  const target = ratioW / ratioH;
  const source = width / height;
  if (source > target) return { w: Math.round(height * target), h: height };
  return { w: width, h: Math.round(width / target) };
}

/**
 * The ratio suffix of a public path, or null when it is not a crop.
 *
 * `/media/phantasialand/taron-16x9.jpg` → `'16x9'`, `/media/phantasialand/taron.jpg` → `null`.
 */
export function cropSuffixForPath(src) {
  if (typeof src !== 'string') return null;
  const match = src.split('?')[0].match(PATH_SUFFIX_RE);
  return match ? match[1] : null;
}

/**
 * Dimensions of the crop a public path names, given its SOURCE image's dimensions.
 *
 * Returns null when the path is not a crop, or when the ratio is not one this pipeline cuts —
 * callers then fall back to the source's own dimensions, or to none at all.
 */
export function cropDimensionsForPath(src, sourceWidth, sourceHeight) {
  if (!sourceWidth || !sourceHeight) return null;
  const suffix = cropSuffixForPath(src);
  if (!suffix) return null;
  const aspect = CROP_ASPECTS.find((a) => a.name === suffix);
  if (!aspect) return null;
  const box = cropBox(sourceWidth, sourceHeight, aspect.w, aspect.h);
  return { width: box.w, height: box.h };
}
