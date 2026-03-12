# Glossary Feature Plan

## 1. Translation System: Content-Split-Strategie

### Problem heute
`messages/{locale}.json` ist eine monolithische Datei (~762 Zeilen). Passt nicht für
content-schwere Seiten wie Glossar, Howto oder zukünftige Guides.

### Lösung: Zwei-Schichten-Modell

```
messages/          ← UI-Strings (Labels, Buttons, SEO-Meta) – bleibt wie heute
  en.json
  de.json  ...

content/           ← Inhaltsdaten (strukturiert, versionierbar)
  glossary/
    types.ts       ← TypeScript-Typen
    categories.ts  ← Kategorie-Definitionen
    en.ts          ← Englische Glossareinträge
    de.ts          ← Deutsche Glossareinträge
    fr.ts
    ...
    index.ts       ← Aggregator + Hilfsfunktionen (getTermBySlug, getTermsByCategory …)
  home/            ← (already exists – announce.*.md)
  howto/           ← (future: howto content aus page.tsx herausziehen)
```

**Prinzip:** `messages/` = React-nahe Strings via `useTranslations()`.
`content/` = Datenobjekte, die per Import oder `generateStaticParams` genutzt werden.

### next-intl request.ts: Namespace-Splitting (für andere Seiten)
Wenn `messages/en.json` weiter wächst, kann auf Directory-Struktur migriert werden:

```ts
// i18n/request.ts (Zukunft)
messages: Object.assign(
  {},
  await import(`../messages/${locale}/common.json`),
  await import(`../messages/${locale}/parks.json`),
  // Seiten-spezifisch nur bei Bedarf
)
```

Für jetzt: `glossary`-Namespace (UI-Strings) wird in `messages/{locale}.json` ergänzt.
Content-Daten kommen aus `content/glossary/`.

---

## 2. Glossar-Term-Datenstruktur

```ts
// content/glossary/types.ts

export type GlossaryCategory =
  | 'coaster-elements'   // Looping, Corkscrew, Immelmann …
  | 'coaster-physics'    // G-Kräfte, Airtime, Laterals …
  | 'coaster-types'      // Launched, Wing, Dive, RMC …
  | 'wait-times'         // Standby, Single Rider, FastPass …
  | 'crowd-management'   // Crowd Level, Stoßzeit, Ferien …
  | 'park-operations'    // Refurbishment, Downtime …
  | 'planning';          // Crowd Calendar, KI-Prognose …

export interface GlossaryTerm {
  slug: string;           // URL: /glossary/lateral-g-force
  term: string;           // Anzeigename
  shortDef: string;       // 1-Satz-Definition (für Tooltip + Suchergebnisse)
  definition: string;     // Vollständige Erklärung (Markdown)
  category: GlossaryCategory;
  aliases?: string[];     // Erkennungs-Keywords für Auto-Linker (z.B. ["laterals", "Seitkräfte"])
  relatedTerms?: string[]; // Slugs verwandter Begriffe
  seeAlso?: string[];     // Externe Links (z.B. Wikipedia)
}
```

---

## 3. Vollständige Begriffsliste (EN + DE)

### Kategorie: coaster-elements (Achterbahn-Elemente)

| Slug | EN Term | DE Term | Aliases |
|------|---------|---------|---------|
| `vertical-loop` | Vertical Loop | Looping / Vertikale Schleife | loop, looping |
| `corkscrew` | Corkscrew | Korkenzieher | corkscrew |
| `immelmann` | Immelmann | Immelmann | immelmann turn |
| `zero-g-roll` | Zero-G Roll | Zero-G Roll / Heartline Roll | zero g roll, heartline |
| `cobra-roll` | Cobra Roll | Cobra Roll | cobra roll, boomerang |
| `dive-loop` | Dive Loop | Tauchschleife | dive loop |
| `batwing` | Batwing | Batwing | batwing |
| `pretzel-loop` | Pretzel Loop | Pretzelschleife | pretzel loop |
| `top-hat` | Top Hat | Top Hat | top hat |
| `stengel-dive` | Stengel Dive | Stengel Dive | stengel dive |
| `camelback` | Camelback / Airtime Hill | Airtime-Hügel | camelback, airtime hill |
| `helix` | Helix | Helix / Spirale | helix |
| `banked-turn` | Banked Turn | Überkantete Kurve | banked turn |
| `norwegian-loop` | Norwegian Loop | Norwegische Schleife | norwegian loop |
| `cutback` | Cutback | Cutback | cutback |

### Kategorie: coaster-physics (Physik)

