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
  /** False when the open session's pull request could not be read. */
  sessionChecked: boolean;
  backlog: Backlog;
}

/** What `/api/admin/media/session` answers, as far as the capture screen uses it: one link. */
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
