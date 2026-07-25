# Blog-Review: AI-Klang raus, Sprachen prüfen, Beiträge vereinheitlichen

**Datum:** 2026-07-25
**Branch:** `blog/de-ai-review-2026-07`
**Status:** freigegeben

## Ziel

Der komplette Blog soll nicht mehr nach generiertem Text klingen, sondern
persönlich und mit Herz. Alle sechs Sprachen werden geprüft und die Beiträge
formal vereinheitlicht.

## Umfang

Die drei veröffentlichten Beiträge in allen sechs Sprachen — 18 Dateien:

| translationKey            | DE                                | EN                             | NL                              | FR                                    | ES                                   | IT                                   |
| ------------------------- | --------------------------------- | ------------------------------ | ------------------------------- | ------------------------------------- | ------------------------------------ | ------------------------------------ |
| `welcome-to-park-fan-blog` | `willkommen-im-park-fan-blog`     | `welcome-to-park-fan-blog`     | `welkom-bij-de-park-fan-blog`   | `une-poussette-une-gondole-et-park-fan` | `un-cochecito-una-gondola-y-park-fan` | `un-passeggino-una-gondola-e-park-fan` |
| `the-art-of-waiting`      | `die-kunst-des-wartens`           | `the-art-of-waiting`           | `de-kunst-van-het-wachten`      | `l-art-d-attendre`                    | `el-arte-de-esperar`                 | `l-arte-dell-attesa`                 |
| `halloween-parks-2026`    | `halloween-freizeitparks-2026`    | `halloween-theme-parks-2026`   | `halloween-pretparken-2026`     | `halloween-parcs-attractions-2026`    | `halloween-parques-atracciones-2026` | `halloween-parchi-divertimenti-2026` |

**Nicht im Umfang:** die Drafts `editor-feature-test` (DE/EN),
`europa-park-voltron-one-year-in` (DE/EN), `magic-kingdom-must-do-2026` (EN).
Ausnahme: die Bildcredit-Entfernung (siehe unten) gilt repository-weit.

## Vorgehen

Deutsch ist die Quellsprache. Pro Beitrag:

1. Deutschen Text neu schreiben
2. Fakten recherchieren und gegenprüfen
3. EN, NL, FR, ES, IT frisch aus dem neuen Deutsch ableiten — als eigenständige
   Texte, nicht als Spiegelübersetzung
4. Manifest neu erzeugen, Build prüfen

Reihenfolge: Willkommens-Beitrag zuerst (dort wird die Stimme etabliert), dann
Kunst des Wartens, dann Halloween-Guide.

## 1. Zielstimme

Persönlich und mit Herz. Warm, nicht nüchtern-journalistisch.

### Harte Regeln

| Regel                     | Ist              | Soll                                     |
| ------------------------- | ---------------- | ---------------------------------------- |
| Gedankenstriche / 1000 W. | 17–25            | max. 3                                   |
| Fettungen pro Beitrag     | 34–104           | grob halbiert; nur Eigennamen, Zahlen, echte Merksätze |
| Textlänge                 | —                | **±5 % pro Beitrag, nicht kürzer**        |

### Zu entfernen

- **Ehrlichkeits-Beteuerungen.** „ehrlich", „Kein Werbeflyer. Versprochen.",
  „kostenlos, werbefrei, unabhängig", „schummeln zwecklos", „ohne SEO-Sermon",
  „ohne dass es nach Marketing klingt", „Ehrliche Selbstkontrolle". Ehrlichkeit
  wird gezeigt, nicht behauptet.
