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
  edition: 'Huidige editie',
  trained: 'Getraind',
  basis: 'Trainingsbasis',
  datapoints: '{n} datapunten',
  days: 'over {d} dagen',
  vsPrevious: 'Tegenover {v}',
  moreAccurate: 'nauwkeuriger',
  topTitle: 'Waar Fancast de laatste tijd het scherpst zat',
  topIntro:
    'De attracties waarvan de recente voorspellingen het dichtst bij de echte wachttijd lagen. Je ziet de gemiddelde afwijking in minuten, live uit het model.',
  colAttraction: 'Attractie',
  colPark: 'Park',
  colError: 'Gem. fout',
  minUnit: 'min',
};

const FAQ = [
  {
    question: 'Hoe nauwkeurig is Fancast?',
    answer:
      'De actuele nauwkeurigheid staat live hoger op deze pagina, als MAE (gemiddelde afwijking in minuten), RMSE en MAPE. De cijfers komen uit de vergelijking van eerdere voorspellingen met de wachttijden die daarna echt gemeten zijn. Na elke training veranderen ze.',
  },
  {
    question: 'Hoe ver vooruit kan Fancast voorspellen?',
    answer:
      'Dagelijkse drukteniveaus geeft Fancast voor elke dag die een park al gepubliceerd heeft. Voor afzonderlijke attracties zijn er daarnaast wachttijd-voorspellingen per uur. Hoe dichterbij de dag komt, hoe zwaarder kortetermijnsignalen zoals de weersverwachting meewegen.',
  },
  {
    question: 'Hoe weet Fancast dat een vakantiezaterdag druk wordt?',
    answer:
      'Uit een aantal signalen die het samen leest: school- en feestdagenkalenders (ook die van buurregio’s), de dag van de week, de weersverwachting, speciale evenementen en de volledige wachttijd-historie van het park. Een vakantiezaterdag in hartje zomer heeft bijna al die factoren tegelijk. Daarom slaat de voorspelling daar uit naar boven, terwijl een regenachtige dinsdag in november groen blijft.',
  },
  {
    question: 'Hoe vaak wordt het model bijgewerkt?',
    answer:
      'Elke dag. Fancast traint zichzelf automatisch één keer per dag om 06:00 UTC opnieuw, met de wachttijden van gisteren erbij.',
  },
  {
    question: 'Kan ik Fancast voor een specifiek park en een specifieke dag gebruiken?',
    answer:
      'Ja. Elke parkpagina op park.fan heeft een druktekalender die je voor elke gepubliceerde dag een groene, gele of rode voorspelling laat zien, van Europa-Park via Phantasialand en de Efteling tot Walt Disney World. Daarnaast krijg je wachttijd-voorspellingen per uur voor de afzonderlijke attracties.',
  },
  {
    question: 'Welke gegevens gebruikt Fancast?',
    answer:
      'Live en historische wachttijden uit ruim 200 parken, school- en feestdagenkalenders (ook die van buurregio’s), weersverwachtingen, openingstijden, speciale evenementen en seizoenspatronen. Uit die mix ontstaan de dagelijkse drukteniveaus en de wachttijd-voorspellingen per uur.',
  },
  {
    question: 'Waarom toont een park “Geen voorspelling”?',
    answer:
      'Fancast beoordeelt een park pas als er genoeg operationele gegevens zijn, dus minstens zo’n 30 operationele dagen. Voor gloednieuwe of zelden geopende parken ontbreekt die basis nog. Dan staat er “Geen voorspelling” in plaats van een gegokt getal.',
  },
  {
    question: 'Kost Fancast iets?',
    answer:
      'Nee. Net als heel park.fan zijn alle voorspellingen, druktekalenders en statistieken gratis, reclamevrij en zonder account te gebruiken.',
  },
] as const;

