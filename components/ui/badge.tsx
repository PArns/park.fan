import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'outline',
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

/**
 * The exact presentation props `<Badge>` applies, for a link that should *look* like a badge.
 *
 * The `<Button>` counterpart, `buttonLinkProps`, carries the full reasoning: from a **server**
 * component, `asChild` hands a client component like `next/link` to Radix's `Slot` as a lazy
 * client reference rather than an element, which throws once that chunk is already resolved. See
 * `docs/development/conventions.md` §14.
 *
 * Slotting a plain `<a>` stays fine (host elements are never lazy) — see `rcdb-badge.tsx`.
 */
function badgeLinkProps({
  variant,
  className,
}: VariantProps<typeof badgeVariants> & { className?: string } = {}) {
  return {
    'data-slot': 'badge',
    className: cn(badgeVariants({ variant }), className),
  };
}

export { Badge, badgeVariants, badgeLinkProps };
