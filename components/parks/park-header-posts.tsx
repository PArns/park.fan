import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, Newspaper } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { postPath } from '@/lib/blog/paths';
import { objectPositionForSrc, versionedPath } from '@/lib/media/focus';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import type { BlogListItem } from '@/lib/blog/types';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

/*
 * The park's posts in its title card. Both chapters stand far below the ride list, which nine in
 * ten readers never scroll past; these are the way to them from the first screen.
 */

/**
 * The window's photo fades into the glass instead of meeting it at an edge: towards the left from
 * `lg`, where it stands beside the text, towards the top below, where it stands under it.
 */
const WINDOW_EDGE_MASK =
  '[mask-image:linear-gradient(to_bottom,transparent,black_30%)] lg:[mask-image:linear-gradient(to_right,transparent,black_22%)]';

/**
 * A title card's two columns: the text on the left and „the window" on the right from `lg`,
 * reaching through the card's padding (`p-6` on `GlassCard`) to its top, right and — without a
 * rail under it — bottom edge; below `lg` the window spans the card under the text. Without a pane
 * the card stays one column. Shared by the park and the ride page.
 */
export function TitleCardWindowSplit({
  pane,
  hasRail = false,
  children,
}: {
  pane?: React.ReactNode;
  /** A rail (`ParkNewsBand`) follows the split, so the window must not round its bottom. */
  hasRail?: boolean;
  children: React.ReactNode;
}) {
  if (!pane) return <>{children}</>;
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,40%)]">
      <div className="min-w-0 lg:pr-8">{children}</div>
      <div
        className={cn(
          '-mx-6 mt-6 -mb-6 flex overflow-hidden lg:-mt-6 lg:-mr-6 lg:ml-0 lg:rounded-tr-xl',
          !hasRail && 'rounded-b-xl lg:rounded-bl-none'
        )}
      >
        {pane}
      </div>
    </div>
  );
}

interface ParkHeaderWindowProps {
  /** The post the window leads to (the park's visit guide, a ride's article); without one it
   *  shows `photo`. */
  guide: BlogListItem | null;
  /** The small line over the post's title; the park's „Erster Besuch" when absent. */
  label?: string;
  /** The park's own photo, the window's view when there is no guide. */
  photo: string | null;
}

/**
 * „The window": a pane cut into the title card's glass, edge to edge. With a guide it shows the
 * guide's cover with its title over it, as the blog's own cards do; without one, the park's photo
 * sharp where the rest of the card blurs it. Its height is the grid row's, so nothing in it can
 * move the card.
 */
export async function ParkHeaderWindow({ guide, photo, label }: ParkHeaderWindowProps) {
  const [t, tBlog] = await Promise.all([
    getTranslations('parks.firstVisit'),
    getTranslations('blog'),
  ]);
  const cover = (guide && versionedPath(guide.frontmatter.coverImage?.src)) || photo;

  const pane = (
    <>
      {cover && (
        <div className={`absolute inset-0 -z-10 overflow-hidden ${WINDOW_EDGE_MASK}`}>
          {/* Lazy: below the title on a phone, and never the page's LCP on a desktop. */}
          <Image
            src={cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="pk-photo-zoom object-cover"
            style={{ objectPosition: objectPositionForSrc(cover, '50% 50%') }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
        </div>
      )}
      {guide && (
        <div className="p-6 pt-24 lg:pl-16">
          <span className="block text-xs font-medium tracking-wider text-white/70 uppercase">
            {label ?? t('label')}
          </span>
          <span className="mt-1 line-clamp-3 block text-lg leading-snug font-semibold text-balance">
            {guide.frontmatter.title}
          </span>
          <span className="text-primary mt-1.5 block text-sm font-medium">
            {tBlog('readingTime', { minutes: guide.readingTimeMinutes })}
            <span aria-hidden="true">&nbsp;→</span>
          </span>
        </div>
      )}
    </>
  );
  const frame = 'group relative isolate flex min-h-72 w-full flex-col justify-end';

  // With a guide the whole pane is its link, photo included.
  return guide ? (
    <div className="flex w-full" {...linkBlockAttributes('guide_band')}>
      <Link
        href={postPath(guide) as '/'}
        prefetch={false}
        className={`${frame} focus-visible:ring-primary text-white focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset`}
      >
        {pane}
      </Link>
    </div>
  ) : (
    <div className={frame}>{pane}</div>
  );
}

/**
 * The park's newest news of the last 30 days (`getFreshNewsForPark`) as a rail along the title
 * card's bottom edge, under the window: one line, so its height never depends on the title.
 */
export async function ParkNewsBand({ locale, news }: { locale: Locale; news: BlogListItem }) {
  const t = await getTranslations('parks');

  return (
    <div
      className="border-foreground/10 bg-background/60 -mx-6 mt-6 -mb-6 rounded-b-xl border-t dark:bg-[oklch(0.13_0.02_241_/_0.85)]"
      {...linkBlockAttributes('news_band')}
    >
      <Link
        href={postPath(news) as '/'}
        prefetch={false}
        className="hover:bg-foreground/5 flex min-w-0 items-center gap-3 rounded-b-xl px-6 py-3 text-sm transition-colors"
      >
        <Newspaper className="text-primary size-4 shrink-0" aria-hidden="true" />
        <span className="text-primary shrink-0 font-semibold">{t('freshNews.label')}</span>
        <span className="text-muted-foreground shrink-0">
          {getDateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
            new Date(`${news.frontmatter.date}T00:00:00Z`)
          )}
        </span>
        <span className="min-w-0 flex-1 truncate font-medium">{news.frontmatter.title}</span>
        <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      </Link>
    </div>
  );
}
