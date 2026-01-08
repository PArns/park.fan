import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  badge?: React.ReactNode;
  className?: string;
}

/**
 * Section header with icon, title, and optional badge
 * Used for city sections in country pages and similar patterns
 */
export function SectionHeader({ icon: Icon, title, badge, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-4 flex items-center gap-2', className)}>
      <Icon className="text-primary h-5 w-5" />
      <h2 className="text-xl font-semibold">{title}</h2>
      {badge && <Badge variant="secondary">{badge}</Badge>}
    </div>
  );
}
