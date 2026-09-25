'use client';

import { useId } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { MenuBand } from '@/components/layout/menu-band';
import { useMenuTrigger } from '@/lib/hooks/use-menu-trigger';

/**
 * The ink of every entry in the header's nav row, in the bar's two states — one definition,
 * because the row has three kinds of entry (a plain link, this trigger pair, the favorites button)
 * and a row where one of them is a different grey is a row you read twice.
 *
 * While the bar floats over a hero the ground is a scrim over an arbitrary photo, and
 * `text-muted-foreground` cannot survive that: it is oklch(0.556) on an oklch(1) background, i.e.
 * 4.73 : 1, so 15 % of a dark photo through the scrim lands it at 3.3 : 1 and no scrim opacity
 * short of a solid bar repairs it. `/90` rather than flat `foreground`, because a link owes the
 * pointer an answer and the solid bar's own gesture is muted → foreground; measured over six hero
 * pages × 360/1440 px × light/dark the worst reading is 13.31 : 1.
 *
 * **And there is no `delay-` in here, deliberately.** The switch back to muted is the direction to
 * worry about — it may not land before the ground it is safe on — but the two cross-fading scrim
 * and material layers already keep that ground between 85 % and about 65 %, which is where the
 * solid bar itself sits. A `delay-300` would have bought the remaining 200 ms and delayed the
 * **hover** of every entry on every page by the same amount, since `transition-delay` is one
 * property and the hover rule shares it. See the header for the arithmetic.
 */
export const headerNavInk = (floating: boolean | undefined) =>
  floating
    ? 'text-foreground/90 hover:text-foreground'
    : 'text-muted-foreground hover:text-foreground';

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
 * 2. **The trigger is a real `<a>` wherever it has somewhere to go.** "Parks entdecken" goes to
 *    `/parks` whether or not the panel ever opens — with a keyboard, on a touch screen, and for the
 *    crawler. The panel is an accelerator, not the only way through. `href` is optional for the one
 *    entry that is a collection rather than a place: "more" has no page of its own, so its label is
 *    the button. That costs the link graph nothing, because rule 1 keeps every destination inside
 *    the panel in the HTML anyway. (The favorites entry is the other exception in the row, and for
 *    a reason of its own: see `FavoritesMenu`.)
 *
 * Not a Radix `NavigationMenu`: it unmounts its content when closed, which is precisely the
 * behaviour rule 1 forbids, and forcing it to mount means fighting the library for the rest of its
 * API.
 */
interface NavMenuProps {
  /** Where the trigger itself navigates. Omitted where the entry has no page — see rule 2. */
  href?: string;
  label: string;
  /** Panel body. Rendered on the server, present in the HTML, hidden until opened. */
  children: React.ReactNode;
  /**
   * True while the bar floats over a hero photo. It decides the INK and nothing else — the entry
   * is a link and a trigger up there exactly as it is anywhere else. It used to be `disabled`,
   * which took the whole row out of the tab order and refused to open the panel until the
   * visitor had scrolled 50 px; `headerNavInk` above explains the contrast arithmetic this
   * replaced it with.
   */
  floating?: boolean;
  /**
   * The entry's glyph, drawn before the label in the accent — the same one the phone sheet gives
   * the same destination, so the two menus read as one. Required: an entry without one is exactly
   * the inconsistency the icons were added to remove.
   */
  icon: LucideIcon;
}

/**
 * The icon-plus-label of a header destination, in both menus: the entries of the nav row (the
 * `NavMenu` triggers and the row's plain links) and the phone sheet's destinations. One
 * definition, so the bar and the sheet cannot drift apart in how a glyph sits before its word.
 *
 * - **`bar`**: 14 px and a 6 px gap. The row is one line by construction and its width is counted
 *   (see the header); at the sheet's 20 px five glyphs would have cost the French row most of its
 *   slack at a 1024 px bar.
 * - **`sheet`**: 20 px and a 12 px gap, beside a `text-lg` label. The „Parks entdecken"
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

export function NavMenu({ href, label, children, floating, icon }: NavMenuProps) {
  const panelId = useId();
  const { open, triggerProps, toggle } = useMenuTrigger();
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

      <MenuBand id={panelId} open={open}>
        {children}
      </MenuBand>
    </div>
  );
}
