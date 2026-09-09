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
 * One month chip in `ParkCalendarMonthIndex`.
 *
 * Its own Client Component only because `suppressScrollToTopFor` needs an `onClick`, and the
 * index itself is an async Server Component (`getTranslations`) that cannot hold one. Without
 * this, every chip fell back to the router's default scroll-to-top — `MonthStep`, one component
 * over in `park-calendar-panel.tsx`, already carries `scroll={false}` + `suppressScrollToTopFor`
 * so its two arrows keep the reader's position; the 25-chip index below the grid is the OTHER way
 * to change the month (jump straight to a month the arrows would take a dozen taps to reach) and
 * had never gotten the same treatment, so it alone still threw the reader back to the park's
 * title card on every jump.
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
      // `getPathname` and not `href`: this app's own scroll handler (`ScrollToTop`) compares
      // against `window.location.pathname`, which carries the locale prefix, while `href` here is
      // locale-relative — see `MonthStep` for the same fix on the stepper's arrows.
      onClick={() => suppressScrollToTopFor(getPathname({ href, locale }))}
      // Every chip carries a surface, including the inactive ones. They used to be bare text on
      // `border-transparent`, which is legible on a card and was not legible at all where this row
      // used to live — directly on the park photo. A month is a control here, and a control that
      // looks like prose is not one. `min-h-9` and not `.touch-target`: this is the fallback route
      // to a month once the stepper runs out of arrows, so the chips have to be hittable — but
      // there are 25 of them in one block and 44 px each would turn the index into a wall. 36 px is
      // the button scale's own default height.
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
