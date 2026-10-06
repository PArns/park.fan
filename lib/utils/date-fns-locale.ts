import { de, enUS, es, fr, it, nl, type Locale as DateFnsLocale } from 'date-fns/locale';
import type { Locale } from '@/i18n/config';

const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = { de, en: enUS, es, fr, it, nl };

/** The date-fns locale that names days and months in the reader's language. */
export function dateFnsLocale(locale: string): DateFnsLocale {
  return DATE_FNS_LOCALES[locale as Locale] ?? enUS;
}
