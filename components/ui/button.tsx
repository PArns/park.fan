import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      /**
       * Three desk heights — 32 / 36 / 40 — and ONE phone height: 44.
       *
       * 44 px is the number the repo already wrote down, in
       * `app/admin/_ui/controls.tsx` (`CONTROL_HEIGHT = 'h-11 sm:h-9'`), with the reason beside
       * it: it is the smallest target a thumb hits reliably. It was scoped to `/admin`, and a
       * grep for `min-h-11|h-11|touch-manipulation` over `components/` and `app/[locale]` used to
       * return five hits, none of them a control — so the public site ran on a scale whose
       * LARGEST step, 40, still misses the floor, and two of whose steps sit under it. Nearly
       * every touch finding in the mobile audits is a symptom of that rather than of the
       * component it was found in, which is why the tier belongs here and not at 40 call sites.
       *
       * The three sizes collapse to one on a phone on purpose: `sm` vs `default` vs `lg` is a
       * density decision, and a finger has no density. The horizontal padding still steps, so a
       * `sm` button is still the narrow one.
       *
       * `lg`/`icon-lg` keep 40 rather than growing to 44 — they are already the biggest thing in
       * the vocabulary and are used where there is room, so raising them buys nothing and moves
       * the hero search field.
       *
       * ONE documented exception, and it is the header: `<header>` is `h-12` and that number is
       * written down in four places (see CLAUDE.md → header geometry). A 44 px control in a 48 px
       * bar is the mistake that rule exists to prevent, so the three controls that live there —
       * `LocaleSwitcher`, the `sm` search trigger and the burger — cancel this tier at their own
       * call site with `max-sm:` and say why. Their targets stay an open item; the answer for
       * them is the bar's height, not the button's.
       */
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3 max-sm:h-11',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 max-sm:h-11',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9 max-sm:size-11',
        'icon-sm': 'size-8 max-sm:size-11',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

/**
 * The exact presentation props `<Button>` applies, for a link that should *look* like a button.
 *
 * Use this instead of `<Button asChild><Link …/></Button>` in **server** components: `asChild`
 * hands the child to Radix's `Slot`, and a client component like `next/link` arrives there as a
 * lazy client reference rather than an element — which throws
 * `failed to slot onto its children` as soon as that chunk is already resolved. See
 * `docs/development/conventions.md` §14. Spreading these props needs no `Slot` at all, and keeps
 * the markup byte-identical to what `<Button>` would have rendered.
 *
 * Client components can keep using `<Button asChild>` — there is no lazy wrapper inside a single
 * client boundary.
 */
function buttonLinkProps({
  variant = 'default',
  size = 'default',
  className,
}: VariantProps<typeof buttonVariants> & { className?: string } = {}) {
  return {
    'data-slot': 'button',
    'data-variant': variant,
    'data-size': size,
    className: cn(buttonVariants({ variant, size, className })),
  };
}

export { Button, buttonVariants, buttonLinkProps };
