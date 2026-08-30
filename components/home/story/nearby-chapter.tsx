import { getTranslations } from 'next-intl/server';
import { ArrowRight, Navigation } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';

/**
 * "Step 1, for real": the chapter frame around the nearby-parks card.
 *
 * The card itself is unchanged and comes in as a slot, because it is a Client
 * Component with its own geolocation gate and its own skeleton — the caller
 * already dynamic-imports it, and re-importing it here would give the homepage
 * two entries for one chunk.
 *
 * The heading is a plain `<h2>` in the story ladder, which is the whole reason
 * this frame exists: the card opens with a `GlassSectionTitle`, a band label
 * rather than a chapter header, so on its own it left a step of the explanation
 * with no heading a crawler could see.
 */
export async function NearbyChapter({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('homeStory.nearby');

  return (
    <section className="px-4 pb-16 sm:pb-18">
      <div className="container mx-auto">
        <Reveal>
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
        {children}
      </div>
    </section>
  );
}
