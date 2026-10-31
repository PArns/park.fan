'use client';

import NextLink from 'next/link';
import { useLocale } from 'next-intl';
import { ChevronRight, Clock } from 'lucide-react';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { LiveWaitPill } from '@/components/parks/live-wait-pill';
import { localizedPath, type AssistantCard } from '@/lib/assistant/actions';
import type { CrowdLevel, ParkStatus } from '@/lib/api/types';

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

  const body = (
    <div className="border-border/60 bg-background/70 hover:border-primary/40 group mt-2 rounded-xl border p-3 text-xs transition-colors">
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
  );

  return card.url ? (
    <NextLink href={localizedPath(card.url, locale)} className="block">
      {body}
    </NextLink>
  ) : (
    body
  );
}
