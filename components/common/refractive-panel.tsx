'use client';

import { cn } from '@/lib/utils';

interface RefractivePanelProps {
  children: React.ReactNode;
  className?: string;
  radius?: number;
  blur?: number;
  bezelWidth?: number;
  glassThickness?: number;
  refractiveIndex?: number;
  specularOpacity?: number;
  specularAngle?: number;
}

export function RefractivePanel({ children, className }: RefractivePanelProps) {
  return (
    <div className={cn('bg-background/60 rounded-xl p-6 backdrop-blur-md', className)}>
      {children}
    </div>
  );
}
