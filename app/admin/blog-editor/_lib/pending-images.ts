/**
 * Client-side staging for pasted and dropped images. The markdown gets the final public path at
 * once, and the bytes wait here until Save commits them, the pull request being the only durable
 * write path. A module-level singleton, because the canvas, the picker, the preview decorations
 * and the save flow all need the same map.
 */

export interface PendingImage {
  /** Public path as referenced from markdown, e.g. /media/uploads/xy-cover.png */
  path: string;
  name: string;
  mime: string;
  /** Raw base64 (no data: prefix) — goes straight into the GitHub contents API. */
  base64: string;
  /** Blob URL for in-editor preview. */
  objectUrl: string;
}

const pending = new Map<string, PendingImage>();

/** Folder for new uploads: the post's base slug, kept in sync by editor-client, else `uploads`. */
let uploadFolder = 'uploads';

/** Sets the `/media/<folder>/` for new uploads from the post slug; `uploads` while it is blank. */
export function setUploadFolder(slug: string): void {
  const safe = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  uploadFolder = safe || 'uploads';
}

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

/** ~3MB raw — keeps a multi-image save under typical serverless body limits. */
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

function sanitizeName(name: string): string {
  const base = name.replace(/\.[a-z0-9]+$/i, '');
  return (
    base
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'image'
  );
}

/**
 * Stages a pasted or dropped image until the post is saved: checks type and the 3 MB limit, picks
 * a free `/media/<folder>/<name>.<ext>` path, and keeps base64 bytes plus a preview object URL.
 */
export async function addPendingImage(file: File): Promise<PendingImage> {
  if (!EXT_BY_MIME[file.type]) {
    throw new Error(`Unsupported image type: ${file.type || 'unknown'}`);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB — max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB per image.`
    );
  }
  const ext = EXT_BY_MIME[file.type];
  // One folder per post (`/media/<post-slug>/<name>`); a numeric suffix dedupes names within the
  // session.
  const base = sanitizeName(file.name);
  let path = `/media/${uploadFolder}/${base}.${ext}`;
  for (let n = 2; pending.has(path); n++) {
    path = `/media/${uploadFolder}/${base}-${n}.${ext}`;
  }
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result ?? '');
      resolve(url.slice(url.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
  const entry: PendingImage = {
    path,
    name: file.name,
    mime: file.type,
    base64,
    objectUrl: URL.createObjectURL(file),
  };
  pending.set(path, entry);
  return entry;
}

/** Returns the staged image for a public path, if it has not been saved yet. */
export function getPendingImage(path: string): PendingImage | undefined {
  return pending.get(path);
}

/** Returns every staged image, for the save flow to commit. */
export function listPendingImages(): PendingImage[] {
  return [...pending.values()];
}

/** Drops every staged image and revokes their preview object URLs. */
export function clearPendingImages(): void {
  for (const p of pending.values()) URL.revokeObjectURL(p.objectUrl);
  pending.clear();
}
