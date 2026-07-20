import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';

/**
 * Google "Preferred Sources" opt-in link. Points at Google's source-preferences
 * tool pre-filled with our domain, so a reader can mark park.fan as a preferred
 * source (its content then surfaces more prominently in Search / Top Stories).
 * Domain-level only — no schema or verification needed; just open in a new tab.
 * See https://developers.google.com/search/docs/appearance/preferred-sources
 */
const PREFERRED_SOURCE_URL = 'https://www.google.com/preferences/source?q=park.fan';

/** Official Google "G" mark (4-color). Decorative — labelled via the link. */
function GoogleGMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.97h3.87c2.26-2.09 3.55-5.17 3.55-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.87-2.97c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.27 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.32c-.24-.72-.38-1.49-.38-2.32s.14-1.6.38-2.32V6.59H1.29A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.29 5.41l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.72c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.27 2.7 1.29 6.59l3.98 3.09C6.22 6.83 8.87 4.72 12 4.72z"
      />
    </svg>
  );
}

interface PreferredSourceButtonProps {
  locale: string;
  className?: string;
}

export async function PreferredSourceButton({ locale, className }: PreferredSourceButtonProps) {
  const t = await getTranslations({ locale, namespace: 'footer' });

  return (
    <a
      href={PREFERRED_SOURCE_URL}
      target="_blank"
      rel="noopener noreferrer nofollow"
      aria-label={t('preferredSource.aria')}
      className={cn(
        'text-muted-foreground hover:text-foreground border-border hover:border-foreground/25 hover:bg-foreground/[0.03] inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
        className
      )}
    >
      <GoogleGMark className="h-4 w-4 shrink-0" />
      <span>{t('preferredSource.label')}</span>
    </a>
  );
}
