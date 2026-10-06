import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/** Page container with the standard spacing (`container mx-auto px-4 py-8`). */
export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn('container mx-auto px-4 py-8', className)}>{children}</div>;
}
