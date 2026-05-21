'use client';

import { useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface LiveValueDotProps {
  className?: string;
}

/**
 * Small green dot used to mark values overridden by the live weather
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
            'bg-emerald-500 inline-flex h-2 w-2 shrink-0 cursor-help rounded-full',
            className
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="top">{t('liveValueHint')}</TooltipContent>
    </Tooltip>
  );
}
