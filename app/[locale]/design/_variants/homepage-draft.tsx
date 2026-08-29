import { getTranslations } from 'next-intl/server';
import { ArrowRight, CalendarRange, Newspaper, Star } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { WaitInContext } from '@/components/home/wait-in-context';
import { ParkBoard } from '@/components/home/park-board';
import { HomeFaqSection } from '@/components/home/home-faq-section';
import { HubLinksSection } from '@/components/home/hub-links-section';
import { FavoritesEmptyState } from '@/components/parks/favorites-empty-state';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { ParkComparisonCard } from '@/components/parks/park-comparison-card';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import type { ComparisonPark } from '@/lib/hooks/use-park-comparison-stats';
import type { FeaturedCardStatic } from '@/components/home/featured-park-cards-live';
import type { Locale } from '@/i18n/config';
import type { GlobalStats } from '@/lib/api/types';
import type { BlogListItem } from '@/lib/blog/types';

/**
 * Der Entwurf: erst lesen, dann verstehen, dann nachschlagen.
 *
 * ── Warum der Blog nach oben gehört ─────────────────────────────────────────────────────────
 * Die Startseite hat sechzig geschriebene Beiträge mit gemessenen Zahlen, und die stehen heute
 * zweimal auf der Seite: als Streifen unter dem Hero und noch einmal dreitausend Pixel tiefer,
 * dieselben drei Beiträge. Das ist das einzige auf dieser Seite, das kein anderes
 * Wartezeiten-Portal hat — und es lag zwischen vier Kennzahlenbändern begraben. Jetzt steht es
 * oben, einmal, mit einem Aufmacher.
 *
 * ── Warum die Erklärung eine Vorführung ist ─────────────────────────────────────────────────
 * „Was ist park.fan?" steht heute ganz unten unter drei Dashboards und fängt mit der
 * Gründungsgeschichte an. Die Auskunft ist aber ein Satz, den man an einer echten Bahn zeigen
 * kann: eine Zahl am Eingang sagt für sich nichts, erst der Vergleich mit dem, was um diese
 * Stunde üblich ist, macht daraus eine Information. `WaitInContext` zeigt genau das, live, an der
 * Bahn mit der kürzesten Schlange der Welt — aus zwei Feldern, die die Startseite ohnehin holt
 * und von denen eines bisher nirgends gerendert wurde.
 *
 * Danach erst die Werkzeuge: welche Parks offen haben, an welchem Wochentag es sich lohnt, und
 * das Nachschlagewerk.
 */
export async function HomepageDraft({
  locale,
  stats,
  parks,
  posts,
}: {
  locale: Locale;
  stats: GlobalStats | null;
  parks: FeaturedCardStatic[];
  posts: BlogListItem[];
}) {
  const [tHome, tBlog, tNav, tStats, tOverview, tBest] = await Promise.all([
    getTranslations('home'),
    getTranslations('blog'),
    getTranslations('navigation'),
    getTranslations('parks.stats'),
    getTranslations('parks.overview'),
    getTranslations('bestTime.quietestByPark'),
  ]);

  const [feature, ...rest] = posts;

  const comparisonParks: ComparisonPark[] = parks.slice(0, 4).map((park) => {
    const [, , continent, country, city, parkSlug] = park.href.split('/');
    return {
      slug: park.slug,
      name: park.name,
      href: park.href,
      continent,
      country,
      city,
      parkSlug,
    };
  });

  // Wochentagsnamen aus der Laufzeit statt aus sechs übersetzten Listen — 2023-01-01 war ein
  // Sonntag, der Index passt damit direkt auf `DayOfWeekStat.dayOfWeek`.
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  const weekdayNames = Array.from({ length: 7 }, (_, i) =>
    weekday.format(new Date(Date.UTC(2023, 0, 1 + i)))
  );

  /*
   * Die kürzeste Schlange führt den Vergleich besser vor als die längste: „kürzer als sonst" ist
   * eine Einladung, „länger als sonst" eine Warnung — und die Startseite soll jemanden losschicken.
   *
   * Aber `typicalWaitThisHour` ist nicht garantiert: eine Bahn, für die diese Stunde noch nie
   * gemessen wurde, kommt ohne das Feld. Also die erste, die einen Vergleichswert hat, und wenn
   * keine einen hat, `null` — der Abschnitt bleibt dann trotzdem stehen, nur ohne Abbildung.
   */
  const contextRide =
    [stats?.shortestWaitRide, stats?.longestWaitRide].find(
      (r) => r?.typicalWaitThisHour != null && r.typicalWaitThisHour > 0
    ) ?? null;

  return (
    <div className="flex flex-col">
      {/* ── Zuerst: der Blog ──────────────────────────────────────────────────────────────── */}
      <section className="px-4 pt-12 pb-16 sm:pt-16">
        <div className="container mx-auto">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
                {tBlog('home.heading')}
              </span>
              <h2 className="text-foreground mt-2 text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
                {tHome('blogLead.headline')}
              </h2>
            </div>
            <Link
              href="/blog"
              prefetch={false}
              className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
            >
              <Newspaper className="h-3.5 w-3.5" aria-hidden="true" />
              {tBlog('home.viewAll')}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Ein Aufmacher groß, der Rest als Zeilen. Sechs gleich große Karten überlassen dem
              Leser die ganze Auswahl; ein Aufmacher trifft sie für ihn. */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-10">
            {feature && <BlogPostCard post={feature} variant="feature" priority />}
            <div className="grid gap-3 self-start">
              {rest.slice(0, 4).map((post) => (
                <BlogPostCard key={post.translationKey} post={post} variant="compact" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Dann: was das hier eigentlich ist, an einer echten Bahn vorgeführt ────────────── */}
      <div className="bg-muted/40">
        <WaitInContext ride={contextRide} queueRecords={stats?.counts.queueDataRecords} />
      </div>

      {/* ── Dann erst die Werkzeuge ───────────────────────────────────────────────────────── */}
      <section className="px-4 py-16">
        <div className="container mx-auto">
          <ChapterHeading
            icon={Star}
            title={tHome('sections.featuredParks')}
            hint={tHome('sections.featuredParksIntro')}
          />
          <div className="mt-6">
            <ParkBoard parks={parks.slice(0, 6)} />
          </div>
          <Link
            href="/parks"
            prefetch={false}
            className="text-primary hover:text-primary/80 mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
          >
            {tNav('explore')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="bg-muted/40 px-4 py-16">
        <div className="container mx-auto">
          <ChapterHeading
            icon={CalendarRange}
            title={tHome('draft.weekTitle')}
            hint={tHome('draft.weekLead')}
          />
          <div className="mt-6">
            <ParkComparisonCard
              parks={comparisonParks}
              title={tStats('comparisonTitle')}
              labelPark={tStats('comparisonPark')}
              labelParkAverage={tStats('parkAverage')}
              labelLongest={tStats('longestQueue')}
              labelMinutes={tOverview('minutesUnit')}
              labelQuietestDay={tBest('colQuietest')}
              weekdayNames={weekdayNames}
            />
          </div>
          <Link
            href={`/${BEST_TIME_SEGMENTS[locale]}`}
            prefetch={false}
            className="text-primary hover:text-primary/80 mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
          >
            {tNav('bestTime')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <FavoritesEmptyState />

      <HubLinksSection locale={locale} />

      <HomeFaqSection />
    </div>
  );
}
