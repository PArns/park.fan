import { getTranslations } from 'next-intl/server';
import { ArrowRight, Navigation } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { HomeLocationRow } from '@/components/home/home-location-row';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { NEARBY_CHAPTER_ID } from '@/lib/home/hero-search';
import { STORY_SECTION } from './section-chrome';

/**
 * The chapter frame around the nearby-parks card, which comes in as a slot (a Client Component the
 * caller already dynamic-imports). The frame exists for the plain `<h2>`: the card opens with a
 * band label, not a chapter header. Under the lead sits `HomeLocationRow`, at one fixed height in
 * every state.
 */
export async function NearbyChapter({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('homeStory.nearby');

  return (
    <section className={STORY_SECTION}>
      <div className="container mx-auto">
        <Reveal containsGlass>
          <ChapterHeading
            variant="tile"
            icon={Navigation}
            kicker={t('kicker')}
            title={t('title')}
            hint={t('lead')}
            id={NEARBY_CHAPTER_ID}
            action={
              <Link
                href="/parks"
                prefetch={false}
                className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
              >
                {t('allParks')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
        </Reveal>
        <HomeLocationRow className="mt-2" />
        {children}
      </div>
    </section>
  );
}
