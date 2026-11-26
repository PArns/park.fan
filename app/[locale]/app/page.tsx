import type { Metadata } from 'next';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  BellRing,
  CalendarDays,
  Download,
  Compass,
  HelpCircle,
  MessageCircle,
  Navigation,
  Smartphone,
  Timer,
} from 'lucide-react';
import { SITE_URL } from '@/i18n/config';
import { routing, type Locale } from '@/i18n/routing';
import { buildAlternates, buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { getMediaImage, getParkBackground } from '@/lib/media';
import { getMediaAlt } from '@/lib/media/text';
import { versionedSrc } from '@/lib/media/focus';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { plannerPath } from '@/lib/planner/segments';
import { buttonLinkProps } from '@/components/ui/button';
import { ObfuscatedEmail } from '@/components/common/obfuscated-email';
import { FaqAccordion } from '@/components/faq/faq-accordion';
import { LegalList } from '@/components/legal/legal-blocks';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';
import { PhoneShot } from '@/components/marketing/phone-shot';
import { ShotRow } from '@/components/marketing/shot-row';
import {
  A,
  HERO_FLOW_INTO_PULL,
  Highlight,
  IngredientCard,
  IngredientGrid,
  LandingHero,
  LandingNextSteps,
  P,
  SectionShell,
} from '@/components/marketing/editorial-ui';

/**
 * SWITCH: the app's numeric App Store id (`https://apps.apple.com/app/id<id>`), `null` while it is
 * not in the store. Set, it turns the hero's beta note into an App Store button and adds Safari's
 * smart app banner (`itunes`). Flip `/de/app` and `/en/app` to `true` in
 * `scripts/check-landing-pages.mjs` in the same commit: the hero then has its action.
 */
const APP_STORE_ID: string | null = null;

/**
 * SWITCH: the public TestFlight link (`https://testflight.apple.com/join/<code>`), `null` while the
 * beta is by invitation. Set while `APP_STORE_ID` is not, the hero's button leads to the beta (the
 * same flip in `scripts/check-landing-pages.mjs` applies).
 */
const TESTFLIGHT_URL: string | null = 'https://testflight.apple.com/join/W3b54H4U';

/** The photo behind the hero: the Wintertraum photo, which heads the app's calendar too. */
const HERO_PARK_SLUG = 'phantasialand';

/**
 * The app's screens: `public/media/app/<locale>/<scene>.webp` (the store kit's raw captures, WebP,
 * 1080 px wide) with a `<scene>.json` sidecar holding the `alt` in that locale. A scene shows where
 * its file exists for the locale, so a retaken one goes live by adding those two files; a chapter
 * without a capture stands as text.
 */
type Scene =
  | '01-start'
  | '02-park'
  | '03-ride'
  | '04-calendar'
  | '05-planner'
  | '06-compass'
  | '07-parky'
  | '08-favorites'
  | '09-lockscreen';

/** The hero takes the first of these that exists; the chapters skip the scene it took. */
const HERO_SCENES: Scene[] = ['01-start', '04-calendar'];

interface Shot {
  scene: Scene;
  src: string;
  alt: string;
  size: { width: number; height: number };
}

/** The first of `scenes` captured in this locale, leaving out the one `skip` already shows. */
function findShot(locale: string, scenes: Scene[], skip?: Shot | null): Shot | null {
  for (const scene of scenes) {
    if (scene === skip?.scene) continue;
    const image = getMediaImage(`app/${locale}/${scene}`);
    if (!image) continue;
    return {
      scene,
      src: versionedSrc(image),
      alt: getMediaAlt(image.id, locale) ?? image.title,
      size: { width: image.width, height: image.height },
    };
  }
  return null;
}

/** A chapter's text beside its screen, or the text alone while the chapter has no capture. */
function WithShot({
  shot,
  reverse,
  children,
}: {
  shot: Shot | null;
  reverse?: boolean;
  children: ReactNode;
}) {
  if (!shot) return <div className="max-w-3xl space-y-6">{children}</div>;
  return (
    <ShotRow src={shot.src} alt={shot.alt} size={shot.size} reverse={reverse}>
      {children}
    </ShotRow>
  );
}

/** One feature in a chapter's text column: its name and what it does. */
function Feature({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-foreground/85 text-lg leading-relaxed">{children}</p>
    </div>
  );
}

/** The chapter's lead paragraph, the size `ShotRow` text runs at on Parky's page. */
function Body({ children }: { children: ReactNode }) {
  return <p className="text-foreground/85 text-lg leading-relaxed sm:text-xl">{children}</p>;
}

/**
 * The way to the app, a size above `LandingAction`'s button: it is the page's whole purpose. It
 * leaves for Apple's site, so it opens in a new tab.
 */
function GetAppButton({ href, label, hero }: { href: string; label: string; hero?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      data-landing-action={hero ? '' : undefined}
      {...buttonLinkProps({
        size: 'lg',
        withIcon: true,
        className:
          'shadow-primary/30 h-12 px-6 text-base font-semibold shadow-lg sm:h-14 sm:text-lg',
      })}
    >
      <Download aria-hidden className="size-5" />
      {label}
    </a>
  );
}

/** A `t.rich` tag that links its words to `href`. */
function link(href: string) {
  return function LinkedWords(chunks: ReactNode) {
    return <A href={href}>{chunks}</A>;
  };
}

interface AppPageProps {
  params: Promise<{ locale: string }>;
}

/** Six URLs, all prerendered: the page reads no request. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: AppPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'appPage' });
  const ogImageUrl = getOgImageUrl([locale, 'app']);

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    ...buildOpenGraphMetadata({
      locale,
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: `${SITE_URL}/${locale}/app`,
      ogImageUrl,
    }),
    alternates: buildAlternates(locale, () => '/app'),
    ...(APP_STORE_ID && { itunes: { appId: APP_STORE_ID } }),
  };
}

/**
 * The iPhone app's page and the App Store's support URL: what the app does, in chapters beside the
 * app's real screens, and the help (requirements, questions, contact) at its foot.
 */
export default async function AppPage({ params }: AppPageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) return null;
  setRequestLocale(locale);

  const [t, tLanding, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'appPage' }),
    getTranslations({ locale, namespace: 'landing' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);

  const photo = getParkBackground(HERO_PARK_SLUG);
  const heroShot = findShot(locale, HERO_SCENES);
  const shots = {
    plan: findShot(locale, ['04-calendar', '05-planner'], heroShot),
    park: findShot(locale, ['06-compass', '03-ride', '02-park'], heroShot),
    lock: findShot(locale, ['09-lockscreen'], heroShot),
    parky: findShot(locale, ['07-parky'], heroShot),
    more: findShot(locale, ['08-favorites'], heroShot),
  };

  const action = APP_STORE_ID
    ? { href: `https://apps.apple.com/app/id${APP_STORE_ID}`, label: t('storeAction') }
    : TESTFLIGHT_URL
      ? { href: TESTFLIGHT_URL, label: t('betaAction') }
      : undefined;
  const faq = (['compass', 'push', 'accuracy', 'delete'] as const).map((key) => ({
    key,
    question: t(`help.faq.${key}Q`),
    answer: t.rich(`help.faq.${key}A`, {
      link: link(key === 'accuracy' ? '/' + HOWTO_SEGMENTS[locale as Locale] : '/datenschutz#app'),
    }),
  }));

  return (
    <>
      <BreadcrumbStructuredData
        breadcrumbs={[{ name: tNav('home'), url: '/' }]}
        currentPage={{ name: t('title'), url: '/app' }}
        locale={locale}
      />
      <LandingHero
        kicker={t('title')}
        kickerBadge={APP_STORE_ID ? undefined : t('betaBadge')}
        title={t('headline')}
        tagline={t('lead')}
        imageSrc={photo ? versionedSrc(photo) : undefined}
        imageAlt={photo ? (getMediaAlt(photo.id, locale) ?? '') : undefined}
        scrollLabel={tLanding('scroll')}
        actionElement={action && <GetAppButton {...action} hero />}
        answer={
          <div className="flex items-center gap-4">
            {/* The big pin, the brand's mark, with its light and dark artwork. */}
            <Image
              src="/logo.svg"
              width={82}
              height={100}
              alt=""
              aria-hidden="true"
              className="h-16 w-auto dark:hidden"
            />
            <Image
              src="/logo-dark.svg"
              width={82}
              height={100}
              alt=""
              aria-hidden="true"
              className="hidden h-16 w-auto dark:block"
            />
            <div>
              {!APP_STORE_ID && <p className="text-foreground font-semibold">{t('status')}</p>}
              <p className="text-foreground/75 text-sm">{t('requirement')}</p>
            </div>
          </div>
        }
        aside={heroShot && <PhoneShot src={heroShot.src} alt={heroShot.alt} size={heroShot.size} />}
        flowInto
      />

      <div
        id="start"
        className={`relative space-y-16 pt-0 pb-16 sm:space-y-24 sm:pt-16 sm:pb-24 ${HERO_FLOW_INTO_PULL}`}
      >
        {/* The hero's screen below `lg`, where the hero has no second column. */}
        {heroShot && (
          <div className="container mx-auto px-4 lg:hidden">
            <PhoneShot src={heroShot.src} alt={heroShot.alt} size={heroShot.size} />
          </div>
        )}

        <SectionShell
          id="plan"
          index="01"
          kicker={t('plan.kicker')}
          title={t('plan.title')}
          icon={CalendarDays}
        >
          <WithShot shot={shots.plan}>
            <Feature title={t('plan.calendarTitle')}>{t('plan.calendarBody')}</Feature>
            <Feature title={t('plan.plannerTitle')}>{t('plan.plannerBody')}</Feature>
          </WithShot>
        </SectionShell>

        <SectionShell
          id="park"
          index="02"
          kicker={t('park.kicker')}
          title={t('park.title')}
          icon={Compass}
        >
          <WithShot shot={shots.park} reverse>
            <Body>{t('park.body')}</Body>
          </WithShot>
          <IngredientGrid>
            <IngredientCard icon={Timer} title={t('park.waitsTitle')}>
              {t('park.waitsBody')}
            </IngredientCard>
            <IngredientCard icon={Compass} title={t('park.compassTitle')} delay={80}>
              {t('park.compassBody')}
            </IngredientCard>
            <IngredientCard icon={Navigation} title={t('park.guideTitle')} delay={160}>
              {t('park.guideBody')}
            </IngredientCard>
          </IngredientGrid>
        </SectionShell>

        <SectionShell
          id="lock"
          index="03"
          kicker={t('lock.kicker')}
          title={t('lock.title')}
          icon={BellRing}
        >
          <WithShot shot={shots.lock}>
            <Body>{t('lock.body')}</Body>
            <P>{t('lock.notifications')}</P>
          </WithShot>
        </SectionShell>

        <SectionShell
          id="parky"
          index="04"
          kicker={t('parky.kicker')}
          title={t('parky.title')}
          icon={MessageCircle}
        >
          <WithShot shot={shots.parky} reverse>
            <Body>{t('parky.body')}</Body>
          </WithShot>
        </SectionShell>

        <SectionShell
          id="more"
          index="05"
          kicker={t('more.kicker')}
          title={t('more.title')}
          icon={Smartphone}
        >
          <WithShot shot={shots.more}>
            <Feature title={t('more.favoritesTitle')}>{t('more.favoritesBody')}</Feature>
            <Feature title={t('more.newsTitle')}>{t('more.newsBody')}</Feature>
            <Feature title={t('more.languagesTitle')}>{t('more.languagesBody')}</Feature>
          </WithShot>
          <Highlight>{t.rich('privacy', { link: link('/datenschutz#app') })}</Highlight>
        </SectionShell>

        <SectionShell
          id="help"
          index="06"
          kicker={t('help.kicker')}
          title={t('help.title')}
          icon={HelpCircle}
        >
          <div className="max-w-3xl space-y-10">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">{t('help.needsTitle')}</h3>
              <LegalList>
                {(t.raw('help.needs') as string[]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </LegalList>
            </div>
            {action && (
              <div className="space-y-3">
                <h3 className="text-xl font-semibold">{t('help.getTitle')}</h3>
                {!APP_STORE_ID && <P>{t('status')}</P>}
                <GetAppButton {...action} />
              </div>
            )}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">{t('help.faqTitle')}</h3>
              <FaqAccordion items={faq} padding="flush" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">{t('help.contactTitle')}</h3>
              <P>
                {t.rich('help.contact', {
                  email: () => (
                    <ObfuscatedEmail
                      local="hello"
                      domain="park.fan"
                      displayText={t('help.emailDisplay')}
                    />
                  ),
                  link: link('/impressum'),
                })}
              </P>
              <P>{t('help.independent')}</P>
            </div>
          </div>
        </SectionShell>
      </div>

      <LandingNextSteps
        title={t('next.title')}
        body={t('next.body')}
        destinations={[
          {
            href: '/' + BEST_TIME_SEGMENTS[locale as Locale],
            label: t('next.calendar'),
            icon: CalendarDays,
          },
          { href: plannerPath(locale), label: t('next.planner') },
          { href: '/parky', label: t('next.parky') },
        ]}
      />
    </>
  );
}
