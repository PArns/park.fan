import { MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { ParkDistance } from '@/components/common/park-distance';
import { ParkFavoriteButton } from '@/components/parks/park-favorite-button';
import { ParkPlannerLink } from '@/components/parks/park-planner-link';
import { ParkQuickLinks } from '@/components/parks/park-quick-links';
import type { Locale } from '@/i18n/config';
import type { ParkWithAttractions } from '@/lib/api/types';

interface ParkTitleHeaderProps {
  park: ParkWithAttractions;
  parkName: string;
  cityName: string;
  /** Country slug + its already-translated name, for the address line. */
  country: string;
  countryName: string;
  /** For the planner link's localized path. */
  locale: Locale | string;
  /**
   * What follows the park name in the H1, in lighter weight. Every page of a park has its own —
   * "Wartezeiten live" on the park page, "Wartezeiten-Kalender" on the calendar — and it is the only
   * part of this header that must differ, because two pages sharing an H1 is two pages a crawler
   * has no reason to tell apart.
   */
  suffix: string;
  /** The server-rendered intro paragraph. Same rule: one per page, in that page's words. */
  intro: string;
  /** Anything the page wants under the intro — a back link, for instance. */
  children?: React.ReactNode;
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
  country,
  countryName,
  locale,
  suffix,
  intro,
  children,
}: ParkTitleHeaderProps) {
  const tGeo = await getTranslations('geo');

  return (
    <>
      {/* Title row: park name + location on the left, favourite button pinned top-right. */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">
            {parkName} <span className="font-normal">– {suffix}</span>
          </h1>
          {/* 56px = 24 (the address at text-base) + 12 (gap-3) + 20 (the distance line) — two
            lines is what this row settles on below `sm` once the city and country are long
            enough. Same reservation as the ride header, reasoned through there. */}
          <div className="text-muted-foreground flex min-h-14 flex-wrap content-start items-center gap-3 sm:min-h-0">
            {/* City and country are ONE flex item, not two with a comma between them: the row
              is `gap-1`, so a bare `,` text node between two spans is a third item and the gap
              lands in front of it — „Brühl , Germany" on every park page, in every locale. Same
              spelling `ParkCard` uses, which never had the bug. */}
            <address className="flex items-center gap-1 not-italic">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {cityName}, {translateGeoSlug(tGeo, 'countries', country, countryName)}
              </span>
            </address>
            {/* How far the visitor is from this park — client-only (needs their position), so it
              just appears next to the address once known. */}
            <ParkDistance latitude={park.latitude} longitude={park.longitude} size="md" />
          </div>
        </div>
        {park.id && <ParkFavoriteButton parkId={park.id} />}
      </div>

      <p className="text-muted-foreground mt-5 max-w-2xl text-sm leading-relaxed">{intro}</p>

      {/* The way into the planner, BEFORE the park's own links and visually apart from them: what
        follows is a row of outbound links (website, tickets, Wikipedia) and this is the one thing
        in the header that stays on the site. It was also the planner's only missing inbound link
        that carries any intent — see `ParkPlannerLink`. */}
      <div className="mt-4">
        <ParkPlannerLink parkName={parkName} locale={locale} />
      </div>

      {/* The park's own site and ticket shop, right under the intro. They used to be the bottom
        row of a titled "Infos zum Park" section far down the page — which on most parks was a
        heading and a frame around exactly these two buttons. Renders nothing for a park nobody
        has curated. */}
      <ParkQuickLinks info={park.info} className="mt-3" />

      {children}
    </>
  );
}
