'use client';

import { Segmented } from '../../_ui/controls';
import { TRAFFIC_LOCALES, TRAFFIC_RANGES } from '@/lib/admin/site-analytics';
import { localeNames, type Locale } from '@/i18n/config';
import type { useTrafficFilters } from '../_lib/use-traffic';

/**
 * The two switches of every traffic page, the window and the language. The language is a filter
 * on the counter's own figures: a visit in German counts for `de`, whatever the browser says.
 */
export function TrafficFilterBar({ filters }: { filters: ReturnType<typeof useTrafficFilters> }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Segmented
        label="Sprache"
        value={filters.locale}
        onChange={filters.setLocale}
        options={[
          { value: null, label: 'Alle' },
          ...TRAFFIC_LOCALES.map((locale: Locale) => ({
            value: locale as Locale | null,
            label: locale.toUpperCase(),
            title: localeNames[locale],
          })),
        ]}
      />
      <Segmented
        label="Zeitraum"
        value={filters.days}
        onChange={filters.setDays}
        options={TRAFFIC_RANGES.map((range) => ({ value: range.days, label: range.label }))}
      />
    </div>
  );
}
