import { CalendarDays, Clock, Footprints, Gauge, Users, Wand2 } from 'lucide-react';
import { A, P } from '@/components/marketing/editorial-ui';
import { Chapter, Note } from '../_chrome';
import { PlannerDayDemo } from '../_demos';
import { DEMO_PARTY_RIDES } from '../_fixtures';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerEntry } from '@/lib/planner/types';

const PARK = '/parks/europe/germany/bruehl/phantasialand';

/** The planner page's article, Dutch. See `content/de.tsx` for the convention. */
export function ContentNL({ day, entries }: { day: PlanDay; entries: PlannerEntry[] }) {
  return (
    <>
      <Chapter
        id="een-geplande-dag"
        index="01"
        icon={CalendarDays}
        kicker="De dag als tijdlijn"
        title="Blokken en overstappen"
      >
        <P>
          Elke attractie in je plan is een blok op de tijdlijn van de dag, en het blok is zo hoog
          als de wachttijd die je op dat uur kunt verwachten. Sleep je het naar een drukker uur, dan
          groeit het, in een rustiger uur krimpt het. Tussen twee blokken staat de overstap, met de
          afstand tot de volgende attractie en of de tijd genoeg is. &ldquo;Krap&rdquo; betekent dat
          het niet meer lukt zodra de wachttijd ervoor er zoveel naast zit als gewoonlijk.
        </P>
        <P>
          Hieronder staat een plan voor <A href={PARK}>Phantasialand</A> op zaterdag 12 september
          2026, met de wachttijden die op 4 september voor die dag voorspeld waren. Sleep een blok
          naar een ander tijdstip, dan worden de hoogte en de overstappen opnieuw berekend. In je
          eigen plan komt daarvan niets terecht.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          Bij het geselecteerde blok staan het tijdstip, de verwachte wachttijd en hoeveel de
          prognose voor die attractie er meestal naast zit.
        </Note>
        <P>
          Op een breed scherm passen twee dagen naast elkaar, bijvoorbeeld zaterdag en zondag of
          twee parken. Bij elke dag staat de totale wachttijd, zodat je ziet op welke dag je minder
          in de rij staat.
        </P>
      </Chapter>

      <Chapter
        id="waar-het-getal-vandaan-komt"
        index="02"
        icon={Gauge}
        kicker="Prognose"
        title="Waar de wachttijden vandaan komen"
      >
        <P>
          Voor elke attractie is er een prognose voor de hele dag, uur voor uur. Op deze zaterdag
          zakt Black Mamba van 35 minuten rond het middaguur naar 20 in de avond, terwijl Chiapas om
          kwart over tien op 20 minuten staat en ’s middags op 35. Black Mamba hoort die dag dus in
          de avond, Chiapas in de ochtend.
        </P>
        <P>
          Hoeveel de prognose voor een attractie er meestal naast zit, staat bij het blok, voor{' '}
          <A href={`${PARK}/taron`}>Taron</A> op deze zaterdag 15 minuten. Hoe verder de dag weg is,
          hoe ruwer het getal, en ernaast staat hoe het tot stand kwam, van
          &ldquo;Uurprognose&rdquo; via &ldquo;Uit de dagprognose&rdquo; tot &ldquo;Ruwe
          schatting&rdquo;.
        </P>
        <P>
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> laat zijn wachttijden
          alleen zien in de eigen app op de wifi van het park, dus voor dit park zijn er geen
          getallen. Plannen kan er wel, alleen zonder minuten en zonder de knoppen om te sorteren.
        </P>
      </Chapter>

      <Chapter
        id="wie-gaat-mee"
        index="03"
        icon={Users}
        kicker="Groep"
        title="Minimumlengte en waterattracties"
      >
        <P>
          Een nieuwe dag begin je met vier vragen: welk park, welke dag, wie er meegaat en welke
          grote attracties in het plan moeten. In de maandkalender heeft elke dag de kleur van de
          verwachte drukte, en de <A href={`${PARK}/wachttijden-kalender`}>wachttijdenkalender</A>{' '}
          van het park geeft meer details.
        </P>
        <P>
          Gaan er kinderen mee, dan geef je aan hoe groot het kleinste is en of jullie zo droog
          mogelijk willen blijven. Attracties met een hogere minimumlengte en waterattracties
          krijgen dan een markering en blijven toch in de lijst, want alleen jullie weten of iemand
          bij de uitgang wacht en de tassen vasthoudt. In Phantasialand vraagt Taron{' '}
          {DEMO_PARTY_RIDES.taron.minimumHeight} cm en Chiapas{' '}
          {DEMO_PARTY_RIDES.chiapas.minimumHeight} cm, en in Chiapas word je nat (stand 29 september
          2026). Met een kind van 120 cm krijgen ze allebei de markering.
        </P>
        <Note>
          Waar bij ons geen minimumlengte bekend is, zoals bij Moptis Monkey Depot, krijgt de
          attractie geen markering. Bij de ingang van de attractie geldt wat het park voorschrijft.
        </Note>
      </Chapter>

      <Chapter
        id="de-dag"
        index="04"
        icon={Clock}
        kicker="Dagverloop"
        title="Openingstijden, shows en pauzes"
      >
        <P>
          Op deze zaterdag gaat Phantasialand om 9 uur open, maar Taron, F.L.Y. en de meeste andere
          grote attracties draaien pas vanaf 10 uur. Wie er om negen is, begint met Black Mamba of
          Maus au Chocolat. Een blok kun je niet vóór de openingstijd van zijn attractie slepen.
        </P>
        <P>
          De speeltijden van de shows staan mee op de tijdlijn. Voor vandaag zijn het de tijden van
          het park. Voor latere dagen noemt geen enkele bron de tijden, dus nemen we die van de
          laatste gelijke weekdag en zetten er &ldquo;Naar verwachting&rdquo; bij.
        </P>
        <P>
          Pauzes, eten of een ontmoetingspunt zet je als eigen blok in de dag, zo lang als je nodig
          hebt. Kies je bij het aanmaken &ldquo;Lunchpauze inplannen&rdquo;, dan staat er om 12:30
          al een. Boven de dag staan verder vakanties en feestdagen en, tot ongeveer twee weken
          vooruit, het weer.
        </P>
      </Chapter>

      <Chapter
        id="volgorde"
        index="05"
        icon={Wand2}
        kicker="Sorteren"
        title="De dag op volgorde laten zetten"
      >
        <P>
          Met twee knoppen zet je de dag op volgorde zonder elk blok zelf te verslepen. &ldquo;Alle
          headliners inplannen&rdquo; voegt de grote attracties toe die nog ontbreken en sorteert
          daarna de hele dag. &ldquo;Dag optimaliseren&rdquo; schuift alleen met wat al in het plan
          staat. In beide gevallen komt alles vóór sluitingstijd aan de beurt en sta je in totaal zo
          kort mogelijk in de rij.
        </P>
        <P>
          De lunchpauze en afgevinkte attracties blijven waar ze staan. Daarna zie je hoeveel
          minuten wachten je bespaart, en &ldquo;Ongedaan maken&rdquo; zet de oude stand terug.
        </P>
        <P>
          Past niet alles in de dag, dan opent er een assistent. Eerst staan daar wijzigingen die
          ruimte maken zonder dat er een attractie afvalt, zoals een kortere lunchpauze. Is dat niet
          genoeg, dan zet je de attracties op volgorde van belang, en er wordt van onderaf
          geschrapt.
        </P>
      </Chapter>

      <Chapter
        id="in-het-park"
        index="06"
        icon={Footprints}
        kicker="In het park"
        title="Op de dag zelf"
      >
        <P>
          In het park vink je af wat je gedaan hebt. Bij het blok staat dan de wachttijd die op dat
          moment gemeld werd, en hoeveel de schatting ernaast zat. Meldt een geplande attractie op
          dat moment gesloten, dan staat dat ook bij het blok.
        </P>
        <P>
          Met meldingen laten we je weten wanneer je naar de volgende attractie moet, wanneer een
          geplande attractie sluit of weer opengaat en wanneer een wachttijd flink verandert. Ook de
          speeltijden van de shows kun je laten sturen. Wat je daarvan krijgt, kies je zelf.
        </P>
        <P>
          Het plan staat in je browser, een account heb je niet nodig. Pas voor de meldingen zetten
          we een kopie op onze server, en die is weer weg zodra je ze uitzet. Zolang ze er staat,
          kun je een link naar het plan sturen. Wie die opent, kan het plan als eigen kopie
          overnemen.
        </P>
      </Chapter>
    </>
  );
}
