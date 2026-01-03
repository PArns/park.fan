import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Sparkles, ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2" aria-label="park.fan - Home">
              <div
                className="bg-park-primary flex h-8 w-8 items-center justify-center rounded-lg"
                aria-hidden="true"
              >
                <Sparkles className="text-park-primary-foreground h-5 w-5" />
              </div>
              <span className="text-xl font-bold">park.fan</span>
            </Link>
            <p className="text-muted-foreground text-sm">{t('description')}</p>
          </div>

          {/* Explore */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('sections.explore')}</h3>
            <nav className="flex flex-col gap-2 text-sm" aria-label="Explore parks by region">
              <Link
                href="/parks/europe"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Explore theme parks in Europe"
              >
                {t('regions.europe')}
              </Link>
              <Link
                href="/parks/north-america"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Explore theme parks in North America"
              >
                {t('regions.northAmerica')}
              </Link>
              <Link
                href="/parks/asia"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Explore theme parks in Asia"
              >
                {t('regions.asia')}
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('sections.resources')}</h3>
            <nav className="flex flex-col gap-2 text-sm" aria-label="Resources and external links">
              <a
                href="https://api.park.fan/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                aria-label="park.fan API Documentation (opens in new tab)"
              >
                {t('api')}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <a
                href="https://github.com/PArns"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                aria-label="GitHub Profile (opens in new tab)"
              >
                GitHub
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <a
                href="https://arns.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                aria-label="Arns.dev website (opens in new tab)"
              >
                Arns.dev
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('sections.legal')}</h3>
            <nav className="flex flex-col gap-2 text-sm" aria-label="Legal information and contact">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Privacy Policy"
              >
                {t('privacy')}
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Terms of Service"
              >
                {t('terms')}
              </Link>
              <Link
                href="/contact"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Contact Us"
              >
                {t('contact')}
              </Link>
            </nav>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="text-muted-foreground flex flex-col items-center justify-between gap-4 text-sm md:flex-row">
          <p>{t('copyright', { year: currentYear })}</p>
          <p>
            Powered by{' '}
            <a
              href="https://arns.dev"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Arns.dev website (opens in new tab)"
            >
              Arns.dev
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
