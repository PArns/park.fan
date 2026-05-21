'use client';

import { useTranslations } from 'next-intl';
import { Radio } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface LiveValueDotProps {
  className?: string;
}

/**
 * Pulsing green dot used to mark values overridden by the live weather
 * nowcast. Hovering reveals an explanation of what "Live" means here.
 */
export function LiveValueDot({ className }: LiveValueDotProps) {
  const t = useTranslations('parks.weather');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={t('liveLabel')}
          className={cn(
            'relative inline-flex h-3 w-3 shrink-0 cursor-help items-center justify-center rounded-full',
            className
          )}
        >
          <span
            className="bg-emerald-500/40 absolute h-3 w-3 animate-ping rounded-full"
            aria-hidden="true"
          />
          <Radio className="text-emerald-500 relative h-2.5 w-2.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{t('liveValueHint')}</TooltipContent>
    </Tooltip>
  );
}
