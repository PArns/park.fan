/**
 * Take the one image out of a drop or a file picker, or say why there is none.
 *
 * Replacing swaps a single file, so a multi-file drop is rejected rather than
 * silently using the first: picking one for somebody who meant to drop a batch is
 * how the wrong photo ends up on a ride. Shared by the editor's replace bar and
 * the grid tiles, so both refuse the same things with the same words.
 */
const ALLOWED_EXT = /^(jpg|jpeg|png|webp|avif|svg)$/;

export type ReplaceDrop = { file: File } | { error: string } | null;

export function pickReplacement(files: FileList | File[] | null): ReplaceDrop {
  const list = Array.from(files ?? []);
  if (list.length === 0) return null;
  if (list.length > 1) {
    return {
      error: 'Replacing swaps one file — drop a single image. Use “Add images” for a batch.',
    };
  }
  const [file] = list;
  if (!file.type.startsWith('image/')) return { error: `${file.name} is not an image.` };
  // The commit endpoint refuses anything else, and a refusal at Save would name no tile.
  if (!ALLOWED_EXT.test(file.name.split('.').pop()?.toLowerCase() ?? '')) {
    return { error: `${file.name}: use a jpg, png, webp, avif or svg file.` };
  }
  return { file };
}

/** The lower-case extension the database stores for a dropped file. */
export function replacementExt(file: File): string {
  const raw = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  return raw === 'jpeg' ? 'jpg' : raw;
}
