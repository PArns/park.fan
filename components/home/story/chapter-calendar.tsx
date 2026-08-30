import { getTranslations } from 'next-intl/server';
import { ArrowRight, CalendarRange, CloudSun, Cpu, Database, Gauge } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { CompactNumberWithTooltip } from '@/components/common/compact-number-with-tooltip';
import { getGlobalStats } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import type { Locale } from '@/i18n/config';
import { getLeadPark } from './lead-park';

/**
 * Chapter: where a calendar day's colour comes from.
 *
 * The four pipeline steps each carry one figure, and only the two the platform
 * actually measures are read from the API (`queueDataRecords`, `attractions`).
 * The other two are properties of the system rather than readings — the polling
 * interval and the forecast horizon — so they are written out here next to the
 * step that owns them instead of being dressed up as live values.
 */
export async function ChapterCalendar({ locale }: { locale: string }) {
  const [t, stats, park] = await Promise.all([
    getTranslations('homeStory.calendar'),
    catchNonFatal(getGlobalStats()),
    getLeadPark(locale),
  ]);

  const steps = [
    {
      icon: Gauge,
      title: t('p1.title'),
      text: t('p1.text'),
      value: <span className="tabular-nums">5 Min</span>,
      label: t('p1.label'),
    },
    {
      icon: Database,
      title: t('p2.title'),
      text: t('p2.text'),
      value: stats ? <CompactNumberWithTooltip value={stats.counts.queueDataRecords} /> : null,
      label: t('p2.label'),
    },
    {
      icon: CloudSun,
      title: t('p3.title'),
      text: t('p3.text'),
      value: <span className="tabular-nums">14</span>,
      label: t('p3.label'),
    },
    {
      icon: Cpu,
      title: t('p4.title'),
      text: t('p4.text'),
      value: <span className="tabular-nums">365</span>,
      label: t('p4.label'),
    },
  ];

  return (
    <section className="border-border bg-muted/30 border-t px-4 py-16 sm:py-18">
      <div className="container mx-auto">
        <Reveal>
          <ChapterHeading
            variant="tile"
            icon={CalendarRange}
            kicker={t('kicker')}
            title={t('title')}
            hint={<GlossaryInject>{t('lead')}</GlossaryInject>}
            id="crowd-kalender"
          />
        </Reveal>

        <Reveal>
          <h3 className="text-xl font-semibold">
            <GlossaryInject noUnderline>{t('pipelineTitle')}</GlossaryInject>
          </h3>
          <p className="text-muted-foreground mt-1.5 max-w-3xl text-sm leading-relaxed">
            {t('pipelineLead')}
          </p>
        </Reveal>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text, value, label }, i) => (
            <Reveal key={title} delay={i * 70}>
              <div className="border-border bg-card/60 flex h-full flex-col rounded-2xl border p-5">
                <span className="bg-primary/10 text-primary mb-3 flex size-9 items-center justify-center rounded-xl">
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <h4 className="font-semibold">{title}</h4>
                <p className="text-muted-foreground mt-1.5 flex-1 text-sm leading-relaxed">
                  <GlossaryInject>{text}</GlossaryInject>
                </p>
                {value && (
                  <div className="border-border mt-4 border-t pt-3">
                    <div className="text-primary text-xl font-bold">{value}</div>
                    <div className="text-muted-foreground text-xs">{label}</div>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={80}>
          <p className="text-muted-foreground border-border mt-6 max-w-3xl border-l-2 pl-4 text-sm leading-relaxed">
            <GlossaryInject>{t('feedback')}</GlossaryInject>
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-8 max-w-3xl">
            <p className="text-muted-foreground leading-relaxed">
              <GlossaryInject>{t('body')}</GlossaryInject>
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {park && (
                <Link
                  href={park.href as '/'}
                  prefetch={false}
                  className="text-primary inline-flex items-center gap-1.5 font-semibold hover:underline"
                >
                  {t('cta')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
              <Link
                href={`/${BEST_TIME_SEGMENTS[locale as Locale]}` as '/'}
                prefetch={false}
                className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
              >
                {t('bestTimeLink')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
