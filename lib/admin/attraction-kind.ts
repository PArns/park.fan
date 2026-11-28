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

/** The kind columns of a row of the admin's attraction list, as far as the served kind needs them. */
export interface AttractionKindColumns {
  id: string;
  /** The editor's kind; null is "nobody decided". */
  attractionKind?: string | null;
  /** The rule's kind, kept for every row; absent from an API that does not send it yet. */
  derivedAttractionKind?: string | null;
  /** Who decided the served kind; absent from an API that does not send it yet. */
  attractionKindSource?: AttractionKindSource | null;
}

/**
 * The served kinds of a park's attractions, keyed by id, read off the admin list: the editor's
 * kind where `attractionKindSource` is `curated`, the rule's where it is `derived`. Null when no
 * row carries the columns, which is an API that does not send them yet; an empty list needs no
 * answer and gives an empty map.
 */
export function servedKindsFromList(
  rows: readonly AttractionKindColumns[]
): Record<string, ServedAttractionKind> | null {
  const carried = rows.some(
    (row) => row.attractionKindSource !== undefined || row.derivedAttractionKind !== undefined
  );
  if (rows.length > 0 && !carried) return null;
  const kinds: Record<string, ServedAttractionKind> = {};
  for (const row of rows) {
    const source = row.attractionKindSource;
    const kind =
      source === 'derived'
        ? row.derivedAttractionKind
        : source === 'curated'
          ? row.attractionKind
          : null;
    if (kind && source) kinds[row.id] = { kind, source };
  }
  return kinds;
}

/**
 * The rows of a park's admin attraction list that a data-quality „ohne Gattung" entry names, for a
 * report that sends names only: a row matches on its resolved name and on storing no kind, and two
 * rows of the same name are both listed.
 */
export function rowsWithoutKind<T extends { name: string; attractionKind?: string | null }>(
  names: readonly string[],
  rows: readonly T[]
): T[] {
  const wanted = new Set(names);
  return rows.filter((row) => !row.attractionKind && wanted.has(row.name));
}

/** An attraction a data-quality „ohne Gattung" card asks about. */
export interface KindlessAttraction {
  id: string;
  name: string;
}

/**
 * The attractions a data-quality „ohne Gattung" card asks about: the report's `withoutKindRefs` where
 * it sends them, else the rows of the park's list that {@link rowsWithoutKind} finds by name. Null
 * while that fallback still waits for the list.
 */
export function kindlessAttractions(
  entry: {
    withoutKind: readonly string[];
    withoutKindRefs?: readonly KindlessAttraction[];
  },
  rows: readonly { id: string; name: string; attractionKind?: string | null }[] | undefined
): KindlessAttraction[] | null {
  const found = entry.withoutKindRefs ?? (rows ? rowsWithoutKind(entry.withoutKind, rows) : null);
  return found?.map(({ id, name }) => ({ id, name })) ?? null;
}
