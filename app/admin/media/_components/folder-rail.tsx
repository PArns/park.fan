'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useLocalPreference } from '../../_lib/use-local-preference';
import {
  buildCollectionTree,
  buildTagGroups,
  flattenTree,
  visibleNodes,
  type FolderView,
} from '../_lib/folders';
import type { Vocabulary } from '../_lib/types';

/**
 * Every folder is a filter the page already has: park and tag set the same state as the
 * dropdowns, so the two never disagree, and collection is the one only the rail sets.
 */

export interface FolderSelection {
  collection: string;
  park: string;
  tag: string;
}

const VIEWS: { id: FolderView; label: string }[] = [
  { id: 'collection', label: 'Sammlung' },
  { id: 'park', label: 'Park' },
  { id: 'tag', label: 'Tags' },
];

/**
 * Collapsible folder rail beside the media grid, by collection, park or tag facet, each folder a
 * filter with its image count. Below `lg` it is one `<select>` above the grid.
 */
export function FolderRail({
  vocabulary,
  total,
  active,
  onSelect,
}: {
  vocabulary: Vocabulary;
  /** Images in the whole database — the count on each view's "Alle" row. */
  total: number;
  active: FolderSelection;
  onSelect: (view: FolderView, value: string) => void;
}) {
  const [storedView, setView] = useLocalPreference('parkfan_admin_media_folder_view', 'collection');
  const [rail, setRail] = useLocalPreference('parkfan_admin_media_folders', 'open');
  const view: FolderView = VIEWS.some((v) => v.id === storedView)
    ? (storedView as FolderView)
    : 'collection';

  const collections = useMemo(
    () => flattenTree(buildCollectionTree(vocabulary.collectionCounts)),
    [vocabulary.collectionCounts]
  );
  // Collapsed parents, by collection id. Open is the default so a new folder is never hidden.
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const visibleCollections = useMemo(
    () => visibleNodes(collections, collapsed, active.collection),
    [collections, collapsed, active.collection]
  );
  const toggleCollapsed = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const tagGroups = useMemo(
    () => buildTagGroups(vocabulary.facets, vocabulary.tags),
    [vocabulary.facets, vocabulary.tags]
  );

  // The phone's one select shows the narrowest folder that is set.
  const mobileValue = active.collection
    ? `collection:${active.collection}`
    : active.park
      ? `park:${active.park}`
      : active.tag
        ? `tag:${active.tag}`
        : '';

  const onMobileChange = (value: string) => {
    // One select, one folder: picking one clears the other two, or the select
    // would show a folder while the grid is still narrowed by another.
    onSelect('collection', '');
    onSelect('park', '');
    onSelect('tag', '');
    if (!value) return;
    const split = value.indexOf(':');
    onSelect(value.slice(0, split) as FolderView, value.slice(split + 1));
  };

  return (
    <>
      <select
        data-folder-select=""
        aria-label="Ordner"
        value={mobileValue}
        onChange={(e) => onMobileChange(e.target.value)}
        className="border-border bg-background mb-3 w-full rounded-md border px-2 py-1.5 text-sm lg:hidden"
      >
        <option value="">Alle Ordner ({total})</option>
        <optgroup label="Sammlung">
          {collections.map((node) => (
            <option key={node.id} value={`collection:${node.id}`}>
              {'  '.repeat(node.depth)}
              {node.label} ({node.count})
            </option>
          ))}
        </optgroup>
        <optgroup label="Park">
          {vocabulary.parks.map((p) => (
            <option key={p.park} value={`park:${p.park}`}>
              {p.park} ({p.count})
            </option>
          ))}
        </optgroup>
        {tagGroups.map((group) => (
          <optgroup key={group.id} label={`Tags · ${group.label}`}>
            {group.tags.map((t) => (
              <option key={t.tag} value={`tag:${t.tag}`}>
                {t.tag} ({t.count})
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {rail === 'collapsed' ? (
        <div className="hidden shrink-0 lg:block">
          <button
            type="button"
            onClick={() => setRail('open')}
            title="Ordner einblenden"
            aria-label="Ordner einblenden"
            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-md border p-1.5"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <nav
          aria-label="Ordner"
          className="border-border hidden w-56 shrink-0 self-start rounded-lg border lg:sticky lg:top-4 lg:block"
        >
          <div className="border-border flex items-center gap-1 border-b p-1.5">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                data-folder-view={v.id}
                onClick={() => setView(v.id)}
                aria-pressed={view === v.id}
                className={cn(
                  'rounded-md px-2 py-1 text-xs transition-colors',
                  view === v.id
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {v.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRail('collapsed')}
              title="Ordner ausblenden"
              aria-label="Ordner ausblenden"
              className="text-muted-foreground hover:text-foreground ml-auto rounded-md p-1"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          <ul className="max-h-[70vh] space-y-px overflow-y-auto p-1.5 text-xs">
            <FolderRow
              label="Alle"
              count={total}
              active={!active[view]}
              onClick={() => onSelect(view, '')}
            />
            {view === 'collection' &&
              visibleCollections.map((node) => (
                <FolderRow
                  key={node.id}
                  folder={`collection:${node.id}`}
                  label={node.label}
                  title={node.id}
                  count={node.count}
                  depth={node.depth}
                  active={active.collection === node.id}
                  onClick={() => onSelect('collection', node.id)}
                  expandable={node.children.length > 0}
                  expanded={!collapsed.has(node.id)}
                  onToggle={() => toggleCollapsed(node.id)}
                />
              ))}
            {view === 'park' &&
              vocabulary.parks.map((p) => (
                <FolderRow
                  key={p.park}
                  folder={`park:${p.park}`}
                  label={p.park}
                  count={p.count}
                  active={active.park === p.park}
                  onClick={() => onSelect('park', p.park)}
                />
              ))}
            {view === 'tag' &&
              tagGroups.map((group) => (
                <li key={group.id}>
                  <p className="text-muted-foreground px-2 pt-2 pb-0.5 text-[10px] tracking-wide uppercase">
                    {group.label}
                  </p>
                  <ul className="space-y-px">
                    {group.tags.map((t) => (
                      <FolderRow
                        key={t.tag}
                        folder={`tag:${t.tag}`}
                        label={t.tag}
                        count={t.count}
                        active={active.tag === t.tag}
                        onClick={() => onSelect('tag', t.tag)}
                      />
                    ))}
                  </ul>
                </li>
              ))}
          </ul>
        </nav>
      )}
    </>
  );
}

function FolderRow({
  folder,
  label,
  title,
  count,
  depth = 0,
  active,
  onClick,
  expandable = false,
  expanded = true,
  onToggle,
}: {
  folder?: string;
  label: string;
  title?: string;
  count: number;
  depth?: number;
  active: boolean;
  onClick: () => void;
  /** A parent with sub-collections shows a chevron that folds them away. */
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const Icon = active ? FolderOpen : Folder;
  const Chevron = expanded ? ChevronDown : ChevronRight;
  return (
    <li className="relative">
      {expandable && (
        <button
          type="button"
          data-folder-toggle={folder}
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${label} ${expanded ? 'einklappen' : 'ausklappen'}`}
          style={{ left: `${0.125 + depth * 0.875}rem` }}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 z-10 -translate-y-1/2 rounded p-1"
        >
          <Chevron className="h-3 w-3" />
        </button>
      )}
      <button
        type="button"
        data-folder={folder}
        onClick={onClick}
        title={title ?? label}
        aria-current={active ? 'true' : undefined}
        style={{ paddingLeft: `${(onToggle ? 1.25 : 0.5) + depth * 0.875}rem` }}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left transition-colors',
          active
            ? 'bg-primary/15 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="tabular-nums">{count}</span>
      </button>
    </li>
  );
}
