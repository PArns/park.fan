import { getTranslations } from 'next-intl/server';
import {
  ArrowRight,
  BookOpen,
  CircleCheckBig,
  Cpu,
  Gauge,
  Globe,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import type { Locale } from '@/i18n/config';

/**
 * The six differentiators, and the two pages that back them up.
 *
 * Each reason is a claim this site has to be able to answer for, so the two that
 * are checkable link to where they are checked: the model's own scorecard
 * (`/fancast`) and the guide that walks a reader through a real wait time
 * (`/how-park-fan-works`). A page of claims with nothing to open is a brochure.
 */
export async function WhyParkFan({ locale }: { locale: Locale }) {
  const [t, tHome] = await Promise.all([getTranslations('homeStory.why'), getTranslations('home')]);

  const reasons = [
    { icon: Cpu, key: 'r1' },
    { icon: ShieldCheck, key: 'r2' },
    { icon: Gauge, key: 'r3' },
    { icon: CircleCheckBig, key: 'r4' },
    { icon: Globe, key: 'r5' },
    { icon: BookOpen, key: 'r6' },
  ] as const;

  return (
    <section className="border-border border-t px-4 py-16 sm:py-18">
      <div className="container mx-auto">
        <Reveal>
          <ChapterHeading
            variant="tile"
            icon={Sparkles}
            kicker={t('kicker')}
            title={t('title')}
            id="warum-park-fan"
          />
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map(({ icon: Icon, key }, i) => (
            <Reveal key={key} delay={i * 60}>
              <div className="border-border bg-card hover:border-primary/40 h-full rounded-2xl border p-5 shadow-sm transition-colors">
                <span className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-xl">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-semibold">{t(`${key}.title` as 'r1.title')}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  <GlossaryInject>{t(`${key}.text` as 'r1.text')}</GlossaryInject>
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/${HOWTO_SEGMENTS[locale]}` as '/'}
              prefetch={false}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              {tHome('about.howtoLink')}
            </Link>
            <Link
              href="/fancast"
              prefetch={false}
              className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {tHome('about.fancastLink')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
