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

/** Card with an icon in its title and free content (wait time, status, prediction accuracy). */
export function StatusInfoCard({
  title,
  icon: Icon,
  children,
  className,
  glass = true,
}: StatusInfoCardProps) {
  return (
    <Card className={cn(glass && 'border-primary/10', className)}>
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
