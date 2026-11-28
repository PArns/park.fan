import type { AttractionKind, AttractionKindSource } from '@/lib/api/types';

/**
 * The admin's German names for the attraction kinds. `satisfies` keeps a kind added to
 * `AttractionKind` from compiling until it has one here.
 */
const ATTRACTION_KIND_LABELS = {
  RIDE: 'Fahrgeschäft',
  TRANSPORT: 'Transportsystem',
  SHOW: 'Show',
  WALKTHROUGH: 'Walkthrough',
  MAZE: 'Halloween-Maze',
  GAME: 'Spiel',
} satisfies Record<AttractionKind, string>;

/** The German name of an attraction kind; a value the API added after this list shows as itself. */
export function attractionKindLabel(kind: string): string {
  return Object.hasOwn(ATTRACTION_KIND_LABELS, kind)
    ? ATTRACTION_KIND_LABELS[kind as AttractionKind]
    : kind;
}

/** One entry of an admin select built from a curated enum field. */
export interface CuratedEnumOption {
  value: string;
  label: string;
}

/**
 * The options of a curated enum field as the admin's selects list them, in the API's order: an
 * attraction kind under its German name, any other value as itself.
 */
export function curatedEnumOptions(
  key: string,
  options: readonly string[] | undefined
): CuratedEnumOption[] {
  return (options ?? []).map((value) => ({
    value,
    label: key === 'attractionKind' ? attractionKindLabel(value) : value,
  }));
}

/**
 * {@link curatedEnumOptions} for one key of `GET /v1/admin/content/fields`, so a kind the API adds
 * shows up in every select without a frontend change. Empty while the descriptors are not loaded.
 */
export function curatedFieldOptions(
  specs: ReadonlyArray<{ key: string; options?: readonly string[] }> | undefined,
  key: string
): CuratedEnumOption[] {
  return curatedEnumOptions(key, specs?.find((spec) => spec.key === key)?.options);
}

/** An attraction's kind as the public payload serves it, and who decided it. */
export interface ServedAttractionKind {
  kind: string;
  source: AttractionKindSource | null;
}

/** The kind an admin row shows, and whether only the API's rule says so. */
export interface ShownAttractionKind {
  kind: string;
  derived: boolean;
}

/**
 * The kind an admin row shows: the editor's stored value, else the API's derived one, flagged so
 * the editor sees the decision is still open. A served kind that calls itself curated while the
 * row stores none is a copy from before an editor cleared it, and shows nothing.
 */
export function shownAttractionKind(
  stored: string | null | undefined,
  served: ServedAttractionKind | undefined
): ShownAttractionKind | null {
  if (stored) return { kind: stored, derived: false };
  if (served?.source === 'derived' && served.kind) return { kind: served.kind, derived: true };
  return null;
}

/**
 * The rows of a park's admin attraction list that a data-quality „ohne Art" entry names. The
 * report sends names, not ids, so a row matches on its resolved name and on storing no kind; two
 * rows of the same name are both listed.
 */
export function rowsWithoutKind<T extends { name: string; attractionKind?: string | null }>(
  names: readonly string[],
  rows: readonly T[]
): T[] {
  const wanted = new Set(names);
  return rows.filter((row) => !row.attractionKind && wanted.has(row.name));
}
