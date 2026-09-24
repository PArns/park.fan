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
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { FancastCta } from '../_best-time-ui';
import { BestTimesData, type BestTimesLabels } from '../_best-times-data';
import { QuietestDaysByPark } from '../_quietest-days-by-park';

const DATA_LABELS: BestTimesLabels = {
  weekdaysTitle: 'De rustigste weekdagen',
  weekdaysBody:
    'Elk park telt hier even zwaar, of het nu Disneyland is of een klein familiepark: we rekenen het eerst om naar zijn eigen gemiddelde en middelen daarna pas. De balk laat zien hoe druk een doorsnee weekdag is vergeleken met dat gemiddelde. De zaterdag springt eruit; de andere zes dagen liggen dichter bij elkaar dan de meeste mensen verwachten.',
  monthsTitle: 'De rustigste maanden',
  monthsBody:
    'Dezelfde rekensom, nu over het jaar verdeeld. December valt daarbij uit de toon, want daarin zitten alleen de parken die in de winter überhaupt opengaan, en die draaien dan kerstprogramma.',
  quieter: 'rustiger',
  busier: 'drukker',
  typical: 'rond het gemiddelde',
  footnote: 'Op basis van {days} gemeten parkdagen uit {parks} parken.',
  pending:
    'De live ranglijst verzamelt nog wachttijden. De rustigste dagen verschijnen hier zodra er genoeg data is.',
};

