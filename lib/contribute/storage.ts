import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import type { StoredImageRecord } from './types';

/**
 * Pluggable image storage for user contributions.
 *
 * WHERE TO STORE THE PHOTOS (the "doesn't eat your hair" question):
 *
 *  1. Cloudflare R2  ← recommended for park.fan.
 *     S3-compatible, $0.015/GB-month storage and — crucially — ZERO egress fees,
 *     so serving the images back to visitors is free. You already sit behind
 *     Cloudflare (Turnstile + the API tunnel), so R2 + a Cloudflare Worker/CDN in
 *     front is the cheapest way to serve lots of high-res photos.
 *
 *  2. Vercel Blob
 *     Zero-config on Vercel, great DX. Storage is cheap but bandwidth is billed,
 *     so it gets pricier than R2 once the gallery is popular. Best when you want
 *     the simplest possible setup.
 *
 *  IMPORTANT (production): don't stream big files THROUGH this Next.js route —
 *  Vercel functions cap request bodies at ~4.5 MB, which a 24 MP JPEG blows past.
 *  Instead hand the browser a short-lived DIRECT upload target and let it PUT the
 *  bytes straight to storage:
 *    - Vercel Blob: `@vercel/blob/client` `upload()` + a server `handleUpload()`.
 *    - R2/S3:       a presigned PUT URL (`@aws-sdk/s3-request-presigner`).
 *  The server's job is then only: verify Turnstile → issue the upload token →
 *  record metadata. The prototype keeps the single-route multipart flow for
 *  simplicity and local-dev runnability.
 *
 * Select a driver with the STORAGE_DRIVER env var: 'local' (default) | 'vercel-blob'.
 */

export interface PutImageInput {
  submissionId: string;
  originalName: string;
  contentType: string;
  data: Buffer;
}

interface StorageDriver {
  put(input: PutImageInput): Promise<StoredImageRecord>;
}

/** Strip anything that isn't a safe filename character to avoid path traversal. */
function safeName(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.length > 0 ? base.slice(0, 80) : 'image';
}

/**
 * Local filesystem driver — the default so the prototype works with no cloud
 * credentials. Writes under `.uploads/` (gitignored). NOTE: Vercel's runtime
 * filesystem is ephemeral and read-only except for /tmp, so this driver is for
 * local development only — swap to R2/Blob before deploying.
 */
const localDriver: StorageDriver = {
  async put({ submissionId, originalName, contentType, data }) {
    const root = path.join(process.cwd(), '.uploads', 'contributions', submissionId);
    await fs.mkdir(root, { recursive: true });
    const filename = safeName(originalName);
    await fs.writeFile(path.join(root, filename), data);
    const key = `contributions/${submissionId}/${filename}`;
    return {
      key,
      // Not publicly served in the prototype; recorded so moderators can locate the file.
      url: `/_uploads/${key}`,
      originalName,
      contentType,
      size: data.byteLength,
    };
  },
};

/**
 * Vercel Blob driver — activated with STORAGE_DRIVER=vercel-blob and a
 * BLOB_READ_WRITE_TOKEN. Imported dynamically so `@vercel/blob` stays an optional
 * dependency (the prototype doesn't bundle it unless you opt in).
 */
const vercelBlobDriver: StorageDriver = {
  async put({ submissionId, originalName, contentType, data }) {
    // Specifier cast to `string` so TypeScript treats this as a runtime-only
    // dynamic import and does not require '@vercel/blob' to be installed/typed.
    let mod: {
      put: (key: string, body: Buffer, opts: Record<string, unknown>) => Promise<{ url: string }>;
    };
    // Indirect specifier + ignore hints so the bundler treats this as runtime-only
    // and doesn't warn about the optional '@vercel/blob' dependency at build time.
    const pkg = '@vercel/blob';
    try {
      mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ pkg);
    } catch {
      throw new Error(
        "STORAGE_DRIVER=vercel-blob requires the '@vercel/blob' package. Run `pnpm add @vercel/blob`."
      );
    }
    const key = `contributions/${submissionId}/${safeName(originalName)}`;
    const blob = await mod.put(key, data, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });
    return { key, url: blob.url, originalName, contentType, size: data.byteLength };
  },
};

function getDriver(): StorageDriver {
  switch (process.env.STORAGE_DRIVER) {
    case 'vercel-blob':
      return vercelBlobDriver;
    case 'local':
    case undefined:
    case '':
      return localDriver;
    default:
      console.warn(
        `[storage] Unknown STORAGE_DRIVER "${process.env.STORAGE_DRIVER}" — using local.`
      );
      return localDriver;
  }
}

export function putImage(input: PutImageInput): Promise<StoredImageRecord> {
  return getDriver().put(input);
}
