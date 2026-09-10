'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { DialogClose, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * The band across the top of a full-dress dialog: a title, a line under it, and either a
 * photograph or a tinted field with an oversized translucent glyph.
 *
 * It was the planner wizard's alone (`WizardHero`), and the day comparison needed the same thing —
 * two dialogs opened from the same calendar, one of them leading directly into the other, drawn
 * as a plain `DialogHeader` and as this band would have read as two different products. What is
 * shared is the CHROME: the fixed height, the two ways of filling it, the close button that has to
 * carry its own ground over a picture, and the text block at the lower edge. What each caller
 * keeps is what its own line says.
 *
 * **No photo is a designed state, not a grey box** — the tinted field takes the same oversized
 * glyph the site's chapter headings use (`ChapterHeading`), at the same height as the photo
 * variant, so nothing moves when a picture lands a beat later.
 *
 * The height is FIXED (`h-28`, `sm:h-32`) and that is load-bearing: the wizard's picture arrives
 * with the park, one step in, and a band that grew for it would move the step under it.
 *
 * Renders the dialog's `DialogTitle`, so a caller passes `showCloseButton={false}` to
 * `DialogContent` and adds no header of its own.
 */
export function DialogHero({
  icon: Icon,
  title,
  titleClassName,
  titleLines = 1,
  description,
  descriptionClassName,
  describesDialog = false,
  actions,
  photo,
  photoPosition,
}: {
  /** The watermark glyph for the photo-less state. Never drawn over a picture. */
  icon: LucideIcon;
  title: ReactNode;
  titleClassName?: string;
  /**
   * How many lines the title may take before it is cut.
   *
   * One by default, because a park name is a name and half of one says nothing. Two where the
   * title is a sentence the reader is here to read — the day dialog's „Donnerstag, 10. September
   * 2026" is 29 characters against about 240 px once the day stepper has taken its width, so at
   * one line every date on a phone would end in an ellipsis. It is a prop rather than a class,
   * because `truncate` and `whitespace-normal` land in different tailwind-merge groups and both
   * survive the merge — which of them wins is then stylesheet order.
   */
  titleLines?: 1 | 2;
  /** The line under the title. Rendered inside this component's own `<p>`. */
  description?: ReactNode;
  descriptionClassName?: string;
  /**
   * Whether that line is also the dialog's accessible description.
   *
   * A dialog has exactly ONE — Radix hands `DialogDescription` a single generated id and points
   * `aria-describedby` at it — so this is opt-in rather than the default: the wizard's band names
   * a park and a date while its description says which step of how many it is, and rendering two
   * would put the same id on both. The comparison's band carries the verdict, which is the one
   * sentence that dialog exists to produce, so there it is the description.
   */
  describesDialog?: boolean;
  /**
   * Controls at the band's lower right — the day dialog's prev/next stepper.
   *
   * Down here rather than beside the close button, which is the corner every dialog on the site
   * uses for one thing: a control that navigates sitting inside the target of a control that
   * discards is a mis-press waiting to happen, and on a phone both would be inside one thumb's
   * travel.
   */
  actions?: ReactNode;
  /** The picture, where the caller has one. `null`/`undefined` gives the tinted field. */
  photo?: string | null;
  /** `object-position` for that picture, from the media database's focal point. */
  photoPosition?: string;
}) {
  // `common`, because a dialog's close button is chrome — the namespace every page already ships.
  const tCommon = useTranslations('common');
  const descriptionClasses = cn(
    'mt-0.5 text-xs sm:text-sm',
    photo ? 'text-white/85' : 'text-muted-foreground',
    descriptionClassName
  );

  return (
    <div className="relative h-28 shrink-0 overflow-hidden sm:h-32">
      {photo ? (
        <>
          <Image
            key={photo}
            src={photo}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 512px"
            className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500"
            style={{ objectFit: 'cover', objectPosition: photoPosition }}
          />
          {/* Dark at the bottom because that is where the text is, and only there: a scrim over
              the whole frame turns a photograph into a texture.

              The three stops are MEASURED, not chosen. The first pair (`from-black/85
              via-black/45 to-black/5`) looked right on Phantasialand's night shot and was not:
              rendering six parks, hiding the text and walking the luminance of the exact box it
              had occupied put the second line — `text-xs`, so it owes 4.5:1 — at **4.20:1 on
              Disneyland at the 95th percentile**, with the brightest pixel under the title down at
              2.73:1 against the 3:1 a 20 px semibold headline owes. At `/95 · /70 · transparent`
              the same twelve cases (six parks × two viewports) read 8.73–14.09:1 at p95 and
              5.42–7.39:1 at the single worst pixel, so the small line clears AA everywhere with
              headroom and the castle's stonework is still legible. */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent"
            aria-hidden="true"
          />
        </>
      ) : (
        <>
          <div
            className="from-primary/25 via-primary/8 absolute inset-0 bg-gradient-to-br to-transparent"
            aria-hidden="true"
          />
          {/* Half as strong where `actions` share the corner with it: the glyph is 160 px of
              hairline calendar and the day stepper sits right on top of it, so at /20 the arrows
              read as part of the drawing. */}
          <Icon
            className={cn(
              'absolute -right-4 -bottom-8 size-40',
              actions ? 'text-primary/10' : 'text-primary/20'
            )}
            aria-hidden="true"
          />
        </>
      )}

      <DialogClose
        aria-label={tCommon('close')}
        className={cn(
          'absolute top-2.5 right-2.5 z-10 rounded-full p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none',
          // Over a photograph the button has to carry its own ground: the dialog's default close
          // is `text-muted-foreground`, which lands somewhere between invisible and illegible
          // depending on what the picture happens to do in that corner.
          photo
            ? 'bg-black/35 text-white/90 ring-white/40 hover:bg-black/55 hover:text-white'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground ring-ring',
          // A 27 px target is under everything this project asks of a control on a phone, and the
          // close is the one the reader reaches for with a thumb while holding the device.
          'max-sm:top-2 max-sm:right-2 max-sm:p-2.5'
        )}
      >
        <X className="size-4" aria-hidden="true" />
      </DialogClose>

      {/* The close button is absolutely positioned over this block, so the text has to leave its
          corner free — `pr-12` where nothing else is on the right. With `actions` there IS
          something, and it sits at the band's foot, well under the close, so the padding goes
          back to the band's own. */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 sm:p-5',
          !actions && 'pr-12 sm:pr-14'
        )}
      >
        <div className="min-w-0 flex-1">
          <DialogTitle
            className={cn(
              'text-xl font-semibold sm:text-2xl',
              titleLines === 2 ? 'line-clamp-2' : 'truncate',
              photo && 'text-white drop-shadow-sm',
              titleClassName
            )}
          >
            {title}
          </DialogTitle>
          {description &&
            (describesDialog ? (
              <DialogDescription className={descriptionClasses}>{description}</DialogDescription>
            ) : (
              <p className={descriptionClasses}>{description}</p>
            ))}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
