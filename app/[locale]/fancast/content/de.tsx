/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { Link } from '@/i18n/navigation';
import { MLStatsSection } from '@/components/home/ml-stats-section';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { PopularParksGrid } from '@/components/home/featured-parks-slot';
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
  HelpCircle,
  Compass,
  Ticket,
  Palette,
  CalendarCheck,
  CalendarRange,
  LineChart,
  Sunrise,
} from 'lucide-react';
import {
  Lead,
  SectionShell,
  P,
  PG,
  Highlight,
  SplitFigure,
  CrowdSpectrum,
  IngredientGrid,
  IngredientCard,
  TouchpointGrid,
  FaqList,
} from '../_fancast-ui';
import { FancastLive, type FancastLiveLabels } from '../_fancast-live';

const LIVE_LABELS: FancastLiveLabels = {
  edition: 'Aktuelle Edition',
  trained: 'Trainiert',
  basis: 'Trainingsbasis',
  datapoints: '{n} Datenpunkte',
  days: 'über {d} Tage',
  vsPrevious: 'Gegenüber {v}',
  moreAccurate: 'genauer',
  topTitle: 'Wo Fancast zuletzt am treffsichersten war',
  topIntro:
    'Die Attraktionen, bei denen die jüngsten Prognosen am nächsten an der echten Wartezeit lagen — durchschnittliche Abweichung in Minuten, live aus dem Modell.',
  colAttraction: 'Attraktion',
  colPark: 'Park',
  colError: 'Ø-Fehler',
  minUnit: 'Min.',
};

