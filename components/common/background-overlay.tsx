'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BackgroundOverlayProps {
  imageSrc: string;
  alt: string;
  intensity?: 'light' | 'medium' | 'heavy';
  hoverEffect?: boolean;
  className?: string;
}

const gradientIntensity = {
  light: 'from-background/70 via-background/30 to-background/20',
  medium: 'from-background/90 via-background/40 to-background/30',
  heavy: 'from-background/95 via-background/60 to-background/40',
};

export function BackgroundOverlay({
  imageSrc,
  alt,
  intensity = 'medium',
  hoverEffect = false,
  className,
}: BackgroundOverlayProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn('absolute inset-0 z-0', className)}>
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={cn(
          'object-cover transition-opacity duration-700',
          isLoaded ? 'opacity-40' : 'opacity-0',
          hoverEffect && 'group-hover:opacity-50'
        )}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        priority={false}
        onLoad={() => setIsLoaded(true)}
      />
      <div className={cn('absolute inset-0 bg-gradient-to-t', gradientIntensity[intensity])} />
    </div>
  );
}
