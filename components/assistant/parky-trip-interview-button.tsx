'use client';

import { useTranslations } from 'next-intl';
import { ParkyInterviewStart } from './parky-interview-start';

/** The trip planner's „Plane mit Parky deine perfekte Reise", in its own words (`tripPlanner.parky`). */
export function ParkyTripInterviewButton({
  region,
  className,
}: {
  region: string;
  className?: string;
}) {
  const t = useTranslations('tripPlanner.parky');
  return (
    <ParkyInterviewStart
      label={t('button')}
      line={t('line')}
      start={{ kind: 'trip', region }}
      className={className}
    />
  );
}
