/**
 * The header's planner band with two regions, for `scripts/shoot-planner-regions.mjs`: the real
 * `PlannerMenuPanel` inside an open `MenuBand`, with Orlando and a second region made up for the
 * test. Only one region exists, so the several-region layout has no page to be seen on; this is
 * where it is looked at. Never imported by the app.
 */
import { createRoot } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { MenuBand } from '@/components/layout/menu-band';
import { PlannerMenuPanel } from '@/components/layout/planner-menu-panel';
import { plannerQuickStarts } from '@/lib/planner/quick-start';
import type { PlannerMenuPark, PlannerMenuRegion } from '@/lib/navigation/planner-menu';
import de from '../../../messages/de.json';
import en from '../../../messages/en.json';

const MESSAGES = { de, en } as const;

/** Orlando as the layout resolves it, and a second region that exists only here. */
const REGIONS: Record<'de' | 'en', PlannerMenuRegion[]> = {
  de: [
    {
      id: 'orlando',
      name: 'Orlando',
      area: 'Florida',
      href: '/orlando#planner',
      calendarHref: '/orlando',
      photo: { src: '/media/disney-animal-kingdom/kunst-des-wartens-cover-16x9.jpg' },
      parkCount: 16,
      maxDays: 21,
    },
    {
      id: 'fixture-paris',
      name: 'Paris',
      area: 'Frankreich',
      href: '/',
      calendarHref: '/',
      photo: { src: '/media/disneyland-park/background-16x9.jpg' },
      parkCount: 2,
      maxDays: 7,
    },
  ],
  en: [],
};
REGIONS.en = REGIONS.de.map((region) =>
  region.id === 'fixture-paris' ? { ...region, area: 'France' } : region
);

const PARKS: PlannerMenuPark[] = [
  ['phantasialand', 'Phantasialand', 'bruehl', 'Brühl'],
  ['europa-park', 'Europa-Park', 'rust', 'Rust'],
  ['legoland-deutschland', 'LEGOLAND Deutschland', 'guenzburg', 'Günzburg'],
  ['plopsaland-deutschland', 'Plopsaland Deutschland', 'hassloch', 'Haßloch'],
  ['movie-park-germany', 'Movie Park Germany', 'bottrop', 'Bottrop'],
  ['rulantica', 'Rulantica', 'rust', 'Rust'],
].map(([slug, name, citySlug, city]) => ({
  slug,
  name,
  href: `/parks/europe/germany/${citySlug}/${slug}`,
  city,
  countrySlug: 'germany',
}));

const locale = (document.documentElement.lang === 'en' ? 'en' : 'de') as 'de' | 'en';

createRoot(document.getElementById('root') as HTMLElement).render(
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="Europe/Berlin">
    <header className="@container relative h-12 border-b">
      <MenuBand id="planner-fixture" open>
        <PlannerMenuPanel
          dayPlannerHref={locale === 'de' ? '/tagesplaner' : '/trip-planner'}
          regions={REGIONS[locale]}
          parks={plannerQuickStarts(PARKS)}
        />
      </MenuBand>
    </header>
  </NextIntlClientProvider>
);
