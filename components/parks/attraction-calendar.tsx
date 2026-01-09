'use client';

import type { ParkWithAttractions, AttractionHistoryDay } from '@/lib/api/types';
import { AttractionHistoryGrid } from './attraction-history-grid';

interface AttractionCalendarProps {
  attraction: {
    name: string;
    history?: AttractionHistoryDay[];
  };
  park: ParkWithAttractions;
}

export function AttractionCalendar({ attraction }: AttractionCalendarProps) {
  return <AttractionHistoryGrid attraction={attraction} />;
}
