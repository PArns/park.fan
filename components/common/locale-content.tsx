import { type Locale } from '@/i18n/routing';
import { ReactNode } from 'react';

interface LocaleContentProps {
  locale: Locale;
  de: ReactNode;
  en: ReactNode;
  es?: ReactNode;
  fr?: ReactNode;
  it?: ReactNode;
  nl?: ReactNode;
}

/**
 * Renders content based on the current locale.
 * Only the content for the current locale is rendered (no CSS hiding).
 * Falls back to English for locales without dedicated content.
 */
export function LocaleContent({ locale, de, en, es, fr, it, nl }: LocaleContentProps) {
  const map: Partial<Record<Locale, ReactNode>> = { de, en, es, fr, it, nl };
  return <>{map[locale] ?? en}</>;
}
