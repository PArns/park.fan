import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';

import { SITE_URL } from '@/i18n/config';
import type { Locale } from '@/i18n/config';
import { objectPositionForSrc } from '@/lib/media/focus';
import { getMediaAltBySrc } from '@/lib/media/text';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import { buildContributeHref } from '@/lib/contribute/prefill';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { stripNewPrefix } from '@/lib/utils';
import type { Breadcrumb, ParkSeason, ParkWithAttractions } from '@/lib/api/types';
import type { GlossaryInjectTerm } from '@/components/glossary/glossary-inject-context';

import { PageContainer } from '@/components/common/page-container';
import { GlassCard } from '@/components/common/glass-card';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { Separator } from '@/components/ui/separator';
import { ShareButtons } from '@/components/common/share-buttons';
import { PreferredSourcePrompt } from '@/components/common/preferred-source-prompt';
import { ContributeBanner } from '@/components/contribute/contribute-banner';
import { ParkBackground } from '@/components/parks/park-background';
import { NearbyParksSection } from '@/components/parks/nearby-parks-section';
import { ParkBlogPostsSection } from '@/components/parks/blog-posts-sections';
import { ParkStatsSection } from '@/components/parks/park-stats-section';
import { ParkSeasonsCard } from '@/components/parks/park-seasons-card';
import { ParkInfoCard } from '@/components/parks/park-info-card';
import { ParkFAQSection } from '@/components/faq/park-faq-section';

interface ParkPageShellProps {
  park: ParkWithAttractions;
  seasons: ParkSeason[] | null | undefined;
  locale: string;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  cityName: string;
  countryName: string;
  breadcrumbs: Breadcrumb[];
  currentPage: string;
  /** Server "now" the FAQ's date-dependent answers were derived with. */
  seedNowMs: number;
  faqGlossaryTerms: GlossaryInjectTerm[];
  glossarySegment: string;
  /** The title card's contents — the H1 and whatever belongs beside and under it. Every page of
   *  a park has a different one; the card around it is the same. */
  header: React.ReactNode;
  /** Rendered first inside the container, before the breadcrumb: JSON-LD and anything else that
   *  occupies no space. Structured data is the one thing two pages of a park may not share, so
   *  the shell takes it as a slot rather than emitting any. */
  head?: React.ReactNode;
  /** This page's own content, between the header card and the shared tail. */
  children: React.ReactNode;
}

/**
 * Everything every page of a park has in common: the photo backdrop, the breadcrumb, the title
 * card, and the whole tail from the nearby parks down to the contribute banner.
 *
 * It exists because the crowd calendar became its own URL and arrived there as a bare page — a
 * heading, a grid and a back link, on a site where a park page carries its neighbours, the
 * articles about it, its statistics, its seasons, its address and its FAQ. A visitor who followed
 * one cell out of the header had left the park, and the way back was a single link. Two URLs
 * about one park have to be two pages of one thing.
 *
 * What the shell deliberately does NOT own is the header CARD ("Heute im Park" plus the entry-tile
 * row). On the park page that card and the tab bodies under it are one `<Tabs>` tree, so the card
 * cannot be hoisted out of it; on a sub-page the same card is built with link cells instead of
 * triggers. Both therefore arrive through `children`, and `ParkHeaderCard` is what keeps them the
 * same card.
 *
 * The tail is shared FURNITURE, which is why repeating it across a park's URLs is not the
 * duplicate-content problem it looks like: what separates two pages for a crawler is their unique
 * main content, their title, their H1 and their canonical, and each page of a park owns all four.
 * The one thing that must not be repeated is structured data — the `FAQPage` JSON-LD stays on the
 * park page alone, and the shell emits none of its own.
 */
