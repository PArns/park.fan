'use client';

import { analyzePayload, fitForCommit, toDatabaseFormat } from './upload-transport';

/**
 * The one path a photograph takes from a device into the media database.
 *
 * It existed twice by accident and only just: the media browser's batch dialog
 * carried the whole sequence inline, and the field-capture route needs exactly the
 * same one with a different screen in front of it. Four of the steps are rules
 * rather than plumbing, and each was learned the hard way:
 *
 *  1. **Analyze the ORIGINAL.** EXIF is what says where and when, and both of the
 *     re-encodes below destroy it. Reading it afterwards reads nothing.
 *  2. **Format before size.** A HEIC under the size cap is never touched by the
 *     shrink step and fails at the very last moment on the server's extension
 *     check. `toDatabaseFormat` asks the format question first.
 *  3. **Carry the EXIF back in.** Once anything has been re-encoded the file no
 *     longer carries its own coordinates, and the build generator re-reads them
 *     from the file. So they are written into the sidecar explicitly, and only
 *     then — an untouched original keeps being the source of truth.
 *  4. **One request per photo, in order.** A batch in a single body exceeded
 *     Vercel's ~4.5 MB limit; sequential is also what lets the first commit open
 *     the session pull request and the rest find and join it instead of racing to
 *     open their own.
 */

/** A ranked park suggestion from the photo's coordinates. */
export interface ParkSuggestion {
  slug: string;
  name: string;
  distanceM: number;
  distanceLabel: string;
  confidence: 'confident' | 'uncertain' | 'none';
}

/** One entry of the distance-ranked ride shortlist. */
export interface RideSuggestion {
  slug: string;
  name: string;
  distanceM: number;
  distanceLabel: string;
  area: string | null;
}

/** One file as `/api/admin/media/analyze` describes it. */
export interface AnalyzedFile {
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  lowRes: boolean;
  gps: { lat: number; lon: number; source: string } | null;
  shotAt: string | null;
  suggestion: {
    park: ParkSuggestion | null;
    rides: RideSuggestion[];
    area: string | null;
  };
}

/** The sidecar fields a caller may set. Anything omitted is left to the server. */
export interface PhotoSidecar {
  park?: string | null;
  ride?: string | null;
  alsoRides?: string[];
  area?: string | null;
  tags?: string[];
  roles?: string[];
  alt?: Record<string, string>;
  caption?: Record<string, string>;
  credit?: Record<string, unknown>;
  shotAt?: string | null;
  focus?: { x: number; y: number } | null;
  gps?: { lat: number; lon: number } | null;
  /** Leaves the photo in the media browser's "Zu prüfen" filter until cleared. */
  review?: boolean;
}

export interface CommitPhotoInput {
  file: File;
  collection: string;
  /** File name without extension; the server validates it as a slug. */
  name: string;
  sidecar: PhotoSidecar;
  /** What `analyzePhoto` read off the original, before any re-encode. */
  exif?: Pick<AnalyzedFile, 'gps' | 'shotAt'> | null;
  /** Open a fresh pull request instead of joining the running session. */
  newSession?: boolean;
  title?: string;
}

export interface CommitPhotoResult {
  pullRequest: string | null;
  joinedSession: boolean;
  /** The file was re-encoded to get under the request-size cap. */
  shrunk: boolean;
  /** The file was re-encoded because its format is not one the database stores. */
  transcoded: boolean;
  /** What the file was actually committed as. */
  ext: string;
  /** Present when the commit landed but the pull request did not (HTTP 207). */
  warning?: string;
}

/** `DSC_0042 (1).JPG` → `dsc-0042-1` — the id half of a media path. */
export function toSlug(fileName: string): string {
  return (
    fileName
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'image'
  );
}

function extensionOf(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  return ext === 'jpeg' ? 'jpg' : ext;
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error(`${file.name} konnte nicht gelesen werden.`));
    reader.readAsDataURL(file);
  });
}

/**
 * Ask the server where this photo was taken, from the original bytes.
 *
 * Only the first megabyte goes up for an oversized file: EXIF sits in an APP1
 * segment right after the JPEG header, so the coordinates and the capture date are
 * in there. Dimensions may not survive the truncation, and the route reports what
 * it could read rather than refusing the file.
 */
export async function analyzePhoto(file: File): Promise<AnalyzedFile> {
  const form = new FormData();
  form.append('files', analyzePayload(file), file.name);
  const response = await fetch('/api/admin/media/analyze', { method: 'POST', body: form });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? `Analyse fehlgeschlagen: ${file.name}`);
  const first = (body.files as AnalyzedFile[])[0];
  if (!first) throw new Error(`Analyse ohne Ergebnis: ${file.name}`);
  return first;
}

/** Commit one photograph into the open media session. */
export async function commitPhoto(input: CommitPhotoInput): Promise<CommitPhotoResult> {
  const { file: formatted, transcoded } = await toDatabaseFormat(input.file);
  const { file: fitted, shrunk } = await fitForCommit(formatted);
  const reEncoded = transcoded || shrunk;
  const ext = reEncoded ? 'jpg' : extensionOf(formatted);

  const response = await fetch('/api/admin/media/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title ?? `media: add ${input.name}`,
      newSession: input.newSession ?? false,
      operations: [
        {
          op: 'create' as const,
          collection: input.collection,
          name: input.name,
          ext,
          contentBase64: await readAsBase64(fitted),
          sidecar: {
            ...input.sidecar,
            shotAt: input.sidecar.shotAt ?? input.exif?.shotAt ?? null,
            // Only when the bytes were re-encoded. An untouched original still
            // carries its own tag, and the build generator prefers reading it
            // there — a copy written here would freeze and go stale if the file
            // is ever replaced.
            gps:
              input.sidecar.gps ??
              (reEncoded && input.exif?.gps
                ? { lat: input.exif.gps.lat, lon: input.exif.gps.lon }
                : null),
          },
        },
      ],
    }),
  });

  const data = await response.json();
  // 207 means the commits landed and only the pull request did not — the work is
  // on a branch and must not be reported as a failure the caller retries.
  if (!response.ok && response.status !== 207) {
    throw new Error(`${input.name}: ${data.error ?? 'Commit fehlgeschlagen'}`);
  }

  return {
    pullRequest: data.pullRequest ?? null,
    joinedSession: Boolean(data.joinedSession),
    shrunk,
    transcoded,
    ext,
    warning: data.warning,
  };
}
