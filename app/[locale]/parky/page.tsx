import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  CalendarHeart,
  HelpCircle,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  generateAlternateLanguages,
  locales,
  localeToOpenGraphLocale,
  SITE_URL,
} from '@/i18n/config';
import { routing, type Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { cn } from '@/lib/utils';
import { getParkBackground } from '@/lib/media';
import { getMediaAlt } from '@/lib/media/text';
import { versionedPath, versionedSrc } from '@/lib/media/focus';
import { plannerPath } from '@/lib/planner/segments';
import {
  BreadcrumbStructuredData,
  WebApplicationStructuredData,
} from '@/components/seo/structured-data';
import {
  FaqList,
  HERO_FLOW_INTO_PULL,
  LandingHero,
  LandingNextSteps,
  P,
  SectionShell,
} from '@/components/marketing/editorial-ui';
import type { ParkyAct } from '@/lib/assistant/parky/acts';
import { AskParkyButton, ParkyFigure, ParkyLookPicker, ParkyStage } from './_parky-ui';
import { ShotRow } from '@/components/marketing/shot-row';

/** The photo behind the hero: the only park background wide enough for a full-bleed head. */
const HERO_PARK_SLUG = 'disneyland-park';

/** Where the page's one action leads: the card with the button that opens Parky. */
const ASK_ID = 'fragen';

/**
 * A few of Parky's acts on the stage, not all: the rest are for the visitor to come across, and the
 * last tile says there are more.
 */
const STAGE: ParkyAct[] = ['coaster', 'love', 'shades', 'nap', 'gum'];

interface ParkyPageProps {
  params: Promise<{ locale: string }>;
}

/** Six URLs, all prerendered: the page reads no request, and Parky itself starts in the browser. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: ParkyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'parkyPage' });
  const ogImageUrl = getOgImageUrl([locale, 'parky']);
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `${SITE_URL}/${locale}/parky`,
      siteName: 'park.fan',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: t('metaTitle') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metaTitle'),
      description: t('metaDescription'),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/parky`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/parky`),
        'x-default': `${SITE_URL}/en/parky`,
      },
    },
  };
}

/** A screenshot of the given kind in the reader's language (`public/media/parky/<locale>/`). */
function shot(locale: string, name: 'chat' | 'plan' | 'search'): string {
  return versionedPath(`/media/parky/${locale}/${name}.webp`);
}

/**
 * A chapter's text with questions somebody could ask, set as Parky's own suggestion chips, beside
 * its screenshot ({@link ShotRow}).
 */
function ParkyShotRow({
  body,
  examples,
  examplesLabel,
  shotSrc,
  shotAlt,
  reverse = false,
}: {
  body: string;
  examples?: string[];
  examplesLabel: string;
  shotSrc: string;
  shotAlt: string;
  reverse?: boolean;
}) {
  return (
    <ShotRow src={shotSrc} alt={shotAlt} reverse={reverse}>
      <p className="text-foreground/85 text-lg leading-relaxed sm:text-xl">{body}</p>
      {examples && (
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            {examplesLabel}
          </p>
          <ul className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <li
                key={example}
                className="border-primary/30 bg-primary/10 text-foreground rounded-2xl rounded-bl-sm border px-3.5 py-2 text-sm"
              >
                {example}
              </li>
            ))}
          </ul>
        </div>
      )}
    </ShotRow>
  );
}

/**
 * Parky's own page: what the chat assistant answers and does, shown in screenshots of the real
 * widget, its acts on a live stage, what happens to the questions, and a button that opens it.
 * The page invites the visitor, so Parky shows here whatever the rollout share says.
 */
