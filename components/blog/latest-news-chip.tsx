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
}

/**
 * The chip's data out of the news menu, which already holds the newest item and the label. One
 * derivation for both hosts (the homepage hero and the phone menu), so the two chips cannot
 * disagree about which post is the newest or what the section is called.
 */
export function latestNewsFrom(
  menu: Pick<NewsMenu, 'items' | 'label'> | undefined
): LatestNews | null {
  const newest = menu?.items[0];
  if (!menu || !newest) return null;
  return { slug: newest.slug, title: newest.title, date: newest.date, label: menu.label };
}

/**
 * The newest news post as one chip: the section's label, the date, the headline, an arrow.
 *
 * Used where a whole news row would cost too much room: in the homepage hero beside the
 * open-parks badge — the only news above the fold on any screen, since the hero is `min-h-dvh`,
 * and the only news a phone sees before the blog chapter at the foot of the page (the band under
 * the hero is `lg` only) — and at the top of the phone menu.
 *
 * One line by construction in the hero: the headline truncates, so the chip is exactly as tall as
 * the badge beside it and never pushes the hero down. The phone menu lets it take two
 * (`twoLines`).
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
  twoLines = false,
  className,
}: {
  news: LatestNews;
  /**
   * Let the headline take two lines. For the phone menu, whose 300 px column left three words of
   * it on one line; in the hero the chip has to stay exactly as tall as the badge beside it.
   */
  twoLines?: boolean;
  className?: string;
}) {
  const format = useFormatter();
  const date = format.dateTime(new Date(`${news.date}T00:00:00Z`), {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

  return (
    <Link
      href={newsPostPath(news.slug) as '/'}
      prefetch={false}
      className={cn(
        'group border-primary/40 bg-primary/10 text-foreground hover:bg-primary/15 inline-flex max-w-full min-w-0 items-center gap-2 border pr-3 pl-1 text-xs shadow-sm transition-colors',
        twoLines ? 'min-h-11 rounded-2xl py-1.5' : 'h-[30px] rounded-full',
        className
      )}
    >
      <Badge
        variant="default"
        className="h-[22px] px-2 text-[10px] font-bold tracking-[0.12em] uppercase"
      >
        <Megaphone aria-hidden="true" />
        {news.label}
      </Badge>
      <span className={cn('min-w-0', twoLines ? 'line-clamp-2' : 'truncate')}>
        <time dateTime={news.date} className="text-muted-foreground tabular-nums">
          {date}
        </time>
        <span className="text-muted-foreground/60"> · </span>
        <span className="font-medium">{news.title}</span>
      </span>
      <ArrowRight
        className="text-primary h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
        aria-hidden="true"
      />
    </Link>
  );
}
