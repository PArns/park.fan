/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { Link } from '@/i18n/navigation';
import { MLStatsSection } from '@/components/home/ml-stats-section';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import {
  Activity,
  CalendarDays,
  CloudSun,
  PartyPopper,
  History,
  Gauge,
  Database,
  RefreshCw,
  MapPin,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import {
  Lead,
  Section,
  P,
  Highlight,
  TocNav,
  IngredientGrid,
  IngredientCard,
  CrowdLegend,
  TouchpointList,
  FaqList,
} from '../_fancast-ui';

const FAQ = [
  {
    question: 'Wie genau sind die Prognosen von Fancast?',
    answer:
      'Die aktuelle Genauigkeit steht live oben auf dieser Seite — als MAE (durchschnittliche Abweichung in Minuten), RMSE und MAPE. Diese Werte stammen aus dem echten Abgleich vergangener Vorhersagen mit den tatsächlich gemessenen Wartezeiten, nicht aus einem geschönten Testlabor. Sie ändern sich, sobald das Modell neu trainiert hat.',
  },
  {
    question: 'Wie weit im Voraus kann Fancast vorhersagen?',
    answer:
      'Tagesgenaue Crowd-Level für einen Park liefert Fancast bis zu 365 Tage im Voraus. Für einzelne Attraktionen gibt es zusätzlich stündliche Wartezeit-Prognosen. Je näher der Tag rückt, desto stärker fließen kurzfristige Signale wie die Wetterprognose mit ein.',
  },
  {
    question: 'Wie oft wird das Modell aktualisiert?',
    answer:
      'Jeden Tag. Fancast trainiert sich automatisch einmal täglich um 06:00 UTC mit den frischesten Daten neu — inklusive der Wartezeiten von gestern. Es wird also buchstäblich jeden Morgen ein kleines bisschen besser.',
  },
  {
    question: 'Welche Daten nutzt Fancast?',
    answer:
      'Live- und historische Wartezeiten aus über 150 Parks, Schul- und Feiertagskalender (auch aus Nachbarregionen), Wetterprognosen, Öffnungszeiten, Sonderevents und saisonale Muster. Aus diesem Mix entstehen die tagesgenauen Crowd-Level und die stündlichen Wartezeit-Prognosen.',
  },
  {
    question: 'Warum zeigt ein Park „Keine Prognose"?',
    answer:
      'Fancast bewertet einen Park erst, wenn genügend Betriebsdaten vorliegen — mindestens rund 30 Betriebstage. Für ganz neue oder selten geöffnete Parks fehlt diese Grundlage noch. Dann zeigen wir lieber ehrlich „Keine Prognose" als eine geratene Zahl.',
  },
  {
    question: 'Kostet Fancast etwas?',
    answer:
      'Nein. Wie ganz park.fan sind alle Prognosen, Crowd-Kalender und Statistiken kostenlos, werbefrei und ohne Konto nutzbar.',
  },
] as const;

export function ContentDE() {
  return (
    <div className="space-y-14 text-base leading-7">
      {/* Intro */}
      <div className="space-y-5">
        <Lead>
          Fancast ist unser hauseigenes Prognose-Modell — der Teil von park.fan, der in die Zukunft
          schaut. Der Name? Reiner Größenwahn mit System: <strong>fan</strong> wie park.
          <strong>fan</strong>, <strong>cast</strong> wie fore<strong>cast</strong>. Ein
          Wetterbericht für Warteschlangen, quasi.
        </Lead>
        <P>
          Die Idee ist so simpel wie größenwahnsinnig: Fancast liest Millionen echter
          Live-Wartezeiten und sagt dir voraus, wie voll ein Park an einem beliebigen Tag wird — bis
          zu 365 Tage im Voraus. Ob sich der Samstag lohnt oder du dir mit dem Dienstag einen
          Gefallen tust. Grün, gelb oder rot, lange bevor du im Auto sitzt.
        </P>
        <P>
          Und weil wir Zahlen grundsätzlich nur trauen, wenn sie sich beweisen müssen, macht Fancast
          etwas, das sich die wenigsten Modelle trauen: Es benotet sich selbst. Jede Vorhersage wird
          später gegen die tatsächlich gemessene Wartezeit gehalten — öffentlich, hier auf dieser
          Seite. Schummeln zwecklos.
        </P>
        <Highlight>
          Kurz gesagt: Fancast ist kein Wahrsager mit Glaskugel, sondern ein notorischer Statistiker,
          der jeden Abend Nachhilfe bekommt und am nächsten Morgen noch mal ranmuss. Ein Wetterfrosch,
          der sein eigenes Wetter nachprüft.
        </Highlight>

        <TocNav
          label="Inhaltsverzeichnis"
          items={[
            ['#note', 'Die Live-Note'],
            ['#zutaten', 'Was Fancast füttert'],
            ['#training', 'Wie Fancast lernt'],
            ['#level', 'Grün, Gelb, Rot'],
            ['#wo', 'Wo du Fancast triffst'],
            ['#grenzen', 'Wo die Grenzen sind'],
            ['#faq', 'Häufige Fragen'],
          ]}
        />
      </div>

      {/* Live scorecard — reuses the homepage ML section (live from the dashboard) */}
      <div id="note" className="scroll-mt-20 space-y-4">
        <P>
          Genug der Vorrede — hier die Zeugnisnote, live und ungeschönt. Diese Zahlen zieht Fancast in
          diesem Moment aus dem eigenen Dashboard; sie ändern sich, sobald das Modell heute Nacht
          wieder trainiert hat:
        </P>
      </div>
      <div className="-mx-4">
        <MLStatsSection />
      </div>

      {/* What it reads */}
      <Section id="zutaten" title="Was Fancast füttert" icon={Database}>
        <P>
          Ein verregneter Brückentag im Oktober ist eben etwas völlig anderes als ein sonniger
          Ferien-Samstag im Juli — und genau das muss ein Modell erst einmal lernen. Fancast füttert
          sich dafür aus mehreren Quellen gleichzeitig:
        </P>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Live-Wartezeiten">
            Millionen echter Messwerte aus 150+ Parks, im Minutentakt. Die Rohwährung jeder Prognose.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Kalender & Ferien">
            Wochenenden, Feiertage und Schulferien — auch die der Nachbarregionen, denn Tagesgäste
            kennen keine Landesgrenzen.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Wetter">
            Regenwahrscheinlichkeit und Temperatur biegen die kurzfristigen Prognosen zurecht. Sonne
            zieht an, Dauerregen leert die Wege.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Events & Saison">
            Halloween, Sommerferien, Brückentage, Neuheiten im ersten Sommer — die üblichen
            Verdächtigen für volle Tage.
          </IngredientCard>
          <IngredientCard icon={History} title="Historie">
            Jahre an Wartezeit-Verlauf pro Park. Muster, die man nur sieht, wenn man lange genug
            hinschaut.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Öffnungszeiten & Kapazität">
            Wann öffnet der Park, wie lange, mit wie viel Betrieb — der Rahmen, in den sich alles
            andere einfügt.
          </IngredientCard>
        </IngredientGrid>
        <P>
          Aus diesem Gemenge macht das Modell zwei Dinge: eine <strong>stündliche
          Wartezeit-Prognose</strong> für einzelne Attraktionen und eine{' '}
          <strong>tagesgenaue Crowd-Level-Note</strong> für den ganzen Park.
        </P>
      </Section>

      {/* How it learns */}
      <Section id="training" title="Wie Fancast lernt (und nicht schummeln kann)" icon={RefreshCw}>
        <P>
          Der wichtigste Trick ist ein unspektakulärer: Fancast trainiert sich{' '}
          <strong>jede Nacht neu</strong>, jeden Tag um 06:00 UTC. Was gestern passiert ist, weiß das
          Modell heute. Ein Achterbahn-Fan wird mit den Jahren älter und müder — Fancast wird jeden
          Morgen ein bisschen schlauer.
        </P>
        <P>
          Getestet wird dabei nur an Tagen, die das Modell <strong>noch nie gesehen hat</strong> — an
          der Zukunft, nicht an auswendig gelernten Vergangenheitstagen. Alles andere wäre, als würde
          man sich die Klausurfragen vorher selbst zustecken und sich dann für sein Einser-Zeugnis
          feiern.
        </P>
        <P>
          Zusätzlich beobachtet Fancast, ob es mit der Zeit <strong>abdriftet</strong> — ob die
          Realität ihm langsam davonläuft. Und neue Modellversionen gehen nur dann live, wenn sie im
          fairen Vergleich die alte tatsächlich schlagen. Demokratie unter Algorithmen: Wer nicht
          besser ist, bleibt auf der Ersatzbank.
        </P>
      </Section>

      {/* Crowd levels */}
      <Section id="level" title="Grün, Gelb, Rot: die Crowd-Level" icon={Gauge}>
        <P>
          Am Ende dieser ganzen Rechnerei steht eine einzige Farbe. Sechs Stufen von „hier hast du den
          Park fast für dich" bis „willkommen im Ferien-Samstag":
        </P>
        <CrowdLegend
          items={[
            {
              level: 'very_low',
              text: 'Fast leer. Rope-Drop-Träume, Fahrten am Stück, Foto mit dem Maskottchen ohne Schlange.',
            },
            {
              level: 'low',
              text: 'Entspannt. Kurze Wartezeiten, du kommst überall dran, ohne einen Schlachtplan zu brauchen.',
            },
            {
              level: 'moderate',
              text: 'Normaler Betrieb. Die Headliner ziehen an, der Rest bleibt gemütlich. Ein guter Kompromiss-Tag.',
            },
            {
              level: 'high',
              text: 'Spürbar voll. Bei den Top-Attraktionen lohnt sich frühes Aufstehen — oder Geduld mitbringen.',
            },
            {
              level: 'very_high',
              text: 'Richtig was los. Lange Schlangen an den Highlights, Planung schlägt Spontaneität deutlich.',
            },
            {
              level: 'extreme',
              text: 'Ausnahmezustand. Ferien-Samstag im Hochsommer. Nur mit Strategie, Sitzfleisch und Humor zu empfehlen.',
            },
          ]}
        />
      </Section>

      {/* Where you meet it */}
      <Section id="wo" title="Wo dir Fancast überall begegnet" icon={MapPin}>
        <P>
          Fancast lebt nicht auf einer einsamen Unterseite — es steckt überall in park.fan, meist ohne
          sich groß vorzustellen:
        </P>
        <TouchpointList
          items={[
            {
              title: 'Prognose heute',
              body: 'die Crowd-Level-Note im Park-Header, noch bevor du die erste Attraktion anklickst.',
            },
            {
              title: 'Crowd-Kalender',
              body: (
                <>
                  der <Link href="/parks">Kalender der besten Besuchstage</Link> auf jeder Parkseite —
                  grün, gelb, rot, bis zu ein Jahr im Voraus.
                </>
              ),
            },
            {
              title: 'Beste Reisezeit',
              body: 'die ruhigsten Wochentage und die kommenden Geheimtipp-Tage, aus denselben Daten destilliert.',
            },
            {
              title: 'KI-Prognose im Wartezeit-Chart',
              body: 'die gestrichelte Linie, die dir die günstigsten Zeitfenster einer Attraktion verrät.',
            },
            {
              title: 'Rope-Drop-Empfehlung',
              body: 'die ehrliche Antwort auf „lohnt es sich, früh da zu sein?" — inklusive der erwarteten Tiefstwerte.',
            },
          ]}
        />
        <P>
          Wie das alles im Park zusammenspielt, erklärt die{' '}
          <Link href="/howto">vollständige Anleitung</Link> Schritt für Schritt.
        </P>
      </Section>

      {/* Limits */}
      <Section id="grenzen" title="Wo Fancast (noch) nicht mitredet" icon={ShieldAlert}>
        <P>
          Fancast ist gut, aber nicht größenwahnsinnig — und sagt dir auch, wann es lieber den Mund
          hält. Für Parks mit <strong>weniger als rund 30 Betriebstagen</strong> an Daten gibt es
          schlicht keine Note; dann steht dort ehrlich „Keine Prognose" statt einer geratenen Zahl:
        </P>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <CrowdLevelBadge level="unknown" />
          <span className="text-muted-foreground text-sm leading-relaxed">
            Noch nicht bewertbar — zu wenige Betriebstage, um seriös eine Farbe zu vergeben.
          </span>
        </div>
        <P>
          Und selbst wo Fancast eine Meinung hat, liefert es sie mit <strong>Confidence</strong> —
          einem ehrlichen „ziemlich sicher" oder „eher Bauchgefühl". Neue Parks, exotische
          Sonderevents, ein erstes Winterfest: Da lernt das Modell noch. Es wird mit jeder Saison
          besser — versprochen ist nur, dass wir nichts beschönigen.
        </P>
      </Section>

      {/* FAQ */}
      <Section id="faq" title="Häufige Fragen zu Fancast" icon={HelpCircle}>
        <FaqList items={FAQ} />
      </Section>
    </div>
  );
}
