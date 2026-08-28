'use client';

import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';

/**
 * "Single Rider" — that the ride has such a queue at all.
 *
 * Deliberately not derived from the live `queues` array, which is what
 * {@link QueueTypeBadge} renders: a single-rider queue that happens to be shut
 * right now, or a park whose wait times we cannot read at all, would make the
 * ride look as though it never had one. The API keeps the two apart for exactly
 * this reason — `queues` answers "is it open and how long", `hasSingleRider`
 * answers "does it exist" — and this badge is the second question.
 *
 * `null` is unknown and renders nothing. Most of the ~7000 attractions have
 * never been checked, so an absent badge is not a statement that the ride has
 * no single-rider line.
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
