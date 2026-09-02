import { cn } from '@/lib/utils';

/**
 * The hero's pill row — the layout the nearby bubbles AND their skeleton both render into.
 *
 * Its whole job is to have a height that does not depend on its contents, because the two
 * versions never wrap identically: the skeleton cannot know how long "Chimelong Ocean Kingdom"
 * is, so a freely-wrapping row changed height when the real pills replaced it and pushed
 * everything below the hero down (a measured 0.0147 CLS on a throttled phone).
 *
 * Below `sm` that means one scrollable row — all five parks stay reachable by swiping. From
 * `sm` it is exactly two rows tall; five pills across a ~700px column fill them, and anything
 * that would spill into a third is clipped rather than allowed to move the page.
 */
export function HeroBubbleRow({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // The marker the hero's left panel targets to fade this row out while the search
      // dropdown is open — see HeroTextPanel. The Parkfan95 pill below carries it too.
      data-hero-under-search=""
      className={cn(
        'flex h-9 items-center gap-2.5 overflow-x-auto overflow-y-hidden',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        'sm:h-[5.375rem] sm:flex-wrap sm:content-start sm:overflow-x-hidden',
        'transition-opacity duration-200',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
