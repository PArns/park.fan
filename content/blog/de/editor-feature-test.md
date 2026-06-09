---
title: "Editor-Funktionstest — alle Chips, alle Varianten"
translationKey: editor-feature-test
date: '2026-06-09'
updatedAt: '2026-06-09'
author: patrick
mode: draft
featured: false
excerpt: >-
  Ein Sandbox-Post, der jeden Chip im park.fan-Editor durchspielt — ref-
  Varianten, Spotlights, Widgets, Embeds, Bilder, Listen, Tabellen — damit wir
  zu zweit durch den Inspector klicken und jeden Bearbeitungs-Flow prüfen
  können.
tags:
  - meta
  - test
  - editor
category: news
coverImage:
  src: /blog/images/welcome-cover.svg
  alt: 'park.fan Editor — Chip-Testpost'
  credit: 'park.fan'
seo:
  title: 'Editor-Funktionstest'
  description: 'Sandbox-Post zum Durchklicken jedes Editor-Chips im Admin.'
---

# Editor-Funktionstest

Dieser Post existiert, damit wir uns zusammensetzen und jeden Chip
durchklicken können, den der Editor produziert. Jede Sektion unten beleuchtet
einen anderen Teil der WYSIWYG-Schicht. Klick auf einen Chip → das rechte
**Properties**-Panel sollte direkt zum passenden Editor wechseln.

## Inline-Ref-Varianten (Parks)

Drei Varianten desselben Parks nebeneinander: [Phantasialand](ref:phantasialand?info),
die [bare](ref:phantasialand?bare) Variante ohne Annotation und die
[full](ref:phantasialand?full) Variante, die als Block-Karte gerendert wird.
Klick irgendeinen — die Variant-Pills im Panel sollten zwischen INFO / BARE /
FULL flippen, ohne die anderen mitzuziehen.

## Inline-Ref-Varianten (Rides)

[Taron](ref:phantasialand/taron?info) inline mit Location. Im Vergleich die
bare-Form: [Taron](ref:phantasialand/taron?bare). Und ein anderer Ride —
[Black Mamba](ref:phantasialand/black-mamba?info) — um zu prüfen, dass
Disambiguation auch bei zwei Chips zum gleichen Park funktioniert.

## Spotlight-Karten (?full)

Die werden dank `?full` als Block-Karten gerendert. Jede sollte beim Klick
den Variant-Editor öffnen.

[Phantasialand](ref:phantasialand?full)

[Black Mamba](ref:phantasialand/black-mamba?full)

[Voltron Nevera](ref:europa-park/voltron-nevera-powered-by-rimac?full)

## Normale Links

Extern: <https://arns.dev>. Mailto: <mailto:hello@park.fan>. Intern:
[die How-to-Seite](/howto). Und ein YouTube-Link inline in Markdown
gewrappt: [der Trailer](https://www.youtube.com/watch?v=dQw4w9WgXcQ).
Jeder davon sollte den **Link**-Editor mit vorbefülltem Href öffnen.

## Embeds (bare URL auf eigener Zeile)

https://www.youtube.com/watch?v=dQw4w9WgXcQ

https://www.instagram.com/p/CzAbCdEfGhI/

https://suno.com/song/1b686ccc-85d3-465c-b69a-7eac1dbd5acb

## Bilder

Zentriertes Bild mit Caption und Alt:

![park.fan Banner | Festliches park.fan Coverbild | center](/blog/images/welcome-cover.svg)

Und ein kleines rechtsbündiges inline mit Fließtext:

![Phantasialand Taron Coaster | Taron an einem ruhigen Morgen | right](/images/parks/phantasialand/taron.jpg)

## Widgets — Single-Slug

Die klassischen Park-Info-Widgets. Jedes sollte als „Widget"-Selection im
Panel öffnen mit einem einzigen **Park slug**-Feld.

```park-widget
slug: phantasialand
```

```weather-widget
slug: phantasialand
```

```map-widget
slug: phantasialand
```

```best-days-widget
slug: phantasialand
```

```stats-widget
slug: phantasialand
```

## Widget — Attraction (zwei Slugs)

Das Attraction-Widget braucht Park- und Ride-Slug — das Panel sollte zwei
Input-Felder zeigen.

```attraction-widget
parkSlug: phantasialand
slug: black-mamba
```

## Widget — Gallery

Ordner + Heading:

```gallery-widget
folder: /blog/images/europa-park-voltron
heading: Phantasialand in Bildern
```

## Widget — Glossary

Holt die volle Definition eines Glossar-Begriffs inline:

```glossary-widget
slug: crowd-level
```

## Glossar-Auto-Highlight in Prosa

Prosa, die **Wartezeit**, das **Crowd-Level**, die **angezeigte Wartezeit**
oder die **virtuelle Warteschlange** erwähnt, sollte beim Rendern auf der
Live-Seite automatisch passende Glossar-Begriffe hervorheben. Im Editor
bleiben sie reine Prosa — das ist erwartet.

## Strukturelle Blöcke

### Bullet-Liste

- Erstes Item
- Zweites Item mit **fett** und _kursiv_
- Drittes Item mit `inline-Code`

### Nummerierte Liste

1. Properties-Panel öffnen
2. Im Editor auf einen Chip klicken
3. Zuschauen wie der Inspector zum passenden Formular flippt

### Zitat

> Der ganze Sinn dieses Posts ist, dass jeder Chip nur einen Klick davon
> entfernt ist, bearbeitbar zu sein. Wenn irgendwas unter dieser Linie den
> Inspector beim Klick NICHT öffnet, ist das der Bug.

### Trennlinie

---

### Tabelle

Eine Tabelle mit `primary`-Theme — die Kopfzeile sollte im Editor-Canvas
und im veröffentlichten Beitrag eingefärbt sein. In eine Zelle klicken
öffnet das Tabellen-Menü mit dem Farb-Picker.

<!--tbl-theme: primary-->

| Block-Art         | Chip-Selektor              | Inspector-Formular        |
| ----------------- | -------------------------- | ------------------------- |
| `?info` / `?bare` | `.ref-preview-badge`       | Ref-Variante + Replace    |
| `?full`           | `.ref-preview-spotlight`   | Selber Variant-Editor     |
| `*-widget`        | `.widget-preview`          | Widget-Attrs-Formular     |
| plain `<a>`       | `a[href]`                  | Hyperlink-Href-Editor     |

### Code-Block

```ts
// Kein Widget — ein echter Code-Block, sollte den Widget-Editor NICHT öffnen.
console.log('hallo aus dem editor');
```

### Callouts

GitHub-Alert-Syntax — jede rendert als farbige Box im Editor-Canvas und
im veröffentlichten Beitrag:

> [!NOTE]
> Nützlicher Kontext, den Leser nicht überspringen sollten.

> [!TIP]
> Taron am besten gleich morgens fahren — die Schlange verdreifacht sich bis 11:00.

> [!WARNING]
> Die Wartezeiten in diesem Beitrag sind historisch; vor dem Besuch die Live-Seite checken.

Und ein normales Zitat zum Vergleich, das ein Zitat bleiben muss:

> Freizeitparks sind das Näheste an Zeitmaschinen, das wir haben.

## Fazit

Wenn du dich durch diesen Post geklickt hast und jeder Chip das richtige
Inspector-Formular geöffnet hat, ist die Edit-Surface bereit für echte
Posts. Wenn irgendwas komisch war, ist das unser nächster Regression-Test.
