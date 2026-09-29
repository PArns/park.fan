import { getTranslations } from 'next-intl/server';
import { Baby, ArrowRight } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { Link } from '@/i18n/navigation';
import { parkKidsPath } from '@/lib/parks/kids-segments';
import type { Locale } from '@/i18n/config';
import { getKidsEntryParks } from './lead-park';
import { STORY_SECTION_TINTED } from './section-chrome';

/**
 * Chapter: a family's question, "which of these rides can my child ride".
 *
 * P1 in `docs/product/personas-and-scenarios.md` §5. The answer already exists as the "with kids"
 * page each park that clears its gate has (PAR-356), and nothing on the homepage said so. The
 * page is per park, so the chapter offers the entry as a short row of parks and not as one URL.
 *
 * The parks are a curated list (`getKidsEntryParks`) that clears the page's gate with room to
 * spare, resolved against the geo structure the featured grid reads already. No sentence names a
 * count: the counts live on the page behind the link and move with the data.
 *
 * Nothing renders when the geo fetch fails, so the chapter is never an empty frame. It sits in
 * the static shell like its neighbours, not behind a `Suspense`.
 */
export async function ChapterFamilies({ locale }: { locale: string }) {
  const [t, tKids, parks] = await Promise.all([
    getTranslations('homeStory.families'),
    getTranslations('parks.kidsPage'),
    getKidsEntryParks(),
  ]);
  if (parks.length === 0) return null;

  return (
    <section className={STORY_SECTION_TINTED}>
      <div className="container mx-auto">
        <Reveal containsGlass>
          <ChapterHeading
            variant="tile"
            icon={Baby}
            kicker={t('kicker')}
            title={t('title')}
            hint={<GlossaryInject>{t('lead')}</GlossaryInject>}
            id="mit-kindern"
          />
        </Reveal>

        <Reveal>
          <ul className="grid gap-3 sm:grid-cols-3">
            {parks.map((park) => (
              <li key={park.parkSlug}>
                <Link
                  href={parkKidsPath(
                    locale as Locale,
                    park.continent,
                    park.country,
                    park.city,
                    park.parkSlug
                  )}
                  prefetch={false}
                  className="border-border bg-card/60 hover:border-primary/40 group flex h-full items-center gap-3 rounded-2xl border p-4 transition-colors"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium group-hover:underline">
                      {tKids('linkAnchor', { park: park.name })}
                    </span>
                    <span className="text-muted-foreground block text-xs leading-relaxed">
                      {t('cardBody')}
                    </span>
                  </span>
                  <ArrowRight
                    className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
