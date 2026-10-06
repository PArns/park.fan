import type { TagFacet } from './types';

/**
 * The media browser's virtual folders.
 *
 * Nothing here moves a file. A folder is a filter the API already understands,
 * drawn as a tree so a database of a few hundred photos can be walked instead
 * of scrolled. Park, tag and collection come from the sidecar fields the API
 * returns, never from a path on disk (docs/rules/media-database.md).
 */

export type FolderView = 'collection' | 'park' | 'tag';

export interface FolderNode {
  /** The value the filter is set to — a full collection id such as `halloween-2026/kulissen`. */
  id: string;
  /** What the row shows: the last path segment. */
  label: string;
  /** Images in this folder and every folder below it. */
  count: number;
  depth: number;
  children: FolderNode[];
}

export interface TagGroup {
  id: string;
  label: string;
  tags: { tag: string; count: number }[];
}

/**
 * Collections as a tree. `counts` already holds the distinct images at or below each node
 * (`listCollectionNodes()`), so summing children would count an image twice. A parent with no
 * images of its own still gets a row, because it is a filter the API accepts.
 */
export function buildCollectionTree(counts: { collection: string; count: number }[]): FolderNode[] {
  const byId = new Map<string, FolderNode>();
  const roots: FolderNode[] = [];

  for (const { collection, count } of counts) {
    const parts = collection.split('/').filter(Boolean);
    let parent: FolderNode | null = null;
    for (let i = 0; i < parts.length; i++) {
      const id = parts.slice(0, i + 1).join('/');
      let node = byId.get(id);
      if (!node) {
        node = { id, label: parts[i], count: 0, depth: i, children: [] };
        byId.set(id, node);
        (parent ? parent.children : roots).push(node);
      }
      if (i === parts.length - 1) node.count = count;
      parent = node;
    }
  }

  const sort = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => a.label.localeCompare(b.label));
    nodes.forEach((node) => sort(node.children));
  };
  sort(roots);
  return roots;
}

/**
 * The rows to draw: every node except those under a collapsed parent.
 *
 * The active folder is always drawn, even under a collapsed parent. Otherwise
 * folding its parent (or opening a link that selects a child) would leave the
 * grid narrowed by a folder the rail no longer shows.
 */
export function visibleNodes(
  nodes: FolderNode[],
  collapsed: ReadonlySet<string>,
  active: string
): FolderNode[] {
  return nodes.filter((node) => {
    if (node.id === active) return true;
    const parts = node.id.split('/');
    for (let i = 1; i < parts.length; i++) {
      if (collapsed.has(parts.slice(0, i).join('/'))) return false;
    }
    return true;
  });
}

/** Slugs joined by `/`, the same shape `normalizeSidecar` and the commit route accept. */
const COLLECTION_PATH_RE = /^[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)*$/;

/**
 * What a typed collection path becomes, or null when it is not one.
 *
 * Lowercased and trimmed of spaces and stray slashes first, so `Toverland/Halloween/`
 * lands on `toverland/halloween` instead of being refused for its capitals.
 */
export function parseCollectionPath(input: string): string | null {
  const path = input
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '');
  return COLLECTION_PATH_RE.test(path) ? path : null;
}

/** Depth-first, parents before their children — the order rows and `<option>`s are drawn in. */
export function flattenTree(nodes: FolderNode[]): FolderNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
}

/**
 * Tags in use, grouped by their facet in `lib/media/tags.mjs`.
 *
 * Only tags that at least one image carries. A tag outside every facet (the
 * generator warns about those, but they can exist) lands in a trailing
 * "Sonstige" group rather than disappearing from the browser.
 */
export function buildTagGroups(
  facets: TagFacet[],
  tags: { tag: string; count: number }[]
): TagGroup[] {
  const counts = new Map(tags.map((t) => [t.tag, t.count]));
  const placed = new Set<string>();

  const groups: TagGroup[] = facets.map((facet) => ({
    id: facet.id,
    label: facet.label,
    tags: facet.tags.flatMap((tag) => {
      const count = counts.get(tag);
      if (!count) return [];
      placed.add(tag);
      return [{ tag, count }];
    }),
  }));

  const other = tags.filter((t) => !placed.has(t.tag));
  if (other.length > 0) groups.push({ id: 'other', label: 'Sonstige', tags: other });

  return groups.filter((group) => group.tags.length > 0);
}
