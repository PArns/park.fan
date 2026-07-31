'use client';

import { Link } from '@/i18n/navigation';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface BlogPostLinkProps {
  /** Target href, already normalised to `/blog/<slug>` by the caller. */
  href: string;
  /**
   * Pre-rendered `BlogPostCard` for the preview, or nothing when the slug
   * can't be resolved. Passed in as a node rather than built here: the card
   * resolves authors and categories from disk, which is server-only.
   */
  card?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Inline reference to another blog post, with a hover preview.
 *
 * The counterpart to `BlogParkLink` / `BlogAttractionLink`: the link itself
 * navigates, and hovering opens the same `BlogPostCard` the index and the
 * related-posts rail already use, so a cross-reference looks identical
 * wherever it appears (cover photo, category, title, excerpt, reading time).
 *
 * Unlike `ParkCard`, `BlogPostCard` carries its own `grid-template-rows`, so
 * it drops straight into the popover without a wrapper.
 */
export function BlogPostLink({ href, card, children }: BlogPostLinkProps) {
  const className =
    'text-primary hover:text-primary/80 focus-visible:ring-ring/40 inline rounded-sm font-medium underline decoration-dotted underline-offset-4 transition-colors focus:outline-none focus-visible:ring-2';

  const link = (
    <Link href={href as '/'} className={className}>
      {children}
    </Link>
  );

  // Unknown slug (renamed or not yet translated) — still render a working link
  // rather than swallowing the reference.
  if (!card) return link;

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>{link}</HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="w-[420px] border-none bg-transparent p-0 shadow-none backdrop-blur-none"
      >
        {card}
      </HoverCardContent>
    </HoverCard>
  );
}
