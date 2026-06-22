import { cn } from '@/lib/utils';

type SkeletonProps = React.HTMLAttributes<HTMLElement> & {
  /** Render as a <span> for inline contexts — a <div> is invalid inside <p>/phrasing content
   *  and triggers a hydration mismatch when the browser hoists it out of the paragraph. */
  as?: 'div' | 'span';
};

function Skeleton({ className, as: Tag = 'div', ...props }: SkeletonProps) {
  return (
    <Tag
      data-slot="skeleton"
      className={cn('bg-accent animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
