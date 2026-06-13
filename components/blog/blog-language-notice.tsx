'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Languages } from 'lucide-react';
import { localeNames, locales, type Locale } from '@/i18n/config';
import { FlagDE, FlagUS, FlagNL, FlagFR, FlagES, FlagIT } from '@/components/common/icons/flags';

const FLAGS: Record<Locale, React.ComponentType<{ className?: string }>> = {
  en: FlagUS,
  de: FlagDE,
  nl: FlagNL,
  fr: FlagFR,
  es: FlagES,
  it: FlagIT,
};

/** First supported locale among the browser's preferred languages, or null. */
function detectBrowserLocale(): Locale | null {
  if (typeof navigator === 'undefined') return null;
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of langs) {
    const base = raw.toLowerCase().split('-')[0];
    if ((locales as readonly string[]).includes(base)) {
      return base as Locale;
    }
  }
  return null;
}

// navigator.languages is read-once external state — useSyncExternalStore keeps
// SSR (null) and the client read in sync without a setState-in-effect.
const subscribeNoop = () => () => {};

function LocaleFlag({ locale }: { locale: Locale }) {
  const Flag = FLAGS[locale];
  return (
    <span className="inline-block size-[14px] shrink-0 overflow-hidden rounded-[2px]">
      <Flag className="h-full w-auto" />
    </span>
  );
}

interface BlogLanguageNoticeProps {
  /** Locale of the page URL the visitor is on. */
  currentLocale: Locale;
  /** Locale the post content was actually loaded from (differs when fallback). */
  loadedLocale: Locale;
  /** True when the requested locale had no translation and a fallback is shown. */
  isFallback: boolean;
  /**
   * Map of locale → post URL, only for locales that have a real translation.
   * Built server-side from the translation index.
   */
  availableTranslations: Partial<Record<Locale, string>>;
}

/**
 * Two related notices about this post's language:
 *
 *  A. Fallback — the visitor is on /xx/ but no xx translation exists, so the
 *     content is shown in `loadedLocale`. Server-renderable, always shown.
 *
 *  B. Better match available — the visitor's *browser* prefers a language
 *     that this post is actually translated into and that isn't the current
 *     page. We surface a link to switch. Browser-dependent, so client-only.
 */
export function BlogLanguageNotice({
  currentLocale,
  loadedLocale,
  isFallback,
  availableTranslations,
}: BlogLanguageNoticeProps) {
  const t = useTranslations('blog');
  const browserLocale = useSyncExternalStore(subscribeNoop, detectBrowserLocale, () => null);

  // ── Case B: the browser language has a translation we can offer ───────────
  // Only when it's not the page we're on and not the fallback we already show.
  const betterMatch =
    browserLocale &&
    browserLocale !== currentLocale &&
    browserLocale !== loadedLocale &&
    availableTranslations[browserLocale]
      ? browserLocale
      : null;

  if (betterMatch) {
    return (
      <a
        href={availableTranslations[betterMatch]!}
        className="border-primary/30 bg-primary/10 text-foreground hover:bg-primary/15 mt-5 flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors"
      >
        <Languages className="text-primary h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <LocaleFlag locale={betterMatch} />
        <span>{t('languageNotice.available', { language: localeNames[betterMatch] })}</span>
        <ArrowRight
          className="text-muted-foreground ml-auto h-3.5 w-3.5 shrink-0"
          aria-hidden="true"
        />
      </a>
    );
  }

  // ── Case A: fallback notice ───────────────────────────────────────────────
  if (isFallback) {
    return (
      <div className="bg-muted/70 text-muted-foreground mt-5 flex items-center gap-2 rounded-md px-3 py-2 text-xs">
        <LocaleFlag locale={loadedLocale} />
        <span>{t('languageNotice.fallback', { language: localeNames[loadedLocale] })}</span>
      </div>
    );
  }

  return null;
}
