import { normalizeSidecar, serializeSidecar } from '@/lib/media/sidecar.mjs';

/**
 * The sidecar an image dropped into the blog editor gets, so it enters the media database
 * described. Alt text and caption come from the post's `![alt | caption | …](src)` in every
 * filled locale. `park`, `ride`, `focus` and `credit` stay empty on purpose: a guess would put a
 * wrong photo on a ride page or a wrong name under a picture, and empty is what the admin's
 * backlog filters list.
 */

export interface LocaleDraft {
  body: string;
}

/** `![alt | caption | …](path)` for one image, across every filled locale. */
export function textFromDrafts(
  imagePath: string,
  perLocale: Record<string, LocaleDraft>
): { alt: Record<string, string>; caption: Record<string, string> } {
  const escaped = imagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // The src may carry the authoring query (`?align=wide`) or a version token, and
  // the alt segment may contain brackets of its own — hence `[^\]]*` rather than
  // anything greedy.
  const pattern = new RegExp(`!\\[([^\\]]*)\\]\\(${escaped}(?:\\?[^)]*)?\\)`);
  const alt: Record<string, string> = {};
  const caption: Record<string, string> = {};

  for (const [locale, draft] of Object.entries(perLocale)) {
    const match = pattern.exec(draft?.body ?? '');
    if (!match) continue;
    const [first, second] = match[1].split('|').map((part) => part.trim());
    if (first) alt[locale] = first;
    if (second) caption[locale] = second;
  }
  return { alt, caption };
}

/**
 * The sidecar file for an image uploaded from the blog editor, written through the same
 * normalizer as the generator so it is byte-identical to a hand-authored one.
 */
export function sidecarForUpload(
  imagePath: string,
  perLocale: Record<string, LocaleDraft>
): string {
  const { alt, caption } = textFromDrafts(imagePath, perLocale);
  const { sidecar, text } = normalizeSidecar({
    tags: [/\.svg$/i.test(imagePath) ? 'diagram' : 'photo'],
    alt,
    caption,
  });
  return serializeSidecar(sidecar, text);
}
