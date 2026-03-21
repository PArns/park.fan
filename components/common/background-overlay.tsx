import { cn } from '@/lib/utils';
import { BackgroundOverlayImage } from './background-overlay-image';

interface BackgroundOverlayProps {
  imageSrc: string;
  alt: string;
  intensity?: 'light' | 'medium' | 'heavy';
  hoverEffect?: boolean;
  className?: string;
}

const gradientIntensity = {
  light: 'from-background/50 via-background/30 to-background/10',
  medium: 'from-background/60 via-background/40 to-background/10',
  heavy: 'from-background/70 via-background/60 to-background/10',
};

export function BackgroundOverlay({
  imageSrc,
  alt,
  intensity = 'medium',
  hoverEffect = false,
  className,
}: BackgroundOverlayProps) {
  return (
    <div className={cn('absolute inset-0 z-0', className)}>
      <BackgroundOverlayImage imageSrc={imageSrc} alt={alt} hoverEffect={hoverEffect} />
      <div className={cn('absolute inset-0 bg-gradient-to-t', gradientIntensity[intensity])} />
    </div>
  );
}
