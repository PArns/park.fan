'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { LANGUAGE_BANNER_MESSAGES } from '@/lib/i18n/language-banner-messages';
import { rememberLocale } from '@/lib/i18n/remember-locale';
import { FlagDE, FlagUS, FlagNL, FlagFR, FlagES, FlagIT } from '@/components/common/icons/flags';

interface LanguageBannerProps {
  currentLocale: Locale;
}

const FlagComponents: Record<Locale, React.ComponentType<{ className?: string }>> = {
  en: FlagUS,
  de: FlagDE,
  nl: FlagNL,
  fr: FlagFR,
  es: FlagES,
  it: FlagIT,
};

/**
 * Banner offering to switch to the browser's language when it differs from the page's, worded in
 * that language. Dismissal is remembered per language pair in localStorage.
 */
export function LanguageBanner({ currentLocale }: LanguageBannerProps) {
  const [browserLocale, setBrowserLocale] = useState<Locale | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const router = useRouter();

  // Banner copy in the detected language (not the page's), from the inlined per-locale map, so the
  // visitors the banner targets do not download a whole message bundle for three strings.
  const translations = useMemo(() => {
    if (!browserLocale) return null;
    const messages = LANGUAGE_BANNER_MESSAGES[browserLocale];
    if (!messages) return null;
    const language = localeNames[browserLocale];
    return {
      message: messages.message.replace('{language}', language),
      switchButton: messages.switchButton.replace('{language}', language),
      dismiss: messages.dismiss,
    };
  }, [browserLocale]);

  useEffect(() => {
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
    setTimeout(() => {
      setBrowserLocale(detected);
    }, 0);

    if (detected && detected !== currentLocale) {
      const dismissKey = `language-banner-dismissed-${detected}-${currentLocale}`;
      const wasDismissed = localStorage.getItem(dismissKey) === 'true';
      setTimeout(() => {
        setIsDismissed(wasDismissed);
      }, 0);
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
      // Same reason as the locale switcher: this is an explicit choice, and it is the only
      // thing that still writes NEXT_LOCALE now that the middleware doesn't (see proxy.ts).
      rememberLocale(browserLocale);
      // Prefer hreflang links — these carry the correct localized path (e.g. /de/glossar vs /en/glossary)
      const hreflangEl = document.querySelector<HTMLLinkElement>(
        `link[rel="alternate"][hreflang="${browserLocale}"]`
      );
      if (hreflangEl?.href) {
        const { pathname: hreflangPath } = new URL(hreflangEl.href);
        // `router.replace`: the target path already carries the locale segment, so a client
        // navigation renders the right language without re-downloading the document. Replace, not
        // push, so no history entry is added.
        router.replace(hreflangPath);
        return;
      }
      // Fallback: replace only the leading locale segment to avoid double-replacement
      const currentPath = window.location.pathname;
      const newPath = currentPath.replace(
        new RegExp(`^/${currentLocale}(/|$)`),
        `/${browserLocale}$1`
      );
      router.push(newPath);
    }
  };

  if (!browserLocale || browserLocale === currentLocale || isDismissed || !translations) {
    return null;
  }

  return (
    // `top-12`, not `top-0`: this sits at `z-[60]` over the sticky header and does not scroll
    // away, so at `top-0` it would cover the burger, search and logo. The number is the header's
    // height (`h-12`); it moves with it.
    <div
      className="animate-in slide-in-from-top fixed top-12 right-0 left-0 z-[60] duration-300"
      // Read by the new-posts toast, which sits below this from `sm` instead of under it.
      data-language-banner
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="border-border/50 bg-background/95 supports-[backdrop-filter]:bg-background/80 relative overflow-hidden rounded-lg border p-3 shadow-lg backdrop-blur sm:p-4">
          <div className="from-primary/5 to-primary/5 absolute inset-0 bg-gradient-to-r via-transparent" />

          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
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

              <p className="text-foreground text-xs font-medium sm:text-sm">
                {translations.message}
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleSwitch}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:shadow-md active:scale-95 sm:min-h-0 sm:px-4 sm:py-2 sm:text-sm"
              >
                {translations.switchButton}
              </button>

              {/* `min-h-11 min-w-11` below `sm`: the banner's only exit needs a thumb-sized
                  target. */}
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-1.5 transition-colors sm:min-h-0 sm:min-w-0 sm:p-2"
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