export default async function ParkyPage({ params }: ParkyPageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) return null;
  setRequestLocale(locale);

  const [t, tLanding, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'parkyPage' }),
    getTranslations({ locale, namespace: 'landing' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);
  const image = getParkBackground(HERO_PARK_SLUG);
  const hero = image
    ? { src: versionedSrc(image), alt: getMediaAlt(image.id, locale) ?? '' }
    : null;
  const action = { href: `/parky#${ASK_ID}`, label: tLanding('parky.action'), icon: MessageCircle };
  const faq = t.raw('faq.items') as Array<{ question: string; answer: string }>;
  const tiles = STAGE.map((act) => ({ act, label: t(`gallery.${act}`) }));

  return (
    <>
      <BreadcrumbStructuredData
        breadcrumbs={[{ name: tNav('home'), url: '/' }]}
        currentPage={{ name: t('metaTitle'), url: '/parky' }}
        locale={locale}
      />
      <WebApplicationStructuredData
        name={t('metaTitle')}
        description={t('metaDescription')}
        path="/parky"
        locale={locale}
      />
      {hero ? (
        <LandingHero
          kicker={tLanding('parky.kicker')}
          title={t('title')}
          tagline={t('lead')}
          imageSrc={hero.src}
          imageAlt={hero.alt}
          scrollLabel={tLanding('scroll')}
          action={action}
          aside={<ParkyFigure className="size-72 xl:size-80" />}
          flowInto
        />
      ) : (
        <LandingHero
          variant="compact"
          kicker={tLanding('parky.kicker')}
          title={t('title')}
          tagline={t('lead')}
          action={action}
        />
      )}

      <div
        id="start"
        className={cn(
          'relative space-y-16 pb-16 sm:space-y-24 sm:pb-24',
          hero ? cn('pt-0 sm:pt-16', HERO_FLOW_INTO_PULL) : 'pt-8 sm:pt-12'
        )}
      >
        {/* Parky in person and the button that brings it up: the hero's action lands here. */}
        <div className="container mx-auto px-4">
          <div
            id={ASK_ID}
            data-card
            className="border-border/60 bg-background/80 relative grid scroll-mt-24 items-center gap-6 overflow-hidden rounded-3xl border px-6 pt-12 pb-6 shadow-xl backdrop-blur sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-10 sm:pt-14"
          >
            <div
              aria-hidden="true"
              className="from-primary/15 to-status-operating/15 absolute inset-0 bg-gradient-to-br"
            />
            <ParkyFigure className="relative mx-auto size-36 sm:size-44" />
            <div className="relative space-y-5">
              <p className="text-lg leading-relaxed sm:text-xl">{t('intro')}</p>
              <AskParkyButton label={t('ask')} off={t('off')} />
            </div>
          </div>
        </div>

        <SectionShell
          id="ask"
          index="01"
          kicker={t('chapters.ask.kicker')}
          title={t('chapters.ask.title')}
          icon={MessageCircle}
        >
          <ParkyShotRow
            body={t('chapters.ask.body')}
            examples={t.raw('chapters.ask.examples') as string[]}
            examplesLabel={t('examplesLabel')}
            shotSrc={shot(locale, 'chat')}
            shotAlt={t('chapters.ask.alt')}
          />
        </SectionShell>

        <SectionShell
          id="plan"
          index="02"
          kicker={t('chapters.plan.kicker')}
          title={t('chapters.plan.title')}
          icon={CalendarHeart}
        >
          <ParkyShotRow
            body={t('chapters.plan.body')}
            examples={t.raw('chapters.plan.examples') as string[]}
            examplesLabel={t('examplesLabel')}
            shotSrc={shot(locale, 'plan')}
            shotAlt={t('chapters.plan.alt')}
            reverse
          />
        </SectionShell>

        <SectionShell
          id="search"
          index="03"
          kicker={t('chapters.search.kicker')}
          title={t('chapters.search.title')}
          icon={Search}
        >
          <ParkyShotRow
            body={t('chapters.search.body')}
            examplesLabel={t('examplesLabel')}
            shotSrc={shot(locale, 'search')}
            shotAlt={t('chapters.search.alt')}
          />
        </SectionShell>

        <SectionShell
          id="character"
          index="04"
          kicker={t('chapters.character.kicker')}
          title={t('chapters.character.title')}
          icon={Sparkles}
        >
          <P>{t('chapters.character.body')}</P>
          <ParkyStage tiles={tiles} more={t('gallery.more')} />
          <ParkyLookPicker labels={t.raw('looks')} />
        </SectionShell>

        <SectionShell
          id="data"
          index="05"
          kicker={t('chapters.data.kicker')}
          title={t('chapters.data.title')}
          icon={ShieldCheck}
        >
          <P>
            {t('chapters.data.body')}{' '}
            <Link href="/datenschutz" className="text-primary font-medium underline">
              {t('chapters.data.link')}
            </Link>
          </P>
        </SectionShell>

        <SectionShell
          id="faq"
          index="06"
          kicker={t('faq.kicker')}
          title={t('faq.title')}
          icon={HelpCircle}
        >
          <FaqList items={faq} />
        </SectionShell>
      </div>

      <LandingNextSteps
        title={t('next.title')}
        destinations={[
          {
            href: `/parky#${ASK_ID}`,
            label: t('next.ask'),
            description: t('next.askDescription'),
            icon: MessageCircle,
          },
          {
            href: plannerPath(locale),
            label: t('next.planner'),
            description: t('next.plannerDescription'),
            icon: CalendarHeart,
          },
          { href: '/parks', label: t('next.parks'), description: t('next.parksDescription') },
        ]}
      />
    </>
  );
}
