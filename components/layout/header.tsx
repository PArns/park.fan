'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Menu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { LocaleSwitcher } from '@/components/common/locale-switcher';
import { SearchCommand } from '@/components/search/search-bar';

export function Header() {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');

  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-park-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <Sparkles className="text-park-primary-foreground h-5 w-5" />
          </div>
          <span className="text-xl font-bold">park.fan</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            {t('home')}
          </Link>
          <Link
            href="/parks/europe"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            {t('explore')}
          </Link>
        </nav>

        {/* Search - Desktop (shows as input-like button) */}
        <div className="hidden lg:block lg:w-64">
          <SearchCommand trigger="input" placeholder={tCommon('searchPlaceholderShort')} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button - Mobile/Tablet (icon only) */}
          <div className="lg:hidden">
            <SearchCommand trigger="button" />
          </div>

          <LocaleSwitcher />
          <ThemeToggle />

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" suppressHydrationWarning>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="mt-8 flex flex-col gap-4">
                <Link href="/" className="hover:text-primary text-lg font-medium transition-colors">
                  {t('home')}
                </Link>
                <Link
                  href="/parks/europe"
                  className="hover:text-primary text-lg font-medium transition-colors"
                >
                  {t('explore')}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
