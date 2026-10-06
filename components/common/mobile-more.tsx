'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The part of a section a phone reader gets only on request: below a 768 px page the children are
 * `display: none` until the button is pressed, and from 768 px up nothing changes. The children are
 * always rendered, so the text stays in the HTML. The width is the page's (`@container/page`),
 * since the trip planner can leave a wide window a phone-width page. Once pressed the button leaves
 * the DOM, so focus moves to the first revealed element. `label` is a prop so a Server Component
 * resolves it.
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
