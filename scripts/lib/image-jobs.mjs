import crypto from 'node:crypto';
import os from 'node:os';

/**
 * How many images the generators encode at once: the core count, where the wall-clock has its
 * knee, capped at 8 and never under 2 so a single-core CI box still overlaps encoding with file
 * IO. `IMAGE_CROP_CONCURRENCY` overrides it.
 */
export const IMAGE_CONCURRENCY = (() => {
  const override = Number(process.env.IMAGE_CROP_CONCURRENCY);
  if (Number.isFinite(override) && override >= 1) return Math.floor(override);
  return Math.min(8, Math.max(2, os.cpus()?.length || 2));
})();

/** The hex SHA-256 the generators key their caches on. */
export const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
