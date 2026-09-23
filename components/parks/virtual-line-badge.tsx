'use client';

import { Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';

/**
 * "Virtual queue" — that the ride hands out return times or boarding groups at
 * all, as opposed to whether it is doing so right now.
 *
 * The same split as {@link SingleRiderBadge}: {@link QueueTypeBadge} renders
 * today's `RETURN_TIME` / `BOARDING_GROUP` reading from the live `queues` array,
 * which is empty for a ride that is shut. Danse Macabre (Efteling) was the case
 * that showed it — closed, so no queue in the feed, so nothing on the page said
 * it runs a virtual line. `hasVirtualLine` is the curated fact about the ride.
 *
 * `null` is unknown and renders nothing. The field is curated and most rides
 * have never been checked, so an absent badge is not a statement that the ride
 * has no virtual line.
 */
export function VirtualLineBadge({
  hasVirtualLine,
  /** Inside a card's own <Link>: a tooltip instead of a nested anchor. */
  insideLink = false,
}: {
  hasVirtualLine?: boolean | null;
  insideLink?: boolean;
}) {
  const t = useTranslations('attractions.meta');

  if (hasVirtualLine !== true) return null;

  return (
    <Badge variant="outline" className="gap-1">
      <Smartphone className="h-3 w-3 shrink-0" aria-hidden="true" />
      <GlossaryTermLink termId="virtual-queue" tooltipOnly={insideLink} className="font-[inherit]">
        {t('virtualLine')}
      </GlossaryTermLink>
    </Badge>
  );
}
