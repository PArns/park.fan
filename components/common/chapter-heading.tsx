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
  className,
}: ChapterHeadingProps) {
  const watermark = index ?? (Icon ? <Icon className="h-10 w-10 sm:h-14 sm:w-14" /> : null);

  return (
    <div
      className={cn(
        'border-border mb-6 flex items-start gap-3 border-b pb-4 sm:gap-4',
        frosted && cn(TILE_GLASS, 'rounded-xl px-4 pt-3'),
        className
      )}
    >
      {watermark !== null && (
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
      <div className="min-w-0 flex-1 pt-0.5 sm:pt-1">
        {kicker && (
          <div className="text-primary mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase">
            {index && Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
            {kicker}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <As
            id={id}
            className={cn(
              'font-bold',
              id && 'scroll-mt-24',
              size === 'lg' ? 'text-2xl sm:text-4xl' : 'text-2xl sm:text-3xl'
            )}
          >
            {title}
          </As>
          {badge}
          {action && <div className="ml-auto flex items-center gap-2">{action}</div>}
        </div>
        {hint && <p className="text-muted-foreground mt-1.5 text-sm">{hint}</p>}
      </div>
    </div>
  );
}
