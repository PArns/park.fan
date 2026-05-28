'use client';

import Link from 'next/link';
import {
  Activity,
  Brain,
  Cpu,
  FerrisWheel,
  Gauge,
  MapPin,
  TimerReset,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useAdminFetch } from './_lib/admin-context';
import {
  CrowdBadge,
  ErrorPanel,
  KeyVal,
  LoadingPanel,
  Section,
  StatCard,
  StatusBadge,
  maeColor,
} from './_lib/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SystemHealthResponse } from '@/lib/api/admin';
import type { AnalyticsRealtime, MlHealth, RealtimeRide } from '@/lib/api/admin-stats';

function RidePanel({ title, ride }: { title: string; ride: RealtimeRide }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <Link href={ride.url} className="hover:text-primary block truncate font-semibold">
          {ride.name}
        </Link>
        <p className="text-muted-foreground truncate text-xs">{ride.parkName}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-2xl font-bold tabular-nums">{ride.waitTime}&apos;</span>
          <CrowdBadge level={ride.crowdLevel} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const health = useAdminFetch<SystemHealthResponse>('/api/admin/system-health', true);
  const realtime = useAdminFetch<AnalyticsRealtime>('/api/analytics/realtime');
  const ml = useAdminFetch<MlHealth>('/api/ml/health');

  if (health.error) return <ErrorPanel message={`System health: ${health.error}`} />;
  if (!health.data || !realtime.data) return <LoadingPanel label="Loading dashboard…" />;

  const h = health.data;
  const rt = realtime.data;
  const counts = rt.counts;

  return (
    <>
      <Section icon={Gauge} title="At a glance">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            icon={MapPin}
            label="Open Parks"
            value={counts.openParks}
            sub={`of ${counts.parks} total`}
          />
          <StatCard
            icon={FerrisWheel}
            label="Open Rides"
            value={counts.openAttractions}
            sub={`of ${counts.attractions} total`}
          />
          <StatCard
            icon={TimerReset}
            label="Total Wait"
            value={`${counts.totalWaitTime.toLocaleString('en-GB')}'`}
            sub="across open rides"
          />
          <StatCard
            icon={Brain}
            label="Model MAE"
            value={ml.data ? ml.data.model.metrics.mae.toFixed(1) : '—'}
            valueClass={ml.data ? maeColor(ml.data.model.metrics.mae) : undefined}
            sub={ml.data ? `v${ml.data.model.version}` : 'loading'}
          />
          <StatCard
            icon={Activity}
            label="Queue Records"
            value={counts.queueDataRecords.toLocaleString('en-GB')}
            sub="live samples"
          />
        </div>
      </Section>

      <Section icon={Cpu} title="Health">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status="API operational" />
          <StatusBadge status={h.postgres.status} />
          <StatusBadge status={`Redis ${h.redis.status}`} />
          {ml.data && <StatusBadge status={ml.data.status} />}
          <span className="text-muted-foreground ml-1 text-xs">
            CPU {h.host.cpu.loadPct ?? '—'}% · Mem {h.host.memory.usedPct}%
          </span>
          <Link
            href="/admin/system"
            className="text-primary ml-auto text-xs font-medium hover:underline"
          >
            System details →
          </Link>
        </div>
      </Section>

      <Section icon={TrendingUp} title="Live extremes">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Most crowded park
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Link
                href={rt.mostCrowdedPark.url}
                className="hover:text-primary block truncate font-semibold"
              >
                {rt.mostCrowdedPark.name}
              </Link>
              <p className="text-muted-foreground truncate text-xs">
                {rt.mostCrowdedPark.city}, {rt.mostCrowdedPark.country}
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-bold tabular-nums">
                  {rt.mostCrowdedPark.averageWaitTime}&apos;
                </span>
                <CrowdBadge level={rt.mostCrowdedPark.crowdLevel} />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Least crowded park
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Link
                href={rt.leastCrowdedPark.url}
                className="hover:text-primary block truncate font-semibold"
              >
                {rt.leastCrowdedPark.name}
              </Link>
              <p className="text-muted-foreground truncate text-xs">
                {rt.leastCrowdedPark.city}, {rt.leastCrowdedPark.country}
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-bold tabular-nums">
                  {rt.leastCrowdedPark.averageWaitTime}&apos;
                </span>
                <CrowdBadge level={rt.leastCrowdedPark.crowdLevel} />
              </div>
            </CardContent>
          </Card>
          <RidePanel title="Longest wait ride" ride={rt.longestWaitRide} />
          <RidePanel title="Shortest wait ride" ride={rt.shortestWaitRide} />
        </div>
      </Section>

      <Section icon={Zap} title="Throughput">
        <div className="border-border/60 bg-card grid grid-cols-2 gap-3 rounded-lg border p-4 sm:grid-cols-4">
          <KeyVal label="Shows" value={counts.shows.toLocaleString('en-GB')} />
          <KeyVal label="Restaurants" value={counts.restaurants.toLocaleString('en-GB')} />
          <KeyVal label="DB Cache Hit" value={`${h.postgres.cacheHitPct?.toFixed(1) ?? '—'}%`} />
          <KeyVal label="Redis Hit Rate" value={`${h.redis.hitRatePct?.toFixed(1) ?? '—'}%`} />
        </div>
      </Section>
    </>
  );
}
