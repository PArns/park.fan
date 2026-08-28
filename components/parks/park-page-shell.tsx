import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';

import { SITE_URL } from '@/i18n/config';
import { objectPositionForSrc } from '@/lib/media/focus';
import { getMediaAltBySrc } from '@/lib/media/text';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import { buildContributeHref } from '@/lib/contribute/prefill';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { stripNewPrefix } from '@/lib/utils';
import type { Breadcrumb, ParkSeason, ParkWithAttractions } from '@/lib/api/types';

import { PageContainer } from '@/components/common/page-container';
import { GlassCard } from '@/components/common/glass-card';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { Separator } from '@/components/ui/separator';
import { ShareButtons } from '@/components/common/share-buttons';
import { PreferredSourcePrompt } from '@/components/common/preferred-source-prompt';
import { ContributeBanner } from '@/components/contribute/contribute-banner';
import { ParkBackground } from '@/components/parks/park-background';
import { NearbyParksSection } from '@/components/parks/nearby-parks-section';
import { ParkStatsSection } from '@/components/parks/park-stats-section';
import { ParkSeasonsCard } from '@/components/parks/park-seasons-card';
import { ParkInfoCard } from '@/components/parks/park-info-card';

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
  /** The title card's contents — the H1 and whatever belongs beside and under it. Every page of
   *  a park has a different one; the card around it is the same. */
  header: React.ReactNode;
  /** The locale-relative path of the page being rendered — what the share buttons hand out and
   *  what the canonical points at. Not the park's own path: a visitor sharing from the September
   *  2026 calendar means that page, and the shell used to give them the wait-time URL. */
  pagePath: string;
  /** Rendered first inside the container, before the breadcrumb: JSON-LD and anything else that
   *  occupies no space. Structured data is the one thing two pages of a park may not share, so
   *  the shell takes it as a slot rather than emitting any. */
  head?: React.ReactNode;
  /** This page's own content, between the header card and the shared tail. */
  children: React.ReactNode;
  /**
   * Put the historical-statistics chapter directly under `children` instead of below the blog.
   *
   * Only the crowd calendar sets it, and only because that page's own subject is „when should I
   * go" — the statistics are the same question at a finer grain. On the park page the subject is
   * today's wait times and the statistics are a footnote, so they stay where they are.
   */
  statsAfterChildren?: boolean;
  /**
   * The park's article list, rendered between the neighbours and the statistics.
   *
   * A SLOT and not a boolean, and the difference is measurable. It was `tail="lean"` first, which
   * stopped the section rendering but left `ParkBlogPostsSection` imported at module scope here —
   * and the routed-translations generator walks the import graph, static and lazy alike, so every
   * calendar URL kept serializing namespaces for markup it no longer emitted. What a page does
   * not import, it does not pay for.
   */
  blogSection?: React.ReactNode;
  /**
   * The park's FAQ, rendered last, with its own separator.
   *
   * Same reasoning as {@link blogSection}, and the same measurement behind it: `seo.faq` is the
   * heaviest namespace in this tail, and the calendar routes were shipping it for a chapter they
   * do not render. Passing the section in from the park page is what takes it out of their graph.
   *
   * It is also where the FAQ's glossary terms now come from: the shell used to take them as props
   * and hand them down, which made every caller resolve 267 terms against the FAQ corpus whether
   * or not it rendered one.
   */
  faqSection?: React.ReactNode;
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
 * The tail is shared FURNITURE, and repeating most of it across a park's URLs is not the
 * duplicate-content problem it looks like: what separates two pages for a crawler is their unique
 * main content, their title, their H1 and their canonical, and each page of a park owns all four.
 * The one thing that must not be repeated is structured data — the `FAQPage` JSON-LD stays on the
 * park page alone, and the shell emits none of its own.
 *
 * „Most of it" is doing work in that sentence, and the `blogSection`/`faqSection` slots are where
 * the line falls. The argument holds at two URLs per park and stops holding at a hundred; see
 * those props for the measurement that moved it, and for why they are slots the caller fills
 * rather than a flag the shell reads.
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
  header,
  head,
  pagePath,
  children,
  statsAfterChildren = false,
  blogSection,
  faqSection,
}: ParkPageShellProps) {
  const tGeo = await getTranslations('geo');
  const parkName = stripNewPrefix(park.name);
  const parkBgImage = getParkBackgroundImage(parkSlug);
  const parkPath = `/parks/${continent}/${country}/${city}/${parkSlug}`;

  /* Built once and placed in one of two slots — a second copy would be a second set of props to
     keep in step, and this one already carries six. */
  const stats = (
    <ParkStatsSection
      continent={continent}
      country={country}
      city={city}
      parkSlug={parkSlug}
      locale={locale}
      hasLiveWaitTimes={hasReadableWaitTimes(park)}
    />
  );

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
            <GlassCard variant="tile">{header}</GlassCard>
          </div>

          {children}

          {/* On the crowd calendar the historical numbers belong directly under the grid: the
            month-by-month and weekday tables answer the same question the calendar does, one
            level of detail down, and pushing „Parks in der Nähe" and the blog between them makes
            a reader scroll past two unrelated chapters to compare them. Everywhere else the
            statistics keep their place further down. */}
          {statsAfterChildren ? stats : null}

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

          {blogSection}

          {statsAfterChildren ? null : stats}

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

          {faqSection}

          <Separator className="my-8" />
          {/* The page being shared is the one being read, not the park's home page. */}
          <ShareButtons url={`${SITE_URL}/${locale}${pagePath}`} title={park.name} />

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
