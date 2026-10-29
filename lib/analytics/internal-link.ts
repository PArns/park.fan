import { searchPosition, sitePageTypeOf, type SiteEventMap } from '@/lib/analytics/site-analytics';
import { isUuid } from '@/lib/utils';

/**
 * How a server-rendered block says which part of a page its links belong to. A post's body, the
 * parks under it and the reading lists are Server Components, so the block carries one data
 * attribute and the delegated listener (`LinkClickTracker`) counts a click on a link inside it as
 * `internal_link_clicked`. Which block leads a reader on is the question; the event never says
 * which link text was clicked.
 */

/** The blocks that mark their links, the closed list of the event's `block`. */
const LINK_BLOCKS = [
  'body',
  'tags',
  'parks',
  'rides',
  'posts',
  'nav',
  'related',
  'most_read',
  'nearby',
  'favorites',
  'featured',
  'header',
  'menu_sheet',
  'footer',
  'breadcrumbs',
] as const;

/** One of {@link LINK_BLOCKS}. */
export type LinkBlock = (typeof LINK_BLOCKS)[number];

/** The attribute that marks an element as a block of links and names it. */
export const LINK_BLOCK_ATTRIBUTE = 'data-link-block';

/** The attribute carrying the UUID of the park or ride a card inside a block links to. */
export const LINK_ENTITY_ATTRIBUTE = 'data-link-entity';

/** Whether a string read off the DOM is a block the event knows. */
export function isLinkBlock(value: string | null): value is LinkBlock {
  return (LINK_BLOCKS as readonly string[]).includes(value ?? '');
}

/** The attribute to spread onto the element that holds a block's links. */
export function linkBlockAttributes(block: LinkBlock): Record<string, string> {
  return { [LINK_BLOCK_ATTRIBUTE]: block };
}

/**
 * The attribute to spread onto a card's wrapper inside a block, so a click on the card names the
 * park or ride it opens. Nothing for an id that is not a UUID.
 */
export function linkEntityAttributes(entity: string | null | undefined): Record<string, string> {
  return entity && isUuid(entity) ? { [LINK_ENTITY_ATTRIBUTE]: entity.toLowerCase() } : {};
}

/** What a counted click sends: the event's properties and, for a card, its UUID. */
export interface InternalLinkClick {
  props: SiteEventMap['internal_link_clicked'];
  entity?: string;
}

/**
 * The `internal_link_clicked` a click on `target` makes, or `null`: a click on a link of this site
 * inside a marked block. `position` is the link's place among the block's distinct destinations,
 * so a card whose photo and title are two anchors to one page is one place. A button inside the
 * link (a favourite star, an alert bell) opens nothing and counts nothing.
 */
export function internalLinkClickOf(
  target: EventTarget | null,
  origin: string
): InternalLinkClick | null {
  if (!(target instanceof Element)) return null;
  const link = target.closest('a[href]') as HTMLAnchorElement | null;
  const block = link?.closest(`[${LINK_BLOCK_ATTRIBUTE}]`);
  const name = block?.getAttribute(LINK_BLOCK_ATTRIBUTE) ?? null;
  if (!link || !block || !isLinkBlock(name) || link.origin !== origin) return null;
  const button = target.closest('button');
  if (button && link.contains(button)) return null;

  const destinations: string[] = [];
  for (const anchor of block.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    if (anchor.origin === origin && !destinations.includes(anchor.pathname)) {
      destinations.push(anchor.pathname);
    }
  }
  const index = destinations.indexOf(link.pathname);
  const card = link.closest(`[${LINK_ENTITY_ATTRIBUTE}]`);
  const entity = card && block.contains(card) ? card.getAttribute(LINK_ENTITY_ATTRIBUTE) : null;

  return {
    props: {
      block: name,
      dest: sitePageTypeOf(link.pathname),
      position: searchPosition(index + 1),
    },
    ...(entity ? { entity } : {}),
  };
}
