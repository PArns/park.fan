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
 * Collections as a tree, counted the way the API filters them.
 *
 * `searchMedia({ collection })` matches the collection itself and everything
 * under `<collection>/`, so a parent's count is its own images plus all of its
 * descendants' — the number the grid shows after the click. A parent that holds
 * no images of its own (only sub-collections) still gets a row, because it is a
 * filter the API accepts.
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
      node.count += count;
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