const FAQ = [
  {
    question: 'Wanneer kun je het best een pretpark bezoeken?',
    answer:
      'Het rustigst is het op weekdagen buiten de schoolvakanties, met dinsdag tot en met donderdag voorop. De precieze patronen per weekdag en maand zie je hierboven, rechtstreeks uit de gemeten wachttijden over alle parken.',
  },
  {
    question: 'Welke weekdag is het minst druk?',
    answer:
      'Gemiddeld over alle parken zijn dinsdag, woensdag en donderdag het rustigst. Uitgesproken druk is alleen de zaterdag; de zondag ligt dichter bij de dinsdag dan bij de zaterdag. Afzonderlijke parken kunnen afwijken; de druktekalender op de parkpagina laat het dag voor dag zien.',
  },
  {
    question: 'In welke maanden zijn pretparken het minst druk?',
    answer:
      'Dat hangt sterker van het park af dan de vuistregel doet vermoeden: over alle parken gerekend zijn de zomermaanden niet de drukste, en december steekt naar boven uit, omdat in de winter alleen de parken met kerstprogramma open zijn. Het maandoverzicht hierboven laat het maand voor maand zien. Voor een concreet park telt zijn eigen kalender.',
  },
  {
    question: 'Is een bezoek in de regen de moeite waard?',
    answer:
      'Vaak wel: slecht weer schrikt veel bezoekers af en de rijen worden korter, vooral bij achtbanen die in de regen gewoon blijven rijden. De tip werkt alleen zolang niet iedereen op hetzelfde idee komt; daarom rekent ons voorspelmodel het weer meteen mee.',
  },
  {
    question: 'Hoe vind ik de beste dag voor een specifiek park?',
    answer:
      'Deze pagina toont de globale patronen als startpunt. Open voor een concreet park zijn druktekalender: die toont voor elke gepubliceerde dag een groene, gele of rode voorspelling, inclusief de school- en feestdagen van die regio.',
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
          Wanneer een pretpark vol loopt, is verrassend goed te voorspellen, in elk geval beter dan
          het humeur van een zesjarige om drie uur ’s middags. Weekdag, vakanties, weer en seizoen
          bepalen voor een groot deel of je bij de achtbaan tien minuten wacht of anderhalf uur. En
          omdat elke parkdag wachttijden achterlaat, valt dat vrij nauwkeurig na te rekenen.
        </Lead>
        <P>
          Dus hebben we het nagerekend, met de meegeschreven wachttijden uit ruim 200 parken.
          Hieronder staan de rustigste weekdagen en maanden, de beste uren van de dag en de dagen
          waarop je beter op de bank blijft. De druktekalender zoekt daarna voor jouw park de
          passende dag uit.
        </P>
        <Highlight>
          Korte versie voor wie haast heeft: dinsdag tot en met donderdag buiten de schoolvakanties,
          bij opening aan de poort staan, en een wisselvallige weersvoorspelling zien als cadeautje,
          zolang er een regenjas in de rugzak zit.
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
          Weekdag en maand bewegen het meest. Allebei hebben we gemiddeld over alle parken, uit de
          wachttijden die echt gemeten zijn:
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
          Na de weekdag beslist het tijdstip het meest. Deze vier tijdvensters zijn bijna overal het
          rustigst:
        </P>
        <TouchpointGrid
          items={[
            {
              icon: Sunrise,
              title: (
                <>
                  Bij opening (<GlossaryTermLink termId="rope-drop">rope drop</GlossaryTermLink>)
                </>
              ),
              body: 'Het eerste uur na opening is het beste van de dag. Wie op tijd aan de poort staat, rijdt de grote banen vaak nog voordat er überhaupt een rij staat.',
            },
            {
              icon: Users,
              title: 'Rond lunchtijd',
              body: 'Als iedereen aan tafel zit, worden de rijen korter. Neem die tijd voor de populaire attracties en eet later. De frietjes smaken om half drie precies hetzelfde.',
            },
            {
              icon: Sun,
              title: 'Het laatste uur',
              body: 'Veel gezinnen gaan voor het einde naar huis. In het laatste uur voor sluitingstijd worden de wachttijden vaak nog eens merkbaar korter.',
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
          title="Vroeg zijn helpt, alleen niet bij elke baan"
        >
          Bij de grote publiekstrekkers levert het eerste uur na opening vaak meer ritten op dan
          twee uur in de middag. Overal geldt dat niet: sommige banen zijn de hele dag even vol,
          andere worden pas na de lunch wakker. Op de pagina van elke attractie staat haar eigen
          dagcurve, en daar staat ook of de vroegere wekker zich voor haar loont.
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
          Net zo nuttig is weten wanneer je beter niet gaat. Op deze dagen zitten de parken propvol.
          Je kunt je erop voorbereiden met proviand en veel geduld, of er meteen omheen plannen:
        </PG>
        <SplitFigure
          src="/media/walibi-holland/goliath.jpg"
          alt="Achtbaan Goliath in Walibi Holland op een drukke dag"
          kicker="Piekdag"
          title="Zonnig, iedereen vrij, iedereen er"
          reverse
          badge={
            <GlossaryTermLink termId="crowd-level" className="inline-flex cursor-help">
              <CrowdLevelBadge level="very_high" />
            </GlossaryTermLink>
          }
        >
          Een zaterdag in de zomervakantie bij mooi weer is het slechtste geval: iedereen is vrij,
          iedereen wil eruit, iedereen is er. Ben je flexibel, neem dan liever de dinsdag daarna.
          Hetzelfde park lijkt dan wel ’s nachts verbouwd, waarbij iemand de rijen vergeten is.
        </SplitFigure>
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Weekenden & feestdagen',
              body: 'De zaterdag is over alle parken de drukste dag, met duidelijke afstand tot de rest van de week. Feestdagen en lange weekenden doen er nog een schepje bovenop.',
            },
            {
              icon: CalendarRange,
              title: <GlossaryTermLink termId="school-holiday">Schoolvakanties</GlossaryTermLink>,
              body: 'Zodra bij jou of in een buurregio de vakantie begint, wordt het voller. De zomervakantie is het absolute hoogseizoen.',
            },
            {
              icon: Sun,
              title: 'Brugdagen & vakantiezaterdagen in het hoogseizoen',
              body: 'Zon, een vrije dag en hoogseizoen vallen hier samen. Van alle combinaties in de kalender is dit de drukste.',
            },
            {
              icon: Sparkles,
              title: 'Nieuwe attracties in hun eerste zomer',
              body: 'Een gloednieuwe achtbaan wil in zijn eerste seizoen iedereen gereden hebben, het liefst vóór de collega’s. Reken bij premières op lange rijen.',
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
              body: 'De grootste knop in de kalender. Over alle parken gerekend ligt de zaterdag het verst boven het gemiddelde en de dinsdag het verst eronder.',
            },
            {
              icon: CloudRain,
              title: 'Gebruik het weer slim',
              body: 'Een wisselvallige voorspelling houdt veel mensen thuis. Wie tegen een buitje kan, staat merkbaar korter in de rij. Een regenjas verslaat een paraplu.',
            },
            {
              icon: Ticket,
              title: (
                <>
                  <GlossaryTermLink termId="single-rider">Single rider</GlossaryTermLink> &{' '}
                  <GlossaryTermLink termId="virtual-queue">virtuele wachtrijen</GlossaryTermLink>
                </>
              ),
              body: 'Vul als single rider de losse vrije plaatsen op, of sta via de app in de rij terwijl je eet of rondloopt. Jullie zitten dan niet naast elkaar, wel eerder in de trein.',
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
          De patronen hierboven zijn het grove kader. De beste dag voor jouw park vind je in de{' '}
          <GlossaryTermLink termId="crowd-calendar">druktekalender</GlossaryTermLink> op elke
          parkpagina: die geeft elke afzonderlijke dag groen, geel of rood, zo ver als het park zijn
          openingstijden gepubliceerd heeft en passend bij de vakanties en feestdagen van de
          betreffende regio.
        </P>
        <SplitFigure
          src="/media/efteling/symbolica.jpg"
          alt="De paleisrit Symbolica in de Efteling"
          kicker="Groen, geel, rood"
          title="Eén kleur per dag, zo ver als de openingstijden reiken"
          badge={
            <GlossaryTermLink termId="crowd-level" className="inline-flex cursor-help">
              <CrowdLevelBadge level="low" />
            </GlossaryTermLink>
          }
        >
          Elke parkpagina heeft een dag-op-dag voorspelling die de school- en feestdagen van precies
          die regio kent, ook die waar je nog nooit van gehoord hebt. Kies een groene dag en het
          belangrijkste deel van de planning is klaar voordat je een ticket koopt.
        </SplitFigure>
        <P>Een paar populaire parken om meteen in te duiken:</P>
        <PopularParksGrid />
      </SectionShell>

      {/* Powered by Fancast */}
      <FancastCta
        title="Aangedreven door Fancast"
        body="Ons eigen voorspelmodel schat de drukte voor elke gepubliceerde dag en geeft zichzelf daarbij een cijfer."
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
