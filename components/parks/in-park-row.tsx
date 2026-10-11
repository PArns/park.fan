import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

/**
 * An in-park list: hairlines between the rows instead of a box around each, so a row is a line of
 * text over whatever glass or photo the list sits on. The compass's list draws the same.
 */
export const IN_PARK_LIST = 'divide-foreground/10 divide-y';

/** The link that is an in-park row, shared with the compass's list so a row hovers alike. */
export const IN_PARK_ROW_LINK =
  'group -mx-2 flex min-h-11 items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/40 dark:hover:bg-white/[0.04]';

/**
 * One row of an in-park list: the name, a muted second line, whatever the row ends on (a wait, a
 * saving) and a chevron, the whole row a link. Shared by the ride lists and `NextBestRides` so
 * every in-park list reads the same.
 */
export function InParkRow({
  href,
  title,
  meta,
  trailing,
  onOpen,
}: {
  href: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  /** The row's link was followed. */
  onOpen?: () => void;
}) {
  return (
    <li>
      <Link href={href} prefetch={false} onClick={onOpen} className={IN_PARK_ROW_LINK}>
        <span className="min-w-0 flex-1">
          <span className="group-hover:text-primary flex min-w-0 items-center gap-1.5 font-medium transition-colors">
            {title}
          </span>
          {meta && <span className="text-muted-foreground block text-xs tabular-nums">{meta}</span>}
        </span>
        {trailing}
        <ChevronRight
          aria-hidden="true"
          className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-colors"
        />
      </Link>
    </li>
  );
}
