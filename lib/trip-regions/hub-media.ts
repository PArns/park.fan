import 'server-only';

import { getMediaImage } from '@/lib/media';
import { focusToObjectPosition, versionedSrc } from '@/lib/media/focus';
import { getMediaAlt } from '@/lib/media/text';

/** A media image as the hub's chapters draw it: file, alt in the page's language, size and focus. */
export interface HubPhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** CSS `object-position` from the sidecar's focus, for a frame that crops the image. */
  position: string;
}

/**
 * One media image by id for the hub (a resort's photo, the region's Parky picture), or null when
 * the catalog no longer has it. SERVER ONLY: the catalog is too large for a Client Component.
 * Without a focus the frame keeps `fallbackPosition` (a screenshot's top, a photo's middle).
 */
export function hubPhoto(id: string, locale: string, fallbackPosition = '50% 50%'): HubPhoto | null {
  const image = getMediaImage(id);
  if (!image) return null;
  return {
    src: versionedSrc(image),
    alt: getMediaAlt(image.id, locale) ?? '',
    width: image.width,
    height: image.height,
    position: image.focus ? focusToObjectPosition(image.focus) : fallbackPosition,
  };
}

/**
 * A planner screenshot in the page's language: `<base>-<locale>`, else the English shot, else the
 * German one (the shots are taken in German first). Framed from the top unless the sidecar names
 * a focus.
 */
export function hubShot(base: string, locale: string): HubPhoto | null {
  for (const suffix of [locale, 'en', 'de']) {
    const shot = hubPhoto(`${base}-${suffix}`, locale, '50% 0%');
    if (shot) return shot;
  }
  return null;
}
