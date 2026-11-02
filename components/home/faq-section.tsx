import { getTranslations } from 'next-intl/server';
import { CircleHelp } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { FaqList } from '@/components/marketing/editorial-ui';
import { howtoPath } from '@/lib/howto/segments';
import type { Locale } from '@/i18n/config';
import { HomeStop, StopLink } from './home-stop';

/**
 * The homepage FAQ, visible, and the page's only `FAQPage` markup: {@link FaqList} emits it from
 * the same array it renders, so the markup cannot drift from the page. The questions a first
 * visitor asks before anything else, the app one among them because „Wartezeiten App" is searched
 * for, from `seo.homepage.faq` in all six locales; the rest is on the guide page (`howtoPath`),
 * which the stop links.
 */
export async function FaqSection({
  locale,
  reverse = false,
}: {
  locale: Locale;
  reverse?: boolean;
}) {
  const [t, tFaq] = await Promise.all([
    getTranslations('homeStory.faq'),
    getTranslations('seo.homepage.faq'),
  ]);

  const items = [
    { question: tFaq('whatIsQ'), answer: tFaq('whatIsA') },
    { question: tFaq('liveDataQ'), answer: tFaq('liveDataA') },
    { question: tFaq('whichParksQ'), answer: tFaq('whichParksA') },
    { question: tFaq('freeQ'), answer: tFaq('freeA') },
    { question: tFaq('mobileQ'), answer: tFaq('mobileA') },
  ];

  return (
    <HomeStop
      divider
      reverse={reverse}
      heading={
        <ChapterHeading
          variant="stop"
          icon={CircleHelp}
          kicker={t('kicker')}
          title={t('title')}
          hint={t('lead')}
          id="faq"
          action={<StopLink href={howtoPath(locale)}>{t('link')}</StopLink>}
        />
      }
    >
      <Reveal>
        <FaqList items={items} />
        <p className="text-muted-foreground mt-6 text-xs">{t('note')}</p>
      </Reveal>
    </HomeStop>
  );
}
