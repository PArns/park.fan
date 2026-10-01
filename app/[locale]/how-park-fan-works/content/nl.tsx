import { Link } from '@/i18n/navigation';
import {
  A,
  SectionShell,
  Lead,
  P,
  PG,
  Highlight,
  IngredientGrid,
  IngredientCard,
  TouchpointGrid,
  FaqList,
} from '@/components/marketing/editorial-ui';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { HOWTO_CHAPTERS } from '@/lib/howto/chapters';
import {
  Activity,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CloudSun,
  Database,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  Ruler,
  Search,
  Sparkles,
  Star,
  Sunrise,
} from 'lucide-react';
import {
  BadgeRowDemo,
  BareNumberVsCard,
  CalendarDaysDemo,
  DemoFrame,
  LiveHourlyProfile,
  LiveTopAttractions,
  NoWaitTimesDemo,
  OffSeasonDemo,
  PlannerDayFigure,
  RopeDropDemo,
  TwoRidesDemo,
  TypicalWaitsDemo,
} from '../_demos';
import {
  AnatomyAttractionDemo,
  AnatomyBestDaysDemo,
  AnatomyBlogDemo,
  AnatomyCalendarDemo,
  AnatomyHeaderDemo,
  AnatomyHolidayDemo,
  AnatomyNearbyDemo,
  AnatomyPurchasesDemo,
  AnatomySeasonDemo,
  AnatomyShowsDemo,
  AnatomyStatsDemo,
} from '../_anatomy-demos';
import { WeatherWarningBannerDemo } from '@/components/parks/weather-warning-banner-demo';
import { NowcastBannerDemo } from '@/components/parks/nowcast-banner-demo';
import { WeatherCardShowcase } from '@/components/parks/weather-card-demo';
import { WaitScaleBar, WaitScaleStage, type WaitScaleStep } from '../_wait-scale';
import { NightShift, type NightShiftJob } from '../_night-shift';
import { Ambience, ClosingBand, IntroWithAside, ParkAnatomy, type AnatomyStep } from '../_chrome';
import { ChapterRail } from '../_chapter-rail';
import {
  TARON_BASELINE,
  TARON_RECORD,
  TARON_WAIT_NOW,
  TARON_WEEKDAY_DAYS,
  TARON_WEEKEND_DAYS,
  WAIT_SCALE_MAX,
} from '../_fixtures';

/** See `HOWTO_CHAPTERS`: the ids there must match the `<SectionShell>` calls below. */
const CHAPTERS = HOWTO_CHAPTERS.nl;

const PARK = '/parks/europe/germany/bruehl/phantasialand';
const TARON = `${PARK}/taron`;

const SCALE_LABELS = {
  typical: 'Normaal',
  busy: 'Druk',
  unit: 'min',
  days: 'meetdagen',
  record: 'Record',
  summary:
    'Taron op {label}: normaal {typical} minuten, op drukke dagen {busy}, gemeten over {days} dagen. Bij de ingang staat {wait} minuten.',
};

const SCALE_LEGEND = [
  {
    term: 'Normaal',
    def: 'Op de helft van de gemeten dagen was de langste rij korter.',
    swatch: 'bg-primary/45',
  },
  {
    term: 'Druk',
    def: 'De drukste van elke tien dagen.',
    swatch: 'bg-primary/25',
  },
  {
    term: '70 min',
    def: 'Wat er bij de ingang staat.',
    swatch: 'bg-amber-500',
  },
  {
    term: 'Record',
    def: `${TARON_RECORD} minuten op 16 juli 2026, de drukste gemeten dag.`,
    swatch: 'bg-foreground/40',
  },
];

/**
 * The three readings, in the order the figure steps through them.
 * Figures from `TARON_TYPICAL_WAITS`, i.e. from the API and not from the story.
 */
const SCALE_STEPS: WaitScaleStep[] = [
  { id: 'monday', label: 'Maandag', typical: 55, busy: 70, sampleDays: 21 },
  { id: 'saturday', label: 'Zaterdag', typical: 70, busy: 85, sampleDays: 20 },
  { id: 'weekday', label: 'Doordeweeks', typical: 60, busy: 75, sampleDays: 107 },
];

