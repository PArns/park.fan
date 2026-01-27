import { getMarkdownContent } from '@/lib/markdown';
import { FlipClock } from '@/components/ui/flip-clock';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility

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

export async function AnnounceSection({ locale }: AnnounceSectionProps) {
  const data = getMarkdownContent<AnnounceFrontmatter>(`content/home/announce.${locale}.md`);
  const t = await getTranslations('common'); // Or specific namespace if you have one for time labels

  // Fallback labels if not in translations yet, or use direct strings
  // Better to use translation keys if user asked for "translations in .md file except labels"
  // User said: "translations kommen in die .md file, ausser die labels für den countdown."
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

  // Check visibility based on startAt and endAt
  const now = new Date();
  if (startAt && new Date(startAt) > now) return null;
  if (endAt && new Date(endAt) < now) return null;

  // Strip /public prefix if present
  const cleanBackground = background?.startsWith('/public')
    ? background.replace('/public', '')
    : background;

  // Replace [b] tags with markdown bold syntax
  const processedContent = data.content.replace(/\[b\]/g, '**').replace(/\[\/b\]/g, '**');

  return (
    <section className="relative flex min-h-[500px] flex-col justify-center overflow-hidden py-16 md:py-24">
      {/* Background Image with Overlay */}
      {cleanBackground && (
        <div className="absolute inset-0 z-0">
          <Image
            src={cleanBackground}
            alt="Background"
            fill
            className="object-cover object-top"
            sizes="100vw"
            priority={true}
            quality={90}
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
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-muted-foreground mx-auto max-w-2xl text-xl font-semibold md:text-2xl">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="mb-12 flex justify-center">
          <FlipClock targetDate={countdownTo} labels={labels} />
        </div>

        <div className="prose prose-invert dark:prose-invert prose-gray mx-auto max-w-4xl">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => {
                const isInternal = href?.startsWith('/');
                if (isInternal && href) {
                  return (
                    <Button
                      asChild
                      variant="default"
                      size="lg"
                      className="mt-4 rounded-full font-semibold"
                    >
                      <Link href={href as string}>{children}</Link>
                    </Button>
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
                  {children}
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
