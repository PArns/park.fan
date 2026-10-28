import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PHONE_HIT_AREA } from '@/lib/utils/touch-target';
import { outboundLinkAttributes, type OutboundTarget } from '@/lib/analytics/outbound-link';

interface LinkBandProps {
  /** Names the group for a screen reader and a pointer. A band of self-explaining links needs none. */
  label?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Outbound links that belong together, joined into one bordered band with a hairline between
 * them: the park's own site and ticket shop, its Wikipedia entry and socials, the two map apps. A
 * row of up to nine links then reads as three things, and every band is 36 px tall whatever it
 * holds, so an icon-only band lines up with a labelled one.
 */
export function LinkBand({ label, className, children }: LinkBandProps) {
  return (
    <div
      role={label ? 'group' : undefined}
      aria-label={label}
      title={label}
      className={cn(
        'border-border/60 divide-border/60 inline-flex h-9 items-stretch divide-x rounded-lg border text-sm font-medium',
        className
      )}
    >
      {children}
    </div>
  );
}

interface LinkBandLinkProps {
  href: string;
  label: string;
  Icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>;
  /**
   * `phone` shows only the icon below `sm`, `always` at every width. The hidden label stays in the
   * anchor as `sr-only` text, so the accessible name and the crawled anchor text do not change, and
   * `title` gives it back to a pointer.
   */
  hideLabel?: 'phone' | 'always';
  /**
   * Where the link goes and, for a park's link, the park's UUID. Marks the anchor for the
   * delegated click count (`OutboundLinkTracker`) without turning this Server Component into a
   * client one.
   */
  outbound?: { target: OutboundTarget; entity?: string | null };
}

/**
 * One outbound link in a `LinkBand`. An icon-only cell is 44 px wide below `sm`, so its
 * `PHONE_HIT_AREA` ends where its neighbour's begins instead of reaching into it.
 */
export function LinkBandLink({ href, label, Icon, hideLabel, outbound }: LinkBandLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      {...(outbound && outboundLinkAttributes(outbound.target, outbound.entity))}
      title={hideLabel ? label : undefined}
      className={cn(
        'hover:text-primary flex items-center justify-center gap-2 px-3 transition-colors',
        hideLabel === 'phone' && 'max-sm:w-11 max-sm:px-0',
        hideLabel === 'always' && 'text-muted-foreground w-11 px-0 sm:w-9',
        PHONE_HIT_AREA
      )}
    >
      {Icon && (
        <Icon
          className={cn('h-4 w-4', hideLabel !== 'always' && 'opacity-80')}
          aria-hidden="true"
        />
      )}
      <span
        className={cn(
          hideLabel === 'phone' && 'max-sm:sr-only',
          hideLabel === 'always' && 'sr-only'
        )}
      >
        {label}
      </span>
    </a>
  );
}
