'use client';

import Link from 'next/link';
import { Radio, TrendingUp } from 'lucide-react';
import { formatCount } from '@/lib/admin/site-analytics';
import { CATEGORICAL, Sparkline } from '../../_ui/charts';
import { Panel, PanelBody, PanelHeader } from '../../_ui/primitives';
import { useRealtimeOverview } from '../_lib/use-traffic';

/**
 * The admin home's window onto the traffic page: visitors today, how many are on the site right
 * now and a line of the last half hour. The whole panel leads to Traffic, the active count to the
 * live view.
 */
export function TrafficTodayTile() {
  const { data, error } = useRealtimeOverview();

  return (
    <Panel className="hover:border-primary/40 transition-colors">
      <PanelHeader
        icon={TrendingUp}
        title={
          // The link's box covers the whole tile, so the tile reads as one link with the live line above it.
          <Link href="/admin/traffic" className="after:absolute after:inset-0 after:rounded-xl">
            Besucher heute
          </Link>
        }
        hint="Aus dem eigenen Zähler, UTC-Tag"
        action={<span className="text-primary text-xs">Traffic</span>}
      />
      <PanelBody className="space-y-2">
        {data ? (
          <>
            <div className="flex items-end justify-between gap-3">
              <span className="text-3xl font-bold tabular-nums">
                {data.totals.visitors === null ? '–' : formatCount(data.totals.visitors)}
              </span>
              <Sparkline
                values={data.realtime.perMinute.map((minute) => minute.pageviews)}
                color={CATEGORICAL[2]}
              />
            </div>
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs tabular-nums">
              <Link
                href="/admin/traffic/live"
                className="hover:text-primary relative z-10 inline-flex items-center gap-1.5 transition-colors max-sm:min-h-9"
              >
                <Radio className="text-primary h-3 w-3" aria-hidden="true" />
                {formatCount(data.realtime.activeVisitors)} aktiv jetzt, live ansehen
              </Link>
              <span aria-hidden="true">·</span>
              {formatCount(data.totals.pageviews)} Aufrufe
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-xs">
            {error ? 'Der Zähler antwortet nicht.' : 'Lädt…'}
          </p>
        )}
      </PanelBody>
    </Panel>
  );
}
