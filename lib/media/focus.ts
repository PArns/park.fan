import type { CSSProperties } from 'react';
import { getMediaImageBySrc, getMediaImageForPath } from './index';
import type { MediaFocus, MediaImage } from './types';

/**
 * Applying an image's focal point, in the one place every surface shares.
 *
 * A photo is almost never painted at its own aspect ratio: the ride card crops it
 * wide, the spotlight card crops it tall, the park background crops it to
 * whatever the viewport is. `object-fit: cover` then decides what to throw away,
 * and its default — dead centre — is what cuts the head off the Troy horse in the
 * wide card while leaving it intact in the tall one.
 *
 * The fix is one number pair per image, applied identically everywhere. Cards,
 * ride photos, backgrounds and the build-time crops all read the same `focus`,
 * so tuning an image once fixes it in every rendition instead of per component.
 */

/** CSS `object-position` for an image, defaulting to centre. */
export function objectPositionOf(image: Pick<MediaImage, 'focus'> | null | undefined): string {
  return focusToObjectPosition(image?.focus ?? null);
}

/**
 * CSS `object-position` for a public path — what the cards have to work with.
 *
 * `fallback` is what to use when the image has no focal point set, and it is not
 * `center`: park and ride cards have always framed from the top, and switching
 * every un-tuned photo to centre-crop would silently re-frame the whole catalog.
 * Setting a focal point is what opts an image out of that default.
 *
 * Server-side only in practice — it reads the manifest, which no client bundle
 * should carry. The cards resolve it and hand `CardPhoto` a plain string.
 */
export function objectPositionForSrc(
  src: string | null | undefined,
  fallback: string = '50% 0%'
): string {
  if (!src) return fallback;
  // A pre-cut crop was already cut AROUND the focal point at build time. Offsetting
  // it again in CSS would apply the same correction twice and push the subject back
  // out of frame, so these paint centred — the crop is the framing.
  if (isPreCutCrop(src)) return '50% 50%';
  const image = getMediaImageBySrc(src);
  return image?.focus ? focusToObjectPosition(image.focus) : fallback;
}

/** `…-16x9.jpg` / `-4x3` / `-1x1` — a build-time rendition, not a source image. */
const PRE_CUT_CROP = /-(?:16x9|4x3|1x1)\.[a-z0-9]+$/i;

function isPreCutCrop(src: string): boolean {
  return PRE_CUT_CROP.test(src.split('?')[0]);
}

/**
 * Any media path with its content version attached — including a pre-cut crop.
 *
 * `versionedSrc` needs the image object and only ever versions the source file.
 * Content references (blog `coverImage`, markdown bodies) hold a bare path, often
 * a crop, and those are precisely the files whose bytes get rewritten under an
 * unchanged URL when a focal point moves. Returns the path untouched when it is
 * not a database image, so it is safe to run over arbitrary strings.
 */
export function versionedPath(src: string | null | undefined): string | null {
  if (!src) return null;
  const [path, query] = src.split('?');
  const params = new URLSearchParams(query ?? '');
  if (params.has('v')) return src;
  const image = getMediaImageForPath(path);
  if (!image) return src;
  // Appended, not substituted: a markdown image carries its layout in the query
  // (`?align=wide`), and replacing that with the version token would silently
  // re-flow the article while fixing its cache.
  params.set('v', image.version);
  return `${path}?${params.toString()}`;
}

/** CSS `object-position` for a focal point, defaulting to centre. */
export function focusToObjectPosition(focus: MediaFocus | null | undefined): string {
  if (!focus) return '50% 50%';
  return `${round(focus.x * 100)}% ${round(focus.y * 100)}%`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Style object for any element painting a media image with `object-fit: cover`.
 *
 * Returns `undefined` when the image is centred, so the common case adds no
 * inline style at all and stays purely class-driven.
 */
export function focusStyle(
  image: Pick<MediaImage, 'focus'> | null | undefined
): CSSProperties | undefined {
  if (!image?.focus) return undefined;
  return { objectPosition: focusToObjectPosition(image.focus) };
}

/**
 * The props every `<Image fill>` / `<Image>` rendering a database image should
 * spread: the path, the intrinsic size that reserves the box, and the focal point.
 *
 * One helper instead of each card re-deriving them is the point — it is how the
 * cards, ride photos and backgrounds stay in agreement about how an image is
 * framed.
 */
export function mediaImageProps(image: MediaImage): {
  src: string;
  width: number;
  height: number;
  style?: CSSProperties;
} {
  return {
    src: image.src,
    width: image.width,
    height: image.height,
    style: focusStyle(image),
  };
}

/**
 * The best variant for a target aspect ratio: the pre-cut crop when one exists,
 * otherwise the source.
 *
 * Crops are cut around the focal point at build time, so preferring them means a
 * card gets a correctly framed file rather than a centred one it has to re-frame
 * with CSS — fewer bytes and a better crop.
 */
export function variantFor(image: MediaImage, aspect: '16x9' | '4x3' | '1x1'): string {
  return image.variants.find((v) => v.includes(`-${aspect}.`)) ?? image.src;
}

/**
 * A path with the image's content version attached.
 *
 * Every rendition of an image — the source, its crops, whatever the optimizer
 * derives from them — sits at a URL that is stable across deploys. That is what
 * we want for caching, and it is also the trap: retargeting a focal point rewrites
 * the crop's bytes without changing its URL, so caches would keep the old framing.
 * `?v=` moves with the content and nothing else, so URLs can be treated as
 * immutable and still update the moment the picture actually changes.
 */
export function versioned(path: string, image: Pick<MediaImage, 'version'>): string {
  return `${path}?v=${image.version}`;
}

/** The image's own path, content-versioned. */
export function versionedSrc(image: MediaImage): string {
  return versioned(image.src, image);
}

/** The aspect-ratio image set for structured data, content-versioned. */
export function versionedImageSet(image: MediaImage): string[] {
  const paths = image.variants.length ? image.variants : [image.src];
  return paths.map((p) => versioned(p, image));
}
