'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const t = useTranslations('common');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="bg-destructive/10 mb-6 flex h-16 w-16 items-center justify-center rounded-full">
        <AlertTriangle className="text-destructive h-8 w-8" />
      </div>

      <h1 className="mb-2 text-2xl font-bold">{t('errorPageTitle')}</h1>
      <p className="text-muted-foreground mb-8 max-w-md text-base">{t('errorPageDescription')}</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset} variant="default" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          {t('retry')}
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/">
            <Home className="h-4 w-4" />
            {t('goHome')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
