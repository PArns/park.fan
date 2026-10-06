import { getMarkdownContent } from '@/lib/markdown';
import Image from 'next/image';
import { backgroundImageLoader } from '@/lib/utils/image-loader';
import { objectPositionForSrc } from '@/lib/media/focus';
import { getTranslations } from 'next-intl/server';
import ReactMarkdown from 'react-markdown';
import { buttonLinkProps } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { getServerNowMs } from '@/lib/utils/server-time';
import { FlipClockLazy } from '@/components/home/flip-clock-lazy';

// The countdown loads framer-motion only when it renders; see `FlipClockLazy` for why the split
// has to happen in a client module.

interface AnnounceSectionProps {
  locale: string;
}

interface AnnounceFrontmatter {
  countdownTo?: string;
  startAt?: string;
  endAt?: string;
  background?: string;
  title?: string;
  subtitle?: string;
}

/**
 * Homepage announcement band from `content/home/announce.<locale>.md`: background photo, title,
 * flip-clock countdown to `countdownTo` and the markdown body. Renders nothing outside the
 * `startAt`/`endAt` window or without a countdown.
 */
export async function AnnounceSection({ locale }: AnnounceSectionProps) {
  const data = getMarkdownContent<AnnounceFrontmatter>(`home/announce.${locale}.md`);
  const t = await getTranslations('common');

  const labels = {
    days: t('time.days'),
    hours: t('time.hours'),
    minutes: t('time.minutes'),
    seconds: t('time.seconds'),
  };

  if (!data || !data.frontmatter.countdownTo) {
    return null;
  }

  const { countdownTo, background, title, subtitle, startAt, endAt } = data.frontmatter;

  // Check visibility based on startAt and endAt. Cached "now" (cacheComponents-safe);
  // a few minutes of staleness on an announcement window is irrelevant.
  const nowMs = await getServerNowMs();
  if (startAt && new Date(startAt).getTime() > nowMs) return null;
  if (endAt && new Date(endAt).getTime() < nowMs) return null;

  const cleanBackground = background?.startsWith('/public')
    ? background.replace('/public', '')
    : background;

  const processedContent = data.content.replace(/\[b\]/g, '**').replace(/\[\/b\]/g, '**');

  return (
    <section className="relative flex min-h-[500px] flex-col justify-center overflow-hidden py-16 md:py-24">
      {cleanBackground && (
        <div className="absolute inset-0 z-0">
          <Image
            src={cleanBackground}
            alt="Background"
            fill
            loader={backgroundImageLoader}
            className="object-cover"
            style={{ objectPosition: objectPositionForSrc(cleanBackground) }}
            sizes="100vw"
            // Below the hero, not the LCP: off `priority` so it does not compete with the hero
            // image for bandwidth. Shares the hero's loader, so the same quality and width clamp.
          />
          <div className="from-background via-background/90 to-muted/50 absolute inset-0 bg-gradient-to-br" />
          <div className="from-park-primary/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] via-transparent to-transparent" />
        </div>
      )}

      <div className="text-foreground relative z-10 container mx-auto px-4 text-center">
        {(title || subtitle) && (
          <div className="mb-12 space-y-4">
            {title && (
              <h2 className="text-3xl font-bold tracking-tight drop-shadow-sm md:text-5xl lg:text-6xl">
                <GlossaryInject>{title}</GlossaryInject>
              </h2>
            )}
            {subtitle && (
              <p className="text-muted-foreground mx-auto max-w-2xl text-xl font-semibold md:text-2xl">
                <GlossaryInject>{subtitle}</GlossaryInject>
              </p>
            )}
          </div>
        )}

        <div className="mb-12 flex justify-center">
          <FlipClockLazy targetDate={countdownTo} labels={labels} />
        </div>

        <div className="prose prose-invert dark:prose-invert prose-gray mx-auto max-w-4xl">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => {
                const isInternal = href?.startsWith('/');
                if (isInternal && href) {
                  // buttonLinkProps, not `<Button asChild>` — server component, see conventions §14.
                  return (
                    <Link
                      href={href as string}
                      {...buttonLinkProps({
                        size: 'lg',
                        className: 'mt-4 rounded-full font-semibold',
                      })}
                    >
                      {children}
                    </Link>
                  );
                }
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {children}
                  </a>
                );
              },
              p: ({ children }) => (
                <p className="text-muted-foreground mb-6 text-xl leading-relaxed font-medium last:mb-0 md:text-2xl">
                  {typeof children === 'string' ? (
                    <GlossaryInject>{children}</GlossaryInject>
                  ) : (
                    children
                  )}
                </p>
              ),
            }}
          >
            {processedContent}
          </ReactMarkdown>
        </div>
      </div>
    </section>
  );
}
