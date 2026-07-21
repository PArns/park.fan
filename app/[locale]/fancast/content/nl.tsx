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
  edition: 'Huidige editie',
  trained: 'Getraind',
  basis: 'Trainingsbasis',
  datapoints: '{n} datapunten',
  days: 'over {d} dagen',
  vsPrevious: 'Tegenover {v}',
  moreAccurate: 'nauwkeuriger',
  topTitle: 'Waar Fancast de laatste tijd het scherpst zat',
  topIntro:
    'De attracties waarvan de recente voorspellingen het dichtst bij de echte wachttijd lagen — de gemiddelde afwijking in minuten, live uit het model.',
  colAttraction: 'Attractie',
  colPark: 'Park',
  colError: 'Gem. fout',
  minUnit: 'min',
};

const FAQ = [
  {
    question: 'Hoe nauwkeurig is Fancast?',
    answer:
      'De actuele nauwkeurigheid staat live in de scorecard hierboven — als MAE (gemiddelde afwijking in minuten), RMSE en MAPE. Die cijfers komen uit een echte vergelijking van eerdere voorspellingen met de wachttijden die daadwerkelijk gemeten zijn, niet uit een opgepoetst testlab. Ze veranderen zodra het model opnieuw traint.',
  },
  {
    question: 'Hoe ver vooruit kan Fancast voorspellen?',
    answer:
      'Dagelijkse drukteniveaus voor een park geeft Fancast tot 365 dagen vooruit. Voor afzonderlijke attracties zijn er daarnaast wachttijd-voorspellingen per uur. Hoe dichterbij de dag komt, hoe zwaarder kortetermijnsignalen zoals de weersverwachting meewegen.',
  },
  {
    question: 'Hoe weet Fancast dat een vakantiezaterdag druk wordt?',
    answer:
      'Uit het samenspel van vele signalen: school- en feestdagenkalenders (ook die van buurregio’s), de dag van de week, de weersverwachting, speciale evenementen en de volledige wachttijd-historie van het park. Een vakantiezaterdag in hartje zomer draagt bijna al die factoren tegelijk — daarom slaat de voorspelling daar uit naar boven, terwijl een regenachtige dinsdag in november groen blijft.',
  },
  {
    question: 'Hoe vaak wordt het model bijgewerkt?',
    answer:
      'Elke dag. Fancast traint zichzelf automatisch één keer per dag om 06:00 UTC opnieuw met de meest verse data — inclusief de wachttijden van gisteren. Het wordt dus letterlijk elke ochtend een klein beetje beter.',
  },
  {
    question: 'Kan ik Fancast voor een specifiek park en een specifieke dag gebruiken?',
    answer:
      'Ja. Elke parkpagina op park.fan heeft een druktekalender die je voor elke afzonderlijke dag tot een jaar vooruit een groene, gele of rode voorspelling laat zien — van Europa-Park via Phantasialand en Efteling tot Walt Disney World. Daarnaast krijg je wachttijd-voorspellingen per uur voor de afzonderlijke attracties.',
  },
  {
    question: 'Welke gegevens gebruikt Fancast?',
    answer:
      'Live en historische wachttijden uit ruim 150 parken, school- en feestdagenkalenders (ook die van buurregio’s), weersverwachtingen, openingstijden, speciale evenementen en seizoenspatronen. Uit die mix ontstaan de dagelijkse drukteniveaus en de wachttijd-voorspellingen per uur.',
  },
  {
    question: 'Waarom toont een park “Geen voorspelling”?',
    answer:
      'Fancast beoordeelt een park pas als er genoeg operationele gegevens zijn — minstens zo’n 30 operationele dagen. Voor gloednieuwe of zelden geopende parken ontbreekt die basis nog. Dan tonen we liever eerlijk “Geen voorspelling” dan een gegokt getal.',
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
      <div className="container mx-auto max-w-4xl space-y-5 px-4">
        <Lead>
          Fancast is ons eigen voorspelmodel — het deel van park.fan dat in de toekomst kijkt. De
          naam? Schaamteloos maar systematisch: <strong>fan</strong> als in park.<strong>fan</strong>,{' '}
          <strong>cast</strong> als in fore<strong>cast</strong>. Een weerbericht voor wachtrijen,
          eigenlijk.
        </Lead>
        <P>
          En omdat we cijfers alleen vertrouwen als ze zich moeten bewijzen, doet Fancast iets wat de
          meeste modellen stilletjes vermijden: het geeft zichzelf een cijfer. Elke voorspelling wordt
          later getoetst aan de wachttijd die er werkelijk was — in het openbaar, op deze pagina.
          Valsspelen zinloos.
        </P>
        <Highlight>
          Kortom: Fancast is geen waarzegger met een glazen bol. Het is een koppige statisticus die
          elke avond bijles krijgt en elke ochtend opnieuw examen moet doen. Een weerkikker die zijn
          eigen weer natrekt.
        </Highlight>
      </div>

      {/* 01 — Scorecard (live) */}
      <SectionShell
        id="note"
        index="01"
        kicker="Het rapportcijfer"
        title="Hoe goed is Fancast echt?"
        icon={Gauge}
      >
        <P>
          Genoeg voorwoord — hier is het cijfer, live en onopgesmukt. Fancast haalt deze getallen op
          dit moment uit zijn eigen dashboard; ze verschuiven zodra het model vannacht opnieuw traint.
        </P>
        <div className="overflow-hidden rounded-2xl border">
          <MLStatsSection />
        </div>
        <FancastLive labels={LIVE_LABELS} />
      </SectionShell>

      {/* 02 — What it reads */}
      <SectionShell
        id="ingredients"
        index="02"
        kicker="De ingrediënten"
        title="Wat Fancast leest"
        icon={Database}
      >
        <PG>
          Een regenachtige brugdag in oktober is een compleet ander beest dan een zonnige
          vakantiezaterdag in juli — en dat moet een model eerst leren. Daarom voedt Fancast zich uit
          meerdere bronnen tegelijk:
        </PG>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Live wachttijden" delay={0}>
            Miljoenen echte metingen uit 150+ parken, per minuut ververst. De ruwe valuta van elke
            voorspelling.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Kalenders & vakanties" delay={60}>
            Weekenden, feestdagen en schoolvakanties — ook die van buurregio’s, want dagjesmensen
            trekken zich niets van grenzen aan.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Weer" delay={120}>
            Regenkans en temperatuur buigen de kortetermijnvoorspellingen bij. Zon trekt mensen aan,
            aanhoudende regen leegt de paden.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Evenementen & seizoen" delay={0}>
            Halloween, zomervakantie, lange weekenden, een publiekstrekker in zijn eerste zomer — de
            usual suspects voor een volle dag.
          </IngredientCard>
          <IngredientCard icon={History} title="Historie" delay={60}>
            Jaren aan wachttijd-historie per park. Patronen die je alleen ziet als je er lang genoeg
            naar staart.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Openingstijden & capaciteit" delay={120}>
            Wanneer het park opent, hoe lang, met welke capaciteit — het kader waarin al het andere
            past.
          </IngredientCard>
        </IngredientGrid>
        <P>
          Uit deze mix maakt het model twee dingen: een <strong>wachttijd-voorspelling per uur</strong>{' '}
          voor afzonderlijke attracties en een <strong>dagelijks druktecijfer</strong> voor het hele
          park.
        </P>
      </SectionShell>

      {/* 03 — Concrete park examples */}
      <SectionShell
        id="examples"
        index="03"
        kicker="Bij echte parken"
        title="Fancast bij drie parken"
        icon={Compass}
      >
        <P>
          Grijs is alle theorie — Fancast wordt pas tastbaar bij een concreet park. Drie voorbeelden
          van hoe dezelfde ingrediënten drie compleet verschillende voorspellingen worden:
        </P>
        <SplitFigure
          src="/images/parks/europa-park/silver-star.jpg"
          alt="Silver Star in Europa-Park"
          kicker="Europa-Park · brugdag in oktober"
          title="Rustig, groen, onder de 30 minuten"
          badge={<CrowdLevelBadge level="very_low" />}
        >
          Fancast ziet: schoolvakantie in slechts één buurregio, wisselvallig weer, geen speciaal
          evenement. Resultaat: een rustige, groene voorspelling — Voltron Nevera waarschijnlijk onder
          de 30 minuten, blue fire zo instappen. Hetzelfde park drie weken later op een
          vakantiezaterdag? Dieprood. Zes miljoen jaargasten verdelen zichzelf nu eenmaal niet
          vanzelf.
        </SplitFigure>
        <SplitFigure
          src="/images/parks/phantasialand/taron.jpg"
          alt="Taron raast door Klugheim in Phantasialand"
          kicker="Phantasialand · vakantiezaterdag"
          title="Compact, vol, oranje tot rood"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          Compact park, weinig publiekstrekkers, iedereen wil naar Taron — de verzadiging is sneller
          bereikt dan het eerste biertje is getapt. Fancast weet dat en kleurt de dag oranje tot rood.
          De kalender ernaast stelt je meteen de dinsdag erna voor, waarop je Taron aan één stuk kunt
          rijden in plaats van er alleen maar naar te smachten.
        </SplitFigure>
        <SplitFigure
          src="/images/parks/efteling/baron-1898.jpg"
          alt="Baron 1898 in de Efteling"
          kicker="Efteling · regenachtige dinsdag in november"
          title="De geheime tip die het model al meerekent"
          badge={<CrowdLevelBadge level="low" />}
        >
          Precies de dag die planners op gevoel mijden — en die Fancast groen kleurt. Weinig vakantie,
          beroerd weer, korte rijen. Dat werkt exact zolang totdat iedereen dezelfde geheime tip heeft
          gelezen; daarom rekent het model de regenkans meteen zelf mee, in plaats van te vertrouwen op
          folklore.
        </SplitFigure>
      </SectionShell>

      {/* 04 — How it learns */}
      <SectionShell
        id="training"
        index="04"
        kicker="De methode"
        title="Hoe Fancast leert (en niet vals kan spelen)"
        icon={RefreshCw}
      >
        <P>
          De belangrijkste truc is een oninteressante: Fancast traint zichzelf <strong>elke nacht</strong>{' '}
          opnieuw, elke dag om 06:00 UTC. Wat gisteren is gebeurd, weet het model vandaag. Een
          achtbaanfan wordt met de jaren ouder en vermoeider — Fancast wordt elke ochtend een beetje
          slimmer.
        </P>
        <P>
          En het wordt uitsluitend getest op dagen die het <strong>nog nooit heeft gezien</strong> — op
          de toekomst, niet op uit het hoofd geleerde dagen uit het verleden. Al het andere zou zijn
          alsof je jezelf vooraf de examenvragen toespeelt en je vervolgens laat vieren om je
          tienenrapport.
        </P>
        <P>
          Daarbovenop houdt Fancast in de gaten of het <strong>afdrijft</strong> — of de werkelijkheid
          het langzaam ontglipt. En een nieuwe modelversie gaat pas live als die de oude in een
          eerlijke vergelijking echt verslaat. Democratie onder algoritmes: wie niet beter is, blijft
          op de reservebank.
        </P>
      </SectionShell>

      {/* 05 — Crowd levels */}
      <SectionShell
        id="levels"
        index="05"
        kicker="De schaal"
        title="Groen, geel, rood: de drukteniveaus"
        icon={Palette}
      >
        <PG>
          Aan het eind van al dat rekenwerk staat één enkele kleur. Zes niveaus, van “je hebt het park
          zowat voor jezelf” tot “welkom op een vakantiezaterdag”:
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
              text: 'Normaal bedrijf. De publiekstrekkers lopen vol, de rest blijft rustig. Een prima compromisdag.',
            },
            {
              level: 'high',
              text: 'Merkbaar druk. Voor de topattracties loont het om vroeg op te staan — of geduld mee te nemen.',
            },
            {
              level: 'very_high',
              text: 'Flink druk. Lange rijen bij de highlights; plannen wint duidelijk van spontaniteit.',
            },
            {
              level: 'extreme',
              text: 'Alarmfase. Vakantiezaterdag in hartje zomer. Alleen met een strategie, uithoudingsvermogen en gevoel voor humor.',
            },
          ]}
        />
      </SectionShell>

      {/* 06 — Try a real park */}
      <SectionShell
        id="parks"
        index="06"
        kicker="Zelf uitproberen"
        title="Pak een park"
        icon={Ticket}
      >
        <P>
          Genoeg theorie. Fancast draait op elke parkpagina mee — hier een paar populaire om het meteen
          op uit te proberen. Klik erin, open de druktekalender en kijk welke kleur je gewenste dag
          krijgt:
        </P>
        <PopularParksGrid />
      </SectionShell>

      {/* 07 — Where you meet it */}
      <SectionShell
        id="where"
        index="07"
        kicker="Overal in het park"
        title="Waar je Fancast tegenkomt"
        icon={MapPin}
      >
        <P>
          Fancast woont niet op één eenzame pagina — het zit verweven door heel park.fan, meestal
          zonder zich voor te stellen:
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
                  de <Link href="/parks">kalender met de beste bezoekdagen</Link> op elke parkpagina —
                  groen, geel, rood, tot een jaar vooruit.
                </>
              ),
            },
            {
              icon: CalendarDays,
              title: 'Beste reistijd',
              body: 'de rustigste weekdagen en de aankomende geheime-tip-dagen, gedestilleerd uit dezelfde data.',
            },
            {
              icon: LineChart,
              title: 'AI-voorspelling in de wachttijdgrafiek',
              body: 'de stippellijn die de gunstigste tijdvensters van een attractie verraadt.',
            },
            {
              icon: Sunrise,
              title: 'Rope-drop-advies',
              body: 'het eerlijke antwoord op “loont het om vroeg te zijn?” — inclusief de verwachte dalen.',
            },
            {
              icon: HelpCircle,
              title: 'Geen voorspelling',
              body: (
                <>
                  eerlijk boven gegokt: parken met te weinig data krijgen{' '}
                  <CrowdLevelBadge level="unknown" /> in plaats van een verzonnen getal.
                </>
              ),
            },
          ]}
        />
        <P>
          Hoe dit allemaal in een park samenspeelt, loopt de{' '}
          <Link href="/howto">volledige handleiding</Link> stap voor stap door — inclusief
          druktekalender, badges en live wachttijden.
        </P>
      </SectionShell>

      {/* 08 — FAQ */}
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
