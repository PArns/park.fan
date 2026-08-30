import { getTranslations } from 'next-intl/server';
import { ArrowRight, Check, User } from 'lucide-react';
import { Link } from '@/i18n/navigation';
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
 * No portrait: the media database holds none, and a hard-coded path to a file
 * that does not exist is a broken image on the most-visited page on the site.
 * The monogram tile takes its place and needs no asset.
 */
export async function FounderSection() {
  const t = await getTranslations('homeStory.founder');
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

        <div className="grid gap-8 lg:grid-cols-[minmax(0,260px)_1fr] lg:items-start">
          <Reveal>
            <div className="border-border bg-card/60 rounded-2xl border p-5 text-center">
              <span
                aria-hidden="true"
                className="border-primary/30 bg-primary/10 text-primary mx-auto flex size-20 items-center justify-center rounded-full border text-2xl font-bold"
              >
                PA
              </span>
              <div className="mt-3 font-semibold">{t('name')}</div>
              <div className="text-muted-foreground text-sm">{t('role')}</div>
              <Link
                href={`/blog/authors/${AUTHOR_SLUG}` as '/'}
                prefetch={false}
                className="text-primary mt-3 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
              >
                {t('authorLink')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
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
