'use client';

import { useEffect } from 'react';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import {
  isOutboundTarget,
  OUTBOUND_ATTRIBUTE,
  OUTBOUND_ENTITY_ATTRIBUTE,
} from '@/lib/analytics/outbound-link';
import { internalLinkClickOf } from '@/lib/analytics/internal-link';
import { faqOpenedPositionOf } from '@/lib/analytics/faq-open';

/**
 * Counts what server-rendered markup says about itself, with listeners on the document instead of
 * a client island per element: a click on a link marked with `outboundLinkAttributes` as
 * `outbound_link_clicked`, one on a link of this site inside a block marked with
 * `linkBlockAttributes` as `internal_link_clicked`, and an FAQ question opened as `faq_opened`. A
 * middle click counts as a click, because it opens the link in a tab just the same. Mounted once in
 * the locale layout. Renders nothing.
 */
export function MarkupEventTracker() {
  useEffect(() => {
    const onActivate = (event: MouseEvent) => {
      if (event.type === 'auxclick' && event.button !== 1) return;
      const outbound = (event.target as Element | null)?.closest?.(`a[${OUTBOUND_ATTRIBUTE}]`);
      if (outbound) {
        const target = outbound.getAttribute(OUTBOUND_ATTRIBUTE);
        if (isOutboundTarget(target)) {
          trackSiteEvent(
            'outbound_link_clicked',
            { target },
            outbound.getAttribute(OUTBOUND_ENTITY_ATTRIBUTE)
          );
        }
        return;
      }
      const internal = internalLinkClickOf(event.target, window.location.origin);
      if (internal) trackSiteEvent('internal_link_clicked', internal.props, internal.entity);
    };
    // `toggle` does not bubble, so it is caught on its way down.
    const onToggle = (event: Event) => {
      const position = faqOpenedPositionOf(event.target);
      if (position !== null) trackSiteEvent('faq_opened', { position });
    };
    document.addEventListener('click', onActivate);
    document.addEventListener('auxclick', onActivate);
    document.addEventListener('toggle', onToggle, true);
    return () => {
      document.removeEventListener('click', onActivate);
      document.removeEventListener('auxclick', onActivate);
      document.removeEventListener('toggle', onToggle, true);
    };
  }, []);

  return null;
}
