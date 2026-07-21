import React from 'react';
import { Link } from '@/i18n/navigation';
import { PopularParksGrid } from '@/components/home/featured-parks-slot';
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
import { Section, P, PG, TipList, FancastCta, FaqList } from '../_best-time-ui';
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
    <div className="space-y-14 text-base leading-7">
      {/* Data: quietest weekdays + months (live) */}
      <div className="space-y-4">
        <PG>
          Drukte in pretparken is geen toeval: wanneer het vol wordt, volgt duidelijke patronen van
          weekdag, vakanties, weer en seizoen. Hier zie je de belangrijkste — gemiddeld over alle
          parken, uit echte wachttijddata:
        </PG>
        <BestTimesData locale="nl" labels={DATA_LABELS} />
      </div>

      {/* Times of day */}
      <Section id="times" title="De rustigste tijden van de dag" icon={Clock}>
        <P>
          Niet alleen de dag telt, maar ook het uur. Drie tijdvensters zijn bijna overal het
          rustigst:
        </P>
        <TipList
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
      </Section>

      {/* Dates to avoid */}
      <Section id="avoid" title="Momenten die je beter mijdt" icon={Ban}>
        <PG>
          Net zo belangrijk als de rustige dagen zijn de drukke. Op deze momenten kun je drukte
          verwachten — plan ervoor, of plan er juist omheen:
        </PG>
        <TipList
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
      </Section>

      {/* Tactics */}
      <Section id="tactics" title="Tactieken voor korte rijen" icon={Sparkles}>
        <TipList
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
      </Section>

      {/* Grab a park */}
      <Section id="parks" title="Voor jouw park: de druktekalender" icon={Ticket}>
        <P>
          De patronen hierboven zijn het startpunt. De precies beste dag verraadt de druktekalender op
          elke parkpagina — groen, geel, rood, tot een jaar vooruit, met de vakanties en feestdagen
          van de betreffende regio erin verwerkt. Een paar populaire parken om meteen in te duiken:
        </P>
        <PopularParksGrid />
      </Section>

      {/* Powered by Fancast */}
      <FancastCta
        title="Aangedreven door Fancast"
        body="Ons voorspelmodel — het voorspelt drukte tot 365 dagen vooruit en beoordeelt zichzelf in het openbaar."
      />

      {/* FAQ */}
      <Section id="faq" title="Veelgestelde vragen over de beste reistijd" icon={HelpCircle}>
        <FaqList items={FAQ} />
      </Section>
    </div>
  );
}
