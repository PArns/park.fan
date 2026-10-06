'use client';

import { Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';

/**
 * „Virtual queue": that the ride hands out return times or boarding groups at all, not whether it
 * does right now. {@link QueueTypeBadge} reads today's live `queues`, which are empty for a shut
 * ride; `hasVirtualLine` is the curated fact, as with {@link SingleRiderBadge}. `null` is unknown
 * and renders nothing, since most rides have never been checked.
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
