import { getTranslations } from 'next-intl/server';
import { CircleHelp } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { FaqList } from '@/components/marketing/editorial-ui';

/**
 * The homepage FAQ — visible, and the page's only `FAQPage` markup.
 *
 * The seven questions come from `seo.homepage.faq`, which existed long before
 * this section did and was rendered **only** as JSON-LD: seven answers a crawler
 * could read and no visitor could. That is the failure mode this codebase names
 * in its agent-readiness rules — two copies of one claim, one of them invisible
 * — except here there was only ever the invisible copy, so nothing kept it
 * honest.
 *
 * {@link FaqList} emits the `FAQPage` itself from the same array it renders, so
 * the markup cannot drift from the page. `HomepageFAQStructuredData` was
 * therefore dropped from `page.tsx` in the same change: two FAQPage blocks on
 * one URL is a worse answer than none.
 *
 * These keys are already translated in all six locales, which is why the FAQ is
 * the one part of the new homepage that is not German everywhere.
 */
export async function FaqSection() {
  const [t, tFaq] = await Promise.all([
    getTranslations('homeStory.faq'),
    getTranslations('seo.homepage.faq'),
  ]);

  const items = [
    { question: tFaq('whatIsQ'), answer: tFaq('whatIsA') },
    { question: tFaq('liveDataQ'), answer: tFaq('liveDataA') },
    { question: tFaq('whichParksQ'), answer: tFaq('whichParksA') },
    { question: tFaq('featuresQ'), answer: tFaq('featuresA') },
    { question: tFaq('favoritesQ'), answer: tFaq('favoritesA') },
    { question: tFaq('freeQ'), answer: tFaq('freeA') },
    { question: tFaq('mobileQ'), answer: tFaq('mobileA') },
  ];

  return (
    <section className="border-border bg-muted/30 border-t px-4 py-16 sm:py-18">
      <div className="container mx-auto">
        <Reveal>
          <ChapterHeading
            variant="tile"
            icon={CircleHelp}
            kicker={t('kicker')}
            title={t('title')}
            id="faq"
          />
        </Reveal>

        <Reveal>
          <FaqList items={items} />
          <p className="text-muted-foreground mt-6 text-xs">{t('note')}</p>
        </Reveal>
      </div>
    </section>
  );
}
