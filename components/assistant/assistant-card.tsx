'use client';

import { useEffect, useState } from 'react';
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

/** The card's photo from the site's card-image map, the one park and ride cards use. */
function useCardPhoto(url: string | null): [string, string] | null {
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

/** One ride with its wait, in the chips the site's in-park lists use. */
function RideRow({ name, waitMinutes }: { name: string; waitMinutes: number }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="truncate">{name}</span>
      <LiveWaitPill minutes={waitMinutes} className="shrink-0 px-2 py-0.5 text-[11px]" />
    </li>
  );
}

/**
 * A park, a ride or a park's rides as a card in Parky's chat: the site's own status, crowd and
 * wait chips on live data, the whole card a link to its page. The API builds the data; nothing
 * here is model text.
 */
export function AssistantCardView({ card }: { card: AssistantCard }) {
  const locale = useLocale();
  const opens = card.kind === 'park' ? clock(card.opens, locale) : null;
  const closes = card.kind === 'park' ? clock(card.closes, locale) : null;
  const subtitle = card.kind === 'park' ? card.place : card.park;
  const photo = useCardPhoto(card.url);

  const body = (
    <div className="border-border/60 bg-background/70 hover:border-primary/40 group mt-2 overflow-hidden rounded-xl border text-xs transition-colors">
      {photo && (
        <div className="relative h-24 w-full">
          <Image
            src={photo[0]}
            alt=""
            fill
            sizes="380px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ objectPosition: photo[1] }}
          />
          <div className="from-background/90 absolute inset-0 bg-gradient-to-t to-transparent" />
        </div>
      )}
      <div className={cn('p-3', photo && 'relative -mt-6')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {card.kind === 'rides' ? card.park : card.name}
            </p>
            {card.kind !== 'rides' && subtitle && (
              <p className="text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
          {card.url && (
            <ChevronRight className="text-muted-foreground group-hover:text-primary mt-0.5 size-4 shrink-0" />
          )}
        </div>
        {card.kind !== 'rides' && (
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
        )}
        {card.kind === 'park' && card.waits.length > 0 && (
          <ul className="border-border/60 mt-2 space-y-1.5 border-t pt-2">
            {card.waits.map((ride) => (
              <RideRow key={ride.name} {...ride} />
            ))}
          </ul>
        )}
        {card.kind === 'rides' && (
          <ul className="mt-2 space-y-1.5">
            {card.rides.map((ride) => (
              <RideRow key={ride.name} {...ride} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return card.url ? (
    <NextLink href={localizedPath(card.url, locale)} className="block">
      {body}
    </NextLink>
  ) : (
    body
  );
}
