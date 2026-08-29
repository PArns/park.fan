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