| Slug | EN Term | DE Term | Aliases |
|------|---------|---------|---------|
| `airtime` | Airtime | Airtime / Schwebegefühl | airtime |
| `ejector-airtime` | Ejector Airtime | Ejector-Airtime | ejector airtime, ejector |
| `floater-airtime` | Floater Airtime | Floater-Airtime | floater airtime, floater |
| `lateral-g-force` | Lateral G-Force | Seitkräfte / Laterals | laterals, lateral Gs, Seitkräfte |
| `positive-g-force` | Positive G-Force | Positive G-Kräfte | positive Gs, positive g-force |
| `negative-g-force` | Negative G-Force | Negative G-Kräfte | negative Gs, ejector |
| `head-chopper` | Head Chopper | Head Chopper / Kopfabschneider | head chopper |
| `launch-force` | Launch / Beschleunigung | Launch / Katapultstart | launch, katapult |

### Kategorie: coaster-types (Achterbahn-Typen)

| Slug | EN Term | DE Term | Aliases |
|------|---------|---------|---------|
| `launched-coaster` | Launched Coaster | Katapultachterbahn | launched coaster |
| `inverted-coaster` | Inverted Coaster | Hängeachterbahn | inverted coaster, inverted |
| `wing-coaster` | Wing Coaster | Wing Rider / Flügelachterbahn | wing coaster, wing rider |
| `dive-coaster` | Dive Coaster | Sturzflugbahn | dive coaster, dive machine |
| `hyper-coaster` | Hyper Coaster | Hyper-Coaster | hyper coaster |
| `giga-coaster` | Giga Coaster | Giga-Coaster | giga coaster |
| `strata-coaster` | Strata Coaster | Strata-Coaster | strata coaster |
| `rmc-coaster` | RMC Coaster | RMC-Umbau | RMC, rocky mountain |
| `wooden-coaster` | Wooden Coaster | Holzachterbahn | wooden coaster, holzachterbahn |
| `lsm-launch` | LSM Launch | LSM-Start | LSM, linear synchronous motor |
| `lim-launch` | LIM Launch | LIM-Start | LIM, linear induction motor |
| `hydraulic-launch` | Hydraulic Launch | Hydraulischer Start | hydraulic launch |
| `bobsled-coaster` | Bobsled Coaster | Bobkart-Achterbahn | bobsled, bobkart |

### Kategorie: wait-times (Wartezeiten)

| Slug | EN Term | DE Term | Aliases |
|------|---------|---------|---------|
| `standby-queue` | Standby Queue | Normale Warteschlange | standby queue, standby |
| `single-rider` | Single Rider Lane | Single-Rider-Schlange | single rider |
| `virtual-queue` | Virtual Queue | Virtuelle Warteschlange | virtual queue, virtual line |
| `boarding-group` | Boarding Group | Boarding-Gruppe | boarding group |
| `fastpass` | FastPass | FastPass | fastpass, fast pass |
| `lightning-lane` | Lightning Lane | Lightning Lane | lightning lane |
| `express-pass` | Express Pass | Express Pass | express pass |
| `return-time` | Return Time | Rückkehrzeit | return time |
| `ride-capacity` | Ride Capacity | Kapazität / Durchsatz | capacity, throughput |
| `downtime` | Downtime | Ausfallzeit | downtime |

### Kategorie: crowd-management (Besuchersteuerung)

| Slug | EN Term | DE Term | Aliases |
|------|---------|---------|---------|
| `crowd-level` | Crowd Level | Besucherdichte | crowd level |
| `peak-hour` | Peak Hour | Stoßzeit | peak hour, stoßzeit |
| `school-holidays` | School Holidays | Schulferien | school holidays, schulferien |
| `bridge-day` | Bridge Day | Brückentag | bridge day, brückentag |
| `seasonality` | Seasonality | Saisonalität | seasonality |
| `early-entry` | Early Entry / Extra Magic Hours | Early Entry | early entry, extra magic hours |

### Kategorie: park-operations (Parkbetrieb)

| Slug | EN Term | DE Term | Aliases |
|------|---------|---------|---------|
| `refurbishment` | Refurbishment | Revision / Generalüberholung | refurbishment, revision |
| `technical-downtime` | Technical Downtime | Technische Panne | technical downtime |
| `soft-opening` | Soft Opening | Soft Opening / Voröffnung | soft opening |
| `extended-hours` | Extended Hours | Verlängerte Öffnungszeiten | extended hours |

### Kategorie: planning (Planung)

| Slug | EN Term | DE Term | Aliases |
|------|---------|---------|---------|
| `crowd-calendar` | Crowd Calendar | Besucherkalender | crowd calendar |
| `ai-prediction` | AI Prediction | KI-Prognose | ai prediction, ki prognose |
| `touring-plan` | Touring Plan | Tagesplan | touring plan |
| `best-time-to-visit` | Best Time to Visit | Beste Reisezeit | best time to visit |
| `trend-indicator` | Trend Indicator | Trendindikator | trend indicator, trending |

**Gesamt: ~55 Begriffe** über 7 Kategorien.

---

