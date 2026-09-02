'use client';
import { useLocale } from 'next-intl';
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

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
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
          /* `max-sm:h-8` cancels the button scale's 44 px phone tier: this control only ever
             renders inside the 48 px header, whose height is a documented requirement, and 44 in
             48 is the mistake that requirement exists to prevent. The bar's own touch targets are
             an open question about the bar's height, not about this class. */
          className="h-8 gap-1.5 px-2 text-xs font-medium max-sm:h-8"
          suppressHydrationWarning
        >
          <RoundFlag locale={locale} />
          {/* The country code is what pays for the °C/°F button beside the theme switch. At
              360 px the bar carries 303 px of content in 328 px, this label is 22 px of it
              (text plus its gap), and the unit control needs 35 px including its gap — so below
              `sm` the flag stands alone and the dropdown, which lists the code AND the language
              name, is one tap away. Above `sm` nothing is tight and the code stays. */}
          <span className="max-sm:hidden">{LOCALE_CODES[locale]}</span>
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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
