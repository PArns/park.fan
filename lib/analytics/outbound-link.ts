/**
 * How a server-rendered link says it leaves the site. The park page's links are Server Components
 * (a client island per link would hydrate on every park page), so a link carries two data
 * attributes and one delegated listener (`OutboundLinkTracker`) counts the click as
 * `outbound_link_clicked`, with the park's UUID as the entity.
 */

/** Where an outbound link goes, the closed list of the event's `target`. */
const OUTBOUND_TARGETS = ['park_website', 'tickets', 'maps', 'other'] as const;

/** One of {@link OUTBOUND_TARGETS}. */
export type OutboundTarget = (typeof OUTBOUND_TARGETS)[number];

/** The attribute that marks an anchor as outbound and names its target. */
export const OUTBOUND_ATTRIBUTE = 'data-outbound';

/** The attribute carrying the UUID of the park the link belongs to. */
export const OUTBOUND_ENTITY_ATTRIBUTE = 'data-outbound-entity';

/** Whether a string read off the DOM is a target the API accepts. */
export function isOutboundTarget(value: string | null): value is OutboundTarget {
  return (OUTBOUND_TARGETS as readonly string[]).includes(value ?? '');
}

/** The attributes to spread onto an `<a>` that leaves the site; `entity` is the park's UUID. */
export function outboundLinkAttributes(
  target: OutboundTarget,
  entity?: string | null
): Record<string, string> {
  return {
    [OUTBOUND_ATTRIBUTE]: target,
    ...(entity ? { [OUTBOUND_ENTITY_ATTRIBUTE]: entity } : {}),
  };
}
