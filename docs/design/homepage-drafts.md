# Startseite: Entwurf (`/design`)

`/{locale}/design` ist eine Arbeitsseite wie `/ui`: `noindex`, nicht in der Sitemap, kein hreflang,
und ihr eigener Text ist deutsch statt sechsmal übersetzt. Sie zeigt einen Entwurf für alles unter
dem Hero — links am Desktop, rechts in einem 390-px-Rahmen — aus Produktionskomponenten mit
Produktionsdaten.

## Der Befund

Gemessen am 28. August 2026 auf `/de` bei 1440×900, aus dem gerenderten Dokument gelesen: die
Content-Spalte ist **8 153 px lang und besteht aus dreizehn Bändern in genau demselben Takt** —
`container` + h2 + Raster, abwechselnd `bg-muted/30`. „Plattform-Statistiken" bekommt dieselbe
Bühne wie „Beliebte Parks". Die Zahlen dazu sind Symptome: 38 % der Spalte sind vier
aufeinanderfolgende Dashboard-Bänder, der Blog läuft zweimal (1 590 px, drei Post-URLs doppelt im
Linkgraph), sieben FAQ-Antworten liegen als `FAQPage`-Markup im HTML und keine davon auf der Seite,
34 der 84 Links gehen ins Glossar, während auf `/beste-reisezeit` und `/glossar` selbst keiner
zeigt.

## Die Reihenfolge: erst lesen, dann verstehen, dann nachschlagen

1. **Aus dem Blog.** Sechzig geschriebene Beiträge mit gemessenen Zahlen sind das Einzige auf
   dieser Seite, das kein anderes Wartezeiten-Portal hat, und sie lagen zwischen vier
   Kennzahlenbändern begraben. Jetzt oben, einmal, mit einem Aufmacher und vier Zeilen daneben.
2. **Was park.fan macht** — vorgeführt (`components/home/wait-in-context.tsx`), siehe unten.
3. **Die Werkzeuge**: Fahrplan der beliebten Parks, ruhigster Wochentag je Park, Favoriten, die
   fünf Hubs, das sichtbare FAQ.

## Die Erklärung ist eine Vorführung

„Was ist park.fan?" steht heute ganz unten unter drei Dashboards und fängt mit der
Gründungsgeschichte an. Die Auskunft ist aber ein Satz, den man an einer echten Bahn zeigen kann:
**eine Zahl am Eingang sagt für sich genommen fast nichts.** Erst neben dem, was um diese Uhrzeit
üblich ist, wird daraus eine Information.

`WaitInContext` zeigt genau das: zwei Balken auf einer Skala, an der Bahn mit der kürzesten
Schlange der Welt — „jetzt 10 Minuten, um diese Uhrzeit üblich 45, also 35 kürzer als sonst".

Die beiden Werte kommen aus `getGlobalStats()`, das die Startseite ohnehin holt: `waitTime` und
**`typicalWaitThisHour`**. Das zweite Feld liegt in jeder Antwort und wurde bisher auf **keiner**
Oberfläche gerendert. Der Entwurf kostet die API damit keine zusätzliche Anfrage.

`currentVsTypical` liegt daneben und bleibt bewusst ungenutzt: bei Manta stand dort −40 bei 10
gegen 25 Minuten, bei Soarin' −12 bei 110 gegen 40. Weder Differenz noch Prozent, also nichts, was
man beschriften könnte — der Vergleich wird aus den zwei eindeutigen Werten gerechnet.

Die **kürzeste** Schlange führt das besser vor als die längste: „kürzer als sonst" ist eine
Einladung, „länger als sonst" eine Warnung, und die Startseite soll jemanden losschicken.

## Der Fahrplan statt sechs Karten

`components/home/park-board.tsx`. Sechs Fotokarten nebeneinander beantworten „welche Parks gibt
es"; die Frage dieses Abschnitts ist „wer hat offen, bis wann, wie voll", also vier Werte pro Park,
die man untereinander vergleicht — eine Tafel, in der die Spalte den Vergleich macht. Das Foto
bleibt als Marke der Zeile. Zeiten in **Parkzeit** über `ParkTime`. Durchschnitt und Andrang nur
für einen Park, der läuft: ein geschlossener Park aggregiert sonst über eine leere Menge und
liefert „10 Min. · sehr niedrig", also genau die Zeile eines Parks ohne Wartezeitquelle.

## Warum die fotogeführte Richtung verworfen wurde

Ein Entwurf, der den Hero fortsetzt (Foto ganzflächig, Auskunft auf Glas), scheitert an der
Bildabdeckung. Gemessen an der Mediendatenbank:

| | Featured mit Bild |
| --- | --- |
| NL | 6/6 |
| DE | 5/6 |
| IT · ES | 4/6 |
| FR | 3/6 |
| **EN** | **2/6** |

Insgesamt haben **14 von 212 Parks** überhaupt ein Bild und **9** einen `park-background` — alle
neun in Europa. Für `/en` und für „in deiner Nähe", wo jeder der 212 der nächste sein kann, trägt
die Richtung nicht.

## Typografie

Die App lädt genau eine Familie (Geist) und aliast `--font-mono` in `globals.css` auf sie: für eine
Seite über gemessene Minuten also kein Schnitt für Messwerte. Bricolage Grotesque als Display,
IBM Plex Mono für Messwerte in der Tafel. Beide hängen an `--font-display` / `--font-numeric`,
gesetzt von der Route, die sie braucht (`app/[locale]/design/_variants/fonts.ts`); `.pk-display`
und `.pk-mono` fallen ohne die Variablen auf `--font-sans` zurück. Beim Umzug auf die Startseite
wandern die zwei Aufrufe ins Locale-Layout und kosten dann ~30 KB pro Seite — eine Entscheidung,
keine Nebenwirkung.

## Warum die Handy-Vorschau ein `<iframe>` ist

Tailwinds `sm:`/`lg:` sind **Viewport**-Media-Queries: ein 390 px breites `<div>` auf einem
1440-px-Schirm rendert trotzdem jede Desktop-Regel. Ein iframe hat einen eigenen Viewport. Dafür
gibt es `/{locale}/design/preview/horizon` als echte Route und in `next.config.ts` eine Ausnahme
vom globalen `X-Frame-Options: DENY`: `SAMEORIGIN` **nur** für diesen Pfad, geschrieben als
Ausschluss im globalen Matcher statt als zweite Regel obendrauf, weil zwei passende Sources beide
ihren Header senden und ein Browser, der zwei davon sieht, blockiert.

Dieselbe Falle steckte in `ParkComparisonCard`, das dieser Entwurf mitbenutzt: seine Zellen
tragen `whitespace-nowrap`, die Tabelle wird unter ~410 px nicht schmaler, und ohne eigenen
Scroll-Container schob sie auf `/beste-reisezeit` bei 390 px das ganze Dokument seitwärts. Sie
scrollt seit #354 in sich — breite Tabellen scrollen in sich, nie die Seite.

## Fertige Bausteine, unabhängig von der Entscheidung

- `components/home/home-faq-section.tsx` — das sichtbare FAQ, aus derselben Liste wie das
  `FAQPage`-Markup (`lib/faq/homepage-faq.ts`).
- `components/home/hub-links-section.tsx` — fünf Links auf die fünf Hubs, für die die Startseite
  der Einstieg ist und auf die heute null bis zwei zeigen.
