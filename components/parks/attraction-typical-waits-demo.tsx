import { AttractionTypicalWaits } from '@/components/parks/attraction-typical-waits';
import type { TypicalWaits } from '@/lib/api/types';

/** Mock typical-waits stats for the showcase (static, no network). */
const DEMO: TypicalWaits = {
  weekday: { typical: 35, busy: 60, sampleDays: 142 },
  weekend: { typical: 50, busy: 85, sampleDays: 88 },
  byDayOfWeek: [
    { dayOfWeek: 1, isWeekend: false, typical: 30, busy: 55, sampleDays: 28 },
    { dayOfWeek: 2, isWeekend: false, typical: 32, busy: 52, sampleDays: 29 },
    { dayOfWeek: 3, isWeekend: false, typical: 35, busy: 58, sampleDays: 27 },
    { dayOfWeek: 4, isWeekend: false, typical: 38, busy: 62, sampleDays: 28 },
    { dayOfWeek: 5, isWeekend: false, typical: 42, busy: 70, sampleDays: 30 },
    { dayOfWeek: 6, isWeekend: true, typical: 55, busy: 90, sampleDays: 44 },
    { dayOfWeek: 0, isWeekend: true, typical: 48, busy: 80, sampleDays: 44 },
  ],
  peak: { value: 120, date: '2025-08-09' },
  windowDays: 365,
  dataFrom: '2025-06-19',
  dataTo: '2026-06-18',
  displayable: true,
  generatedAt: '2026-06-19T03:00:00.000Z',
};

export function AttractionTypicalWaitsDemo() {
  return <AttractionTypicalWaits typicalWaits={DEMO} className="max-w-md" />;
}
