import { getTranslations } from 'next-intl/server';
import { CircleHelp } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { FaqList } from '@/components/marketing/editorial-ui';
import { STORY_SECTION_TINTED } from './section-chrome';

/**
 * The homepage FAQ, visible, and the page's only `FAQPage` markup: {@link FaqList} emits it from
 * the same array it renders, so the markup cannot drift from the page. The questions come from
 * `seo.homepage.faq`, translated in all six locales.
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
    <section className={STORY_SECTION_TINTED}>
      <div className="container mx-auto">
        <Reveal containsGlass>
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
