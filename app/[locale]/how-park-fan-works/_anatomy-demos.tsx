import type { Locale } from '@/i18n/config';
import type {
  ParkAttraction,
  ParkRestaurant,
  ParkWithAttractions,
  ScheduleItem,
  TopAttractionStat,
} from '@/lib/api/types';

import { ParkTimeInfo } from '@/components/parks/park-time-info';
import { HeaderHolidayPanel } from '@/components/parks/header-holiday-panel';
import { ParkPurchasesCard } from '@/components/parks/park-purchases-card';
import { AttractionCard } from '@/components/parks/attraction-card';
import { ParkCalendarDay } from '@/components/parks/park-calendar-day';
import { ShowCard } from '@/components/parks/show-card';
import { RestaurantCard } from '@/components/parks/restaurant-card';
import { ParkBestDaysHeader } from '@/components/parks/park-best-days-header';
import { ParkCard } from '@/components/parks/park-card';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { ParkStatsAttractionsCard } from '@/components/parks/park-stats-attractions-card';
import { SeasonalBadge } from '@/components/parks/seasonal-badge';
import { getPostsForPark } from '@/lib/blog/backlinks';
import { getAttractionBackgroundImage, getCardObjectPosition } from '@/lib/utils/park-assets';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { getServerNowMs } from '@/lib/utils/server-time';
import { buildDemoFixtures, DEMO_CALENDAR_DAYS, DEMO_TIMEZONE, OFF_SEASON_CARD } from './_fixtures';

/**
 * One production component per step of the park-page walk-through (chapter 05).
 *
 * The chapter used to be the only one on this page with nothing in it: fourteen
 * paragraphs about cards a reader never saw, on a page whose whole premise is
 * "no screenshots, the real parts". Every block here mounts the same component
 * the park page mounts.
 *
 * The values are frozen fixtures, like the rest of the teaching blocks — the two
 * deliberately live blocks are in chapters 02 and 03, where the point is that
 * the thing is running right now. Here the point is what the block looks like,
 * and a lesson that reshapes itself overnight is not one. Where a figure is
 * quoted in the prose beside it, both come from the same reading.
 */

const PARK_PATH = '/parks/europe/germany/bruehl/phantasialand';
const DEMO_GEO = {
  continent: 'europe',
  country: 'germany',
  city: 'bruehl',
  parkSlug: 'phantasialand',
} as const;

/** Today, 09:00–19:00 in the park's zone — the hours the walk-through quotes. */
function todaySchedule(nowMs: number): ScheduleItem {
  const d = new Date(nowMs);
  const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate()
  ).padStart(2, '0')}`;
  return {
    date,
    scheduleType: 'OPERATING',
    // 07:00Z / 17:00Z is 09:00–19:00 in Europe/Berlin during summer time, which is
    // what the API returned for this park on the day these examples were read.
    openingTime: `${date}T07:00:00.000Z`,
    closingTime: `${date}T17:00:00.000Z`,
    description: null,
    purchases: null,
    isHoliday: true,
    holidayName: 'Summer Holidays',
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

/** 01 — the header's opening hours block. */
export async function AnatomyHeaderDemo() {
  return (
    <ParkTimeInfo timezone={DEMO_TIMEZONE} schedule={[todaySchedule(await getServerNowMs())]} />
  );
}

/** 02 — which school holidays reach this park today. */
export async function AnatomyHolidayDemo() {
  const schedule = todaySchedule(await getServerNowMs());
  // Only the four fields the panel reads. The cast is the honest shape of that:
  // mounting the real component means feeding it the real prop, and a whole
  // ParkWithAttractions fixture would be 40 rides of noise for one chip row.
  const park = {
    timezone: DEMO_TIMEZONE,
    schedule: [schedule],
    nextSchedule: null,
    status: 'OPERATING',
    hasOperatingSchedule: true,
  } as unknown as ParkWithAttractions;
  // No geo props: the panel then renders from the seed and polls nothing.
  return <HeaderHolidayPanel initialData={park} />;
}

/** 06 — paid skip-the-line day prices. Disney only, so the fixture is a Disney one. */
export async function AnatomyPurchasesDemo() {
  const schedule = todaySchedule(await getServerNowMs());
  return (
    <ParkPurchasesCard
      timezone={DEMO_TIMEZONE}
      schedule={[
        {
          ...schedule,
          purchases: [
            {
              name: 'Lightning Lane Single Pass',
              type: 'ATTRACTION',
              price: { amount: 1800, currency: 'USD', formatted: '$18.00' },
              available: true,
            },
            {
              name: 'Lightning Lane Multi Pass',
              type: 'PACKAGE',
              price: { amount: 3200, currency: 'USD', formatted: '$32.00' },
              available: false,
            },
          ],
        },
      ]}
    />
  );
}

/** 07 — one ride card, the same one chapter 01 opens with. */
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

/** 08 — one calendar day, the recommended one from chapter 04. */
export function AnatomyCalendarDemo() {
  const day = DEMO_CALENDAR_DAYS[2] ?? DEMO_CALENDAR_DAYS[0];
  return (
    <div className="max-w-[13rem]">
      <ParkCalendarDay day={day} parkTimezone={DEMO_TIMEZONE} isToday={false} isBest />
    </div>
  );
}

const DEMO_RESTAURANT: ParkRestaurant = {
  id: 'demo-restaurant',
  name: 'Uhrwerk',
  slug: 'uhrwerk',
  latitude: null,
  longitude: null,
  cuisineType: 'Buffet',
  requiresReservation: false,
  status: 'OPERATING',
  operatingHours: [{ type: 'OPERATING', startTime: '11:30', endTime: '18:30' }],
};

/** 09 — a show and a restaurant, the two tabs a park may or may not have. */
export function AnatomyShowsDemo() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ShowCard
        id="demo-show"
        name="Chiapas Fiesta"
        slug="chiapas-fiesta"
        status="OPERATING"
        showtimes={[{ startTime: '13:00' }, { startTime: '15:30' }, { startTime: '17:00' }]}
        timezone={DEMO_TIMEZONE}
        href={`${PARK_PATH}#shows`}
      />
      <RestaurantCard restaurant={DEMO_RESTAURANT} />
    </div>
  );
}

