'use client';

import Link from 'next/link';
import { ExternalLink, Pencil } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import {
  BREAKDOWN_PANELS,
  breakdownDetail,
  breakdownValueLabel,
  formatCount,
  formatShare,
  isFilterDimension,
  pathEditorHref,
  referrerHref,
  VISIT_DIMENSIONS,
} from '@/lib/admin/site-analytics';
import type {
  BreakdownDimension,
  BreakdownItem,
  BreakdownMeasure,
  BreakdownResponse,
} from '@/lib/api/admin-site-analytics';
import { BarList, type BarRow } from '../../_ui/charts';
import { ErrorState, Panel, PanelBody, PanelHeader, SkeletonRows } from '../../_ui/primitives';
import {
  useTrafficData,
  type TrafficFilterActions,
  type TrafficFilters,
} from '../_lib/use-traffic';
import { HourlyNotice } from './hourly-notice';

type PanelFilters = TrafficFilters & TrafficFilterActions;

/** The small link beside a row: an icon that is a way out of the filter and into the site. */
export function RowLink({
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

/** What the counts of a breakdown are called, by what the API says it counted. */
export const MEASURE_UNIT: Record<BreakdownMeasure, string> = {
  views: 'Aufrufe',
  visits: 'Besuche',
  exits: 'Ausstiege',
};

/**
 * A row of a breakdown: pressing it filters the whole page by that value (a language sets the
 * language switch; the exit page is no filter, since a visit's last page is known only when it
 * ends), and a page, an entry or exit page or a referrer carries a way out to the site as well, the
 * park or ride behind a path also to its editor. The line under the label says what the dimension
 * adds: visitors for a country, device, browser, system or channel, bounce rate and visit duration
 * for where a visit began, time on the page and exits for a page.
 */
export function breakdownRow(
  dim: BreakdownDimension,
  item: BreakdownItem,
  filters: PanelFilters
): BarRow {
  const held =
    dim === 'locale' ? filters.locale : filters.filters.find((filter) => filter.dim === dim)?.value;
  const row: BarRow = {
    key: item.value,
    label: breakdownValueLabel(dim, item.value),
    value: item.views,
    share: item.share,
    detail: breakdownDetail(dim, item),
  };
  if (dim === 'locale') {
    row.active = held === item.value;
    row.onSelect = () =>
      filters.setLocale(filters.locale === item.value ? null : (item.value as Locale));
  } else if (isFilterDimension(dim)) {
    row.active = held === item.value;
    row.onSelect = () => filters.toggleFilter(dim, item.value);
  }
  if (dim === 'path' || dim === 'entry' || dim === 'exit') {
    const editor = pathEditorHref(item.value);
    return {
      ...row,
      startTruncate: true,
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
    const href = referrerHref(item.value);
    return {
      ...row,
      actions: href && (
        <RowLink href={href} label="Website öffnen" external>
          <ExternalLink className="h-3 w-3" />
        </RowLink>
      ),
    };
  }
  return row;
}

/**
 * One breakdown of the window: the biggest values of a dimension with bar, count and share, and
 * for the dimensions that start a visit (entry page, referrer, channel) the bounce
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
  // What was counted is the API's to say: a page list under a filter on how a visit began counts
  // the visits that entered there, and the panel says so.
  const measure: BreakdownMeasure =
    data?.measure ??
    (dim === 'exit' ? 'exits' : VISIT_DIMENSIONS.includes(dim) ? 'visits' : 'views');
  const unit = MEASURE_UNIT[measure];
  const visitsOfPages =
    measure === 'visits' && !VISIT_DIMENSIONS.includes(dim)
      ? 'Besuche, nach ihrer ersten Seite gezählt'
      : null;
  const withoutReferrer =
    data && dim === 'referrer'
      ? Math.max(0, data.total.views - data.items.reduce((sum, item) => sum + item.views, 0))
      : 0;

  return (
    <Panel>
      <PanelHeader
        title={title}
        hint={visitsOfPages ? `${hint}. ${visitsOfPages}` : hint}
        action={<span className="text-muted-foreground text-[11px]">{unit}</span>}
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
            unit={unit}
          />
          {dim === 'referrer' && withoutReferrer > 0 && (
            <p className="text-muted-foreground mt-3 text-[11px]">
              Ohne Herkunft (direkt, aus der eigenen Seite oder darunter):{' '}
              {formatCount(withoutReferrer)} Besuche (
              {formatShare(data.total.views > 0 ? withoutReferrer / data.total.views : 0)})
            </p>
          )}
          <HourlyNotice data={data} />
        </PanelBody>
      )}
    </Panel>
  );
}
