import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassNoticeProps {
  icon: LucideIcon;
  /** One line. The body says the rest. */
  title: string;
  children: ReactNode;
  /** The tint layer's classes — one sheer wash over the frosted surface. */
  tintClassName?: string;
  /** The icon's colour, light and dark. */
  iconClassName?: string;
  className?: string;
}

/**
 * The surface every "here is why this page looks like this" notice sits on.
 *
 * Built on the weather banners' surface (frosted layer + tint under a
 * `rounded-xl` border) rather than a flat tinted box, because these notices sit
 * among glass cards on a park's hero photo, where a solid pastel panel reads as
 * a browser alert pasted onto the page. Deliberately quieter than those
 * banners: nothing in a notice is urgent and there is nothing to act on, so it
 * takes a neutral border and the muted body colour, and only the icon and the
 * sheer tint carry a colour at all.
 *
 * **Kept out of Google's snippet (`data-nosnippet`), never out of the index.**
 * A notice is the most quotable prose on the strongest page the site has, and
 * every one of them is a sentence that is true for exactly as long as it is on
 * the page: a result answering "Hansa-Park Wartezeiten" with „Keine Wartezeiten
 * verfügbar", or "Taron" with a rebuild that ended in March, is a result nobody
 * clicks. `data-nosnippet` is the only directive that applies to a fragment —
 * `noindex` has no per-element form and the page-level one would drop the park
 * — so the text stays crawled, stays in the ranking and stays in front of the
 * visitor, it just may not become the description. Honoured on `div`, `span`
 * and `section` only, which is why it rides on the root `<section>` and covers
 * the subtree from there.
 */
export function GlassNotice({
  icon: Icon,
  title,
  children,
  tintClassName,
  iconClassName,
  className,
}: GlassNoticeProps) {
  return (
    <section
      className={cn('border-border/60 relative rounded-xl border p-4 shadow-sm', className)}
      role="note"
      data-nosnippet
    >
      {/* Frosted surface, same as the weather banners: the tints alone are far too sheer
          over the park's hero photo. */}
      <div
        className="bg-background/85 pointer-events-none absolute inset-0 rounded-xl backdrop-blur-md"
        aria-hidden="true"
      />
      <div
        className={cn('pointer-events-none absolute inset-0 rounded-xl', tintClassName)}
        aria-hidden="true"
      />
      <div className="relative flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', iconClassName)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          {/* A paragraph, not a div: every notice body is one sentence or two, and the
              consumers pass inline text. */}
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{children}</p>
        </div>
      </div>
    </section>
  );
}
