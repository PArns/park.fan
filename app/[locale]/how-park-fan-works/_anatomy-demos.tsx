import type { Locale } from '@/i18n/config';
import type {
  ParkRestaurant,
  ParkWithAttractions,
  ScheduleItem,
  TopAttractionStat,
} from '@/lib/api/types';

import { ParkHolidayRow } from '@/components/parks/park-holiday-row';
import { ParkPurchasesCard } from '@/components/parks/park-purchases-card';
import { AttractionCard } from '@/components/parks/attraction-card';
import { ParkCalendarDay } from '@/components/parks/park-calendar-day';
import { ShowCard } from '@/components/parks/show-card';
import { RestaurantCard } from '@/components/parks/restaurant-card';
import { ParkBestDaysHeader } from '@/components/parks/park-best-days-header';
import { ParkCard } from '@/components/parks/park-card';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import {
  ParkStatsAttractionsCard,
  useParkStatsAttractionsLabels,
} from '@/components/parks/park-stats-attractions-card';
import { getPostsForPark } from '@/lib/blog/backlinks';
import { parkDayOf } from '@/lib/utils/park-day';
import { getAttractionBackgroundImage, getCardObjectPosition } from '@/lib/utils/park-assets';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { getServerNowMs } from '@/lib/utils/server-time';
import {
  buildDemoFixtures,
  DEMO_CALENDAR_DAYS,
  DEMO_TIMEZONE,
  parkLocalInstant,
} from './_fixtures';

/**
 * One production component per step of the park-page walk-through (chapter 06): every block
 * mounts the component the park page mounts. The values are frozen fixtures, like the other
 * teaching blocks, because a lesson that reshapes itself overnight is not one; where the prose
 * quotes a figure, both come from the same reading.
 */

const PARK_PATH = '/parks/europe/germany/bruehl/phantasialand';
const DEMO_GEO = {
  continent: 'europe',
  country: 'germany',
  city: 'bruehl',
  parkSlug: 'phantasialand',
} as const;

/**
 * Phantasialand's schedule on 2026-08-24 (09:00–19:00, Summer Holidays at home and in
 * Gelderland), laid on today's date in the park's zone: the cards read "today" off the clock, and
 * the hours are wall-clock times, so they stay 09:00–19:00 on either side of a DST change.
 */
function todaySchedule(nowMs: number): ScheduleItem {
  return {
    date: parkDayOf(nowMs, DEMO_TIMEZONE),
    scheduleType: 'OPERATING',
    openingTime: parkLocalInstant(nowMs, 9, 0),
    closingTime: parkLocalInstant(nowMs, 19, 0),
    description: null,
    purchases: null,
    isHoliday: true,
    holidayName: 'Summer Holidays',
    // The API sends `holidayType` with `isHoliday`, which alone does not say whether this is a
    // school or a public holiday.
    holidayType: 'school',
    isSchoolHoliday: true,
    isPublicHoliday: false,
    influencingHolidays: [
      {
        name: 'Summer Holidays',
        source: { countryCode: 'NL', regionCode: 'GE' },
        holidayType: 'school',
      },
    ],
  };
}

/** The bottom row of „Heute im Park": which school holidays reach this park today. */
export async function AnatomyHolidayDemo() {
  const schedule = todaySchedule(await getServerNowMs());
  // Only the fields the panel reads, cast: a whole ParkWithAttractions fixture would be 40 rides
  // of noise for one chip row.
  const park = {
    timezone: DEMO_TIMEZONE,
    schedule: [schedule],
    nextSchedule: null,
    status: 'OPERATING',
    hasOperatingSchedule: true,
    // The row names the park's own region beside the neighbours' chips, so the fixture carries one.
    region: 'Nordrhein-Westfalen',
    country: 'Germany',
  } as unknown as ParkWithAttractions;
  // `country` is the URL slug, which is what the flag is resolved from; no other geo prop, so the
  // row renders from the seed and polls nothing.
  return <ParkHolidayRow initialData={park} country="germany" />;
}

/**
 * Paid skip-the-line day prices. Disney only, so the fixture is Magic Kingdom's on 2026-11-04,
 * two of its three lines.
 *
 * The card reads "today" off the browser clock and renders nothing before it, so its box is held
 * here: 101 px below `sm`, where the card drops to its tighter padding, and 149 px from `sm` up,
 * measured at 360 to 1440 px in all six locales.
 */
export async function AnatomyPurchasesDemo() {
  const schedule = todaySchedule(await getServerNowMs());
  return (
    <div className="min-h-[101px] sm:min-h-[149px]">
      <ParkPurchasesCard
        timezone={DEMO_TIMEZONE}
        schedule={[
          {
            ...schedule,
            purchases: [
              {
                name: 'Lightning Lane Multi Pass',
                type: 'PACKAGE',
                price: { amount: 3700, currency: 'USD', formatted: '$37.00' },
                available: true,
              },
              {
                name: 'Lightning Lane for Seven Dwarfs Mine Train',
                type: 'ATTRACTION',
                price: { amount: 1600, currency: 'USD', formatted: '$16.00' },
                available: false,
              },
            ],
          },
        ]}
      />
    </div>
  );
}

