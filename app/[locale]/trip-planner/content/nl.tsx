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
        title="Wat de planner van een parkdag maakt"
      >
        <P>
          Een blok is een attractie, en de hoogte ervan is de wachttijd die voor dat uur voorspeld
          wordt. Sleep hetzelfde blok naar een druk uur en het groeit; zet het in een rustig uur en
          het krimpt. Tussen twee blokken staat geen lege ruimte maar de overstap: hoe ver het is,
          en of daar tijd voor is. Het uitstappen en de rit zelf zitten daarin, niet in het blok.
        </P>
        <P>
          Wat hieronder staat is niet nagetekend. Het zijn dezelfde onderdelen die in de planner
          draaien, gevoed met het antwoord dat de API op 4 september 2026 gaf voor zaterdag 12
          september in <A href={PARK}>Phantasialand</A>. Sleep een blok naar een ander uur: het
          klikt op vijf minuten vast, rekent zijn hoogte opnieuw uit en de overstappen ernaast ook.
          Er wordt hier niets opgeslagen.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          Het geselecteerde blok zegt het met zoveel woorden: het tijdstip, de verwachte wachttijd
          en hoever de voorspelling voor die attractie er meestal naast zit.
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
          zaterdag op 45 minuten om tien, 50 om elf, 40 om één en weer 50 &apos;s avonds. Dat is de
          echte reden om Taron vroeg te rijden: niet omdat het &apos;s ochtends altijd rustiger is,
          maar omdat deze dag voor deze attractie geen rustig uur heeft. Black Mamba doet het
          omgekeerd en zakt van 35 minuten rond het middaguur naar 20 om zes, en Chiapas klimt van
          20 naar 35.
        </P>
        <P>
          Daar komt bij hoever het getal er meestal naast zit, en dat volgt het niveau: hoe langer
          een rij, hoe groter de spreiding. Voor de attracties waarvan de dagpiek op 35 minuten of
          meer ligt, noemt de API op deze zaterdag een gebruikelijke afwijking van 15,4 minuten,
          voor de vlakkere 10,9. Gebruikelijk betekent: de helft van de dagen zit er verder naast.
          Daarom zet de planner het als plus-minus bij het geselecteerde blok en nooit als een marge
          waar het juiste antwoord al in zit.
        </P>
        <Note>
          Achter de curve van Taron staan 142 gemeten dagen, achter Black Mamba 161. Hoeveel het er
          zijn, staat op <A href={`${PARK}/taron`}>de pagina van de attractie</A>.
        </Note>
        <P>
          De planner zegt er ook bij wat voor voorspelling hij vasthoudt. Rekent het model de dag
          per uur door, dan staat dat er. Komt de hoogte van de dag uit de voorspelling en de vorm
          uit eerdere dagen, zoals op deze zaterdag, dan staat dat er. Ver vooruit wordt die hoogte
          zelf dun en blijft er een ruwe schatting over. Voor een dag die nooit gemeten is, is er
          helemaal geen plan met getallen.
        </P>
      </Chapter>

      <Chapter
        id="openingstijden"
        index="03"
        icon={Sunrise}
        kicker="Opening"
        title="Het park opent om negen uur, de attractie om tien"
      >
        <P>
          Phantasialand opent op deze zaterdag om 9 uur. Taron, F.L.Y., beide Winja&apos;s en Raik
          draaien vanaf 10 uur, Chiapas vanaf 10:15. Wie om negen uur bij het tourniquet staat, kan
          Black Mamba rijden of Maus au Chocolat, en daar houdt het op. Dat is geen detail: een plan
          dat het eerste uur met headliners vult, plant een uur in dat er niet is.
        </P>
        <P>
          De planner kent de openingstijd van elke afzonderlijke attractie en laat een blok er niet
          voor schuiven. Voor de avond bestaat geen tegenhanger: geen enkele feed meldt betrouwbaar
          wanneer een attractie sluit, dus wordt daar niets over beweerd. De tijdlijn stopt bij de
          sluitingstijd van het park.
        </P>
      </Chapter>

      <Chapter
        id="overstappen"
        index="04"
        icon={Footprints}
        kicker="De weg ertussen"
        title="Tussen twee attracties ligt een looproute, en die kost tijd"
      >
        <P>
          Een wachttijdenfeed kan zeggen dat Taron op 50 minuten staat. Wat hij niet kan zeggen: dat
          je het vanuit Rookburgh niet op tijd redt. Daar is de overstap voor. Die rekent met de
          afstand tussen de coördinaten van beide attracties, plus drie minuten om uit een station
          te komen en drie voor instappen en rijden waar geen ritduur bekend is.
        </P>
        <P>
          Die afstand is hemelsbreed, en zo wordt hij ook genoemd. Het is een ondergrens en nooit
          een looptijd: paden buigen om water, wachtrijen en eenrichtingsverkeer heen, en
          Phantasialand stapelt Rookburgh en Klugheim boven op elkaar. De bovengrens wordt daarom
          gerekend op parktempo in plaats van stevig doorlopen, met twee derde extra op de
          hemelsbrede afstand voor de omweg.
        </P>
        <Note>
          &bdquo;Krap&rdquo; betekent niet smal. Het betekent dat deze overstap niet meer uitkomt
          als de voorspelling er zo ver naast zit als ze zelf aangeeft. Waar de API geen spreiding
          levert, blijft het oordeel op &bdquo;goed&rdquo; staan en zegt dat er in de titel bij.
        </Note>
      </Chapter>

      <Chapter
        id="volgorde"
        index="05"
        icon={Wand2}
        kicker="Sorteren"
        title="De dag kan zichzelf op volgorde zetten"
      >
        <P>
          Twee knoppen nemen dat over. &bdquo;Alle headliners inplannen&rdquo; haalt de grote
          attracties van het park erbij die nog niet in de dag staan en zet daarna alles op
          volgorde. &bdquo;Dag optimaliseren&rdquo; voegt niets toe en herschikt alleen wat er al
          gepland is. Achter allebei draait dezelfde som; het zijn twee knoppen omdat het twee
          vragen zijn: vul mijn dag, en kan de volgorde beter.
        </P>
        <P>
          Er wordt op drie dingen gesorteerd, en de rangorde daartussen is de eigenlijke keuze.
          Eerst telt dat alles nog voor sluitingstijd aan de beurt komt: een plan met één attractie
          minder die echt doorgaat, wint van een plan met er één meer die het niet haalt. Daarna de
          som van de wachttijden, waar het om gevraagd was. En kosten twee volgordes evenveel, dan
          wint de volgorde die eerder klaar is. Een schuifje dat wachten tegen rondhangen afweegt is
          er niet: dat getal zou niemand kunnen verdedigen.
        </P>
        <P>
          Een regel over de vroege ochtend zit er niet in. De planner kent alleen de uurcurve van
          elke afzonderlijke attractie. Ligt die vlak na opening het laagst, dan rolt &bdquo;eerst
          de grote attractie&rdquo; er vanzelf uit; ligt hij vlak, dan komt er iets anders uit. Op
          een gemeten dag staat Taron uur na uur op 60, 60, 54, 53 en 59 minuten, terwijl Chiapas 22
          minuten stijgt. Een vaste regel zou allebei hetzelfde adviseren.
        </P>
        <P>
          Soms is het voorstel om een rondje te wachten in plaats van meteen in de rij te gaan
          staan. Dat gebeurt onder één voorwaarde: de rij moet zo ver inzakken dat je, die pauze
          meegerekend, eerder weer vrij bent dan wanneer je meteen was gaan staan. Korter in de rij
          staan alleen is niet genoeg, en langer wordt de dag er nooit van. Langer dan twee uur laat
          de planner niemand wachten. Die bovengrens komt uit zichzelf bijna nooit in beeld: een
          pauze loont alleen als hij korter is dan de rij die hij bespaart, en twee uur pauze zou
          dus een rij van meer dan twee uur vragen.
        </P>
        <P>
          Een middagpauze om één uur blijft om één uur, en een afgevinkte attractie is gereden en
          wordt niet opnieuw ingepland; daar wordt omheen gepland. Achteraf staat er wat er gebeurd
          is. &bdquo;18 min. minder wachten&rdquo; is het verschil tussen twee sommen van dezelfde
          rekenwijze, één voor en één na de klik; valt er niets te winnen, dan staat er dat het al
          goed staat en blijft het plan zoals het was. Bij de headlinerknop ontbreekt die winst,
          omdat de dag met de nieuwe attracties langer wordt; geteld wordt dan hoeveel attracties
          erbij zijn gekomen en hoeveel er niet bij het gezelschap passen. Wat er aan het eind niet
          meer in de dag past, wordt na allebei de knoppen gemeld. Er hoort een &bdquo;Ongedaan
          maken&rdquo; bij dat de stand van voor de klik terugzet, zolang de planner openstaat.
        </P>
        <Note>
          Waar geen wachttijden binnenkomen, verschijnen de twee knoppen helemaal niet. In het
          Hansa-Park kost elke attractie dezelfde aangenomen nul, dus is elke volgorde net zo goed
          als elke andere en valt er niets te sorteren.
        </Note>
      </Chapter>

      <Chapter
        id="speeltijden"
        index="06"
        icon={Theater}
        kicker="Shows"
        title="Een speeltijd komt van het park of uit onze rekensom"
      >
        <P>
          Voor vandaag heeft de API de eigen opgave van het park. Voor elke andere datum kent geen
          enkele bron de tijden vooraf, dus wordt de laatste gelijke weekdag doorgerekend, met de
          datum erbij waar de tijden vandaan komen en uit hoeveel dagen. Die twee mogen er niet
          hetzelfde uitzien: een doorrekening krijgt een tilde voor het tijdstip en het woord
          &bdquo;verwacht&rdquo;, een opgave van het park geen van beide.
        </P>
        <P>
          Op deze zaterdag zijn alle speeltijden doorgerekend: die van Dragon Drago en Kroka&apos;s
          Lodge van 15 augustus, die van Miji African Dancers van de 29e. De laatste voorstelling
          van Kroka&apos;s Lodge om 19 uur staat niet op de tijdlijn: het park sluit om 18 uur, en
          doorgerekende tijden na sluitingstijd vallen weg.
        </P>
      </Chapter>

      <Chapter
        id="grenzen"
        index="07"
        icon={HelpCircle}
        kicker="Grenzen"
        title="Wat de planner niet weet"
      >
        <P>
          Niet elk park publiceert wachttijden.{' '}
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> laat ze alleen zien
          in de eigen app op het wifi van het park, dus komt er voor dat park nooit een getal binnen
          en verzint de planner er ook geen. Voor dagen die ver weg liggen is er geen weer: de
          verwachting reikt ongeveer twee weken, en daarna staat dat er, in plaats van een gat dat
          leest als &bdquo;blijft droog&rdquo;.
        </P>
        <P>
          En wat een plan echt kost, beslist de dag zelf. Een attractie valt stil, een show gaat
          niet door, onweer draait de middag om. Het plan is dus geen dienstregeling maar een som
          over de vraag of de dag zo kan kloppen. In het park vink je af wat je gereden hebt, en de
          planner noteert de wachttijd die er werkelijk stond.
        </P>
        <P>
          Dat alles staat in je eigen browser. Geen account, geen server, geen synchronisatie: het
          plan is een bestand in je eigen opslag, en wie de planner zonder plan opent, krijgt de
          assistent met de drie vragen die eerst aan de beurt zijn. Welk park, welke dag, wie er
          meegaat. De dag zelf kies je het makkelijkst in de{' '}
          <A href={`${PARK}/wachttijden-kalender`}>wachttijdenkalender</A> van een park.
        </P>
      </Chapter>
    </>
  );
}
