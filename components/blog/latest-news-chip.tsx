import { useFormatter } from 'next-intl';
import { ArrowRight, Megaphone } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { newsPostPath } from '@/lib/blog/paths';
import { cn } from '@/lib/utils';
import type { NewsMenu } from '@/lib/navigation/news-menu';

/** The newest news post, as the chip draws it. Resolved on the server from the blog manifest. */
export interface LatestNews {
  slug: string;
  title: string;
  /** Publication date, `YYYY-MM-DD`. */
  date: string;
  /** The news section's label in this locale ("News", "Actualités"), from `categories.json`. */
  label: string;
  /** The post's teaser, already cut on the server. Only the card variant draws it. */
  excerpt?: string;
}

/**
 * The chip's data out of the news menu, which already holds the newest item and the label. One
 * derivation for both hosts (the homepage hero and the phone menu), so the two cannot disagree
 * about which post is the newest or what the section is called.
 *
 * The teaser only on request: the phone menu's card draws it, and the header already ships it for
 * the news panel's lead; the hero's one-line chip does not, and would only carry 220 characters of
 * text it never renders into the homepage's payload.
 */
export function latestNewsFrom(
  menu: Pick<NewsMenu, 'items' | 'label'> | undefined,
  { excerpt = false }: { excerpt?: boolean } = {}
): LatestNews | null {
  const newest = menu?.items[0];
  if (!menu || !newest) return null;
  return {
    slug: newest.slug,
    title: newest.title,
    date: newest.date,
    label: menu.label,
    ...(excerpt && newest.excerpt ? { excerpt: newest.excerpt } : {}),
  };
}

/**
 * The newest news post, in one of two shapes.
 *
 * - **`chip`** (the homepage hero): one line — label, date, headline, arrow. The headline
 *   truncates, so the chip is exactly as tall as the open-parks badge beside it. Beside the badge
 *   (from a 34 rem row, `HeroBadgeRow`) that costs the hero no height; below it (every phone) the
 *   chip stands under the badge and the plate is one chip, 38 px, taller.
 * - **`card`** (the phone menu): label and date on top, then the headline in two lines and two to
 *   three lines of the post's teaser, in a smaller type than the menu's entries. It was the chip
 *   there, with the headline allowed a second line, and a 300 px column left „EQT will Parques
 *   Reunidos…" and nothing else — no way to tell what the news is about (Patrick, 2026-09-25).
 *
 * Used where a whole news row would cost too much room: the hero is the only news above the fold
 * on any screen (it is `min-h-dvh`), and the only news a phone sees before the blog chapter at the
 * foot of the page, since the band under the hero is `lg` only.
 *
 * **News shows its age, and here it is the date.** Not `NewsAge`: that one adds its relative half
 * ("vor 3 Tagen") after hydration, and inside a truncating line the growth would slide the
 * headline sideways under the reader's eyes. The date is formatted in UTC, the zone the
 * frontmatter's bare day parses into, so the server and the browser print the same day.
 *
 * No `'use client'`: both hosts are client components already, and `useFormatter` works on either
 * side.
 */
export function LatestNewsChip({
  news,
  variant = 'chip',
  className,
}: {
  news: LatestNews;
  variant?: 'chip' | 'card';
  className?: string;
}) {
  const format = useFormatter();
  // `new Date('2026-09-25')` is UTC midnight by spec, so formatting in UTC prints that day on the
  // server and in any browser. Anything that does not parse drops the date rather than throwing
  // out of the header on every page.
  const published = new Date(news.date);
  const date = Number.isNaN(published.getTime())
    ? null
    : format.dateTime(published, { day: 'numeric', month: 'short', timeZone: 'UTC' });

  const label = (
    <Badge
      variant="default"
      className="h-[22px] px-2 text-[10px] font-bold tracking-[0.12em] uppercase"
    >
      <Megaphone aria-hidden="true" />
      {news.label}
    </Badge>
  );
  const time = date && (
    <time dateTime={news.date} className="text-muted-foreground tabular-nums">
      {date}
    </time>
  );
  const arrow = (
    <ArrowRight
      className="text-primary h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
      aria-hidden="true"
    />
  );

  if (variant === 'card') {
    return (
      <Link
        href={newsPostPath(news.slug) as '/'}
        prefetch={false}
        className={cn(
          'group border-primary/30 bg-primary/5 hover:bg-primary/10 block rounded-xl border p-3 transition-colors',
          className
        )}
      >
        <span className="flex items-center gap-2 text-[11px]">
          {label}
          {time}
          <span className="ml-auto">{arrow}</span>
        </span>
        <span className="text-foreground group-hover:text-primary mt-2 line-clamp-2 text-[13px] leading-snug font-semibold text-pretty transition-colors">
          {news.title}
        </span>
        {news.excerpt && (
          <span className="text-muted-foreground mt-1 line-clamp-3 text-xs leading-relaxed">
            {news.excerpt}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={newsPostPath(news.slug) as '/'}
      prefetch={false}
      className={cn(
        'group border-primary/40 bg-primary/10 text-foreground hover:bg-primary/15 inline-flex h-[30px] max-w-full min-w-0 items-center gap-2 rounded-full border pr-3 pl-1 text-xs shadow-sm transition-colors',
        className
      )}
    >
      {label}
      <span className="min-w-0 truncate">
        {time && (
          <>
            {time}
            <span className="text-muted-foreground/60"> · </span>
          </>
        )}
        <span className="font-medium">{news.title}</span>
      </span>
      {arrow}
    </Link>
  );
}
