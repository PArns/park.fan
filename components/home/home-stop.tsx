import type { MouseEventHandler, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { ShotRow } from '@/components/marketing/shot-row';
import { linkBlockAttributes, type LinkBlock } from '@/lib/analytics/internal-link';
import { cn } from '@/lib/utils';

/**
 * A hairline that fades out at both ends, where a new group of stops begins: enough to tell two
 * chapters apart without a band or a frame around either.
 */
export const STOP_DIVIDER_CLASS =
  'via-border mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent to-transparent';

/**
 * One stop of the homepage under the hero: its opening (`ChapterHeading variant="stop"`, the
 * chapter's link as its `action`) beside its content, the way the tour's stops stand beside their
 * phones, or over it (`stacked`) where the content wants the page's full width.
 *
 * Beside: from a 1024 px page the opening takes five twelfths and stays in view while a long
 * content column scrolls past, and `reverse` swaps the sides, so the page reads as a zigzag. On a
 * narrower page the opening stands over its content. The content column is its own
 * `@container/page`: a card grid inside asks `@min-[1024px]/page` for a third column, and a column
 * this narrow wants two.
 *
 * `divider` draws {@link STOP_DIVIDER_CLASS} above the stop.
 */
export function HomeStop({
  heading,
  aside,
  stacked = false,
  children,
  reverse = false,
  divider = false,
  block,
  className,
}: {
  /** The stop's `ChapterHeading variant="stop"`. */
  heading: ReactNode;
  /**
   * More under the heading, in its column from a 1024 px page, where a tall content column would
   * leave that column empty; after the content below that. The heading no longer stays in view.
   */
  aside?: ReactNode;
  /**
   * The heading over the content at every width, the content at the page's full width: for a
   * content that wants every column (the news board, the nearby parks, the favourites).
   */
  stacked?: boolean;
  children: ReactNode;
  reverse?: boolean;
  divider?: boolean;
  /** What a click inside counts as (`linkBlockAttributes`). */
  block?: LinkBlock;
  /** For the section itself, e.g. `home-favorites`. */
  className?: string;
}) {
  // The tracks swap with the sides, so the content keeps the wide one either way. The content
  // spans both rows, and the second row takes what is left (`1fr`), so the aside sits right under
  // the heading however tall the content runs.
  if (stacked) {
    return (
      <section className={cn('px-4', className)} {...(block ? linkBlockAttributes(block) : {})}>
        {divider && <div aria-hidden="true" className={STOP_DIVIDER_CLASS} />}
        <div className="container mx-auto py-16 sm:py-24">
          <Reveal containsGlass className="mb-8 max-w-3xl sm:mb-10">
            {heading}
          </Reveal>
          {children}
        </div>
      </section>
    );
  }

  const side = reverse ? '@min-[1024px]/page:col-start-2' : '@min-[1024px]/page:col-start-1';
  const main = reverse ? '@min-[1024px]/page:col-start-1' : '@min-[1024px]/page:col-start-2';
  return (
    <section className={cn('px-4', className)} {...(block ? linkBlockAttributes(block) : {})}>
      {divider && <div aria-hidden="true" className={STOP_DIVIDER_CLASS} />}
      <div
        className={cn(
          'container mx-auto grid grid-cols-1 items-start gap-x-16 gap-y-10 py-16 sm:py-24 @min-[1024px]/page:grid-rows-[auto_1fr]',
          reverse
            ? '@min-[1024px]/page:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]'
            : '@min-[1024px]/page:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]'
        )}
      >
        <Reveal
          containsGlass
          className={cn(
            side,
            '@min-[1024px]/page:row-start-1',
            // Without an aside the heading spans both rows, which is the room it stays in view in.
            !aside &&
              '@min-[1024px]/page:sticky @min-[1024px]/page:top-28 @min-[1024px]/page:row-span-2'
          )}
        >
          {heading}
        </Reveal>
        <div
          className={cn(
            main,
            '@container/page min-w-0 @min-[1024px]/page:row-span-2 @min-[1024px]/page:row-start-1'
          )}
        >
          {children}
        </div>
        {aside && <div className={cn(side, 'min-w-0 @min-[1024px]/page:row-start-2')}>{aside}</div>}
      </div>
    </section>
  );
}

/**
 * A stop whose content is a screenshot on a phone (`ShotRow`), as the tour's and Parky's are: the
 * heading beside the phone, which glides as the page scrolls past. `overflow-x-clip` keeps the
 * phone's glow from widening a phone's page without cutting it off above and below.
 */
export function ShotStop({
  heading,
  src,
  alt,
  reverse = false,
  divider = false,
}: {
  /** The stop's `ChapterHeading variant="stop"`. */
  heading: ReactNode;
  src: string;
  alt: string;
  reverse?: boolean;
  divider?: boolean;
}) {
  return (
    <section className="overflow-x-clip px-4">
      {divider && <div aria-hidden="true" className={STOP_DIVIDER_CLASS} />}
      <div className="container mx-auto py-16 sm:py-24">
        <Reveal>
          <ShotRow src={src} alt={alt} reverse={reverse} drift>
            {heading}
          </ShotRow>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * A stop's link, under its lead (`ChapterHeading`'s `action`): the page that tells the rest.
 * `onClick` lets a client caller do more than follow it (`ParkyAskLink`).
 */
export function StopLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
}) {
  return (
    <Link
      href={href as '/'}
      prefetch={false}
      onClick={onClick}
      className="group text-primary inline-flex items-center gap-1.5 font-semibold"
    >
      {children}
      <ArrowRight
        className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
        aria-hidden="true"
      />
    </Link>
  );
}
