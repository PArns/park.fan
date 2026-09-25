import { ArrowRight, Megaphone } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { newsPostPath } from '@/lib/blog/paths';
import { cn } from '@/lib/utils';

/** The newest news post, as the chip draws it. Resolved on the server from the blog manifest. */
export interface LatestNews {
  slug: string;
  title: string;
  /** The news section's label in this locale ("News", "Actualités"), from `categories.json`. */
  label: string;
}

/**
 * The newest news post as one chip: the section's label in the accent, the headline, an arrow.
 *
 * Used where a whole news row would cost too much room: in the homepage hero beside the
 * open-parks badge, which is the only news a phone sees before the blog chapter at the bottom of
 * the page (the band under the hero is `lg` only), and at the top of the phone menu.
 *
 * One line by construction in the hero — the headline truncates, so the chip is exactly as tall as
 * the badge beside it and never pushes the hero down. The phone menu lets it take two
 * (`twoLines`). No age on it on purpose: `NewsAge` adds its relative half after hydration, and
 * inside a truncating line that would slide the headline sideways under the reader's eyes. The
 * post itself is one tap away and says how old it is.
 *
 * No `'use client'` and no hooks, so the client header and the client hero render the same
 * component the server would.
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
      <span className="bg-primary text-primary-foreground inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full px-2 text-[10px] font-bold tracking-[0.12em] uppercase">
        <Megaphone className="h-3 w-3" aria-hidden="true" />
        {news.label}
      </span>
      <span className={cn('min-w-0 font-medium', twoLines ? 'line-clamp-2' : 'truncate')}>
        {news.title}
      </span>
      <ArrowRight
        className="text-primary h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
        aria-hidden="true"
      />
    </Link>
  );
}
