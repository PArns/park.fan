import { getTranslations } from 'next-intl/server';
import { ArrowRight, Navigation } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { HomeLocationRow } from '@/components/home/home-location-row';
import { Reveal } from '@/components/marketing/scroll-reveal';

/**
 * The chapter frame around the nearby-parks card, which comes in as a slot (a Client Component the
 * caller already dynamic-imports). The frame exists for the plain `<h2>` in the story ladder: the
 * card opens with a band label, not a chapter header. Its kicker names the thing ("your
 * location"), not its place in the story, since on a phone the steps move below this chapter.
 * Under the lead sits `HomeLocationRow`, at one fixed height in every state.
 */
export async function NearbyChapter({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('homeStory.nearby');

  return (
    // No top padding from 768 px up, where `ThreeSteps` stands above and its bottom padding is the
    // gap. Below that the steps move under the park lists (`PHONE_LATER` in page.tsx) and this
    // chapter opens under the hero's photo, so it needs its own.
    <section className="px-4 pt-16 pb-16 sm:pt-18 sm:pb-18 @min-[768px]/page:pt-0">
      <div className="container mx-auto">
        <Reveal containsGlass>
          <ChapterHeading
            variant="tile"
            icon={Navigation}
            kicker={t('kicker')}
            title={t('title')}
            hint={t('lead')}
            id="parks-in-deiner-naehe"
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