/** 10 — the best-days chapter opens with this header on every park page. */
export function AnatomyBestDaysDemo({ locale }: { locale: Locale }) {
  return <ParkBestDaysHeader parkName="Phantasialand" parkSlug="phantasialand" locale={locale} />;
}

/**
 * 11 — one neighbour, as the nearby list renders it.
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

/** 12 — the newest post that mentions this park. */
export function AnatomyBlogDemo({ locale }: { locale: Locale }) {
  const post = getPostsForPark(locale, 'phantasialand', { limit: 1 })[0];
  if (!post) return null;
  return (
    <div className="max-w-sm">
      <BlogPostCard post={post} variant="compact" />
    </div>
  );
}

const DEMO_TOP_ATTRACTIONS: TopAttractionStat[] = [
  {
    rank: 1,
    attractionSlug: 'taron',
    attractionName: 'Taron',
    avgWaitP50: 50,
    avgWaitP90: 55,
    sampleDays: 155,
  },
  {
    rank: 2,
    attractionSlug: 'chiapas-die-wasserbahn',
    attractionName: 'Chiapas - DIE Wasserbahn',
    avgWaitP50: 45,
    avgWaitP90: 55,
    sampleDays: 155,
  },
  {
    rank: 3,
    attractionSlug: 'fly',
    attractionName: 'F.L.Y.',
    avgWaitP50: 40,
    avgWaitP90: 50,
    sampleDays: 155,
  },
];

/** 13 — the park's longest queues, the table chapter 02 ends on. */
export function AnatomyStatsDemo({
  title,
  labelAttraction,
  labelMinutes,
  labelNow,
  labelP50,
  labelP90,
}: {
  title: string;
  labelAttraction: string;
  labelMinutes: string;
  labelNow: string;
  labelP50: string;
  labelP90: string;
}) {
  return (
    <ParkStatsAttractionsCard
      attractions={DEMO_TOP_ATTRACTIONS}
      showCurrentWaits={false}
      title={title}
      labelAttraction={labelAttraction}
      labelMinutes={labelMinutes}
      labelNow={labelNow}
      labelP50={labelP50}
      labelP90={labelP90}
      continent={DEMO_GEO.continent}
      country={DEMO_GEO.country}
      city={DEMO_GEO.city}
      parkSlug={DEMO_GEO.parkSlug}
    />
  );
}

/** 14 — the season a ride runs in, on the ride from chapter 07. */
export function AnatomySeasonDemo({ label }: { label: string }) {
  const ride = OFF_SEASON_CARD as ParkAttraction;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">{label}</span>
      <SeasonalBadge
        seasonMonths={ride.seasonMonths}
        isCurrentlyInSeason={ride.isCurrentlyInSeason}
      />
    </div>
  );
}
