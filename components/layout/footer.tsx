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
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-park-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <Sparkles className="text-park-primary-foreground h-5 w-5" />
              </div>
              <span className="text-xl font-bold">park.fan</span>
            </Link>
            <p className="text-muted-foreground text-sm">{t('description')}</p>
          </div>

          {/* Explore */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('sections.explore')}</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/parks/europe" className="text-muted-foreground hover:text-foreground">
                {t('regions.europe')}
              </Link>
              <Link
                href="/parks/north-america"
                className="text-muted-foreground hover:text-foreground"
              >
                {t('regions.northAmerica')}
              </Link>
              <Link href="/parks/asia" className="text-muted-foreground hover:text-foreground">
                {t('regions.asia')}
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('sections.resources')}</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <a
                href="https://api.park.fan/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                {t('api')}
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://github.com/PArns"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://arns.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                Arns.dev
                <ExternalLink className="h-3 w-3" />
              </a>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('sections.legal')}</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                {t('privacy')}
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                {t('terms')}
              </Link>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground">
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
            <a href="https://arns.dev" target="_blank" rel="noopener noreferrer">
              Arns.dev
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
