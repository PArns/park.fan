import type { MediaImage, MediaLicense, MediaRole } from '@/lib/media/types';

/** A database row as the admin edits it: the raw sidecar fields, not rendered ones. */
export interface MediaRow extends MediaImage {
  alt: Record<string, string>;
  caption: Record<string, string>;
  /** Below the 2048px long-edge target — the photo that wants replacing. */
  lowRes: boolean;
}

export interface TagFacet {
  id: string;
  label: string;
  exclusive: boolean;
  tags: string[];
}

export interface Vocabulary {
  facets: TagFacet[];
  tags: { tag: string; count: number }[];
  // Typed, not plain strings: the API serializes MEDIA_ROLES / MEDIA_LICENSES
  // verbatim, so the editor can rely on the narrow type instead of casting per use.
  roles: MediaRole[];
  licenses: MediaLicense[];
  parks: { park: string; count: number }[];
  collections: string[];
  lowResLongEdge: number;
}

export interface MediaStats {
  total: number;
  collections: number;
  parks: number;
  withGps: number;
  unlicensed: number;
  unassigned: number;
  /** Shot in the field and still waiting for alt text, caption and tags. */
  review: number;
  bytes: number;
  lowRes: number;
}

/**
 * The upload pipeline's shapes, re-exported so this file stays the one import for
 * the media browser. They live in `admin/_lib/media-upload.ts` because the
 * field-capture route uses the same pipeline and must not reach across into a
 * sibling route's folder for its types.
 */
export type { AnalyzedFile, ParkSuggestion, RideSuggestion } from '../../_lib/media-upload';

/** The editable assignment the admin builds up per uploaded file. */
export interface Assignment {
  collection: string;
  name: string;
  ext: string;
  park: string | null;
  ride: string | null;
  area: string | null;
  tags: string[];
  roles: string[];
  alt: string;
  caption: string;
  shotAt: string | null;
  /**
   * Focal point, set by clicking the photo during the walkthrough.
   *
   * Worth capturing here rather than leaving for later: it is the one field that
   * needs the picture in front of you, and the walkthrough is the only moment
   * every photo is guaranteed to be looked at.
   */
  focus: { x: number; y: number } | null;
  /** Excluded from the commit without being removed from the batch. */
  skip: boolean;
  /** Stepped past in the walkthrough — what the progress bar counts. */
  done: boolean;
}
