'use client';

import type { LucideIcon } from 'lucide-react';
import { entityEditorHref, entityPublicHref } from '@/lib/admin/site-analytics';
import type { RankedEntity } from '@/lib/api/admin-site-analytics';
import { BarList, type BarRow } from '../../_ui/charts';
import { Panel, PanelBody, PanelHeader } from '../../_ui/primitives';
import { PublicLink } from './list-parts';

/** One ranked entity as a bar row: the editor behind its name, the public page beside it. */
function entityRow(entity: RankedEntity, kind: 'park' | 'attraction'): BarRow {
  if (entity.name === null || entity.url === null) {
    return {
      key: entity.id,
      label: <span className="text-muted-foreground">Nicht mehr vorhanden</span>,
      detail: <span className="font-mono text-[11px] break-all">{entity.id}</span>,
      value: entity.count,
    };
  }
  const resolved = { id: entity.id, kind, url: entity.url };
  return {
    key: entity.id,
    label: entity.name,
    value: entity.count,
    href: entityEditorHref(resolved),
    actions: (
      <PublicLink href={entityPublicHref(resolved)} label={`${entity.name} auf park.fan öffnen`} />
    ),
  };
}

/**
 * A report's ranking of parks or rides as a panel: each name leads into its editor and the
 * symbol beside it to its page, an id no table knows any more reads „Nicht mehr vorhanden".
 */
export function RankedEntitiesPanel({
  icon,
  title,
  hint,
  entities,
  kind,
  unit,
  empty,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  entities: readonly RankedEntity[];
  kind: 'park' | 'attraction';
  /** What a count counts, for the column's accessible name. */
  unit: string;
  /** The line shown while nothing is ranked. */
  empty: string;
}) {
  return (
    <Panel>
      <PanelHeader icon={icon} title={title} hint={hint} />
      <PanelBody>
        {entities.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">{empty}</p>
        ) : (
          <BarList unit={unit} rows={entities.map((entity) => entityRow(entity, kind))} />
        )}
      </PanelBody>
    </Panel>
  );
}
