import { getTranslations } from 'next-intl/server';
import { Brain, Database, RefreshCw } from 'lucide-react';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { Card, CardContent } from '@/components/ui/card';
import { getMLDashboard, getMLMetricsHistory } from '@/lib/api/ml';
import { MLSparklineLoader } from './ml-sparkline-loader';
import { MLTrainingCountdown } from './ml-training-countdown';
import { cn } from '@/lib/utils';
import type { AccuracyBadge } from '@/lib/api/types';

function formatCompact(n: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

function getBadgeStyles(badge: AccuracyBadge) {
  switch (badge) {
    case 'excellent':
      return {
        dot: 'bg-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/40',
        glow: 'shadow-emerald-500/10',
      };
    case 'good':
      return {
        dot: 'bg-primary',
        text: 'text-primary',
        border: 'border-primary/40',
        glow: 'shadow-primary/10',
      };
    case 'fair':
      return {
        dot: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/40',
        glow: 'shadow-amber-500/10',
      };
    case 'poor':
      return {
        dot: 'bg-red-500',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-500/40',
        glow: 'shadow-red-500/10',
      };
    default:
      return {
        dot: 'bg-muted-foreground',
        text: 'text-muted-foreground',
        border: 'border-border',
        glow: '',
      };
  }
}

export async function MLStatsSection() {
  const [t, tCommon] = await Promise.all([getTranslations('home'), getTranslations('common')]);

  const [dashboard, metricsHistory] = await Promise.all([
    getMLDashboard().catch(() => null),
    getMLMetricsHistory().catch(() => null),
  ]);
  if (!dashboard) return null;

  const { performance, system } = dashboard;
  const history = metricsHistory?.history ?? [];
  const { live } = performance;

  // When badge is 'insufficient_data' the API may return zeroes for all metrics.
  // Guard against null/NaN before calling .toFixed() to avoid a runtime crash.
  const fmt1 = (n: number | null | undefined) => (n != null && isFinite(n) ? n.toFixed(1) : '—');
  const fmt2 = (n: number | null | undefined) => (n != null && isFinite(n) ? n.toFixed(2) : '—');
  const fmtPct = (n: number | null | undefined) =>
    n != null && isFinite(n) ? `${Math.round(n)}%` : '—';

  const styles = getBadgeStyles(live.badge);
  const badgeKey = live.badge as string;

  return (
    <section className="bg-muted/30 border-b px-4 py-14">
      <div className="container mx-auto">
        {/* Header */}
        <h2 className="mb-3 text-center text-2xl font-semibold">
          <GlossaryInject noUnderline>{t('ai.title')}</GlossaryInject>
        </h2>
        <p className="text-muted-foreground mx-auto mb-10 max-w-2xl text-center text-sm leading-relaxed">
          <GlossaryInject>{t('ai.subtitle')}</GlossaryInject>
        </p>

        {/* Top: Featured accuracy card + stats grid */}
        <div className="mb-10 grid gap-4 lg:grid-cols-2">
          {/* Featured accuracy card */}
          <Card
            className={cn(
              'border-2 py-0 shadow-lg',
              styles.border,
              styles.glow,
              'flex flex-col justify-between'
            )}
          >
            <CardContent className="flex flex-1 flex-col p-5">
              {/* Live badge pill */}
              <div className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 animate-pulse rounded-full', styles.dot)} />
                <Brain className={cn('h-4 w-4', styles.text)} />
                <span className={cn('text-sm font-semibold tracking-wide uppercase', styles.text)}>
                  {t(`ai.badge.${badgeKey}` as Parameters<typeof t>[0])}
                </span>
              </div>

              {/* Primary metric: MAE — grows to fill available space */}
              <div className="mt-4 flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold tabular-nums">±{fmt1(live.mae)}</span>
                  <span className="text-muted-foreground text-2xl font-light">
                    {tCommon('minutes')}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  <GlossaryInject>{t('ai.avgErrorDesc')}</GlossaryInject>
                </p>
                {history.length >= 2 && (
                  <div className="mt-3 h-[120px] overflow-hidden">
                    <MLSparklineLoader history={history} metric="mae" unit="min" />
                  </div>
                )}
              </div>

              {/* Sub-metrics: RMSE + MAPE — flush at bottom */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3">
                <div>
                  <div className="text-lg font-semibold tabular-nums">
                    ±{fmt1(live.rmse)}{' '}
                    <span className="text-muted-foreground text-sm font-normal">
                      {tCommon('minutes')}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    <GlossaryInject>{t('ai.rmseDesc')}</GlossaryInject>
                  </p>
                </div>
                <div>
                  <div className="text-lg font-semibold tabular-nums">
                    {fmt1(live.mape)}
                    <span className="text-muted-foreground text-sm font-normal">%</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    <GlossaryInject>{t('ai.mapeDesc')}</GlossaryInject>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2×2 stats grid */}
          <div className="grid grid-cols-2 content-start gap-4">
            <Card className="py-0">
              <div className="px-4 pt-3 pb-3">
                <p className="text-muted-foreground mb-1.5 text-sm font-medium">
                  {t('ai.totalPredictions')}
                </p>
                <div className="text-3xl font-bold">{formatCompact(live.totalPredictions)}</div>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {t('ai.totalPredictionsDesc')}
                </p>
              </div>
            </Card>
            <Card className="py-0">
              <div className="px-4 pt-3 pb-3">
                <p className="text-muted-foreground mb-1.5 text-sm font-medium">
                  {t('ai.coverage')}
                </p>
                <div className="text-3xl font-bold">{fmtPct(live.coveragePercent)}</div>
                <p className="text-muted-foreground mt-0.5 text-xs">{t('ai.coverageDesc')}</p>
              </div>
            </Card>
            <Card className="py-0">
              <div className="px-4 pt-3 pb-3">
                <p className="text-muted-foreground mb-1.5 text-sm font-medium">
                  {t('ai.parksCoverage')}
                </p>
                <div className="mb-1 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold">{live.uniqueParks}</span>
                  <span className="text-muted-foreground text-sm">{tCommon('parks')}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-semibold">{live.uniqueAttractions}</span>
                  <span className="text-muted-foreground text-sm">{tCommon('rides')}</span>
                </div>
              </div>
            </Card>
            <Card className="py-0">
              <div className="px-4 pt-3 pb-3">
                <p className="text-muted-foreground mb-1.5 text-sm font-medium">
                  {t('ai.r2Score')}
                </p>
                <div className="text-3xl font-bold">{fmt2(live.r2Score)}</div>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  <GlossaryInject>{t('ai.r2ScoreDesc')}</GlossaryInject>
                </p>
              </div>
            </Card>
            <MLTrainingCountdown modelAge={system.modelAge} />
          </div>
        </div>

        {/* Editorial explanation — 2 columns */}
        <div className="grid gap-8 border-t pt-10 md:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <Database className="text-primary h-4 w-4" />
              </div>
              <h3 className="font-semibold">
                <GlossaryInject noUnderline>{t('ai.howTitle')}</GlossaryInject>
              </h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              <GlossaryInject>{t('ai.howText')}</GlossaryInject>
            </p>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <RefreshCw className="text-primary h-4 w-4" />
              </div>
              <h3 className="font-semibold">
                <GlossaryInject noUnderline>{t('ai.improvingTitle')}</GlossaryInject>
              </h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              <GlossaryInject>{t('ai.improvingText')}</GlossaryInject>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
