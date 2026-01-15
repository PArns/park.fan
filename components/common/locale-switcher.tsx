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
import { FlagDE, FlagGB, FlagNL, FlagFR, FlagES } from '@/components/common/icons/flags';

const LocaleFlag = ({ locale }: { locale: Locale }) => {
  switch (locale) {
    case 'de':
      return <FlagDE className="h-4 w-6" />;
    case 'en':
      return <FlagGB className="h-4 w-6" />;
    case 'nl':
      return <FlagNL className="h-4 w-6" />;
    case 'fr':
      return <FlagFR className="h-4 w-6" />;
    case 'es':
      return <FlagES className="h-4 w-6" />;
  }
};

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" suppressHydrationWarning>
          <LocaleFlag locale={locale} />
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
            <LocaleFlag locale={loc} />
            <span>{localeNames[loc]}</span>
            {locale === loc && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
