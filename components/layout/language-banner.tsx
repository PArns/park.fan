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

// Flag components for each locale
const FlagComponents: Record<Locale, React.ComponentType<{ className?: string }>> = {
  en: FlagUS,
  de: FlagDE,
  nl: FlagNL,
  fr: FlagFR,
  es: FlagES,
  it: FlagIT,
};

export function LanguageBanner({ currentLocale }: LanguageBannerProps) {
  const [browserLocale, setBrowserLocale] = useState<Locale | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const router = useRouter();

  // Banner copy in the DETECTED language (not the page's), from the inlined per-locale map.
  // This used to be `import(\`@/messages/${detected}.json\`)` inside the effect below: an async
  // ~65 KB message-bundle download (and one emitted chunk per locale in the build output) to
  // read three strings — paid by exactly the visitors the banner targets. Now that the strings
  // are synchronous the whole thing is derived state, so the extra render pass is gone too.
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
        // `router.replace`, not `window.location.replace`: the target path already carries the
        // locale segment, so a client navigation renders the right language — and the fallback
        // branch below has always used the router for the same operation. The hard version
        // re-downloaded the whole document for a language switch, on the connection least able
        // to afford it. Replace, not push, keeps the no-extra-history-entry behaviour.
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

  // Don't show banner if:
  // - Browser locale not detected
  // - Browser locale matches current locale
  // - Banner was dismissed
  // - Translations not loaded yet
  if (!browserLocale || browserLocale === currentLocale || isDismissed || !translations) {
    return null;
  }

  return (
    // `top-12`, not `top-0`: this sits at `z-[60]` over the `sticky top-0 z-50` header, and at
    // 390 px the card is ~110 px tall and does not scroll away — so at `top-0` it covered the
    // whole 48 px bar plus the first ~60 px of the page, and while it was up a visitor could
    // reach neither the burger, nor the search, nor the logo. The number is the header's height
    // (components/layout/header.tsx, `h-12`); it moves with it.
    <div className="animate-in slide-in-from-top fixed top-12 right-0 left-0 z-[60] duration-300">
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
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:shadow-md active:scale-95 sm:min-h-0 sm:px-4 sm:py-2 sm:text-sm"
              >
                {translations.switchButton}
              </button>

              {/* Dismiss button */}
              {/* `min-h-11 min-w-11` below `sm` — the admin's `CONTROL_HEIGHT` number
                  (app/admin/_ui/controls.tsx) and for the same reason. This is the banner's only
                  exit, and it was a 28 px target that `sm:p-2` made LARGER on the desk, where a
                  mouse is. The padding still grows above `sm` for the look; the minimum is what
                  a thumb needs. */}
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
