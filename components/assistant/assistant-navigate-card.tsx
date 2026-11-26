'use client';

import { useCallback, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ExternalLink, LocateFixed, Navigation2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AssistantCard } from '@/lib/assistant/actions';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useCompassHeading } from '@/lib/hooks/use-compass-heading';
import { useLivePosition } from '@/lib/hooks/use-live-position';
import { localizedPath } from '@/lib/i18n/localized-path';
import { bearingBetween } from '@/lib/utils/compass';
import { calculateDistance, formatDistance } from '@/lib/utils/distance-utils';
import { PHONE_HIT_AREA } from '@/lib/utils/touch-target';

type NavigateCard = Extract<AssistantCard, { kind: 'navigate' }>;

/** Closer than this, the arrow has nothing left to point at. */
const ARRIVED_M = 15;

/** A fix coarser than this is said, as the park compass says it: the arrow may be off. */
const COARSE_M = 40;

/**
 * The way to one place inside a park, as Parky hands it over: an arrow from the visitor's own
 * position and a walking route in Google Maps. Nothing is read before „Weg zeigen": that press asks
 * the browser for the position (and, on an iPhone, for the compass), and the position stays in the
 * browser; the card was drawn with the target's position only.
 */
export function NavigateCard({ card, frame }: { card: NavigateCard; frame: string }) {
  const t = useTranslations('assistant');
  const locale = useLocale();
  const geo = useGeolocation();
  const [started, setStarted] = useState(false);
  const live = useLivePosition(started, geo.permissionGranted);
  const position = started ? (live ?? geo.position) : null;
  const accuracy = live?.accuracy ?? geo.accuracy;

  const arrow = useRef<HTMLDivElement>(null);
  const onHeading = useCallback((heading: number) => {
    arrow.current?.style.setProperty('--heading', `${heading}deg`);
  }, []);
  const compass = useCompassHeading(onHeading, started);

  const start = () => {
    setStarted(true);
    geo.refresh();
    // Safari asks for the compass only inside the tap itself.
    compass.enable();
  };

  const name =
    card.place === 'toilets'
      ? t('navToilets')
      : card.place === 'drinking_water'
        ? t('navDrinkingWater')
        : card.name;
  const metres = position
    ? calculateDistance(position.lat, position.lng, card.latitude, card.longitude)
    : null;
  const bearing = position
    ? bearingBetween(position.lat, position.lng, card.latitude, card.longitude)
    : null;
  const arrived = metres !== null && metres < ARRIVED_M;
  const compassOn = compass.status === 'active';

  return (
    <div className={cn(frame, 'p-3')}>
      <div className="flex items-center justify-between gap-2 text-sm font-semibold">
        {card.url ? (
          <NextLink href={localizedPath(card.url, locale)} className="truncate hover:underline">
            {name}
          </NextLink>
        ) : (
          <span className="truncate">{name}</span>
        )}
        <span className="text-muted-foreground shrink-0 text-xs font-normal">{card.park}</span>
      </div>

      {!started ? null : geo.permissionDenied ? (
        <p className="text-muted-foreground mt-2">{t('navDenied')}</p>
      ) : metres === null || bearing === null ? (
        <p className="text-muted-foreground mt-2">{t('navLocating')}</p>
      ) : (
        <div className="mt-2 flex items-center gap-3">
          <div
            ref={arrow}
            role="img"
            aria-label={t('navArrowLabel', { name, distance: formatDistance(metres) })}
            className="bg-primary/10 text-primary flex size-14 shrink-0 items-center justify-center rounded-full"
          >
            {arrived ? (
              <LocateFixed className="size-7" aria-hidden="true" />
            ) : (
              <Navigation2
                aria-hidden="true"
                className="size-8 transition-transform duration-150 motion-reduce:transition-none"
                style={{
                  transform: `rotate(calc(${bearing}deg - var(--heading, 0deg)))`,
                }}
              />
            )}
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="text-base font-semibold tabular-nums">
              {arrived ? t('navHere') : t('navAway', { distance: formatDistance(metres) })}
            </p>
            {!arrived && (
              <p className="text-muted-foreground">
                {compassOn ? t('navFacing') : t('navNorthUp')}
              </p>
            )}
            {compass.status === 'needs-permission' && (
              <button type="button" onClick={compass.enable} className="text-primary font-medium">
                {t('navCompass')}
              </button>
            )}
            {accuracy !== null && accuracy > COARSE_M && (
              <p className="text-muted-foreground">
                {t('navCoarse', { meters: Math.round(accuracy) })}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {!started && (
          <Button size="sm" onClick={start} className={cn('max-sm:h-8', PHONE_HIT_AREA)}>
            <LocateFixed aria-hidden="true" />
            {t('navStart')}
          </Button>
        )}
        <a
          href={card.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex items-center gap-1 font-medium hover:underline"
        >
          {t('navMaps')}
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </div>
      {card.credit && (
        <p className="text-muted-foreground mt-1.5 text-[11px]">
          {t('navCredit')}{' '}
          <a href={card.credit.url} target="_blank" rel="noopener noreferrer" className="underline">
            {card.credit.text}
          </a>
        </p>
      )}
    </div>
  );
}
