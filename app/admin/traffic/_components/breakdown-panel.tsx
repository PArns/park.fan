'use client';

import Link from 'next/link';
import { ExternalLink, Pencil } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import {
  BREAKDOWN_PANELS,
  breakdownValueLabel,
  formatCount,
  formatShare,
  pathEditorHref,
  VISIT_DIMENSIONS,
} from '@/lib/admin/site-analytics';
import type { BreakdownDimension, BreakdownResponse } from '@/lib/api/admin-site-analytics';
import { BarList, type BarRow } from '../../_ui/charts';
import { ErrorState, Panel, PanelBody, PanelHeader, SkeletonRows } from '../../_ui/primitives';
import {
  useTrafficData,
  type TrafficFilterActions,
  type TrafficFilters,
} from '../_lib/use-traffic';

type PanelFilters = TrafficFilters & TrafficFilterActions;

/** The small link beside a row: an icon that is a way out of the filter and into the site. */
function RowLink({
  href,
  label,
  external,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  const className =
    'text-muted-foreground hover:text-primary flex h-6 w-6 items-center justify-center rounded';
  return external ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={label}
      aria-label={label}
      className={className}
    >
      {children}
    </a>
  ) : (
    <Link href={href} title={label} aria-label={label} className={className}>
      {children}
    </Link>
  );
}

/**
 * A row of a breakdown: pressing it filters the whole page by that value (a language sets the
 * language switch), and a page, an entry page or a referrer carries a way out to the site as well,
 * the park or ride behind a path also to its editor.
 */
export function breakdownRow(
  dim: BreakdownDimension,
  item: BreakdownResponse['items'][number],
  filters: PanelFilters
): BarRow {
  const held =
    dim === 'locale' ? filters.locale : filters.filters.find((f) => f.dim === dim)?.value;
  const row: BarRow = {
    key: item.value,
    label: breakdownValueLabel(dim, item.value),
    value: item.views,
    share: item.share,
    active: held === item.value,
    onSelect:
      dim === 'locale'
        ? () => filters.setLocale(filters.locale === item.value ? null : (item.value as Locale))
        : () => filters.toggleFilter(dim, item.value),
  };
  const bounce =
    item.bounceRate !== undefined && VISIT_DIMENSIONS.includes(dim)
      ? `Absprung ${formatShare(item.bounceRate)}`
      : undefined;
  if (dim === 'path' || dim === 'entry') {
    const editor = pathEditorHref(item.value);
    return {
      ...row,
      startTruncate: true,
      detail: dim === 'path' ? `${formatCount(item.visits)} Besuche` : bounce,
      actions: (
        <>
          <RowLink href={item.value} label="Auf park.fan öffnen" external>
            <ExternalLink className="h-3 w-3" />
          </RowLink>
          {editor && (
            <RowLink href={editor} label="Im Editor öffnen">
              <Pencil className="h-3 w-3" />
            </RowLink>
          )}
        </>
      ),
    };
  }
  if (dim === 'referrer') {
    return {
      ...row,
      detail: bounce,
      actions: (
        <RowLink href={`https://${item.value}`} label="Website öffnen" external>
          <ExternalLink className="h-3 w-3" />
        </RowLink>
      ),
    };
  }
  return { ...row, detail: bounce };
}

/**
 * One breakdown of the window: the biggest values of a dimension with bar, count and share, and
 * for the dimensions that start a visit (entry page, referrer, channel, campaign) the bounce
 * rate. Every row is a filter switch for the page.
 */
export function BreakdownPanel({
  dim,
  filters,
  limit = 8,
}: {
  dim: BreakdownDimension;
  filters: PanelFilters;
  limit?: number;
}) {
  const { data, error, refetch } = useTrafficData<BreakdownResponse>('breakdown', filters, {
    dim,
    limit: 50,
  });
  const { title, hint } = BREAKDOWN_PANELS[dim];
  const startsVisits = VISIT_DIMENSIONS.includes(dim);
  const withoutReferrer =
    data && dim === 'referrer'
      ? Math.max(0, data.total.views - data.items.reduce((sum, item) => sum + item.views, 0))
      : 0;

  return (
    <Panel>
      <PanelHeader
        title={title}
        hint={hint}
        action={
          <span className="text-muted-foreground text-[11px]">
            {startsVisits ? 'Besuche' : 'Aufrufe'}
          </span>
        }
      />
      {!data && error ? (
        <ErrorState message={`${title}: ${error.message}`} onRetry={() => void refetch()} />
      ) : !data ? (
        <SkeletonRows rows={5} />
      ) : data.items.length === 0 ? (
        <PanelBody>
          <p className="text-muted-foreground py-6 text-center text-sm">Noch keine Daten</p>
        </PanelBody>
      ) : (
        <PanelBody>
          <BarList
            rows={data.items.map((item) => breakdownRow(dim, item, filters))}
            limit={limit}
            unit={startsVisits ? 'Besuche' : 'Aufrufe'}
          />
          {dim === 'referrer' && (
            <p className="text-muted-foreground mt-3 text-[11px]">
              Ohne Herkunft (direkt, aus der eigenen Seite oder darunter):{' '}
              {formatCount(withoutReferrer)} Besuche (
              {formatShare(data.total.views > 0 ? withoutReferrer / data.total.views : 0)})
            </p>
          )}
        </PanelBody>
      )}
    </Panel>
  );
}
