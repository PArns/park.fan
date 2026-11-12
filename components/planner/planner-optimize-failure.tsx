'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The line a planner surface draws where the optimizer could not answer: what happened, and a
 * retry. The plan is left as it was, so the line promises nothing else. Shared by the optimise
 * row, the fit assistant and the wizard's last step.
 */
export function PlannerOptimizeFailure({
  onRetry,
  className,
}: {
  onRetry: () => void;
  className?: string;
}) {
  const t = useTranslations('planner');
  const tCommon = useTranslations('common');
  return (
    <p
      role="alert"
      data-planner-optimize-failed=""
      className={cn(
        'border-crowd-high/40 bg-crowd-high/10 text-crowd-high flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md border px-2 py-1.5 text-[11px] leading-snug',
        className
      )}
    >
      <AlertTriangle className="size-3.5 shrink-0 self-center" aria-hidden="true" />
      <span className="min-w-0 flex-1 font-medium">{t('optimize.failed')}</span>
      <button
        type="button"
        onClick={onRetry}
        data-planner-optimize-retry=""
        className="hover:bg-crowd-high/15 inline-flex items-center gap-1 rounded px-1 py-0.5 underline underline-offset-2 transition-colors"
      >
        <RotateCcw className="size-3 shrink-0" aria-hidden="true" />
        {tCommon('retry')}
      </button>
    </p>
  );
}
