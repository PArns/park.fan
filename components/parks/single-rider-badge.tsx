'use client';

import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';

/**
 * „Single Rider": that the ride has such a queue at all. Not derived from the live `queues` array
 * ({@link QueueTypeBadge}), where a single-rider queue shut right now, or a park we cannot read,
 * would make the ride look as if it had none; `hasSingleRider` answers "does it exist". `null` is
 * unknown and renders nothing, since most attractions have never been checked.
 */
export function SingleRiderBadge({
  hasSingleRider,
  /** Inside a card's own <Link>: a tooltip instead of a nested anchor. */
  insideLink = false,
}: {
  hasSingleRider?: boolean | null;
  insideLink?: boolean;
}) {
  const t = useTranslations('attractions.meta');

  if (hasSingleRider !== true) return null;

  return (
    <Badge variant="outline" className="gap-1">
      <Users className="h-3 w-3 shrink-0" aria-hidden="true" />
      <GlossaryTermLink termId="single-rider" tooltipOnly={insideLink} className="font-[inherit]">
        {t('singleRider')}
      </GlossaryTermLink>
    </Badge>
  );
}
