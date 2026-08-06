'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useHeroBrowseParks } from '@/lib/hooks/use-hero-browse-parks';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { cn } from '@/lib/utils';
import { CROWD_DOT_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';

/**
 * The pill row at the bottom of the hero: the visitor's NEARBY parks with their live average
 * wait (GeoIP fallback when no location is shared, popular parks when even that finds
 * nothing). Inside a park it switches to that park's rides and their own waits.
 */
export function HeroNearbyBubbles({ className }: { className?: string }) {
  const tSearch = useTranslations('search');
  const { entries } = useHeroBrowseParks();

  // Fixed min-height so the row popping in doesn't shift the hero layout.
  return (
    <div className={cn('flex min-h-9 flex-wrap items-center gap-2.5', className)}>
      {entries.map((entry) => {
        const dotClass = entry.open
          ? entry.wait != null
            ? CROWD_DOT_CLASS[waitTimeCrowdTier(entry.wait)]
            : 'bg-status-operating'
          : 'bg-status-closed';
        const content = (
          <>
            <span className={cn('h-2 w-2 shrink-0 rounded-full', dotClass)} aria-hidden="true" />
            <span className="max-w-44 truncate font-medium">{entry.name}</span>
            {entry.open && entry.wait != null && (
              <span className="text-muted-foreground tabular-nums">
                {tSearch('avgWait', { minutes: entry.wait })}
              </span>
            )}
          </>
        );
        const pillClass =
          'border-border/50 bg-background/60 inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm shadow-sm backdrop-blur-md transition-colors';
        const href = entry.url ? convertApiUrlToFrontendUrl(entry.url) : null;
        return href ? (
          <Link
            key={entry.id}
            href={href as '/parks/europe'}
            prefetch={false}
            className={cn(pillClass, 'hover:border-primary/50 hover:bg-background/80')}
          >
            {content}
          </Link>
        ) : (
          <span key={entry.id} className={pillClass}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
