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
  LandingNextSteps,
} from '@/components/marketing/editorial-ui';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { HOWTO_CHAPTERS } from '@/lib/howto/chapters';
import {
  Activity,
  BarChart3,
  Bell,
  CalendarClock,
  CalendarDays,
  CloudSun,
  Database,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  MessageCircle,
  Ruler,
  Scale,
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
  ParkyShot,
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
  AnatomyHolidayDemo,
  AnatomyNearbyDemo,
  AnatomyPurchasesDemo,
  AnatomyShowsDemo,
  AnatomyStatsDemo,
} from '../_anatomy-demos';
import { WeatherWarningBannerDemo } from '@/components/parks/weather-warning-banner-demo';
import { NowcastBannerDemo } from '@/components/parks/nowcast-banner-demo';
import { WeatherCardShowcase } from '@/components/parks/weather-card-demo';
import { WaitScaleBar, WaitScaleStage, type WaitScaleStep } from '../_wait-scale';
import { NightShift, type NightShiftJob } from '../_night-shift';
import { Ambience, IntroWithAside, ParkAnatomy, type AnatomyStep } from '../_chrome';
import { ChapterList, ChapterRail } from '../_chapter-rail';
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
    'Taron, {label}: normaal {typical} minuten, op drukke dagen {busy}, gemeten over {days} dagen. Bij de ingang staat {wait} minuten.',
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
 * The sections of a park page in the order they render (`app/[locale]/parks/.../page.tsx`,
 * `ParkPageShell`, `LiveParkData`). Whoever reorders them there reorders them here, or the guide
 * describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Titelkaart',
    body: 'Naam en plaats, hoe ver je ervandaan bent, de ster voor je favorieten, een korte tekst over het park, zijn links en de knop naar de dagplanner. Waar genoeg gemeten is, staat eronder welke weekdagen meestal rustig zijn en welke druk.',
  },
  {
    title: 'Skip-the-line-prijzen',
    body: 'Dagprijzen voor betaalde wachtrijen zoals Lightning Lane, uitverkochte als zodanig gemarkeerd.',
    example:
      'In Magic Kingdom op 4 november 2026: de Multi Pass voor 37 dollar, de losse boeking voor Seven Dwarfs Mine Train uitverkocht.',
    demo: <AnatomyPurchasesDemo />,
    onlyWhen: 'het park ze publiceert, tot nu toe alleen de Disney-parken in de VS.',
  },
  {
    title: 'Als je in het park bent',
    body: 'Een kompas laat zien in welke richting de grote attracties liggen. Daaronder staan de attracties waar de rij nu korter is dan straks, en de dichtstbijzijnde met afstand en wachttijd.',
    onlyWhen: 'je in het park staat en je locatie hebt gedeeld.',
  },
  {
    title: 'Vandaag in het park',
    body: 'Status en openingstijden, hoeveel attracties open zijn, de drukte nu, de voorspelling voor vandaag, de bezetting, de wachttijden van de grote attracties en de volgende shows. Geldt er een officiële weerwaarschuwing van DWD of MeteoAlarm, dan staat die helemaal bovenaan, woord voor woord. In de titelregel staan de temperatuur en een waarschuwing als er regen of onweer aankomt; tik erop en je ziet de komende uren per kwartier. Helemaal onderaan staan de vakanties die vandaag op het park inwerken, die van de eigen regio eerst.',
    example:
      'Op 24 augustus 2026 was Phantasialand open van 9 tot 19 uur, en naast Noordrijn-Westfalen had ook Gelderland zomervakantie.',
    demo: (
      <div className="space-y-3">
        <WeatherWarningBannerDemo />
        <NowcastBannerDemo single />
        <AnatomyHolidayDemo />
      </div>
    ),
  },
  {
    title: 'De tegels',
    body: 'Onder “Vandaag in het park” ligt een rij tegels, de meeste met een getal van vandaag, zoals hoeveel attracties open zijn of wanneer de volgende show begint. Attracties, Weer, Kaart, Shows en Restaurants openen hun tabblad op dezelfde pagina; de Wachttijden-kalender en de Statistiek zijn eigen pagina’s.',
  },
  {
    title: 'Attracties',
    body: 'Het tabblad dat bij het openen gekozen is: alle attracties als kaarten zoals in hoofdstuk 01, gegroepeerd per gebied of gesorteerd op wachttijd, doorzoekbaar en te filteren, bijvoorbeeld op lichaamslengte of op attracties die open zijn. Daarboven staan de attracties waarvoor vroeg komen loont. Heeft een attractie een seizoen, dan staat dat op haar kaart. Daaronder volgen, waar ze er zijn, de attracties die voorgoed dicht zijn en de link naar de pagina “Met kinderen”.',
    example: 'In Phantasialand staat Taron daar bovenaan.',
    demo: <AnatomyAttractionDemo />,
  },
  {
    title: 'Wachttijden-kalender',
    body: 'Een eigen pagina per maand: de dagen uit hoofdstuk 04 in een maandraster, per dag een venster met de details, en twee dagen naast elkaar. Bovenaan staan de rustigste data van de komende drie maanden en de rustigste weekdag.',
    demo: (
      <div className="space-y-3">
        <AnatomyBestDaysDemo locale="nl" />
        <AnatomyCalendarDemo />
      </div>
    ),
  },
  {
    title: 'Weer, kaart, shows, restaurants',
    body: 'Nog vier tabbladen. Het weer van nu, over de dag en als verwachting, waarbij de uren waarin het park open is op de as de meeste ruimte krijgen. Een kaart met alle attracties. Shows met hun tijden voor de hele dag en restaurants met hun status, beide alleen als het park ze doorgeeft.',
    example:
      'Op 4 november 2026 gaf Europa-Park 16 shows en 64 restaurants door. Phantasialand had die dag geen show op het programma, en dus ook geen showtabblad.',
    demo: (
      <div className="space-y-3">
        <WeatherCardShowcase variant="single" />
        <AnatomyShowsDemo />
      </div>
    ),
  },
  {
    title: 'Parken in de buurt',
    body: 'Tot drie andere parken binnen 100 kilometer, met afstand en status.',
    example: 'Vanaf Phantasialand: Toverland en Movie Park Germany, allebei ruim 90 kilometer.',
    demo: <AnatomyNearbyDemo />,
    onlyWhen: 'er minstens twee andere parken binnen die afstand liggen.',
  },
  {
    title: 'Blog',
    body: 'Berichten waarin dit park voorkomt.',
    demo: <AnatomyBlogDemo locale="nl" />,
    onlyWhen: 'er berichten over zijn.',
  },
  {
    title: 'Statistiek',
    body: 'De langste rijen van het park, gemiddeld over de openingsuren, plus de maanden, de weekdagen en de drukste en rustigste gemeten dagen. De tegel “Statistiek” leidt naar een eigen pagina die ook een normale dag uur voor uur laat zien.',
    demo: <AnatomyStatsDemo />,
  },
  {
    title: 'De komende twaalf maanden',
    body: 'De voorspelling dag voor dag, samengevat per maand, met het aantal aanbevolen dagen. Een maand leidt naar de wachttijden-kalender.',
    onlyWhen: 'er voor het park een voorspelling is.',
  },
  {
    title: 'Seizoenen en evenementen',
    body: 'Halloween, Kerstmis en andere evenementen met hun data, of ze bevestigd, aangekondigd of alleen verwacht zijn, en wat een apart ticket kost.',
    onlyWhen: 'we evenementen voor het park hebben uitgezocht.',
  },
  {
    title: 'Info en vragen',
    body: 'Adres, telefoon, openingsjaar en oppervlakte, voor zover we die hebben, en veelgestelde vragen over dit park.',
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    hour: 2,
    minute: 0,
    at: 0.04,
    title: 'Gisteren uur voor uur',
    body: 'Voor elke attractie en elk uur van de vorige dag: wat er meestal stond en wat op de drukste momenten.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.2,
    title: 'Het normale niveau van elk park',
    body: 'De waarde waaraan de drukte in een park wordt gemeten.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.2,
    title: 'Het model voor de komende weken leert bij',
    body: 'Het krijgt de wachttijden van gisteren erbij.',
  },
  {
    hour: 4,
    minute: 0,
    at: 0.34,
    title: 'Het normale niveau van elke attractie',
    body: 'De waarde waaraan het drukteniveau op de kaart uit hoofdstuk 01 meet.',
  },
  {
    hour: 4,
    minute: 30,
    at: 0.46,
    title: 'Gisteren samenvatten',
    body: 'De hele vorige dag in kwartieren.',
  },
  {
    hour: 5,
    minute: 15,
    at: 0.6,
    title: 'Loont vroeg opstaan?',
    body: 'Per attractie hoeveel een vroege start bespaart en hoe lang de voorsprong standhoudt.',
  },
  {
    hour: 5,
    minute: 30,
    at: 0.72,
    title: 'Normaal en druk per weekdag',
    body: 'De waarden uit hoofdstuk 02 voor elke attractie, plus het record.',
  },
  {
    hour: 6,
    minute: 0,
    at: 0.86,
    title: 'Het model voor de rest van het jaar leert bij',
    body: 'Ook dat krijgt de wachttijden van gisteren erbij.',
  },
];

