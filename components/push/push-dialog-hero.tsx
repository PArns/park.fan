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
 * The head every push-alert dialog opens with: a tinted ground carrying an oversized translucent
 * glyph, with the title and a line of explanation beside it, as `ChapterHeading` does, since a
 * surface about itself shows the app rather than a stock photo. The glyph is whole, not bled off
 * an edge, because a cropped bell stops reading as a bell. It brings its own close button
 * (`DialogHeroClose`), so the dialogs pass `showCloseButton={false}`. Not `DialogHero`, whose
 * fixed height and bottom-anchored text suit a photo; this one grows with a two-line title, so a
 * long ride name never ends in an ellipsis.
 */
export function PushDialogHero({ icon: Icon, title, description, children }: PushDialogHeroProps) {
  // A ground of its own under the gradient (`bg-muted/40`), which runs to transparent at the lower
  // right, or header and footer run together into one block.
  return (
    <div className="bg-muted/40 relative flex min-h-28 shrink-0 flex-col justify-center overflow-hidden border-b px-5 py-4 sm:px-6">
      <div className={DIALOG_HERO_TINT} aria-hidden="true" />
      {/* Sized off the band, not in pixels, and never bled past its edge, so the flare and
          clapper that make a bell a bell are never cut away. `min-h-28` gives it something to be
          big in. Filled as well as stroked, so at this size it reads as a mark. */}
      <Icon
        className="text-primary/25 fill-primary/10 pointer-events-none absolute top-1/2 right-4 aspect-square h-[88%] max-h-24 w-auto -translate-y-1/2"
        aria-hidden="true"
      />

      <DialogHeroClose />

      {/* Positioned, so it paints over the two absolute decorative layers above. `pr-24` clears
          the mark (`max-h-24` plus its `right-4`), so a long title cannot run through the bell. */}
      <div className="relative pr-24">
        <DialogTitle className="line-clamp-2 text-base font-semibold">{title}</DialogTitle>
        <DialogDescription className="mt-1 text-xs leading-snug">{description}</DialogDescription>
        {children}
      </div>
    </div>
  );
}
