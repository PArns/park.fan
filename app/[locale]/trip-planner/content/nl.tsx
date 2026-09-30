import { CalendarDays, Footprints, Gauge, HelpCircle, Sunrise, Theater, Wand2 } from 'lucide-react';
import { A, P } from '@/components/marketing/editorial-ui';
import { Chapter, Note } from '../_chrome';
import { PlannerDayDemo } from '../_demos';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerEntry } from '@/lib/planner/types';

const PARK = '/parks/europe/germany/bruehl/phantasialand';

/** Het artikel op de plannerpagina, Nederlands. Zie `content/de.tsx` voor de afspraak. */
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
          Een blok is een attractie, en de hoogte ervan is de wachttijd die voor dat uur voorspeld
          wordt. Sleep hetzelfde blok naar een druk uur en het groeit; zet het in een rustig uur en
          het krimpt. Tussen twee blokken staat de overstap: hoe ver het is, en of daar tijd voor
          is. Het uitstappen en de rit zelf zijn in de overstap meegerekend.
        </P>
        <P>
          De tijdlijn hieronder bestaat uit dezelfde onderdelen als de planner en toont het antwoord
          dat de API op 4 september 2026 gaf voor zaterdag 12 september in{' '}
          <A href={PARK}>Phantasialand</A>. Sleep een blok naar een ander uur. Het klikt op vijf
          minuten vast, en zijn hoogte en de overstappen ernaast worden opnieuw berekend. Er wordt
          hier niets opgeslagen.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          Bij het geselecteerde blok staat hetzelfde in woorden: het tijdstip, de verwachte
          wachttijd en hoever de voorspelling voor die attractie er meestal naast zit.
        </Note>
      </Chapter>

      <Chapter
        id="waar-het-getal-vandaan-komt"
        index="02"
        icon={Gauge}
        kicker="Het getal op een blok"
        title="Waar de minuten vandaan komen en hoe zeker ze zijn"
      >
        <P>
          Voor elke attractie levert de API een curve over de dag, uur voor uur. Taron staat op deze
          zaterdag op 45 minuten om tien, 50 om elf, 40 om één en weer 50 &apos;s avonds; over de
          hele dag zit er maar tien minuten tussen. Omdat er voor Taron op deze dag geen goed
          venster is, komt hij terecht waar de rest van de dag ruimte laat. Black Mamba zakt van 35
          minuten rond het middaguur naar 20 om zes, en Chiapas gaat andersom, van 20 naar 35.
        </P>
        <P>
          Bij elk getal hoort hoever het er meestal naast zit, en hoe langer de rij, hoe groter die
          spreiding. Voor de attracties waarvan de dagpiek op 35 minuten of meer ligt, noemt de API
          op deze zaterdag een gebruikelijke afwijking van 15,4 minuten, voor de vlakkere 10,9. Op
          de helft van de dagen zit de werkelijke wachttijd er verder naast. Daarom staat de
          afwijking als plus-minus bij het geselecteerde blok. Als marge zou het eruitzien alsof de
          werkelijke wachttijd daar zeker binnen valt.
        </P>
        <Note>
          Achter de curve van Taron staan 142 gemeten dagen, achter Black Mamba 161. Hoeveel het er
          zijn, staat op <A href={`${PARK}/taron`}>de pagina van de attractie</A>.
        </Note>
        <P>
          Naast het getal staat wat voor voorspelling het is. Rekent het model de dag per uur door,
          dan staat dat er. Komt de hoogte van de dag uit de voorspelling en de vorm uit eerdere
          dagen, zoals op deze zaterdag, dan staat dat er ook. Ver vooruit is zelfs die hoogte
          onzeker en blijft er een ruwe schatting over. Voor een dag die nooit gemeten is, is er
          helemaal geen plan met getallen.
        </P>
      </Chapter>

      <Chapter
        id="openingstijden"
        index="03"
        icon={Sunrise}
        kicker="Opening"
        title="Attracties die later openen dan het park"
      >
        <P>
          Phantasialand opent op deze zaterdag om 9 uur. Taron, F.L.Y., beide Winja&apos;s en Raik
          draaien vanaf 10 uur, Chiapas vanaf 10:15. Wie om negen uur bij het tourniquet staat, kan
          kiezen tussen Black Mamba en Maus au Chocolat. Een plan dat het eerste uur met headliners
          vult, klopt op deze dag dus niet.
        </P>
        <P>
          Elke attractie heeft een eigen openingstijd, en een blok is op zijn vroegst naar dat
          tijdstip te slepen. Voor de avond ontbreekt zo&apos;n grens, omdat geen enkele feed
          betrouwbaar meldt wanneer een attractie sluit; de tijdlijn stopt bij de sluitingstijd van
          het park.
        </P>
      </Chapter>

      <Chapter
        id="overstappen"
        index="04"
        icon={Footprints}
        kicker="De weg ertussen"
        title="Hoe lang je van attractie naar attractie loopt"
      >
        <P>
          Een wachttijdenfeed meldt 50 minuten bij Taron. Of je het vanuit Rookburgh op tijd redt,
          rekent de overstap uit. Die neemt de afstand tussen de coördinaten van beide attracties,
          plus drie minuten om uit een station te komen en drie voor instappen en rijden waar geen
          ritduur bekend is.
        </P>
        <P>
          Die afstand is hemelsbreed, en zo wordt hij ook genoemd. Lopend is het verder, omdat paden
          om water, wachtrijen en eenrichtingsverkeer heen buigen en Phantasialand Rookburgh en
          Klugheim boven op elkaar stapelt. De bovengrens wordt daarom gerekend op parktempo in
          plaats van stevig doorlopen, met twee derde extra op de hemelsbrede afstand voor de omweg.
        </P>
        <Note>
          Een overstap is &ldquo;krap&rdquo; als hij niet meer uitkomt zodra de voorspelling er zo
          ver naast zit als ze zelf aangeeft. Levert de API geen spreiding, dan blijft het oordeel
          op &ldquo;goed&rdquo; staan, en dat staat er in de titel bij.
        </Note>
      </Chapter>

      <Chapter
        id="volgorde"
        index="05"
        icon={Wand2}
        kicker="Sorteren"
        title="De dag op volgorde laten zetten"
      >
        <P>
          Daarvoor zijn er twee knoppen, met dezelfde som erachter. &ldquo;Alle headliners
          inplannen&rdquo; haalt de grote attracties van het park erbij die nog ontbreken en zet
          daarna alles op volgorde. &ldquo;Dag optimaliseren&rdquo; herschikt alleen wat er al
          gepland is. De eerste knop gebruik je als er nog grote attracties ontbreken, de tweede als
          alleen de volgorde beter moet.
        </P>
        <P>
          Er wordt op vier regels gesorteerd, in deze rangorde. Eerst telt jouw eigen voorkeur: wat
          je naar voren haalt, valt als laatste af. Daarna moet alles nog voor sluitingstijd aan de
          beurt komen, en één attractie minder die zeker doorgaat, gaat voor één meer die te laat
          zou komen. Dan telt de som van de wachttijden, en bij een gelijke som wint de volgorde die
          eerder klaar is. Een schuifje waarmee je wachten tegen rondhangen afweegt, is er niet,
          omdat er voor die verhouding geen waarde te verdedigen is.
        </P>
        <P>
          Voor de vroege ochtend is er geen aparte regel, alleen de uurcurve van elke attractie.
          Ligt die vlak na opening het laagst, dan rolt &ldquo;eerst de grote attractie&rdquo; er
          vanzelf uit; ligt hij vlak, dan komt er iets anders uit. Op een gemeten dag staat Taron
          uur na uur op 60, 60, 54, 53 en 59 minuten, terwijl Chiapas 22 minuten stijgt.
        </P>
        <P>
          Soms is het voorstel om een rondje te wachten in plaats van meteen in de rij te gaan
          staan. Dat gebeurt als de rij zo ver inzakt dat je, die pauze meegerekend, eerder weer
          vrij bent dan wanneer je meteen was gaan staan. Korter in de rij staan is daarvoor niet
          genoeg, want de dag mag door de pauze niet later eindigen. Zo&apos;n pauze duurt hoogstens
          twee uur. Aan die grens komt hij zelden, want een pauze loont alleen als hij korter is dan
          de rij die hij bespaart, en twee uur pauze zou dus een rij van meer dan twee uur vragen.
        </P>
        <P>
          Een middagpauze om één uur blijft om één uur, en een afgevinkte attractie blijft waar ze
          staat; daar wordt omheen gepland. Na de klik staat er wat er veranderd is. &ldquo;18 min.
          minder wachten&rdquo; is het verschil tussen twee sommen van dezelfde rekenwijze, één voor
          en één na de klik. Valt er niets te winnen, dan staat er dat het al goed staat en blijft
          het plan zoals het was. Bij de headlinerknop staat in plaats van een besparing hoeveel
          attracties erbij zijn gekomen en hoeveel er niet bij het gezelschap passen, omdat de dag
          met de nieuwe attracties langer wordt. Wat er aan het eind niet meer in de dag past, wordt
          na allebei de knoppen gemeld. &ldquo;Ongedaan maken&rdquo; zet de stand van voor de klik
          terug, zolang de planner openstaat.
        </P>
        <Note>
          Waar geen wachttijden binnenkomen, ontbreken de twee knoppen. In het Hansa-Park kost elke
          attractie dezelfde aangenomen nul, dus is elke volgorde net zo goed als elke andere.
        </Note>
      </Chapter>

      <Chapter
        id="speeltijden"
        index="06"
        icon={Theater}
        kicker="Shows"
        title="Waar de speeltijden vandaan komen"
      >
        <P>
          Voor vandaag heeft de API de eigen opgave van het park. Voor elke andere datum noemt geen
          enkele bron de tijden vooraf, dus wordt de laatste gelijke weekdag doorgerekend, met de
          datum erbij waar de tijden vandaan komen en uit hoeveel dagen. Een doorrekening krijgt een
          tilde voor het tijdstip en het woord &ldquo;verwacht&rdquo;, een opgave van het park geen
          van beide.
        </P>
        <P>
          Op deze zaterdag zijn alle speeltijden doorgerekend: die van Dragon Drago en Kroka&apos;s
          Lodge van 15 augustus, die van Miji African Dancers van de 29e. De laatste voorstelling
          van Kroka&apos;s Lodge om 19 uur staat niet op de tijdlijn, omdat het park om 18 uur sluit
          en doorgerekende tijden na sluitingstijd wegvallen.
        </P>
      </Chapter>

      <Chapter
        id="grenzen"
        index="07"
        icon={HelpCircle}
        kicker="Grenzen"
        title="Ontbrekende gegevens en waar het plan wordt bewaard"
      >
        <P>
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> laat zijn wachttijden
          alleen zien in de eigen app op het wifi van het park, dus komt er voor dat park nooit een
          getal binnen, en wij verzinnen er ook geen. De weersverwachting reikt ongeveer twee weken;
          voor latere dagen staat er dat ze zo ver niet reikt, in plaats van een gat dat leest als
          &ldquo;blijft droog&rdquo;.
        </P>
        <P>
          Op de dag zelf kan een attractie stilvallen, een show niet doorgaan of een onweersbui de
          middag in de war sturen. Het plan rekent uit of de dag met de voorspelde wachttijden kan
          kloppen. In het park vink je af wat je gereden hebt, en bij elke afgevinkte attractie
          staat dan de wachttijd die er werkelijk stond.
        </P>
        <P>
          Het plan staat in je browser, een account heb je niet nodig. Pas als je meldingen aanzet,
          zetten we een kopie op onze server, en dat staat er op dat moment ook bij. Zonder plan
          begin je bij de assistent en zijn vier vragen: welk park, welke dag, wie er meegaat en
          welke grote attracties in de dag moeten. De passende dag vind je het makkelijkst in de{' '}
          <A href={`${PARK}/wachttijden-kalender`}>wachttijdenkalender</A> van een park.
        </P>
      </Chapter>
    </>
  );
}
