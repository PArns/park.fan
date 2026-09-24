import React from 'react';
import { Link } from '@/i18n/navigation';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
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
  datapoints: '{n} Messwerte',
  days: 'über {d} Tage',
  vsPrevious: 'Gegenüber {v}',
  moreAccurate: 'genauer',
  topTitle: 'Wo Fancast zuletzt am treffsichersten war',
  topIntro:
    'Die Attraktionen, bei denen die jüngsten Prognosen am dichtesten an der echten Wartezeit lagen. Angegeben ist die durchschnittliche Abweichung in Minuten, live aus dem Modell.',
  colAttraction: 'Attraktion',
  colPark: 'Park',
  colError: 'Ø-Fehler',
  minUnit: 'Min.',
};

const FAQ = [
  {
    question: 'Wie genau sind die Prognosen von Fancast?',
    answer:
      'Die aktuelle Genauigkeit steht live weiter oben auf dieser Seite, als MAE (durchschnittliche Abweichung in Minuten), RMSE und MAPE. Die Werte kommen aus dem Abgleich vergangener Vorhersagen mit den Wartezeiten, die danach tatsächlich gemessen wurden. Nach jedem Training ändern sie sich.',
  },
  {
    question: 'Wie weit im Voraus kann Fancast vorhersagen?',
    answer:
      'Tagesgenaue Crowd-Level liefert Fancast für jeden Tag, den ein Park schon veröffentlicht hat. Für einzelne Attraktionen gibt es zusätzlich stündliche Wartezeit-Prognosen. Je näher der Tag rückt, desto stärker fließen kurzfristige Signale wie die Wetterprognose mit ein.',
  },
  {
    question: 'Woher weiß Fancast, dass ein Ferien-Samstag voll wird?',
    answer:
      'Aus mehreren Signalen, die es zusammen liest: Schulferien- und Feiertagskalender (auch der Nachbarregionen), Wochentag, Wetterprognose, Sonderevents und die komplette Wartezeit-Historie des Parks. Ein Ferien-Samstag im Hochsommer bringt fast alle diese Faktoren auf einmal mit. Deshalb schlägt die Prognose dort nach oben aus, während ein verregneter Dienstag im November grün bleibt.',
  },
  {
    question: 'Wie oft wird das Modell aktualisiert?',
    answer:
      'Jeden Tag. Fancast trainiert sich automatisch einmal täglich um 06:00 UTC neu, mit den Wartezeiten von gestern.',
  },
  {
    question: 'Kann ich Fancast für einen bestimmten Park und Tag nutzen?',
    answer:
      'Ja. Jede Parkseite auf park.fan hat einen Crowd-Kalender, der dir für jeden veröffentlichten Tag eine grüne, gelbe oder rote Prognose zeigt, vom Europa-Park über das Phantasialand und das Efteling bis zu Walt Disney World. Dazu kommen stündliche Wartezeit-Prognosen für die einzelnen Attraktionen.',
  },
  {
    question: 'Welche Daten nutzt Fancast?',
    answer:
      'Live- und historische Wartezeiten aus über 200 Parks, Schul- und Feiertagskalender (auch aus Nachbarregionen), Wetterprognosen, Öffnungszeiten, Sonderevents und saisonale Muster. Aus diesem Mix entstehen die tagesgenauen Crowd-Level und die stündlichen Wartezeit-Prognosen.',
  },
  {
    question: 'Warum zeigt ein Park „Keine Prognose“?',
    answer:
      'Fancast bewertet einen Park erst, wenn genügend Betriebsdaten vorliegen, also mindestens rund 30 Betriebstage. Für ganz neue oder selten geöffnete Parks fehlt diese Grundlage noch. Dann steht dort „Keine Prognose“ statt einer geratenen Zahl.',
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
          Fancast ist unser eigenes Prognose-Modell, also der Teil von park.fan, der heute schon
          wissen will, wie lang die Schlange am Samstag wird. Den Namen haben wir uns ohne
          Werbeagentur ausgedacht, und man merkt es: <strong>fan</strong> wie park.
          <strong>fan</strong>, <strong>cast</strong> wie fore<strong>cast</strong>. Ein
          Wetterbericht für Warteschlangen, nur ohne Moderatorin vor der Karte.
        </Lead>
        <P>
          Vorhersagen, die keiner nachprüft, kann jedes Horoskop. Fancast muss dagegen jeden Tag zur
          Zeugnisausgabe, und das Zeugnis hängt öffentlich auf dieser Seite.
        </P>
        <Highlight>
          Jede Prognose wird am Tag darauf gegen die gemessene Wartezeit gelegt. Was dabei
          herauskommt, steht im nächsten Abschnitt als MAE, RMSE und MAPE, auch an schlechten Tagen.
        </Highlight>
      </div>

      {/* 01 – Scorecard (live) */}
      <SectionShell
        id="note"
        index="01"
        kicker="Die Zeugnisnote"
        title="Wie gut ist Fancast wirklich?"
        icon={Gauge}
      >
        <P>
          Die Noten hier kommen live aus dem Modell, nicht aus einer Pressemappe. Mit dem nächsten
          Trainingslauf morgen früh ändern sie sich, also bitte nicht einrahmen.
        </P>
        <div className="overflow-hidden rounded-2xl border">
          <MLStatsSection />
        </div>
        <FancastLive labels={LIVE_LABELS} />
      </SectionShell>

      {/* 02 – What it reads */}
      <SectionShell
        id="zutaten"
        index="02"
        kicker="Die Zutaten"
        title="Was Fancast füttert"
        icon={Database}
      >
        <PG>
          Wer oft in Parks geht, weiß: Ein verregneter Brückentag im Oktober und ein sonniger
          Ferien-Samstag im Juli sind zwei verschiedene Sportarten. Ein Modell muss das erst lernen,
          und dafür liest Fancast sechs Quellen gleichzeitig:
        </PG>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Live-Wartezeiten" delay={0}>
            Alle fünf Minuten eine Messung je Warteschlange, aus über 200 Parks. Darauf baut alles
            andere auf.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Kalender & Ferien" delay={60}>
            Wochenenden, Feiertage und Schulferien, auch die der Nachbarregionen. Tagesgäste aus den
            Niederlanden richten sich nun mal nicht nach dem Ferienplan von NRW.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Wetter" delay={120}>
            Regenwahrscheinlichkeit und Temperatur biegen die kurzfristigen Prognosen zurecht. Sonne
            lockt alle raus, Dauerregen schickt sie aufs Sofa.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Events & Saison" delay={0}>
            Halloween, Sommerferien, Brückentage, Neuheiten im ersten Sommer: die üblichen
            Verdächtigen für volle Tage.
          </IngredientCard>
          <IngredientCard icon={History} title="Historie" delay={60}>
            Jeder mitgeschriebene Öffnungstag eines Parks, seit April 2026 lückenlos. Daraus kommt
            der Wochen- und Saisonrhythmus.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Öffnungszeiten & Kapazität" delay={120}>
            Wann öffnet der Park, wie lange, mit wie viel Betrieb. Das ist der Rahmen, in den der
            Rest passen muss.
          </IngredientCard>
        </IngredientGrid>
        <P>
          Aus diesem Eintopf kocht das Modell zwei Dinge: eine{' '}
          <strong>stündliche Wartezeit-Prognose</strong> für einzelne Attraktionen und eine{' '}
          <strong>tagesgenaue Crowd-Level-Note</strong> für den ganzen Park.
        </P>
      </SectionShell>

      {/* 03 – Concrete park examples */}
      <SectionShell
        id="beispiele"
        index="03"
        kicker="An echten Parks"
        title="Fancast an drei Parks"
        icon={Compass}
      >
        <P>
          Aus denselben Zutaten werden je nach Park und Datum ganz verschiedene Tage. Drei
          Beispiele:
        </P>
        <SplitFigure
          src="/media/europa-park/silver-star.jpg"
          alt="Silver Star im Europa-Park"
          kicker="Europa-Park · Brückentag im Oktober"
          title="Ruhig, grün, unter 30 Minuten"
          badge={<CrowdLevelBadge level="very_low" />}
        >
          Fancast sieht Schulferien in genau einem Nachbar-Bundesland, durchwachsenes Wetter und
          kein Sonderevent. Heraus kommt eine ruhige, grüne Prognose: Voltron Nevera vermutlich
          unter 30 Minuten, blue fire fast im Vorbeigehen. Derselbe Park drei Wochen später an einem
          Ferien-Samstag ist tiefrot, weil sich sechs Millionen Jahresgäste nun mal nicht freiwillig
          gleichmäßig übers Jahr verteilen.
        </SplitFigure>
        <SplitFigure
          src="/media/phantasialand/taron.jpg"
          alt="Taron im Phantasialand rast durch Klugheim"
          kicker="Phantasialand · Ferien-Samstag"
          title="Kompakt, voll, orange bis rot"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          Kompakter Park, wenige Headliner, und alle wollen zu Taron. Voll ist es hier schneller,
          als am Kiosk das erste Bier gezapft ist. Fancast weiß das und malt den Tag orange bis rot.
          Der Crowd-Kalender auf der Parkseite schlägt dir dafür gleich einen Dienstag vor, an dem
          du Taron mehrmals hintereinander fahren kannst, statt ihn nur vom Weg aus anzuschmachten.
        </SplitFigure>
        <SplitFigure
          src="/media/efteling/baron-1898.jpg"
          alt="Baron 1898 im Efteling"
          kicker="Efteling · verregneter Dienstag im November"
          title="Der Geheimtipp, den das Modell mitrechnet"
          badge={<CrowdLevelBadge level="low" />}
        >
          Genau den Tag, den Bauchgefühl-Planer meiden, färbt Fancast grün: kaum Ferien, mieses
          Wetter, kurze Schlangen. Nasse Socken gibt es gratis dazu. Der Haken an jedem Geheimtipp
          ist, dass er nur hält, bis ihn alle gelesen haben. Deshalb rechnet das Modell die
          Regenwahrscheinlichkeit für genau diesen Tag selbst mit ein, statt der Folklore zu
          glauben.
        </SplitFigure>
      </SectionShell>

      {/* 04 – How it learns */}
      <SectionShell
        id="training"
        index="04"
        kicker="Die Methode"
        title="Wie Fancast lernt (und nicht schummeln kann)"
        icon={RefreshCw}
      >
        <P>
          Der wichtigste Trick ist ungefähr so aufregend wie Zähneputzen. Fancast trainiert sich{' '}
          <strong>einmal am Tag neu</strong>, um 06:00 UTC. Was gestern im Park passiert ist, steckt
          ab dem nächsten Morgen in der Prognose.
        </P>
        <P>
          Getestet wird nur an Tagen, die das Modell <strong>noch nie gesehen hat</strong>. Alles
          andere wäre, als würde man sich die Klausurfragen vorher selbst zustecken und dann die
          Eins feiern.
        </P>
        <P>
          Außerdem prüft Fancast, ob es mit der Zeit <strong>abdriftet</strong>, ob ihm die Realität
          also langsam davonläuft. Eine neue Modellversion geht erst live, wenn sie die alte im
          direkten Vergleich schlägt. Befördert wird hier nur, wer wirklich besser ist, was man
          nicht von jeder Firma behaupten kann.
        </P>
      </SectionShell>

      {/* 05 – Crowd levels */}
      <SectionShell
        id="level"
        index="05"
        kicker="Die Skala"
        title="Grün, Gelb, Rot: die Crowd-Level"
        icon={Palette}
      >
        <PG>
          Am Ende dieser ganzen Rechnerei steht eine einzige Farbe. Sechs Stufen von „hier hast du
          den Park fast für dich“ bis „willkommen im Ferien-Samstag“:
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
              text: 'Normaler Betrieb. An den Headlinern wird es voller, der Rest bleibt gemütlich. Ein grober Plan reicht.',
            },
            {
              level: 'high',
              text: 'Spürbar voll. Für die großen Bahnen lohnt sich der Wecker, sonst brauchst du Geduld und ein Hörbuch.',
            },
            {
              level: 'very_high',
              text: 'Richtig was los. Lange Schlangen an den großen Bahnen, und wer spontan bleibt, verbringt den Tag im Zickzack-Gitter.',
            },
            {
              level: 'extreme',
              text: 'Ausnahmezustand. Ferien-Samstag im Hochsommer. Nur mit Strategie, Sitzfleisch und Humor.',
            },
          ]}
        />
      </SectionShell>

      {/* 06 – Try a real park */}
      <SectionShell
        id="parks"
        index="06"
        kicker="Selbst ausprobieren"
        title="Schnapp dir einen Park"
        icon={Ticket}
      >
        <P>
          Fancast läuft auf jeder Parkseite mit. Hier ein paar beliebte zum Ausprobieren: Park
          anklicken, Crowd-Kalender öffnen und nachsehen, welche Farbe dein Wunschtag hat. Ist er
          rot, lohnt ein Blick auf die Tage drumherum.
        </P>
        <PopularParksGrid />
      </SectionShell>

      {/* 07 – Where you meet it */}
      <SectionShell
        id="wo"
        index="07"
        kicker="Überall im Park"
        title="Wo dir Fancast begegnet"
        icon={MapPin}
      >
        <P>
          Diese Seite ist bloß das Büro. Zu tun hat Fancast überall sonst auf park.fan, und es
          stellt sich dabei selten vor:
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
                  der <Link href="/parks">Kalender der besten Besuchstage</Link> auf jeder
                  Parkseite: grün, gelb, rot, so weit der Zeitplan reicht.
                </>
              ),
            },
            {
              icon: CalendarDays,
              title: 'Beste Reisezeit',
              body: (
                <>
                  die ruhigsten Wochentage und die kommenden Geheimtipp-Tage, aus denselben Daten
                  gezogen. Wirf einen Blick auf die{' '}
                  <Link href={`/${BEST_TIME_SEGMENTS.de}`}>beste Reisezeit</Link>.
                </>
              ),
            },
            {
              icon: LineChart,
              title: 'KI-Prognose im Wartezeit-Chart',
              body: 'die gestrichelte Linie, die dir die günstigsten Zeitfenster einer Attraktion verrät.',
            },
            {
              icon: Sunrise,
              title: 'Rope-Drop-Empfehlung',
              body: 'die Antwort auf „lohnt es sich, früh da zu sein?“, mit den erwarteten Tiefstwerten.',
            },
            {
              icon: HelpCircle,
              title: 'Keine Prognose',
              body: (
                <>
                  Statt zu raten: Parks mit zu wenig Daten bekommen{' '}
                  <CrowdLevelBadge level="unknown" /> statt einer erfundenen Zahl.
                </>
              ),
            },
          ]}
        />
        <P>
          Wie das alles im Park zusammenspielt, erklärt die{' '}
          <Link href={`/${HOWTO_SEGMENTS.de}`}>vollständige Anleitung</Link> Schritt für Schritt,
          mit Crowd-Kalender, Badges und Live-Wartezeiten.
        </P>
      </SectionShell>

      {/* 08 – FAQ */}
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
