 
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
    question: 'Hoe nauwkeurig is Fancast?',
    answer:
      'De actuele nauwkeurigheid staat live bovenaan deze pagina — als MAE (gemiddelde afwijking in minuten), RMSE en MAPE. Die cijfers komen uit het echte vergelijken van eerdere voorspellingen met de wachttijden die daadwerkelijk zijn gemeten, niet uit een opgepoetst testlab. Ze veranderen zodra het model opnieuw traint.',
  },
  {
    question: 'Hoe ver vooruit kan Fancast voorspellen?',
    answer:
      'Fancast geeft dagelijkse drukteniveaus voor een park tot 365 dagen vooruit. Voor afzonderlijke attracties maakt het bovendien uurlijkse wachttijdvoorspellingen. Hoe dichter de dag nadert, hoe sterker kortetermijnsignalen zoals de weersverwachting meewegen.',
  },
  {
    question: 'Hoe vaak wordt het model bijgewerkt?',
    answer:
      'Elke dag. Fancast traint zichzelf automatisch één keer per dag om 06:00 UTC opnieuw op de verste data — inclusief de wachttijden van gisteren. Het wordt dus letterlijk elke ochtend een beetje beter.',
  },
  {
    question: 'Welke data gebruikt Fancast?',
    answer:
      'Live en historische wachttijden uit meer dan 150 parken, school- en feestdagenkalenders (ook van naburige regios), weersverwachtingen, openingstijden, speciale evenementen en seizoenspatronen. Uit die mix ontstaan de dagelijkse drukteniveaus en de uurlijkse wachttijdvoorspellingen.',
  },
  {
    question: 'Waarom toont een park “Geen voorspelling”?',
    answer:
      'Fancast beoordeelt een park pas als er genoeg exploitatiedata is — minstens ongeveer 30 exploitatiedagen. Gloednieuwe of zelden geopende parken hebben die basis nog niet, dus tonen we liever eerlijk “Geen voorspelling” dan een gegokt getal.',
  },
  {
    question: 'Kost Fancast iets?',
    answer:
      'Nee. Zoals heel park.fan is elke voorspelling, druk-kalender en statistiek gratis, reclamevrij en bruikbaar zonder account.',
  },
] as const;

