'use client';

import { useEffect } from 'react';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import {
  isOutboundTarget,
  OUTBOUND_ATTRIBUTE,
  OUTBOUND_ENTITY_ATTRIBUTE,
} from '@/lib/analytics/outbound-link';

/**
 * Counts a click on any link marked with `outboundLinkAttributes` (the park's website, ticket shop
 * and map links) as `outbound_link_clicked`. One listener on the document instead of a handler per
 * link, since those links are server-rendered. A middle click counts as well, because it opens the
 * link in a tab just the same. Renders nothing.
 */
export function OutboundLinkTracker() {
  useEffect(() => {
    const onActivate = (event: MouseEvent) => {
      if (event.type === 'auxclick' && event.button !== 1) return;
      const link = (event.target as Element | null)?.closest?.(`a[${OUTBOUND_ATTRIBUTE}]`);
      const target = link?.getAttribute(OUTBOUND_ATTRIBUTE) ?? null;
      if (!link || !isOutboundTarget(target)) return;
      trackSiteEvent(
        'outbound_link_clicked',
        { target },
        link.getAttribute(OUTBOUND_ENTITY_ATTRIBUTE)
      );
    };
    document.addEventListener('click', onActivate);
    document.addEventListener('auxclick', onActivate);
    return () => {
      document.removeEventListener('click', onActivate);
      document.removeEventListener('auxclick', onActivate);
    };
  }, []);

  return null;
}
