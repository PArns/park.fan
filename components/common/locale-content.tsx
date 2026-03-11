import { type Locale } from '@/i18n/routing';
import { ReactNode } from 'react';

type LocaleContentProps = {
  locale: Locale;
  /** Required fallback – rendered when no dedicated content exists for the active locale. */
  en: ReactNode;
} & { [K in Locale]?: ReactNode };

/**
 * Renders content based on the current locale.
 * Only the content for the current locale is rendered (no CSS hiding).
 * Falls back to English for locales without dedicated content.
 * Scales automatically when new locales are added to the Locale union type.
 */
export function LocaleContent(props: LocaleContentProps) {
  return <>{(props[props.locale] as ReactNode | undefined) ?? props.en}</>;
}
