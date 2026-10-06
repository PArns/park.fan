'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { routing, type Locale } from '@/i18n/routing';
import { localeNames } from '@/i18n/config';
import { FlagDE, FlagUS, FlagNL, FlagFR, FlagES, FlagIT } from '@/components/common/icons/flags';
import { trackLanguageSwitched } from '@/lib/analytics/umami';
import { rememberLocale } from '@/lib/i18n/remember-locale';

const LOCALE_CODES: Record<Locale, string> = {
  de: 'DE',
  en: 'EN',
  nl: 'NL',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
};

function LocaleFlag({ locale, className }: { locale: Locale; className?: string }) {
  const props = { className: className ?? 'h-full w-auto' };
  switch (locale) {
    case 'de':
      return <FlagDE {...props} />;
    case 'en':
      return <FlagUS {...props} />;
    case 'nl':
      return <FlagNL {...props} />;
    case 'fr':
      return <FlagFR {...props} />;
    case 'es':
      return <FlagES {...props} />;
    case 'it':
      return <FlagIT {...props} />;
  }
}

function RoundFlag({ locale }: { locale: Locale }) {
  return (
    <span className="size-[18px] shrink-0 overflow-hidden rounded-full">
      <LocaleFlag locale={locale} className="h-full w-auto" />
    </span>
  );
}

/**
 * Header dropdown that switches the site language: remembers the choice for `/`, then follows the
 * page's hreflang link for the new locale, or replaces the locale in the current path when there is
 * none.
 */
export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations('navigation');
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    trackLanguageSwitched(locale, newLocale);
    // Picking a language here is the one choice worth remembering for the unprefixed `/`.
    // The middleware no longer writes the cookie (it would make every page uncacheable at the
    // edge — see proxy.ts), and the hreflang branch below leaves the app entirely, so
    // next-intl's own client-side sync never runs for it.
    rememberLocale(newLocale);

    const hreflangEl = document.querySelector<HTMLLinkElement>(
      `link[rel="alternate"][hreflang="${newLocale}"]`
    );
    if (hreflangEl?.href) {
      const { pathname: hreflangPath } = new URL(hreflangEl.href);
      window.location.replace(hreflangPath);
      return;
    }

    router.replace(pathname, { locale: newLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          /* `max-sm:h-8` cancels the button scale's 44 px phone tier: this control renders inside
             the 48 px header, see
             docs/rules/the-header-is-48-px-and-its-height-is-written-down-in-four.md. */
          className="h-8 gap-1.5 px-2 text-xs font-medium max-sm:h-8"
          suppressHydrationWarning
        >
          <RoundFlag locale={locale} />
          {/* Below `sm` the flag stands alone: the country code's width pays for the °C/°F button
              in the 360 px bar, and the dropdown lists code and language name anyway. */}
          <span className="max-sm:hidden">{LOCALE_CODES[locale]}</span>
          <span className="sr-only">{t('changeLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      {/* `z-[80]`, above the sheet's `z-[70]`: on a phone this switcher lives in the burger
          sheet, and below it the sheet's overlay would take every tap. */}
      <DropdownMenuContent align="end" className="z-[80]">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className="flex items-center gap-2"
          >
            <RoundFlag locale={loc} />
            <span className="text-xs font-medium">{LOCALE_CODES[loc]}</span>
            <span className="text-muted-foreground">{localeNames[loc]}</span>
            {locale === loc && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
