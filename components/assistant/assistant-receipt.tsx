'use client';

import { useLocale, useTranslations } from 'next-intl';
import { CalendarCheck, Eye, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatParkDay } from '@/lib/utils/park-day';
import type { AssistantReceipt } from '@/lib/assistant/actions';

/** What an answer did, as a small green pill under it: its chips and its receipts. */
export const ASSISTANT_DONE_CHIP_CLASS =
  'bg-status-operating/15 text-status-operating inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium';

const SHORT_DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

/**
 * A change Parky made to a planner, under the answer that made it: what changed, and an undo that
 * goes through Parky's own undo, so it puts the plan back only while it is still as he left it. In
 * an interview on a phone the window stays open, and "Show" closes it to look at the planner.
 */
export function AssistantReceipts({
  receipts,
  onUndo,
  onShow,
}: {
  receipts: readonly AssistantReceipt[];
  onUndo: (receipt: AssistantReceipt) => void;
  /** Set where the window covers the planner: closes it for a look. */
  onShow?: () => void;
}) {
  const t = useTranslations('assistant.receipt');
  const locale = useLocale();
  return (
    <div className="mt-1.5 flex flex-col gap-1 pl-1" data-assistant-receipts="">
      {receipts.map((receipt) => (
        <div key={receipt.id} className="flex flex-wrap items-center gap-1">
          <span className={ASSISTANT_DONE_CHIP_CLASS}>
            <CalendarCheck className="size-3" aria-hidden="true" />
            {receipt.planner === 'trip'
              ? t(`trip.${receipt.change}`)
              : t('day', {
                  park: receipt.park.name,
                  date: formatParkDay(locale, receipt.date, SHORT_DAY),
                })}
          </span>
          {receipt.state ? (
            <span className="text-muted-foreground text-[11px]" role="status">
              {t(receipt.state)}
            </span>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onUndo(receipt)}
                className="text-muted-foreground hover:text-foreground h-7 px-2 text-[11px]"
              >
                <Undo2 className="size-3" aria-hidden="true" />
                {t('undo')}
              </Button>
              {onShow && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onShow}
                  className="text-primary hover:text-primary h-7 px-2 text-[11px]"
                >
                  <Eye className="size-3" aria-hidden="true" />
                  {t('show')}
                </Button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
