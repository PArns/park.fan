import type { Metadata } from 'next';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  AlarmClock,
  Ban,
  BellRing,
  CalendarDays,
  Clock,
  CloudRain,
  Compass,
  Download,
  EyeOff,
  HelpCircle,
  Map as MapIcon,
  MessageCircle,
  MessagesSquare,
  Navigation,
  Newspaper,
  RotateCcw,
  Route,
  ShieldCheck,
  Smartphone,
  Star,
  Ticket,
  Timer,
  UserRoundX,
  type LucideIcon,
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
import { LegalList } from '@/components/legal/legal-blocks';
import {
  BreadcrumbStructuredData,
  MobileApplicationStructuredData,
} from '@/components/seo/structured-data';
import { ParkyStill } from '@/components/assistant/parky/parky-still';
import { cn } from '@/lib/utils';
import { PhoneShot } from '@/components/marketing/phone-shot';
import { ShotRow } from '@/components/marketing/shot-row';
import {
  A,
  FaqList,
  HERO_FLOW_INTO_PULL,
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

/** The three screens of the park chapter, side by side, with the kit's caption under each. */
const PARK_SCENES = [
  { key: 'park', scene: '02-park', icon: Timer },
  { key: 'ride', scene: '03-ride', icon: Ticket },
  { key: 'compass', scene: '06-compass', icon: Navigation },
] as const;

/** The kinds of notification, in the order of `lock.alerts` in the messages. */
const ALERT_ICONS = [BellRing, RotateCcw, CloudRain, Route, AlarmClock, Newspaper];

/** The three promises of the privacy chapter, in the order of `trust.items`. */
const TRUST_ICONS = [UserRoundX, Ban, EyeOff];

interface Shot {
  scene: Scene;
  src: string;
  alt: string;
  size: { width: number; height: number };
}

/** The first of `scenes` captured in this locale, leaving out the one `skip` already shows. */
function findShot(locale: string, scenes: readonly Scene[], skip?: Shot | null): Shot | null {
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
 * Screens side by side, each with its title and caption: three columns from `md`, below that a
 * row that scrolls sideways with the next phone peeking in, so a phone is not three screens long.
 */
function ShotStrip({
  items,
  label,
}: {
  items: { shot: Shot; title: string; caption: string; icon: LucideIcon }[];
  label: string;
}) {
  return (
    <ul
      aria-label={label}
      tabIndex={0}
      className="focus-visible:ring-ring/50 -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pt-6 pb-4 focus-visible:ring-2 focus-visible:outline-none md:mx-0 md:grid md:grid-cols-3 md:gap-10 md:overflow-visible md:px-0"
    >
      {items.map(({ shot, title, caption, icon: Icon }) => (
        <li
          key={shot.scene}
          className="w-[min(17.5rem,74vw)] shrink-0 snap-center space-y-5 md:w-auto"
        >
          <PhoneShot src={shot.src} alt={shot.alt} size={shot.size} tilt="none" />
          <div className="space-y-1.5 md:px-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Icon aria-hidden className="text-primary size-5 shrink-0" />
              {title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">{caption}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** A grey bar standing in for a line of text in {@link LiveSketch}. */
function Bar({ className }: { className: string }) {
  return <span className={cn('block h-2 rounded-full bg-white/25', className)} />;
}

/**
 * Where the park day shows up outside the app, drawn as a sketch rather than a screenshot: bars
 * for text, no rides, no times. The island, the Lock Screen card and the watch, each with its name.
 */
function LiveSketch({
  caption,
  lockScreen,
  island,
  watch,
}: {
  caption: string;
  lockScreen: string;
  island: string;
  watch: string;
}) {
  const rows = [
    { icon: Star, tone: 'bg-status-operating' },
    { icon: Navigation, tone: 'bg-primary' },
    { icon: Clock, tone: 'bg-amber-400' },
  ];
  return (
    <figure className="border-border/70 from-primary/10 rounded-3xl border border-dashed bg-gradient-to-br to-transparent p-6 sm:p-8">
      <div aria-hidden="true" className="grid items-end gap-8 sm:grid-cols-[1fr_auto]">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex h-10 w-56 items-center justify-between rounded-full bg-black px-3 shadow-lg ring-1 ring-white/10">
              <span className="bg-primary size-5 rounded-full" />
              <span className="bg-status-operating h-4 w-9 rounded-full" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">{island}</p>
          </div>
          <div className="space-y-2">
            <div className="max-w-sm space-y-3 rounded-[1.75rem] bg-neutral-900/90 p-4 shadow-xl ring-1 ring-white/10 backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="bg-primary size-4 rounded-md" />
                <Bar className="w-24" />
              </div>
              {rows.map(({ icon: Icon, tone }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Icon className="size-4 shrink-0 text-white/70" />
                  <Bar className={i === 1 ? 'w-32' : 'w-40'} />
                  <span className={cn('ml-auto h-4 w-10 rounded-full', tone)} />
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-sm font-medium">{lockScreen}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="mx-auto flex h-44 w-36 flex-col justify-center gap-3 rounded-[2.4rem] border-[6px] border-neutral-800 bg-black p-4 shadow-xl">
            <span className="bg-primary size-4 rounded-md" />
            <Bar className="w-16" />
            <span className="bg-status-operating h-4 w-12 rounded-full" />
            <Bar className="w-20" />
          </div>
          <p className="text-muted-foreground text-center text-sm font-medium">{watch}</p>
        </div>
      </div>
      <figcaption className="text-muted-foreground mt-6 text-sm">{caption}</figcaption>
    </figure>
  );
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
 * The iPhone app's page and the App Store's support URL: the app's real screens as a tour from the
 * day before to the day in the park, its promises on privacy, and the help (requirements, questions,
 * contact) at its foot.
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
    calendar: findShot(locale, ['04-calendar'], heroShot),
    planner: findShot(locale, ['05-planner'], heroShot),
    parky: findShot(locale, ['07-parky'], heroShot),
    more: findShot(locale, ['08-favorites'], heroShot),
  };
  const strip = PARK_SCENES.flatMap(({ key, scene, icon }) => {
    const shot = findShot(locale, [scene], heroShot);
    return shot
      ? [{ shot, icon, title: t(`scenes.${key}.title`), caption: t(`scenes.${key}.caption`) }]
      : [];
  });

  const action = APP_STORE_ID
    ? { href: `https://apps.apple.com/app/id${APP_STORE_ID}`, label: t('storeAction') }
    : TESTFLIGHT_URL
      ? { href: TESTFLIGHT_URL, label: t('betaAction') }
      : undefined;
  const faqKeys = [
    ...(APP_STORE_ID ? [] : (['beta'] as const)),
    ...(['cost', 'compass', 'push', 'accuracy', 'delete'] as const),
  ];
  const faq = faqKeys.map((key) => ({
    key,
    question: t(`help.faq.${key}Q`),
    answer: t.markup(`help.faq.${key}A`, { link: (chunks) => chunks }),
    rich: t.rich(`help.faq.${key}A`, {
      link: link(key === 'accuracy' ? '/' + HOWTO_SEGMENTS[locale as Locale] : '/datenschutz#app'),
    }),
  }));
  const alerts = t.raw('lock.alerts') as { title: string; body: string }[];
  const trust = t.raw('trust.items') as { title: string; body: string }[];
  const parkyPoints = t.raw('parky.points') as { title: string; body: string }[];

  return (
    <>
      <BreadcrumbStructuredData
        breadcrumbs={[{ name: tNav('home'), url: '/' }]}
        currentPage={{ name: t('title'), url: '/app' }}
        locale={locale}
      />
      <MobileApplicationStructuredData
        name="park.fan"
        description={t('metaDescription')}
        path={`/${locale}/app`}
        locale={locale}
        operatingSystem="iOS 26"
        installUrl={action?.href}
        screenshots={[heroShot, ...strip.map((item) => item.shot), ...Object.values(shots)]
          .filter((shot): shot is Shot => shot !== null)
          .map((shot) => shot.src)}
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
        aside={
          heroShot && (
            <PhoneShot src={heroShot.src} alt={heroShot.alt} size={heroShot.size} priority />
          )
        }
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
          <div className="space-y-16 sm:space-y-20">
            <WithShot shot={shots.calendar}>
              <Feature title={t('plan.calendarTitle')}>{t('plan.calendarBody')}</Feature>
            </WithShot>
            <WithShot shot={shots.planner} reverse>
              <Feature title={t('plan.plannerTitle')}>{t('plan.plannerBody')}</Feature>
            </WithShot>
          </div>
        </SectionShell>

        <SectionShell
          id="park"
          index="02"
          kicker={t('park.kicker')}
          title={t('park.title')}
          icon={Compass}
        >
          <div className="max-w-3xl">
            <Body>{t('park.body')}</Body>
          </div>
          {strip.length > 0 && <ShotStrip items={strip} label={t('park.title')} />}
          <IngredientGrid>
            <IngredientCard icon={Timer} title={t('park.waitsTitle')}>
              {t('park.waitsBody')}
            </IngredientCard>
            <IngredientCard icon={Compass} title={t('park.compassTitle')} delay={80}>
              {t('park.compassBody')}
            </IngredientCard>
            <IngredientCard icon={MapIcon} title={t('park.mapTitle')} delay={160}>
              {t('park.mapBody')}
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
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-4">
              <Body>{t('lock.body')}</Body>
              <P>{t('lock.watchBody')}</P>
            </div>
            <LiveSketch
              caption={t('lock.sketch')}
              lockScreen={t('lock.lockScreen')}
              island={t('lock.island')}
              watch={t('lock.watch')}
            />
          </div>
          <div className="space-y-4 pt-8">
            <h3 className="text-xl font-semibold">{t('lock.alertsTitle')}</h3>
            <P>{t('lock.alertsLead')}</P>
            <ul className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3">
              {alerts.map((alert, i) => {
                const Icon = ALERT_ICONS[i] ?? BellRing;
                return (
                  <li
                    key={alert.title}
                    className="bg-card border-border/60 flex items-start gap-3 rounded-2xl border p-4"
                  >
                    <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
                      <Icon aria-hidden className="size-4.5" />
                    </span>
                    <span>
                      <span className="block font-semibold">{alert.title}</span>
                      <span className="text-muted-foreground block text-sm leading-snug">
                        {alert.body}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </SectionShell>

        <SectionShell
          id="parky"
          index="04"
          kicker={t('parky.kicker')}
          title={t('parky.title')}
          icon={MessageCircle}
        >
          <WithShot shot={shots.parky} reverse>
            <ParkyStill ground="app-page-parky" className="size-24" />
            <dl className="space-y-5">
              {parkyPoints.map((point) => (
                <div key={point.title} className="space-y-1">
                  <dt className="text-lg font-semibold">{point.title}</dt>
                  <dd className="text-foreground/85 text-lg leading-relaxed">{point.body}</dd>
                </div>
              ))}
            </dl>
            <P>{t('parky.consent')}</P>
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
            <Feature title={t('more.statsTitle')}>{t('more.statsBody')}</Feature>
            <Feature title={t('more.languagesTitle')}>{t('more.languagesBody')}</Feature>
          </WithShot>
        </SectionShell>

        <SectionShell
          id="privacy"
          index="06"
          kicker={t('trust.kicker')}
          title={t('trust.title')}
          icon={ShieldCheck}
        >
          <ul className="grid gap-8 sm:grid-cols-3 sm:gap-6">
            {trust.map((item, i) => {
              const Icon = TRUST_ICONS[i] ?? ShieldCheck;
              return (
                <li key={item.title} className="border-primary/40 space-y-2 border-l-2 pl-5">
                  <Icon aria-hidden className="text-primary size-7" />
                  <h3 className="text-2xl font-bold tracking-tight">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.body}</p>
                </li>
              );
            })}
          </ul>
          <div className="max-w-3xl pt-4">
            <P>{t.rich('privacy', { link: link('/datenschutz#app') })}</P>
          </div>
        </SectionShell>

        <SectionShell
          id="help"
          index="07"
          kicker={t('help.kicker')}
          title={t('help.title')}
          icon={HelpCircle}
        >
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">{t('help.needsTitle')}</h3>
              <LegalList>
                {(t.raw('help.needs') as string[]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </LegalList>
            </div>
            {action && (
              <div className="border-primary/25 from-primary/10 space-y-4 rounded-3xl border bg-gradient-to-br to-transparent p-6 sm:p-8">
                <h3 className="text-xl font-semibold">{t('help.getTitle')}</h3>
                {!APP_STORE_ID && <P>{t('status')}</P>}
                <GetAppButton {...action} />
              </div>
            )}
            <div className="space-y-3 lg:col-span-2">
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

        <SectionShell
          id="faq"
          index="08"
          kicker={t('help.faqKicker')}
          title={t('help.faqTitle')}
          icon={MessagesSquare}
        >
          <div className="max-w-3xl">
            <FaqList items={faq} />
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
