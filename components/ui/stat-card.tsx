import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  value: string | number;
  label: string;
  color?: string;
  className?: string;
}

export function StatCard({ value, label, color = 'text-primary', className }: StatCardProps) {
  return (
    <Card>
      <CardContent className={cn('p-3 sm:p-4', className)}>
        <div className={cn('text-xl sm:text-2xl font-bold', color)}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
