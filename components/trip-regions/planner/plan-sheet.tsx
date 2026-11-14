'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { PlanSheetClose } from './plan-controls';
import { PLAN_WIDE_QUERY } from './plan-setup';

/**
 * The sheet a press in the answer opens, a day's or a window's: from the right at a desk and from
 * the bottom on a phone, a small line over the title, the planner's own ×, a body that scrolls and
 * an optional foot. It goes inside a `Sheet` that renders it only while there is something to show.
 */
export function PlanSheetContent({
  kicker,
  title,
  onClose,
  returnFocus,
  bodyClassName,
  footer,
  children,
}: {
  kicker: ReactNode;
  title: ReactNode;
  onClose: () => void;
  /** Where the focus goes back to when the sheet closes: the control that opened it. */
  returnFocus?: () => void;
  bodyClassName?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations('tripPlanner');
  const wide = useMediaQuery(PLAN_WIDE_QUERY);
  return (
    <SheetContent
      side={wide ? 'right' : 'bottom'}
      hideClose
      onCloseAutoFocus={(event) => {
        if (!returnFocus) return;
        event.preventDefault();
        returnFocus();
      }}
      className={cn('gap-0 p-0', wide ? 'w-full sm:max-w-md' : 'max-h-[90svh] rounded-t-2xl')}
    >
      <div className="border-border/60 flex items-start gap-2 border-b px-4 py-2">
        <div className="flex min-w-0 flex-1 flex-col py-1.5">
          <SheetDescription className="text-muted-foreground text-xs">{kicker}</SheetDescription>
          <SheetTitle className="text-base leading-snug">{title}</SheetTitle>
        </div>
        <PlanSheetClose label={t('setup.close')} onClick={onClose} />
      </div>
      <div
        className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4', bodyClassName)}
      >
        {children}
      </div>
      {footer && <div className="border-border/60 border-t px-4 py-3">{footer}</div>}
    </SheetContent>
  );
}
