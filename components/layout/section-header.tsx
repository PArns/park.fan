import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, className, children }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4 lg:mb-6', className)}>
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