export function ContentNL() {
  return (
    <div className="space-y-14 text-base leading-7">
      {/* Intro */}
      <div className="space-y-5">
        <Lead>
          Fancast is ons eigen voorspellingsmodel — het deel van park.fan dat naar de toekomst kijkt.
          De naam? Schaamteloos maar systematisch: <strong>fan</strong> zoals park.<strong>fan</strong>,{' '}
          <strong>cast</strong> zoals fore<strong>cast</strong>. Een weerbericht voor wachtrijen,
          eigenlijk.
        </Lead>
        <P>
          Het idee is even simpel als ambitieus: Fancast leest miljoenen echte live-wachttijden en
          voorspelt hoe druk een park op een willekeurige dag wordt — tot 365 dagen vooruit. Of
          zaterdag de moeite waard is, of dat je jezelf met dinsdag een plezier doet. Groen, geel of
          rood, lang voordat je in de auto zit.
        </P>
        <P>
          En omdat we alleen cijfers vertrouwen die zich moeten bewijzen, doet Fancast iets wat de
          meeste modellen stilletjes vermijden: het geeft zichzelf een cijfer. Elke voorspelling wordt
          later vergeleken met de wachttijd die er echt was — in het openbaar, hier op deze pagina.
          Valsspelen zinloos.
        </P>
        <Highlight>
          Kort gezegd: Fancast is geen waarzegger met een glazen bol. Het is een koppige statisticus
          die elke avond bijles krijgt en elke ochtend opnieuw examen moet doen. Een weerkikker die
          zijn eigen weer nachecken.
        </Highlight>

        <TocNav
          label="Inhoudsopgave"
          items={[
            ['#note', 'Het live rapportcijfer'],
            ['#ingredients', 'Wat Fancast leest'],
            ['#training', 'Hoe Fancast leert'],
            ['#levels', 'Groen, geel, rood'],
            ['#where', 'Waar je Fancast tegenkomt'],
            ['#limits', 'Waar de grenzen liggen'],
            ['#faq', 'Veelgestelde vragen'],
          ]}
        />
      </div>

      {/* Live scorecard — reuses the homepage ML section (live from the dashboard) */}
      <div id="note" className="scroll-mt-20 space-y-4">
        <P>
          Genoeg voorwoord — hier is het rapportcijfer, live en onopgesmukt. Fancast haalt deze cijfers
          op dit moment uit zijn eigen dashboard; ze verschuiven zodra het model vannacht opnieuw
          traint:
        </P>
      </div>
      <div className="-mx-4">
        <MLStatsSection />
      </div>

      {/* What it reads */}
      <Section id="ingredients" title="Wat Fancast leest" icon={Database}>
        <P>
          Een regenachtige brugdag in oktober is een volstrekt ander beest dan een zonnige
          vakantiezaterdag in juli — en dat moet een model eerst leren. Daarom voedt Fancast zich uit
          meerdere bronnen tegelijk:
        </P>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Live-wachttijden">
            Miljoenen echte metingen uit 150+ parken, elke minuut ververst. De ruwe munteenheid van
            elke voorspelling.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Kalenders & vakanties">
            Weekenden, feestdagen en schoolvakanties — ook van naburige regios, want dagjesmensen
            trekken zich niets aan van grenzen.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Weer">
            Regenkans en temperatuur buigen de korte-termijnvoorspellingen bij. Zon trekt de menigte
            aan, aanhoudende regen maakt de paden leeg.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Evenementen & seizoen">
            Halloween, zomervakantie, lange weekenden, een nieuwe topattractie in haar eerste zomer —
            de gebruikelijke verdachten van een volle dag.
          </IngredientCard>
          <IngredientCard icon={History} title="Historie">
            Jaren aan wachttijdgeschiedenis per park. Patronen die je alleen ziet als je er lang genoeg
            naar staart.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Openingstijden & capaciteit">
            Wanneer het park opent, hoe lang, met welke capaciteit — het kader waarin al het andere
            past.
          </IngredientCard>
        </IngredientGrid>
        <P>
          Uit die mix maakt het model twee dingen: een <strong>uurlijkse wachttijdvoorspelling</strong>{' '}
          voor afzonderlijke attracties en een <strong>dagelijks drukteniveau-cijfer</strong> voor het
          hele park.
        </P>
      </Section>

      {/* How it learns */}
      <Section id="training" title="Hoe Fancast leert (en niet kan valsspelen)" icon={RefreshCw}>
        <P>
          De belangrijkste truc is een onopvallende: Fancast traint <strong>elke nacht</strong>{' '}
          opnieuw, elke dag om 06:00 UTC. Wat gisteren gebeurde, weet het model vandaag. Een
          achtbaanfan wordt met de jaren ouder en vermoeider — Fancast wordt elke ochtend een beetje
          slimmer.
        </P>
        <P>
          En het wordt alleen getest op dagen die het <strong>nog nooit heeft gezien</strong> — op de
          toekomst, niet op uit het hoofd geleerde dagen uit het verleden. Al het andere zou zijn als
          jezelf vooraf de examenvragen toestoppen en daarna je tienenlijst vieren.
        </P>
        <P>
          Bovendien houdt Fancast in de gaten of het <strong>afdrijft</strong> — of de werkelijkheid
          het langzaam ontloopt. En een nieuwe modelversie gaat alleen live als die de oude echt
          verslaat in een eerlijk direct duel. Democratie onder algoritmen: wie niet beter is, blijft
          op de bank.
        </P>
      </Section>

      {/* Crowd levels */}
      <Section id="levels" title="Groen, geel, rood: de drukteniveaus" icon={Gauge}>
        <P>
          Aan het eind van al dat rekenwerk staat één enkele kleur. Zes niveaus, van “je hebt het park
          zowat voor jezelf” tot “welkom op een vakantiezaterdag”:
        </P>
        <CrowdLegend
          items={[
            {
              level: 'very_low',
              text: 'Bijna leeg. Rope-drop-dromen, ritten aan één stuk, een foto met de mascotte zonder rij.',
            },
            {
              level: 'low',
              text: 'Ontspannen. Korte wachttijden, je komt overal aan de beurt zonder een slagplan nodig te hebben.',
            },
            {
              level: 'moderate',
              text: 'Normale exploitatie. De toppers vullen zich, de rest blijft rustig. Een solide compromisdag.',
            },
            {
              level: 'high',
              text: 'Merkbaar druk. Voor de topattracties loont vroeg opstaan — of geduld meebrengen.',
            },
            {
              level: 'very_high',
              text: 'Flink druk. Lange rijen bij de hoogtepunten; plannen wint het duidelijk van spontaniteit.',
            },
            {
              level: 'extreme',
              text: 'Volledig alarm. Vakantiezaterdag in hartje zomer. Alleen aan te raden met strategie, uithoudingsvermogen en gevoel voor humor.',
            },
          ]}
        />
      </Section>

      {/* Where you meet it */}
      <Section id="where" title="Waar je Fancast tegenkomt" icon={MapPin}>
        <P>
          Fancast leeft niet op één eenzame pagina — het is verweven door heel park.fan, meestal zonder
          zich voor te stellen:
        </P>
        <TouchpointList
          items={[
            {
              title: 'Voorspelling van vandaag',
              body: 'het drukteniveau-cijfer in de parkheader, nog voordat je op de eerste attractie tikt.',
            },
            {
              title: 'Drukte-kalender',
              body: (
                <>
                  de <Link href="/parks">kalender met de beste bezoekdagen</Link> op elke parkpagina —
                  groen, geel, rood, tot een jaar vooruit.
                </>
              ),
            },
            {
              title: 'Beste bezoektijd',
              body: 'de rustigste weekdagen en de aankomende insiderdagen, gedestilleerd uit dezelfde data.',
            },
            {
              title: 'AI-voorspelling in de wachttijdgrafiek',
              body: 'de stippellijn die de goedkoopste tijdvensters van een attractie onthult.',
            },
            {
              title: 'Rope-drop-aanbeveling',
              body: 'het eerlijke antwoord op “loont het om vroeg te komen?” — inclusief de verwachte dalen.',
            },
          ]}
        />
        <P>
          Hoe dit allemaal binnen een park uitpakt, wordt stap voor stap doorlopen in de{' '}
          <Link href="/howto">volledige gids</Link>.
        </P>
      </Section>

      {/* Limits */}
      <Section id="limits" title="Waar Fancast (voorlopig) stil blijft" icon={ShieldAlert}>
        <P>
          Fancast is goed, maar niet zelfoverschattend — en het vertelt je wanneer het liever stil
          blijft. Voor parken met <strong>minder dan ongeveer 30 exploitatiedagen</strong> aan data is
          er simpelweg geen cijfer; in plaats daarvan zegt het eerlijk “Geen voorspelling” in plaats van
          een gegokt getal:
        </P>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <CrowdLevelBadge level="unknown" />
          <span className="text-muted-foreground text-sm leading-relaxed">
            Nog niet te beoordelen — te weinig exploitatiedagen om met een gerust hart een kleur toe te
            kennen.
          </span>
        </div>
        <P>
          En zelfs waar Fancast een mening heeft, komt die met <strong>confidence</strong> — een eerlijk
          “vrij zeker” of “eerder een onderbuikgevoel”. Nieuwe parken, exotische speciale evenementen,
          een allereerste winterfestival: daar leert het model nog. Het wordt elk seizoen beter — de
          enige belofte is dat we het niet mooier maken dan het is.
        </P>
      </Section>

      {/* FAQ */}
      <Section id="faq" title="Veelgestelde vragen over Fancast" icon={HelpCircle}>
        <FaqList items={FAQ} />
      </Section>
    </div>
  );
}
