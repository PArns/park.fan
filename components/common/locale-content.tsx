import { type Locale } from '@/i18n/routing';
import { ReactNode } from 'react';

interface LocaleContentProps {
  locale: Locale;
  de: ReactNode;
  en: ReactNode;
}

/**
 * Renders content based on the current locale.
 * Only the content for the current locale is rendered (no CSS hiding).
 */
export function LocaleContent({ locale, de, en }: LocaleContentProps) {
  return locale === 'de' ? <>{de}</> : <>{en}</>;
}
