import React from 'react';
import { Link } from '@/i18n/navigation';
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

const DATA_LABELS: BestTimesLabels = {
  weekdaysTitle: 'De rustigste weekdagen',
  weekdaysBody:
    'Gemiddeld over alle parken — elk park eerst genormaliseerd op zijn eigen gemiddelde, zodat grote parken de kleine niet overstemmen. Zo druk is een doorsnee weekdag vergeleken met het gemiddelde. Dinsdag tot en met donderdag winnen bijna altijd.',
  monthsTitle: 'De rustigste maanden',
  monthsBody:
    'Dezelfde rekensom over het jaar: de maanden buiten het seizoen zijn merkbaar leger dan de zomer- en vakantiepieken.',
  quieter: 'rustiger',
  busier: 'drukker',
  typical: 'rond het gemiddelde',
  footnote: 'Op basis van {days} parkdagen uit {parks} parken, laatste {months} maanden.',
};

const FAQ = [
  {
    question: 'Wanneer kun je het best een pretpark bezoeken?',
    answer:
      'Het rustigst is het op weekdagen buiten de schoolvakanties — dinsdag tot en met donderdag in het laagseizoen zijn bijna altijd de meest ontspannen dagen. De precieze patronen per weekdag en maand zie je hierboven, live uit echte wachttijddata over alle parken.',
  },
  {
    question: 'Welke weekdag is het minst druk?',
    answer:
      'Gemiddeld over alle parken zijn dinsdag, woensdag en donderdag het rustigst, terwijl zaterdag en zondag duidelijk het drukst zijn. Afzonderlijke parken kunnen afwijken — elke parkpagina heeft een druktekalender die het dag voor dag laat zien.',
  },
  {
    question: 'In welke maanden zijn pretparken het minst druk?',
    answer:
      'De laagseizoensmaanden buiten de zomer- en feestdagpieken zijn het leegst. Het maandoverzicht hierboven toont de relatieve drukte over het jaar, gemiddeld over alle parken.',
  },
  {
    question: 'Is een bezoek in de regen de moeite waard?',
    answer:
      'Vaak wel: slecht weer schrikt veel bezoekers af en de rijen worden korter — vooral voor achtbanen die toch blijven rijden. Maar de insidertip werkt alleen zolang niet iedereen op hetzelfde idee komt; daarom rekent ons voorspelmodel het weer meteen mee.',
  },
  {
    question: 'Hoe vind ik de beste dag voor een specifiek park?',
    answer:
      'Deze pagina toont de globale patronen als startpunt. Open voor een concreet park zijn druktekalender: die toont voor elke afzonderlijke dag tot een jaar vooruit een groene, gele of rode voorspelling — inclusief de school- en feestdagen van die regio.',
  },
  {
    question: 'Waar komen deze gegevens vandaan?',
    answer:
      'Uit de daadwerkelijk gemeten wachttijden van 150+ parken over de laatste twee jaar. Elk park wordt genormaliseerd op zijn eigen gemiddelde en daarna over alle parken gemiddeld, zodat de rangschikking eerlijk is en niet wordt bepaald door de grootste parken.',
  },
] as const;

