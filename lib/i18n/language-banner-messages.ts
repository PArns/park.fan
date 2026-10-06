import type { Locale } from '@/i18n/config';

/**
 * The three strings the "this site is also available in X" banner needs, in every locale. The
 * banner renders in a locale other than the page's, so it cannot use the page's messages, and
 * loading a whole message file for three strings would cost every visitor it targets.
 * `messages/<locale>.json → languageBanner` stays the source for translators;
 * `scripts/validate-translations.cjs` fails if the two drift apart.
 */
export interface LanguageBannerMessages {
  message: string;
  switchButton: string;
  dismiss: string;
}

export const LANGUAGE_BANNER_MESSAGES: Record<Locale, LanguageBannerMessages> = {
  en: {
    message: 'This site is also available in {language}',
    switchButton: 'Switch to {language}',
    dismiss: 'Dismiss',
  },
  de: {
    message: 'Diese Seite gibt’s auch auf {language}',
    switchButton: 'Zu {language} wechseln',
    dismiss: 'Schließen',
  },
  nl: {
    message: 'Deze site is ook beschikbaar in {language}',
    switchButton: 'Schakel naar {language}',
    dismiss: 'Sluiten',
  },
  fr: {
    message: 'Ce site est également disponible en {language}',
    switchButton: 'Passer au {language}',
    dismiss: 'Fermer',
  },
  es: {
    message: 'Este sitio también está disponible en {language}',
    switchButton: 'Cambiar a {language}',
    dismiss: 'Cerrar',
  },
  it: {
    message: 'Questo sito è disponibile anche in {language}',
    switchButton: 'Passa a {language}',
    dismiss: 'Chiudi',
  },
};
