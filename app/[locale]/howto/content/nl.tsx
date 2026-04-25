import React from 'react';
import { Link } from '@/i18n/navigation';
import { PopularParksGridClient } from '@/components/home/featured-parks-section-client';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { cn } from '@/lib/utils';
import { HeroSearchInput } from '@/components/search/hero-search-input';
import { NearbyParksCard } from '@/components/parks/nearby-parks-card';
import {
  Search,
  Star,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  XCircle,
  Wrench,
  User,
  Zap,
  Ticket,
  TrendingDown,
  Minus,
  PartyPopper,
  Backpack,
  Calendar,
  ChevronRight,
  Snowflake,
  Sun,
  Leaf,
  EyeOff,
} from 'lucide-react';
import { Section, SubSection, DemoBadge, InfoBox, TipBox, PersonaCard, Li } from '../_howto-ui';
import {
  MockParkHeader,
  MockAttractionCards,
  MockShowCards,
  MockNearbyCards,
  MockHourlyChart,
} from '../_mock-components';
import { LiveCalendarExample } from '../_live-calendar';

function IntroNL() {
  return (
    <div className="space-y-4">
      <div className="space-y-4 text-base leading-relaxed">
        <p className="text-muted-foreground text-lg font-medium">
          Klinkt dit bekend? 80 minuten in de rij voor Taron — en tien meter verderop staat er
          niemand bij een andere attractie. Of: je boekt je vakantie en ontdekt dat die week precies
          de schoolvakantie valt.
        </p>
        <p className="text-muted-foreground">
          park.fan is gebouwd vanuit precies die frustratie. Wat begon als een klein zijproject –
          &quot;ik ga gewoon wat wachttijden bijhouden&quot; – is uitgegroeid tot een platform met
          live data van 150+ parken, meer dan 5.000 attracties en miljoenen wachtrij-datapunten die
          dagelijks worden verwerkt.
        </p>
        <p className="text-muted-foreground">
          Het doel is eenvoudig: <strong>neem het giswerk weg uit je pretparkbezoek.</strong>{' '}
          Gebruik de drukte-kalender om de juiste dag te kiezen, navigeer met live wachttijden en
          vertrouw op AI-voorspellingen om te weten wanneer elke attractie het rustigst is. Deze
          pagina legt elke functie in detail uit.
        </p>
      </div>
      <nav aria-label="Inhoudsopgave" className="bg-muted/40 not-prose rounded-xl border p-5">
        <p className="mb-3 font-semibold">Inhoudsopgave</p>
        <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          {[
            ['#suche', '1. Zoeken'],
            ['#standort', '2. Locatie'],
            ['#favoriten', '3. Favorieten'],
            ['#parkseite', '4. De parkpagina'],
            ['#badges', '5. Badges & statussen'],
            ['#kalender', '6. Drukte-kalender'],
            ['#prognosen', '7. AI-voorspellingen'],
            ['#personas', '8. Voor wie?'],
            ['#parks', '9. Populaire parken'],
            ['#glossar', '10. Woordenlijst'],
            ['#faq', '11. FAQ'],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="hover:text-primary transition-colors">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

// Sections are shared across EN / ES / FR / IT / NL

function ContentNLSections() {
  return (
    <>
      {/* ── 1. Zoeken ────────────────────────────────────────────────────────── */}
      <Section id="suche" title="Zoeken">
        <p className="text-muted-foreground mb-4">
          De globale zoekfunctie is de snelste manier om een park, attractie, show of restaurant te
          vinden – zowel op desktop als mobiel.
        </p>

        <SubSection title="Zoeken openen">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Desktop:</strong> Druk op{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">Ctrl + K</kbd>{' '}
              of <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">⌘ + K</kbd>{' '}
              (Mac) om de zoekfunctie op elk moment te openen.
            </p>
            <p>
              <strong>Mobiel en Desktop:</strong> Tik op het <Search className="inline h-4 w-4" />
              -icoon in de koptekst of het zoekveld op de startpagina.
            </p>
          </div>
          <HeroSearchInput placeholder="Europa-Park, Taron, ..." />
        </SubSection>

        <SubSection title="Wat kun je zoeken?">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parken', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              { icon: '🎢', label: 'Attracties', desc: 'Taron, Silver Star, Space Mountain...' },
              { icon: '🗺️', label: 'Steden en Landen', desc: 'Orlando, Parijs, Duitsland...' },
              { icon: '🎭', label: 'Shows', desc: "Showschema's en tijden" },
              { icon: '🍽️', label: 'Restaurants', desc: 'Eetmogelijkheden in parken' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <InfoBox label="Opmerking">
          De zoekfunctie gebruikt slimme volledige tekstzoekopdrachten die ook werken bij
          typefouten. Zoek naar &quot;fantasia&quot; en je vindt &quot;Phantasialand&quot;.
        </InfoBox>
      </Section>

      {/* ── 2. Locatie ───────────────────────────────────────────────────────── */}
      <Section id="standort" title="Locatie en Nabijgelegen Parken">
        <p className="text-muted-foreground mb-4">
          Met je locatie ingeschakeld wordt park.fan slimmer: zie nabijgelegen parken en attracties
          gesorteerd op afstand. park.fan slaat je locatie niet op.
        </p>
        <SubSection title="Navigatie in het park">
          <p className="text-muted-foreground text-sm">
            Wanneer je in een park bent, detecteert park.fan automatisch in welk park je bent en
            toont &quot;Je bent in [Parknaam]&quot; op de startpagina. De parkkaart toont je live
            locatie – perfect voor navigeren tussen attracties.
          </p>
        </SubSection>
        <NearbyParksCard />
      </Section>

      {/* ── 3. Favorieten ────────────────────────────────────────────────────── */}
      <Section id="favoriten" title="Favorieten">
        <p className="text-muted-foreground mb-4">
          Sla parken, attracties, shows en restaurants op als favorieten voor snelle toegang direct
          vanaf de startpagina.
        </p>

        <SubSection title="Een favoriet toevoegen">
          <p className="text-sm">
            Klik op de <Star className="inline h-4 w-4 text-yellow-500" />
            -ster op een park- of attractiekaart. Favorieten worden lokaal opgeslagen in je browser
            – geen aanmelding vereist.
          </p>
        </SubSection>

        <SubSection title="Favorieten op de startpagina">
          <p className="text-muted-foreground text-sm">
            Zodra je minstens één favoriet hebt, verschijnt er een speciale sectie op de startpagina
            met al je opgeslagen parken, attracties, shows en restaurants. Met locatie ingeschakeld
            worden ze gesorteerd op afstand – dichtstbijzijnde eerst.
          </p>
          <MockNearbyCards locale="en" />
        </SubSection>

        <SubSection title="Wat wordt opgeslagen?">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                icon: '🌴',
                label: 'Parken',
                desc: 'Status, openingstijden en drukte in één oogopslag',
              },
              {
                icon: '🎢',
                label: 'Attracties',
                desc: 'Live wachttijd en trend direct in het overzicht',
              },
              { icon: '🎭', label: 'Shows', desc: 'Volgende showtime altijd zichtbaar' },
              { icon: '🍽️', label: 'Restaurants', desc: 'Keukenstatus en locatie' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <TipBox label="Tip">
          Sla 5–10 favoriete attracties op van het park dat je wilt bezoeken. Op de dag van je
          bezoek zie je direct welke korte wachttijden hebben – ideaal voor beslissingen ter plekke.
        </TipBox>
      </Section>

      {/* ── 4. Parkpagina ────────────────────────────────────────────────────── */}
      <Section id="parkseite" title="De Parkpagina">
        <p className="text-muted-foreground mb-4">
          Elk park heeft zijn eigen pagina met live data, openingstijden, een interactieve kalender
          en een kaart.
        </p>
        <InfoBox label="Opmerking">
          Alle tijden worden weergegeven in de <strong>lokale tijdzone van het park</strong> –
          ongeacht waar jij je bevindt. Een park in Florida toont Eastern Time, Europa-Park toont
          Midden-Europese Tijd.
        </InfoBox>
        <MockParkHeader locale="en" />

        <SubSection title="Tabbladen – Attracties, Shows, Kalender, Kaart">
          <div className="space-y-3 text-sm">
            {[
              {
                icon: '🎢',
                label: 'Attracties',
                desc: 'Alle attracties met live wachttijd, status, trend en vergelijking met het gemiddelde.',
              },
              {
                icon: '🎭',
                label: 'Shows',
                desc: 'Alle shows met huidige status en komende tijden.',
              },
              {
                icon: '📅',
                label: 'Kalender',
                desc: 'Vooruitblik van 30+ dagen met druktevoorspellingen, weer, feestdagen en schoolvakanties.',
              },
              {
                icon: '🗺️',
                label: 'Kaart',
                desc: 'Interactieve kaart met alle attracties, shows en restaurants.',
              },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold">
                  {icon} {label}
                </p>
                <p className="text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
          <MockAttractionCards locale="en" />
        </SubSection>

        <SubSection title="Tabblad Shows: Tijden in één oogopslag">
          <p className="text-muted-foreground text-sm">
            Het tabblad Shows toont alle shows met hun tijden voor vandaag. Verstreken tijden zijn
            doorgestreept, de <strong>volgende showtime</strong> is groen gemarkeerd – zodat je
            altijd weet wanneer en waar je moet zijn.
          </p>
          <MockShowCards />
        </SubSection>

        <SubSection title="Seizoensgebonden attracties & shows">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              Sommige seizoensattracties en shows zijn alleen actief in bepaalde seizoenen — zoals
              ijsbanen in de winter of waterattracties in de zomer. park.fan detecteert dit
              automatisch en verbergt deze items buiten hun seizoen standaard.
            </GlossaryInject>
          </p>
          <div className="not-prose space-y-4">
            <div className="space-y-2">
              {[
                {
                  icon: Snowflake,
                  label: 'Winter',
                  color: 'border border-sky-500/30 bg-sky-500/15 text-sky-400',
                  opacity: '',
                  desc: 'Attractie is momenteel in seizoen (bijv. winterevenement). Badge verschijnt op de kaart.',
                },
                {
                  icon: Sun,
                  label: 'Zomer',
                  color: 'border border-amber-500/30 bg-amber-500/15 text-amber-500',
                  opacity: '',
                  desc: 'Zomerattractie – bijv. wildwaterbaan. Actief van mei tot september.',
                },
                {
                  icon: Leaf,
                  label: 'Seizoensgebonden',
                  color: 'border border-violet-500/30 bg-violet-500/15 text-violet-500',
                  opacity: 'opacity-50',
                  desc: 'Buiten seizoen: badge gedempt. Attractie standaard verborgen in tabbladen en op de kaart.',
                },
              ].map(({ icon: Icon, label, color, opacity, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-md',
                      color,
                      opacity
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3">
              <button className="border-border/60 bg-background/60 inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs shadow-md backdrop-blur-md">
                <EyeOff className="h-3 w-3" />3 buiten seizoen
              </button>
              <p className="text-muted-foreground text-sm">
                Wanneer er verborgen items buiten seizoen zijn, verschijnt deze knop naast de
                sectietitel. Klik erop om ze te tonen.
              </p>
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 5. Badges ────────────────────────────────────────────────────────── */}
      <Section id="badges" title="Badges en Statusindicatoren">
        <p className="text-muted-foreground mb-4">
          park.fan gebruikt een consistent kleursysteem om informatie direct begrijpelijk te maken.
        </p>

        <SubSection title="Park- en Attractiestatus">
          <div className="space-y-3">
            {[
              {
                icon: Clock,
                color: 'badge-status-operating',
                label: 'In bedrijf',
                desc: 'Attractie / park is in werking. Wachttijden worden live bijgewerkt.',
              },
              {
                icon: AlertTriangle,
                color: 'badge-status-down',
                label: 'Storing',
                desc: 'Tijdelijk gesloten – bijv. technisch probleem of veiligheidspauze. Meestal kort.',
              },
              {
                icon: XCircle,
                color: 'badge-status-closed',
                label: 'Gesloten',
                desc: 'Vandaag niet in bedrijf – seizoensluiting of geplande rustdag.',
              },
              {
                icon: Wrench,
                color: 'badge-status-refurbishment',
                label: 'Onderhoud',
                desc: 'Uitgebreid onderhoud. Gesloten voor dagen of weken.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={Icon} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Drukteniveaus">
          <p className="text-muted-foreground mb-3 text-sm">
            Het drukteniveau toont hoe druk een park of attractie is ten opzichte van de historische
            mediaan van de wachttijd (P50). 100% betekent precies even druk als een gemiddelde dag.
          </p>
          <div className="space-y-3">
            {[
              {
                color: 'badge-crowd-very-low',
                label: 'Zeer Laag',
                icon: User,
                threshold: '≤ 60% van P50',
                desc: 'Merkbaar rustiger dan gewoonlijk. Bijna geen wachtrijen – ideale bezoekdag.',
              },
              {
                color: 'badge-crowd-low',
                label: 'Laag',
                icon: User,
                threshold: '61–89% van P50',
                desc: 'Onder gemiddeld – korte wachttijden bij de meeste attracties.',
              },
              {
                color: 'badge-crowd-moderate',
                label: 'Matig',
                icon: Users,
                threshold: '90–110% van P50',
                desc: 'Typische dag – wachttijden binnen het verwachte bereik (±10% van mediaan).',
              },
              {
                color: 'badge-crowd-high',
                label: 'Hoog',
                icon: Users,
                threshold: '111–150% van P50',
                desc: 'Drukker dan gemiddeld – merkbaar langere wachttijden.',
              },
              {
                color: 'badge-crowd-very-high',
                label: 'Zeer Hoog',
                icon: Users,
                threshold: '151–200% van P50',
                desc: 'Zeer druk – wachttijden bijna twee keer zo lang als gewoonlijk. Kom vroeg aan.',
              },
              {
                color: 'badge-crowd-extreme',
                label: 'Extreem',
                icon: AlertTriangle,
                threshold: '> 200% van P50',
                desc: 'Recorddrukte – meer dan twee keer zo druk als een normale dag. Schoolvakanties, speciale evenementen.',
              },
            ].map(({ color, label, icon, threshold, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex min-w-[100px] flex-col gap-1 sm:min-w-[120px]">
                  <DemoBadge color={color} label={label} icon={icon} />
                  <span className="text-muted-foreground pl-1 font-mono text-[10px]">
                    {threshold}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
          <InfoBox label="Opmerking">
            <strong>Hoe wordt het drukteniveau berekend?</strong> park.fan vergelijkt de huidige
            gemiddelde wachttijd met de historische mediaan (P50). 100% betekent even druk als een
            gemiddelde dag; 60% is merkbaar rustiger, 200% betekent twee keer zo druk als normaal.
          </InfoBox>
        </SubSection>

        <SubSection title="Trendindicatoren">
          <div className="space-y-2">
            {[
              {
                icon: TrendingUp,
                color: 'text-trend-up',
                label: 'Stijgend',
                desc: 'Wachtrij wordt langer. Sluit snel aan.',
              },
              {
                icon: Minus,
                color: 'text-trend-stable',
                label: 'Stabiel',
                desc: 'Wachttijd blijft constant.',
              },
              {
                icon: TrendingDown,
                color: 'text-trend-down',
                label: 'Dalend',
                desc: 'Wachtrij wordt korter – goed moment om aan te sluiten.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`flex w-24 items-center gap-1 text-sm font-semibold ${color}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Wachtrij-typen">
          <div className="space-y-3">
            {[
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: User,
                label: 'Single Rider',
                termId: 'single-rider',
                desc: 'Vaak veel korter dan de gewone rij – maar je kunt niet met je groep meerijden.',
              },
              {
                color: 'badge-status-down',
                icon: Zap,
                label: 'Lightning Lane',
                termId: 'lightning-lane',
                desc: 'Betaald express-pas (bijv. bij Disney). Toont huidige prijs en terugtijdstip.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Terugtijdstip',
                termId: 'virtual-queue',
                desc: 'Gratis virtuele wachtrij – reserveer een tijdslot en kom later terug.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Boardinggroep',
                termId: 'boarding-group',
                desc: 'Virtuele wachtrij met groepsnummer – populair voor veelgevraagde nieuwe attracties.',
              },
            ].map(({ color, icon, label, termId, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} termId={termId} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ── 6. Drukte-kalender ───────────────────────────────────────────────── */}
      <Section id="kalender" title="De Drukte-Kalender">
        <p className="text-muted-foreground mb-4">
          De kalender is het krachtigste planningsinstrument op park.fan. Het toont een AI-gestuurde
          voorspelling voor elk van de komende 30+ dagen – drukteniveau, openingstijden, weer en
          speciale evenementen, alles in één oogopslag.
        </p>

        <SubSection title="Wat staat er op elke kalenderkaart?">
          <div className="bg-muted/30 rounded-xl border p-4 text-sm">
            <p className="mb-2 font-semibold">Een typische kalenderkaart toont:</p>
            <ul className="text-muted-foreground space-y-1.5">
              <li>
                📅 <strong>Datum en weekdag</strong>
              </li>
              <li>
                🎯 <strong>Druktebadge</strong> (bijv. &quot;Zeer Hoog&quot;) – de AI-voorspelling
                van de algehele drukte
              </li>
              <li>
                🕐 <strong>Openingstijden</strong> – of &quot;Geschat&quot; als nog niet officieel
                bevestigd
              </li>
              <li>
                🌤️ <strong>Weersvoorspelling</strong> met min-/maxtemperatuur
              </li>
              <li>
                ⌚ <strong>Gem. wachttijd</strong> – voorspelde gemiddelde wachttijd over alle
                attracties
              </li>
              <li>
                🎟️ <strong>Entreeprijs</strong>, wanneer gepubliceerd door het park
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            <strong>Wat betekent &quot;Geschat&quot;?</strong> Openingstijden gemarkeerd als
            &quot;Geschat&quot; zijn nog niet officieel bevestigd door het park. park.fan leidt ze
            af uit historische patronen – ze kunnen nog veranderen.
          </p>
        </SubSection>

        <SubSection title="Kalenderkaart-iconen">
          <div className="space-y-2 text-sm">
            {[
              {
                icon: PartyPopper,
                color: 'text-orange-500',
                label: 'Feestdag',
                desc: 'Parken zijn vaak langer open, maar ook drukker. Bekijk de voorspelling!',
              },
              {
                icon: Backpack,
                color: 'text-yellow-500',
                label: 'Schoolvakantie',
                desc: 'Doorgaans de drukste dagen van het jaar – extreme wachttijden mogelijk.',
              },
              {
                icon: Calendar,
                color: 'text-blue-500',
                label: 'Brugdag',
                desc: 'Waarschijnlijk drukker omdat veel mensen lange weekenden verlengen.',
              },
              {
                icon: XCircle,
                color: 'text-red-500',
                label: 'Park Gesloten',
                desc: 'Geen operatie op deze dag – geen voorspelling beschikbaar.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Praktisch voorbeeld: de beste bezoekdag vinden">
          <p className="text-muted-foreground mb-3 text-sm">
            Je plant een bezoek aan Europa-Park in oktober. Zo gebruik je de kalender:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                Open de parkpagina en schakel naar het tabblad <strong>Kalender</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                Je ziet meteen de schoolvakantieweken – veel kaarten met het{' '}
                <Backpack className="inline h-4 w-4 text-yellow-500" />
                -icoon en badges van <strong>&quot;Zeer Hoog&quot;</strong> of{' '}
                <strong>&quot;Extreem&quot;</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                Zoek een dinsdag of woensdag <em>zonder</em> feestdagicoon – deze tonen vaak
                <strong> &quot;Laag&quot;</strong> of <strong>&quot;Matig&quot;</strong>.
                Openingstijden en weersvoorspelling helpen je de definitieve keuze te maken.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                4
              </span>
              <span>
                Koop tickets vooraf – op groene voorspellingsdagen kunnen tickets snel uitverkocht
                zijn.
              </span>
            </li>
          </ol>
          <div className="mt-6">
            <LiveCalendarExample locale="nl" />
          </div>
        </SubSection>

        <SubSection title="Attractiekalender">
          <p className="text-muted-foreground text-sm">
            De detailpagina van elke attractie heeft ook een historische kalender die toont hoe druk
            het was op elke afgelopen dag – en of de attractie in bedrijf was of niet. Perfect om
            terugkerende patronen te herkennen: had Taron de afgelopen maand consequent korte
            wachttijden op donderdagmiddag? Volgende week misschien ook.
          </p>
        </SubSection>

        <TipBox label="Tip">
          De beste bezoekdagen zijn doorgaans vroege weekdagen buiten schoolvakanties – dinsdag tot
          donderdag vertonen de laagste drukteniveaus. Vermijd schoolvakantieweken in dichtbevolkte
          regio&apos;s.
        </TipBox>
      </Section>

      {/* ── 7. AI-Voorspellingen ─────────────────────────────────────────────── */}
      <Section id="prognosen" title="AI-Voorspellingen">
        <p className="text-muted-foreground mb-4">
          park.fan gebruikt machine learning om drukteniveaus en wachttijden dagen van tevoren te
          voorspellen. Het model wordt continu getraind op nieuwe data en houdt rekening met vier
          sleutelfactoren:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: '📊',
              title: 'Historische data',
              desc: 'Miljoenen wachtrij-datapunten per attractie, weekdag en tijdstip.',
            },
            {
              icon: '📅',
              title: 'Vakantiekalenders',
              desc: 'Schoolvakanties en feestdagen in Europa en wereldwijd.',
            },
            {
              icon: '🌤️',
              title: 'Weersvoorspellingen',
              desc: 'Temperatuur, regen en zonneschijn – slecht weer duwt bezoekers naar overdekte attracties.',
            },
            {
              icon: '🎉',
              title: 'Speciale evenementen',
              desc: 'Halloween-nachten, kerstevenementen en andere parkeigen data zorgen voor significant hogere bezoekersaantallen.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-muted/30 flex items-start gap-3 rounded-xl border p-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            </div>
          ))}
        </div>

        <SubSection title="Waar vind je voorspellingen?">
          <div className="space-y-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📅 In de drukte-kalender</p>
              <p className="text-muted-foreground mt-0.5">
                Elke kalenderkaart bevat een dagelijkse voorspelling: drukteniveau, gemiddelde
                wachttijd en openingstijden – tot 30+ dagen vooruit.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">⏰ Piekmomenten-badge op de parkpagina</p>
              <p className="text-muted-foreground mt-0.5">
                De parkkoptekst toont wanneer de druktepiek van vandaag verwacht wordt – bijv.
                &quot;Piek over 1u 30min&quot;. Plan een lunchpauze of bezoek een minder populaire
                attractie precies in dat tijdvenster.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📈 Uursvoorspellingsgrafiek op de attractiepagina</p>
              <p className="text-muted-foreground mt-0.5">
                Elke attractie heeft zijn eigen pagina met een grafiek die laat zien hoe wachttijden
                naar verwachting verlopen door de dag – voor vandaag en morgen.
              </p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Praktisch voorbeeld: voorspellingen gebruiken op de dag zelf">
          <p className="text-muted-foreground mb-3 text-sm">
            Je bezoekt Phantasialand op een zaterdag tijdens schoolvakanties. De kalender toont
            &quot;Zeer Hoog&quot;. Zo helpen voorspellingen:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                <strong>Bij de ingang:</strong> De piekmomenten-badge toont &quot;Piek over
                ~2u&quot; – je hebt tot ongeveer 11:30 voor je eerste hoogtepunten.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                <strong>Open de Taron-pagina:</strong> De voorspellingsgrafiek toont 9:30 ≈ 15 min,
                12:00 ≈ 65 min, 15:00 ≈ 40 min → rijd direct bij opening of midden in de middag.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                <strong>Lunch tijdens de piek:</strong> In plaats van in de rij te staan om 12:00,
                ga je lunchen. Live trends bevestigen: om 15:00 daalt de wachttijd – perfect moment
                om te rijden.
              </span>
            </li>
          </ol>
        </SubSection>

        <SubSection title="Hoe nauwkeurig zijn de voorspellingen?">
          <p className="text-muted-foreground text-sm">
            De nauwkeurigheid varieert per park en voorspellingsvenster. De detailpagina van elke
            attractie toont de voorspellingskwaliteit – van <strong>Slecht</strong> tot{' '}
            <strong>Uitstekend</strong>. Meer historische data betekent nauwkeurigere
            voorspellingen. Kortetermijnvoorspellingen (1–3 dagen) zijn van nature betrouwbaarder
            dan langetermijnvoorspellingen (7–14 dagen).
          </p>
        </SubSection>

        <SubSection title="Wachttijd-sparklines">
          <p className="text-muted-foreground text-sm">
            Elke attractiekaart toont een kleine sparkline-grafiek met de wachttijdtrend over de
            afgelopen uren. Je ziet direct of wachtrijen toenemen, stabiel blijven of afnemen.
          </p>
          <MockHourlyChart locale="en" />
        </SubSection>

        <TipBox label="Tip">
          Combineer kalender en voorspellingen: kies een groene dag uit de kalender, controleer dan
          de uursvoorspelling op de attractiepagina voor het rustigste tijdslot. Je arriveert altijd
          bij de kortste wachtrij.
        </TipBox>
      </Section>

      {/* ── 8. Voor wie ──────────────────────────────────────────────────────── */}
      <Section id="personas" title="Voor wie is park.fan?">
        <div className="grid gap-4 md:grid-cols-2">
          <PersonaCard
            emoji="👨‍👩‍👧‍👦"
            title="Gezinnen"
            subtitle="Een perfecte dag plannen voor iedereen"
          >
            <Li>Drukte-kalender: welke dag heeft de kortste wachtrijen?</Li>
            <Li>Weer in de kalender: regenachtige dag? Bekijk overdekte attracties!</Li>
            <Li>Favorieten: sla de 10 must-do attracties voor kinderen op.</Li>
            <Li>Live wachttijden: beslis ter plekke welke attractie je als volgende doet.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="🎢"
            title="Pretpark-enthousiastelingen"
            subtitle="Elke minuut moet geoptimaliseerd zijn"
          >
            <Li>Drukteniveau (P50-basis): begrijp of een attractie echt boven gemiddeld is.</Li>
            <Li>Historische trends: wanneer heeft Taron doorgaans korte wachttijden?</Li>
            <Li>Trendindicatoren: wachtrij stijgt? Wacht 20 minuten en het kan korter zijn.</Li>
            <Li>Single Rider / Lightning Lane: alle wachtrij-typen met tijden en prijzen.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="🌟"
            title="Eerstebezoekende"
            subtitle="Eerste bezoek aan een groot pretpark"
          >
            <Li>Zoeken: vind je park snel, ook als je de exacte naam niet weet.</Li>
            <Li>Parkkaart: oriënteer je voor en tijdens je bezoek.</Li>
            <Li>
              Statusbadges: groen = in bedrijf, oranje = kort probleem, grijs = vandaag gesloten.
            </Li>
            <Li>Drukte-kalender: kleuren zeggen alles – groen is goed, rood is stressvol.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="⚡"
            title="Spontane Bezoekers"
            subtitle="Last-minute beslissing, maximale efficiëntie"
          >
            <Li>Locatie: park.fan vindt automatisch je dichtstbijzijnde park.</Li>
            <Li>Live wachttijden: zie direct wat open is en hoe lang de wachttijd is.</Li>
            <Li>Trendindicatoren: wachtrij daalt? Perfect moment om aan te sluiten.</Li>
          </PersonaCard>
        </div>
      </Section>

      {/* ── 9. Populaire parken ─────────────────────────────────────────────── */}
      <Section id="parks" title="Populaire parken">
        <p className="text-muted-foreground mb-6">
          park.fan dekt 150+ pretparken wereldwijd. Hier zijn de meest bezochte parken in jouw regio
          met live data:
        </p>
        <PopularParksGridClient />
      </Section>

      {/* ── 10. Woordenlijst ─────────────────────────────────────────────── */}
      <Section id="glossar" title="De Woordenlijst & Termijn-Markering">
        <p className="text-muted-foreground mb-4">
          park.fan beheert een volledige{' '}
          <Link href="/woordenboek" className="text-primary underline">
            woordenlijst van pretparkbegrippen
          </Link>{' '}
          –{' '}
          <GlossaryInject>
            {`van wachttijden en drukte-niveaus tot achtbaanelementen en virtuele wachtrijen. Elke term bevat een korte definitie en een uitgebreide uitleg.`}
          </GlossaryInject>
        </p>

        <SubSection title="Automatische termijn-markering op attractiepagina's">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              {`Op attractiepagina's worden woordenlijst-termen automatisch herkend in tekst en onderstreept met een stippellijn. Bij hover verschijnt een korte definitie; klikken brengt je direct naar het volledige woordenlijst-item.`}
            </GlossaryInject>
          </p>
          <div className="bg-muted/30 rounded-xl border p-4 text-sm leading-relaxed">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Voorbeeldtekst (hover over de gestippelde termen)
            </p>
            <p>
              <GlossaryInject>
                {`De beste manier om je bezoek te plannen is de druktekalender te bekijken voor je boekt. Op een piekdag kunnen wachttijden voor populaire attracties 90 minuten overschrijden. Een virtuele wachtrij laat je een tijdslot reserveren zonder in de rij te staan, terwijl de single rider-rij je wacht meer dan de helft kan verminderen. Als het drukte-niveau hoog is, is een express pas vaak de moeite waard.`}
              </GlossaryInject>
            </p>
          </div>
        </SubSection>

        <TipBox label="Tip">
          De volledige woordenlijst is beschikbaar op{' '}
          <Link href="/woordenboek" className="text-primary font-medium underline">
            park.fan/woordenlijst
          </Link>{' '}
          met termen in 7 categorieën.
        </TipBox>
      </Section>

      {/* ── 11. Veelgestelde Vragen ──────────────────────────────────────────────────────────── */}
      <Section id="faq" title="Veelgestelde Vragen">
        <div className="space-y-4">
          {[
            {
              q: 'Hoe vaak worden wachttijden bijgewerkt?',
              a: 'Wachttijden worden elke minuut bijgewerkt. Voor sommige parken vinden updates elke 2–5 minuten plaats, afhankelijk van de databeschikbaarheid.',
            },
            {
              q: 'Waar komen de gegevens vandaan?',
              a: 'park.fan haalt live data op van ThemeParks.wiki, Queue-Times.com en Wartezeiten.app.',
            },
            {
              q: 'Is park.fan gratis?',
              a: 'Ja, park.fan is volledig gratis en vereist geen registratie.',
            },
            {
              q: 'Worden favorieten gesynchroniseerd tussen apparaten?',
              a: 'Nee, favorieten worden lokaal opgeslagen in je browser (localStorage). Ze zijn alleen beschikbaar op het apparaat waar je ze hebt opgeslagen.',
            },
            {
              q: 'Hoe ver vooruit doet de drukte-kalender voorspellingen?',
              a: 'De kalender toont voorspellingen voor 30+ dagen. Voorspellingen voor verdere datums zijn van nature iets minder nauwkeurig dan voorspellingen op korte termijn.',
            },
            {
              q: 'Hoeveel parken zijn er beschikbaar?',
              a: 'park.fan dekt momenteel 150+ parken met 5.000+ attracties wereldwijd – van Walt Disney World en Universal tot Europa-Park, Phantasialand en parken in Azië en Australië.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="group bg-muted/30 rounded-xl border">
              <summary className="cursor-pointer list-none p-4 font-semibold group-open:pb-2">
                <span className="flex items-start gap-2">
                  <ChevronRight className="text-primary mt-0.5 h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                  {q}
                </span>
              </summary>
              <p className="text-muted-foreground px-4 pb-4 text-sm">{a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}

export function ContentNL() {
  return (
    <div className="space-y-16 text-base leading-7">
      <IntroNL />
      <ContentNLSections />
    </div>
  );
}
