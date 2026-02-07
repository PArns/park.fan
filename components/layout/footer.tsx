import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Sparkles, ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { BuildInfo } from '@/components/common/build-info';

interface FooterProps {
  locale: string;
}

export async function Footer({ locale }: FooterProps) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const tGeo = await getTranslations({ locale, namespace: 'geo' });
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t" role="contentinfo">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-6">
          {/* Brand */}
          <section className="space-y-4 md:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2"
              aria-label={`park.fan - ${locale === 'de' ? 'Startseite' : 'Home'}`}
            >
              <div className="bg-park-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <Sparkles className="text-park-primary-foreground h-5 w-5" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold">park.fan</span>
            </Link>
            <p className="text-muted-foreground text-base leading-relaxed">{t('description')}</p>
            <nav
              className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm"
              aria-label="Developer resources and tools"
            >
              <a
                href="https://api.park.fan/api"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
                aria-label="park.fan API Documentation (opens in new tab)"
              >
                {t('api')}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <span className="text-muted-foreground/60">•</span>
              <a
                href="https://github.com/PArns"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
                aria-label="GitHub Profile (opens in new tab)"
              >
                GitHub
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <span className="text-muted-foreground/60">•</span>
              <a
                href="https://arns.dev"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
                aria-label="Arns.dev website (opens in new tab)"
              >
                Arns.dev
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </nav>
          </section>

          {/* Popular Parks - Germany */}
          <section className="hidden space-y-4 md:block">
            <div className="mb-3 text-sm font-semibold tracking-wide uppercase">
              {t('sections.popularParks')}
            </div>
            <div className="space-y-3">
              <div>
                <Link
                  href="/parks/europe/germany"
                  prefetch={false}
                  className="text-muted-foreground hover:text-foreground mb-2 block text-xs font-medium uppercase transition-colors"
                  aria-label={`${t('sections.germany')} - Theme Parks`}
                >
                  {t('sections.germany')}
                </Link>
                <nav
                  className="flex flex-col gap-2 text-sm"
                  aria-label="Popular theme parks in Germany"
                >
                  <Link
                    href="/parks/europe/germany/rust/europa-park"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Europa-Park - Wait Times"
                  >
                    Europa-Park
                  </Link>
                  <Link
                    href="/parks/europe/germany/bruhl/phantasialand"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Phantasialand - Wait Times"
                  >
                    Phantasialand
                  </Link>
                  <Link
                    href="/parks/europe/germany/soltau/heide-park"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Heide-Park - Wait Times"
                  >
                    Heide-Park
                  </Link>
                  <Link
                    href="/parks/europe/germany/bottrop/movie-park-germany"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Movie Park Germany - Wait Times"
                  >
                    Movie Park Germany
                  </Link>
                  <Link
                    href="/parks/europe/netherlands/kaatsheuvel/efteling"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Efteling - Wait Times"
                  >
                    Efteling
                  </Link>
                </nav>
              </div>
            </div>
          </section>

          {/* Popular Parks - USA */}
          <section className="hidden space-y-4 md:block">
            <div className="mb-3 text-sm font-semibold tracking-wide uppercase opacity-0">
              {t('sections.popularParks')}
            </div>
            <div className="space-y-3">
              <div>
                <Link
                  href="/parks/north-america/united-states"
                  prefetch={false}
                  className="text-muted-foreground hover:text-foreground mb-2 block text-xs font-medium uppercase transition-colors"
                  aria-label={`${t('sections.usa')} - Theme Parks`}
                >
                  {t('sections.usa')}
                </Link>
                <nav
                  className="flex flex-col gap-2 text-sm"
                  aria-label="Popular theme parks in USA"
                >
                  <Link
                    href="/parks/north-america/united-states/orlando/walt-disney-world"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Walt Disney World - Wait Times"
                  >
                    Walt Disney World
                  </Link>
                  <Link
                    href="/parks/north-america/united-states/orlando/universal-studios-florida"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Universal Studios - Wait Times"
                  >
                    Universal Studios
                  </Link>
                  <Link
                    href="/parks/north-america/united-states/tampa/busch-gardens-tampa"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Busch Gardens Tampa - Wait Times"
                  >
                    Busch Gardens Tampa
                  </Link>
                  <Link
                    href="/parks/north-america/united-states/sandusky/cedar-point"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Cedar Point - Wait Times"
                  >
                    Cedar Point
                  </Link>
                  <Link
                    href="/parks/north-america/united-states/valencia/six-flags-magic-mountain"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Six Flags Magic Mountain - Wait Times"
                  >
                    Six Flags Magic Mountain
                  </Link>
                </nav>
              </div>
            </div>
          </section>

          {/* Popular Parks - France */}
          <section className="hidden space-y-4 md:block">
            <div className="mb-3 text-sm font-semibold tracking-wide uppercase opacity-0">
              {t('sections.popularParks')}
            </div>
            <div className="space-y-3">
              <div>
                <Link
                  href="/parks/europe/france"
                  prefetch={false}
                  className="text-muted-foreground hover:text-foreground mb-2 block text-xs font-medium uppercase transition-colors"
                  aria-label={`${tGeo('countries.france')} - Theme Parks`}
                >
                  {tGeo('countries.france')}
                </Link>
                <nav
                  className="flex flex-col gap-2 text-sm"
                  aria-label={`Popular theme parks in ${tGeo('countries.france')}`}
                >
                  <Link
                    href="/parks/europe/france/marne-la-vallee/disneyland-paris"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Disneyland Paris - Wait Times"
                  >
                    Disneyland Paris
                  </Link>
                  <Link
                    href="/parks/europe/france/plailly/parc-asterix"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Parc Asterix - Wait Times"
                  >
                    Parc Asterix
                  </Link>
                  <Link
                    href="/parks/europe/france/les-epesses/puy-du-fou"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Puy du Fou - Wait Times"
                  >
                    Puy du Fou
                  </Link>
                  <Link
                    href="/parks/europe/france/chasseneuil-du-poitou/futuroscope"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Futuroscope - Wait Times"
                  >
                    Futuroscope
                  </Link>
                  <Link
                    href="/parks/europe/france/dolancourt/nigloland"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Nigloland - Wait Times"
                  >
                    Nigloland
                  </Link>
                </nav>
              </div>
            </div>
          </section>

          {/* Popular Parks - Japan */}
          <section className="hidden space-y-3 md:block">
            <div className="mb-3 text-sm font-semibold tracking-wide uppercase opacity-0">
              {t('sections.popularParks')}
            </div>
            <div className="space-y-3">
              <div>
                <Link
                  href="/parks/asia/japan"
                  prefetch={false}
                  className="text-muted-foreground hover:text-foreground mb-2 block text-xs font-medium uppercase transition-colors"
                  aria-label={`${tGeo('countries.japan')} - Theme Parks`}
                >
                  {tGeo('countries.japan')}
                </Link>
                <nav
                  className="flex flex-col gap-2 text-sm"
                  aria-label={`Popular theme parks in ${tGeo('countries.japan')}`}
                >
                  <Link
                    href="/parks/asia/japan/tokyo/tokyo-disneyland"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Tokyo Disneyland - Wait Times"
                  >
                    Tokyo Disneyland
                  </Link>
                  <Link
                    href="/parks/asia/japan/tokyo/tokyo-disneysea"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Tokyo DisneySea - Wait Times"
                  >
                    Tokyo DisneySea
                  </Link>
                  <Link
                    href="/parks/asia/japan/osaka/universal-studios-japan"
                    prefetch={false}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Universal Studios Japan - Wait Times"
                  >
                    Universal Studios Japan
                  </Link>
                </nav>
              </div>
            </div>
          </section>
        </div>

        <Separator className="my-8" />

        <div className="mt-4 mb-6 text-center">
          <p className="text-muted-foreground/80 text-sm">{t('disclaimer')}</p>
        </div>

        <div className="text-muted-foreground flex flex-col items-center justify-between text-sm md:flex-row">
          <div className="flex flex-col items-center text-center md:text-left">
            <p>{t('copyright', { year: currentYear })}</p>
            <BuildInfo />
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/impressum"
              prefetch={false}
              className="hover:text-foreground text-sm transition-colors"
              aria-label={t('impressum')}
            >
              {t('impressum')}
            </Link>
            <span className="text-muted-foreground/60 flex items-center">•</span>
            <Link
              href="/datenschutz"
              prefetch={false}
              className="hover:text-foreground text-sm transition-colors"
              aria-label={t('datenschutz')}
            >
              {t('datenschutz')}
            </Link>
            <span className="text-muted-foreground/60 flex items-center">•</span>
            <p>
              <a
                href="https://arns.dev"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hover:text-foreground transition-colors"
                aria-label="Visit Arns.dev website (opens in new tab)"
              >
                <span className="hidden md:inline">{t('poweredBy')}</span> Arns.dev
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
