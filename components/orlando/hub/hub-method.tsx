import { getTranslations } from 'next-intl/server';
import { ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import type { Locale } from '@/i18n/config';
import { formatHubDate } from '@/lib/orlando/hub-data';

/** The method's disclosures, each a short question with its paragraph underneath. */
const PARTS = ['sources', 'minutes', 'horizon', 'error', 'travel'] as const;

/**
 * The method chapter's body: how the forecast works, as a short summary with each part under its own
 * `<details>`, so the text is in the served HTML and a reader opens only what they ask about. Ends
 * with Fancast and the guide.
 */
export async function HubMethod({
  forecastUntil,
  attribution,
  locale,
}: {
  forecastUntil?: string;
  /** The travel matrix's credit, "© OpenStreetMap contributors". */
  attribution: string;
  locale: string;
}) {
  const t = await getTranslations('orlando.method');
  const horizon = forecastUntil ? formatHubDate(forecastUntil, locale, 'long') : null;
  return (
    <div className="max-w-3xl space-y-4">
      <p className="leading-relaxed">{t('summary')}</p>
      <div className="divide-border/50 border-border/60 divide-y rounded-xl border">
        {PARTS.map((part) => (
          <details key={part} className="group">
            <summary className="hover:bg-muted/40 flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-medium">
              {t(`${part}.title`)}
              <ChevronDown
                aria-hidden
                className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="text-muted-foreground px-4 pb-4 leading-relaxed">
              {part === 'horizon'
                ? horizon
                  ? t('horizon.body', { date: horizon })
                  : t('horizon.bodyNoDate')
                : part === 'travel'
                  ? t('travel.body', { attribution })
                  : t(`${part}.body`)}
            </p>
          </details>
        ))}
      </div>
      <p className="text-sm">
        {t.rich('links', {
          fancast: (chunks) => (
            <Link href="/fancast" className="text-primary-ink underline underline-offset-4">
              {chunks}
            </Link>
          ),
          howto: (chunks) => (
            <Link
              href={`/${HOWTO_SEGMENTS[locale as Locale] ?? HOWTO_SEGMENTS.en}`}
              className="text-primary-ink underline underline-offset-4"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
