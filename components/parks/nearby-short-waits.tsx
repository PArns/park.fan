'use client';

import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import { IN_PARK_LIST, InParkRow } from '@/components/parks/in-park-row';
import { LiveWaitPill } from '@/components/parks/live-wait-pill';
import { formatDistance } from '@/lib/utils/distance-utils';
import { cn, stripNewPrefix } from '@/lib/utils';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import type { NearbyShortWait } from '@/types/nearby';

/**
 * „Jetzt kurz anstehen": the rides in the open nearby parks whose live wait is well below their
 * usual one, as the API picks them (`shortWaits`). The rows are the in-park lists' rows, so a ride
 * reads the same here as standing in the park. Nothing at all when the list is empty, which is
 * every evening and the whole off-season.
 */
export function NearbyShortWaits({
  rides,
  className,
}: {
  rides: readonly NearbyShortWait[] | undefined;
  className?: string;
}) {
  const t = useTranslations('nearby');
  const tCommon = useTranslations('common');
  const linked = (rides ?? []).filter((ride) => ride.url);
  if (linked.length === 0) return null;

  return (
    <div className={cn('max-w-3xl', className)}>
      <h3 className="text-lg font-semibold">{t('shortWaits.title')}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{t('shortWaits.hint')}</p>
      <ul className={cn(IN_PARK_LIST, 'mt-3')}>
        {linked.map((ride) => (
          <InParkRow
            key={ride.id}
            href={convertApiUrlToFrontendUrl(ride.url)}
            title={
              <>
                {ride.isHeadliner && (
                  <>
                    <Star
                      aria-hidden="true"
                      className="size-3.5 shrink-0 fill-amber-500 text-amber-500"
                    />
                    <span className="sr-only">{t('headlinerBadge')}: </span>
                  </>
                )}
                <span className="truncate">{stripNewPrefix(ride.name)}</span>
              </>
            }
            meta={`${stripNewPrefix(ride.park.name)} · ${formatDistance(ride.park.distance)}`}
            trailing={
              <span className="flex shrink-0 flex-col items-end gap-1">
                <LiveWaitPill minutes={ride.waitTime} />
                <span className="text-muted-foreground text-xs tabular-nums">
                  {t('shortWaits.usually', { minutes: ride.typicalWait, unit: tCommon('min') })}
                </span>
              </span>
            }
          />
        ))}
      </ul>
    </div>
  );
}
