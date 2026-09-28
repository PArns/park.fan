'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { DIALOG_HERO_TINT, DialogHeroClose } from '@/components/common/dialog-hero';

interface PushDialogHeroProps {
  /** Drawn twice: oversized and translucent as the ground, nowhere else. */
  icon: LucideIcon;
  title: string;
  description: string;
  /** Sits under the description — the next performance, a failure to report. */
  children?: ReactNode;
}

/**
 * The head every push-alert dialog opens with, drawn the way the trip
 * planner's wizard draws its own: a tinted gradient ground carrying an
 * oversized translucent glyph, with the title and a line of explanation
 * beside it.
 *
 * Same move `ChapterHeading` makes, and the same one `WizardHero` makes for a
 * park it has no photograph of — a surface that is about itself rather than
 * about a place shows the app, never a stock picture of somebody else's park.
 * Unlike either, the glyph is whole rather than bled off an edge, and both
 * stroked and filled: `WizardHero` can crop a calendar at the corner because
 * a rounded square still reads as one, and a bell does not — see the comment
 * on the icon.
 *
 * It brings its own close button and the three dialogs pass
 * `showCloseButton={false}`: the dialog's default sits at `top-4 right-4`
 * measured against a padded body, and this head supplies its own padding.
 * The button and the tint are `DialogHero`'s own, so the phone-sized target
 * that one got is this one's too.
 *
 * Not folded into `DialogHero` itself: that band has a FIXED height and
 * anchors its text to the lower edge so a photo landing late moves nothing,
 * while this one grows with its title and a child line, keeps the glyph whole
 * instead of bled, and sets smaller type. A "compact" switch would fork every
 * one of those classes.
 *
 * The title takes two lines before it clips. `WizardHero` truncates at one,
 * which is right for a park name and wrong here — "Harry Potter and the
 * Battle at the Ministry™" over a dialog whose entire job is to say which
 * ride this is about may not end in an ellipsis.
 */
export function PushDialogHero({ icon: Icon, title, description, children }: PushDialogHeroProps) {
  // The band needs a ground of its OWN, not just the gradient: that one runs
  // to `transparent` at the lower right, i.e. to exactly the dialog colour the
  // footer sits on, so header and footer ran together into one block and the
  // `/60` hairline between them was the only thing saying otherwise.
  // `bg-muted/40` under the gradient gives the header a shade the body does
  // not have, and the border goes to full strength as its edge.
  return (
    <div className="bg-muted/40 relative flex min-h-28 shrink-0 flex-col justify-center overflow-hidden border-b px-5 py-4 sm:px-6">
      <div className={DIALOG_HERO_TINT} aria-hidden="true" />
      {/* Sized off the BAND, not in pixels, and never bled past its edge. A
          fixed `size-36` bled `-right-5 -bottom-10` put 144 px of glyph into
          a 94 px band, and `overflow-hidden` cut the bottom third away —
          the flare and the clapper, i.e. everything that makes a bell a bell
          rather than an arch. A percentage resolves against the positioned
          ancestor's box, so the mark keeps its proportion in this dialog's
          short header and in the show dialog's taller one alike; `min-h-28`
          on the band is what gives it something to be big IN, and is the
          planner wizard's own hero height (`h-28 sm:h-32`). Filled as well as
          stroked because at this size an outline alone reads as a drawing of
          a bell instead of a mark.

          Shrinking it instead (`size-20`, still bled) was tried and reported
          back as "zu klein": the bleed is what has to go, not the size. */}
      <Icon
        className="text-primary/25 fill-primary/10 pointer-events-none absolute top-1/2 right-4 aspect-square h-[88%] max-h-24 w-auto -translate-y-1/2"
        aria-hidden="true"
      />

      <DialogHeroClose />

      {/* Positioned, so it paints over the two decorative layers above — both
          are absolute, and an absolutely positioned sibling outranks the
          in-flow content of a static one whatever the DOM order says. */}
      {/* Clears the mark: 96 px of glyph (`max-h-24`) plus its own `right-4`.
          Without it "Harry Potter and the Battle at the Ministry™" ran
          straight through the bell. */}
      <div className="relative pr-24">
        <DialogTitle className="line-clamp-2 text-base font-semibold">{title}</DialogTitle>
        <DialogDescription className="mt-1 text-xs leading-snug">{description}</DialogDescription>
        {children}
      </div>
    </div>
  );
}