## 4. Seiten-Struktur

```
app/[locale]/glossary/
  page.tsx           ← Index: Suche + Kategoriefilter + alle Begriffe (A–Z)
  [slug]/
    page.tsx         ← Detailseite eines Begriffs
```

### Glossar-Index-Seite (`/glossary`)
- **Suchfeld** (client-side, filtert in Echtzeit über term + aliases + shortDef)
- **Kategorie-Tabs** oder Chips zum Filtern
- **A–Z-Rasteransicht** mit `shortDef` Preview
- **SEO:** `ItemList` Schema.org + alle Begriffe als `DefinedTerm`

### Glossar-Detailseite (`/glossary/[slug]`)
- Breadcrumb: Home > Glossary > Term
- Vollständige Definition (Markdown → HTML)
- Kategorie-Badge
- Verwandte Begriffe (Links)
- FAQ-Schema mit `Q: Was ist X? A: <shortDef>`
- `DefinedTerm` Schema.org

---

## 5. GlossaryLinker-Komponente

Erkennt Glossar-Keywords in beliebigem Text/React-Children und verlinkt sie automatisch.

```tsx
// components/glossary/glossary-linker.tsx

interface GlossaryLinkerProps {
  children: React.ReactNode;
  locale: string;
  maxLinks?: number;     // verhindert Spam (default: 3 pro Begriff)
  firstOnly?: boolean;   // nur erste Erwähnung verlinken (default: true)
}

// Verwendung:
<GlossaryLinker locale={locale}>
  <p>Der Taron verfügt über einen Immelmann und intensive Laterals.</p>
</GlossaryLinker>
// → "Immelmann" und "Laterals" werden zu <Link href="/de/glossary/immelmann"> etc.
```

**Implementierung:**
1. Baut eine Map: `alias (lowercase) → { slug, term }`
2. Traversiert React-Children rekursiv
3. Bei String-Nodes: Regex-Split anhand aller bekannten Aliases
4. Wrapped Treffer mit `<Link>` + `<abbr title={shortDef}>`
5. Skippt bereits verlinkte Nodes (verhindert Doppel-Links)
6. Server-Component-kompatibel (kein State nötig)

**Auch verwendbar als:**
```tsx
// Für plain strings (z.B. in FAQ-Antworten):
import { linkifyGlossaryTerms } from '@/lib/glossary/linkify';
const html = linkifyGlossaryTerms(text, terms, locale);
```

---

## 6. Messages-Namespace für Glossar-UI

Ergänzung in `messages/{locale}.json`:

```json
"glossary": {
  "title": "Theme Park Glossary",
  "description": "All terms explained: wait times, coaster elements, crowd management and more.",
  "searchPlaceholder": "Search terms…",
  "allCategories": "All Categories",
  "relatedTerms": "Related Terms",
  "categories": {
    "coaster-elements": "Coaster Elements",
    "coaster-physics": "Physics & Forces",
    "coaster-types": "Coaster Types",
    "wait-times": "Wait Times",
    "crowd-management": "Crowd Management",
    "park-operations": "Park Operations",
    "planning": "Planning"
  }
}
```

---

## 7. Datei-Übersicht (neu)

```
content/glossary/
  types.ts
  categories.ts
  en.ts             (~55 Einträge mit EN definitions)
  de.ts             (~55 Einträge mit DE definitions)
  fr.ts / es.ts / it.ts / nl.ts
  index.ts          (getTermBySlug, getTermsByCategory, getAllSlugs, buildAliasMap)

app/[locale]/glossary/
  page.tsx
  [slug]/page.tsx

components/glossary/
  glossary-linker.tsx     (Auto-Link Wrapper Component)
  glossary-card.tsx       (Term-Karte für Index)
  glossary-search.tsx     (Client-seitige Suche)
  glossary-category-filter.tsx

lib/glossary/
  linkify.ts        (Pure function: string → annotated string)
```

---

## 8. Wiederverwendbarkeit des Patterns

Das **Content-in-`content/`-Muster** lässt sich direkt auf andere Seiten übertragen:

| Seite | Heute | Mit neuem Pattern |
|-------|-------|-------------------|
| **Howto** | Alles in `page.tsx` hardcodiert | `content/howto/en.ts` → Sections als Datenobjekte |
| **Glossar** | — | `content/glossary/en.ts` ← **neu** |
| **Park-Guides** | — | `content/guides/{park-slug}/en.ts` |
| **Saisonale Guides** | — | `content/seasonal/summer-en.ts` |
| **Blog/Artikel** | — | `content/articles/{slug}/en.md` |

Das messages-Splitting (Directory statt Datei) kann **optional** migriert werden sobald
`messages/en.json` > ~1500 Zeilen wird. Die Infrastruktur in `request.ts` braucht dann
nur ~5 Zeilen Änderung.