export async function ParkPageShell({
  park,
  seasons,
  locale,
  continent,
  country,
  city,
  parkSlug,
  cityName,
  countryName,
  breadcrumbs,
  currentPage,
  seedNowMs,
  faqGlossaryTerms,
  glossarySegment,
  header,
  head,
  children,
}: ParkPageShellProps) {
  const tGeo = await getTranslations('geo');
  const parkName = stripNewPrefix(park.name);
  const parkBgImage = getParkBackgroundImage(parkSlug);
  const parkPath = `/parks/${continent}/${country}/${city}/${parkSlug}`;

  return (
    <>
      {/* No manual <link rel="preload"> here: it pointed at the RAW /media/.../background.jpg,
        but <ParkBackground> renders it through next/image (/_next/image?…&q=90). The raw preload
        was never the LCP resource — it just downloaded the full-size original in parallel,
        competing for bandwidth with the optimized image. next/image's `priority` already preloads
        the correct optimized rendition. */}
      <ParkBackground
        imageSrc={parkBgImage}
        // The sidecar's authored sentence in this locale, not the bare entity name:
        // "{park}" told a screen reader nothing the heading had not already said.
        alt={getMediaAltBySrc(parkBgImage, locale) ?? parkName}
        objectPosition={objectPositionForSrc(parkBgImage)}
      />

      <PageContainer>
        {head}

        {/* Breadcrumb — rendered inline, NOT inside <Suspense>. It has nothing to await (a Client
          Component handed plain props, server-rendered into the first HTML), and the boundary it
          used to sit in was the park page's single largest layout shift: the `h-6` fallback
          occupied 24px, the real nav 46px, so the whole article jumped 22px down the moment the
          boundary resolved — worth ~0.22 CLS on desktop and the reason this URL group failed Core
          Web Vitals. */}
        <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={currentPage} />

        <article itemScope itemType="https://schema.org/AmusementPark">
          <div className="mb-4">
            <GlassCard variant="heavy">{header}</GlassCard>
          </div>

          {children}

          {/* Nearby Parks — streamed (geo proximity lookup + live park cards) */}
          {park.latitude != null && park.longitude != null && (
            <Suspense fallback={null}>
              <NearbyParksSection
                parkId={park.id}
                lat={park.latitude}
                lng={park.longitude}
                className="mt-8"
              />
            </Suspense>
          )}

          {/* Blog posts about this park — static content out of the generated blog manifest (no
            API call, no clock), so it neither competes with the live queries nor with the
            load-last best-travel-time data. Renders nothing when no post mentions the park. NOT
            behind <Suspense>: `hasPublishedPosts`/`getPostsForPark` are synchronous manifest
            lookups and the only await is `getTranslations`, whose messages this render already
            holds — so the boundary deferred nothing and bought no TTFB. What it did cost was a
            `fallback={null}` hole: on mobile this section is ~470px that appeared out of nowhere
            when the boundary resolved, shoving everything under it down the page. */}
          <ParkBlogPostsSection
            locale={locale as Locale}
            parkSlug={parkSlug}
            geoPath={`${continent}/${country}/${city}`}
            parkName={parkName}
            className="mt-8"
          />

          {/* Historical statistics — loaded client-side (CDN-cached /stats route); a skeleton
            shows until the cold/slow stats response lands, so it never blocks the static shell. */}
          <ParkStatsSection
            continent={continent}
            country={country}
            city={city}
            parkSlug={parkSlug}
            locale={locale}
            hasLiveWaitTimes={hasReadableWaitTimes(park)}
          />

          {/* What is on at this park. Hand-researched, day-stable, and its own request rather than
            a field on the park: the park payload is re-polled every five minutes and a season
            changes a few times a year. Renders nothing for the majority of parks that have none. */}
          <ParkSeasonsCard seasons={seasons ?? []} locale={locale} className="mt-8" />

          {/* Address, phone and the hard facts — hand-curated in the admin, because none of the
            three upstream feeds carries any of it. The links that used to close this section are
            <ParkQuickLinks> in the header now, so this renders nothing at all for a park that had
            only those. */}
          <ParkInfoCard
            info={park.info}
            city={cityName}
            country={translateGeoSlug(tGeo, 'countries', country, countryName)}
            className="mt-8"
          />

          {/* FAQ — Q0–Q6 render immediately from the park snapshot + server clock. Q7 (least
            crowded) is NOT server-seeded (that would mean awaiting the best-days seed on the
            critical path); it streams in from the client calendar fetch after mount. The Q7 signal
            for SEO lives in the FAQPage JSON-LD, which the PARK page emits and no other page of
            the park does. */}
          <Separator className="my-8" />
          <ParkFAQSection
            park={park}
            locale={locale}
            continent={continent}
            country={country}
            city={city}
            parkSlug={parkSlug}
            glossaryTerms={faqGlossaryTerms}
            glossarySegment={glossarySegment}
            initialCalendar={null}
            seedNowMs={seedNowMs}
          />

          <Separator className="my-8" />
          {/* The page being shared is the one being read, not the park's home page. */}
          <ShareButtons url={`${SITE_URL}/${locale}${parkPath}`} title={park.name} />

          {/* Invite visitors to contribute their own photos of this park */}
          <ContributeBanner
            className="mt-8"
            href={
              park.id
                ? buildContributeHref({
                    type: 'park',
                    id: park.id,
                    name: parkName,
                    slug: parkSlug,
                    url: parkPath,
                    country: park.country ?? undefined,
                  })
                : undefined
            }
          />

          {/* Secondary, lighter "make park.fan a preferred Google source" prompt */}
          <PreferredSourcePrompt compact className="mt-8" />
        </article>
      </PageContainer>
    </>
  );
}
