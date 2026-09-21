import type { Backlog } from '@/lib/media/photo-backlog';

/** What `/api/admin/media/backlog` answers. */
export interface BacklogResponse {
  park: {
    slug: string;
    name: string;
    /** `continent/country/city/park`. */
    path: string;
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
    hasBackground: boolean;
    takenNames: string[];
  };
  waitTimesAvailable: boolean;
  statsAvailable: boolean;
  backlog: Backlog;
}

/**
 * What `/api/admin/media/session` answers, down to the part this screen uses.
 *
 * The session is the open pull request carrying the `media/session-` branch
 * prefix, resolved on the server from git. The media browser reads the same
 * endpoint for its session bar and needs the whole shape; here it is one link.
 */
export interface CaptureSessionResponse {
  session: { url: string | null } | null;
}

/** A photo the screen is currently doing something with. */
export type UploadState =
  | { kind: 'reading' }
  | { kind: 'uploading' }
  | { kind: 'done'; pullRequest: string | null }
  | { kind: 'queued'; reason: string }
  | { kind: 'failed'; reason: string };

export interface ActiveUpload {
  id: string;
  rideSlug: string | null;
  rideName: string;
  /** Object URL of the local file, revoked when the entry is cleared. */
  previewUrl: string;
  state: UploadState;
}
