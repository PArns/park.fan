'use client';

import Link from 'next/link';
import { Activity, Globe, Radio } from 'lucide-react';
import { useAdminFetch } from '../_lib/admin-context';
import { CrowdBadge, ErrorPanel, LoadingPanel, Section, StatCard } from '../_lib/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsGeoLive, AnalyticsRealtime, AnalyticsTicker } from '@/lib/api/admin-stats';

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

  if (realtime.error) return <ErrorPanel message={`Realtime: ${realtime.error}`} />;
  if (!realtime.data) return <LoadingPanel label="Loading analytics…" />;

  const c = realtime.data.counts;

  return (
    <>
      <Section icon={Activity} title="Realtime counts">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Open parks" value={c.openParks} sub={`of ${c.parks}`} />
          <StatCard label="Open rides" value={c.openAttractions} sub={`of ${c.attractions}`} />
          <StatCard label="Shows" value={c.shows} />
          <StatCard label="Restaurants" value={c.restaurants} />
          <StatCard label="Total wait" value={`${c.totalWaitTime.toLocaleString('en-GB')}'`} />
          <StatCard label="Queue records" value={c.queueDataRecords.toLocaleString('en-GB')} />
        </div>
      </Section>

      <Section icon={Globe} title="Geographic activity">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(geo.data?.continents ?? []).map((cont) => (
            <Card key={cont.slug} className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm capitalize">
                  {cont.slug.replace(/-/g, ' ')}
                  <span className="text-primary font-mono tabular-nums">{cont.openParkCount}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {cont.countries
                  .slice()
                  .sort((a, b) => b.openParkCount - a.openParkCount)
                  .slice(0, 6)
                  .map((country) => (
                    <div
                      key={country.slug}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground capitalize">
                        {country.slug.replace(/-/g, ' ')}
                      </span>
                      <span className="font-mono tabular-nums">{country.openParkCount}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section icon={Radio} title="Live ticker">
        <Card className="border-border/60">
          <CardContent className="divide-border/40 divide-y pt-2">
            {(ticker.data?.items ?? []).slice(0, 25).map((item, i) => (
              <Link
                key={`${item.attractionSlug}-${i}`}
                href={item.url}
                className="hover:bg-card/60 -mx-2 flex items-center gap-3 px-2 py-1.5 text-sm"
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
                  <CrowdBadge level={item.crowdLevel} />
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
        {ticker.data && (
          <p className="text-muted-foreground text-right text-xs">
            Generated {new Date(ticker.data.generatedAt).toLocaleTimeString('en-GB')}
          </p>
        )}
      </Section>
    </>
  );
}
