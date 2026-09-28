'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getNumberFormat } from '@/lib/utils/intl-format';
import { formatCompact } from '@/lib/utils/number-utils';

interface CompactNumberWithTooltipProps {
  value: number;
  /** Translation key for tooltip suffix (e.g. "Punkte aktuell"). Namespace is stats. */
  tooltipSuffixKey?: string;
  className?: string;
}

/**
 * Renders a compact number (e.g. 4.9M, 4,9 Mio.) with a tooltip showing the full locale-formatted
 * value and a suffix.
 */
export function CompactNumberWithTooltip({
  value,
  tooltipSuffixKey = 'dataPointsTooltipSuffix',
  className,
}: CompactNumberWithTooltipProps) {
  const locale = useLocale();
  const t = useTranslations('stats');
  const fullFormatted = getNumberFormat(locale).format(value);
  const suffix = t(tooltipSuffixKey);
  const tooltipText = `${fullFormatted} ${suffix}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={className}>{formatCompact(value, locale)}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[20rem] text-center">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}
