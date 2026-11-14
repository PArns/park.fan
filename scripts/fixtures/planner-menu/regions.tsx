/**
 * The header's planner band with two to four regions, for `scripts/shoot-planner-regions.mjs`: the
 * real `PlannerMenuPanel` inside an open `MenuBand`, with Orlando and up to three of the coming
 * regions (their registry slugs, so each draws the scene its entry names: Orlando's Parky, the
 * placeholder for the rest until `components/layout/region-art/<slug>.tsx` exists). Only one region
 * is live, so the several-region layout has no page to be seen on; this is where it is looked at.
 * The names and counts below are the fixture's, not copy. Never imported by the app.
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

type FixtureLocale = keyof typeof MESSAGES;

/** One fixture region: its slug, its name and kicker per fixture locale, its photo and figures. */
const REGIONS: Array<
  Omit<PlannerMenuRegion, 'name' | 'area' | 'calendarLabel'> & {
    name: Record<FixtureLocale, string>;
    area: Record<FixtureLocale, string>;
  }
> = [
  {
    id: 'orlando',
    name: { de: 'Orlando', en: 'Orlando' },
    area: { de: 'Florida', en: 'Florida' },
    href: '/orlando#planner',
    calendarHref: '/orlando',
    photo: { src: '/media/disney-animal-kingdom/kunst-des-wartens-cover-16x9.jpg' },
    parkCount: 16,
    maxDays: 21,
  },
  {
    id: 'southern-california',
    name: { de: 'Südkalifornien', en: 'Southern California' },
    area: { de: 'Kalifornien', en: 'California' },
    href: '/',
    calendarHref: '/',
    photo: null,
    parkCount: 7,
    maxDays: 21,
  },
  {
    id: 'japan',
    name: { de: 'Japan', en: 'Japan' },
    area: { de: 'Tokio · Osaka', en: 'Tokyo · Osaka' },
    href: '/',
    calendarHref: '/',
    photo: null,
    parkCount: 5,
    maxDays: 21,
  },
  {
    id: 'paris',
    name: { de: 'Paris', en: 'Paris' },
    area: { de: 'Frankreich', en: 'France' },
    href: '/',
    calendarHref: '/',
    photo: { src: '/media/disneyland-park/background-16x9.jpg' },
    parkCount: 3,
    maxDays: 21,
  },
];

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

const root = document.documentElement;
const locale: FixtureLocale = root.lang === 'en' ? 'en' : 'de';
/** How many regions to draw, from `<html data-regions>`: two to four. */
const count = Math.min(4, Math.max(2, Number(root.dataset.regions) || 2));
const regions: PlannerMenuRegion[] = REGIONS.slice(0, count).map((region) => ({
  ...region,
  name: region.name[locale],
  area: region.area[locale],
  calendarLabel: region.name[locale],
}));

createRoot(document.getElementById('root') as HTMLElement).render(
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="Europe/Berlin">
    <header className="@container relative h-12 border-b">
      <MenuBand id="planner-fixture" open>
        <PlannerMenuPanel
          dayPlannerHref={locale === 'de' ? '/tagesplaner' : '/trip-planner'}
          regions={regions}
          parks={plannerQuickStarts(PARKS)}
        />
      </MenuBand>
    </header>
  </NextIntlClientProvider>
);
