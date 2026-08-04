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
  bytes: number;
  lowRes: number;
}

export interface RideSuggestion {
  slug: string;
  name: string;
  distanceM: number;
  distanceLabel: string;
  area: string | null;
}

export interface ParkSuggestion {
  slug: string;
  name: string;
  distanceM: number;
  distanceLabel: string;
  confidence: 'confident' | 'uncertain' | 'none';
}

/** One file in an upload batch, as returned by /api/admin/media/analyze. */
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
  /** Excluded from the commit without being removed from the batch. */
  skip: boolean;
}
