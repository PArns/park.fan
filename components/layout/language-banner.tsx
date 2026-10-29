'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { localeNames, type Locale } from '@/i18n/config';
import { LANGUAGE_BANNER_MESSAGES } from '@/lib/i18n/language-banner-messages';
import { rememberLocale } from '@/lib/i18n/remember-locale';
import { useBrowserLocale } from '@/lib/hooks/use-browser-locale';
import { FlagDE, FlagUS, FlagNL, FlagFR, FlagES, FlagIT } from '@/components/common/icons/flags';
import { HEAVY_GLASS } from '@/components/common/glass-card';
import { cn } from '@/lib/utils';

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

const dismissalListeners = new Set<() => void>();

function subscribeToDismissals(listener: () => void): () => void {
  dismissalListeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    dismissalListeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function wasDismissed(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    // Storage blocked: a banner that could not be dismissed for good is not shown at all.
    return true;
  }
}

const dismissedOnServer = () => true;

/**
 * Banner offering to switch to the browser's language when it differs from the page's, worded in
 * that language. Dismissal is remembered per language pair in localStorage.
 */
export function LanguageBanner({ currentLocale }: LanguageBannerProps) {
  const browserLocale = useBrowserLocale({ firstChoiceOnly: true });
  const dismissKey = browserLocale
    ? `language-banner-dismissed-${browserLocale}-${currentLocale}`
    : null;
  const isDismissed = useSyncExternalStore(
    subscribeToDismissals,
    () => dismissKey === null || wasDismissed(dismissKey),
    dismissedOnServer
  );
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

  const handleDismiss = () => {
    if (!dismissKey) return;
    localStorage.setItem(dismissKey, 'true');
    dismissalListeners.forEach((listener) => listener());
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
      {/* Below `sm` one quiet row: the flags, the switch as a link in the brand colour and the ×,
          without the sentence the switch repeats. From `sm` the sentence and a filled button. It
          floats over the page, so it takes the hero's glass and a border in the brand colour,
          which also sets it apart from a cookie notice. */}
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 sm:py-3 lg:px-8">
        <div
          className={cn(
            HEAVY_GLASS,
            'border-primary/50 relative overflow-hidden rounded-lg border py-0.5 pr-0.5 pl-3 shadow-md sm:p-4 sm:shadow-lg'
          )}
        >
          <div className="from-primary/5 to-primary/5 absolute inset-0 bg-gradient-to-r via-transparent" />

          <div className="relative flex items-center gap-2 sm:gap-4">
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {(() => {
                const CurrentFlag = FlagComponents[currentLocale];
                return (
                  <CurrentFlag className="border-border/50 h-3.5 w-5 rounded-sm border sm:h-5 sm:w-8" />
                );
              })()}
              <span className="text-muted-foreground text-xs sm:text-base">→</span>
              {(() => {
                const BrowserFlag = FlagComponents[browserLocale];
                return (
                  <BrowserFlag className="border-border/50 h-3.5 w-5 rounded-sm border sm:h-5 sm:w-8" />
                );
              })()}
            </div>

            <p className="text-foreground min-w-0 flex-1 text-sm font-medium max-sm:hidden">
              {translations.message}
            </p>

            {/* `min-h-11` below `sm`: a thumb-sized target, as tall as the row it is in. */}
            <button
              onClick={handleSwitch}
              className="text-primary hover:bg-primary/10 sm:bg-primary sm:text-primary-foreground sm:hover:bg-primary/90 inline-flex min-h-11 min-w-0 flex-1 items-center justify-start rounded-md px-2 text-sm font-semibold transition-all active:scale-95 sm:min-h-0 sm:flex-none sm:justify-center sm:px-4 sm:py-2 sm:shadow-sm sm:hover:shadow-md"
            >
              <span className="truncate">{translations.switchButton}</span>
            </button>

            {/* `min-h-11 min-w-11` below `sm`: the banner's only exit needs a thumb-sized
                target. */}
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md p-1.5 transition-colors sm:min-h-0 sm:min-w-0 sm:p-2"
              aria-label={translations.dismiss}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