const FAQ = [
  {
    question: 'Wat betekenen “normaal” en “druk” bij een wachttijd?',
    answer:
      'Normaal is de mediaan van de dagpieken: op de helft van de gemeten dagen was de langste rij korter. Druk is het 90e percentiel van dezelfde reeks, ongeveer de drukste van elke tien dagen. Het record staat ernaast. Omdat beide waarden percentielen zijn, verschuift één uitschieter ze nauwelijks.',
  },
  {
    question: 'Is 70 minuten wachten veel?',
    answer:
      'Dat hangt af van de attractie en van de weekdag. Bij Taron in Phantasialand ligt de piek op maandag normaal op 55 minuten, dus 70 is daar veel. Op zaterdag is 70 minuten de mediaan, en dan is het een heel gewone dag. Beide vergelijkingswaarden staan op park.fan op de pagina van de attractie.',
  },
  {
    question: 'Waar komen de wachttijden vandaan?',
    answer:
      'Uit maximaal drie openbare bronnen. ThemeParks.wiki is de basisbron; Queue-Times.com en Wartezeiten.app vullen attracties aan die daar ontbreken en corrigeren een verouderd “gesloten”. Nieuwe waarden halen we elke vijf minuten op.',
  },
  {
    question: 'Waarom staat er bij sommige parken “Geen voorspelling”?',
    answer:
      'Voor een drukteniveau vergelijken we het park met zijn eigen verleden, en daarvoor zijn ongeveer 30 openingsdagen nodig. Bij nieuwe of zelden geopende parken staat er daarom niets in plaats van een gegokte kleur.',
  },
  {
    question: 'Waarom toont Hansa-Park geen wachttijden?',
    answer:
      'Het park toont zijn wachttijden alleen in de eigen app en alleen op de wifi van het park, en een openbare interface is er niet. Op park.fan staat daarom boven de lijst met attracties een melding die uitlegt waarom er geen tijden bij staan.',
  },
  {
    question: 'Wat is rope drop?',
    answer:
      'Bij de opening van het park meteen bij een bepaalde attractie staan, voordat de paden vollopen. park.fan raadt dat aan als de attractie op haar piek minstens 60 minuten haalt en de vroege start daarvan minstens 45 bespaart, en zet erbij hoe lang de voorsprong ongeveer standhoudt.',
  },
  {
    question: 'Kost park.fan iets, en heb ik een account nodig?',
    answer:
      'Nee en nee. Alles op park.fan is gratis en zonder registratie te gebruiken. Favorieten en dagplannen staan in je browser. Alleen als je een plan deelt of er meldingen over wilt krijgen, bewaren wij het ook bij ons.',
  },
  {
    question: 'Hoe vaak worden de cijfers bijgewerkt?',
    answer:
      'Een geopende parkpagina haalt elke vijf minuten nieuwe waarden op. De waarden per weekdag en de rope-dropadviezen berekenen we één keer per nacht opnieuw, omdat ze van de ene op de andere dag nauwelijks veranderen.',
  },
];

