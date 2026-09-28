'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The part of a section a phone reader only gets on request.
 *
 * Below a 768 px page the children are `display: none` until the button is pressed; from 768 px
 * up the wrapper is inert and the button is not drawn, so nothing changes there. The children are
 * always rendered, on the server too: the text stays in the HTML for a crawler and for a reader
 * who opens it, and the page does not fetch anything on the press.
 *
 * The width asked is the PAGE's (`@container/page`), not the window's — the same threshold and
 * the same reason as the nearby-parks list: with the trip planner open, a wide window can leave
 * the page a phone's width.
 *
 * `label` comes in as a prop so a Server Component resolves it: the homepage's client messages
 * do not carry the `common` namespace, and this is one string.
 *
 * The button leaves the DOM once pressed, so focus moves to the first revealed element
 * (made focusable with `tabIndex=-1`) rather than falling back to `<body>` — a keyboard or
 * screen-reader user keeps their place.
 *
 * `contents` keeps the wrapper out of the layout while it is visible, so a caller can put it
 * inside a grid or a flex row and the children stay that container's items.
 */
export function MobileMore({
  label,
  children,
  contents = false,
  className,
  buttonClassName,
}: {
  label: string;
  children: ReactNode;
  /** Render the wrapper as `display: contents`, for children that are grid or flex items. */
  contents?: boolean;
  className?: string;
  /** For a caller that reorders the two boxes on a phone (`order-*`). */
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // A `display: contents` box has no box to focus, so its first child takes it.
    const target = contents ? wrapperRef.current?.firstElementChild : wrapperRef.current;
    if (!(target instanceof HTMLElement)) return;
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }, [open, contents]);

  return (
    <>
      <div
        ref={wrapperRef}
        id={id}
        className={cn(contents && 'contents', !open && '@max-[768px]/page:hidden', className)}
      >
        {children}
      </div>
      {!open && (
        <div className={cn('mt-6 flex justify-center @min-[768px]/page:hidden', buttonClassName)}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-expanded={false}
            aria-controls={id}
            onClick={() => setOpen(true)}
            className="w-full"
          >
            {label}
            <ChevronDown aria-hidden="true" />
          </Button>
        </div>
      )}
    </>
  );
}
