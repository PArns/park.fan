import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { buttonLinkProps } from '@/components/ui/button';
import { pagedPath, pageWindow } from '@/lib/blog/pagination';

/**
 * The page links under a blog or news listing: previous, the page numbers, next. Plain links to
 * the `/page/<n>` URLs (`lib/blog/pagination.ts`), so a crawler walks the whole archive without
 * running a script. Draws nothing when the listing fits on one page. The three columns keep the
 * numbers centred whether or not the previous and next links are there.
 */
export async function ListingPagination({
  base,
  page,
  pageCount,
}: {
  /** Locale-relative path of the listing's first page. */
  base: string;
  page: number;
  pageCount: number;
}) {
  if (pageCount < 2) return null;
  const t = await getTranslations('blog.pagination');

  return (
    <nav aria-label={t('label')} className="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div className="justify-self-start">
        {page > 1 && (
          <Link
            href={pagedPath(base, page - 1) as '/'}
            rel="prev"
            prefetch={false}
            {...buttonLinkProps({ variant: 'outline', withIcon: true, className: 'rounded-full' })}
          >
            <ChevronLeft aria-hidden="true" />
            <span className="max-sm:sr-only">{t('previous')}</span>
          </Link>
        )}
      </div>

      <ol className="flex flex-wrap items-center justify-center gap-1">
        {pageWindow(page, pageCount).map((number, index) =>
          number === null ? (
            <li key={`gap-${index}`} aria-hidden="true" className="text-muted-foreground px-1">
              …
            </li>
          ) : (
            <li key={number}>
              {number === page ? (
                <span
                  aria-current="page"
                  aria-label={t('pageOf', { page: number, total: pageCount })}
                  {...buttonLinkProps({ size: 'icon', className: 'rounded-full tabular-nums' })}
                >
                  {number}
                </span>
              ) : (
                <Link
                  href={pagedPath(base, number) as '/'}
                  aria-label={t('goToPage', { page: number })}
                  prefetch={false}
                  {...buttonLinkProps({
                    variant: 'ghost',
                    size: 'icon',
                    className: 'rounded-full tabular-nums',
                  })}
                >
                  {number}
                </Link>
              )}
            </li>
          )
        )}
      </ol>

      <div className="justify-self-end">
        {page < pageCount && (
          <Link
            href={pagedPath(base, page + 1) as '/'}
            rel="next"
            prefetch={false}
            {...buttonLinkProps({ variant: 'outline', withIcon: true, className: 'rounded-full' })}
          >
            <span className="max-sm:sr-only">{t('next')}</span>
            <ChevronRight aria-hidden="true" />
          </Link>
        )}
      </div>
    </nav>
  );
}
