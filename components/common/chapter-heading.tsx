import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
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
  /** Small uppercase line above the title. */
  kicker?: string;
  /** Node rather than string: some titles wrap a glossary link. */
  title: ReactNode;
  /** Muted line under the title, e.g. a data window ("Aus 155 Messtagen"). */
  hint?: ReactNode;
  /** Ready-made node after the title — a <Badge>, a link. */
  badge?: ReactNode;
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
  kicker,
  title,
  hint,
  badge,
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
        frosted && 'bg-background/70 rounded-t-xl px-4 pt-3 backdrop-blur-md',
        className
      )}
    >
      {watermark !== null && (
        <span
          aria-hidden="true"
          className={cn(
            'shrink-0 leading-none font-black tabular-nums',
            index ? 'text-primary/15' : 'text-primary/25',
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
        </div>
        {hint && <p className="text-muted-foreground mt-1.5 text-sm">{hint}</p>}
      </div>
    </div>
  );
}
