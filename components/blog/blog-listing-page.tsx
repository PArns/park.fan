import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import type { Breadcrumb } from '@/lib/api/types';
import { pagedPath, type ListingPage } from '@/lib/blog/pagination';
import type { BlogListItem } from '@/lib/blog/types';
import { BlogPostStream } from '@/components/blog/blog-post-stream';
import { BlogSectionHeader } from '@/components/blog/blog-section-header';
import { ListingPagination } from '@/components/blog/listing-pagination';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { PageBottomSections } from '@/components/common/page-bottom-sections';
import { BlogStructuredData } from '@/components/seo/blog-structured-data';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';

interface BlogListingPageProps {
  locale: string;
  /** The listing's name: the `<h1>`, the current crumb and the JSON-LD name. */
  label: string;
  description: string;
  /** Locale-relative path of the listing's first page. */
  basePath: string;
  /** The crumbs above the listing, from the blog down. */
  ancestors: Breadcrumb[];
  badge: string;
  badgeIcon: LucideIcon;
  /** How many posts the whole listing holds, as the header says it. */
  postsCount: string;
  current: ListingPage<BlogListItem>;
  /** What stands between the header and the stream, such as the category pills. */
  children?: ReactNode;
}

/**
 * One page of a blog listing below the index, a category's or a tag's: breadcrumbs, header, the
 * blog's stream and the page links, plus Blog and BreadcrumbList JSON-LD. A later page names the
 * listing as a crumb and itself as the current page, and is its own canonical path.
 */
export async function BlogListingPage({
  locale,
  label,
  description,
  basePath,
  ancestors,
  badge,
  badgeIcon,
  postsCount,
  current,
  children,
}: BlogListingPageProps) {
  const t = await getTranslations('blog');
  const { page, pageCount } = current;
  const pageLabel = t('pagination.pageLabel', { page });
  const path = pagedPath(basePath, page);
  const listingCrumb: Breadcrumb = { name: label, url: basePath };
  const seoBreadcrumbs: Breadcrumb[] = [
    ...ancestors,
    listingCrumb,
    ...(page > 1 ? [{ name: pageLabel, url: path }] : []),
  ];

  return (
    <>
      <BlogStructuredData
        locale={locale}
        name={`${label} · ${t('title')}`}
        description={description}
        posts={current.items}
        path={path}
      />
      <BreadcrumbStructuredData breadcrumbs={seoBreadcrumbs} locale={locale} />
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <BreadcrumbNav
          breadcrumbs={page > 1 ? [...ancestors, listingCrumb] : ancestors}
          currentPage={page > 1 ? pageLabel : label}
          variant="plain"
          className="mb-6"
        />

        <BlogSectionHeader
          as="h1"
          badge={badge}
          badgeIcon={badgeIcon}
          title={label}
          meta={
            page > 1
              ? `${postsCount} · ${t('pagination.pageOf', { page, total: pageCount })}`
              : postsCount
          }
        />

        <div className="max-w-5xl">
          {children}
          <BlogPostStream locale={locale as Locale} posts={current.items} />
          <ListingPagination base={basePath} page={page} pageCount={pageCount} />
        </div>
      </div>

      <PageBottomSections locale={locale} />
    </>
  );
}