/**
 * The sections of a park page in exactly the order they render
 * (`app/[locale]/parks/.../page.tsx`). Whoever reorders them there reorders
 * them here, or the guide describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Kop',
    body: 'Naam, plaats en afstand, plus status, openingstijden van vandaag, de drukte en hoeveel attracties er nu open zijn.',
    example: 'Phantasialand, Brühl. Vandaag 09:00–19:00, 36 van de 40 attracties open.',
    demo: <AnatomyHeaderDemo />,
  },
  {
    title: 'Vakanties in het verzorgingsgebied',
    body: 'Welke schoolvakanties en feestdagen vandaag op het park inwerken, die van de eigen regio eerst.',
    demo: <AnatomyHolidayDemo />,
    onlyWhen: 'er vandaag vakantie of een feestdag meespeelt.',
  },
  {
    title: 'Weerwaarschuwing',
    body: 'Officiële waarschuwingen van DWD en MeteoAlarm, woord voor woord.',
    demo: <WeatherWarningBannerDemo />,
    onlyWhen: 'er voor de locatie een waarschuwing geldt.',
  },
  {
    title: 'Buienradar',
    body: 'De komende uren per kwartier. Zo zie je of een bui over twintig minuten voorbij is.',
    demo: <NowcastBannerDemo single />,
    onlyWhen: 'er regen in de buurt is.',
  },
  {
    title: 'Weerkaart',
    body: 'Het weer van nu, het verloop van de dag en de verwachting. De uren waarin het park open is, krijgen op de as de meeste ruimte.',
    demo: <WeatherCardShowcase variant="single" />,
  },
  {
    title: 'Skip-the-line-prijzen',
    body: 'Dagprijzen voor betaalde wachtrijen zoals Lightning Lane, uitverkochte als zodanig gemarkeerd.',
    demo: <AnatomyPurchasesDemo />,
    onlyWhen: 'het park ze publiceert, tot nu toe alleen de Disney-parken in de VS.',
  },
  {
    title: 'Attracties',
    body: 'Alle attracties als kaarten zoals in hoofdstuk 01, doorzoekbaar en gegroepeerd per gebied. Daarboven staan de attracties waarvoor vroeg komen loont.',
    example: 'In Phantasialand staat Taron daar bovenaan, met 60 bespaarde minuten.',
    demo: <AnatomyAttractionDemo />,
  },
  {
    title: 'Kalender en kaart',
    body: 'De dagvoorspellingen uit hoofdstuk 04 in een maandraster, en een kaart met alle attracties.',
    demo: <AnatomyCalendarDemo />,
  },
  {
    title: 'Shows en restaurants',
    body: 'Showtijden voor de hele dag, restaurants met openingstijden.',
    example: 'In Phantasialand vier shows en 46 restaurants.',
    demo: <AnatomyShowsDemo />,
    onlyWhen: 'het park ze doorgeeft.',
  },
  {
    title: 'Beste dagen',
    body: 'De rustigste data van de komende drie maanden en de rustigste weekdag van het park.',
    demo: <AnatomyBestDaysDemo locale="nl" />,
    onlyWhen: 'het park een openingskalender publiceert.',
  },
  {
    title: 'Parken in de buurt',
    body: 'Wat er verder binnen bereik ligt, met afstand en status.',
    example: 'Vanaf Phantasialand: Toverland en Movie Park Germany, allebei ruim 90 kilometer.',
    demo: <AnatomyNearbyDemo />,
    onlyWhen: 'er een ander park binnen bereik ligt.',
  },
  {
    title: 'Blog',
    body: 'Berichten waarin dit park voorkomt.',
    demo: <AnatomyBlogDemo locale="nl" />,
    onlyWhen: 'er berichten over zijn.',
  },
  {
    title: 'Statistiek',
    body: 'De langste rijen van het park met hun normale en drukke waarde, plus de verdeling over maanden en weekdagen.',
    demo: (
      <AnatomyStatsDemo
        title="Attracties met de langste wachttijden"
        labelAttraction="Attracties"
        labelMinutes="min"
        labelNow="Nu"
        labelP50="Normaal"
        labelP90="Piek"
      />
    ),
  },
  {
    title: 'Seizoen, info, vragen',
    body: 'Seizoenstijden en evenementen, adres en tijdzone, veelgestelde vragen over dit park.',
    example: 'De schaatsbaan uit hoofdstuk 08 staat hier met november tot januari.',
    demo: <AnatomySeasonDemo label="Schaatsbaan" />,
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    hour: 2,
    minute: 0,
    at: 0.04,
    title: 'Wat een uur normaal is',
    body: 'De normale en de drukke waarde voor elke attractie en elk uur.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.22,
    title: 'Het normale niveau van elk park',
    body: 'De waarde waaraan de drukte wordt gemeten.',
  },
  {
    hour: 4,
    minute: 30,
    at: 0.42,
    title: 'Gisteren samenvatten',
    body: 'De hele vorige dag in kwartieren.',
  },
  {
    hour: 5,
    minute: 15,
    at: 0.56,
    title: 'Loont vroeg opstaan?',
    body: 'Per attractie hoeveel een vroege start bespaart en hoe lang de voorsprong standhoudt.',
  },
  {
    hour: 5,
    minute: 30,
    at: 0.67,
    title: 'Normaal per weekdag',
    body: 'De tabel uit hoofdstuk 02 voor elke attractie, plus het record.',
  },
  {
    hour: 6,
    minute: 0,
    at: 0.8,
    title: 'Het voorspelmodel leert bij',
    body: 'Het traint met de wachttijden van gisteren.',
  },
];

const FAQ = [
  {
    question: 'Wat betekenen “normaal” en “druk” bij een wachttijd?',
    answer:
      'Normaal is de mediaan van de dagpieken: op de helft van de gemeten dagen was de langste rij korter. Druk is het 90e percentiel van dezelfde reeks, ongeveer de drukste van elke tien dagen. Het record staat er los naast, zodat één uitschieter beide waarden niet verschuift.',
  },
  {
    question: 'Is 70 minuten wachten veel?',
    answer:
      'Dat hangt af van de attractie en van de weekdag. Bij Taron in Phantasialand ligt de piek op maandag normaal op 55 minuten, dus 70 is daar veel. Op zaterdag is 70 minuten de mediaan, en dan is het een heel gewone dag. Beide vergelijkingswaarden staan op park.fan op de pagina van de attractie.',
  },
  {
    question: 'Waar komen de wachttijden vandaan?',
    answer:
      'Uit drie openbare bronnen: ThemeParks.wiki, Wartezeiten.app en Queue-Times.com. We vragen elk park elke vijf minuten op, en melden de bronnen verschillende cijfers, dan geldt de meerderheid.',
  },
  {
    question: 'Waarom staat er bij sommige parken “geen voorspelling”?',
    answer:
      'Voor een drukteniveau vergelijken we het park met zijn eigen verleden, en daarvoor zijn ongeveer 30 openingsdagen nodig. Bij nieuwe of zelden geopende parken staat er daarom niets in plaats van een gegokte kleur.',
  },
  {
    question: 'Waarom toont Hansa-Park geen wachttijden?',
    answer:
      'Het park toont zijn wachttijden alleen in de eigen app en alleen op de wifi van het park, en een openbare interface is er niet. Op park.fan staat daarom een melding in plaats van 82 attracties die leeg lijken.',
  },
  {
    question: 'Wat is rope drop?',
    answer:
      'Bij de opening van het park meteen bij een bepaalde attractie staan, voordat de paden vollopen. park.fan raadt dat aan als de attractie op haar piek minstens 60 minuten haalt en de vroege start daarvan minstens 45 bespaart, en zet erbij hoe lang de voorsprong ongeveer standhoudt.',
  },
  {
    question: 'Kost park.fan iets, en heb ik een account nodig?',
    answer:
      'Nee en nee. Alles op park.fan is gratis en zonder registratie te gebruiken. Favorieten en dagplannen staan in je browser.',
  },
  {
    question: 'Hoe vaak worden de cijfers bijgewerkt?',
    answer:
      'Een geopende parkpagina haalt elke vijf minuten nieuwe waarden op. Normale wachttijden en rope-dropadviezen berekenen we één keer per nacht opnieuw, omdat ze van de ene op de andere dag nauwelijks veranderen.',
  },
];

export function ContentNL() {
  const glossary = `/${GLOSSARY_SEGMENTS.nl}`;
  const bestTime = `/${BEST_TIME_SEGMENTS.nl}`;
  const planner = `/${PLANNER_SEGMENTS.nl}`;

  return (
    <>
      <ChapterRail chapters={CHAPTERS} ariaLabel="Hoofdstukken" />

      {/* ── Intro ───────────────────────────────────────────────────────── */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          park.fan is in een wachtrij ontstaan. Taron, middag, bij de ingang stond iets met drie
          cijfers, en niemand in de rij wist of dat nu pech was of gewoon een dinsdag.
        </Lead>
        <P>
          De actuele wachttijd staat bij de ingang en in de app van het park. park.fan zet ernaast
          hoe een normale dag bij die attractie eruitziet, wanneer de rij korter wordt en op welke
          dag een bezoek überhaupt loont.
        </P>
        <P>
          De kaarten, badges en tabellen verderop zijn de onderdelen van park.fan zelf, gevuld met
          vaste voorbeeldcijfers uit Phantasialand. In het park heb je dezelfde kaarten op je
          telefoon, dan met de cijfers van vandaag.
        </P>

        <Reveal>
          <nav
            aria-label="Hoofdstukken"
            className="bg-muted/40 not-prose grid gap-x-6 gap-y-2 rounded-2xl border p-5 text-sm sm:grid-cols-2 lg:grid-cols-3"
          >
            {CHAPTERS.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="text-muted-foreground hover:text-primary group flex items-baseline gap-2 transition-colors"
              >
                <span className="text-primary/40 group-hover:text-primary/70 text-xs font-bold tabular-nums transition-colors">
                  {c.index}
                </span>
                {c.label}
              </a>
            ))}
          </nav>
        </Reveal>
      </div>

      {/* ── 01 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="getal"
        index="01"
        kicker="De kaart"
        title="Vier gegevens naast de wachttijd"
        icon={Gauge}
      >
        <P>
          Bij de ingang van Taron staat 70 minuten. Daaraan zie je niet of je nu moet aansluiten of
          beter na de lunch kunt komen. Op park.fan staan naast hetzelfde getal een drukteniveau,
          een trend, de single-riderrij en de minimumlengte.
        </P>

        <BareNumberVsCard
          unit="minuten"
          signLabel="Wat het park aanschrijft"
          signCaption="Eén getal, zonder vergelijking."
          cardLabel="Wat park.fan ervan maakt"
          cardCaption="Dezelfde 70 minuten met drukte, trend, single-ridertijd, minimumlengte en de aanwijzing wanneer het rustiger wordt."
        />

        <div className="space-y-4 pt-2">
          <P>
            Het drukteniveau zet het getal af tegen wat bij deze attractie normaal is. Taron ligt
            gemiddeld op {TARON_BASELINE} minuten, {TARON_WAIT_NOW} is ruim anderhalf keer zoveel,
            en dat heet “Zeer hoog”. Het pijltje ernaast geeft aan of de rij groeit of korter wordt.
          </P>
          <PG>
            Heeft een attractie een single-riderrij, dan staat de wachttijd daarvan ook op de kaart.
            Hetzelfde geldt voor de minimumlengte, zodat je met een kind van 130 centimeter niet pas
            bij de meetlat merkt dat het te klein is.
          </PG>
        </div>

        <DemoFrame
          label="Twee attracties, dezelfde minuut"
          note="Taron en Black Mamba op hetzelfde moment: de ene rij groeit, de andere wordt korter. Op de parkpagina staan alle attracties zo bij elkaar, gegroepeerd per gebied."
          href={PARK}
          hrefLabel="Phantasialand op park.fan →"
        >
          <TwoRidesDemo />
        </DemoFrame>
      </SectionShell>

      {/* ── 02 ──────────────────────────────────────────────────────────── */}
      <Ambience>
        <SectionShell
          id="maatstaf"
          index="02"
          kicker="De maatstaf"
          title="Normaal, druk, record"
          icon={Ruler}
        >
          <IntroWithAside
            value={`${TARON_RECORD} min`}
            label="De langste gemeten rij van Taron"
            note="Op 16 juli 2026, in de zomervakantie. Eén enkele dag, en daarom staat hij er als record naast en telt hij niet mee in de maatstaf."
          >
            <P>
              Of 70 minuten veel is, zie je aan twee vergelijkingswaarden. Normaal is hoe lang de
              langste rij van de dag bij deze attractie meestal is, druk hoe lang hij was op de
              drukste tien procent van de dagen.
            </P>
          </IntroWithAside>

          <div className="pt-2">
            <WaitScaleStage
              steps={SCALE_STEPS}
              wait={TARON_WAIT_NOW}
              max={WAIT_SCALE_MAX}
              record={TARON_RECORD}
              labels={SCALE_LABELS}
              legend={SCALE_LEGEND}
            >
              {SCALE_STEPS.map((step, i) => (
                <div key={step.id} data-wait-step={step.id} className="scroll-mt-28">
                  <div className="text-primary mb-2 text-xs font-semibold tracking-widest uppercase">
                    {step.label}
                  </div>
                  <h3 className="mb-3 text-xl font-bold sm:text-2xl">
                    {i === 0 && 'Voor een maandag zijn 70 minuten veel'}
                    {i === 1 && 'Op zaterdag zijn 70 minuten normaal'}
                    {i === 2 && 'En één keer waren het er 135'}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {i === 0 && (
                      <>
                        Op maandag ligt de dagpiek meestal op {step.typical} minuten, en op negen
                        van de tien maandagen blijft hij op {step.busy} of daaronder. Wie vandaag{' '}
                        {TARON_WAIT_NOW} ziet, heeft een van de drukke maandagen te pakken.
                      </>
                    )}
                    {i === 1 && (
                      <>
                        Op zaterdag is {step.typical} minuten de mediaan. Hetzelfde getal is op die
                        dag heel gewoon, en de attracties ernaast zijn net zo druk.
                      </>
                    )}
                    {i === 2 && (
                      <>
                        Doordeweeks ligt de piek meestal op {step.typical} minuten. De stippellijn
                        helemaal achteraan is het record van {TARON_RECORD} minuten op 16 juli. Zo’n
                        dag zou een gemiddelde scheeftrekken, en daarom gaat “druk” uit van de
                        drukste tien procent van de dagen en niet van het maximum.
                      </>
                    )}
                  </p>

                  {/* Below lg every step carries its own scale: there is no
                    pinned figure there that could change. */}
                  <WaitScaleBar
                    step={step}
                    wait={TARON_WAIT_NOW}
                    max={WAIT_SCALE_MAX}
                    record={TARON_RECORD}
                    labels={SCALE_LABELS}
                    className="bg-card/60 mt-5 rounded-2xl border p-5 lg:hidden"
                  />
                </div>
              ))}
            </WaitScaleStage>
          </div>

          {/* Card left, prose right. The card is a park-page sidebar component and
              looks absurd stretched across a 1500 px column, so it keeps its own
              width and the text takes the rest instead of leaving a hole. */}
          <div className="grid items-start gap-8 pt-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
            <DemoFrame
              label="Op de pagina van een attractie"
              note="Waarden van Taron zoals de API ze op 10 september 2026 teruggaf."
              href={TARON}
              hrefLabel="Actuele waarden voor Taron →"
            >
              <TypicalWaitsDemo />
            </DemoFrame>

            <div className="space-y-4">
              <P>
                Op de pagina van elke attractie staat deze maatstaf weekdag voor weekdag. Het getal
                boven de balk is de drukke waarde, het stevige deel eronder de normale, en onderaan
                staat het record met datum.
              </P>
              <P>
                Zaterdag is de enige dag waarop de {TARON_WAIT_NOW} minuten van Taron precies in het
                midden liggen. De berekening berust op {TARON_WEEKDAY_DAYS} meetdagen doordeweeks en{' '}
                {TARON_WEEKEND_DAYS} in het weekend.
              </P>
            </div>
          </div>

          <DemoFrame
            label="Dezelfde tabel voor het hele park, live"
            note="De actuele stand voor Phantasialand, per attractie de normale en de drukke waarde."
            href={PARK}
            hrefLabel="Phantasialand op park.fan →"
          >
            <LiveTopAttractions locale="nl" />
          </DemoFrame>
        </SectionShell>
      </Ambience>

      {/* ── 03 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="moment"
        index="03"
        kicker="Het tijdstip"
        title="Het beste moment van de dag"
        icon={Sunrise}
      >
        <P>
          “Kom vroeg” helpt alleen als de rij in de loop van de dag groeit, en dat doet hij niet bij
          elke attractie. Zes attracties uit hetzelfde park, uur voor uur:
        </P>

        <DemoFrame
          label="Het uurprofiel, van zojuist"
          note="Live uit het uurprofiel van het park. Vet staat het drukste uur van elke attractie."
          href={PARK}
          hrefLabel="Phantasialand op park.fan →"
        >
          <LiveHourlyProfile locale="nl" />
        </DemoFrame>

        <div className="space-y-4 pt-2">
          <P>
            Bij Taron maakt het tijdstip bijna niet uit. De waarden blijven de hele dag in een
            smalle band, en het verschil zit in de weekdag uit hoofdstuk 02. Chiapas wordt
            daarentegen tot in de middag duidelijk drukker. Daarom berekent park.fan het beste
            moment voor elke attractie apart.
          </P>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <DemoFrame
            label="Het advies dat daaruit ontstaat"
            note="Er wordt alleen geadviseerd als de attractie op haar piek minstens 60 minuten haalt en de vroege start daarvan minstens 45 bespaart."
          >
            <RopeDropDemo />
          </DemoFrame>

          <div className="space-y-4">
            <PG>
              Op de kaart staan de normale wachttijd bij opening, de dagpiek, hoeveel je bespaart en
              tot wanneer de voorsprong standhoudt.
            </PG>
            <P>
              Valt het rustigste moment van een attractie ergens anders, bijvoorbeeld ’s avonds, dan
              staat dat ook op de kaart. Op de parkpagina staan de attracties waarvoor vroeg opstaan
              het meest oplevert, gesorteerd op bespaarde minuten.
            </P>
          </div>
        </div>
      </SectionShell>

      {/* ── 04 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="dag"
        index="04"
        kicker="De datum"
        title="De juiste dag, maanden vooruit"
        icon={CalendarDays}
      >
        <P>
          De datum beslist meer dan het tijdstip. Tussen twee dagen van dezelfde week kan een half
          uur gemiddelde wachttijd zitten, afhankelijk van schoolvakanties, feestdagen, brugdagen en
          het weer.
        </P>

        <DemoFrame
          label="Vier dagen uit de herfstvakantie"
          note="15 oktober valt midden in de vakantie en is toch de rustigste van de vier, omdat het regent. Op de 19e is het park dicht. Op park.fan staat dezelfde kalender maand voor maand."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column, full width, like every other chapter on this page. As two
            prose columns this band put a third text edge under the paragraph above
            it: a run of copy, then a 604 px column ending short of it, then a
            second column starting where that paragraph still had words. */}
        <div className="space-y-4 pt-2">
          <P>
            De vakanties van de buren tellen vaak even zwaar als de eigen, omdat dagjesmensen geen
            grenzen kennen. Phantasialand ligt zo’n 90 kilometer van Nederland, en in de kalender
            staan naast de vakanties in Noordrijn-Westfalen ook die van de provincie Gelderland.
            Vakantieregio’s binnen ongeveer 200 kilometer krijgen een eigen markering.
          </P>
          <PG>
            De kleur van een dag is een voorspelling. Hoe goed onze voorspellingen uitkomen, rekenen
            we op de Fancast-pagina openbaar na.
          </PG>
          <P>
            Bij een park dat het hele jaar open is, reikt de kalender ongeveer elf maanden vooruit.
            Bij een seizoenspark houdt hij op waar het gepubliceerde seizoen eindigt, en een dag
            waarop het park dicht is, staat erin als gesloten.
          </P>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/fancast"
            prefetch={false}
            className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Hoe goed het model raakt
          </Link>
          <Link
            href={bestTime}
            prefetch={false}
            className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
          >
            <CalendarDays className="h-4 w-4" />
            Beste reistijd per park
          </Link>
        </div>
      </SectionShell>

      {/* ── 05 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="dagplan"
        index="05"
        kicker="De planner"
        title="De dag vooraf doorlopen"
        icon={CalendarClock}
      >
        <P>
          In de dagplanner zet je de attracties die je wilt rijden op een tijdlijn. Elk blok is zo
          hoog als de voorspelde wachttijd op dat uur, en tussen twee blokken staat of je genoeg
          tijd hebt om van de ene naar de andere te komen.
        </P>
        <P>
          Hieronder staat een plan voor Phantasialand op zaterdag 12 september 2026, met de
          voorspelling van 4 september. Sleep een blok naar een ander tijdstip, dan veranderen zijn
          hoogte en de overstappen. Je eigen plan blijft daarbij onaangeroerd.
        </P>

        <DemoFrame
          label="Een geplande zaterdag"
          href={planner}
          hrefLabel="Naar de dagplanner →"
          className="mx-auto max-w-[560px]"
        >
          <PlannerDayFigure />
        </DemoFrame>

        <P>
          Wat je verder met de dagplanner kunt, zoals attracties op minimumlengte markeren of de dag
          met één knop sorteren, staat op de <A href={planner}>pagina van de dagplanner</A>.
        </P>
      </SectionShell>

      {/* ── 06 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="parkpagina"
        index="06"
        kicker="De rondgang"
        title="Een parkpagina van boven naar beneden"
        icon={Layers}
      >
        <P>
          Alles uit de eerste hoofdstukken staat op één pagina per park, in de volgorde waarin
          mensen vragen: is het park vandaag open? Gaat het zo regenen? Hoe lang is de rij? En
          wanneer had ik beter kunnen komen?
        </P>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
          <ParkAnatomy onlyWhenLabel="Alleen als:" steps={PARK_SECTIONS} />

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Highlight>
              De helft van deze blokken verschijnt alleen als er iets te tonen is. Een park zonder
              shows krijgt geen leeg showtabblad.
            </Highlight>
            <PG>
              Het gekozen tabblad staat in het adres. Wie de link naar de kalender doorstuurt,
              verstuurt de kalender en niet de attractielijst.
            </PG>
            <div className="pt-1">
              <Link
                href={PARK}
                prefetch={false}
                className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Activity className="h-4 w-4" />
                Phantasialand bekijken
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* ── 07 ──────────────────────────────────────────────────────────── */}
      <Ambience tone="emerald">
        <SectionShell
          id="nachtdienst"
          index="07"
          kicker="De onderbouw"
          title="Waar de cijfers vandaan komen"
          icon={Database}
        >
          <P>
            Elke vijf minuten vragen we elk van de 212 parken op, bij drie openbare bronnen
            tegelijk. Melden die verschillende cijfers, dan geldt de meerderheid.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Wachttijden" delay={0}>
              ThemeParks.wiki, Wartezeiten.app en Queue-Times.com, elke vijf minuten.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Vakanties & feestdagen" delay={60}>
              Nager.Date voor feestdagen en brugdagen, OpenHolidays voor schoolvakanties, elke regio
              apart.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Weer" delay={120}>
              Open-Meteo voor verwachting en buienradar, weerwaarschuwingen van DWD en MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Openingstijden" delay={0}>
              Uit de parkkalenders. Waar een park er geen publiceert, schatten we de tijden uit de
              activiteit van de attracties en zetten we erbij dat het een schatting is.
            </IngredientCard>
            <IngredientCard icon={Layers} title="Historie" delay={60}>
              Elke gemeten wachttijd blijft bewaard, ook die van een rustige dinsdagochtend.
            </IngredientCard>
            <IngredientCard icon={BarChart3} title="Voorspelmodellen" delay={120}>
              Eén voor vandaag, één voor de komende weken, één voor de rest van het jaar. Elk wordt
              aan de werkelijke wachttijden nagerekend.
            </IngredientCard>
          </IngredientGrid>

          <div className="space-y-4 pt-4">
            <P>
              Hoe lang de rij bij Taron op een normale dinsdag is, rekenen we ’s nachts uit, terwijl
              de parken dicht zijn. Als je ’s ochtends de pagina opent, is het klaar.
            </P>
          </div>

          <NightShift
            locale="nl"
            jobs={NIGHT_JOBS}
            caption="Tijden in UTC. Elke stap bouwt voort op de vorige."
          />
        </SectionShell>
      </Ambience>

      {/* ── 08 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="gaten"
        index="08"
        kicker="De grenzen"
        title="Als we het niet weten"
        icon={HelpCircle}
      >
        <P>In drie gevallen laten we een veld liever leeg dan dat we een getal gokken.</P>

        <div className="grid gap-6 lg:grid-cols-3">
          <DemoFrame
            label="Park zonder leesbare bron"
            note="Hansa-Park toont zijn wachttijden alleen in de eigen app op de wifi van het park. Zonder deze melding zouden er op park.fan 82 attracties staan die leeg lijken."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="Attractie buiten haar seizoen"
            note="Over een ijsbaan in augustus meldt niemand iets. Ze staat daarom als buiten het seizoen op de pagina en telt die dag niet mee bij de attracties die open zijn."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Geen beoordelingsbasis"
            note="Onder ongeveer 30 openingsdagen ontbreekt de vergelijkingswaarde. Een nieuw park krijgt daarom “Geen voorspelling” in plaats van een kleur."
          >
            <BadgeRowDemo
              crowdLabel="Drukte: hoe vol is het nu"
              comparisonLabel="Vergelijking: voller dan normaal?"
              caption="Taron staat bij 70 minuten op “Zeer hoog”, en vergeleken met zijn normale 45 minuten op “Veel hoger”. Bij een klein park waar 25 minuten normaal is, kan “Zeer hoog” naast “Normaal” staan."
            />
          </DemoFrame>
        </div>
      </SectionShell>

      {/* ── 09 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="wegwijzer"
        index="09"
        kicker="Wegwijzer"
        title="Waar je wat vindt"
        icon={Search}
      >
        <TouchpointGrid
          items={[
            {
              icon: Search,
              title: 'Zoeken',
              body: (
                <>
                  Ctrl + K of ⌘ + K op elke pagina. Vindt parken, attracties, shows en restaurants,
                  ook met typfouten.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Locatie',
              body: (
                <>
                  Deel je je locatie, dan staan op de startpagina de parken bij jou in de buurt en
                  in het park de dichtstbijzijnde attracties met afstand en wachttijd.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Favorieten',
              body: (
                <>
                  De ster op elke park- en attractiekaart. Favorieten staan met hun actuele
                  wachttijd op de startpagina en worden in je browser bewaard, zonder account.
                </>
              ),
            },
            {
              icon: Ruler,
              title: 'Lichaamslengte',
              body: (
                <>
                  In het tabblad Attracties zet je de schuifregelaar op het kleinste kind, dan
                  blijven alleen de attracties over waar het in mag.
                </>
              ),
            },
            {
              icon: CalendarClock,
              title: 'Dagplanner',
              body: (
                <>
                  Te openen vanaf elke pagina. Het plan staat in je browser, meer daarover in
                  hoofdstuk 05.
                </>
              ),
            },
            {
              icon: BarChart3,
              title: 'Attractiepagina',
              body: (
                <>
                  Verloop, normale wachttijden per weekdag, rope drop, minimumlengte en hoe goed de
                  voorspelling voor deze attractie uitkomt.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog',
              body: (
                <>
                  Langere stukken over parken en attracties, waaronder{' '}
                  <A href="/blog/category/guides">parkgidsen</A> over tickets, volgorde en de reis
                  ernaartoe.
                </>
              ),
            },
            {
              icon: HelpCircle,
              title: 'Woordenboek',
              body: (
                <>
                  <A href={glossary}>Alle vakbegrippen</A> met uitleg en voorbeeldattracties,
                  sommige met een 3D-model.
                </>
              ),
            },
          ]}
        />
      </SectionShell>

      {/* ── 10 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="faq"
        index="10"
        kicker="Nagevraagd"
        title="Veelgestelde vragen"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>

      <ClosingBand
        kicker="En nu?"
        title="Verder lezen"
        body="park.fan is gratis, zonder account en zonder reclame. Op de parkpagina staat alles met de cijfers van vandaag, op Fancast hoe goed de voorspellingen van de laatste 30 dagen uitkwamen, en met de beste reistijd vergelijk je meerdere parken."
      >
        <Link
          href={PARK}
          prefetch={false}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
        >
          <Activity className="h-4 w-4" />
          Voorbeeldparkpagina bekijken
        </Link>
        <Link
          href={bestTime}
          prefetch={false}
          className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <CalendarDays className="h-4 w-4" />
          Beste reistijd
        </Link>
        <Link
          href="/fancast"
          prefetch={false}
          className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Trefzekerheid van de voorspellingen
        </Link>
      </ClosingBand>
    </>
  );
}
