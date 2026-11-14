'use client';

import { useTranslations } from 'next-intl';
import { ParkyInterviewStart } from './parky-interview-start';

/** The day planner's „Plane mit Parky deinen perfekten Parktag" (`planner.parky`), for its day. */
export function ParkyDayInterviewButton({
  park,
  date,
  className,
}: {
  park?: string;
  date?: string;
  className?: string;
}) {
  const t = useTranslations('planner.parky');
  return (
    <ParkyInterviewStart
      label={t('button')}
      line={t('line')}
      start={{ kind: 'day', ...(park && { park }), ...(date && { date }) }}
      className={className}
    />
  );
}