export function ContentNL() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          Fancast is ons eigen voorspelmodel, het deel van park.fan dat vandaag al wil weten hoe
          lang de rij zaterdag wordt. De naam hebben we zonder reclamebureau bedacht, en dat zie je:{' '}
          <strong>fan</strong> als in park.
          <strong>fan</strong>, <strong>cast</strong> als in fore<strong>cast</strong>. Een
          weerbericht voor wachtrijen, alleen zonder weerman die voor de kaart staat te zwaaien.
        </Lead>
        <P>
          Voorspellingen die niemand controleert, kan elke horoscoop. Fancast moet elke dag op voor
          zijn rapport, en dat rapport hangt openbaar op deze pagina.
        </P>
        <Highlight>
          Elke voorspelling gaat de dag erna naast de gemeten wachttijd. Wat daaruit komt, staat in
          het volgende blok als MAE, RMSE en MAPE, ook op slechte dagen.
        </Highlight>
      </div>

      {/* 01 – Scorecard (live) */}
      <SectionShell
        id="note"
        index="01"
        kicker="Het rapportcijfer"
        title="Hoe goed is Fancast echt?"
        icon={Gauge}
      >
        <P>
          De cijfers hier komen live uit het model, niet uit een persmap. Met de volgende
          trainingsronde morgenochtend veranderen ze, dus lijst ze liever niet in.
        </P>
        <div className="overflow-hidden rounded-2xl border">
          <MLStatsSection />
        </div>
        <FancastLive labels={LIVE_LABELS} />
      </SectionShell>

      {/* 02 – What it reads */}
      <SectionShell
        id="ingredients"
        index="02"
        kicker="De ingrediënten"
        title="Wat Fancast leest"
        icon={Database}
      >
        <PG>
          Wie vaak naar pretparken gaat, weet dat een regenachtige brugdag in oktober en een zonnige
          vakantiezaterdag in juli twee verschillende sporten zijn. Een model moet dat eerst leren,
          en daarvoor leest Fancast zes bronnen tegelijk:
        </PG>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Live wachttijden" delay={0}>
            Elke vijf minuten een meting per wachtrij, uit ruim 200 parken. Daarop bouwt al het
            andere.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Kalenders & vakanties" delay={60}>
            Weekenden, feestdagen en schoolvakanties, ook die van buurregio’s. Nederlandse
            dagjesmensen kijken nu eenmaal niet in de Duitse vakantiekalender.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Weer" delay={120}>
            Regenkans en temperatuur buigen de kortetermijnvoorspellingen bij. Zon lokt iedereen
            naar buiten, aanhoudende regen stuurt ze terug naar de bank.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Evenementen & seizoen" delay={0}>
            Halloween, zomervakantie, lange weekenden, een publiekstrekker in zijn eerste zomer: de
            bekende verdachten voor een volle dag.
          </IngredientCard>
          <IngredientCard icon={History} title="Historie" delay={60}>
            Elke geregistreerde openingsdag van een park, sinds april 2026 zonder gaten. Daar komt
            het week- en seizoensritme uit.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Openingstijden & capaciteit" delay={120}>
            Wanneer het park opent, hoe lang, met welke capaciteit. Dat is het kader waarin de rest
            moet passen.
          </IngredientCard>
        </IngredientGrid>
        <P>
          Uit deze stamppot kookt het model twee dingen: een{' '}
          <strong>wachttijd-voorspelling per uur</strong> voor afzonderlijke attracties en een{' '}
          <strong>dagelijks druktecijfer</strong> voor het hele park.
        </P>
      </SectionShell>

      {/* 03 – Concrete park examples */}
      <SectionShell
        id="examples"
        index="03"
        kicker="Bij echte parken"
        title="Fancast bij drie parken"
        icon={Compass}
      >
        <P>
          Dezelfde ingrediënten leveren per park en per datum heel verschillende dagen op. Drie
          voorbeelden:
        </P>
        <SplitFigure
          src="/media/europa-park/silver-star.jpg"
          alt="Silver Star in Europa-Park"
          kicker="Europa-Park · brugdag in oktober"
          title="Rustig, groen, onder de 30 minuten"
          badge={<CrowdLevelBadge level="very_low" />}
        >
          Fancast ziet schoolvakantie in precies één buurregio, wisselvallig weer en geen speciaal
          evenement. Dat geeft een rustige, groene voorspelling: Voltron Nevera waarschijnlijk onder
          de 30 minuten, blue fire bijna in het voorbijgaan. Hetzelfde park drie weken later op een
          vakantiezaterdag is dieprood, want zes miljoen jaargasten spreiden zich niet uit zichzelf
          netjes over het jaar.
        </SplitFigure>
        <SplitFigure
          src="/media/phantasialand/taron.jpg"
          alt="Taron raast door Klugheim in Phantasialand"
          kicker="Phantasialand · vakantiezaterdag"
          title="Compact, vol, oranje tot rood"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          Compact park, weinig publiekstrekkers, en iedereen wil naar Taron. Het is hier sneller vol
          dan de kiosk het eerste biertje kan tappen. Fancast weet dat en kleurt de dag oranje tot
          rood. De druktekalender op de parkpagina stelt je dan meteen een dinsdag voor, waarop je
          Taron een paar keer achter elkaar rijdt in plaats van er vanaf het pad naar te smachten.
        </SplitFigure>
        <SplitFigure
          src="/media/efteling/baron-1898.jpg"
          alt="Baron 1898 in de Efteling"
          kicker="Efteling · regenachtige dinsdag in november"
          title="De geheime tip die het model al meerekent"
          badge={<CrowdLevelBadge level="low" />}
        >
          Precies de dag die planners op gevoel mijden, kleurt Fancast groen: weinig vakantie,
          beroerd weer, korte rijen. Natte sokken krijg je er gratis bij. Het nadeel van elke
          geheime tip is dat hij maar werkt tot iedereen hem gelezen heeft. Daarom rekent het model
          de regenkans voor precies die dag zelf mee, in plaats van op folklore te vertrouwen.
        </SplitFigure>
      </SectionShell>

      {/* 04 – How it learns */}
      <SectionShell
        id="training"
        index="04"
        kicker="De methode"
        title="Hoe Fancast leert (en niet vals kan spelen)"
        icon={RefreshCw}
      >
        <P>
          De belangrijkste truc is ongeveer zo spannend als tandenpoetsen. Fancast traint zichzelf{' '}
          <strong>één keer per dag</strong> opnieuw, om 06:00 UTC. Wat gisteren in het park is
          gebeurd, zit vanaf de volgende ochtend in de voorspelling.
        </P>
        <P>
          Getest wordt alleen op dagen die het model <strong>nog nooit heeft gezien</strong>. Al het
          andere zou zijn alsof je jezelf vooraf de examenvragen toespeelt en daarna je tien viert.
        </P>
        <P>
          Verder houdt Fancast in de gaten of het <strong>afdrijft</strong>, of de werkelijkheid het
          dus langzaam ontglipt. Een nieuwe modelversie gaat pas live als die de oude in een directe
          vergelijking verslaat. Promotie krijgt hier alleen wie echt beter is, en dat kan niet elk
          bedrijf zeggen.
        </P>
      </SectionShell>

      {/* 05 – Crowd levels */}
      <SectionShell
        id="levels"
        index="05"
        kicker="De schaal"
        title="Groen, geel, rood: de drukteniveaus"
        icon={Palette}
      >
        <PG>
          Aan het eind van al dat rekenwerk staat één enkele kleur. Zes niveaus, van “je hebt het
          park zowat voor jezelf” tot “welkom op een vakantiezaterdag”:
        </PG>
        <CrowdSpectrum
          items={[
            {
              level: 'very_low',
              text: 'Bijna leeg. Rope-drop-dromen, ritten aan één stuk, een foto met de mascotte zonder rij.',
            },
            {
              level: 'low',
              text: 'Ontspannen. Korte wachttijden, je komt overal aan de beurt zonder een veldslagplan.',
            },
            {
              level: 'moderate',
              text: 'Normaal bedrijf. Bij de publiekstrekkers wordt het voller, de rest blijft rustig. Een grove planning volstaat.',
            },
            {
              level: 'high',
              text: 'Merkbaar druk. Voor de grote attracties loont de wekker, anders heb je geduld en een luisterboek nodig.',
            },
            {
              level: 'very_high',
              text: 'Flink druk. Lange rijen bij de grote attracties, en wie spontaan blijft, brengt de dag door tussen de hekken van de wachtrij.',
            },
            {
              level: 'extreme',
              text: 'Alarmfase. Vakantiezaterdag in hartje zomer. Alleen met een strategie, uithoudingsvermogen en gevoel voor humor.',
            },
          ]}
        />
      </SectionShell>

      {/* 06 – Try a real park */}
      <SectionShell
        id="parks"
        index="06"
        kicker="Zelf uitproberen"
        title="Pak een park"
        icon={Ticket}
      >
        <P>
          Fancast draait op elke parkpagina mee. Hier een paar populaire om uit te proberen: park
          aanklikken, druktekalender openen en kijken welke kleur jouw dag krijgt. Is die rood, kijk
          dan even naar de dagen eromheen.
        </P>
        <PopularParksGrid />
      </SectionShell>

      {/* 07 – Where you meet it */}
      <SectionShell
        id="where"
        index="07"
        kicker="Overal in het park"
        title="Waar je Fancast tegenkomt"
        icon={MapPin}
      >
        <P>
          Deze pagina is alleen het kantoor. Het echte werk doet Fancast overal elders op park.fan,
          en het stelt zich daarbij zelden voor:
        </P>
        <TouchpointGrid
          items={[
            {
              icon: CalendarCheck,
              title: 'Voorspelling vandaag',
              body: 'het druktecijfer in de parkheader, nog voordat je de eerste attractie aantikt.',
            },
            {
              icon: CalendarRange,
              title: 'Druktekalender',
              body: (
                <>
                  de <Link href="/parks">kalender met de beste bezoekdagen</Link> op elke
                  parkpagina: groen, geel, rood, zo ver als het park zijn openingstijden
                  gepubliceerd heeft.
                </>
              ),
            },
            {
              icon: CalendarDays,
              title: 'Beste reistijd',
              body: (
                <>
                  de rustigste weekdagen en de aankomende geheime-tip-dagen, gehaald uit dezelfde
                  data. Bekijk de{' '}
                  <Link href={`/${BEST_TIME_SEGMENTS.nl}`}>beste tijd om te bezoeken</Link>.
                </>
              ),
            },
            {
              icon: LineChart,
              title: 'AI-voorspelling in de wachttijdgrafiek',
              body: 'de stippellijn die de gunstigste tijdvensters van een attractie verraadt.',
            },
            {
              icon: Sunrise,
              title: 'Rope-drop-advies',
              body: 'het antwoord op “loont het om vroeg te zijn?”, met de verwachte dalen.',
            },
            {
              icon: HelpCircle,
              title: 'Geen voorspelling',
              body: (
                <>
                  niet gokken: parken met te weinig data krijgen <CrowdLevelBadge level="unknown" />{' '}
                  in plaats van een verzonnen getal.
                </>
              ),
            },
          ]}
        />
        <P>
          Hoe dit allemaal in een park samenspeelt, loopt de{' '}
          <Link href={`/${HOWTO_SEGMENTS.nl}`}>volledige handleiding</Link> stap voor stap door, met
          druktekalender, badges en live wachttijden.
        </P>
      </SectionShell>

      {/* 08 – FAQ */}
      <SectionShell
        id="faq"
        index="08"
        kicker="Kort & krachtig"
        title="Veelgestelde vragen over Fancast"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>
    </>
  );
}
