'use client';

import { useTranslations } from 'next-intl';
import { ParkyInterviewStart } from './parky-interview-start';

/** The day planner's „Plane mit Parky deinen perfekten Parktag" (`planner.parky`), for its day. */
export function ParkyDayInterviewButton({
  park,
  parkName,
  date,
  className,
}: {
  park?: string;
  /** The park's name, so the chat can name it in its first question. */
  parkName?: string;
  date?: string;
  className?: string;
}) {
  const t = useTranslations('planner.parky');
  return (
    <ParkyInterviewStart
      label={t('button')}
      line={t('line')}
      start={{
        kind: 'day',
        ...(park && { park }),
        ...(parkName && { parkName }),
        ...(date && { date }),
      }}
      className={className}
    />
  );
}
