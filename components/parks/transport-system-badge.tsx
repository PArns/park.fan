import { TramFront } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { AttractionKind } from '@/lib/api/types';

interface TransportSystemBadgeProps {
  /**
   * The API's `attractionKind`. Anything other than `TRANSPORT` — including
   * null and absent — renders nothing.
   */
  attractionKind?: AttractionKind | null;
  className?: string;
}

/**
 * „Transportsystem": the word that separates a station from a ride. A train leaves a queue on the
 * platform that the feed reports as a wait time, so a visitor cannot tell a timetable from a crowd,
 * and the headliner algorithm sometimes crowns the station.
 *
 * The badge qualifies the crown rather than removing it, so it sits in the badge row: the crown is
 * computed daily, this fact is curated and permanent. Zinc, because it asks a visitor to expect
 * less, not more. `null` is unknown, not "no", as for {@link VirtualLineBadge}; see
 * `docs/frontend/attraction-kind.md` in v4.api.park.fan.
 */
export function TransportSystemBadge({ attractionKind, className }: TransportSystemBadgeProps) {
  const t = useTranslations('parks.transportSystem');

  if (attractionKind !== 'TRANSPORT') return null;

  return (
    <Badge
      title={t('hint')}
      className={cn(
        'border border-zinc-500/30 bg-zinc-500/15 font-semibold text-zinc-600 backdrop-blur-md dark:text-zinc-300',
        className
      )}
    >
      <TramFront className="h-3 w-3 text-inherit" />
      {t('label')}
    </Badge>
  );
}
