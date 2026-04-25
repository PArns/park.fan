'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/translations';
import type { Locale } from '@/i18n/config';
import { Menu, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { LocaleSwitcher } from '@/components/common/locale-switcher';
import { SearchCommand } from '@/components/search/search-bar';
import { useNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import type { NearbyParksData } from '@/types/nearby';

/** API returns distance in meters. Only show "Nearby: Park" when nearest park is within this (m). */
const NEAR_PARK_HEADER_RADIUS_M = 5000; // 5 km

export function Header() {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const glossaryPath = '/' + GLOSSARY_SEGMENTS[locale as Locale];
  const pathname = usePathname();
  const { data: nearbyData } = useNearbyParks({ radiusInMeters: 200, limit: 6 });
  const parks =
    nearbyData?.type === 'nearby_parks' ? (nearbyData.data as NearbyParksData).parks : [];
  const nearestPark = parks[0];
  const showNearbyPark = nearestPark != null && nearestPark.distance <= NEAR_PARK_HEADER_RADIUS_M;

  const isHomePage = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const check = () => setScrolled(window.scrollY > 50);
    check();
    if (!isHomePage) return;
    const handleScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        check();
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isHomePage]);

  const isTransparent = isHomePage && !scrolled;

  // Shared fade class for elements that hide on the transparent homepage header
  const fadeClass = `transition-opacity duration-500 ${isTransparent ? 'opacity-0 pointer-events-none' : 'opacity-100'}`;

  return (
    <header
      className={`relative sticky top-0 z-50 h-16 border-b transition-[background-color,border-color,backdrop-filter] duration-500 ${
        isTransparent
          ? 'border-transparent bg-transparent'
          : 'border-border/50 bg-background/80 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-0">
        {/* Corner logo – absolute, visible only when transparent (hero top).
            Same left-6 offset as the hero image info text below. Fades out on scroll. */}
        <Link
          href="/"
          prefetch={false}
          className={`absolute top-1/2 left-6 flex -translate-y-1/2 items-center gap-1 transition-opacity duration-500 ${
            isTransparent ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-label="park.fan - Home"
          tabIndex={isTransparent ? 0 : -1}
        >
          <Image
            src="/logo-small-dark.svg"
            width={26}
            height={30}
            alt=""
            aria-hidden="true"
            className="hidden h-6 w-auto dark:block"
            priority
          />
          <Image
            src="/logo-small.svg"
            width={26}
            height={30}
            alt=""
            aria-hidden="true"
            className="block h-6 w-auto dark:hidden"
            priority
          />
          <Image
            src="/parkfan-dark.svg"
            width={84}
            height={24}
            alt="park.fan"
            className="hidden h-5 w-auto dark:block"
            priority
          />
          <Image
            src="/parkfan.svg"
            width={84}
            height={24}
            alt="park.fan"
            className="block h-5 w-auto dark:hidden"
            priority
          />
        </Link>

        {/* Header logo – in flex flow, fades in on scroll. Keeps justify-between anchor when invisible. */}
        <Link
          href="/"
          prefetch={false}
          className={`flex shrink-0 items-center gap-1.5 transition-opacity duration-500 ${
            isTransparent ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
          aria-label="park.fan - Home"
          tabIndex={isTransparent ? -1 : 0}
        >
          <Image
            src="/logo-small-dark.svg"
            width={26}
            height={30}
            alt=""
            aria-hidden="true"
            className="hidden h-7 w-auto md:h-9 dark:block"
            priority
          />
          <Image
            src="/logo-small.svg"
            width={26}
            height={30}
            alt="park.fan"
            aria-hidden="true"
            className="block h-7 w-auto md:h-9 dark:hidden"
            priority
          />
          <Image
            src="/parkfan-dark.svg"
            width={84}
            height={24}
            alt="park.fan"
            className="hidden h-7 w-auto md:h-9 dark:block"
            priority
          />
          <Image
            src="/parkfan.svg"
            width={84}
            height={24}
            alt=""
            aria-hidden="true"
            className="block h-7 w-auto md:h-9 dark:hidden"
            priority
          />
        </Link>

        {/* Desktop Navigation – fades in on scroll */}
        <nav
          className={`hidden items-center gap-6 md:flex ${fadeClass}`}
          aria-label="Main navigation"
          aria-hidden={isTransparent}
        >
          {showNearbyPark && (
            <Link
              href={convertApiUrlToFrontendUrl(nearestPark.url)}
              prefetch={nearestPark.status === 'OPERATING'}
              className="bg-muted/80 hover:bg-muted text-foreground flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              aria-label={t('nearbyPark', { parkName: nearestPark.name })}
              tabIndex={isTransparent ? -1 : 0}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="max-w-[140px] truncate">{nearestPark.name}</span>
            </Link>
          )}
          <Link
            href="/parks/europe"
            prefetch={false}
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            tabIndex={isTransparent ? -1 : 0}
          >
            {t('explore')}
          </Link>
          <Link
            href={glossaryPath}
            prefetch={false}
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            tabIndex={isTransparent ? -1 : 0}
          >
            {t('glossary')}
          </Link>
          <Link
            href="/howto"
            prefetch={false}
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            tabIndex={isTransparent ? -1 : 0}
          >
            {t('howto')}
          </Link>
        </nav>

        {/* Search Desktop – fades in on scroll */}
        <div className={`hidden lg:block lg:w-64 ${fadeClass}`}>
          <SearchCommand
            trigger="input"
            size="sm"
            placeholder={tCommon('searchPlaceholderShort')}
            isGlobal
          />
        </div>

        {/* Corner pill – absolute right-6, mirrors the corner logo on the left. Fades out on scroll. */}
        <div
          className={`absolute top-1/2 right-6 flex -translate-y-1/2 items-center gap-1 rounded-lg bg-white/60 px-1 py-0.5 backdrop-blur-md transition-opacity duration-500 dark:bg-black/40 ${
            isTransparent ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <LocaleSwitcher />
          <ThemeToggle />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button Mobile – fades in on scroll */}
          <div className={`lg:hidden ${fadeClass}`}>
            <SearchCommand trigger="button" />
          </div>

          {/* In-flow locale + theme – fades in on scroll, keeps flex anchor when invisible */}
          <div
            className={`flex items-center gap-1 transition-opacity duration-500 ${
              isTransparent ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
          >
            <LocaleSwitcher />
            <ThemeToggle />
          </div>

          {/* Mobile Menu – fades in on scroll */}
          <div className={fadeClass}>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  suppressHydrationWarning
                  tabIndex={isTransparent ? -1 : 0}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-6 pt-12">
                <nav className="mt-8 flex flex-col gap-4" aria-label="Mobile navigation">
                  {showNearbyPark && (
                    <Link
                      href={convertApiUrlToFrontendUrl(nearestPark.url)}
                      prefetch={nearestPark.status === 'OPERATING'}
                      className="bg-muted/80 hover:bg-muted text-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                      aria-label={t('nearbyPark', { parkName: nearestPark.name })}
                    >
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {t('nearbyPark', { parkName: nearestPark.name })}
                    </Link>
                  )}
                  <Link
                    href="/"
                    prefetch={false}
                    className="hover:text-primary text-lg font-medium transition-colors"
                  >
                    {t('home')}
                  </Link>
                  <Link
                    href="/parks/europe"
                    prefetch={false}
                    className="hover:text-primary text-lg font-medium transition-colors"
                  >
                    {t('explore')}
                  </Link>
                  <Link
                    href={glossaryPath}
                    prefetch={false}
                    className="hover:text-primary text-lg font-medium transition-colors"
                  >
                    {t('glossary')}
                  </Link>
                  <Link
                    href="/howto"
                    prefetch={false}
                    className="hover:text-primary text-lg font-medium transition-colors"
                  >
                    {t('howto')}
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
