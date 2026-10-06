/**
 * Button primitive (shadcn/ui, with Radix Slot and class-variance-authority): six variants and the
 * size scale every control uses, 32, 36 and 40 px on desktop with `sm` and `default` at 44 px on
 * phones, plus `buttonLinkProps` for a link drawn as a button.
 */
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
       * Three desk heights (32 / 36 / 40) and one phone height, 44: the smallest target a thumb
       * hits reliably. A finger has no density, so `sm` and `default` collapse to it on a phone;
       * `lg` keeps 40, it is only used where there is room. The header's controls cancel the tier
       * at their call site, see
       * docs/rules/the-header-is-48-px-and-its-height-is-written-down-in-four.md.
       * `data-[with-icon]` replaces shadcn's `has-[>svg]:`, see
       * docs/rules/no-has-selector-in-the-stylesheet.md.
       */
      size: {
        default: 'h-9 px-4 py-2 data-[with-icon]:px-3 max-sm:h-11',
        sm: 'h-8 rounded-md gap-1.5 px-3 data-[with-icon]:px-2.5 max-sm:h-11',
        lg: 'h-10 rounded-md px-6 data-[with-icon]:px-4',
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

/** `forwardRef`'s element type tag — what every lucide icon component is. */
const FORWARD_REF = Symbol.for('react.forward_ref');

/**
 * Is this child an icon that renders as the button's own `<svg>` child? An `<svg>`, a lucide icon
 * (a named `forwardRef` component) or one of our own `…Icon` components; anything with children of
 * its own is content.
 */
function isIconElement(node: React.ReactNode): boolean {
  if (!React.isValidElement(node)) return false;
  const props = node.props as { children?: React.ReactNode };
  if (node.type === React.Fragment) return hasIconChild(props.children);
  if (node.type === 'svg') return true;
  if (props.children !== undefined) return false;
  const type: unknown = node.type;
  if (typeof type === 'object' && type !== null) {
    const component = type as { $$typeof?: symbol; displayName?: string };
    return component.$$typeof === FORWARD_REF && Boolean(component.displayName);
  }
  if (typeof type === 'function') {
    const component = type as { displayName?: string; name: string };
    return /Icon$/.test(component.displayName || component.name);
  }
  return false;
}

function hasIconChild(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some(isIconElement);
}

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
  // With `asChild` the element that becomes the button is the child, so its children are the ones
  // that sit directly inside the button box.
  const content =
    asChild && React.isValidElement(props.children)
      ? (props.children.props as { children?: React.ReactNode }).children
      : props.children;

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-with-icon={hasIconChild(content) ? '' : undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

/**
 * The exact presentation props `<Button>` applies, for a link that should *look* like a button.
 * Server components use it instead of `<Button asChild><Link/></Button>`: there `next/link` reaches
 * Radix's `Slot` as a lazy client reference and throws `failed to slot onto its children`. See
 * `docs/development/conventions.md` §14.
 */
function buttonLinkProps({
  variant = 'default',
  size = 'default',
  className,
  withIcon = false,
}: VariantProps<typeof buttonVariants> & {
  className?: string;
  /**
   * The link has an icon as a direct child; spread props cannot see children, so the caller says
   * so.
   */
  withIcon?: boolean;
} = {}) {
  return {
    'data-slot': 'button',
    'data-variant': variant,
    'data-size': size,
    'data-with-icon': withIcon ? '' : undefined,
    className: cn(buttonVariants({ variant, size, className })),
  };
}

export { Button, buttonVariants, buttonLinkProps };
