import { MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { ParkDistance } from '@/components/common/park-distance';
import { ParkBestDaysSummary } from '@/components/parks/park-best-days-summary';
import { ParkFavoriteButton } from '@/components/parks/park-favorite-button';
import { ParkLocationLine } from '@/components/parks/park-location-line';
import { ParkPlannerLink } from '@/components/parks/park-planner-link';
import { ParkLinksFlyout } from '@/components/parks/park-links-flyout';
import { TitleCardWindowSplit, type TitleCardWindow } from '@/components/parks/park-header-posts';
import { ParkMapsLink } from '@/components/parks/park-maps-link';
import { parkMapsLinks } from '@/lib/parks/maps-links';
import { hasQuickLinks, ParkOutboundLinks } from '@/components/parks/park-quick-links';
import { RiddenCounter } from '@/components/parks/ridden-counter';
import { catchNonFatal } from '@/lib/api/client';
import { getParkStatsForPage } from '@/lib/api/stats';
import { parkBrandOf } from '@/lib/parks/park-brands';
import { deriveParkBestDays } from '@/lib/parks/park-stats-derive';
import { isUuid, nameWithAbbreviations } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import type { Breadcrumb, ParkWithAttractions } from '@/lib/api/types';

/** Muted like the line it sits in; the dotted underline is what says it can be pressed. */
const ADDRESS_LINK =
  'hover:text-foreground underline decoration-dotted underline-offset-4 transition-colors';

interface ParkTitleHeaderProps {
  park: ParkWithAttractions;
  parkName: string;
  cityName: string;
  /** The park's geo slugs: the address links and the stats read for the quietest days. */
  continent: string;
  country: string;
  city: string;
  /** Already-translated country name, for the address line. */
  countryName: string;
  /**
   * The park's breadcrumb trail (`generateParkBreadcrumbs`). The city and the country in the
   * address line link exactly the pages it links, because the park page hides its breadcrumb on a
   * phone and these are the way one level up there (PAR-434). A city without a page of its own has
   * no crumb and stays text.
   */
  trail: Breadcrumb[];
  /** For the planner link's localized path. */
  locale: Locale | string;
  /**
   * What follows the park name in the H1, in lighter weight. Every page of a park has its own —
   * "Wartezeiten live" on the park page, "Andrang im November 2026" on the calendar — and it is the only
   * part of this header that must differ, because two pages sharing an H1 is two pages a crawler
   * has no reason to tell apart.
   */
  suffix: string;
  /** The server-rendered intro paragraph. Same rule: one per page, in that page's words. */
  intro: string;
  /** Anything the page wants under the intro — a back link, for instance. */
  children?: React.ReactNode;
  /**
   * What „the window" shows: a pane cut into the card's glass, edge to edge on the right from `lg`
   * and full width under the weekdays below it. With nothing to show the card keeps its single
   * column (`TitleCardWindowSplit`).
   */
  windowPane?: TitleCardWindow;
  /** A rail along the card's bottom edge, under the window — the park's fresh news. */
  note?: React.ReactNode;
}

/**
 * The title card's contents, shared by every page of a park.
 *
 * Park name, location, distance from the visitor, the favourite star, an intro paragraph and the
 * park's own links. Only the H1's suffix and the intro change between pages; everything else is
 * the same object in the same place, which is what makes walking from the wait times to the crowd
 * calendar feel like turning a page rather than arriving somewhere else.
 *
 * The keyword lives INSIDE the h1 (same size and colour as the park name, only lighter weight) so
 * the target term reads as one heading — the single strongest on-page signal for the query each
 * page is written for.
 */
export async function ParkTitleHeader({
  park,
  parkName,
  cityName,
  continent,
  country,
  city,
  countryName,
  trail,
  locale,
  suffix,
  intro,
  children,
  windowPane,
  note,
}: ParkTitleHeaderProps) {
  const tGeo = await getTranslations('geo');
  // The planner button's sentence, resolved HERE rather than inside the button: that one is a
  // Client Component now (it opens the panel instead of navigating), and `parks` is 15.1 KB.
  const tParks = await getTranslations('parks');
  const brand = parkBrandOf(park.name);
  const tBrand = brand ? await getTranslations(brand.namespace) : null;
  const countryLabel = translateGeoSlug(tGeo, 'countries', country, countryName);
  const cityHref = trail.find((c) => c.url === `/parks/${continent}/${country}/${city}`)?.url;
  const countryHref = trail.find((c) => c.url === `/parks/${continent}/${country}`)?.url;
  const maps = parkMapsLinks(park.latitude, park.longitude);
  // Every park page already reads this for `hasParkStatsPage`; React `cache` and the Data Cache
  // make it the same request, so the quietest days cost no upstream call on any of them.
  const bestDays = deriveParkBestDays(
    await catchNonFatal(getParkStatsForPage(continent, country, city, park.slug))
  );

  return (
    <>
      <TitleCardWindowSplit pane={windowPane} hasRail={Boolean(note)}>
        <div>
          {/* Title row: the favourite star in front of the name, so the right edge is free. Beside
        the heading, not inside it: a button in the `<h1>` would put its label into the heading's
        accessible name. */}
          <div className="min-w-0">
            <div className="mb-2 flex items-start gap-3">
              {park.id && (
                // As tall as the heading's first line (its line-height at each size), so the star
                // centres on the name however many lines the name wraps to.
                <div className="flex h-9 shrink-0 items-center md:h-10">
                  <ParkFavoriteButton parkId={park.id} />
                </div>
              )}
              {/* Left on the window on purpose: 30 px against 36 px changes how the name looks, not
              where anything sits, and this heading wraps to as many lines as its column needs at
              either size. Nothing measures it. */}
              <h1 className="min-w-0 text-3xl font-bold md:text-4xl">
                {nameWithAbbreviations(parkName, park.abbreviations)}{' '}
                <span className="font-normal">– {suffix}</span>
              </h1>
            </div>
            {/* 56px = 24 (the address at text-base) + 12 (gap-3) + 20 (the distance line) — two
            lines is what this row settles on below `sm` once the city and country are long
            enough. Same reservation as the ride header, reasoned through there. */}
            <div className="text-muted-foreground flex min-h-14 flex-wrap content-start items-center gap-3 sm:min-h-0">
              {/* City and country are ONE flex item, not two with a comma between them: the row
              is `gap-1`, so a bare `,` text node between two spans is a third item and the gap
              lands in front of it — „Brühl , Germany" on every park page, in every locale. Same
              spelling `ParkCard` uses, which never had the bug. */}
              <address className="flex items-center not-italic">
                {/* Pin and city are the way to the gate, in the maps app the device has; the
                  country stays a link into the site, and the city page is the breadcrumb's. */}
                {maps ? (
                  <ParkMapsLink
                    maps={maps}
                    parkId={park.id}
                    label={`${cityName} · ${tParks('info.directions')}`}
                    className="hover:text-primary inline-flex items-center gap-1 transition-colors"
                  >
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className={ADDRESS_LINK}>{cityName}</span>
                  </ParkMapsLink>
                ) : (
                  <>
                    <MapPin className="mr-1 h-4 w-4 shrink-0" aria-hidden="true" />
                    {cityHref ? (
                      <Link href={cityHref} prefetch={false} className={ADDRESS_LINK}>
                        {cityName}
                      </Link>
                    ) : (
                      cityName
                    )}
                  </>
                )}
                <span>
                  ,{' '}
                  {countryHref ? (
                    <Link href={countryHref} prefetch={false} className={ADDRESS_LINK}>
                      {countryLabel}
                    </Link>
                  ) : (
                    countryLabel
                  )}
                </span>
              </address>
              {/* A park of a brand with its own page links it, so the brand's overview is reached from
              every park it lists. */}
              {brand && tBrand && (
                <Link href={`/parks/${brand.slug}`} prefetch={false} className={ADDRESS_LINK}>
                  {tBrand('parkLink')}
                </Link>
              )}
              {/* How far the visitor is from this park — client-only (needs their position), so it
              just appears next to the address once known. */}
              <ParkDistance latitude={park.latitude} longitude={park.longitude} size="md" keepGap />
              {/* A line of its own below `lg`: beside the address and the distance a phone has
              about 250 px, and every locale's "At the park? Show rides near you" is longer. From
              `lg` up it takes what is left of the line (`basis-0`), so its own width never decides
              whether the row wraps and no state of it can move the card. */}
              <div className="flex min-w-0 basis-full items-center gap-3 lg:flex-1 lg:basis-0">
                <ParkLocationLine
                  park={{ id: park.id, latitude: park.latitude, longitude: park.longitude }}
                  className="flex-1"
                />
                {/* The rides the list offers a „ridden" switch on; `closedAttractions` are a
                separate list and stay out of the total. */}
                <RiddenCounter rideIds={(park.attractions ?? []).map((a) => a.id).filter(isUuid)} />
              </div>
            </div>
          </div>
          {/* Clamped to two lines below `sm`: at five lines it was 114 px of a 664 px phone screen
        in front of "Heute im Park". The clamp is CSS only, so the whole paragraph is still in the
        served HTML — it is the crawlable text the live grid cannot give (see the park page). */}
          <p className="text-muted-foreground mt-5 max-w-2xl text-sm leading-relaxed max-sm:line-clamp-2">
            {intro}
          </p>

          {bestDays && (
            <ParkBestDaysSummary
              bestDays={bestDays}
              locale={locale}
              forecast={{
                continent,
                country,
                city,
                parkSlug: park.slug,
                timezone: park.timezone ?? 'UTC',
                coverageTo: park.scheduleCoverage?.to,
              }}
            />
          )}

          {/* One call to action and one „Mehr": the planner, the action that stays on park.fan and
            the way in for 63 % of its openings, as the card's filled button; the park's outbound
            links (website, tickets, Wikipedia, socials, maps) folded into a flyout beside it. On a
            phone those links stand in `ParkInfoCard` instead, and the planner is the row. */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ParkPlannerLink
              label={tParks('planDayCta', { park: parkName })}
              locale={locale}
              className="bg-primary text-primary-foreground hover:bg-primary/90 justify-center px-4 py-2 shadow-md max-sm:w-full"
            />
            {hasQuickLinks(park.info) && (
              <ParkLinksFlyout
                label={tParks('info.more')}
                parkId={park.id}
                className="max-sm:hidden"
              >
                <ParkOutboundLinks info={park.info} parkId={park.id} withMaps={false} />
              </ParkLinksFlyout>
            )}
          </div>
        </div>
      </TitleCardWindowSplit>

      {note}
      {children}
    </>
  );
}
