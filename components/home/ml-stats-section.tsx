import { getLocale, getTranslations } from 'next-intl/server';
import { Brain, Database, RefreshCw, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { Card, CardContent } from '@/components/ui/card';
import { getMLDashboard, getMLMetricsHistory } from '@/lib/api/ml';
import { MLSparklineLoader } from './ml-sparkline-loader';
import { MLTrainingCountdown } from './ml-training-countdown';
import { cn } from '@/lib/utils';
import { LiveDot } from '@/components/common/live-dot';
import { accuracyStyle } from '@/lib/utils/accuracy-styles';
import { formatCompact } from '@/lib/utils/number-utils';

function getR2Color(r2: number | null | undefined) {
  if (r2 == null || !isFinite(r2)) return 'text-foreground';
  if (r2 > 0.8) return 'text-status-operating';
  if (r2 > 0.6) return 'text-status-down';
  return 'text-destructive';
}

interface MLStatsSectionProps {
  linkToFancast?: boolean;
  /**
   * `section` (default) is the band `/fancast` renders in its chapter 01, with its own `<section>`,
   * H3 and intro. `bare` returns the metric grid alone for a caller that already opened the
   * chapter (the homepage story's AI chapter), where a second heading would repeat the sentence
   * above it.
   */
  variant?: 'section' | 'bare';
}

/**
 * The prediction model's live scorecard: mean error with a sparkline, RMSE, MAPE, R², prediction
 * count, coverage and the retraining countdown. Server Component; renders nothing when the ML
 * dashboard API fails.
 */
export async function MLStatsSection({
  linkToFancast = false,
  variant = 'section',
}: MLStatsSectionProps = {}) {
  const [t, tCommon, locale] = await Promise.all([
    getTranslations('home'),
    getTranslations('common'),
    getLocale(),
  ]);

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

  const styles = accuracyStyle(live.badge);
  const badgeKey = live.badge as string;

  const body = (
    <>
      {variant === 'section' && (
        <>
          <div className="mb-3 flex items-center gap-2">
            <Brain className="text-primary h-5 w-5" />
            <h3 className="text-xl font-bold">
              <GlossaryInject noUnderline>{t('ai.title')}</GlossaryInject>
            </h3>
          </div>
          <p className="text-muted-foreground mb-10 text-sm leading-relaxed">
            <GlossaryInject>{t('ai.subtitle')}</GlossaryInject>
          </p>
        </>
      )}

      <div className="mb-10 grid gap-4 lg:grid-cols-2">
        <Card
          className={cn(
            'border-2 py-0 shadow-lg',
            styles.border,
            styles.glow,
            'flex flex-col justify-between'
          )}
        >
          <CardContent className="flex flex-1 flex-col p-5">
            <div className="flex items-center gap-2">
              {/* Static: the card carries `backdrop-filter`, and an endless pulse inside one
                  dirties the blurred region every frame (see `LiveDot`). */}
              <LiveDot showPing={false} size="h-2.5 w-2.5" color={styles.dot} />
              <Brain className={cn('h-4 w-4', styles.text)} />
              <span className={cn('text-sm font-semibold tracking-wide uppercase', styles.text)}>
                {t(`ai.badge.${badgeKey}` as Parameters<typeof t>[0])}
              </span>
            </div>

            <div className="mt-4 flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className={cn('text-6xl font-bold tabular-nums', styles.text)}>
                  ±{fmt1(live.mae)}
                </span>
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
                  <span className="text-muted-foreground text-sm font-normal"> %</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  <GlossaryInject>{t('ai.mapeDesc')}</GlossaryInject>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 content-start gap-4">
          <Card className="py-0">
            <div className="px-4 pt-3 pb-3">
              <p className="text-muted-foreground mb-1.5 text-sm font-medium">
                {t('ai.totalPredictions')}
              </p>
              <div className="text-3xl font-bold">
                {formatCompact(live.totalPredictions, locale)}
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">{t('ai.totalPredictionsDesc')}</p>
            </div>
          </Card>
          <Card className="py-0">
            <div className="px-4 pt-3 pb-3">
              <p className="text-muted-foreground mb-1.5 text-sm font-medium">{t('ai.coverage')}</p>
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
              <p className="text-muted-foreground mb-1.5 text-sm font-medium">{t('ai.r2Score')}</p>
              <div className={cn('text-3xl font-bold', getR2Color(live.r2Score))}>
                {fmt2(live.r2Score)}
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                <GlossaryInject>{t('ai.r2ScoreDesc')}</GlossaryInject>
              </p>
            </div>
          </Card>
          <MLTrainingCountdown modelAge={system.modelAge} />
        </div>
      </div>

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

      {linkToFancast && (
        <div className="mt-8 flex justify-center border-t pt-8">
          <Link
            href="/fancast"
            className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
          >
            {t('ai.fancastLink')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </>
  );

  if (variant === 'bare') return body;

  return (
    <section className="bg-muted/30 px-4 py-14">
      <div className="container mx-auto">{body}</div>
    </section>
  );
}
