import { cn } from '@/lib/utils';

/**
 * The hero's text column: badge, headline, intro and the search field, standing on the photo's
 * lower edge with no panel of its own, since the photo's scrim (`HeroBackground`) carries the
 * contrast. Its direct children are the entrance stagger's steps (`hero-in-stagger`).
 */
export function HeroTextPanel({ children, className, ...rest }: React.ComponentProps<'div'>) {
  return (
    // min-w-0: a truncated row inside must not widen this box past its column. From `md` it
    // reserves its settled height per language (`.hero-text-reserve`), Parky's row included from
    // `lg`: it stands on the photo's lower edge, so a column painted half-parsed would grow upwards
    // and move the headline.
    <div {...rest} className={cn('hero-text-reserve w-full max-w-5xl min-w-0', className)}>
      {children}
    </div>
  );
}
