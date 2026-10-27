import { getTranslations } from 'next-intl/server';
import { Ban } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { GlassCard } from '@/components/common/glass-card';
import { PageContainer } from '@/components/common/page-container';
import { ShareButtons } from '@/components/common/share-buttons';
import { ParkBlogPostsSection } from '@/components/parks/blog-posts-sections';
import { ClosedRidesList } from '@/components/parks/closed-rides-list';
import { GlassNotice } from '@/components/parks/glass-notice';
import { ParkBackground } from '@/components/parks/park-background';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { BreadcrumbStructuredData, ParkStructuredData } from '@/components/seo/structured-data';
import { getMediaAltBySrc } from '@/lib/media/text';
import { closedRidePost, closedRideSource, formatClosedOn } from '@/lib/parks/closed-ride';
import { getCardObjectPosition, getParkBackgroundImage } from '@/lib/utils/park-assets';
import { stripNewPrefix } from '@/lib/utils';
import type { Breadcrumb, ParkWithAttractions } from '@/lib/api/types';

interface ClosedParkPageProps {
  locale: Locale;
  /** `<continent>/<country>/<city>` of the park's path. */
  geoPath: string;
  park: ParkWithAttractions & { retiredAt: string };
  breadcrumbs: Breadcrumb[];
  currentPage: string;
  /** Absolute canonical URL of this page. */
  url: string;
  ogImageUrl: string;
  /** The meta description, printed as the intro so the snippet and the page agree. */
  description: string;
}

/**
 * The page of a park that closed for good, built like `ClosedRidePage`: when it closed, why, its
 * closed rides and the posts about it. Nothing that describes a running park (live waits, crowd
 * level, forecast, calendar, opening hours, planner) is drawn. See
 * docs/rules/a-closed-ride-keeps-its-page.md.
 */
export async function ClosedParkPage({
  locale,
  geoPath,
  park,
  breadcrumbs,
  currentPage,
  url,
  ogImageUrl,
  description,
}: ClosedParkPageProps) {
  const t = await getTranslations('attractions.retired');
  const parkName = stripNewPrefix(park.name);
  const post = closedRidePost(park.retiredReason, locale);
  const source = post ? null : closedRideSource(park.retiredReason);
  const backgroundImage = getParkBackgroundImage(park.slug);
  const parkPath = `/parks/${geoPath}/${park.slug}`;

  const linkClass =
    'text-primary hover:text-primary/80 font-medium underline decoration-dotted underline-offset-4';

  return (
    <>
      <ParkStructuredData
        park={park}
        url={url}
        description={description}
        locale={locale}
        ogImageUrl={ogImageUrl}
      />
      <BreadcrumbStructuredData
        breadcrumbs={breadcrumbs}
        currentPage={{ name: currentPage, url: parkPath }}
        locale={locale}
      />
      <ParkBackground
        imageSrc={backgroundImage}
        alt={getMediaAltBySrc(backgroundImage, locale) ?? parkName}
        objectPosition={getCardObjectPosition(park.slug)}
      />
      <PageContainer>
        <BreadcrumbNav
          breadcrumbs={breadcrumbs}
          currentPage={currentPage}
          pinLastBreadcrumb
          phone="hidden"
        />

        <article>
          <div className="mb-4">
            <GlassCard variant="tile">
              <h1 className="mb-2 text-3xl font-bold md:text-4xl">
                {parkName}{' '}
                <span className="text-muted-foreground text-xl font-normal md:text-2xl">
                  – {t('h1Suffix')}
                </span>
              </h1>
              <ParkStatusBadge status="RETIRED" />
              <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed">
                {description}
              </p>
            </GlassCard>
          </div>

          <GlassNotice
            icon={Ban}
            title={t('noticeTitle', { date: formatClosedOn(park.retiredAt, locale) })}
            tintClassName="bg-red-500/5 dark:bg-red-500/10"
            iconClassName="text-red-600 dark:text-red-400"
            className="mb-8"
          >
            {post && (
              <span className="block">
                {t.rich('noticePost', {
                  title: post.title,
                  link: (chunks) => (
                    <Link href={post.href as '/'} className={linkClass}>
                      {chunks}
                    </Link>
                  ),
                })}
              </span>
            )}
            {source && (
              <span className="block">
                {t.rich('noticeSource', {
                  host: source.host,
                  link: (chunks) => (
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </span>
            )}
          </GlassNotice>

          <ClosedRidesList
            rides={park.closedAttractions}
            parkPath={parkPath}
            locale={locale}
            className="mb-8"
          />

          <ParkBlogPostsSection
            locale={locale}
            parkSlug={park.slug}
            geoPath={geoPath}
            parkName={parkName}
          />

          <div className="mt-10">
            <ShareButtons url={url} title={parkName} />
          </div>
        </article>
      </PageContainer>
    </>
  );
}
