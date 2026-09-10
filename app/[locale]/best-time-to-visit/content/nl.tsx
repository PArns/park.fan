import React from 'react';
import { Link } from '@/i18n/navigation';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { PopularParksGrid } from '@/components/home/featured-parks-slot';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import {
  CalendarRange,
  Sunrise,
  Ban,
  Ticket,
  HelpCircle,
  Sparkles,
  Clock,
  CalendarDays,
  CloudRain,
  Users,
  Sun,
} from 'lucide-react';
import {
  Lead,
  P,
  PG,
  Highlight,
  SectionShell,
  SplitFigure,
  TouchpointGrid,
  FaqList,
} from '@/components/marketing/editorial-ui';
import { FancastCta } from '../_best-time-ui';
import { BestTimesData, type BestTimesLabels } from '../_best-times-data';
import { QuietestDaysByPark } from '../_quietest-days-by-park';

const DATA_LABELS: BestTimesLabels = {
  weekdaysTitle: 'De rustigste weekdagen',
  weekdaysBody:
    'Elk park telt hier even zwaar, of het nu Disneyland is of een klein familiepark: we rekenen het eerst om naar zijn eigen gemiddelde en middelen daarna pas. De balk laat zien hoe druk een doorsnee weekdag is vergeleken met dat gemiddelde. Dinsdag tot en met donderdag winnen bijna altijd.',
  monthsTitle: 'De rustigste maanden',
  monthsBody:
    'Dezelfde rekensom over het jaar: de maanden buiten het seizoen zijn merkbaar leger dan de zomer- en vakantiepieken.',
  quieter: 'rustiger',
  busier: 'drukker',
  typical: 'rond het gemiddelde',
  footnote: 'Op basis van {days} parkdagen uit {parks} parken, laatste {months} maanden.',
  pending:
    'De live ranglijst verzamelt nog wachttijden. De rustigste dagen verschijnen hier zodra er genoeg data is.',
};

const FAQ = [
  {
    question: 'Wanneer kun je het best een pretpark bezoeken?',
    answer:
      'Het rustigst is het op weekdagen buiten de schoolvakanties, met dinsdag tot en met donderdag in het laagseizoen voorop. De precieze patronen per weekdag en maand zie je hierboven, rechtstreeks uit de gemeten wachttijden over alle parken.',
  },
  {
    question: 'Welke weekdag is het minst druk?',
    answer:
      'Gemiddeld over alle parken zijn dinsdag, woensdag en donderdag het rustigst, terwijl zaterdag en zondag duidelijk het drukst zijn. Afzonderlijke parken kunnen afwijken; de druktekalender op de parkpagina laat het dag voor dag zien.',
  },
  {
    question: 'In welke maanden zijn pretparken het minst druk?',
    answer:
      'De laagseizoensmaanden buiten de zomer- en feestdagpieken zijn het leegst. Het maandoverzicht hierboven toont de relatieve drukte over het jaar, gemiddeld over alle parken.',
  },
  {
    question: 'Is een bezoek in de regen de moeite waard?',
    answer:
      'Vaak wel: slecht weer schrikt veel bezoekers af en de rijen worden korter, vooral bij achtbanen die in de regen gewoon blijven rijden. De tip werkt alleen zolang niet iedereen op hetzelfde idee komt; daarom rekent ons voorspelmodel het weer meteen mee.',
  },
  {
    question: 'Hoe vind ik de beste dag voor een specifiek park?',
    answer:
      'Deze pagina toont de globale patronen als startpunt. Open voor een concreet park zijn druktekalender: die toont voor elke afzonderlijke dag tot een jaar vooruit een groene, gele of rode voorspelling, inclusief de school- en feestdagen van die regio.',
  },
  {
    question: 'Waar komen deze gegevens vandaan?',
    answer:
      'Uit de wachttijden die we bij ruim 200 parken zelf hebben meegeschreven. Om te voorkomen dat de grootste parken de rangschikking bepalen, rekenen we elk park eerst om naar zijn eigen gemiddelde en middelen we pas daarna.',
  },
] as const;

