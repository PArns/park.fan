import type { ReactNode } from 'react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, BookOpen, Megaphone, type LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { NewsAge } from '@/components/blog/news-age';
import { BlogCoverFallback } from '@/components/blog/blog-cover-fallback';
import { NewsUpdateBadge } from '@/components/blog/news-update-badge';
import { MostReadBadge } from '@/components/blog/most-read-badge';
import { toNewsListItem } from '@/components/blog/news-row';
import { resolveCategoryLabel } from '@/lib/blog/categories';
import { NEWS_CATEGORY, NEWS_INDEX_PATH, postPath } from '@/lib/blog/paths';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import type { BlogListItem } from '@/lib/blog/types';
import type { Locale } from '@/i18n/config';

/** The news: the date column and the posts beside it, as on `/news`; stacked on a phone. */
const ROW_CLASS =
  'grid grid-cols-1 gap-x-4 gap-y-1 px-3 py-3 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:py-3.5';

/** A post's link: the whole line, lit on hover, its cover (if it has one) on the right. */
const LINK_CLASS =
  'group hover:bg-muted/60 -mx-2 flex items-center gap-4 rounded-xl px-2 py-1.5 transition-colors';

/** How many rows of each group a phone shows, where the two groups stack into one long column. */
const PHONE_ROWS = 3;

/**
 * The phone's cut for a row holding the posts from `start` on: hidden past {@link PHONE_ROWS}, and
 * the row the cut ends in loses the rule `divide-y` draws under it, since the rows under it are gone.
 */
function phoneCut(start: number, count = 1): string | undefined {
  if (start >= PHONE_ROWS) return 'max-sm:hidden';
  if (start + count >= PHONE_ROWS) return 'max-sm:border-b-0';
  return undefined;
}

/**
 * A post's cover, small; a post without one gets the brand fallback, its hue from the slug, so two
 * posts of one day still read as two.
 */
function Cover({ post, className }: { post: BlogListItem; className: string }) {
  const { image, imagePosition } = toNewsListItem(post);
  return (
    <span
      className={cn(
        'bg-muted relative block aspect-[16/10] shrink-0 overflow-hidden rounded-lg',
        className
      )}
    >
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          sizes="144px"
          style={imagePosition ? { objectPosition: imagePosition } : undefined}
          className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
        />
      ) : (
        <BlogCoverFallback slug={post.slug} />
      )}
    </span>
  );
}

/** A group of rows under its label (an `<h3>`) and the link to all of them. */
function BoardGroup({
  icon: Icon,
  label,
  href,
  linkLabel,
  live = false,
  className,
  children,
}: {
  icon: LucideIcon;
  label: string;
  href: string;
  linkLabel: string;
  /** A pulsing dot before the label: this group is what just happened. */
  live?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 pt-3 pb-1">
        <h3 className="text-muted-foreground inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase">
          {live && (
            <span aria-hidden="true" className="relative flex size-2">
              <span className="bg-status-operating absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping" />
              <span className="bg-status-operating relative inline-flex size-2 rounded-full" />
            </span>
          )}
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </h3>
        <Link
          href={href as '/'}
          prefetch={false}
          className="text-primary inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
        >
          {linkLabel}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      <ol className="divide-border/60 divide-y">{children}</ol>
    </div>
  );
}

/**
 * News posts by day, newest first: `listNewsByDate` is sorted, so a day is a run of one date. `start`
 * is the index of the day's first post among all of them.
 */
function byDay(
  posts: readonly BlogListItem[]
): { date: string; start: number; posts: BlogListItem[] }[] {
  const days: { date: string; start: number; posts: BlogListItem[] }[] = [];
  posts.forEach((post, index) => {
    const last = days.at(-1);
    if (last?.date === post.frontmatter.date) last.posts.push(post);
    else days.push({ date: post.frontmatter.date, start: index, posts: [post] });
  });
  return days;
}

/**
 * The homepage's news and guides as one board: the newest news by day, each day's age and date in a
 * column on the left as `/news` draws it (`NewsAge stacked`), and the most read articles with their
 * date and reading time, under the news on a narrow page and beside it from 1024 px; a phone shows
 * the first three of each ({@link PHONE_ROWS}). Every post has a small cover on the right, the brand
 * fallback where it has no photo ({@link Cover}). The board follows the theme like every card, so
 * nothing inside needs a colour of its own.
 *
 * News stays a step below the articles (docs/rules/news-is-set-apart-from-the-articles.md): a
 * semibold title and no teaser against a bold, larger title with one.
 */
