'use client';

import { useId } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { MenuBand } from '@/components/layout/menu-band';
import { useMenuTrigger } from '@/lib/hooks/use-menu-trigger';

/**
 * The ink of every entry in the header's nav row, in the bar's two states, in one definition so the
 * three kinds of entry cannot drift apart. Over a hero the ground is a scrim over a photo, where
 * `text-muted-foreground` drops below 4.5 : 1, so the floating bar uses `foreground/90`. No
 * `delay-`: `transition-delay` is shared with the hover rule and would delay every entry's hover.
 * See docs/rules/the-header-is-48-px-and-its-height-is-written-down-in-four.md.
 */
export const headerNavInk = (floating: boolean | undefined) =>
  floating
    ? 'text-foreground/90 hover:text-foreground'
    : 'text-muted-foreground hover:text-foreground';

/**
 * A header entry that is both a link and the trigger of a panel; the open/close behaviour lives in
 * `useMenuTrigger`, shared with the favorites entry.
 *
 * 1. **The panel's markup is always in the document**, `hidden` when closed and never unmounted: a
 *    crawler does not hover, so a panel mounted on first hover adds nothing to the link graph.
 * 2. **The trigger is a real `<a>` wherever it has somewhere to go**, so keyboard, touch and
 *    crawler reach the destination without the panel. `href` is optional for "more", which has no
 *    page; rule 1 keeps its destinations in the HTML anyway.
 *
 * Not a Radix `NavigationMenu`: it unmounts its content when closed, which rule 1 forbids.
 */
interface NavMenuProps {
  /** Where the trigger itself navigates. Omitted where the entry has no page — see rule 2. */
  href?: string;
  label: string;
  /** Panel body. Rendered on the server, present in the HTML, hidden until opened. */
  children: React.ReactNode;
  /**
   * True while the bar floats over a hero photo. It decides the ink and nothing else: the entry is
   * a link and a trigger there as anywhere else.
   */
  floating?: boolean;
  /**
   * The entry's glyph, drawn before the label in the accent, the same one the phone sheet gives the
   * same destination. Required, so no entry goes without one.
   */
  icon: LucideIcon;
}

/**
 * The icon-plus-label of a header destination, in the nav row and the phone sheet, so the two
 * cannot drift in how a glyph sits before its word.
 *
 * - **`bar`**: 14 px and a 6 px gap, since the row's width is counted (see the header).
 * - **`sheet`**: 20 px and a 12 px gap beside a `text-lg` label; the „Parks entdecken"
 *   disclosure indents its continent list by exactly these two numbers.
 */
export function NavEntryLabel({
  icon: Icon,
  size = 'bar',
  children,
}: {
  icon: LucideIcon;
  size?: 'bar' | 'sheet';
  children: React.ReactNode;
}) {
  const sheet = size === 'sheet';
  return (
    <span className={sheet ? 'flex items-center gap-3' : 'inline-flex items-center gap-1.5'}>
      <Icon
        className={cn('text-primary shrink-0', sheet ? 'size-5' : 'size-3.5')}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

/**
 * Header nav entry that is both a link and the trigger of a dropdown panel. The panel is always in
 * the HTML and hidden until opened, so crawlers see its links.
 */
export function NavMenu({ href, label, children, floating, icon }: NavMenuProps) {
  const panelId = useId();
  const { open, triggerProps, toggle, closeOnSamePageClick } = useMenuTrigger();
  const ink = headerNavInk(floating);

  const chevron = (
    <ChevronDown
      className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    />
  );

  return (
    <div {...triggerProps}>
      <div className="flex items-center gap-1">
        {href ? (
          <>
            <Link
              href={href}
              prefetch={false}
              className={`text-sm font-medium transition-colors duration-200 ${ink}`}
            >
              <NavEntryLabel icon={icon}>{label}</NavEntryLabel>
            </Link>
            {/* Separate from the link so a click can open the panel without swallowing the
                navigation — and so touch and keyboard have a control at all. */}
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={label}
              onClick={toggle}
              className={`-m-1 cursor-pointer p-1 transition-colors duration-200 ${ink}`}
            >
              {chevron}
            </button>
          </>
        ) : (
          /* No destination, so the label and the chevron are one control rather than a dead link
             beside a live button. `aria-label` would be redundant here: the button has a name
             already, and a second one reading the same word is what a screen reader announces
             instead of the visible text. */
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={toggle}
            className={`flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors duration-200 ${ink}`}
          >
            <NavEntryLabel icon={icon}>{label}</NavEntryLabel>
            {chevron}
          </button>
        )}
      </div>

      <MenuBand id={panelId} open={open} onClick={closeOnSamePageClick}>
        {children}
      </MenuBand>
    </div>
  );
}
