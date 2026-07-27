import type { Locale } from '@/i18n/config';

/**
 * The three strings the "this site is also available in X" banner needs, in EVERY locale.
 *
 * The banner is the one place that must render text in a locale OTHER than the page's, so it
 * can't use the page's `NextIntlClientProvider` messages. It used to do
 * `import(\`@/messages/${detected}.json\`)`, which makes the bundler emit an async chunk per
 * locale file and then pulled a full ~65 KB message bundle over the wire to read 3 strings —
 * for every visitor whose browser language differs from the page they landed on (i.e. exactly
 * the visitors the banner targets, and it happens on the first render after mount).
 *
 * These ~120 bytes per locale are inlined instead. `messages/<locale>.json → languageBanner`
 * stays the source of truth for translators; `scripts/validate-translations.js` fails the
 * release check if the two ever drift apart.
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
    message: "Diese Seite gibt's auch auf {language}",
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
