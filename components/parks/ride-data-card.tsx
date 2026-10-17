import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
// Glossary URLs carry their own locale segment and are served by a next.config rewrite, so the i18n
// <Link> would prefix the locale twice (see `RideProfileSection`).
import Link from 'next/link';
import {
  CalendarDays,
  Gauge,
  Hourglass,
  RefreshCcw,
  Ruler,
  ScrollText,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { ChapterPanel } from '@/components/common/chapter-panel';
import { PANEL_CELL, PanelGrid, PanelMetric } from '@/components/parks/park-panel-cell';
import { RiderHeight, Speed, TrackLength } from '@/components/common/unit-display';
import { getListFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import type { RideSummary, RideSummaryMetric, RideSummaryType } from '@/lib/parks/ride-summary';

/** A figure inside the running text: the fact carries the weight, the sentence around it the sense. */
const FIGURE = 'text-foreground font-semibold tabular-nums';

const METRIC_ICON: Record<RideSummaryMetric['key'], LucideIcon> = {
  typicalPeak: Hourglass,
  record: Trophy,
  topSpeed: Gauge,
  opened: CalendarDays,
  minHeight: Ruler,
  inversions: RefreshCcw,
};

interface RideDataCardProps {
  attractionName: string;
  locale: string;
  summary: RideSummary;
  typeTerm: RideSummaryType | null;
}

/**
 * The ride page's data card: a paragraph built from the ride's own day-stable facts, with its key
 * figures set large beside it. Server-rendered and never hydrated, so the text is in the HTML at
 * any hour and cannot mismatch. The caller gates it with `rideSummaryRenders`.
 */
export async function RideDataCard({
  attractionName,
  locale,
  summary,
  typeTerm,
}: RideDataCardProps) {
  const t = await getTranslations('attraction.dataCard');
  const tProfile = await getTranslations('attraction.rideProfile');
  const { figures, metrics } = summary;

  const strong = (node: ReactNode) => <strong className={FIGURE}>{node}</strong>;
  const tags = {
    b: (chunks: ReactNode) => strong(chunks),
    type: (chunks: ReactNode) =>
      typeTerm ? (
        <Link
          href={typeTerm.href}
          prefetch={false}
          className="text-foreground decoration-primary/40 hover:text-primary hover:decoration-primary font-medium underline underline-offset-2 transition-colors"
        >
          {chunks}
        </Link>
      ) : (
        chunks
      ),
    minHeight: () =>
      figures.minHeightCm != null ? strong(<RiderHeight cm={figures.minHeightCm} />) : null,
    maxHeight: () =>
      figures.maxHeightCm != null ? strong(<RiderHeight cm={figures.maxHeightCm} />) : null,
    speed: () => (figures.speedKmh != null ? strong(<Speed kmh={figures.speedKmh} />) : null),
    height: () =>
      figures.heightM != null ? strong(<TrackLength meters={figures.heightM} />) : null,
    length: () =>
      figures.lengthM != null ? strong(<TrackLength meters={figures.lengthM} />) : null,
  };

  // The stats fragments are joined by the locale's own list pattern („a, b and c" / „a, b et c"),
  // which `formatToParts` hands back with each fragment's position marked.
  const fragments = summary.stats.map((stat) =>
    t.rich(`stat.${stat.key}`, { ...stat.values, ...tags })
  );
  let fragmentIndex = 0;
  const statsList = getListFormat(locale, { type: 'conjunction' })
    .formatToParts(fragments.map((_, i) => String(i)))
    .map((part, i) =>
      part.type === 'element' ? <span key={i}>{fragments[fragmentIndex++]}</span> : part.value
    );

  const hint = summary.sentences.find((s) => s.key === 'typical')?.values.days;

  return (
    <ChapterPanel
      icon={ScrollText}
      title={t('title', { attraction: attractionName })}
      hint={hint != null ? t('hint', { days: hint }) : undefined}
      id="facts"
      bodyPadding="none"
    >
      {/* Text first and wider; the figures take the narrower column on a tinted ground, the way
          the guide page parks one fact beside its intro. One column when there are no figures,
          so the paragraph never sits beside an empty cell. */}
      <PanelGrid
        columnCount={metrics.length > 0 ? 2 : 1}
        className={cn(
          metrics.length > 0 &&
            'sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @min-[1024px]/page:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'
        )}
      >
        <div className={PANEL_CELL}>
          <p className="text-foreground/85 max-w-3xl text-[15px] leading-relaxed">
            {summary.sentences.map((sentence, i) => (
              <span key={sentence.key}>
                {i > 0 && ' '}
                {sentence.key === 'stats'
                  ? t.rich('stats', { ...sentence.values, list: () => statsList })
                  : t.rich(sentence.key, { ...sentence.values, ...tags })}
              </span>
            ))}
          </p>
        </div>
        {metrics.length > 0 && (
          <div className={cn(PANEL_CELL, 'bg-primary/[0.04]')}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              {metrics.map((metric) => (
                <PanelMetric
                  key={metric.key}
                  caption={metricCaption(metric.key, t, tProfile)}
                  icon={METRIC_ICON[metric.key]}
                >
                  <span className="text-2xl leading-none font-bold tabular-nums">
                    {metricValue(metric, t('minUnit'))}
                  </span>
                  {metric.note && (
                    <span className="text-muted-foreground text-[11px]">{metric.note}</span>
                  )}
                </PanelMetric>
              ))}
            </div>
          </div>
        )}
      </PanelGrid>
    </ChapterPanel>
  );
}

type Translator = Awaited<ReturnType<typeof getTranslations>>;

/** The ride-profile chapter's own labels where it has one, so the two chapters name a figure alike. */
function metricCaption(key: RideSummaryMetric['key'], t: Translator, tProfile: Translator): string {
  switch (key) {
    case 'topSpeed':
      return tProfile('topSpeed');
    case 'opened':
      return tProfile('opened');
    case 'inversions':
      return tProfile('inversions');
    default:
      return t(`metric.${key}`);
  }
}

function metricValue(metric: RideSummaryMetric, minUnit: string): ReactNode {
  switch (metric.unit) {
    case 'minutes':
      return (
        <>
          {metric.value}
          <span className="text-muted-foreground ml-1 text-xs font-medium">{minUnit}</span>
        </>
      );
    case 'kmh':
      return <Speed kmh={metric.value} />;
    case 'cm':
      return <RiderHeight cm={metric.value} />;
    default:
      return metric.value;
  }
}
