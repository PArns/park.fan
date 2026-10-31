'use client';

import NextLink from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight, Clock } from 'lucide-react';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { localizedPath, type AssistantCard } from '@/lib/assistant/actions';
import type { CrowdLevel, ParkStatus } from '@/lib/api/types';

/** "HH:MM" of a park-local ISO time with its offset, as the API sends it. */
function clock(iso: string | null): string | null {
  const match = iso?.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : null;
}

/**
 * A park or ride as a card in Parky's chat: the site's own status and crowd badges on live data,
 * and the whole card a link to its page. The API builds the data; nothing here is model text.
 */
export function AssistantCardView({ card }: { card: AssistantCard }) {
  const t = useTranslations('assistant');
  const locale = useLocale();
  const opens = card.kind === 'park' ? clock(card.opens) : null;
  const closes = card.kind === 'park' ? clock(card.closes) : null;

  const body = (
    <div className="border-border/60 bg-background/70 hover:border-primary/40 group mt-2 rounded-xl border p-3 text-xs transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{card.name}</p>
          <p className="text-muted-foreground truncate">
            {card.kind === 'park' ? card.place : card.park}
          </p>
        </div>
        {card.url && (
          <ChevronRight className="text-muted-foreground group-hover:text-primary mt-0.5 size-4 shrink-0" />
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {card.status && <ParkStatusBadge status={card.status as ParkStatus} />}
        {card.crowdLevel && <CrowdLevelBadge level={card.crowdLevel as CrowdLevel} />}
        {card.kind === 'ride' && card.waitMinutes != null && (
          <span className="bg-primary/15 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold">
            <Clock className="size-3" />
            {t('cardWait', { minutes: card.waitMinutes })}
          </span>
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
            <li key={ride.name} className="flex justify-between gap-2">
              <span className="truncate">{ride.name}</span>
              <span className="font-semibold tabular-nums">
                {t('cardWait', { minutes: ride.waitMinutes })}
              </span>
            </li>
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
