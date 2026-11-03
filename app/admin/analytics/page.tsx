'use client';

import Link from 'next/link';
import { Activity, Globe, Radio } from 'lucide-react';
import { useAdminFetch } from '../_lib/admin-context';
import type { AnalyticsGeoLive, AnalyticsRealtime, AnalyticsTicker } from '@/lib/api/admin-stats';
import {
  AdminPage,
  Chip,
  ErrorState,
  LoadingState,
  Panel,
  PanelBody,
  PanelHeader,
  StatTile,
  Tile,
  crowdChipClass,
} from '../_ui/primitives';

const TREND_ICON: Record<string, string> = { rising: '▲', falling: '▼', stable: '·' };
const TREND_COLOR: Record<string, string> = {
  rising: 'text-red-400',
  falling: 'text-emerald-400',
  stable: 'text-muted-foreground',
};

export default function AnalyticsPage() {
  const realtime = useAdminFetch<AnalyticsRealtime>('/api/analytics/realtime');
  const ticker = useAdminFetch<AnalyticsTicker>('/api/analytics/ticker');
  const geo = useAdminFetch<AnalyticsGeoLive>('/api/analytics/geo-live');

  if (realtime.error) return <ErrorState message={`Realtime: ${realtime.error}`} />;
  if (!realtime.data) return <LoadingState label="Live-Zahlen werden geladen…" />;

  const c = realtime.data.counts;

  return (
    <AdminPage width="wide">
      <Panel>
        <PanelHeader icon={Activity} title="Gerade in den Parks" />
        <PanelBody className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Offene Parks" value={c.openParks} sub={`von ${c.parks}`} />
          <StatTile label="Offene Bahnen" value={c.openAttractions} sub={`von ${c.attractions}`} />
          <StatTile label="Shows" value={c.shows} />
          <StatTile label="Restaurants" value={c.restaurants} />
          <StatTile
            label="Wartezeit gesamt"
            value={`${c.totalWaitTime.toLocaleString('de-DE')}'`}
          />
          <StatTile label="Wartezeit-Zeilen" value={c.queueDataRecords.toLocaleString('de-DE')} />
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader icon={Globe} title="Nach Regionen" />
        <PanelBody className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(geo.data?.continents ?? []).map((cont) => (
            <Tile
              key={cont.slug}
              title={<span className="capitalize">{cont.slug.replace(/-/g, ' ')}</span>}
              action={
                <span className="text-primary font-mono text-sm tabular-nums">
                  {cont.openParkCount}
                </span>
              }
            >
              <div className="space-y-1">
                {cont.countries
                  .slice()
                  .sort((a, b) => b.openParkCount - a.openParkCount)
                  .slice(0, 6)
                  .map((country) => (
                    <div key={country.slug} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground capitalize">
                        {country.slug.replace(/-/g, ' ')}
                      </span>
                      <span className="font-mono tabular-nums">{country.openParkCount}</span>
                    </div>
                  ))}
              </div>
            </Tile>
          ))}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          icon={Radio}
          title="Live-Ticker"
          hint={
            ticker.data
              ? `Stand ${new Date(ticker.data.generatedAt).toLocaleTimeString('de-DE')}`
              : undefined
          }
        />
        <PanelBody className="divide-y divide-white/[0.05] py-2">
          {(ticker.data?.items ?? []).slice(0, 25).map((item, i) => (
            <Link
              key={`${item.attractionSlug}-${i}`}
              href={item.url}
              className="-mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-white/[0.04]"
            >
              <span className={`w-4 shrink-0 text-center ${TREND_COLOR[item.trend] ?? ''}`}>
                {TREND_ICON[item.trend] ?? '·'}
              </span>
              <span className="min-w-0 flex-1 truncate">{item.attractionName}</span>
              <span className="text-muted-foreground hidden truncate text-xs sm:block sm:w-40">
                {item.parkName}
              </span>
              <span className="w-12 shrink-0 text-right font-mono tabular-nums">
                {item.waitTime}&apos;
              </span>
              <span className="hidden shrink-0 sm:block">
                <Chip className={crowdChipClass(item.crowdLevel)}>
                  {item.crowdLevel?.replace(/_/g, ' ') ?? '—'}
                </Chip>
              </span>
            </Link>
          ))}
        </PanelBody>
      </Panel>
    </AdminPage>
  );
}