export async function NewsBoard({
  locale,
  news,
  articles,
}: {
  locale: Locale;
  news: readonly BlogListItem[];
  articles: readonly BlogListItem[];
}) {
  const [tNav, tBlog, tReading] = await Promise.all([
    getTranslations('navigation'),
    getTranslations('blog'),
    getTranslations('homeStory.reading'),
  ]);
  const date = getDateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <div className="bg-card text-foreground border-border grid grid-cols-1 gap-2 rounded-3xl border p-2 shadow-[0_40px_120px_-40px_color-mix(in_oklab,var(--color-primary)_55%,transparent)] sm:p-3 @min-[1024px]/page:grid-cols-2 @min-[1024px]/page:gap-4">
      {news.length > 0 && (
        <BoardGroup
          icon={Megaphone}
          label={resolveCategoryLabel(NEWS_CATEGORY, locale, 'News')}
          href={NEWS_INDEX_PATH}
          linkLabel={tNav('allNews')}
          live
        >
          {byDay(news).map((day) => (
            <li key={day.date} className={cn(ROW_CLASS, phoneCut(day.start, day.posts.length))}>
              <NewsAge date={day.date} stacked className="text-sm sm:pt-1.5" />
              <ul className="divide-border/40 divide-y">
                {day.posts.map((post, i) => (
                  <li
                    key={post.translationKey}
                    className={cn(
                      'py-1 first:pt-0 last:pb-0',
                      phoneCut(day.start + i),
                      day.start + i === PHONE_ROWS - 1 && 'max-sm:pb-0'
                    )}
                  >
                    <Link href={postPath(post) as '/'} prefetch={false} className={LINK_CLASS}>
                      <span className="text-foreground group-hover:text-primary min-w-0 flex-1 text-sm leading-snug font-semibold text-pretty transition-colors sm:text-base">
                        <MostReadBadge
                          kind="news"
                          postKey={post.translationKey}
                          variant="icon"
                          className="mr-1.5 align-[-0.2em]"
                        />
                        {post.updatedOn && (
                          <NewsUpdateBadge date={post.updatedOn} className="mr-1.5" />
                        )}
                        {post.frontmatter.title}
                      </span>
                      <Cover post={post} className="w-20 sm:w-24" />
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </BoardGroup>
      )}

      {articles.length > 0 && (
        <BoardGroup
          // Under the news on a narrow page, beside it from 1024 px, a rule between them either way.
          className={cn(
            news.length > 0 &&
              'border-border border-t pt-2 @min-[1024px]/page:border-t-0 @min-[1024px]/page:border-l @min-[1024px]/page:pt-0 @min-[1024px]/page:pl-4'
          )}
          icon={BookOpen}
          label={tReading('popularGuides')}
          href="/blog"
          linkLabel={tBlog('home.viewAll')}
        >
          {articles.map((post, i) => (
            <li key={post.translationKey} className={cn('px-3 py-3 sm:py-3.5', phoneCut(i))}>
              <Link href={postPath(post) as '/'} prefetch={false} className={LINK_CLASS}>
                <span className="min-w-0 flex-1">
                  {/* Ranked by reads, so the date is a detail beside the reading time, not a column. */}
                  <span className="text-muted-foreground block text-[11px] font-semibold">
                    <time dateTime={post.frontmatter.date} className="tabular-nums">
                      {date.format(new Date(post.frontmatter.date))}
                    </time>
                    {' · '}
                    {tBlog('readingTime', { minutes: post.readingTimeMinutes })}
                  </span>
                  <span className="text-foreground group-hover:text-primary mt-0.5 block text-base leading-snug font-bold text-pretty transition-colors sm:text-lg">
                    {post.frontmatter.title}
                  </span>
                  {post.frontmatter.excerpt && (
                    <span className="text-muted-foreground mt-1 line-clamp-2 text-sm max-sm:hidden">
                      {post.frontmatter.excerpt}
                    </span>
                  )}
                </span>
                <Cover post={post} className="w-24 sm:w-36" />
              </Link>
            </li>
          ))}
        </BoardGroup>
      )}
    </div>
  );
}