const FAQ = [
  {
    question: 'Wie genau sind die Prognosen von Fancast?',
    answer:
      'Die aktuelle Genauigkeit steht live oben in der Scorecard — als MAE (durchschnittliche Abweichung in Minuten), RMSE und MAPE. Diese Werte stammen aus dem echten Abgleich vergangener Vorhersagen mit den tatsächlich gemessenen Wartezeiten, nicht aus einem geschönten Testlabor. Sie ändern sich, sobald das Modell neu trainiert hat.',
  },
  {
    question: 'Wie weit im Voraus kann Fancast vorhersagen?',
    answer:
      'Tagesgenaue Crowd-Level für einen Park liefert Fancast bis zu 365 Tage im Voraus. Für einzelne Attraktionen gibt es zusätzlich stündliche Wartezeit-Prognosen. Je näher der Tag rückt, desto stärker fließen kurzfristige Signale wie die Wetterprognose mit ein.',
  },
  {
    question: 'Woher weiß Fancast, dass ein Ferien-Samstag voll wird?',
    answer:
      'Aus dem Zusammenspiel vieler Signale: Schulferien- und Feiertagskalender (auch der Nachbarregionen), Wochentag, Wetterprognose, Sonderevents und der kompletten Wartezeit-Historie des Parks. Ein Ferien-Samstag im Hochsommer trägt fast alle dieser Faktoren gleichzeitig — deshalb schlägt die Prognose dort nach oben aus, während ein verregneter Dienstag im November grün bleibt.',
  },
  {
    question: 'Wie oft wird das Modell aktualisiert?',
    answer:
      'Jeden Tag. Fancast trainiert sich automatisch einmal täglich um 06:00 UTC mit den frischesten Daten neu — inklusive der Wartezeiten von gestern. Es wird also buchstäblich jeden Morgen ein kleines bisschen besser.',
  },
  {
    question: 'Kann ich Fancast für einen bestimmten Park und Tag nutzen?',
    answer:
      'Ja. Jede Parkseite auf park.fan hat einen Crowd-Kalender, der dir für jeden einzelnen Tag bis zu ein Jahr im Voraus eine grüne, gelbe oder rote Prognose zeigt — vom Europa-Park über Phantasialand und Efteling bis zu Walt Disney World. Zusätzlich bekommst du stündliche Wartezeit-Prognosen für die einzelnen Attraktionen.',
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
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          Fancast ist unser hauseigenes Prognose-Modell — der Teil von park.fan, der in die Zukunft
          schaut. Der Name? Reiner Größenwahn mit System: <strong>fan</strong> wie park.
          <strong>fan</strong>, <strong>cast</strong> wie fore<strong>cast</strong>. Ein
          Wetterbericht für Warteschlangen, quasi.
        </Lead>
        <P>
          Und weil wir Zahlen grundsätzlich nur trauen, wenn sie sich beweisen müssen, macht Fancast
          etwas, das sich die wenigsten Modelle trauen: Es benotet sich selbst. Jede Vorhersage wird
          später gegen die tatsächlich gemessene Wartezeit gehalten — öffentlich, auf dieser Seite.
          Schummeln zwecklos.
        </P>
        <Highlight>
          Kurz gesagt: Fancast ist kein Wahrsager mit Glaskugel, sondern ein notorischer Statistiker,
          der jeden Abend Nachhilfe bekommt und am nächsten Morgen noch mal ranmuss. Ein Wetterfrosch,
          der sein eigenes Wetter nachprüft.
        </Highlight>
      </div>

      {/* 01 — Scorecard (live) */}
      <SectionShell
        id="note"
        index="01"
        kicker="Die Zeugnisnote"
        title="Wie gut ist Fancast wirklich?"
        icon={Gauge}
      >
        <P>
          Genug der Vorrede — hier die Note, live und ungeschönt. Diese Zahlen zieht Fancast in diesem
          Moment aus dem eigenen Dashboard; sie ändern sich, sobald das Modell heute Nacht wieder
          trainiert hat.
        </P>
        <div className="overflow-hidden rounded-2xl border">
          <MLStatsSection />
        </div>
        <FancastLive labels={LIVE_LABELS} />
      </SectionShell>

      {/* 02 — What it reads */}
      <SectionShell
        id="zutaten"
        index="02"
        kicker="Die Zutaten"
        title="Was Fancast füttert"
        icon={Database}
      >
        <PG>
          Ein verregneter Brückentag im Oktober ist eben etwas völlig anderes als ein sonniger
          Ferien-Samstag im Juli — und genau das muss ein Modell erst einmal lernen. Fancast füttert
          sich dafür aus mehreren Quellen gleichzeitig:
        </PG>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Live-Wartezeiten" delay={0}>
            Millionen echter Messwerte aus 150+ Parks, im Minutentakt. Die Rohwährung jeder Prognose.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Kalender & Ferien" delay={60}>
            Wochenenden, Feiertage und Schulferien — auch die der Nachbarregionen, denn Tagesgäste
            kennen keine Landesgrenzen.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Wetter" delay={120}>
            Regenwahrscheinlichkeit und Temperatur biegen die kurzfristigen Prognosen zurecht. Sonne
            zieht an, Dauerregen leert die Wege.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Events & Saison" delay={0}>
            Halloween, Sommerferien, Brückentage, Neuheiten im ersten Sommer — die üblichen
            Verdächtigen für volle Tage.
          </IngredientCard>
          <IngredientCard icon={History} title="Historie" delay={60}>
            Jahre an Wartezeit-Verlauf pro Park. Muster, die man nur sieht, wenn man lange genug
            hinschaut.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Öffnungszeiten & Kapazität" delay={120}>
            Wann öffnet der Park, wie lange, mit wie viel Betrieb — der Rahmen, in den sich alles
            andere einfügt.
          </IngredientCard>
        </IngredientGrid>
        <P>
          Aus diesem Gemenge macht das Modell zwei Dinge: eine <strong>stündliche
          Wartezeit-Prognose</strong> für einzelne Attraktionen und eine{' '}
          <strong>tagesgenaue Crowd-Level-Note</strong> für den ganzen Park.
        </P>
      </SectionShell>

      {/* 03 — Concrete park examples */}
      <SectionShell
        id="beispiele"
        index="03"
        kicker="An echten Parks"
        title="Fancast an drei Parks"
        icon={Compass}
      >
        <P>
          Grau ist alle Theorie — greifbar wird Fancast erst am konkreten Park. Drei Beispiele, wie
          aus denselben Zutaten drei völlig verschiedene Prognosen werden:
        </P>
        <SplitFigure
          src="/images/parks/europa-park/silver-star.jpg"
          alt="Silver Star im Europa-Park"
          kicker="Europa-Park · Brückentag im Oktober"
          title="Ruhig, grün, unter 30 Minuten"
          badge={<CrowdLevelBadge level="very_low" />}
        >
          Fancast sieht: Schulferien nur in einem einzigen Nachbar-Bundesland, Wetter durchwachsen,
          kein Sonderevent. Ergebnis: eine ruhige, grüne Prognose — Voltron Nevera vermutlich unter 30
          Minuten, blue fire zum Mitnehmen. Derselbe Park drei Wochen später am Ferien-Samstag?
          Tiefrot. Sechs Millionen Jahresgäste verteilen sich eben nicht von allein.
        </SplitFigure>
        <SplitFigure
          src="/images/parks/phantasialand/taron.jpg"
          alt="Taron im Phantasialand rast durch Klugheim"
          kicker="Phantasialand · Ferien-Samstag"
          title="Kompakt, voll, orange bis rot"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          Kompakter Park, wenige Headliner, alle wollen zu Taron — die Sättigung ist schneller
          erreicht, als das erste Bier gezapft ist. Fancast weiß das und malt den Tag orange bis rot.
          Der Kalender daneben schlägt dir gleich den Dienstag drauf vor, an dem du Taron am Stück
          fahren kannst, statt ihn nur anzuschmachten.
        </SplitFigure>
        <SplitFigure
          src="/images/parks/efteling/baron-1898.jpg"
          alt="Baron 1898 in der Efteling"
          kicker="Efteling · verregneter Dienstag im November"
          title="Der Geheimtipp, den das Modell mitrechnet"
          badge={<CrowdLevelBadge level="low" />}
        >
          Genau der Tag, den Bauchgefühl-Planer meiden — und den Fancast grün färbt. Wenig Ferien,
          mieses Wetter, kurze Schlangen. Das funktioniert exakt so lange, bis alle denselben
          Geheimtipp gelesen haben; deshalb rechnet das Modell die Regenwahrscheinlichkeit gleich
          selbst mit ein, statt sich auf Folklore zu verlassen.
        </SplitFigure>
      </SectionShell>

      {/* 04 — How it learns */}
      <SectionShell
        id="training"
        index="04"
        kicker="Die Methode"
        title="Wie Fancast lernt (und nicht schummeln kann)"
        icon={RefreshCw}
      >
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
      </SectionShell>

      {/* 05 — Crowd levels */}
      <SectionShell
        id="level"
        index="05"
        kicker="Die Skala"
        title="Grün, Gelb, Rot: die Crowd-Level"
        icon={Palette}
      >
        <PG>
          Am Ende dieser ganzen Rechnerei steht eine einzige Farbe. Sechs Stufen von „hier hast du den
          Park fast für dich" bis „willkommen im Ferien-Samstag":
        </PG>
        <CrowdSpectrum
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
              text: 'Ausnahmezustand. Ferien-Samstag im Hochsommer. Nur mit Strategie, Sitzfleisch und Humor.',
            },
          ]}
        />
      </SectionShell>

      {/* 06 — Try a real park */}
      <SectionShell
        id="parks"
        index="06"
        kicker="Selbst ausprobieren"
        title="Schnapp dir einen Park"
        icon={Ticket}
      >
        <P>
          Genug Theorie. Fancast läuft auf jeder Parkseite mit — hier ein paar beliebte zum direkten
          Ausprobieren. Klick dich rein, öffne den Crowd-Kalender und schau, welche Farbe dein
          Wunschtag hat:
        </P>
        <PopularParksGrid />
      </SectionShell>

      {/* 07 — Where you meet it */}
      <SectionShell
        id="wo"
        index="07"
        kicker="Überall im Park"
        title="Wo dir Fancast begegnet"
        icon={MapPin}
      >
        <P>
          Fancast lebt nicht auf einer einsamen Unterseite — es steckt überall in park.fan, meist ohne
          sich groß vorzustellen:
        </P>
        <TouchpointGrid
          items={[
            {
              icon: CalendarCheck,
              title: 'Prognose heute',
              body: 'die Crowd-Level-Note im Park-Header, noch bevor du die erste Attraktion anklickst.',
            },
            {
              icon: CalendarRange,
              title: 'Crowd-Kalender',
              body: (
                <>
                  der <Link href="/parks">Kalender der besten Besuchstage</Link> auf jeder Parkseite —
                  grün, gelb, rot, bis zu ein Jahr im Voraus.
                </>
              ),
            },
            {
              icon: CalendarDays,
              title: 'Beste Reisezeit',
              body: 'die ruhigsten Wochentage und die kommenden Geheimtipp-Tage, aus denselben Daten destilliert.',
            },
            {
              icon: LineChart,
              title: 'KI-Prognose im Wartezeit-Chart',
              body: 'die gestrichelte Linie, die dir die günstigsten Zeitfenster einer Attraktion verrät.',
            },
            {
              icon: Sunrise,
              title: 'Rope-Drop-Empfehlung',
              body: 'die ehrliche Antwort auf „lohnt es sich, früh da zu sein?" — inklusive der erwarteten Tiefstwerte.',
            },
            {
              icon: HelpCircle,
              title: 'Keine Prognose',
              body: (
                <>
                  ehrlich statt geraten: Parks mit zu wenig Daten bekommen{' '}
                  <CrowdLevelBadge level="unknown" /> statt einer erfundenen Zahl.
                </>
              ),
            },
          ]}
        />
        <P>
          Wie das alles im Park zusammenspielt, erklärt die{' '}
          <Link href="/howto">vollständige Anleitung</Link> Schritt für Schritt — inklusive
          Crowd-Kalender, Badges und Live-Wartezeiten.
        </P>
      </SectionShell>

      {/* 08 — FAQ */}
      <SectionShell
        id="faq"
        index="08"
        kicker="Kurz & knapp"
        title="Häufige Fragen zu Fancast"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>
    </>
  );
}