export function ContentNL() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          Wanneer een pretpark vol loopt, is verrassend goed te voorspellen. Weekdag, vakanties, weer
          en seizoen bepalen voor een groot deel of je bij de achtbaan tien minuten wacht of
          anderhalf uur. En omdat elk bezoek wachttijden achterlaat, valt dat vrij nauwkeurig na te
          rekenen.
        </Lead>
        <P>
          Precies dat hebben we gedaan: de meegeschreven wachttijden uit ruim 200 parken
          doorgerekend. Hieronder staan de rustigste weekdagen en maanden, de beste uren van de dag
          en de dagen waarop je beter thuisblijft. De druktekalender zoekt daarna voor jouw park de
          passende dag uit.
        </P>
        <Highlight>
          Korte versie: dinsdag tot en met donderdag buiten de schoolvakanties, bij opening aanwezig
          zijn en een wisselvallige weersvoorspelling voor je laten werken. Alles daaronder is het
          kleingedrukte.
        </Highlight>
      </div>

      {/* 01 – Data: quietest weekdays + months (live) */}
      <SectionShell
        id="patterns"
        index="01"
        kicker="De data"
        title="De rustigste weekdagen en maanden"
        icon={CalendarRange}
      >
        <PG>
          Laten we met de twee grootste knoppen beginnen: de weekdag en de maand. Allebei gemiddeld
          over alle parken, telkens uit de werkelijk gemeten wachttijden. Zo ziet dat eruit:
        </PG>
        <BestTimesData locale="nl" labels={DATA_LABELS} />
        <QuietestDaysByPark locale="nl" />
      </SectionShell>

      {/* 02 – Times of day */}
      <SectionShell
        id="times"
        index="02"
        kicker="Per uur"
        title="De rustigste tijden van de dag"
        icon={Clock}
      >
        <P>
          De dag is het halve werk, het uur de andere helft. Deze vier tijdvensters zijn bijna overal
          het rustigst:
        </P>
        <TouchpointGrid
          items={[
            {
              icon: Sunrise,
              title: 'Bij opening (rope drop)',
              body: 'Het eerste uur is goud waard: wie bij opening binnen is, rijdt de topattracties vaak met een fractie van de latere wachttijd.',
            },
            {
              icon: Users,
              title: 'Rond lunchtijd',
              body: 'Als de massa eet, lopen de rijen leeg. Neem die tijd voor de populaire attracties en eet gewoon later.',
            },
            {
              icon: Sun,
              title: 'De laatste 90 minuten',
              body: 'Veel dagjesmensen vertrekken vroeg. Vlak voor sluitingstijd dalen de wachttijden vaak nog eens flink.',
            },
            {
              icon: Ticket,
              title: 'Tijdens de grote avondshow',
              body: 'Een parade of vuurwerk bindt duizenden gasten tegelijk. Precies dan komen er bij de achtbanen plaatsen vrij.',
            },
          ]}
        />
        <SplitFigure
          src="/media/phantasialand/black-mamba.jpg"
          alt="Black Mamba raast door de jungle in Phantasialand"
          kicker="Bij opening"
          title="Vroeg zijn helpt – maar niet bij elke baan"
        >
          Bij de grote publiekstrekkers levert het eerste uur na opening vaak meer ritten op dan twee
          uur in de middag. Overal geldt dat niet: sommige banen lopen de hele dag even vol, andere
          trekken pas na de middag aan. Op de pagina van elke attractie staat haar eigen dagcurve, en
          daar staat ook of de vroegere wekker zich voor haar loont.
        </SplitFigure>
      </SectionShell>

      {/* 03 – Dates to avoid */}
      <SectionShell
        id="avoid"
        index="03"
        kicker="Rode dagen"
        title="Momenten die je beter mijdt"
        icon={Ban}
      >
        <PG>
          Net zo nuttig is het om te weten wanneer het echt vol wordt. Op deze dagen zitten de
          parken ervaringsgewijs propvol. Je stelt je erop in, of je plant er meteen omheen:
        </PG>
        <SplitFigure
          src="/media/walibi-holland/goliath.jpg"
          alt="Achtbaan Goliath in Walibi Holland op een drukke dag"
          kicker="Piekdag"
          title="Zonnig, iedereen vrij, iedereen er"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          Een zaterdag in de zomervakantie bij mooi weer is het slechtste geval: iedereen is vrij,
          iedereen wil eruit, iedereen is er. Ben je flexibel, neem dan liever de dinsdag daarna.
          Hetzelfde park voelt dan compleet anders.
        </SplitFigure>
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Weekenden & feestdagen',
              body: 'Zaterdag en zondag zijn over alle parken het drukst; feestdagen en lange weekenden doen er nog een schepje bovenop.',
            },
            {
              icon: CalendarRange,
              title: 'Schoolvakanties',
              body: 'Zodra bij jou of in een buurregio de vakantie begint, wordt het voller. De zomervakantie is het absolute hoogseizoen.',
            },
            {
              icon: Sun,
              title: 'Brugdagen & vakantiezaterdagen in het hoogseizoen',
              body: 'De klassieke piekcombinatie: zonnig, iedereen vrij, iedereen aanwezig. Kies als het kan liever de dinsdag erna.',
            },
            {
              icon: Sparkles,
              title: 'Nieuwe attracties in hun eerste zomer',
              body: 'Een gloednieuwe achtbaan trekt in zijn eerste seizoen iedereen aan. Reken bij premières op lange rijen.',
            },
          ]}
        />
      </SectionShell>

      {/* 04 – Tactics */}
      <SectionShell
        id="tactics"
        index="04"
        kicker="Speel het slim"
        title="Tactieken voor korte rijen"
        icon={Sparkles}
      >
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Weekdag boven weekend',
              body: 'De grootste knop om aan te draaien: een dinsdag in plaats van een zaterdag kan de wachttijden halveren.',
            },
            {
              icon: CloudRain,
              title: 'Gebruik het weer slim',
              body: 'Een wisselvallige voorspelling houdt veel mensen thuis. Wie tegen een buitje kan, staat merkbaar korter in de rij. Een regenjas verslaat een paraplu.',
            },
            {
              icon: Sunrise,
              title: 'Kom vroeg',
              body: 'Bij de grote banen levert het eerste uur vaak meer op dan twee uur in de middag. Of het zich voor een bepaalde baan loont, staat op haar eigen pagina.',
            },
            {
              icon: Ticket,
              title: 'Single rider & virtuele wachtrijen',
              body: 'Rijd als single rider op de losse vrije plaatsen, of sta via de app digitaal in de rij terwijl je eet of rondloopt. Op drukke dagen is dat gewonnen tijd.',
            },
          ]}
        />
        <P>
          Hoe dit alles in een park samenkomt, wordt stap voor stap uitgelegd in de{' '}
          <Link href={`/${HOWTO_SEGMENTS.nl}`}>volledige handleiding</Link>.
        </P>
      </SectionShell>

      {/* 05 – Crowd calendar for your park */}
      <SectionShell
        id="parks"
        index="05"
        kicker="Voor jouw park"
        title="De druktekalender"
        icon={Ticket}
      >
        <P>
          De patronen hierboven zijn het startpunt. De echt beste dag vind je in de druktekalender
          op elke parkpagina: die geeft elke afzonderlijke dag groen, geel of rood, tot een jaar
          vooruit en passend bij de vakanties en feestdagen van de betreffende regio.
        </P>
        <SplitFigure
          src="/media/efteling/symbolica.jpg"
          alt="De paleisrit Symbolica in de Efteling"
          kicker="Groen, geel, rood"
          title="Eén kleur per dag, een jaar vooruit"
          badge={<CrowdLevelBadge level="low" />}
        >
          Elke parkpagina heeft een dag-op-dag voorspelling die de school- en feestdagen van precies
          die regio meerekent. Kies een groene dag en het belangrijkste deel van de planning is klaar
          voordat je ook maar een ticket koopt.
        </SplitFigure>
        <P>Een paar populaire parken om meteen in te duiken:</P>
        <PopularParksGrid />
      </SectionShell>

      {/* Powered by Fancast */}
      <FancastCta
        title="Aangedreven door Fancast"
        body="Ons eigen voorspelmodel schat de drukte tot 365 dagen vooruit en geeft zichzelf daarbij een cijfer."
      />

      {/* 06 – FAQ */}
      <SectionShell
        id="faq"
        index="06"
        kicker="Kort uitgelegd"
        title="Veelgestelde vragen over de beste reistijd"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>
    </>
  );
}
