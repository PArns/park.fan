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
   * A control the chapter owns, pushed to the right of the title row.
   *
   * `badge` sits *next to* the title and reads as part of it; this sits at the
   * far end and reads as something to operate — the calendar's month stepper,
   * which used to live in the row below among the colour legend, where the most
   * important label on the page ranked after a colour key.
   *
   * It wraps under the title on a narrow card rather than squeezing it, because
   * the two are one row only while there is room for both.
   */
  action?: ReactNode;
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
   * Frosted band behind the heading, for the pages that render over a
   * background photo. Bare text is unreadable over the bright parts of an
   * arbitrary image, and a watermark glyph doubly so.
   *
   * The material is {@link TILE_GLASS} — the park header stack's, not a fourth
   * recipe. On the park page the reader meets that card first and then eight of
   * these bands under it, all over the same photo, so any difference between the
   * two reads as two kinds of surface rather than one. There was one: the band
   * was `bg-background/70` + `backdrop-blur-md`, which in the dark theme
   * composites to a NEUTRAL near-black (`oklab(0.145 0 0 / 0.7)`) while the card
   * above it is the blue-tinted `oklch(0.13 0.02 241 / 0.6)` at twice the blur.
   * Different hue, different opacity, half the blur, one page.
   *
   * `TILE_GLASS` rather than the card's own `HEAVY_GLASS`, for the reason its
   * docblock already gives one element over: 62 % is the fill for a 400 px panel
   * packed with rules and numbers, and it is not the fill for a strip carrying a
   * title and one `text-muted-foreground` hint. Measured against Europa-Park's
   * backdrop — worst band position over a scroll of the whole page, sampling the
   * composited `backdrop-filter` output off a screenshot, since it exists only in
   * the framebuffer — the hint reads 2.93:1 at 62 %, 3.86:1 at the old `/70`
   * (already under AA, and nobody had looked) and 4.60:1 at 75 %. So the band
   * takes the tiles' grade of fill, which is the first recipe on this page that
   * passes. On Phantasialand, whose photo is a dark blue night shot, the same
   * three read 5.20, 5.91 and 6.30:1.
   *
   * All four corners are rounded. The band used to be `rounded-t-xl`, on the
   * reasoning that it is the lid of the chapter under it — which is true where
   * something is actually glued to its underside (the calendar's month stepper,
   * which passes `rounded-b-none`) and false everywhere else. On the other seven
   * chapters of a park page the content below is a grid of cards with a gap over
   * it, so the band was a lid with two square corners resting on the photograph.
   * A call site that continues downward says so; a band on its own is a box.
   */
  frosted?: boolean;
  /**
   * How the chapter marks itself on the left.
   *
   * `watermark` (default) is the oversized translucent glyph every park, ride
   * and blog chapter has always drawn. `tile` is the homepage story's: the icon
   * sits in a 68 px gradient plate and the kicker becomes a pill.
   *
   * The two are the same component on purpose. The homepage runs eight chapters
   * down one scroll with no numbers — `NearbyParksSection`'s rule, since a
   * chapter here can render nothing — and a watermark icon at `/25` is the one
   * mark that disappears when it is the only thing carrying the chapter's
   * identity. The plate gives it an edge and a fill to sit on. Everything below
   * the mark (kicker, title, hint, rule) is shared, so a title still wraps and
   * measures the same in both.
   */
  variant?: 'watermark' | 'tile';
  className?: string;
}

/**
 * The site's chapter header: an oversized translucent glyph, an optional
 * kicker, the title, and the rule that closes it.
 *
 * It started as the guide page's `SectionShell` header and is now the one
 * implementation, because the alternative was visible: a park page used to
 * carry four different section headers — `text-xl font-semibold` with an
 * icon, `text-xl font-bold` with an icon, a `text-2xl` frosted pill and a bare
 * `<h2 class="text-xl font-bold">` — and a reader scrolling it could not tell
 * which of them opened a chapter and which labelled a card inside one.
 *
 * Server-compatible (no client hooks) so chapters render into the static shell.
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
  as: As = 'h2',
  id,
  size = 'md',
  frosted = false,
  variant = 'watermark',
  className,
}: ChapterHeadingProps) {
  const tile = variant === 'tile';
  const watermark = index ?? (Icon ? <Icon className="h-10 w-10 sm:h-14 sm:w-14" /> : null);

  return (
    <div
      className={cn(
        'border-border flex items-start border-b',
        tile ? 'mb-8 gap-4 pb-5' : 'mb-6 gap-3 pb-4 sm:gap-4',
        frosted && cn(TILE_GLASS, 'rounded-xl px-4 pt-3'),
        className
      )}
    >
      {tile
        ? Icon && (
            <span
              aria-hidden="true"
              className={cn(
                'border-primary/30 flex size-14 shrink-0 items-center justify-center rounded-2xl border sm:size-[68px]',
                // The plate is the one gradient the design system spends, and it
                // runs 150° so the lit corner sits opposite the title rather than
                // under it. `shadow-[inset…]` is the top highlight that keeps the
                // plate from reading as a flat swatch at 68 px.
                'bg-[linear-gradient(150deg,color-mix(in_oklab,var(--color-primary)_22%,transparent)_0%,color-mix(in_oklab,var(--color-primary)_6%,transparent)_100%)]',
                'shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-primary)_25%,transparent)]'
              )}
            >
              <Icon className={cn('size-7 sm:size-8', iconClassName ?? 'text-primary')} />
            </span>
          )
        : watermark !== null && (
            <span
              aria-hidden="true"
              className={cn(
                'shrink-0 leading-none font-black tabular-nums',
                index ? 'text-primary/15' : (iconClassName ?? 'text-primary/25'),
                size === 'lg' ? 'text-5xl sm:text-7xl' : 'text-4xl sm:text-6xl'
              )}
            >
              {watermark}
            </span>
          )}
      <div className={cn('min-w-0 flex-1', tile ? 'pt-1' : 'pt-0.5 sm:pt-1')}>
        {kicker &&
          (tile ? (
            <div className="border-primary/30 bg-primary/10 text-primary mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.14em] uppercase">
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
                ? 'text-3xl leading-[1.08] font-extrabold tracking-[-0.03em] text-balance sm:text-[42px]'
                : cn('font-bold', size === 'lg' ? 'text-2xl sm:text-4xl' : 'text-2xl sm:text-3xl')
            )}
          >
            {title}
          </As>
          {badge}
          {/* `flex-wrap`, because this row can already wrap and the action then lands on a line of
              its own — one unbreakable item in a ~204 px column. The calendar's month stepper is
              317 px of that, so its „nächster Monat" arrow rendered past the viewport's right edge
              with `body { overflow-x: clip }` swallowing it. Plain `flex-wrap`, not `max-sm:`: the
              two other call sites (home/story/blog-chapter, nearby-chapter) pass a single small
              link and have nothing to wrap either way. */}
          {action && (
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
    </div>
  );
}
