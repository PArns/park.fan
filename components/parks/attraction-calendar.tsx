import type { ParkWithAttractions, AttractionHistoryDay, ScheduleItem } from '@/lib/api/types';
import { AttractionHistoryGrid } from './attraction-history-grid';

interface AttractionCalendarProps {
  attraction: {
    name: string;
    history?: AttractionHistoryDay[];
    schedule?: ScheduleItem[];
  };
  park: ParkWithAttractions;
}

export function AttractionCalendar({ attraction }: AttractionCalendarProps) {
  return <AttractionHistoryGrid attraction={attraction} />;
}
