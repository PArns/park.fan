'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import NextLink from 'next/link';
import { useLocale } from 'next-intl';
import { ChevronRight, Clock } from 'lucide-react';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { LiveWaitPill } from '@/components/parks/live-wait-pill';
import { cn } from '@/lib/utils';
import { localizedPath, type AssistantCard } from '@/lib/assistant/actions';
import type { CrowdLevel, ParkStatus } from '@/lib/api/types';
import { loadCardImageMap, rideCardImageKey, type CardImageMap } from '@/lib/media/card-images';

/** The park and ride slugs of a park.fan page path: `/parks/<c>/<c>/<c>/<park>[/<ride>]`. */
function slugsOf(url: string | null): { park: string; ride?: string } | null {
  const parts = url?.split('/').filter(Boolean) ?? [];
  const at = parts.indexOf('parks');
  const park = at >= 0 ? parts[at + 4] : undefined;
  return park ? { park, ride: parts[at + 5] } : null;
}

/** The site's card-image map, the one park and ride cards use; null until it has loaded. */
function useCardImageMap(): CardImageMap | null {
  const [map, setMap] = useState<CardImageMap | null>(null);
  useEffect(() => {
    let live = true;
    void loadCardImageMap().then((loaded) => {
      if (live) setMap(loaded);
    });
    return () => {
      live = false;
    };
  }, []);
  return map;
}

/** `[src, objectPosition]` of the photo for a park or ride page, or null. */
function photoFor(map: CardImageMap | null, url: string | null): [string, string] | null {
  const slugs = slugsOf(url);
  if (!map || !slugs) return null;
  const table = slugs.ride ? map.rides : map.parks;
  const key = slugs.ride ? rideCardImageKey(slugs.park, slugs.ride) : slugs.park;
  return Object.hasOwn(table, key) ? table[key] : null;
}

/** An instant as "HH:MM" in the reader's own clock, the one every time in Parky is given in. */
function clock(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  return Number.isNaN(at.getTime())
    ? null
    : at.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/** A link to a park.fan page in the reader's language, or its children unlinked. */
function MaybeLink({
  url,
  className,
  children,
}: {
  url: string | null | undefined;
  className?: string;
  children: ReactNode;
}) {
  const locale = useLocale();
  return url ? (
    <NextLink href={localizedPath(url, locale)} className={className}>
      {children}
    </NextLink>
  ) : (
    <div className={className}>{children}</div>
  );
}

/** One ride with its wait, in the chips the site's in-park lists use; a link to it when it has one. */
function RideRow({
  name,
  waitMinutes,
  url,
}: {
  name: string;
  waitMinutes: number;
  url?: string | null;
}) {
  return (
    <li>
      <MaybeLink
        url={url}
        className={cn(
          '-mx-1.5 flex items-center justify-between gap-2 rounded-md px-1.5 py-0.5',
          url && 'hover:bg-muted/60'
        )}
      >
        <span className="truncate">{name}</span>
        <LiveWaitPill minutes={waitMinutes} className="shrink-0 px-2 py-0.5 text-[11px]" />
      </MaybeLink>
    </li>
  );
}

const FRAME =
  'border-border/60 bg-background/70 mt-2 overflow-hidden rounded-xl border text-xs transition-colors';

/**
 * A park, a ride, a park's rides or a few parks as a card in Parky's chat: the site's own status,
 * crowd and wait chips and photos on live data. A single park or ride is one link; in a list every
 * row links its own page. The API builds the data; nothing here is model text.
 */
export function AssistantCardView({ card }: { card: AssistantCard }) {
  const locale = useLocale();
  const map = useCardImageMap();

  if (card.kind === 'parks') {
    return (
      <ul className={cn(FRAME, 'divide-border/50 divide-y')}>
        {card.parks.map((park) => {
          const photo = photoFor(map, park.url);
          return (
            <li key={park.name}>
              <MaybeLink
                url={park.url}
                className="group hover:bg-muted/50 flex items-center gap-3 p-2"
              >
                <div className="bg-muted relative h-10 w-16 shrink-0 overflow-hidden rounded-lg">
                  {photo && (
                    <Image
                      src={photo[0]}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                      style={{ objectPosition: photo[1] }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{park.name}</p>
                  {park.place && <p className="text-muted-foreground truncate">{park.place}</p>}
                  {(park.status || park.crowdLevel || park.avgWaitMinutes != null) && (
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {park.status && <ParkStatusBadge status={park.status as ParkStatus} />}
                      {park.crowdLevel && <CrowdLevelBadge level={park.crowdLevel as CrowdLevel} />}
                      {park.avgWaitMinutes != null && park.status === 'OPERATING' && (
                        <LiveWaitPill
                          minutes={park.avgWaitMinutes}
                          className="px-1.5 py-0 text-[10px]"
                        />
                      )}
                    </div>
                  )}
                </div>
                {park.url && (
                  <ChevronRight className="text-muted-foreground group-hover:text-primary size-4 shrink-0" />
                )}
              </MaybeLink>
            </li>
          );
        })}
      </ul>
    );
  }

  if (card.kind === 'rides') {
    return (
      <div className={cn(FRAME, 'p-3')}>
        <MaybeLink
          url={card.url}
          className="group flex items-center justify-between gap-2 text-sm font-semibold"
        >
          <span className="truncate">{card.park}</span>
          {card.url && (
            <ChevronRight className="text-muted-foreground group-hover:text-primary size-4 shrink-0" />
          )}
        </MaybeLink>
        <ul className="mt-2 space-y-1">
          {card.rides.map((ride) => (
            <RideRow key={ride.name} {...ride} />
          ))}
        </ul>
      </div>
    );
  }

  const opens = card.kind === 'park' ? clock(card.opens, locale) : null;
  const closes = card.kind === 'park' ? clock(card.closes, locale) : null;
  const subtitle = card.kind === 'park' ? card.place : card.park;
  const photo = photoFor(map, card.url);

  return (
    <MaybeLink url={card.url} className={cn(FRAME, 'group hover:border-primary/40 block')}>
      {photo && (
        <div className="relative h-24 w-full">
          <Image
            src={photo[0]}
            alt=""
            fill
            sizes="480px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ objectPosition: photo[1] }}
          />
          <div className="from-background/90 absolute inset-0 bg-gradient-to-t to-transparent" />
        </div>
      )}
      <div className={cn('p-3', photo && 'relative -mt-6')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{card.name}</p>
            {subtitle && <p className="text-muted-foreground truncate">{subtitle}</p>}
          </div>
          {card.url && (
            <ChevronRight className="text-muted-foreground group-hover:text-primary mt-0.5 size-4 shrink-0" />
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {card.status && <ParkStatusBadge status={card.status as ParkStatus} />}
          {card.crowdLevel && <CrowdLevelBadge level={card.crowdLevel as CrowdLevel} />}
          {card.kind === 'ride' && card.waitMinutes != null && (
            <LiveWaitPill minutes={card.waitMinutes} className="px-2 py-0.5 text-[11px]" />
          )}
          {opens && closes && (
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <Clock className="size-3" />
              {opens}–{closes}
            </span>
          )}
        </div>
        {card.kind === 'park' && card.waits.length > 0 && (
          <ul className="border-border/60 mt-2 space-y-1 border-t pt-2">
            {card.waits.map((ride) => (
              <RideRow key={ride.name} name={ride.name} waitMinutes={ride.waitMinutes} />
            ))}
          </ul>
        )}
      </div>
    </MaybeLink>
  );
}
