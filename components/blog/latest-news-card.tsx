import { useFormatter } from 'next-intl';
import { ArrowRight, Megaphone } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { newsPostPath } from '@/lib/blog/paths';
import { cn } from '@/lib/utils';
import type { NewsMenu } from '@/lib/navigation/news-menu';

/** The newest news post, as the card draws it. Resolved on the server from the blog manifest. */
export interface LatestNews {
  slug: string;
  title: string;
  /** Publication date, `YYYY-MM-DD`. */
  date: string;
  /** The news section's label in this locale ("News", "Actualités"), from `categories.json`. */
  label: string;
  /** The post's teaser, already cut on the server. */
  excerpt?: string;
}

/**
 * The card's data out of the news menu, which already holds the newest item and the label, so the
 * card and the news panel cannot disagree about which post is the newest or what the section is
 * called. The teaser only on request: the header already ships it for the news panel's lead.
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
 * The newest news post as the phone menu's card: label and date, then two lines of headline and a
 * few of teaser, so a 300 px column says what the news is about. The age is the date, not
 * `NewsAge`, whose relative half arrives after hydration and would move the lines under it. No
 * `'use client'`: its host is a client component already.
 */
export function LatestNewsCard({ news, className }: { news: LatestNews; className?: string }) {
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