- **Das Muster „nicht X, sondern Y"** — höchstens einmal pro Beitrag.
- **Generische Essay-Einstiege** („Es gibt Orte, an denen…", „Jeder Parkfan
  kennt den Moment…").
- **Kurzsatz-Pointen als Absatzschluss** („Das ist nicht Deko. Das ist
  angewandte Kognitionspsychologie.").
- **Dreier-Aufzählungen als Rhythmustrick** („Kurz, ehrlich, ohne SEO-Sermon").

### Zu erhalten

Die persönliche Substanz: Märchensee, „1001 Nacht", der Vater, Lethal Weapon
Pursuit, die 10.000er-Maus, das Taron-Laufrad, Orlando, der P.P.S. an
Parkfan95. Ebenso alle Zahlen, Quellen, `ref:`-Links, Widgets, Bilder und die
Überschriften-Struktur.

### Umgang mit erfundenen Details

Weil die Länge gleich bleiben muss, brauchen gestrichene generische Passagen
Ersatzmaterial. Erfundene sinnliche Details (Gerüche, Geräusche, kleine Szenen)
sind erlaubt, müssen aber **im Commit einzeln markiert** werden, damit sie
geprüft, ersetzt oder gestrichen werden können. Keine erfundenen harten Fakten,
keine erfundenen Personen, keine erfundenen Daten.

## 2. Sprachschicht

Die Markdown-Pipeline hat **kein** Smartypants — Typografie im Quelltext landet
unverändert im HTML. Falsche Anführungszeichen sind daher sichtbare Fehler.

| Locale | Ist                              | Soll                                                                |
| ------ | -------------------------------- | ------------------------------------------------------------------- |
| DE     | `„…"` — 81× gerades Schlusszeichen | `„…"`                                                              |
| EN     | 172× gerades `"`                 | `"…"`                                                               |
| NL     | deutsche `„…"` geerbt            | `"…"`                                                               |
| FR     | `« … »`                          | `« … »` mit schmalem geschützten Leerzeichen (U+202F), ebenso vor `: ; ! ?` |
| ES     | `«…»`                            | korrekt, bleibt                                                     |
| IT     | `« … »` mit französischen Spatien | `"…"`                                                               |

Zusätzlich: Jede Übersetzung wird als eigenständiger Text geschrieben.
Sprachtypische Redewendungen, Satzlängen und Bilder statt wörtlicher
Übertragung. Aktuell haben alle sechs Sprachen exakt dieselbe Anzahl
Gedankenstriche, Fettungen und Überschriften — das ist der Beleg dafür, dass es
Spiegelübersetzungen sind.

## 3. Vereinheitlichung

- **`coverImage`** überall mit `src`, `alt`, `caption`. `credit` nur bei
  Fremdquellen.
- **Galerien:** alle Locales nutzen die `gallery-widget folder=…`-Form. Die fünf
  Übersetzungen von „Kunst des Wartens" haben ihre Bildunterschriften aktuell
  inline hartkodiert, obwohl die `captions.<locale>.json` bereits existieren und
  denselben Text enthalten. Das wird entdoppelt.
- **Zeilenumbruch** einheitlich auf 80 Zeichen (aktuell 72–78 gemischt).
  Prettier läuft mit `proseWrap: preserve` und fasst Prosa nicht an.
- **Beitragsschluss** einheitlich: Signatur `— Patrick`, P.S. optional.
- **Slugs bleiben unverändert.** URL-Änderungen kosten Rankings und Backlinks.

## 4. Bildcredits entfernen

Alle „Patrick Arns"-Credits werden entfernt — 106 Fundstellen, repository-weit
(also auch in den Drafts):

| Ort                                                | Anzahl |
| -------------------------------------------------- | ------ |
| `coverImage.credit` in `content/blog/**/*.md`      | 12     |
| `\| © Patrick Arns` in Galerie-Zeilen und Bild-Alts | 46     |
| `"credit": "Patrick Arns"` in `captions*.json`     | 48     |

Credits mit `park.fan` bleiben.

## 5. Faktenprüfung

- **Halloween-Guide:** Termine, Preise und Altersgrenzen aller neun Parks gegen
  die offiziellen Seiten.
- **Kunst des Wartens:** Maister 1985, Hornik „rund 36 %", Larson 1991, Little's
  Law — Quellen und Zahlen gegenprüfen.
- **Willkommen:** Lethal Weapon Pursuit / Cop Car Chase, „1001 Nacht bis 2009",
  sowie „über 150 Parks / 5.000+ Attraktionen" gegen die Live-API.

Falsche Zahlen werden korrigiert. Zahlen, die sich nicht belegen lassen, werden
entweder abgeschwächt oder gestrichen und im Abschlussbericht aufgeführt.

## 6. Verifikation

Vor dem Abschluss:

- Metriken vorher/nachher je Datei: Gedankenstriche pro 1000 Wörter,
  Fettungen, Wortzahl (Abweichung ≤ 5 %)
- Keine `Patrick Arns`-Credits mehr auffindbar
- Anführungszeichen je Locale entsprechen der Tabelle in §2
- Alle `ref:`-Keys lösen weiterhin auf, alle Bildpfade existieren, externe
  Links antworten
- `pnpm generate:blog-manifest`, `pnpm validate:translations`, `pnpm lint`,
  `pnpm build` laufen durch

## Offene Punkte

Keine.
