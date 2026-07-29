import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { SectionHeading } from '@/components/common/section-heading';
import { cn } from '@/lib/utils';

interface PageSectionProps {
  /** Chapter icon — the section's visual anchor. */
  icon: LucideIcon;
  title: ReactNode;
  /** Muted note pushed to the right of the title (e.g. a data window). */
  hint?: string;
  /** Ready-made node rendered after the title. */
  badge?: ReactNode;
  /**
   * Frosted pill behind the heading — for pages with a background photo
   * (park/ride), where a bare heading is unreadable over bright imagery.
   */
  frosted?: boolean;
  /** Anchor id; comes with the repo's sticky-header scroll offset. */
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * One chapter of a page: the heading **and** the rhythm around it.
 *
 * `SectionHeading` alone only unified how a heading looks — every call site
 * still hand-rolled its own `<section className="mt-10">` and its own gap
 * below the title, so the spacing drifted (the live wait-time block sat a
 * clear step lower than its neighbours). Owning both here means a new chapter
 * cannot get it wrong: same top rhythm, same title, same gap to the content.
 *
 * Server-compatible (no client hooks), so chapters render into the static
 * shell for SEO and instant paint.
 */
export function PageSection({
  icon,
  title,
  hint,
  badge,
  frosted,
  id,
  className,
  children,
}: PageSectionProps) {
  return (
    <section id={id} className={cn('mt-10', id && 'scroll-mt-24', className)}>
      <SectionHeading icon={icon} title={title} hint={hint} badge={badge} frosted={frosted} />
      {children}
    </section>
  );
}
