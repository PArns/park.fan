import React from 'react';
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
import {
  Activity,
  BarChart3,
  CalendarDays,
  CloudSun,
  Compass,
  Database,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  Moon,
  Ruler,
  Search,
  Sparkles,
  Star,
  Sunrise,
  Users,
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
  RopeDropDemo,
  TwoRidesDemo,
  TypicalWaitsDemo,
} from '../_demos';
import { WaitScaleBar, WaitScaleStage, type WaitScaleStep } from '../_wait-scale';
import { NightShift, type NightShiftJob } from '../_night-shift';
import { Ambience, ClosingBand, IntroWithAside, ParkAnatomy, type AnatomyStep } from '../_chrome';
import { ChapterRail, type Chapter } from '../_chapter-rail';
import {
  TARON_BASELINE,
  TARON_RECORD,
  TARON_WAIT_NOW,
  TARON_WEEKDAY_DAYS,
  TARON_WEEKEND_DAYS,
  WAIT_SCALE_MAX,
} from '../_fixtures';

/**
 * Feeds both the chapter list at the top and the rail down the right edge, and
 * must match the `<SectionShell id=… index=…>` calls below exactly — the rail
 * looks its sections up by id, so an entry that drifts silently stops
 * highlighting.
 */
const CHAPTERS: Chapter[] = [
  { id: 'getal', index: '01', label: 'Eén getal alleen' },
  { id: 'maatstaf', index: '02', label: 'Normaal, druk, record' },
  { id: 'moment', index: '03', label: 'Het beste moment' },
  { id: 'dag', index: '04', label: 'De juiste dag' },
  { id: 'parkpagina', index: '05', label: 'Een parkpagina van boven naar beneden' },
  { id: 'nachtdienst', index: '06', label: 'Waar de cijfers vandaan komen' },
  { id: 'gaten', index: '07', label: 'Wat we niet beweren' },
  { id: 'bezoeken', index: '08', label: 'Vier bezoeken' },
  { id: 'wegwijzer', index: '09', label: 'Waar je wat vindt' },
  { id: 'faq', index: '10', label: 'Veelgestelde vragen' },
];

const PARK = '/parks/europe/germany/bruehl/phantasialand';
const TARON = `${PARK}/taron`;

const SCALE_LABELS = {
  typical: 'Normaal',
  busy: 'Druk',
  unit: 'min',
  days: 'meetdagen',
  record: 'Record',
  summary:
    'Taron op {label}: normaal {typical} minuten, op drukke dagen {busy}, gemeten over {days} dagen. Op het bord staat {wait} minuten.',
};

const SCALE_LEGEND = [
  {
    term: 'Normaal',
    def: 'Mediaan van de dagpieken. Op de helft van de gemeten dagen was de langste rij korter.',
    swatch: 'bg-primary/45',
  },
  {
    term: 'Druk',
    def: '90e percentiel van dezelfde reeks. Die ene dag op tien waarop het uitzonderlijk vol was.',
    swatch: 'bg-primary/25',
  },
  {
    term: '70 min',
    def: 'Wat er bij de ingang staat. Dat blijft staan terwijl de schaal eronder verschuift.',
    swatch: 'bg-amber-500',
  },
  {
    term: 'Record',
    def: `${TARON_RECORD} minuten op 16 juli 2026. De drukste dag in de meetperiode, en precies daarom geen maatstaf.`,
    swatch: 'bg-foreground/40',
  },
];

/**
 * The three readings, in the order the figure steps through them. Numbers come
 * from `TARON_TYPICAL_WAITS`, so from the API rather than from the story.
 */
const SCALE_STEPS: WaitScaleStep[] = [
  { id: 'monday', label: 'Maandag', typical: 55, busy: 65, sampleDays: 19 },
  { id: 'saturday', label: 'Zaterdag', typical: 70, busy: 85, sampleDays: 20 },
  { id: 'weekday', label: 'Doordeweeks', typical: 60, busy: 80, sampleDays: 97 },
];