/** The guide page's article, Dutch. */
export function ContentNL() {
  const glossary = `/${GLOSSARY_SEGMENTS.nl}`;
  const bestTime = `/${BEST_TIME_SEGMENTS.nl}`;
  const planner = `/${PLANNER_SEGMENTS.nl}`;

  return (
    <>
      <ChapterRail chapters={CHAPTERS} ariaLabel="Hoofdstukken" />

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
          De kaarten, badges en tabellen verderop zijn de onderdelen van park.fan zelf. De meeste
          tonen vaste voorbeeldcijfers zoals de API ze in de zomer en herfst van 2026 teruggaf,
          bijna allemaal uit Phantasialand; twee tabellen zijn live. In het park heb je dezelfde
          kaarten op je telefoon, dan met de cijfers van vandaag.
        </P>

        <Reveal>
          <ChapterList chapters={CHAPTERS} ariaLabel="Hoofdstukken" />
        </Reveal>
      </div>

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
            Het drukteniveau zet het getal af tegen het normale niveau van deze attractie, de
            mediaan van haar gemeten wachttijden. Bij Taron lag dat in september op {TARON_BASELINE}{' '}
            minuten, {TARON_WAIT_NOW} is ruim anderhalf keer zoveel, en dat heet “Zeer hoog”. Het
            pijltje ernaast geeft aan of de rij groeit of korter wordt.
          </P>
          <PG>
            Heeft een attractie een single-riderrij, dan staat de wachttijd daarvan ook op de kaart.
            Hetzelfde geldt voor de minimumlengte, zodat je met een kind van 120 centimeter niet pas
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
            note="Op 16 juli 2026. In Noordrijn-Westfalen gingen de scholen nog, in de buurregio’s was het al zomervakantie. Eén enkele dag: hij staat er als record naast en verschuift de maatstaf nauwelijks."
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
                        Op zaterdag is {step.typical} minuten de mediaan: op de helft van de
                        zaterdagen bleef de langste rij daaronder. Hetzelfde getal is op die dag
                        heel gewoon.
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

          {/* Card left, prose right: the card is a park-page sidebar component, so it keeps
              its own width and the text takes the rest. */}
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
            label="Het hele park, live"
            note="De langste rijen in Phantasialand, zoals ze nu op de parkpagina staan. Deze tabel is anders berekend dan de pagina van een attractie: ze middelt over alle openingsuren van de laatste twee jaar. “Typisch” is wat er binnen een uur meestal staat, “Piek” wat er in de drukke minuten van dat uur staat. Daarom liggen haar getallen onder de dagpieken uit de maatstaf hierboven."
            href={PARK}
            hrefLabel="Phantasialand op park.fan →"
          >
            <LiveTopAttractions locale="nl" />
          </DemoFrame>
        </SectionShell>
      </Ambience>

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
          label="Een week herfstvakantie"
          note="Vier gemeten dagen in Phantasialand, allemaal in de herfstvakantie van Noordrijn-Westfalen in 2026: op dinsdag 20 oktober gemiddeld 45 minuten bij de grote attracties, op de zondag daarna 20. Dezelfde vakantie, vier verschillende niveaus. Op park.fan staat dezelfde kalender maand voor maand."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column, full width, like every other chapter on this page: two prose
            columns would put a third text edge under the paragraph above. */}
        <div className="space-y-4 pt-2">
          <P>
            De vakanties van de buren tellen vaak even zwaar als de eigen, omdat dagjesmensen geen
            grenzen kennen. Phantasialand ligt zo’n 60 kilometer van Nederland, en in de kalender
            staan naast de vakanties in Noordrijn-Westfalen ook die van de provincies Limburg en
            Gelderland. De vakanties van de buurregio’s die we voor een park hebben vastgelegd,
            krijgen een eigen markering.
          </P>
          <PG>
            De kleur van een komende dag is een voorspelling, die van een voorbije dag is gemeten.
            Hoe goed onze voorspellingen uitkomen, rekenen we op de Fancast-pagina openbaar na.
          </PG>
          <P>
            Publiceert een park zijn openingstijden, dan reikt de kalender zo ver als die, hooguit
            een jaar, en een dag waarop het park dicht is, staat erin als gesloten. Voor het
            overzicht vat de parkpagina de voorspelling maand voor maand samen onder “De komende
            twaalf maanden”.
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
              shows krijgt geen showtegel en geen leeg showtabblad.
            </Highlight>
            <PG>
              Het gekozen tabblad staat in het adres. Wie de link naar de kaart doorstuurt,
              verstuurt de kaart en niet de attractielijst. De kalender en de statistiek zijn eigen
              pagina’s met een eigen adres.
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

      <Ambience tone="emerald">
        <SectionShell
          id="nachtdienst"
          index="07"
          kicker="De onderbouw"
          title="Waar de cijfers vandaan komen"
          icon={Database}
        >
          <P>
            Elke vijf minuten halen we voor elk van de ruim 200 parken nieuwe wachttijden op, uit
            maximaal drie openbare bronnen. ThemeParks.wiki is de basisbron. Queue-Times.com en
            Wartezeiten.app vullen attracties aan die daar ontbreken en corrigeren een verouderd
            “gesloten”. Voor een paar parken is een van die twee de enige bron.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Wachttijden" delay={0}>
              ThemeParks.wiki als basis, Queue-Times.com en Wartezeiten.app voor wat daar ontbreekt.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Vakanties & feestdagen" delay={60}>
              Regio voor regio: in Europa van Nager.Date en OpenHolidays, elders uit de kalenders
              van overheden en schooldistricten.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Weer" delay={120}>
              Open-Meteo voor de verwachting en een kortetermijnvoorspelling voor regen per
              kwartier, weerwaarschuwingen van DWD en MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Openingstijden" delay={0}>
              Uit de parkkalenders. Waar een park er geen publiceert, leiden we de tijden voor
              vandaag en de dagen ervoor af uit de activiteit van de attracties en zetten we erbij
              dat het een schatting is.
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
              de parken in Europa dicht zijn. Als je ’s ochtends de pagina opent, is het klaar.
            </P>
          </div>

          <NightShift
            locale="nl"
            jobs={NIGHT_JOBS}
            caption="Tijden in UTC. De volgorde zorgt ervoor dat elke stap de cijfers die hij nodig heeft al aantreft. Het model voor vandaag leert pas om 08:30 bij."
          />
        </SectionShell>
      </Ambience>

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
            note="Hansa-Park toont zijn wachttijden alleen in de eigen app op de wifi van het park. Boven zijn ongeveer 80 attracties staat daarom deze melding, die uitlegt waarom er geen tijden bij staan."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="Attractie buiten haar seizoen"
            note="Over een ijsbaan in augustus meldt niemand iets. Omdat we haar seizoen kennen, november tot januari, staat ze dan als buiten het seizoen op de pagina en telt ze niet mee bij de attracties die open zijn."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Geen beoordelingsbasis"
            note="Onder ongeveer 30 openingsdagen ontbreekt de vergelijkingswaarde. Een nieuw park krijgt daarom “Geen voorspelling” in plaats van een kleur."
          >
            <BadgeRowDemo
              crowdLabel="De niveaus"
              caption={`Elk niveau meet tegen het eigen verleden van de attractie of het park, nooit tegen andere parken. Taron staat bij 70 minuten op “Zeer hoog”, omdat zijn normale niveau in september op ${TARON_BASELINE} lag.`}
            />
          </DemoFrame>
        </div>
      </SectionShell>

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
                  De toets / op elke pagina of het zoekveld bovenaan. Vindt parken, attracties,
                  shows, restaurants en plaatsen, ook met typfouten.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Locatie',
              body: (
                <>
                  Deel je je locatie, dan staan op de startpagina de parken bij jou in de buurt. In
                  het park wijst een kompas waar de grote attracties liggen, met de dichtstbijzijnde
                  attracties, hun afstand en wachttijd.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Favorieten',
              body: (
                <>
                  De ster bij parken, attracties, shows en restaurants. Favorieten staan met hun
                  actuele wachttijd op de startpagina en onder{' '}
                  <A href="/favorites">Mijn favorieten</A>, bewaard in je browser, zonder account.
                </>
              ),
            },
            {
              icon: Bell,
              title: 'Meldingen',
              body: (
                <>
                  Het belletje bij een attractie of show stuurt je een melding als de wachttijd
                  onder je grens zakt, de attractie weer opengaat of de show bijna begint. Je vindt
                  ze allemaal onder <A href="/alerts">Mijn meldingen</A>.
                </>
              ),
            },
            {
              icon: Ruler,
              title: 'Lichaamslengte',
              body: (
                <>
                  In het tabblad Attracties zet je de schuifregelaar op het kleinste kind, dan
                  blijven alleen de attracties over waar het in mag. De pagina “Met kinderen” van
                  een park heeft dezelfde schuifregelaar.
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
                  Verloop, normale en drukke wachttijd per weekdag, rope drop, minimumlengte en hoe
                  goed de voorspelling voor deze attractie uitkomt.
                </>
              ),
            },
            {
              icon: Scale,
              title: 'Parken vergelijken',
              body: (
                <>
                  Onder <A href="/compare">Parken vergelijken</A> staan twee tot vier parken naast
                  elkaar, met hun gemiddelde wachttijd, hun langste rij en hun rustigste weekdag.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog en nieuws',
              body: (
                <>
                  Langere stukken over parken en attracties, waaronder{' '}
                  <A href="/blog/category/guides">parkgidsen</A> over tickets, volgorde en de reis
                  ernaartoe. Onder <A href="/news">Nieuws</A> staan korte berichten uit de parken.
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

      <SectionShell
        id="parky"
        index="10"
        kicker="De assistent"
        title="Vraag het Parky"
        icon={MessageCircle}
      >
        <ParkyShot locale="nl">
          <P>
            Parky is de chatassistent van park.fan en woont in de ronde knop rechtsonder. Op de
            startpagina staat hij op een breed scherm vlak onder de kop en springt hij pas naar zijn
            hoek als je scrolt.
          </P>
          <P>
            Vraag hem hoe lang de rijen nu zijn, wat er voor vandaag of de komende weken voorspeld
            is, op welke dagen de rijen in een park kort zijn, hoe hoog en snel een achtbaan is of
            wat er in onze artikelen staat. Voor elk antwoord kijkt hij in dezelfde gegevens die op
            de pagina’s staan.
          </P>
          <P>
            Parken en attracties laat hij zien als kaarten met hun cijfers. Als je het hem vraagt,
            brengt hij je naar de juiste pagina en zet hij in de dagplanner een dag klaar, voegt hij
            attracties toe of sorteert hij ze. Je locatie ziet hij alleen als je in de chat op
            “Locatie delen” tikt, en hij bewaart haar niet.
          </P>
          <P>
            De antwoorden schrijft een taalmodel, en dat vergist zich soms. De getallen op de
            kaarten in de chat komen rechtstreeks van park.fan; wat Parky erbij schrijft, check je
            bij twijfel op de pagina van de attractie. Hij blijft bij parken en attracties, zoekt
            niet op internet, en na drie vragen in 30 seconden heeft hij even pauze nodig.
          </P>
          <P>
            Je vragen bewaren we zonder IP-adres en we verwijderen ze na 7 dagen. Meer over Parky,
            met voorbeeldvragen, staat op <A href="/parky">zijn eigen pagina</A>.
          </P>
        </ParkyShot>
      </SectionShell>

      <SectionShell
        id="faq"
        index="11"
        kicker="Nagevraagd"
        title="Veelgestelde vragen"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>

      <LandingNextSteps
        kicker="En nu?"
        title="Verder lezen"
        body="park.fan is gratis, zonder account en zonder reclame. Op de parkpagina staat alles met de cijfers van vandaag, op Fancast hoe goed de voorspellingen van de laatste zeven dagen uitkwamen, en met de beste reistijd vergelijk je meerdere parken."
        destinations={[
          { href: PARK, label: 'Voorbeeldparkpagina bekijken', icon: Activity, prefetch: false },
          { href: bestTime, label: 'Beste reistijd', icon: CalendarDays, prefetch: false },
          {
            href: '/fancast',
            label: 'Trefzekerheid van de voorspellingen',
            icon: Sparkles,
            prefetch: false,
          },
        ]}
      />
    </>
  );
}
