import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TILE_GLASS } from '@/components/common/glass-card';
import { cn } from '@/lib/utils';

interface ChapterHeadingProps {
  /**
   * Chapter number as it should read, already padded ("01"). Rendered as the
   * oversized translucent glyph on the left. Only pass one where the sequence
   * is complete and stable: a number that skips because a section did not
   * render looks like a bug rather than an omission.
   */
  index?: string;
  /**
   * The chapter's icon. With an `index` it sits small in the kicker line; on
   * its own it takes the number's place as the watermark, which is why it is
   * drawn at a lower opacity than the number — a hairline glyph at 15 % is
   * invisible where a solid numeral still reads.
   */
  icon?: LucideIcon;
  /**
   * Tint override for the icon — rope-drop's emerald, the evening panel's
   * indigo. Replaces the watermark's default `text-primary/25`, so pass an
   * opacity with it.
   */
  iconClassName?: string;
  /** Small uppercase line above the title. */
  kicker?: string;
  /** Node rather than string: some titles wrap a glossary link. */
  title: ReactNode;
  /** Muted line under the title, e.g. a data window ("Aus 155 Messtagen"). */
  hint?: ReactNode;
  /** Ready-made node after the title — a <Badge>, a link. */
  badge?: ReactNode;
  /**
   * A control the chapter owns, pushed to the right of the title row (the calendar's month
   * stepper). `badge` reads as part of the title; this reads as something to operate. It wraps
   * under the title on a narrow card rather than squeezing it.
   */
  action?: ReactNode;
  /**
   * Put that control beside the whole heading rather than inside the title row, so a two-storey
   * control does not push `hint` away from its title. Opt-in; below the width where both fit, the
   * control column wraps under the text.
   */
  actionAside?: boolean;
  /** Heading level, for the document outline. */
  as?: 'h2' | 'h3';
  /** Anchor id — lands on the heading itself, with the sticky-header offset. */
  id?: string;
  /**
   * `md` (default) is the site scale — park, ride and blog chapters, where a
   * page carries eight of these. `lg` is the guide's, where a chapter is a
   * screenful.
   */
  size?: 'md' | 'lg';
  /**
   * Frosted band behind the heading, for pages that render over a background photo, where bare text
   * is unreadable. The material is {@link TILE_GLASS}, the park header stack's, so the bands and
   * the card above them read as one surface; its 75 % fill is the first that keeps the muted hint
   * above AA over a bright photo. All four corners are rounded; a call site with something glued
   * underneath passes `rounded-b-none`.
   */
  frosted?: boolean;
  /**
   * How the chapter marks itself on the left. `watermark` (default) is the oversized translucent
   * glyph; `tile` is the homepage story's, the icon in a 68 px gradient plate with a pill kicker,
   * because a `/25` watermark icon disappears when it alone carries the chapter's identity.
   * Everything below the mark is shared.
   */
  variant?: 'watermark' | 'tile';
  className?: string;
}

/**
 * The site's chapter header: an oversized translucent glyph, an optional kicker, the title, and the
 * rule that closes it. The one implementation, so a reader can tell a chapter's opening from a
 * card's label. Server-compatible, so chapters render into the static shell. See
 * docs/rules/a-chapter-opens-the-same-way-everywhere.md.
 */
export function ChapterHeading({
  index,
  icon: Icon,
  iconClassName,
  kicker,
  title,
  hint,
  badge,
  action,
  actionAside = false,
  as: As = 'h2',
  id,
  size = 'md',
  frosted = false,
  variant = 'watermark',
  className,
}: ChapterHeadingProps) {
  const tile = variant === 'tile';
  // Below `sm` every part of the heading is one step smaller, since a park page stacks many of
  // these. The glyph matches the title's 28 px line box, so a one-line heading is as tall as its
  // text, not its icon.
  const watermark = index ?? (Icon ? <Icon className="h-7 w-7 sm:h-14 sm:w-14" /> : null);
  const aside = Boolean(action) && actionAside;

  return (
    <div
      data-chapter-heading=""
      className={cn(
        'border-border flex items-start border-b',
        // `flex-wrap` only in the aside case, where the control column has to be able to drop
        // under the text: what makes it drop is the text column's `min-w`, which is what says
        // „below this the two do not share a line" rather than a breakpoint that guesses at the
        // width of six languages' worth of buttons.
        aside && 'flex-wrap',
        // The phone step is a `max-sm:` class added to the desktop value, never a base value with
        // an `sm:` over it: call sites override these classes, and `twMerge` only drops the
        // unprefixed class it conflicts with, so an `sm:mb-6` would survive a caller's `mb-0`.
        tile
          ? 'mb-8 gap-4 pb-5 max-sm:mb-6 max-sm:gap-3 max-sm:pb-4'
          : cn('mb-6 gap-3 pb-4 sm:gap-4', size === 'md' && 'max-sm:pb-3'),
        frosted && cn(TILE_GLASS, 'rounded-xl px-4 pt-3 max-sm:pt-2.5'),
        className
      )}
    >
      {tile
        ? Icon && (
            <span
              aria-hidden="true"
              className={cn(
                'border-primary/30 flex size-12 shrink-0 items-center justify-center rounded-2xl border sm:size-[68px]',
                // The plate is the one gradient the design system spends, and it
                // runs 150° so the lit corner sits opposite the title rather than
                // under it. `shadow-[inset…]` is the top highlight that keeps the
                // plate from reading as a flat swatch at 68 px.
                'bg-[linear-gradient(150deg,color-mix(in_oklab,var(--color-primary)_22%,transparent)_0%,color-mix(in_oklab,var(--color-primary)_6%,transparent)_100%)]',
                'shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-primary)_25%,transparent)]'
              )}
            >
              <Icon className={cn('size-6 sm:size-8', iconClassName ?? 'text-primary')} />
            </span>
          )
        : watermark !== null && (
            <span
              aria-hidden="true"
              className={cn(
                'shrink-0 leading-none font-black tabular-nums',
                index ? 'text-primary/15' : (iconClassName ?? 'text-primary/25'),
                size === 'lg' ? 'text-5xl sm:text-7xl' : 'text-3xl sm:text-6xl'
              )}
            >
              {watermark}
            </span>
          )}
      <div
        className={cn(
          'min-w-0 flex-1',
          aside && 'sm:min-w-[18rem]',
          tile ? 'pt-1' : 'pt-0.5 sm:pt-1'
        )}
      >
        {kicker &&
          (tile ? (
            <div className="border-primary/30 bg-primary/10 text-primary mb-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.14em] uppercase sm:mb-3">
              {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
              {kicker}
            </div>
          ) : (
            <div className="text-primary mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase">
              {index && Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
              {kicker}
            </div>
          ))}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <As
            id={id}
            className={cn(
              id && 'scroll-mt-24',
              tile
                ? 'text-2xl leading-[1.08] font-extrabold tracking-[-0.03em] text-balance sm:text-[42px]'
                : cn('font-bold', size === 'lg' ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl')
            )}
          >
            {title}
          </As>
          {badge}
          {/* `flex-wrap`: when this row wraps, the action lands on a line of its own, and a wide
              stepper must be able to break rather than run past the viewport. */}
          {action && !aside && (
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{action}</div>
          )}
        </div>
        {hint && (
          <p
            className={cn(
              'text-muted-foreground',
              tile ? 'mt-2.5 max-w-3xl text-[15px] leading-relaxed' : 'mt-1.5 text-sm'
            )}
          >
            {hint}
          </p>
        )}
      </div>
      {aside && (
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2 max-sm:w-full">
          {action}
        </div>
      )}
    </div>
  );
}
