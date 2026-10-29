/**
 * Badge primitive (shadcn/ui, with Radix Slot and class-variance-authority): a small rounded pill
 * in four variants, plus `badgeLinkProps` for a link drawn as a badge. Every badge centres its text
 * on the capitals (`caps-centred`, applied to its children in `app/globals.css`) and sets a
 * leading icon as far from the left edge as from the top (`badge-icon:`), so neighbouring pills
 * share one look and one baseline.
 */
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 badge-icon:-ml-1 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
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

/**
 * Each run of bare text among a badge's children in one `<span>`: a text node is no element the
 * badge's text rule can select. Icons and other elements pass through as they are.
 */
function wrapTextRuns(children: React.ReactNode): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let run: React.ReactNode[] = [];
  const flush = () => {
    if (run.length > 0) out.push(<span key={`text-${out.length}`}>{run}</span>);
    run = [];
  };
  for (const child of React.Children.toArray(children)) {
    if (typeof child === 'string' || typeof child === 'number') run.push(child);
    else {
      flush();
      out.push(child);
    }
  }
  flush();
  return out;
}

function Badge({
  className,
  variant,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {asChild ? children : wrapTextRuns(children)}
    </Comp>
  );
}

/**
 * The exact presentation props `<Badge>` applies, for a link that should *look* like a badge.
 * Server components use it instead of `asChild` around a client component, for the reason on
 * `buttonLinkProps`. Slotting a plain `<a>` is fine: host elements are never lazy. The link's
 * text goes in a `<span>`, which `<Badge>` would have added, so it is centred like a badge's.
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
