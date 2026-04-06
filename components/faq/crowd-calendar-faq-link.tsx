'use client';

import type { ReactNode } from 'react';

/**
 * Hash link for the park page calendar tab. next-intl Link / next/link use pushState and
 * do not reliably fire `hashchange`, which TabsWithHash depends on to switch tabs.
 */
export function CrowdCalendarFaqLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href="#calendar"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        // Direct hash update fires `hashchange` in browsers; Link/pushState does not.
        if (window.location.hash === '#calendar') {
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        } else {
          window.location.hash = 'calendar';
        }
      }}
    >
      {children}
    </a>
  );
}