/** One ride card, the same one chapter 01 opens with. */
export async function AnatomyAttractionDemo() {
  const { taron } = buildDemoFixtures(await getServerNowMs());
  return (
    <div className="grid [grid-template-rows:auto_2rem_auto] sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]">
      <AttractionCard
        attraction={taron}
        parkPath={PARK_PATH}
        parkStatus="OPERATING"
        timezone={DEMO_TIMEZONE}
        backgroundImage={getAttractionBackgroundImage('phantasialand', taron.slug)}
        objectPosition={getCardObjectPosition('phantasialand', taron.slug)}
      />
    </div>
  );
}

/** One calendar day, the quietest of the four from chapter 04. */
export function AnatomyCalendarDemo() {
  const day = DEMO_CALENDAR_DAYS[3] ?? DEMO_CALENDAR_DAYS[0];
  return (
    <div className="max-w-[13rem]">
      <ParkCalendarDay day={day} parkTimezone={DEMO_TIMEZONE} isToday={false} />
    </div>
  );
}

/** Phantasialand listed no show on 2026-11-04, so both cards are Europa-Park's from that day. */
const SHOWS_PARK_PATH = '/parks/europe/germany/rust/europa-park';

const DEMO_RESTAURANT: ParkRestaurant = {
  id: 'demo-fiskehuset',
  name: 'Fiskehuset',
  slug: 'fiskehuset',
  latitude: null,
  longitude: null,
  cuisineType: null,
  requiresReservation: false,
  status: 'OPERATING',
};

/**
 * A show and a restaurant, the two tabs a park may or may not have. The showtimes are the show's
 * wall-clock times laid on today's date, because the card strikes through the ones already past.
 */
export async function AnatomyShowsDemo() {
  const nowMs = await getServerNowMs();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ShowCard
        id="demo-limerick-bubbles"
        name="Limerick Bubbles"
        slug="limerick-bubbles"
        status="OPERATING"
        showtimes={[
          { startTime: parkLocalInstant(nowMs, 12, 45) },
          { startTime: parkLocalInstant(nowMs, 14, 30) },
          { startTime: parkLocalInstant(nowMs, 16, 15) },
        ]}
        timezone={DEMO_TIMEZONE}
        href={`${SHOWS_PARK_PATH}#shows`}
      />
      <RestaurantCard restaurant={DEMO_RESTAURANT} />
    </div>
  );
}

/** The best-days chapter of the wait-time calendar opens with this header. */
export function AnatomyBestDaysDemo({ locale }: { locale: Locale }) {
  return <ParkBestDaysHeader parkName="Phantasialand" parkSlug="phantasialand" locale={locale} />;
}

/**
 * One neighbour, as the nearby list renders it.
 *
 * The row template belongs on the card's own wrapper: `ParkCard` is
 * `row-span-3` + `grid-template-rows: subgrid`, so without three tracks to
 * borrow it collapses against the panels' negative margins — the photo escapes
 * the card and the name gets sliced in half. Same wrapper the ride card above
 * uses, and the same one the blog spotlight cards use.
 */
export function AnatomyNearbyDemo() {
  return (
    <div className="grid [grid-template-rows:auto_2rem_auto] sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]">
      <ParkCard
        name="Attractiepark Toverland"
        slug="attractiepark-toverland"
        city="Sevenum"
        country="Netherlands"
        href="/parks/europe/netherlands/sevenum/attractiepark-toverland"
        status="OPERATING"
        crowdLevel="low"
        // `formatDistance` takes METRES — 91.2 renders as "91 m", which is the
        // trap this prop's name sets. The nearby list hands it metres too.
        distance={91_200}
        translateCountry
        backgroundImage={getParkBackgroundImage('attractiepark-toverland')}
      />
    </div>
  );
}

/** The newest post that mentions this park. */
export function AnatomyBlogDemo({ locale }: { locale: Locale }) {
  const post = getPostsForPark(locale, 'phantasialand', { limit: 1 })[0];
  if (!post) return null;
  return (
    <div className="max-w-sm">
      <BlogPostCard post={post} variant="compact" />
    </div>
  );
}

/** The first three rows of Phantasialand's `/stats` on 2026-11-04. */
const DEMO_TOP_ATTRACTIONS: TopAttractionStat[] = [
  {
    rank: 1,
    attractionSlug: 'taron',
    attractionName: 'Taron',
    avgWaitP50: 45,
    avgWaitP90: 45,
    sampleDays: 245,
    land: 'Mystery',
  },
  {
    rank: 2,
    attractionSlug: 'fly',
    attractionName: 'F.L.Y.',
    avgWaitP50: 35,
    avgWaitP90: 40,
    sampleDays: 245,
    land: 'Rookburgh',
  },
  {
    rank: 3,
    attractionSlug: 'winjas-force',
    attractionName: 'Winja‘s Force',
    avgWaitP50: 30,
    avgWaitP90: 40,
    sampleDays: 244,
    land: 'Fantasy',
  },
];

/** The park's longest queues, as the park page's statistics chapter labels them. */
export function AnatomyStatsDemo() {
  const labels = useParkStatsAttractionsLabels();
  return (
    <ParkStatsAttractionsCard
      attractions={DEMO_TOP_ATTRACTIONS}
      showCurrentWaits={false}
      {...labels}
      continent={DEMO_GEO.continent}
      country={DEMO_GEO.country}
      city={DEMO_GEO.city}
      parkSlug={DEMO_GEO.parkSlug}
    />
  );
}
