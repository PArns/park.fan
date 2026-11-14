import {
  CalendarRange,
  CalendarX,
  Ghost,
  MoonStar,
  Snowflake,
  Sparkles,
  TreePine,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParkSeasonKind } from '@/lib/api/types';
import { WORKS_TONE_CLASS, WorksIcon } from '@/components/parks/works-period-list';

/**
 * The icon and colour of every season kind, in one place for every surface that draws a season.
 * A maintenance window wears the works icon, since it is the same fact about a ride.
 */
export const SEASON_KIND_ICON: Record<ParkSeasonKind, { icon: LucideIcon; tone: string }> = {
  halloween: { icon: Ghost, tone: 'text-orange-600 dark:text-orange-400' },
  christmas: { icon: TreePine, tone: 'text-emerald-600 dark:text-emerald-400' },
  winter: { icon: Snowflake, tone: 'text-sky-600 dark:text-sky-400' },
  summer_nights: { icon: MoonStar, tone: 'text-indigo-600 dark:text-indigo-400' },
  special_event: { icon: Sparkles, tone: 'text-violet-600 dark:text-violet-400' },
  opening: { icon: CalendarRange, tone: 'text-emerald-600 dark:text-emerald-400' },
  closure: { icon: CalendarX, tone: 'text-zinc-500 dark:text-zinc-400' },
  maintenance: { icon: WorksIcon, tone: WORKS_TONE_CLASS },
};

/**
 * The kind a season is drawn and named as: its own, or `special_event` for a kind the API added
 * after this build, which then reads as an event rather than as a missing translation.
 */
export function knownSeasonKind(kind: string): ParkSeasonKind {
  return kind in SEASON_KIND_ICON ? (kind as ParkSeasonKind) : 'special_event';
}

/**
 * A season kind's icon in its colour. With a `label` it is an image of that name; without one it
 * is decoration beside a name the reader already has.
 */
export function SeasonKindIcon({
  kind,
  label,
  className,
}: {
  kind: ParkSeasonKind;
  label?: string;
  className?: string;
}) {
  const { icon: Icon, tone } = SEASON_KIND_ICON[knownSeasonKind(kind)];
  return (
    <Icon
      className={cn('size-3 shrink-0', tone, className)}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    />
  );
}
