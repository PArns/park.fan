import { normalizeSidecar, serializeSidecar } from '@/lib/media/sidecar.mjs';

/**
 * The sidecar an image dropped into the blog editor gets.
 *
 * The editor is the media database's second write path, and it used to skip this
 * step entirely: the bytes were committed to `public/media/<post>/…` and nothing
 * else. The file was then in the tree but undescribed — no alt text, no rights, no
 * tags — and while the generator does include it in the manifest, an image nobody
 * ever wrote a row for is an image nobody is going to find again.
 *
 * What the editor genuinely knows is the text. The authoring convention is
 * `![alt | caption | align | size](src)`, so by the time somebody drops a picture
 * into a draft they have usually typed the one thing the database most wants and
 * cannot derive. Reading it out of every filled locale gives the sidecar up to six
 * languages — more than the media uploader collects, which asks for German and
 * leaves the rest for later.
 *
 * What it does NOT know stays empty, deliberately:
 *
 *  - `park` / `ride` — a screenshot or a diagram in an article usually shows
 *    neither, and a guess here puts a wrong photo on a ride's page.
 *  - `focus` — nothing has looked at the picture yet, and "unset" and "centred"
 *    are stored differently on purpose so the admin can list what still needs a
 *    human.
 *  - `credit` — the post's author wrote the post, not necessarily the picture.
 *    Filling in an author to clear the warning is the one thing
 *    `public/media/README.md` forbids outright.
 *
 * The result is a row the admin's "No park" / "Rights unknown" / "No focal point"
 * filters can surface. That backlog is what those filters are for; a file with no
 * sidecar at all is on nobody's list.
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
 * Serialize that into a sidecar file, through the same normalizer the generator
 * and the media admin use — so a file written here is byte-identical to one a
 * human would hand-author, and the diff in the pull request reads as content.
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
