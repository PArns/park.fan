import { getTranslations } from 'next-intl/server';
import { Navigation } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { HomeLocationRow } from '@/components/home/home-location-row';
import { NEARBY_CHAPTER_ID } from '@/lib/home/hero-search';
import { HomeStop, StopLink } from './home-stop';

/**
 * The stop around the nearby-parks card, which comes in as a slot (a Client Component the caller
 * already dynamic-imports). The stop holds the `<h2>`: the card opens with a band label, not a
 * chapter header. Under the lead sits `HomeLocationRow`, at one fixed height in every state.
 */
export async function NearbyChapter({
  children,
  reverse = false,
}: {
  children: React.ReactNode;
  reverse?: boolean;
}) {
  const t = await getTranslations('homeStory.nearby');

  return (
    <HomeStop
      stacked
      divider
      reverse={reverse}
      heading={
        <ChapterHeading
          variant="stop"
          icon={Navigation}
          kicker={t('kicker')}
          title={t('title')}
          hint={t('lead')}
          id={NEARBY_CHAPTER_ID}
          action={
            <>
              <HomeLocationRow />
              <StopLink href="/parks">{t('allParks')}</StopLink>
            </>
          }
        />
      }
    >
      {children}
    </HomeStop>
  );
}
