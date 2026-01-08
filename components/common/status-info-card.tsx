import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatusInfoCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

/**
 * Card component with icon in title and flexible content
 * Used for wait time, status, and prediction accuracy displays
 */
export function StatusInfoCard({
  title,
  icon: Icon,
  children,
  className,
  glass = true,
}: StatusInfoCardProps) {
  return (
    <Card className={cn(glass && 'bg-background/60 border-primary/10 backdrop-blur-md', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
