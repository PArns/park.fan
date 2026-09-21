import { TramFront } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { isTransportAttraction } from '@/lib/utils/transport-attractions';

interface TransportSystemBadgeProps {
  /** The park's slug. Renders nothing when absent. */
  parkSlug?: string | null;
  /** The ride's slug. Renders nothing when absent. */
  attractionSlug?: string | null;
  className?: string;
}

/**
 * „Transportsystem" — the word that separates a station from a ride.
 *
 * Efteling's steam railway is the case it was built for: a train every twenty
 * minutes leaves a queue on the platform, the feed reports that queue as a wait
 * time like any other, and a visitor reading forty minutes has no way to tell
 * that the number is a timetable rather than a crowd. Some days the headliner
 * algorithm reads the same number and puts a crown on the station.
 *
 * The badge qualifies the crown instead of removing it, which is why it sits in
 * the badge row beside `SeasonalBadge` and `WorksPeriodBadge` rather than in the
 * title line: the two facts are independent, and the crown is computed daily
 * while this one is curated and permanent. On the days the algorithm does not
 * promote the station there is no crown to sit beside at all, and the badge
 * still has something to say.
 *
 * Zinc, where the other badges on this card are coloured. It is the one marker
 * here that asks a visitor to expect less rather than more, and a colour that
 * competed with the season's amber for attention would be arguing the opposite.
 *
 * Renders nothing unless the pair is curated — see `isTransportAttraction`.
 */
export function TransportSystemBadge({
  parkSlug,
  attractionSlug,
  className,
}: TransportSystemBadgeProps) {
  const t = useTranslations('parks.transportSystem');

  if (!isTransportAttraction(parkSlug, attractionSlug)) return null;

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
