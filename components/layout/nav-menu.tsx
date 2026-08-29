'use client';

import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { MenuBand } from '@/components/layout/menu-band';
import { useMenuTrigger } from '@/lib/hooks/use-menu-trigger';

/**
 * A header entry that is BOTH a link and the trigger of a panel.
 *
 * Two things this is built around; the open/close behaviour itself lives in `useMenuTrigger`,
 * which the favorites entry beside it shares.
 *
 * 1. **The panel's markup is always in the document.** It is `hidden` (display:none) when closed,
 *    never unmounted. A crawler does not hover, so a panel mounted on first hover contributes
 *    nothing to the link graph — which would defeat the reason the continent and country links are
 *    in the header at all. Google indexes CSS-hidden navigation normally; content that only
 *    appears after an interaction is what it cannot see.
 * 2. **The trigger is a real `<a>`.** "Parks entdecken" goes to `/parks` and "Blog" to `/blog`
 *    whether or not the panel ever opens — with a keyboard, on a touch screen, and for the
 *    crawler. The panel is an accelerator, not the only way through. (The favorites entry is the
 *    one exception in the row, and for a reason: see `FavoritesMenu`.)
 *
 * Not a Radix `NavigationMenu`: it unmounts its content when closed, which is precisely the
 * behaviour rule 1 forbids, and forcing it to mount means fighting the library for the rest of its
 * API.
 */
interface NavMenuProps {
  /** Where the trigger itself navigates. */
  href: string;
  label: string;
  /** Panel body. Rendered on the server, present in the HTML, hidden until opened. */
  children: React.ReactNode;
  /** Mirrors the rest of the bar: nothing in the header is focusable while it floats transparent. */
  disabled?: boolean;
}

export function NavMenu({ href, label, children, disabled }: NavMenuProps) {
  const panelId = useId();
  const { open, triggerProps, toggle } = useMenuTrigger({ disabled });

  return (
    <div {...triggerProps}>
      <div className="flex items-center gap-1">
        <Link
          href={href}
          prefetch={false}
          className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          tabIndex={disabled ? -1 : 0}
          data-header-stagger
        >
          {label}
        </Link>
        {/* Separate from the link so a click can open the panel without swallowing the
            navigation — and so touch and keyboard have a control at all. */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={label}
          tabIndex={disabled ? -1 : 0}
          onClick={toggle}
          className="text-muted-foreground hover:text-foreground -m-1 cursor-pointer p-1 transition-colors"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <MenuBand id={panelId} open={open}>
        {children}
      </MenuBand>
    </div>
  );
}
