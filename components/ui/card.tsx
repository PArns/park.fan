import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

const cardVariants = cva('rounded-xl border shadow transition-all duration-200', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground border-border',
      glass: 'bg-card/80 backdrop-blur-md border-border/50',
      solid: 'bg-card text-card-foreground border-border',
      gradient: 'bg-gradient-to-br from-card to-muted border-border',
    },
    size: {
      default: 'p-6',
      sm: 'p-4',
      lg: 'p-8',
      xl: 'p-10',
    },
    hover: {
      none: '',
      lift: 'hover:shadow-xl hover:-translate-y-1',
      glow: 'hover:shadow-2xl',
      scale: 'hover:scale-[1.02]',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    hover: 'lift',
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, size, hover, className }))} {...props} />
  )
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight text-card-foreground',
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('pt-0', className)} {...props} />
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center pt-6', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
