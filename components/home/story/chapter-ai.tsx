import { getTranslations } from 'next-intl/server';
import { Ban, Cpu, Minus, TriangleAlert } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { MLStatsSection } from '@/components/home/ml-stats-section';

/**
 * Chapter: the forecast, and what the rest of the market does instead.
 *
 * Three competitor cards, then the claim, then {@link MLStatsSection} in its
 * `bare` variant as the evidence. The order is the argument: every card names
 * its own limit, all three limits are the same one (nobody publishes an error),
 * and the block underneath is this site publishing its error. That only works if
 * the numbers below are the live ones — they are, straight off `/v1/ml/dashboard`,
 * which is also why no sentence here quotes a figure it renders.
 *
 * The competitors are described by approach, not by name: the shapes are stable,
 * a particular site's product is not, and a page that names a rival ages into a
 * claim about them that nobody re-checks.
 */
export async function ChapterAI() {
  const t = await getTranslations('homeStory.ai');

  const approaches = [
    {
      icon: Ban,
      kicker: t('c1.kicker'),
      title: t('c1.title'),
      text: t('c1.text'),
      limit: t('c1.limit'),
    },
    {
      icon: Minus,
      kicker: t('c2.kicker'),
      title: t('c2.title'),
      text: t('c2.text'),
      limit: t('c2.limit'),
    },
    {
      icon: TriangleAlert,
      kicker: t('c3.kicker'),
      title: t('c3.title'),
      text: t('c3.text'),
      limit: t('c3.limit'),
    },
  ];

  return (
    <section className="px-4 py-16 sm:py-18">
      <div className="container mx-auto">
        <Reveal>
          <ChapterHeading
            variant="tile"
            icon={Cpu}
            kicker={t('kicker')}
            title={t('title')}
            hint={<GlossaryInject>{t('lead')}</GlossaryInject>}
            id="ki-prognose"
          />
        </Reveal>

        <Reveal>
          <h3 className="text-xl font-semibold">{t('compareTitle')}</h3>
          <p className="text-muted-foreground mt-1.5 max-w-3xl text-sm leading-relaxed">
            {t('compareLead')}
          </p>
        </Reveal>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {approaches.map(({ icon: Icon, kicker, title, text, limit }, i) => (
            <Reveal key={title} delay={i * 70}>
              <div className="border-border bg-card/55 flex h-full flex-col rounded-2xl border p-5">
                <div className="text-muted-foreground flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {kicker}
                </div>
                <h4 className="mt-2.5 font-semibold">{title}</h4>
                <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">
                  <GlossaryInject>{text}</GlossaryInject>
                </p>
                <p className="border-border text-muted-foreground mt-4 border-t pt-3 text-xs italic">
                  {limit}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={80}>
          <div className="border-primary/25 bg-primary/[0.06] mt-8 rounded-2xl border p-6 sm:p-7">
            <h3 className="text-xl font-bold text-balance sm:text-2xl">
              <GlossaryInject noUnderline>{t('answerTitle')}</GlossaryInject>
            </h3>
            <p className="text-muted-foreground mt-2.5 max-w-3xl leading-relaxed">
              <GlossaryInject>{t('answerText')}</GlossaryInject>
            </p>
          </div>
        </Reveal>

        <div className="mt-8">
          <MLStatsSection variant="bare" linkToFancast />
        </div>
      </div>
    </section>
  );
}
