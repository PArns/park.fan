'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { DialogClose, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** The tinted field behind a band without a photograph, shared with `PushDialogHero`. */
export const DIALOG_HERO_TINT =
  'from-primary/25 via-primary/8 absolute inset-0 bg-gradient-to-br to-transparent';

/**
 * The close button of a band that brings its own (the dialog then passes
 * `showCloseButton={false}`), shared by `DialogHero` and `PushDialogHero`.
 */
export function DialogHeroClose({ onPhoto = false }: { onPhoto?: boolean }) {
  // `common`, because a dialog's close button is chrome — the namespace every page already ships.
  const tCommon = useTranslations('common');

  return (
    <DialogClose
      aria-label={tCommon('close')}
      className={cn(
        'absolute top-2.5 right-2.5 z-10 rounded-full p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none',
        // Over a photograph the button has to carry its own ground: the dialog's default close
        // is `text-muted-foreground`, which lands somewhere between invisible and illegible
        // depending on what the picture happens to do in that corner.
        onPhoto
          ? 'bg-black/35 text-white/90 ring-white/40 hover:bg-black/55 hover:text-white'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground ring-ring',
        // A 27 px target is under everything this project asks of a control on a phone, and the
        // close is the one the reader reaches for with a thumb while holding the device.
        'max-sm:top-2 max-sm:right-2 max-sm:p-2.5'
      )}
    >
      <X className="size-4" aria-hidden="true" />
    </DialogClose>
  );
}

/**
 * The band across the top of a full-dress dialog: a title, a line under it, and either a photograph
 * or a tinted field with an oversized translucent glyph (`ChapterHeading`'s), so two dialogs opened
 * from the same calendar read as one product. The height is fixed, so a picture that lands later
 * moves nothing. Renders the dialog's `DialogTitle`, so the caller passes `showCloseButton={false}`
 * and adds no header of its own.
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
   * How many lines the title may take before it is cut: one for a park name, two where the title
   * is a sentence, such as a date that would otherwise end in an ellipsis on a phone. A prop,
   * because `truncate` and `whitespace-normal` both survive tailwind-merge and stylesheet order
   * would decide.
   */
  titleLines?: 1 | 2;
  /** The line under the title. Rendered inside this component's own `<p>`. */
  description?: ReactNode;
  descriptionClassName?: string;
  /**
   * Whether that line is also the dialog's accessible description. Opt-in, because a dialog has
   * exactly one: Radix points `aria-describedby` at a single id.
   */
  describesDialog?: boolean;
  /**
   * Controls at the band's lower right, such as the day dialog's stepper. Not beside the close
   * button: a control that navigates within reach of one that discards invites a mis-press.
   */
  actions?: ReactNode;
  /** The picture, where the caller has one. `null`/`undefined` gives the tinted field. */
  photo?: string | null;
  /** `object-position` for that picture, from the media database's focal point. */
  photoPosition?: string;
}) {
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
          {/* Dark at the bottom, where the text is, and only there: a scrim over the whole frame
              turns a photograph into a texture. The stops are measured so the `text-xs` line
              clears AA over the brightest park photos. */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent"
            aria-hidden="true"
          />
        </>
      ) : (
        <>
          <div className={DIALOG_HERO_TINT} aria-hidden="true" />
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

      <DialogHeroClose onPhoto={Boolean(photo)} />

      {/* `pr-12` leaves the absolutely positioned close button its corner; with `actions` the
          controls sit at the foot, well under it, so the padding returns to the band's own. */}
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