/**
 * The sections of a park page in exactly the order they render
 * (`app/[locale]/parks/.../page.tsx`). Reorder them here and you reorder them
 * there too, or this guide describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Kop',
    body: 'Naam, plaats, afstand vanaf jou, plus status, openingstijden van vandaag, de drukte van dit moment en de teller “x van y open”. De ene regel die de meeste bezoeken beantwoordt.',
  },
  {
    title: 'Vakanties in het verzorgingsgebied',
    body: 'Welke schoolvakanties vandaag op dit park inwerken, met de bijbehorende regio. Ook die van over de grens.',
    onlyWhen: 'er vandaag daadwerkelijk een vakantieregio meespeelt.',
  },
  {
    title: 'Weerwaarschuwing',
    body: 'Officiële waarschuwingen van DWD en MeteoAlarm, ongewijzigd overgenomen. Geen eigen oordeel over het weer.',
    onlyWhen: 'er een waarschuwing voor de locatie actief is.',
  },
  {
    title: 'Buienradar',
    body: 'De komende uren in stappen van een kwartier. Zegt of de bui over twintig minuten voorbij is of dat het de hele middag blijft.',
    onlyWhen: 'er neerslag in de buurt is.',
  },
  {
    title: 'Weerkaart',
    body: 'Waarde van nu, het verloop van de dag en de verwachting. De urenas is om de openingstijden heen gebouwd: de uren dat het park open is krijgen vier keer zo veel ruimte als de uren ervoor en erna.',
  },
  {
    title: 'Skip-the-line-prijzen',
    body: 'Dagprijzen voor betaalde wachtrijen, inclusief uitverkocht.',
    onlyWhen: 'het park ze in de kalender publiceert. Tot nu toe alleen de Disney-parken in de VS.',
  },
  {
    title: 'Attracties',
    body: 'Het eerste tabblad, met het aantal attracties in de titel. Kaarten zoals in hoofdstuk 01, sorteerbaar en doorzoekbaar, gegroepeerd per gebied. Bovenaan het rope-dropoverzicht van het park, gesorteerd op bespaarde minuten.',
  },
  {
    title: 'Kalender en kaart',
    body: 'Twee vaste tabbladen ernaast: de dagvoorspellingen uit hoofdstuk 04 en een kaart met de attracties als marker.',
  },
  {
    title: 'Shows en restaurants',
    body: 'Showtijden voor de hele dag, horeca met openingstijden.',
    onlyWhen: 'het park ze levert. Anders ontbreekt het tabblad helemaal.',
  },
  {
    title: 'Beste dagen',
    body: 'De rustigste data van de komende drie maanden, plus de rustigste weekdag van het park.',
    onlyWhen: 'het park een openingskalender publiceert.',
  },
  {
    title: 'Parken in de buurt',
    body: 'Wat er verder binnen bereik ligt, met afstand en actuele status.',
    onlyWhen: 'er buren zijn. Bij ongeveer de helft van de 212 parken niet.',
  },
  {
    title: 'Statistiek',
    body: 'De langste rijen van het park met hun normale en drukke waarde, plus de verdeling over maanden en weekdagen. Het blok noemt het aantal vastgelegde dagen, en beide verdelingen voeren dat aantal als eigen kolom.',
  },
  {
    title: 'Seizoen, info, vragen',
    body: 'Seizoenstijden en aangekondigde evenementen, adres en tijdzone, en de veelgestelde vragen over juist dit park.',
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    time: '02:00',
    at: 0.04,
    title: 'Percentielen per uur',
    body: 'Elk gemeten uur van elke attractie krijgt zijn verdeling. Uren met minder dan drie metingen vallen af.',
  },
  {
    time: '03:00',
    at: 0.22,
    title: 'Basiswaarden per park',
    body: 'De mediaan waartegen de live drukte later wordt gerekend. Daarna start de eerste modeltraining.',
  },
  {
    time: '04:30',
    at: 0.42,
    title: 'Kwartierhistorie',
    body: 'Gisteren wordt samengevat. Pas daarna kan alles rekenen wat het dagverloop nodig heeft.',
  },
  {
    time: '05:15',
    at: 0.56,
    title: 'Rope-dropadviezen',
    body: 'Per attractie: loont de vroege start, hoe lang houdt de voorsprong stand, wanneer is het rustigste moment van de dag.',
  },
  {
    time: '05:30',
    at: 0.67,
    title: 'Normale wachttijden',
    body: 'De tabel uit hoofdstuk 02. Per weekdag, plus de recorddag met datum.',
  },
  {
    time: '06:00',
    at: 0.8,
    title: 'Voorspelmodel',
    body: 'Opnieuw getraind met de wachttijden van gisteren. Elke ochtend één keer volledig.',
  },
];

const FAQ = [
  {
    question: 'Wat betekenen “normaal” en “druk” bij een wachttijd?',
    answer:
      'Normaal is de mediaan van de dagpieken: op de helft van alle gemeten dagen was de langste rij korter, op de andere helft langer. Druk is het 90e percentiel van dezelfde reeks, ongeveer die ene dag op tien waarop het uitzonderlijk vol was. Het absolute record staat er los naast, zodat één uitschieter beide waarden niet verschuift.',
  },
  {
    question: 'Is 70 minuten wachten veel?',
    answer:
      'Dat hangt af van de attractie en van de weekdag. Taron in Phantasialand komt op maandag normaal op 55 minuten en blijft op negen van de tien maandagen onder de 65; daar zijn 70 minuten dus een ongewoon drukke dag. Op zaterdag ligt de mediaan van dezelfde attractie op precies 70 minuten, en dan is dezelfde weergave volstrekt gemiddeld. Beide vergelijkingswaarden staan op de pagina van de attractie, zodat je ze niet hoeft te raden.',
  },
  {
    question: 'Waar komen de wachttijden vandaan?',
    answer:
      'Uit drie openbare bronnen tegelijk: ThemeParks.wiki, Wartezeiten.app en Queue-Times.com. Elke vijf minuten wordt elk park opgevraagd. Melden twee bronnen verschillende cijfers, dan beslist de meerderheid, daarna de mediaan, daarna het gemiddelde. Het resultaat wordt op vijf minuten afgerond, omdat de parken zelf in stappen van vijf minuten aanschrijven.',
  },
  {
    question: 'Waarom staat er bij sommige parken “geen voorspelling”?',
    answer:
      'Omdat de basis ontbreekt. Een drukteniveau ontstaat uit de vergelijking met het eigen verleden van het park, en daarvoor zijn ongeveer 30 openingsdagen nodig. Bij nieuwe of zelden geopende parken staat er daarom niets in plaats van een gegokte kleur.',
  },
  {
    question: 'Waarom toont Hansa-Park geen wachttijden?',
    answer:
      'Het park publiceert zijn wachttijden uitsluitend in de eigen app en alleen voor apparaten op de wifi van het park. Er is geen openbare interface waaruit wij ze zouden kunnen lezen. Omdat een park zonder bron er in de data net zo uitziet als een park dat ’s nachts gesloten is, is dit een handmatig onderhouden vermelding en geen afleiding: de melding op de parkpagina zegt het, in plaats van 82 attracties als zogenaamd leeg te tonen.',
  },
  {
    question: 'Wat is rope drop?',
    answer:
      'Bij de opening van het park meteen bij een bepaalde attractie staan, voordat de paden vollopen. park.fan adviseert dat alleen als aan twee voorwaarden is voldaan: de dagpiek van de attractie ligt op minstens 60 minuten en de vroege start bespaart er minstens 45 van. Er staat altijd bij hoe lang de voorsprong ongeveer standhoudt.',
  },
  {
    question: 'Kost park.fan iets, en heb ik een account nodig?',
    answer:
      'Nee en nee. Alle wachttijden, statistieken, kalenders en voorspellingen zijn gratis en zonder registratie te gebruiken. Favorieten staan als cookie in de browser, niet op een server.',
  },
  {
    question: 'Hoe vaak worden de cijfers op de pagina bijgewerkt?',
    answer:
      'Een geopende parkpagina haalt elke vijf minuten nieuwe waarden op, in hetzelfde ritme waarin de bronnen worden bevraagd. De statistische waarden zoals normale wachttijden of rope-dropadviezen worden één keer per nacht opnieuw berekend, omdat ze van de ene op de andere dag toch nauwelijks bewegen.',
  },
];

export function ContentNL() {
  const glossary = `/${GLOSSARY_SEGMENTS.nl}`;
  const bestTime = `/${BEST_TIME_SEGMENTS.nl}`;

  return (
    <>
      <ChapterRail chapters={CHAPTERS} ariaLabel="Hoofdstukken" />

      {/* ── Intro ───────────────────────────────────────────────────────── */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          park.fan is in een wachtrij ontstaan. Taron, middag, op het bord stond iets met drie
          cijfers, en niemand kon zeggen of dat nu pech was of gewoon dinsdag.
        </Lead>
        <P>
          Precies die vraag staat op deze site nog altijd centraal. Een actuele wachttijd tonen is
          het makkelijke deel: de parken schrijven hem zelf aan. Interessant wordt hij pas als
          ernaast staat hoe een normale dag bij deze attractie eruitziet, wanneer de rij doorgaans
          korter wordt en of het vandaag überhaupt een goede dag is.
        </P>
        <P>
          Op deze pagina staat geen screenshot. Elke kaart, elk badge en elke tabel hieronder zijn
          de echte onderdelen van een parkpagina, hier alleen met vaste voorbeeldcijfers gevuld. Wat
          je hier leert lezen, ziet er een uur later in het park precies zo uit.
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
        kicker="Het startpunt"
        title="Eén getal alleen zegt niets"
        icon={Gauge}
      >
        <P>
          Bij de ingang van de attractie hangt een getal, meer niet. Op de parkpagina staat
          hetzelfde getal met vier andere gegevens erbij: een drukteniveau, een trend, de tweede
          wachtrij en de minimumlengte. Voor geen daarvan is een blik op vandaag genoeg.
        </P>

        <BareNumberVsCard
          unit="minuten"
          signLabel="Wat het park aanschrijft"
          signCaption="Eén getal, geen context. Of dat vandaag goed of slecht is, weet alleen wie hier al vaak genoeg is geweest."
          cardLabel="Wat park.fan ervan maakt"
          cardCaption="Dezelfde 70 minuten, plus drukteniveau, trend, single-ridertijd, minimumlengte en de aanwijzing wanneer het naar verwachting rustiger wordt."
        />

        <div className="max-w-3xl space-y-4 pt-2">
          <P>
            “Zeer hoog” is daarbij geen kwestie van smaak. Taron ligt gemiddeld op {TARON_BASELINE}{' '}
            minuten, {TARON_WAIT_NOW} is daarvan ruwweg 156 procent, en de niveaus wisselen bij 60,
            89, 110, 150 en 200 procent. Vanaf 150 heet het “Zeer Hoog”. Het pijltje ernaast komt
            uit de laatste metingen en zegt of de rij groeit of wordt afgebouwd.
          </P>
          <PG>
            De tweede waarde op de kaart is de single-riderrij. Veel attracties hebben meerdere
            wachtrijen naast elkaar, en welke daarvan bestaat, staat zelden op hetzelfde bord.
            Daarbij de minimumlengte, zodat niemand met een kind van 130 centimeter het halve park
            doorloopt.
          </PG>
        </div>

        <DemoFrame
          label="Twee attracties, dezelfde minuut"
          note="Beide kaarten komen uit hetzelfde moment in hetzelfde park, Taron in Klugheim en Black Mamba in Deep in Africa. De ene rij groeit, de andere bouwt af. Op de parkpagina staan alle attracties zo naast elkaar, sorteerbaar op wachttijd."
          href={PARK}
          hrefLabel="Naar de parkpagina →"
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
            note="Op 16 juli 2026, in de zomervakantie. Eén dag van de 365, en daarom rekent de schaal met percentielen in plaats van met het maximum."
          >
            <P>
              Om een getal te plaatsen zijn twee vergelijkingswaarden nodig en de vermelding waarop
              ze berusten. park.fan gebruikt daarvoor de mediaan van de dagpieken en het 90e
              percentiel van dezelfde reeks. In gewone woorden: hoe lang is de langste rij van de
              dag meestal, en hoe lang was hij op de drukste tien procent van de dagen.
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
                    {i === 1 && 'Voor een zaterdag is dat precies het normale geval'}
                    {i === 2 && 'En één keer waren het er 135'}
                  </h3>
                  <p className="text-muted-foreground max-w-xl leading-relaxed">
                    {i === 0 && (
                      <>
                        Op maandag ligt de dagpiek op {step.typical} minuten, en op negen van de
                        tien maandagen blijft hij onder {step.busy}. De aangeschreven{' '}
                        {TARON_WAIT_NOW} liggen daarboven. Wie hier staat, heeft de drukste maandag
                        in weken te pakken, en de attracties ernaast zijn dan meestal het betere
                        idee.
                      </>
                    )}
                    {i === 1 && (
                      <>
                        Op zaterdag is {step.typical} minuten de mediaan. Dezelfde weergave,
                        dezelfde plek, dezelfde attractie: op deze dag is ze simpelweg gemiddeld. Je
                        ergeren helpt niet, uitwijken ook niet, want de attracties ernaast hebben
                        dezelfde zaterdag.
                      </>
                    )}
                    {i === 2 && (
                      <>
                        Over alle {step.sampleDays} gemeten weekdagen ligt de piek op {step.typical}{' '}
                        minuten. De stippellijn verder naar rechts is de dag van {TARON_RECORD}{' '}
                        minuten op 16 juli. Juist door zulke dagen is “druk” een percentiel en geen
                        maximum: één uitschieter zou een gemiddelde verschuiven en alles eronder
                        onbruikbaar maken.
                      </>
                    )}
                  </p>

                  {/* Below lg every step carries its own scale: there is no
                    running figure there for anything to change on. */}
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
              note="Echte waarden van Taron, opgehaald op 24 augustus 2026."
              href={TARON}
              hrefLabel="Echte waarden voor Taron →"
            >
              <TypicalWaitsDemo />
            </DemoFrame>

            <div className="space-y-4">
              <P>
                Dezelfde verdeling als balken, weekdag voor weekdag. Het getal boven elke balk is de
                drukmarkering van die dag, het stevige deel eronder de normale waarde, rechtsonder
                het record met datum. Een weekdag zonder basis krijgt geen geschatte balk, maar
                helemaal geen.
              </P>
              <P>
                Zaterdag is de enige dag waarop de {TARON_WAIT_NOW} van het begin precies in het
                midden liggen. Op een maandag zouden dezelfde minuten de uitzondering zijn.
              </P>
              <P>
                Hoe hard dit alles is, hangt af van het aantal meetdagen: {TARON_WEEKDAY_DAYS}{' '}
                doordeweeks en {TARON_WEEKEND_DAYS} in het weekend zijn hier samengekomen. De kaart
                noemt zelf de periode waarover ze rekent. Voor het hele park staat het totaal aan
                vastgelegde dagen in het statistiekblok van de parkpagina, en in de tabellen per
                maand en per weekdag krijgt het een eigen kolom.
              </P>
            </div>
          </div>

          <DemoFrame
            label="Dezelfde tabel voor het hele park, live"
            note="Geen voorbeeldcijfers: dit is de actuele stand voor Phantasialand, per attractie de normale en de drukke waarde. Op de parkpagina staat erboven over hoeveel vastgelegde dagen het hele blok rekent. Alle minuten staan in stappen van vijf, omdat parken in stappen van vijf aanschrijven."
            href={PARK}
            hrefLabel="Naar de parkpagina →"
          >
            <LiveTopAttractions locale="nl" />
          </DemoFrame>

          <Highlight>
            Deze tabel is de reden dat we wachttijden überhaupt archiveren. Een livegetal kun je
            opvragen op het moment dat iemand ernaar vraagt. Een mediaan over elke gemeten dinsdag
            moet al klaar zijn voordat de vraag komt.
          </Highlight>
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
          “Kom vroeg” is het advies dat iedereen geeft. Het klopt alleen als de rij in de loop van
          de dag ook echt groeit, en dat doet hij lang niet overal. Zes attracties uit hetzelfde
          park, dezelfde tabel, hetzelfde jaar:
        </P>

        <DemoFrame
          label="Het echte uurprofiel, van zojuist"
          note="Live uit het uurprofiel van het park. Vet staat het sterkste uur van elke attractie, en dat ligt bij deze zes attracties bepaald niet overal gelijk. Een uur wordt pas een kolom als het minstens tien meetdagen bij die attractie heeft, minstens 40 procent van het best gemeten uur haalt en door minstens de helft van de attracties wordt gemeld. Dat gooit de randuren eruit, waarin anders één hotelgastenrij voor de hele ochtend zou spreken."
          href={PARK}
          hrefLabel="Naar de parkpagina →"
        >
          <LiveHourlyProfile locale="nl" />
        </DemoFrame>

        <div className="max-w-3xl space-y-4 pt-2">
          <P>
            Taron is het geval waarin het tijdstip bijna niets beslist: de regel ligt de hele dag in
            een smalle band, en wat het verschil maakt is de weekdag uit hoofdstuk 02. Bij Chiapas
            een regel lager is het andersom, daar stijgen de waarden tot in de middag duidelijk. Eén
            enkele regel voor het hele park zou voor een van de twee verkeerd zijn, en daarom wordt
            hij per attractie berekend.
          </P>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <DemoFrame
            label="Het advies dat daaruit ontstaat"
            note="Er wordt alleen geadviseerd als de dagpiek minstens 60 minuten haalt en de vroege start daarvan minstens 45 bespaart. Colorado Adventure in hetzelfde park bespaart 40 minuten bij een piek van 50 en krijgt daarom geen tip."
          >
            <RopeDropDemo />
          </DemoFrame>

          <div className="max-w-prose space-y-4">
            <PG>
              De kaart noemt drie getallen en één tijdstip: de normale wachttijd bij opening, de
              dagpiek, het verschil en het venster waarin de voorsprong standhoudt. Daarna is hij
              weg, en dat staat er ook zo.
            </PG>
            <P>
              Het tweede deel is de rustigste tijd van de dag, waar die ook ligt. Bij deze
              attracties valt die samen met de vroege start. Bij andere ligt hij in de avond, en dan
              noemt de kaart dat tijdstip in plaats van de wekker. Voor het hele park somt het
              attractieoverzicht de attracties op waarbij vroeg opstaan het meeste oplevert,
              gesorteerd op bespaarde minuten.
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
          De grootste besparing zit niet in het tijdstip, maar in de datum. Tussen twee dagen van
          dezelfde week kan een half uur gemiddelde wachttijd zitten, en aan een gewone kalender zie
          je dat niet. Het verschil maken schoolvakanties, feestdagen, brugdagen en het weer.
        </P>

        <DemoFrame
          label="Vier dagen uit een herfstvakantieweek"
          note="15 oktober is de rustigste van de vier, hoewel hij midden in de vakantie valt: het regent. De 19e is grijs omdat het park die dag dicht is. Op de parkpagina loopt deze kalender een jaar vooruit."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* Two columns rather than one narrow one: the calendar above runs the
            full width, and three paragraphs stacked at the body measure under it
            left the right half of the band empty. */}
        <div className="grid gap-x-10 gap-y-4 pt-2 lg:grid-cols-2 lg:items-start">
          <P>
            De vakantiekalenders komen uit twee openbare bronnen en dekken elk vier jaar.
            Belangrijker dan de eigen vakanties zijn vaak die van de buren. Een voorbeeld van
            vandaag: voor Phantasialand staat niet Noordrijn-Westfalen als bepalende vakantie in de
            kalender, maar de zomervakantie van de Nederlandse provincie Gelderland. Het park ligt
            90 kilometer van de grens, en daggasten kennen er geen. Regio’s binnen ongeveer 200
            kilometer tellen daarom mee en krijgen in de kalender een eigen markering.
          </P>
          <div className="space-y-4">
            <PG>
              De kleur van een dag is een voorspelling, geen meting. Ze komt uit een model dat elke
              nacht opnieuw wordt getraind met de wachttijden van de vorige dag en zich achteraf aan
              de werkelijkheid laat narekenen.
            </PG>
            <P>
              Hoe ver de kalender reikt, hangt van het park af. Een park dat het hele jaar open is,
              krijgt tot twaalf maanden vooruit een voorspelling. Bij een seizoenspark houdt ze op
              waar het gepubliceerde seizoen eindigt: voor een dinsdag in maart waarop Phantasialand
              aantoonbaar gesloten is, is een druktekleur geen voorspelling maar een bewering.
            </P>
          </div>
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
        id="parkpagina"
        index="05"
        kicker="De rondgang"
        title="Een parkpagina van boven naar beneden"
        icon={Layers}
      >
        <P>
          Alles tot hier staat op één pagina, en die is gebouwd in de volgorde waarin mensen vragen:
          is het park vandaag open? Gaat het zo regenen? Hoe lang is de rij? En wanneer had ik beter
          kunnen komen? Eén keer van boven naar beneden.
        </P>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
          <ParkAnatomy onlyWhenLabel="Alleen als:" steps={PARK_SECTIONS} />

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Highlight>
              De helft van deze blokken hangt aan een voorwaarde, en dat is opzet. Een park zonder
              shows krijgt geen leeg showtabblad, en ongeveer de helft van de 212 parken rendert
              helemaal geen burensectie, omdat er niets binnen bereik ligt.
            </Highlight>
            <PG>
              De tabbladen onthouden hun keuze in het adres. Wie de kalender open heeft en de link
              doorstuurt, verstuurt de kalender en niet de attractielijst.
            </PG>
            <div className="pt-1">
              <Link
                href={PARK}
                prefetch={false}
                className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Activity className="h-4 w-4" />
                Aan het levende object bekijken
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* ── 06 ──────────────────────────────────────────────────────────── */}
      <Ambience tone="emerald">
        <SectionShell
          id="nachtdienst"
          index="06"
          kicker="De onderbouw"
          title="Waar de cijfers vandaan komen"
          icon={Database}
        >
          <P>
            Elke vijf minuten wordt elk van de 212 parken opgevraagd, uit drie openbare bronnen
            tegelijk. Spreken ze elkaar tegen, dan beslist de meerderheid, daarna de mediaan, daarna
            het gemiddelde. Opgeslagen wordt alleen wat is veranderd, afgerond op vijf minuten,
            omdat de parken zelf in stappen van vijf minuten aanschrijven.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Wachttijden" delay={0}>
              ThemeParks.wiki, Wartezeiten.app en Queue-Times.com, elke vijf minuten. De ruwe valuta
              van al het andere op deze pagina.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Vakanties & feestdagen" delay={60}>
              Nager.Date voor wettelijke feestdagen en brugdagen, OpenHolidays voor schoolvakanties.
              Vier jaar, elke regio apart, maandelijks bijgewerkt.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Weer" delay={120}>
              Open-Meteo voor verwachting, terugblik en de buienradar van 15 minuten. Officiële
              weerwaarschuwingen komen van DWD en MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Openingstijden" delay={0}>
              Uit de parkkalenders. Waar een park er geen publiceert, reconstrueren we de dag uit de
              activiteit van de attracties en markeren hem als geschat.
            </IngredientCard>
            <IngredientCard icon={Layers} title="Historie" delay={60}>
              Er wordt niets gewist. Oudere perioden worden alleen gecomprimeerd, zodat elke analyse
              op alle metingen blijft draaien.
            </IngredientCard>
            <IngredientCard icon={BarChart3} title="Voorspelmodellen" delay={120}>
              Gescheiden naar tijdshorizon: één voor de lopende dag, één voor de komende weken, één
              voor de rest van het jaar. Elk wordt aan de echte tijden nagerekend.
            </IngredientCard>
          </IngredientGrid>

          <div className="max-w-3xl space-y-4 pt-4">
            <P>
              Het tweede deel gebeurt ’s nachts, en dat is de eigenlijke reden waarom een site
              normale wachttijden niet zomaar kan tonen. Een mediaan over elke gemeten dinsdag is
              geen query die je bij het openen van een pagina start. Die moet vooraf berekend zijn,
              in een vaste volgorde, omdat elke stap op de vorige voortbouwt.
            </P>
          </div>

          <NightShift
            jobs={NIGHT_JOBS}
            caption="Alle tijden in UTC. De volgorde is geen toeval: het rope-dropadvies van 05:15 leest de kwartierhistorie die om 04:30 wordt geschreven."
          />
        </SectionShell>
      </Ambience>

      {/* ── 07 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="gaten"
        index="07"
        kicker="De grenzen"
        title="Wat we niet beweren"
        icon={HelpCircle}
      >
        <P>
          Een datasite wordt niet goed doordat elk veld gevuld is. Ze wordt goed doordat je de
          gevulde velden kunt vertrouwen. Drie gevallen waarin park.fan liever niets zegt.
        </P>

        <div className="grid gap-6 lg:grid-cols-3">
          <DemoFrame
            label="Park zonder leesbare bron"
            note="Hansa-Park publiceert wachttijden alleen in de eigen app op de wifi van het park. In de data ziet dat eruit als een park midden in de nacht, daarom staat het als handmatig onderhouden melding op de pagina. Zonder die melding zouden er 82 attracties op “zeer laag” staan."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="Attractie buiten haar seizoen"
            note="Over een ijsbaan in augustus meldt niemand iets, omdat er niets te melden valt. Die stilte als “open” lezen zou de gemakkelijke fout zijn. De attractie telt die dag ook niet mee in de teller “12 van 45 open”."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Geen beoordelingsbasis"
            note="Het laatste niveau is helemaal geen drukte. Het zegt dat we er voor dit park nog geen hebben: onder ongeveer 30 openingsdagen ontbreekt de vergelijkingswaarde waartegen gerekend zou worden."
          >
            <BadgeRowDemo caption="Boven de drukteniveaus, onder de vergelijking met het normale. Beide gebruiken dezelfde kleurschaal, zodat ze elkaar niet kunnen tegenspreken." />
          </DemoFrame>
        </div>

        <Highlight>
          Dezelfde regel geldt voor de seizoensherkenning. De bedrijfsmaanden van een attractie
          noemen we pas na 330 waarnemingsdagen. Daarvoor zou “draait van december tot april” geen
          seizoen zijn, maar een beschrijving van de periode waarin we toevallig al hebben gemeten.
        </Highlight>
      </SectionShell>

      {/* ── 08 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="bezoeken"
        index="08"
        kicker="In de praktijk"
        title="Vier bezoeken, vier routes door de site"
        icon={Users}
      >
        <P>
          Dezelfde data beantwoorden heel verschillende vragen. Vier voorbeelden, telkens met de
          route die wij ervoor zouden nemen.
        </P>

        <div className="grid gap-5 lg:grid-cols-2">
          <PersonaBlock
            icon={CalendarDays}
            who="Gezin, één dag in de herfstvakantie"
            question="“Welke dag van de vakantieweek is het rustigst, en wat doen we bij regen?”"
            steps={[
              <>
                Parkpagina openen, tabblad <strong>Kalender</strong>. De vakantieweek staat er als
                blok, gekleurd naar voorspelling, met weer en openingstijden in elke tegel.
              </>,
              <>
                Op een dag tikken. Het detail noemt de verwachte gemiddelde wachttijd en welke
                vakantieregio’s die dag meespelen, ook die uit het buurland.
              </>,
              <>
                Regendag ingepland? De kalender toont hem als de rustigste van de week. Op de dag
                zelf zegt de buienradar van 15 minuten bovenaan de parkpagina wanneer het ophoudt.
              </>,
              <>
                Op elke attractiekaart staat de minimumlengte, waar het park die publiceert. Taron
                vraagt 140 centimeter, Colorado Adventure 120, en dat beslist de dag meer dan welke
                wachttijd ook.
              </>,
              <>
                Kinderattracties in het tabblad <strong>Attracties</strong> als favoriet markeren.
                Ze staan daarna op de startpagina met hun actuele wachttijd.
              </>,
            ]}
          />

          <PersonaBlock
            icon={BarChart3}
            who="Veelrijder, drie parken in een week"
            question="“Waar loont rope drop, en is de rij op dit moment echt uitzonderlijk?”"
            steps={[
              <>
                Op de parkpagina het overzicht van de rope-dropattracties, gesorteerd op bespaarde
                minuten. Attracties zonder echt voordeel duiken daar niet op.
              </>,
              <>
                Voor elke attractie de tabel uit hoofdstuk 02 meelezen. Die noemt de periode
                waarover ze rekent, en een weekdag zonder basis krijgt daar helemaal geen balk.
              </>,
              <>
                Tijdens het bezoek op het vergelijkingsbadge letten: “veel hoger” betekent vandaag
                werkelijk uitzonderlijk, niet alleen lang.
              </>,
              <>
                Elke attractiepagina draagt een cijfer voor de eigen voorspelling, uit de
                vergelijking van eerdere voorspellingen met de echte tijden van de laatste 30 dagen.
                Bij Taron zijn dat er op dit moment een paar duizend.
              </>,
              <>
                Voor de reisplanning <A href={bestTime}>de beste reistijd</A> vergelijken. Daar
                staan meerdere parken naast elkaar, inclusief rustigste weekdag.
              </>,
            ]}
          />

          <PersonaBlock
            icon={MapPin}
            who="Jaarkaart, 20 minuten van het park"
            question="“Loont de rit vanavond nog?”"
            steps={[
              <>
                Startpagina met locatietoestemming. Het dichtstbijzijnde park staat bovenaan, met
                status, actuele drukte en openingstijd tot vanavond.
              </>,
              <>
                Drukte “laag” bij een attractie die anders “hoog” staat, is precies de avond
                waarvoor de rit loont.
              </>,
              <>
                In het park schakelt de startpagina over naar de nabijweergave: de dichtstbijzijnde
                attracties met afstand en actuele wachttijd.
              </>,
              <>
                Let op de trendpijl. Een dalende rij in het laatste uur voor sluiting is vaak het
                kortste moment van de hele dag.
              </>,
            ]}
          />

          <PersonaBlock
            icon={Compass}
            who="Voor het eerst in een groot park"
            question="“Wat betekent single rider, en in welke volgorde doen we dit?”"
            steps={[
              <>
                De begrippen staan in het <A href={glossary}>woordenboek</A>, in zes talen. Op de
                attractiepagina’s zijn ze in de tekst direct gelinkt.
              </>,
              <>
                ’s Ochtends het rope-dropadvies van het park afwerken. Dat is de enige volgorde die
                op gemeten data berust in plaats van op gevoel.
              </>,
              <>
                Vanaf de middag op drukte beslissen in plaats van op minuten. Een “lage” attractie
                met 25 minuten is de betere keuze dan een “hoge” met 20.
              </>,
              <>
                Shows in het gelijknamige tabblad. De tijden staan daar voor de hele dag, en parades
                maken de paden zo’n half uur leger.
              </>,
            ]}
          />
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
                  Ctrl + K of ⌘ + K, overal op de site. Vindt parken, attracties, shows en
                  restaurants, ook bij een globale spelling.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Locatie',
              body: (
                <>
                  Vrijgegeven toont de startpagina de parken bij jou in de buurt. In het park
                  schakelt ze naar de nabijweergave met afstanden.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Favorieten',
              body: (
                <>
                  Ster op elke park- en attractiekaart. Staat als cookie in de browser, zonder
                  account en zonder server.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog',
              body: (
                <>
                  Langere stukken over afzonderlijke parken en attracties. De tabellen erin trekken
                  dezelfde cijfers als de parkpagina’s, in plaats van ze over te tikken.
                </>
              ),
            },
            {
              icon: Moon,
              title: 'Attractiepagina',
              body: (
                <>
                  Verloop, normale wachttijden per weekdag, rope drop, minimumlengte, trefzekerheid
                  van de voorspelling, layout-elementen en de blogberichten over de attractie.
                </>
              ),
            },
            {
              icon: HelpCircle,
              title: 'Woordenboek',
              body: (
                <>
                  <A href={glossary}>Alle vakbegrippen</A> met definitie, voorbeeldattracties en
                  deels een 3D-model van het baanelement.
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
        body="Alles op park.fan is gratis, zonder account en zonder reclame te gebruiken. De parkpagina toont dit alles aan het levende object, de Fancast-pagina rekent openbaar voor hoe trefzeker de voorspellingen van de laatste 30 dagen waren, en de beste reistijd zet meerdere parken naast elkaar."
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

/** One worked example: who, what they are asking, and the route through the site. */
function PersonaBlock({
  icon: Icon,
  who,
  question,
  steps,
}: {
  icon: React.ElementType;
  who: string;
  question: string;
  steps: React.ReactNode[];
}) {
  return (
    <Reveal>
      <div className="bg-card/70 h-full rounded-2xl border p-5 sm:p-6">
        <div className="mb-3 flex items-start gap-3">
          <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Icon className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{who}</h3>
            <p className="text-muted-foreground mt-0.5 text-sm italic">{question}</p>
          </div>
        </div>
        <ol className="mt-4 space-y-2.5">
          {steps.map((step, i) => (
            <li key={i} className="text-muted-foreground flex gap-3 text-sm leading-relaxed">
              <span className="bg-primary/10 text-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}
