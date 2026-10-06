import { getTranslations } from 'next-intl/server';
import { Baby, ArrowRight } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { Link } from '@/i18n/navigation';
import { hasParkKidsPage } from '@/lib/api/kids-page';
import { parkKidsPath } from '@/lib/parks/kids-segments';
import type { Locale } from '@/i18n/config';
import { getKidsEntryParks } from './lead-park';
import { STORY_SECTION_TINTED } from './section-chrome';

/**
 * Chapter: a family's question, "which of these rides can my child ride", answered by each park's
 * "with kids" page (P1 in `docs/product/personas-and-scenarios.md` §5). The page is per park, so
 * the chapter offers a short row of parks from a curated list (`getKidsEntryParks`), each asked
 * again at render (`hasParkKidsPage`) so a park that slips under the gate drops out rather than
 * linking to a 404. No sentence names a count. Nothing renders when the geo fetch fails.
 */
export async function ChapterFamilies({ locale }: { locale: string }) {
  const [t, tKids, candidates] = await Promise.all([
    getTranslations('homeStory.families'),
    getTranslations('parks.kidsPage'),
    getKidsEntryParks(),
  ]);
  const gated = await Promise.all(
    candidates.map(async (park) =>
      (await hasParkKidsPage(park.continent, park.country, park.city, park.parkSlug)) ? park : null
    )
  );
  const parks = gated.filter((p) => p !== null);
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
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
