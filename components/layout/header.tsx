'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Menu, MapPin, Sparkles } from 'lucide-react';
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
  const { data: nearbyData } = useNearbyParks({ radiusInMeters: 200, limit: 6 });
  const parks =
    nearbyData?.type === 'nearby_parks' ? (nearbyData.data as NearbyParksData).parks : [];
  const nearestPark = parks[0];
  const showNearbyPark = nearestPark != null && nearestPark.distance <= NEAR_PARK_HEADER_RADIUS_M;

  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          prefetch={false}
          className="flex items-center gap-2"
          aria-label="park.fan - Home"
        >
          <div className="bg-park-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <Sparkles className="text-park-primary-foreground h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold">park.fan</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {showNearbyPark && (
            <Link
              href={convertApiUrlToFrontendUrl(nearestPark.url)}
              prefetch={nearestPark.status === 'OPERATING'}
              className="bg-muted/80 hover:bg-muted text-foreground flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              aria-label={t('nearbyPark', { parkName: nearestPark.name })}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="max-w-[140px] truncate">{nearestPark.name}</span>
            </Link>
          )}
          <Link
            href="/"
            prefetch={false}
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            aria-label="Go to homepage"
          >
            {t('home')}
          </Link>
          <Link
            href="/parks/europe"
            prefetch={false}
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            aria-label="Explore theme parks"
          >
            {t('explore')}
          </Link>
        </nav>

        {/* Search - Desktop (shows as input-like button) */}
        <div className="hidden lg:block lg:w-64">
          <SearchCommand
            trigger="input"
            size="sm"
            placeholder={tCommon('searchPlaceholderShort')}
            isGlobal
          />
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
                  aria-label="Go to homepage"
                >
                  {t('home')}
                </Link>
                <Link
                  href="/parks/europe"
                  prefetch={false}
                  className="hover:text-primary text-lg font-medium transition-colors"
                  aria-label="Explore theme parks"
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
