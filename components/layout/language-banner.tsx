'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { FlagDE, FlagGB, FlagNL, FlagFR, FlagES } from '@/components/common/icons/flags';

interface LanguageBannerProps {
  currentLocale: Locale;
}

// Flag components for each locale
const FlagComponents: Record<Locale, React.ComponentType<{ className?: string }>> = {
  en: FlagGB,
  de: FlagDE,
  nl: FlagNL,
  fr: FlagFR,
  es: FlagES,
};

interface BannerTranslations {
  message: string;
  switchButton: string;
  dismiss: string;
}

export function LanguageBanner({ currentLocale }: LanguageBannerProps) {
  const [browserLocale, setBrowserLocale] = useState<Locale | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const [translations, setTranslations] = useState<BannerTranslations | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Detect browser language
    const detectBrowserLanguage = (): Locale | null => {
      if (typeof window === 'undefined') return null;

      const browserLang = navigator.language.toLowerCase();

      // Try to match exact locale (e.g., "de-DE" -> "de")
      const langCode = browserLang.split('-')[0] as Locale;

      if (locales.includes(langCode)) {
        return langCode;
      }

      return null;
    };

    const detected = detectBrowserLanguage();
    setBrowserLocale(detected);

    // Load translations for the browser's language
    if (detected && detected !== currentLocale) {
      const dismissKey = `language-banner-dismissed-${detected}-${currentLocale}`;
      const wasDismissed = localStorage.getItem(dismissKey) === 'true';
      setIsDismissed(wasDismissed);

      // Dynamically import the translation file for the browser's language
      import(`@/messages/${detected}.json`)
        .then((messages) => {
          const bannerMessages = messages.default?.languageBanner || messages.languageBanner;
          if (bannerMessages) {
            setTranslations({
              message: bannerMessages.message.replace('{language}', localeNames[detected]),
              switchButton: bannerMessages.switchButton.replace(
                '{language}',
                localeNames[detected]
              ),
              dismiss: bannerMessages.dismiss,
            });
          }
        })
        .catch((error) => {
          console.error('Failed to load translations:', error);
        });
    }
  }, [currentLocale]);

  const handleDismiss = () => {
    if (browserLocale) {
      const dismissKey = `language-banner-dismissed-${browserLocale}-${currentLocale}`;
      localStorage.setItem(dismissKey, 'true');
      setIsDismissed(true);
    }
  };

  const handleSwitch = () => {
    if (browserLocale) {
      // Get current path and replace locale
      const currentPath = window.location.pathname;
      const newPath = currentPath.replace(`/${currentLocale}`, `/${browserLocale}`);
      router.push(newPath);
    }
  };

  // Don't show banner if:
  // - Browser locale not detected
  // - Browser locale matches current locale
  // - Banner was dismissed
  // - Translations not loaded yet
  if (!browserLocale || browserLocale === currentLocale || isDismissed || !translations) {
    return null;
  }

  return (
    <div className="animate-in slide-in-from-top fixed top-0 right-0 left-0 z-[60] duration-300">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="border-border/50 bg-background/95 supports-[backdrop-filter]:bg-background/80 relative overflow-hidden rounded-lg border p-3 shadow-lg backdrop-blur sm:p-4">
          {/* Glassmorphism effect */}
          <div className="from-primary/5 to-primary/5 absolute inset-0 bg-gradient-to-r via-transparent" />

          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Flag display */}
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                {(() => {
                  const CurrentFlag = FlagComponents[currentLocale];
                  return (
                    <CurrentFlag className="border-border/50 h-4 w-6 rounded-sm border sm:h-5 sm:w-8" />
                  );
                })()}
                <span className="text-muted-foreground text-sm sm:text-base">→</span>
                {(() => {
                  const BrowserFlag = FlagComponents[browserLocale];
                  return (
                    <BrowserFlag className="border-border/50 h-4 w-6 rounded-sm border sm:h-5 sm:w-8" />
                  );
                })()}
              </div>

              {/* Message */}
              <p className="text-foreground text-xs font-medium sm:text-sm">
                {translations.message}
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Switch button */}
              <button
                onClick={handleSwitch}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:shadow-md active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
              >
                {translations.switchButton}
              </button>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-1.5 transition-colors sm:p-2"
                aria-label={translations.dismiss}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
