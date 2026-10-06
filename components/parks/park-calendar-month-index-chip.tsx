'use client';

import { useLocale } from 'next-intl';
import { Link, getPathname } from '@/i18n/navigation';
import { suppressScrollToTopFor } from '@/lib/navigation/history-navigation';
import { cn } from '@/lib/utils';

interface ParkCalendarMonthIndexChipProps {
  /** Locale-relative, the way `Link` from `@/i18n/navigation` wants it. */
  href: string;
  active: boolean;
  children: React.ReactNode;
}

/**
 * One month chip in `ParkCalendarMonthIndex`. A Client Component only because
 * `suppressScrollToTopFor` needs an `onClick`: without it, every jump to another month threw the
 * reader back to the park's title card.
 */
export function ParkCalendarMonthIndexChip({
  href,
  active,
  children,
}: ParkCalendarMonthIndexChipProps) {
  const locale = useLocale();
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      scroll={false}
      // `getPathname`, not `href`: `ScrollToTop` compares against `window.location.pathname`, which
      // carries the locale prefix, while `href` is locale-relative. `MonthStep` does the same.
      onClick={() => suppressScrollToTopFor(getPathname({ href, locale }))}
      // Every chip carries a surface, inactive ones too: a month is a control here, and bare text
      // did not read as one. `min-h-9` (the button scale's default height) and not `.touch-target`:
      // 25 chips at 44 px would turn the index into a wall.
      className={cn(
        'inline-flex min-h-9 items-center rounded-md border px-2.5 py-1 text-xs font-medium tabular-nums transition-colors',
        active
          ? 'border-primary/40 bg-primary/15 text-primary'
          : 'border-border/60 bg-muted/40 text-foreground/80 hover:border-border hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {children}
    </Link>
  );
}
