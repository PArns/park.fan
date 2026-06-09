/**
 * Client-side staging area for pasted / dropped images.
 *
 * The markdown gets the FINAL public path (`/blog/images/uploads/…`)
 * immediately — that's what round-trips and what the published post will
 * use. The actual bytes wait here until "Save & open PR" ships them as
 * additional commits (the admin runs on a read-only filesystem in prod, so
 * the PR is the only durable write path). The editor previews staged images
 * through an object URL so authors aren't staring at broken thumbnails.
 *
 * Module-level singleton on purpose: the canvas (paste/drop), the image
 * picker (upload button), the preview decorations and the save flow all need
 * the same map without threading React state through four layers.
 */

export interface PendingImage {
  /** Public path as referenced from markdown, e.g. /blog/images/uploads/xy-cover.png */
  path: string;
  name: string;
  mime: string;
  /** Raw base64 (no data: prefix) — goes straight into the GitHub contents API. */
  base64: string;
  /** Blob URL for in-editor preview. */
  objectUrl: string;
}

const pending = new Map<string, PendingImage>();

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

/** ~3MB raw — keeps a multi-image save under typical serverless body limits. */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

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
  const stamp = Date.now().toString(36);
  const path = `/blog/images/uploads/${stamp}-${sanitizeName(file.name)}.${ext}`;
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

export function getPendingImage(path: string): PendingImage | undefined {
  return pending.get(path);
}

export function listPendingImages(): PendingImage[] {
  return [...pending.values()];
}

export function clearPendingImages(): void {
  for (const p of pending.values()) URL.revokeObjectURL(p.objectUrl);
  pending.clear();
}
