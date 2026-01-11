import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

/**
 * Standardized statistics card with title, large value, and optional description
 * Used on homepage and park status pages
 */
export function StatsCard({ title, value, description, icon: Icon, className }: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {Icon && <Icon className="mr-2 inline h-4 w-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
      </CardContent>
    </Card>
  );
}