export function ContentNL() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          De beste reistijd voor een pretpark is geen geheim — het is een patroon. Wanneer een park
          vol loopt, volgt de weekdag, de vakantiekalender, het weer en het seizoen; alle vier laten
          ze sporen na in de wachttijden.
        </Lead>
        <P>
          Die sporen hebben we over 150+ parken van de laatste twee jaar gemeten. Hieronder: de
          rustigste weekdagen en maanden, de rustigste uren van de dag, de momenten die je beter
          mijdt — en de druktekalender die daar de ene beste dag voor jouw park van maakt.
        </P>
        <Highlight>
          Korte versie: dinsdag tot en met donderdag buiten de schoolvakanties, bij opening aanwezig
          zijn en een wisselvallige weersvoorspelling voor je laten werken. Alles daaronder is het
          kleingedrukte.
        </Highlight>
      </div>

      {/* 01 — Data: quietest weekdays + months (live) */}
      <SectionShell
        id="patterns"
        index="01"
        kicker="De data"
        title="De rustigste weekdagen en maanden"
        icon={CalendarRange}
      >
        <PG>
          Drukte is geen toeval: wanneer het vol wordt, volgt duidelijke patronen van weekdag,
          vakanties, weer en seizoen. Hier de twee grootste daarvan — gemiddeld over alle parken,
          uit echte wachttijddata:
        </PG>
        <BestTimesData locale="nl" labels={DATA_LABELS} />
      </SectionShell>

      {/* 02 — Times of day */}
      <SectionShell
        id="times"
        index="02"
        kicker="Per uur"
        title="De rustigste tijden van de dag"
        icon={Clock}
      >
        <P>
          Niet alleen de dag telt, maar ook het uur. Drie tijdvensters zijn bijna overal het
          rustigst:
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
              body: 'Als de massa eet, lopen de rijen leeg — een goed moment voor de populaire attracties (en om later te eten).',
            },
            {
              icon: Sun,
              title: 'De laatste 90 minuten',
              body: 'Veel dagjesmensen vertrekken vroeg. Vlak voor sluitingstijd dalen de wachttijden vaak nog eens flink.',
            },
            {
              icon: Ticket,
              title: 'Tijdens de grote avondshow',
              body: 'Een parade of vuurwerk bindt duizenden gasten tegelijk — de wachttijden van de achtbanen zakken meetbaar in.',
            },
          ]}
        />
        <SplitFigure
          src="/images/parks/phantasialand/black-mamba.jpg"
          alt="Black Mamba raast door de jungle in Phantasialand"
          kicker="Rope drop"
          title="Het eerste uur is goud waard"
        >
          Wie bij opening binnen is, rijdt de topattracties vaak met een fractie van de latere
          wachttijd. Het eerste uur vervangt geregeld twee uur in de middag — geen fast-pass nodig,
          alleen een vroege wekker.
        </SplitFigure>
      </SectionShell>

      {/* 03 — Dates to avoid */}
      <SectionShell id="avoid" index="03" kicker="Rode dagen" title="Momenten die je beter mijdt" icon={Ban}>
        <PG>
          Net zo belangrijk als de rustige dagen zijn de drukke. Op deze momenten kun je drukte
          verwachten — plan ervoor, of plan er juist omheen:
        </PG>
        <SplitFigure
          src="/images/parks/walibi-holland/goliath.jpg"
          alt="Achtbaan Goliath in Walibi Holland op een drukke dag"
          kicker="Piekdag"
          title="Zonnig, iedereen vrij, iedereen er"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          De klassieke piekcombinatie — een vakantiezaterdag in het hoogseizoen — draagt bijna alle
          druktefactoren tegelijk. Kies als het kan liever de dinsdag erna: hetzelfde park, de halve
          rij.
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
              body: 'Tijdens de vakanties van je eigen regio en de buurregio’s loopt de drukte sterk op — de zomervakantie nog het meest.',
            },
            {
              icon: Sun,
              title: 'Brugdagen & vakantiezaterdagen in het hoogseizoen',
              body: 'De klassieke piekcombinatie: zonnig, iedereen vrij, iedereen aanwezig. Kies als het kan liever de dinsdag erna.',
            },
            {
              icon: Sparkles,
              title: 'Nieuwe attracties in hun eerste zomer',
              body: 'Een gloednieuwe achtbaan trekt in zijn openingsseizoen massa’s — reken bij premières op lange rijen.',
            },
          ]}
        />
      </SectionShell>

      {/* 04 — Tactics */}
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
              body: 'Een wisselvallige voorspelling schrikt veel mensen af. Wie tegen een buitje kan, staat korter in de rij — een regenjas verslaat een paraplu.',
            },
            {
              icon: Sunrise,
              title: 'Kom vroeg',
              body: 'Rope drop verslaat bijna elke andere tactiek. Het eerste uur vervangt vaak twee uur in de middag.',
            },
            {
              icon: Ticket,
              title: 'Single rider & virtuele wachtrijen',
              body: 'Rijd alleen of sta digitaal in de rij terwijl je eet of shopt — gewonnen tijd op drukke dagen.',
            },
          ]}
        />
        <P>
          Hoe dit alles in een park samenkomt, wordt stap voor stap uitgelegd in de{' '}
          <Link href="/howto">volledige handleiding</Link>.
        </P>
      </SectionShell>

      {/* 05 — Crowd calendar for your park */}
      <SectionShell
        id="parks"
        index="05"
        kicker="Voor jouw park"
        title="De druktekalender"
        icon={Ticket}
      >
        <P>
          De patronen hierboven zijn het startpunt. De precies beste dag verraadt de druktekalender
          op elke parkpagina — groen, geel, rood, tot een jaar vooruit, met de vakanties en
          feestdagen van de betreffende regio erin verwerkt.
        </P>
        <SplitFigure
          src="/images/parks/efteling/symbolica.jpg"
          alt="De paleisrit Symbolica in de Efteling"
          kicker="Groen, geel, rood"
          title="Eén kleur per dag, een jaar vooruit"
          badge={<CrowdLevelBadge level="low" />}
        >
          Elke parkpagina heeft een dag-op-dag voorspelling die de school- en feestdagen van precies
          die regio meerekent. Kies een groene dag en je hebt negentig procent van de planning al
          gedaan voordat je ook maar geboekt hebt.
        </SplitFigure>
        <P>Een paar populaire parken om meteen in te duiken:</P>
        <PopularParksGrid />
      </SectionShell>

      {/* Powered by Fancast */}
      <FancastCta
        title="Aangedreven door Fancast"
        body="Ons voorspelmodel — het voorspelt drukte tot 365 dagen vooruit en beoordeelt zichzelf in het openbaar."
      />

      {/* 06 — FAQ */}
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
