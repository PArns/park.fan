'use client';

import { ArrowRight, Languages } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { FlagDE, FlagUS, FlagNL, FlagFR, FlagES, FlagIT } from '@/components/common/icons/flags';
import { useBrowserLocale } from '@/lib/hooks/use-browser-locale';

const FLAGS: Record<Locale, React.ComponentType<{ className?: string }>> = {
  en: FlagUS,
  de: FlagDE,
  nl: FlagNL,
  fr: FlagFR,
  es: FlagES,
  it: FlagIT,
};

function LocaleFlag({ locale }: { locale: Locale }) {
  const Flag = FLAGS[locale];
  return (
    <span className="inline-block size-[14px] shrink-0 overflow-hidden rounded-[2px]">
      <Flag className="h-full w-auto" />
    </span>
  );
}

interface LanguageOffer {
  locale: Locale;
  href: string;
  /** Pre-translated in the offer's own target language (server-built). */
  label: string;
}

interface BlogLanguageNoticeProps {
  /** Locale of the page URL the visitor is on. */
  currentLocale: Locale;
  /** Locale the post content was actually loaded from (differs when fallback). */
  loadedLocale: Locale;
  /**
   * Switch offers for every other available translation. Each `label` is
   * already written in its own target language, so the offer reads in the
   * language it leads to — independent of the current UI locale.
   */
  languageOffers: LanguageOffer[];
  /** Fallback notice text (in the shown language), or null when not a fallback. */
  fallbackLabel: string | null;
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
 *
 * Both notice texts are pre-translated server-side in the *other* language (the
 * one being offered / shown), so e.g. the English offer reads "This article is
 * also available in English" even on a German page.
 */
export function BlogLanguageNotice({
  currentLocale,
  loadedLocale,
  languageOffers,
  fallbackLabel,
}: BlogLanguageNoticeProps) {
  const browserLocale = useBrowserLocale();

  // Case B: the browser's language has a translation to offer, other than this page and the
  // fallback already shown.
  const betterMatch =
    browserLocale && browserLocale !== currentLocale && browserLocale !== loadedLocale
      ? (languageOffers.find((o) => o.locale === browserLocale) ?? null)
      : null;

  if (betterMatch) {
    return (
      <a
        href={betterMatch.href}
        className="border-primary/30 bg-primary/10 text-foreground hover:bg-primary/15 mt-5 flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors"
      >
        <Languages className="text-primary h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <LocaleFlag locale={betterMatch.locale} />
        <span>{betterMatch.label}</span>
        <ArrowRight
          className="text-muted-foreground ml-auto h-3.5 w-3.5 shrink-0"
          aria-hidden="true"
        />
      </a>
    );
  }

  // Case A: the fallback notice.
  if (fallbackLabel) {
    return (
      <div className="bg-muted/70 text-muted-foreground mt-5 flex items-center gap-2 rounded-md px-3 py-2 text-xs">
        <LocaleFlag locale={loadedLocale} />
        <span>{fallbackLabel}</span>
      </div>
    );
  }

  return null;
}
