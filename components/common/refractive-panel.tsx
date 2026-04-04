'use client';

import { refractive } from '@hashintel/refractive';
import { cn } from '@/lib/utils';
import { REFRACTIVE_DEFAULTS } from '@/lib/refractive-defaults';
import { useMounted } from '@/lib/use-mounted';
import { useState, useEffect } from 'react';

const RefractiveDiv = refractive.div;

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

export function RefractivePanel({
  children,
  className,
  radius = REFRACTIVE_DEFAULTS.radius,
  blur = REFRACTIVE_DEFAULTS.blur,
  bezelWidth = REFRACTIVE_DEFAULTS.bezelWidth,
  glassThickness = REFRACTIVE_DEFAULTS.glassThickness,
  refractiveIndex = REFRACTIVE_DEFAULTS.refractiveIndex,
  specularOpacity = REFRACTIVE_DEFAULTS.specularOpacity,
  specularAngle = REFRACTIVE_DEFAULTS.specularAngle,
}: RefractivePanelProps) {
  const mounted = useMounted();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const base = cn('p-6', className);
  const fallback = cn('bg-background/60 rounded-xl backdrop-blur-md', base);

  if (!mounted || isMobile) {
    return <div className={fallback}>{children}</div>;
  }

  return (
    <RefractiveDiv
      className={base}
      refraction={{
        radius,
        blur,
        bezelWidth,
        glassThickness,
        refractiveIndex,
        specularOpacity,
        specularAngle,
      }}
    >
      {children}
    </RefractiveDiv>
  );
}
