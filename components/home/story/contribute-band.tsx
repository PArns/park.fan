import { getTranslations } from 'next-intl/server';
import { ArrowRight, ImageUp } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Reveal } from '@/components/marketing/scroll-reveal';

/**
 * The last band before the footer: the one thing a reader can give back.
 *
 * `/contribute` had a footer link and nothing else pointing at it. It sits at
 * the end deliberately — asking for a photo before the page has explained what
 * the site does is asking a stranger for a favour.
 *
 * Full card fill rather than the `bg-card/60` the tinted chapters use: this band
 * sits on an untinted section, where `--card` at 60 % composites to within a
 * hundredth of a step of `--background` and the box sinks into the page instead
 * of sitting on it (the same trap `PANEL_FLAT` documents).
 */
export async function ContributeBand() {
  const t = await getTranslations('homeStory.contribute');

  return (
    <section className="px-4 pb-16">
      <div className="container mx-auto">
        <Reveal>
          <div className="border-border bg-card flex flex-col gap-5 rounded-2xl border p-6 shadow-lg sm:flex-row sm:items-center sm:p-7">
            <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
              <ImageUp className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold">{t('title')}</h2>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{t('text')}</p>
            </div>
            <Link
              href="/contribute"
              prefetch={false}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex shrink-0 items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
            >
              {t('cta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
