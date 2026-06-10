# SEO Roadmap — park.fan

Erstellt April 2026 auf Basis einer Ranking-Analyse gegen wartezeiten.app, queue-times.com, ep-wartezeiten.net, skiptheq.de, thrill-data.com und touringplans.com.

---

## Befunde: Ranking-Lücken

| Keyword (DE)                           | #1              | park.fan  |
| -------------------------------------- | --------------- | --------- |
| "wartezeiten Europa-Park live"         | wartezeiten.app | ~8        |
| "Phantasialand wartezeiten heute"      | wartezeiten.app | **fehlt** |
| "Europa-Park wartezeiten prognose"     | wartezeiten.app | ~9        |
| "Freizeitpark crowd calendar prognose" | skiptheq.de     | **fehlt** |
| "beste Freizeitparks Deutschland 2026" | ADAC            | **fehlt** |

| Keyword (EN)                    | #1              | park.fan  |
| ------------------------------- | --------------- | --------- |
| "theme park wait times live"    | queue-times.com | ~9        |
| "when to visit Europa-Park"     | thrill-data.com | **fehlt** |
| "Disney World wait times today" | wdwpassport.com | **fehlt** |

**Kernproblem:** park.fan hat alle Daten, aber keinen indexierbaren Text-Content für die meistgesuchten Keyword-Cluster.

---

## Phasen-Übersicht

| Phase | Beschreibung               | Aufwand    | Wirkung   |
| ----- | -------------------------- | ---------- | --------- |
| **1** | Technische Quick Wins      | 1–2 Tage   | Fundament |
| **2** | "Wann besuchen"-Content    | 3–5 Tage   | Sehr hoch |
| **3** | Statistiken + Landingpages | 1–2 Wochen | Hoch      |
| **4** | Saison/Event-Content       | 1–2 Wochen | Mittel    |

---

## Phase 1 — Technische Quick Wins

### 1A · Sitemap: statische Seiten ergänzen ✅ (revidiert Juni 2026)

**Datei:** `app/sitemap.ts`

- `/[locale]/search` (ohne `?q=`) — priority 0.5, changeFrequency monthly ✅
- ~~`/[locale]/impressum`, `/[locale]/datenschutz`~~ — **nicht** in die Sitemap:
  beide Seiten sind inzwischen `noindex`, und noindex-URLs in der Sitemap
  erzeugen Search-Console-Fehler. Siehe [sitemaps.md](sitemaps.md).

### 1B · Search-Pages noindex ✅ (bereits erledigt)

`app/[locale]/search/page.tsx` setzt bereits `robots: { index: false, follow: true }` — kein Handlungsbedarf.

### 1C · Park-Seiten: lokalisierte Keywords ✅

**Datei:** `app/[locale]/parks/.../[park]/page.tsx`

Keywords-Array in `generateMetadata` enthielt hardcodierte EN-Strings ("wait times", "crowd calendar"). Ersetzt durch lokalisierte `seo.parks.keywords.*`-Strings aus den messages.

**Datei:** `messages/[de|fr|nl|es].json` — lokalisierte Keyword-Strings für `seo.parks.keywords`.

### 1D · Web App Manifest ✅

**Datei:** `app/manifest.ts`

PWA-Manifest mit name, short_name, description, icons, theme_color und background_color.

---

## Phase 2 — "Wann besuchen"-Content (größte Keyword-Lücke)

### 2A · `ParkBestDaysSection` Komponente ✅

**Datei:** `components/parks/park-best-days-section.tsx`

Server Component, erscheint auf der Park-Detailseite nach dem Crowd-Calendar. Generiert Textcontent aus `calendarData.days`:

- Beste Monate (z.B. "März–Mai und September")
- Beste Wochentage (z.B. "Dienstag und Mittwoch")
- Ferienzeiten-Warnung

Bediente Keywords (fehlen bisher komplett):

- DE: `[Park] wann besuchen`, `[Park] beste Reisezeit`, `[Park] am ruhigsten`
- EN: `best time to visit [park]`, `when is [park] least crowded`, `[park] best days`

**i18n:** Alle 5 Sprachen (en/de/fr/nl/es) via `messages/*.json`.

### 2B · FAQ "Wann ist [Park] am wenigsten besucht?" ✅

**Datei:** `components/faq/park-faq-section.tsx`

Neue FAQ-Frage mit datengenerierter Antwort → landet in `FAQStructuredData` → Google Featured Snippets.

---

## Phase 3 — Statistiken & Landingpages

### 3A · Park-Statistik-Tab

Neuer Tab "Statistiken" / "Statistics" auf der Park-Seite. Zeigt historische Wartezeit-Durchschnitte pro Attraktion und Crowd-Level nach Monat/Wochentag.

Konkurriert gegen `queue-times.com/en-US/parks/{id}/stats`.

**Voraussetzung:** API-Endpoints für historische Daten prüfen.

### 3B · Landingpage-Texte für Top-Länder

**Datei:** `app/[locale]/parks/[continent]/[country]/page.tsx`

Redaktionellen Einführungstext für Top-Länder (DE, NL, FR, US, JP) ergänzen. Datenbasiert (Parkanzahl, bekannteste Parks). Bedient "beste Freizeitparks [Land]"-Suchen.

---

## Phase 4 — Saison- und Event-Content

Event/Saison-Badges auf Park-Seiten aus dem Calendar-API. Bedient saisonale Long-Tail-Keywords wie "Europa-Park Halloween 2026 Wartezeiten".

---

## Wettbewerber-Profil

| Seite                  | Stärke                                          | Schwäche vs. park.fan     |
| ---------------------- | ----------------------------------------------- | ------------------------- |
| **wartezeiten.app**    | DE-Markt dominiert, park-spezifische URLs, News | Kein AI, keine Prognosen  |
| **queue-times.com**    | Hohe Domain Authority, /stats-Seiten, Open API  | Kein Textcontent, kein DE |
| **ep-wartezeiten.net** | Nische Europa-Park, KI-Prognosen                | Nur 1 Park                |
| **skiptheq.de**        | DE Crowd Calendar, gute UX                      | Wenig Parks               |
| **thrill-data.com**    | EN Crowd Calendars, Disney/Universal            | Kein DE-Markt             |
| **touringplans.com**   | Sehr hohe Authority, Disney/Universal           | Kein DE-Markt             |
