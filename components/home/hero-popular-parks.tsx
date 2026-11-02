import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getFeaturedParksMenu } from '@/lib/navigation/featured-parks-menu';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';
import { cn } from '@/lib/utils';

/** How many parks stand as shortcuts under the hero's search: one row on a desktop. */
const SHORTCUTS = 4;

/**
 * The parks this locale's readers open most, as shortcuts under the hero's search, so a first
 * visitor whose park is one of them is one tap from it without typing. The same list as the header's
 * parks menu (`getFeaturedParksMenu`), and plain links in the first HTML, which hand the homepage's
 * weight to the park pages a search for „<park> Wartezeiten" should find.
 */
export async function HeroPopularParks({
  locale,
  className,
}: {
  locale: string;
  className?: string;
}) {
  const parks = getFeaturedParksMenu(locale).slice(0, SHORTCUTS);
  if (parks.length === 0) return null;
  const t = await getTranslations('home.hero');

  return (
    <nav
      aria-label={t('popularLabel')}
      className={cn('flex flex-wrap items-center gap-x-3 gap-y-2', className)}
      {...linkBlockAttributes('featured')}
    >
      <span className="text-foreground/80 text-sm" aria-hidden="true">
        {t('popular')}
      </span>
      <ul className="flex flex-wrap gap-2">
        {parks.map((park) => (
          <li key={park.href}>
            <Link
              href={park.href as '/'}
              prefetch={false}
              className="border-foreground/15 bg-background/40 text-foreground hover:bg-background/70 hover:border-primary/50 inline-flex h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors md:h-10"
            >
              {park.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
