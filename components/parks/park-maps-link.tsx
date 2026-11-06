'use client';

import { useSyncExternalStore } from 'react';
import { outboundLinkAttributes } from '@/lib/analytics/outbound-link';
import type { ParkMapsLinks } from '@/lib/parks/maps-links';

/** iPhone, iPad and Mac have Apple Maps; an iPad on iPadOS 13+ reports itself as a Mac. */
function isApplePlatform(): boolean {
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
}

const noSubscription = () => () => {};

/**
 * The way to the gate in the maps app the visitor's device has: Apple Maps on Apple devices,
 * Google Maps everywhere else. The server and the first client render say Google, so the href
 * changes after hydration without a mismatch; nothing in the layout moves with it.
 */
export function ParkMapsLink({
  maps,
  parkId,
  label,
  className,
  children,
}: {
  maps: ParkMapsLinks;
  parkId?: string;
  /** The accessible name, e.g. „Route in Karten öffnen". */
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const apple = useSyncExternalStore(noSubscription, isApplePlatform, () => false);

  return (
    <a
      href={apple ? maps.apple : maps.google}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={className}
      {...outboundLinkAttributes('maps', parkId)}
    >
      {children}
    </a>
  );
}
