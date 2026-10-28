'use client';

import { localeNames, type Locale } from '@/i18n/config';
import { TRAFFIC_LOCALES } from '@/lib/admin/site-analytics';
import { Segmented } from '../../_ui/controls';

/**
 * The language switch of the traffic pages: all languages or one, German first. It filters by the
 * language of the page that was read, whatever the browser says.
 */
export function LanguageSwitch({
  value,
  onChange,
}: {
  value: Locale | null;
  onChange: (locale: Locale | null) => void;
}) {
  return (
    <Segmented
      label="Sprache"
      value={value}
      onChange={onChange}
      options={[
        { value: null, label: 'Alle' },
        ...TRAFFIC_LOCALES.map((locale: Locale) => ({
          value: locale as Locale | null,
          label: locale.toUpperCase(),
          title: localeNames[locale],
        })),
      ]}
    />
  );
}
