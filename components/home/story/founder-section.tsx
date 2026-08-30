import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Check, User } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getAuthor } from '@/lib/blog/authors';
import type { Locale } from '@/i18n/config';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';

/** Author slug the blog already publishes a page for. */
const AUTHOR_SLUG = 'patrick';

/**
 * Who is behind this.
 *
 * The bullet list and the two paragraphs deliberately restate no fact the blog's
 * own author page does not already carry — the mock's "30 Jahre" against that
 * page's "über 25 Jahre" is exactly the sort of pair that ends up quoted back at
 * the site — and the section links there rather than growing a second biography
 * nobody will remember to update.
 *
 * The portrait is the blog author registry's `avatar`, not a path typed in here:
 * the same picture the author page and every post banner show, so there is one
 * file to replace and no second place to remember. It is a cut-out with a real
 * alpha channel, which is why it sits `object-contain` on a gradient plate
 * rather than filling a frame — `cover` would crop a head off.
 *
 * `avatar` is optional in the registry (it was an empty string until this photo
 * existed), so the plate falls back to the monogram rather than rendering a
 * broken image.
 */
export async function FounderSection({ locale }: { locale: Locale }) {
  const t = await getTranslations('homeStory.founder');
  const author = getAuthor(AUTHOR_SLUG, locale);
  const bullets = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'] as const;

  return (
    <section className="border-border bg-muted/30 border-t px-4 py-16 sm:py-18">
      <div className="container mx-auto">
        <Reveal>
          <ChapterHeading
            variant="tile"
            icon={User}
            kicker={t('kicker')}
            title={t('title')}
            id="ueber-uns"
          />
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <Reveal>
            {/* The name plate hangs off the portrait's lower-left corner, so the
                two need one positioning context and room for the overhang —
                hence the padding on the wrapper rather than a negative margin
                that would be clipped by the section. */}
            <div className="relative pb-4 pl-4">
              <div className="border-border relative aspect-4/5 overflow-hidden rounded-[22px] border bg-[linear-gradient(160deg,color-mix(in_oklab,var(--color-primary)_12%,transparent),color-mix(in_oklab,var(--color-muted)_40%,transparent))]">
                {author?.avatar ? (
                  <Image
                    src={author.avatar}
                    alt={t('portraitAlt')}
                    fill
                    sizes="(min-width: 1024px) 380px, 100vw"
                    className="object-contain object-bottom"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="text-primary/40 absolute inset-0 flex items-center justify-center text-6xl font-bold"
                  >
                    PA
                  </span>
                )}
              </div>
              <div className="border-border bg-card/90 absolute bottom-0 left-0 rounded-[14px] border px-4 py-3 shadow-lg backdrop-blur-md">
                <div className="text-[15px] font-bold">{t('name')}</div>
                <div className="text-muted-foreground text-xs">{t('role')}</div>
                <Link
                  href={`/blog/authors/${AUTHOR_SLUG}` as '/'}
                  prefetch={false}
                  className="text-primary mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                >
                  {t('authorLink')}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div>
              <p className="leading-relaxed">{t('p1')}</p>
              <p className="text-muted-foreground mt-4 leading-relaxed">{t('p2')}</p>

              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {bullets.map((key) => (
                  <li key={key} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className="text-status-operating mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
