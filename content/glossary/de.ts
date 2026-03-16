import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: 'Wartezeit',
    shortDefinition:
      'Die geschätzte Zeit, die ein Besucher warten muss, bevor er eine Attraktion betreten kann.',
    definition:
      'Die Wartezeit (auch Wartezeit in der Warteschlange) ist die geschätzte Dauer, die ein Besucher in der Warteschlange verbringt, bevor er eine Attraktion besteigen kann. Parks zeigen Wartezeiten an Attraktionseingängen und in ihren Apps an. park.fan erfasst live Wartezeiten, die jede Minute aktualisiert werden, damit du die aktuellen Bedingungen für alle Attraktionen einsehen kannst.',
    relatedTermIds: ['posted-wait-time', 'virtual-queue', 'single-rider', 'express-pass'],
  },
  {
    id: 'single-rider',
    name: 'Einzelfahrer',
    shortDefinition:
      'Eine separate Warteschlangenspur für Besucher, die bereit sind, allein zu fahren, um freie Plätze zu füllen.',
    definition:
      'Einzelfahrer-Warteschlangen ermöglichen es Besuchern, die bereit sind, allein (oder getrennt von ihrer Gruppe) zu fahren, freie Plätze in Fahrzeugserien zu belegen. Da Einzelfahrer in Lücken eingeschoben werden, bewegt sich die Warteschlange deutlich schneller als die normale Reihe — oft 50–70 % kürzere Wartezeiten. Nicht alle Attraktionen bieten Einzelfahrerzugang an.',
    relatedTermIds: ['wait-time', 'express-pass', 'virtual-queue'],
  },
  {
    id: 'virtual-queue',
    name: 'Virtuelle Warteschlange',
    shortDefinition:
      'Ein digitales Warteschlangensystem, bei dem Besucher eine Fahrzeit reservieren, anstatt physisch zu warten.',
    definition:
      'Eine virtuelle Warteschlange (manchmal auch als Boarding-Gruppe oder Rückkehrzeit bezeichnet) ermöglicht es Besuchern, sich über eine App oder einen Kiosk für eine Attraktion anzumelden und eine Benachrichtigung zu erhalten, wenn ihre Runde naht. Anstatt in einer physischen Schlange zu stehen, können Besucher andere Parkbereiche genießen und zurückkehren, wenn sie aufgerufen werden.',
    relatedTermIds: ['express-pass', 'wait-time', 'single-rider'],
  },
  {
    id: 'express-pass',
    name: 'Express Pass',
    shortDefinition:
      'Ein kostenpflichtiges oder inklusive Ticket-Upgrade, das Zugang zu einer kürzeren Prioritätswarteschlange gewährt.',
    definition:
      'Ein Express Pass (der genaue Name variiert je nach Park — Universal Express, Disney Lightning Lane usw.) ist ein Ticket-Upgrade, das Inhabern erlaubt, einen dedizierten Prioritätseingang mit deutlich kürzeren Wartezeiten zu nutzen. Einige Parks bieten Express-Zugang in Premium-Hotelpaketen an; andere verkaufen ihn separat. Nutze den Besucherkalender von park.fan, um deinen Besuch zu planen und zu entscheiden, ob ein Express Pass den Preis wert ist.',
    relatedTermIds: ['virtual-queue', 'single-rider', 'wait-time'],
  },
  {
    id: 'posted-wait-time',
    name: 'Angezeigte Wartezeit',
    shortDefinition: 'Die offizielle Wartezeit, die der Park am Eingang einer Attraktion anzeigt.',
    definition:
      'Die angezeigte Wartezeit ist die offizielle Schätzung, die auf Schildern am physischen Eingang einer Attraktion und/oder in der offiziellen Park-App angezeigt wird. Parks berechnen diese Zahl anhand von Warteschlangenlängensensoren, historischen Durchsatzdaten und aktueller Ladeeffizienz. park.fan aggregiert angezeigte Wartezeiten aus offiziellen Quellen jede Minute.',
    relatedTermIds: ['wait-time', 'crowd-level'],
  },
  {
    id: 'crowd-level',
    name: 'Besucherdichte',
    shortDefinition:
      'Ein Maß dafür, wie voll ein Freizeitpark an einem bestimmten Tag ist, von Sehr Niedrig bis Extrem.',
    definition:
      'Die Besucherdichte beschreibt die allgemeine Besucherdichte in einem Park an einem bestimmten Tag oder zu einer bestimmten Zeit. park.fan verwendet eine Skala von Sehr Niedrig bis Extrem basierend auf historischen Wartezeitdaten, aktueller Belegung und KI-Prognosen. Ein Tag mit Sehr Niedriger Besucherdichte bedeutet kurze Schlangen und minimale Staus; ein Extremer Tag bedeutet maximale Besucherzahlen mit langen Wartezeiten bei den meisten Attraktionen.',
    relatedTermIds: ['crowd-calendar', 'peak-day', 'wait-time'],
  },
  {
    id: 'crowd-calendar',
    name: 'Besucherkalender',
    shortDefinition:
      'Eine tagesweise Vorschau mit vorhergesagten Besucherdichten, um den Besuch zu planen.',
    definition:
      'Ein Besucherkalender ist ein Monats- oder Jahreskalender, der vorhergesagte Besucherdichten für jeden Tag zeigt. park.fan erstellt Besucherkalender mit KI-Modellen, die auf jahrelangen historischen Wartezeitdaten, kombinierten Schulferienkalendern, bevorstehenden Veranstaltungen und saisonalen Trends trainiert wurden. Grüne Tage zeigen niedrige Besucherzahlen an; orange und rote Tage zeigen hohe Besucherzahlen an.',
    relatedTermIds: ['crowd-level', 'peak-day', 'rope-drop'],
  },
  {
    id: 'peak-day',
    name: 'Spitzentag',
    shortDefinition:
      'Ein Tag mit maximalen Besucherzahlen, typischerweise während Feiertagen oder Sonderveranstaltungen.',
    definition:
      'Ein Spitzentag ist jeder Tag, an dem die Besucherzahlen auf oder nahe der maximalen Kapazität eines Parks sind. Häufige Spitzentage sind große gesetzliche Feiertage (Weihnachten, Ostern, Sommerferien), Sonderveranstaltungstage (Halloween-Nächte, Feuerwerke) und Schulferienwochen. park.fan hebt Spitzentage im Besucherkalender hervor, damit du sie gezielt einplanst oder meidest.',
    relatedTermIds: ['crowd-level', 'crowd-calendar', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Renovierung',
    shortDefinition:
      'Eine geplante Schließungszeit, in der eine Attraktion oder ein Bereich gewartet oder modernisiert wird.',
    definition:
      'Eine Renovierung (von Enthusiasten oft als "Rehab" abgekürzt) ist ein geplanter Wartungs- oder Renovierungszeitraum, in dem eine Attraktion, eine Show oder ein Parkbereich vorübergehend geschlossen ist. Renovierungen können von einigen Tagen bis zu mehreren Monaten dauern und werden in der Regel für die Offseason geplant, um die Auswirkungen auf Besucher zu minimieren. park.fan markiert Attraktionen, die derzeit renoviert werden, damit du den Status überprüfen kannst.',
    relatedTermIds: ['downtime', 'off-season', 'ride-capacity'],
  },
  {
    id: 'downtime',
    name: 'Betriebsstörung',
    shortDefinition:
      'Eine ungeplante, vorübergehende Schließung einer Attraktion aufgrund eines technischen Defekts oder Sicherheitsprüfung.',
    definition:
      'Eine Betriebsstörung bezeichnet die ungeplante, vorübergehende Schließung einer Attraktion — im Gegensatz zur geplanten Renovierung. Ursachen sind technische Defekte, Sicherheitsüberprüfungen, Vorfälle mit Besuchern oder schlechtes Wetter. Die meisten Störungen dauern wenige Minuten bis einige Stunden. park.fan zeigt den aktuellen Betriebsstatus jeder Attraktion in Echtzeit an und unterscheidet zwischen "In Betrieb", "Störung", "Geschlossen" und "Renovierung".',
    relatedTermIds: ['refurbishment', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'off-season',
    name: 'OffSeason',
    shortDefinition:
      'Der jährliche Schließungszeitraum eines saisonalen Freizeitparks — typischerweise mehrere Wochen bis Monate — in dem der Park vollständig für Besucher geschlossen ist.',
    definition:
      'Die Offseason bezeichnet den jährlichen Zeitraum, in dem ein saisonaler Freizeitpark vollständig geschlossen ist. Es handelt sich nicht einfach um eine ruhigere Periode mit weniger Besuchern — der Park hat zu. Für die meisten saisonalen Parks in Europa fällt die Offseason in den Winter: Phantasialand und Europa-Park schließen beispielsweise typischerweise von Ende Januar bis Ende März. Die genauen Daten variieren je nach Park und Jahr.\n\nWährend der Offseason führen Parks größere Renovierungen durch, installieren neue Attraktionen und erledigen Wartungsarbeiten, die im laufenden Betrieb nicht möglich wären. Deshalb öffnen viele neue Attraktionen direkt zum Saisonstart statt mitten im Jahr.\n\npark.fan zeigt den Offseason-Hinweis auf einer Parkkarte an, wenn der Park geschlossen ist und der nächste geplante Öffnungstermin mehr als eine Woche entfernt liegt — so wird er von einer regulären Tagesschließung unterschieden. Wenn du den Offseason-Hinweis siehst, öffnet der Park in absehbarer Zeit nicht: Prüfe immer die offizielle Park-Website für das genaue Wiedereröffnungsdatum, bevor du Reisepläne machst.',
    relatedTermIds: ['refurbishment', 'off-peak', 'crowd-calendar'],
  },
  {
    id: 'ride-capacity',
    name: 'Kapazität',
    shortDefinition: 'Die Anzahl der Besucher, die eine Attraktion pro Stunde aufnehmen kann.',
    definition:
      'Die Attraktion Kapazität (oder Durchsatz) ist die maximale Anzahl von Besuchern, die eine Attraktion pro Stunde unter optimalen Betriebsbedingungen befördern kann. Die Kapazität hängt von der Fahrzeuggröße, der Anzahl der fahrenden Fahrzeuge, der Be- und Entladungsgeschwindigkeit und der Fahrzykluszeit ab. Die Kapazität bestimmt direkt, wie schnell sich die Warteschlange bewegt.',
    relatedTermIds: ['wait-time', 'downtime', 'refurbishment'],
  },
  {
    id: 'rope-drop',
    name: 'Rope Drop',
    shortDefinition:
      'Der Moment der Parköffnung, wenn die Absperrung fällt und die Warteschlangen für beliebte Attraktionen am kürzesten sind.',
    definition:
      'Rope Drop bezeichnet den Moment, in dem ein Freizeitpark für den Tag öffnet — benannt nach dem buchstäblichen Seil (oder Absperrband), das Parkmitarbeiter absenken, um die ersten Besucher einzulassen. Unter Freizeitpark-Fans ist das frühe Ankommen beim Rope Drop eine beliebte Strategie, da beliebte Attraktionen morgens die kürzesten Schlangen haben, bevor die Massen einströmen. Viele Parks bieten Hotelgästen zusätzlich einen Early Entry an, um bestimmte Attraktionen noch vor dem regulären Einlass zu nutzen. Der Zeitplan von park.fan zeigt genaue Öffnungszeiten.',
    relatedTermIds: ['crowd-calendar', 'wait-time', 'early-entry'],
  },
  {
    id: 'early-entry',
    name: 'Früheinlass',
    shortDefinition:
      'Ein exklusiver Vorteil für Hotelgäste, der den Parkeintritt vor der regulären Öffnung erlaubt.',
    definition:
      'Früheinlass (auch "Extra Zauberzeit" bei Disney oder "Early Park Entry") ist ein Vorteil, der Gästen von Partnerhotels oder bestimmten Ticketkategorien ermöglicht, den Park eine halbe bis eine Stunde früher zu betreten. In dieser Zeit sind die Warteschlangen deutlich kürzer, da der Großteil der Besucher noch nicht eingelassen wird. Besonders an Spitzentagen ist der Früheinlass eine der wirkungsvollsten Strategien, um beliebte Attraktionen ohne langes Warten zu erleben.',
    relatedTermIds: ['rope-drop', 'express-pass', 'peak-day'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'Ein Ticket-Upgrade, das den Besuch mehrerer Parks desselben Betreibers an einem Tag ermöglicht.',
    definition:
      'Ein Park-Hopper-Ticket erlaubt es, an einem Tag zwischen zwei oder mehr Parks desselben Betreibers zu wechseln. Disney bietet etwa den klassischen Park Hopper an, mit dem man täglich zwischen Magic Kingdom, EPCOT, Hollywood Studios und Animal Kingdom wechseln kann. Das Upgrade kostet mehr als ein einfaches Tagesticket, lohnt sich aber bei kurzen Aufenthalten oder wenn begehrte Attraktionen über mehrere Parks verteilt sind.',
    relatedTermIds: ['season-pass', 'rope-drop', 'crowd-calendar'],
  },
  {
    id: 'season-pass',
    name: 'Jahrespass',
    shortDefinition: 'Ein Ticket, das unbegrenzte Parkbesuche innerhalb eines Jahres ermöglicht.',
    definition:
      'Ein Jahrespass (auch Saisonkarte oder Annual Pass) gewährt unbegrenzte Eintritte in einen oder mehrere Parks über einen Zeitraum von üblicherweise zwölf Monaten. Viele Jahrespässe enthalten Zusatzleistungen wie Rabatte auf Gastronomie, Merchandise oder Parken. Je nach Stufe können Sperrdaten (Blockout-Dates) an Spitzentagen gelten. Für regelmäßige Besucher — mehr als drei bis vier Mal jährlich — rechnet sich ein Jahrespass in der Regel gegenüber Einzeltickets.',
    relatedTermIds: ['park-hopper', 'peak-day', 'express-pass'],
  },
  {
    id: 'height-requirement',
    name: 'Mindestgröße',
    shortDefinition:
      'Eine Mindestkörpergröße, die Besucher erfüllen müssen, um eine bestimmte Attraktion nutzen zu dürfen.',
    definition:
      'Die Mindestgröße ist eine Sicherheitsanforderung, die Parks für bestimmte Attraktionen festlegen. Sie stellt sicher, dass Sicherheitsgurte und Rückhaltesysteme korrekt sitzen. Typische Mindestgrößen liegen zwischen 90 und 140 cm. Einige Attraktionen haben auch eine maximale Größe oder ein Gewichtslimit. Bei Familienbesuchen empfiehlt es sich, die Mindestgrößen vorab zu prüfen, um Enttäuschungen vor Ort zu vermeiden.',
    relatedTermIds: ['ride-capacity', 'refurbishment'],
  },
  {
    id: 'themed-land',
    name: 'Themenbereich',
    shortDefinition:
      'Ein eigenständig gestalteter Bereich innerhalb eines Freizeitparks mit durchgehendem Thema.',
    definition:
      'Ein Themenbereich (englisch: Themed Land) ist eine abgegrenzte Zone innerhalb eines Freizeitparks, die ein einheitliches Design, eine Hintergrundgeschichte (Storyline) und passende Attraktionen, Gastronomie und Shops vereint. Bekannte Beispiele sind Hogsmeade in den Universal-Parks, Fantasyland in Disney-Parks oder Scandinavica in Europa-Park. Theemenbereiche sorgen für ein immersives Erlebnis und leiten Besucher durch den Park.',
    relatedTermIds: ['ride-capacity', 'refurbishment', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      'Die inoffizielle, vorzeitige Öffnung einer Attraktion vor dem offiziellen Eröffnungsdatum.',
    definition:
      'Ein Soft Opening bezeichnet die vorzeitige, inoffizielle Öffnung einer neuen Attraktion oder eines Themenbereichs — oft ohne jede Ankündigung. Parks nutzen Soft Openings, um Systeme unter echten Besucherbedingungen zu testen und Kapazitätsprobleme zu identifizieren. In der Freizeitpark-Community wird der Begriff unverändert auf Englisch verwendet. Da Soft Openings jederzeit unterbrochen werden können, sind sie ein Bonus für glückliche Besucher — aber keine verlässliche Planungsgrundlage. Fan-Foren und Social Media berichten üblicherweise als erste davon.',
    relatedTermIds: ['refurbishment', 'downtime', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby',
    shortDefinition:
      'Die normale Warteschlange einer Attraktion, ohne Reservierung oder besonderes Ticket.',
    definition:
      'Die Standby-Warteschlange ist die reguläre physische Warteschlange, die alle Besucher ohne zusätzliches Ticket oder Upgrade nutzen können. Wer in der Standby-Schlange steht, wartet in der Reihenfolge des Eintreffens — die angezeigte Wartezeit spiegelt direkt die aktuelle Auslastung der Attraktion wider. An vollen Tagen können Standby-Zeiten bei Hauptattraktionen 90 Minuten und mehr erreichen. park.fan verfolgt Standby-Wartezeiten in Echtzeit, damit du jederzeit die kürzeste Schlange findest.',
    relatedTermIds: ['wait-time', 'single-rider', 'virtual-queue', 'express-pass'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      'Disneys kostenpflichtiges Vorrangwarteschlangen-System als Nachfolger des früheren FastPass+-Programms.',
    definition:
      'Lightning Lane ist Disneys Bezeichnung für sein Priority-Queue-System, das 2021 als Nachfolger des kostenlosen FastPass+-Programms eingeführt wurde. Es gibt zwei Varianten: Individual Lightning Lane (ILL) für die gefragtesten Attraktionen, die separat erworben werden muss, und Lightning Lane Multi Pass (LLMP), ein tägliches Abo, das Rückkehrzeitfenster für eine Auswahl an Attraktionen ermöglicht. Da Lightning Lane ein vormals kostenloses Angebot in ein kostenpflichtiges umgewandelt hat, wird es in der Community kontrovers diskutiert. Der Besucherkalender von park.fan hilft dir einzuschätzen, an welchen Tagen Lightning Lane den Preis wert ist.',
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      'Disneys ehemaliges tägliches Zusatzabo für Lightning-Lane-Zugang zu den meisten Attraktionen.',
    definition:
      'Genie+ (heute umbenannt in Lightning Lane Multi Pass) war Disneys kostenpflichtiges Tages-Add-on, das FastPass+ ersetzte. Für eine personenbezogene Tagesgebühr konnten Gäste jeweils ein Lightning-Lane-Rückkehrzeitfenster für eine breite Auswahl an Attraktionen buchen. Die begehrtesten Highlights wurden als Individual Lightning Lane separat verkauft. Der Preis von Genie+ war dynamisch und stieg an den besucherstärksten Tagen. park.fan zeigt dir die aktuellen Besucherdichten, damit du entscheiden kannst, ob sich das Zusatzabo lohnt.',
    relatedTermIds: ['lightning-lane', 'express-pass', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      'Eine nummerierte Zuteilung im virtuellen Warteschlangensystem, die den Zugang zu einer Attraktion bei Aufruf ermöglicht.',
    definition:
      'Eine Boarding Group ist eine nummerierte Zuteilung innerhalb eines virtuellen Warteschlangensystems, das vor allem bei den begehrtesten neuen Attraktionen eingesetzt wird. Besucher melden sich über die Park-App an — oft direkt bei Parköffnung — und erhalten eine Gruppennummer. Wird diese Nummer aufgerufen, haben sie ein begrenztes Zeitfenster, um zur Attraktion zu kommen. An besonders vollen Tagen sind alle Boarding Groups innerhalb von Minuten vergeben. Disneys System bei Attraktionen wie Tron Lightcycle Run oder Star Wars: Rise of the Resistance hat den Begriff in der gesamten Freizeitpark-Community bekannt gemacht.',
    relatedTermIds: ['virtual-queue', 'wait-time', 'lightning-lane'],
  },
  {
    id: 'off-peak',
    name: 'Nebensaison',
    shortDefinition:
      'Zeiträume mit geringerer Besucherauslastung, kürzeren Wartezeiten und günstigeren Preisen.',
    definition:
      'Als Nebensaison gelten die ruhigeren Perioden im Kalender, in denen Schule ist und keine großen Feiertage fallen — typischerweise Januar bis Anfang Februar, Mitte September bis Oktober (außerhalb von Halloween-Events) und die ersten Novemberwochen. In der Nebensaison sind Wartezeiten für beliebte Attraktionen oft deutlich kürzer, Ticketpreise häufig am günstigsten und der Park spürbar entspannter. Für Besucher mit flexiblem Zeitplan ist der Besuch in der Nebensaison eine der wirkungsvollsten Strategien. Der Besucherkalender von park.fan markiert Nebensaison-Fenster, damit du deinen Besuch optimal planen kannst.',
    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
  },
  {
    id: 'ride-photo',
    name: 'Fahrfoto',
    shortDefinition:
      'Automatisch aufgenommenes Foto oder Video der Besucher während einer Attraktion, das nach der Fahrt käuflich erworben werden kann.',
    definition:
      'Das Fahrfoto ist ein automatisch von einer fest installierten Kamera aufgenommenes Bild — typischerweise an einem dramatischen Punkt wie dem Abfall einer Wasserbahn oder dem Scheitelpunkt einer Achterbahn. Nach der Fahrt können Besucher ihr Foto an Kiosks oder in der Park-App einsehen und entscheiden, ob sie es kaufen möchten. Viele Parks bieten Foto-Tagespakete an, die unbegrenzte Fahrfotos aller Attraktionen einschließen. Das Fahrfoto ist ein beliebtes Souvenir und ein klassischer Social-Media-Moment.',
    relatedTermIds: ['themed-land'],
  },
  {
    id: 'queue-line',
    name: 'Warteschlange',
    shortDefinition:
      'Der physische Wartebereich vor einer Attraktion, der oft selbst thematisch gestaltet ist.',
    definition:
      'Die Warteschlange ist der physische Raum — Gänge, Außenbereiche mit Absperrungen oder thematisch gestaltete Innenräume —, den Besucher durchqueren, bevor sie eine Attraktion betreten. In modernen Freizeitparks ist die Warteschlange oft selbst Teil des Erlebnisses: Disney gestaltet sie als Einstimmung auf die Geschichte, Universal taucht die Wartenden bereits in die Welt der Attraktion ein. Eine gut gestaltete Warteschlange macht auch längere Wartezeiten erträglicher. park.fan zeigt dir die aktuellen Wartezeiten aller Attraktionen, damit du die Planung deines Parkbesuchs optimal anpassen kannst.',
    relatedTermIds: ['wait-time', 'standby-queue', 'single-rider'],
  },
  {
    id: 'opening-day',
    name: 'Eröffnungstag',
    shortDefinition:
      'Das offizielle Eröffnungsdatum eines neuen Parks, Themenbereichs oder einer neuen Attraktion.',
    definition:
      'Der Eröffnungstag ist das offiziell angekündigte Datum, an dem ein neuer Park, eine Erweiterung oder eine Attraktion erstmals der Öffentlichkeit zugänglich gemacht wird. Eröffnungstage sind besondere Ereignisse in der Freizeitpark-Community: Sie ziehen in der Regel große Medienaufmerksamkeit, lange Schlangen und eine festliche Atmosphäre an. Parks veranstalten häufig Eröffnungszeremonien mit besonderen Unterhaltungsangeboten. Da Eröffnungstage besonders viele Besucher anziehen, sind sie selten der beste Zeitpunkt, um eine neue Attraktion mit kurzen Wartezeiten zu erleben. Soft Openings finden gelegentlich vor dem offiziellen Eröffnungstag statt.',
    relatedTermIds: ['soft-opening', 'rope-drop', 'crowd-level'],
  },
  {
    id: 'rider-switch',
    name: 'Rider Switch',
    shortDefinition:
      'System, bei dem sich Erwachsene beim Fahren abwechseln, während der andere bei Kindern bleibt, die die Mindestgröße nicht erfüllen.',
    definition:
      'Rider Switch (auch Kindertausch oder Child Swap genannt) ermöglicht Gruppen, sich bei einer Attraktion abzuwechseln, wenn ein Mitglied — in der Regel ein Kind, das die Mindestgröße nicht erfüllt — nicht mitfahren kann. Ein Erwachsener fährt, während der andere mit dem Kind am Eingang wartet. Wenn der erste zurückkommt, darf der zweite sofort einsteigen — ohne erneut in der Standby-Schlange zu warten. Bei Disney heißt das System offiziell Rider Switch, bei Universal Child Swap. An Spitzentagen ist das ein erheblicher Vorteil für Familien mit kleinen Kindern. Einfach das Personal am Attraktionseingang ansprechen.',
    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Sperrtag',
    shortDefinition:
      'Ein Kalendertag, an dem bestimmte Jahrespass-Stufen nicht für den Parkeintritt gültig sind — meist an Spitzentagen.',
    definition:
      'Ein Sperrtag (englisch: Blockout Date oder Blackout Date) ist ein bestimmter Kalendertag, an dem Jahrespässe niedrigerer Stufen nicht eingelöst werden können. Parks setzen Sperrtage ein, um die Besucherzahlen an den stärksten Tagen zu steuern. Hochwertige Pässe haben wenige oder keine Sperrtage; günstige Einsteigerpässe können an 30–60 Tagen pro Jahr gesperrt sein. Vor dem Besuch unbedingt den Sperrtagkalender prüfen. Der Besucherkalender von park.fan hebt typische Spitzentage hervor, damit du deine Jahrespass-Stufe entsprechend planen kannst.',
    relatedTermIds: ['season-pass', 'peak-day', 'crowd-calendar'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Sonderveranstaltung',
    shortDefinition:
      'Ein separat ticketpflichtiges Abendevent — wie Halloween- oder Weihnachtspartys — das über den normalen Tageseintritt hinausgeht.',
    definition:
      "Eine Sonderveranstaltung (englisch: Hard Ticket Event) ist ein separat buchbares Abend-Event mit eigenem Eintrittsticket. Diese Events bieten exklusive Unterhaltung, thematische Dekorationen und Erlebnisse, die beim regulären Parkbesuch nicht verfügbar sind. Bekannte Beispiele sind Halloween Horror Nights bei Universal, Mickey's Not-So-Scary Halloween Party in Walt Disney World, die Weihnachtsgala im Europa-Park oder die Halloween-Events in Phantasialand. An Sonderveranstaltungstagen werden reguläre Tagesbesucher oft ab 17–18 Uhr gebeten, den Park zu verlassen. Tickets sind meist Wochen im Voraus ausverkauft.",
    relatedTermIds: ['season-pass', 'peak-day', 'early-entry'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      'Disneys ehemaliges kostenloses Vorrang-Warteschlangen-System, das 2021 durch das kostenpflichtige Lightning Lane ersetzt wurde.',
    definition:
      'FastPass+ (ursprünglich FastPass, eingeführt 1999) war Disneys kostenloses Priority-Queue-System. In Walt Disney World konnten Gäste täglich bis zu drei FastPass+-Reservierungen über die My Disney Experience App buchen und damit Rückkehrzeitfenster für Attraktionen kostenlos sichern. Nach der COVID-19-Schließung 2020 wurde das System nicht reaktiviert und Ende 2021 durch das kostenpflichtige Lightning Lane ersetzt. FastPass+ ist bis heute eines der meistdiskutierten Themen in der Disney-Community, da es ein zuvor kostenloses Angebot in ein bezahltes umwandelte. Wer ältere Reiseberichte liest, stößt häufig auf den Begriff.',
    relatedTermIds: ['lightning-lane', 'genie-plus', 'express-pass', 'return-time'],
  },
  {
    id: 'dark-ride',
    name: 'Dark Ride',
    shortDefinition:
      'Eine Indoor-Attraktion, bei der Besucher in geführten Fahrzeugen durch thematisch gestaltete Szenen fahren.',
    definition:
      "Ein Dark Ride ist eine Indoor-Attraktion, bei der Besucher in Fahrzeugen — Waggons, Booten oder Gondeln auf einem festen Schienensystem — durch thematisch gestaltete Szenen fahren. Das 'Dunkle' bezieht sich auf die gesteuerte Lichtumgebung, die Animatronics, Projektionen und Kulissen wirkungsvoll inszeniert. In der Freizeitpark-Community wird der Begriff 'Dark Ride' durchgängig auf Englisch verwendet. Dark Rides reichen von sanften Familienerlebnissen ('it's a small world') bis zu intensiven Erzählattraktionen (Star Wars: Rise of the Resistance). Trackless Dark Rides bewegen sich ohne feste Schiene frei im Raum und ermöglichen dynamischere Szenengestaltung. Dark Rides gehören zu den kapazitätsstärksten und beliebtesten Attraktionen.",
    relatedTermIds: ['themed-land', 'ride-capacity', 'height-requirement'],
  },
  {
    id: 'return-time',
    name: 'Rückkehrzeit',
    shortDefinition:
      'Ein reserviertes Zeitfenster, in dem man mit einem Lightning Lane, einer virtuellen Warteschlange oder einem ähnlichen System zur Attraktion zurückkehren kann.',
    definition:
      'Eine Rückkehrzeit (oder Returntime) ist ein konkretes Zeitfenster — meist ein Ein-Stunden-Block —, in dem Besucher mit gebuchtem Vorrangzugang (über Lightning Lane, virtuelle Warteschlange oder ähnliche Systeme) am dedizierten Eingang der Attraktion einsteigen können. Die Rückkehrzeit gibt die Freiheit, die Zwischenzeit in anderen Parkbereichen zu genießen, anstatt in einer Schlange zu stehen. Wer das Zeitfenster verpasst — nach einer kurzen Toleranzzeit —, verliert die Reservierung. Mit den Live-Wartezeiten und Besucherdichte-Daten von park.fan kannst du gezielt entscheiden, welche Attraktionen du für Rückkehrzeiten einplanen möchtest.',
    relatedTermIds: ['lightning-lane', 'virtual-queue', 'fastpass', 'boarding-group'],
  },
  {
    id: 'airtime',
    name: 'Airtime',
    shortDefinition:
      'Das Schwereglosigkeitsgefühl auf Achterbahnen bei negativen G-Kräften — wenn man aus dem Sitz gehoben wird.',
    definition:
      'Airtime bezeichnet das Gefühl der Schwerelosigkeit — negative G-Kräfte —, das Achterbahnfahrer erleben, wenn die Bahn eine Kuppe schneller überquert als im freien Fall. Floater Airtime ist sanfte negative G — ein weiches Schweben; Ejector Airtime ist intensiv, wo der Schoßbügel das Einzige ist, was den Fahrer im Sitz hält. Airtime gilt unter Achterbahn-Enthusiasten als das wichtigste Qualitätsmerkmal für Stahl- und Holzachterbahnen. Airtime-Hügel (Camelbacks) sind speziell so geformt, dass sie dieses Gefühl maximieren, indem die Bahn einer parabelförmigen Freifall-Kurve folgt.',
    relatedTermIds: ['airtime-hill', 'bunnyhop', 'first-drop', 'wooden-coaster'],
  },
  {
    id: 'inversion',
    name: 'Inversion',
    shortDefinition:
      'Jedes Element auf einer Achterbahn, bei dem die Strecke die Fahrgäste über Kopf dreht.',
    definition:
      'Eine Inversion ist jedes Element, bei dem die Achterbahnstrecke die Fahrgäste jenseits der vertikalen Ebene dreht — also zumindest teilweise auf den Kopf stellt. Häufige Inversionen: Looping, Cobra Roll, Korkenzieher, Immelmann, Dive Loop, Inline Twist, Heartline Roll und Zero-G Roll. Moderne Achterbahnen bieten routinemäßig sechs bis vierzehn Inversionen in einem einzigen Layout. Die Anzahl der Inversionen ist eine der wichtigsten Kennzahlen für die Intensität einer Bahn. Inversionen erzeugen sowohl positive G-Kräfte (am Boden von Loopings) als auch negative G-Kräfte (am Scheitelpunkt), was für abwechslungsreiche Empfindungen sorgt.',
    relatedTermIds: ['vertical-loop', 'cobra-roll', 'immelmann', 'zero-g-roll', 'corkscrew'],
  },
  {
    id: 'vertical-loop',
    name: 'Looping',
    shortDefinition:
      'Die klassische kreisförmige Inversion, bei der die Strecke einen vollständigen vertikalen Kreis beschreibt und die Fahrgäste am Scheitelpunkt auf den Kopf stellt.',
    definition:
      "Der Looping (englisch: Vertical Loop) ist die bekannteste Inversion der Achterbahngeschichte — ein vollständiger 360-Grad-Kreis in der vertikalen Ebene. Moderne Loopings haben eine Klothoiden-Form (Tropfenform) statt eines perfekten Kreises: Einfahrt und Ausfahrt sind weit, die Spitze eng. Diese Geometrie sorgt für gleichmäßige, anhaltende G-Kräfte statt extremer Spitzen. Der erste moderne Loop-Coaster (Corkscrew, Knott's Berry Farm, 1975) revolutionierte die Branche. Heute ist der Looping auf Achterbahnen weltweit verbreitet, von Einstiegsbahnen bis zu Weltrekordmaschinen.",
    relatedTermIds: ['inversion', 'immelmann', 'cobra-roll'],
  },
  {
    id: 'immelmann',
    name: 'Immelmann',
    shortDefinition:
      'Ein halber Looping aufwärts gefolgt von einer halben Rolle abwärts, der die Fahrtrichtung um 180 Grad ändert — benannt nach Kampfpilot Max Immelmann.',
    definition:
      'Der Immelmann ist ein Markenzeichen von B&M und besteht aus zwei Phasen: Die Strecke zieht zunächst in einen halben Looping aufwärts — die Fahrgäste sind kurz über Kopf — dann folgt eine halbe Rolle, die das Fahrzeug wieder aufrichtet und gleichzeitig die Fahrtrichtung um 180 Grad umkehrt. Das Element ist nach dem Ersten-Weltkrieg-Fliegerass Max Immelmann benannt, der eine ähnliche Luftmanöver-Figur entwickelte. Der Immelmann erzeugt sowohl einen Überschlag als auch eine Richtungsänderung in einer fließenden Bewegung und ist auf nahezu jeder B&M-Sitzachterbahn, Inverted und Hypercoaster weltweit zu finden.',
    relatedTermIds: ['inversion', 'vertical-loop', 'dive-loop', 'b-and-m'],
  },
  {
    id: 'zero-g-roll',
    name: 'Zero-G Roll',
    shortDefinition:
      'Eine 360-Grad-Drehung entlang einer Parabelkurve, bei der die Fahrgäste am Scheitelpunkt Schwerelosigkeit erleben — eines der beliebtesten Elemente im modernen Achterbahndesign.',
    definition:
      'Der Zero-G Roll ist eine Inversion, bei der die Strecke eine parabelförmige Kurve durch die Drehung beschreibt. Am Scheitelpunkt erleben die Fahrgäste kurzzeitig negative G-Kräfte (Airtime) während sie auf dem Kopf stehen — ein einzigartiges Gefühl der Schwerelosigkeit im Überschlag. Zero-G Rolls sind vor allem für B&M Wing-Coaster und Hypercoaster charakteristisch, wo das Element die Außensitz-Fahrer besonders spektakulär durch die Luft schwenkt. Shambhala in PortAventura und Fury 325 in Carowinds zeigen den Zero-G Roll in seiner beeindruckendsten Form.',
    relatedTermIds: ['inversion', 'heartline-roll', 'airtime', 'b-and-m'],
  },
  {
    id: 'launch-coaster',
    name: 'Launch Coaster',
    shortDefinition:
      'Eine Achterbahn, die die Fahrgäste per Magnetantrieb, Hydraulik oder Druckluft aus dem Stand auf Höchstgeschwindigkeit beschleunigt — statt eines klassischen Kettenlift-Hügels.',
    definition:
      'Ein Launch Coaster (Katapultachterbahn) ersetzt den traditionellen Kettenlift durch ein Antriebssystem, das den Zug in wenigen Sekunden von 0 auf Höchstgeschwindigkeit bringt. Die wichtigsten Technologien: LSM (Linear Synchronous Motor) — elektromagnetische Spulen beschleunigen eine Lamelle am Zug; LIM (Linear Induction Motor) — ähnlich, aber weniger effizient; Hydraulik-Launches — Intamins kolbengetriebenes Seilsystem für Weltrekord-Coaster wie Kingda Ka; Druckluft-Launches. Manche Bahnen haben mehrere Launches im Streckenverlauf. Die plötzliche, kraftvolle Beschleunigung ist ein charakteristisches Erlebnis, das ein Kettenlift nie reproduzieren kann.',
    relatedTermIds: ['lifthill', 'top-hat', 'intamin', 'horseshoe'],
  },
  {
    id: 'wooden-coaster',
    name: 'Holzachterbahn',
    shortDefinition:
      'Eine Achterbahn, die überwiegend aus Holz gebaut ist und sich durch ihr charakteristisches Rumpeln, seitliche Bewegung und unberechenbaren Airtime auszeichnet.',
    definition:
      'Eine Holzachterbahn ist eine Bahn mit hölzerner Strecke und Struktur. Anders als Stahlbahnen hat Holz eine natürliche Flexibilität und Ungenauigkeit, die das charakteristische Rumpeln, seitliche Schaukeln und unberechenbare Airtime erzeugt, das Enthusiasten lieben. Berühmte Holzachterbahnen sind Balder in Liseberg, Colossos in Heide-Park und Wodan im Europa-Park. Holzachterbahnen erfordern intensive Wartung — das Schienenprofil muss regelmäßig erneuert werden. Das RMC (Rocky Mountain Construction)-Konvertierungsverfahren kann alte Holzachterbahnen in Hybrid-Coaster verwandeln, die die Holzstruktur behalten, aber einen Stahlschieneneinsatz erhalten.',
    relatedTermIds: ['airtime', 'hybrid-coaster', 'rmc'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Hybrid Coaster',
    shortDefinition:
      'Eine Achterbahn, die eine klassische Holzkonstruktion mit einer präzisen Stahlschiene (I-Box) kombiniert — Pionierarbeit von Rocky Mountain Construction (RMC).',
    definition:
      'Ein Hybrid Coaster verbindet die Holzstruktur einer traditionellen Achterbahn mit einer Stahl-I-Box-Schiene von Rocky Mountain Construction (RMC). Die I-Box-Schiene ist extrem präzise und ermöglicht Inversionen, die auf traditionellen Holzbahnen unmöglich wären. RMC entwickelte diese Technologie primär zur Sanierung alter Holzachterbahnen — Inversionen, steilere Abfälle und Airtime-Hügel werden in Layouts eingefügt, die zuvor zu rau zum Genießen waren. Berühmte RMC-Hybrids: Steel Vengeance in Cedar Point, Untamed in Walibi Holland und Wildfire im Kolmården Zoo. Das Ergebnis sind oft die bestbewerteten Achterbahnen der Welt.',
    relatedTermIds: ['wooden-coaster', 'rmc', 'airtime'],
  },
  {
    id: 'b-and-m',
    name: 'B&M',
    shortDefinition:
      'Bolliger & Mabillard, ein Schweizer Achterbahn-Hersteller, bekannt für ruhige, zuverlässige Bahnen und Signature-Elemente wie Immelmann, Cobra Roll und Zero-G Roll.',
    definition:
      'B&M (Bolliger & Mabillard) ist ein Schweizer Achterbahn-Hersteller, 1988 von Walter Bolliger und Claude Mabillard gegründet. Das Unternehmen ist für außergewöhnlich ruhige, zuverlässige Bahnen mit einem charakteristischen Fahrerlebnis bekannt: starke positive G-Kräfte, Signature-Inversionen (Immelmann, Cobra Roll, Zero-G Roll) und hoher Durchsatz. B&M spezialisiert sich auf Inverted Coaster, Sit-Down-Looper, Hypercoaster (über 61 m), Gigacoaster (über 91 m), Wing Coaster und Dive Machines. Nahezu jeder große europäische Park beherbergt mindestens eine B&M-Anlage: Shambhala und Dragon Khan in PortAventura, Silver Star im Europa-Park, Nemesis in Alton Towers.',
    relatedTermIds: ['immelmann', 'cobra-roll', 'zero-g-roll', 'dive-coaster'],
  },
  {
    id: 'intamin',
    name: 'Intamin',
    shortDefinition:
      'Schweizer Fahrgeschäft-Hersteller, bekannt für Weltrekord-Hydraulik-Launches, Mega-/Gigacoaster und innovative Designs — das Unternehmen hinter vielen der schnellsten und höchsten Bahnen der Welt.',
    definition:
      'Intamin AG ist ein Schweizer Freizeitgerätehersteller, 1967 gegründet, verantwortlich für einige der ehrgeizigsten Achterbahn-Rekorde der Geschichte. Ihr Hydraulik-Launch-System trieb jahrelang die schnellsten und höchsten Coaster der Welt an (Kingda Ka, 139 m; Top Thrill Dragster). Intamin ist auch für Mega- und Gigacoaster (Millennium Force in Cedar Point), Multi-Launch-Coaster, Wasserfahrten und Dark Rides bekannt. Europäische Intamin-Installationen umfassen Taron und Black Mamba in Phantasialand sowie Red Force in Ferrari Land.',
    relatedTermIds: ['launch-coaster', 'top-hat', 'b-and-m', 'mack-rides'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      'Deutsches Familienunternehmen aus Waldkirch nahe dem Europa-Park, das Wasserfahrten, Dark Rides und zunehmend spektakuläre Stahlachterbahnen herstellt.',
    definition:
      "Mack Rides ist ein deutsches Fahrgeschäft-Unternehmen aus Waldkirch in Baden-Württemberg — wenige Kilometer vom Europa-Park, dem Vorzeigepark der Mack-Familie, entfernt. 1921 gegründet, stellt Mack Wasserfahrten, Dark Rides (darunter Disney's Test Track und Radiator Springs Racers) und ein wachsendes Portfolio an Hochleistungs-Coastern her. Blue Fire Megacoaster im Europa-Park (2009) war die erste Bahn mit einem Stengel-Dive-Element. Macks neuere Hypercoaster (Ride to Happiness in Plopsaland, Kondaa in Walibi Belgien) haben von der Enthusiasten-Community Höchstnoten erhalten.",
    relatedTermIds: ['stengel-dive', 'b-and-m', 'intamin', 'launch-coaster'],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      'Amerikanischer Hersteller, der das Hybrid-Coaster-Konzept mit dem I-Box-Stahlschienenverfahren für Holzachterbahnen erfunden hat — und damit die bestbewerteten Bahnen der Welt schafft.',
    definition:
      'Rocky Mountain Construction (RMC) ist ein amerikanischer Achterbahn-Hersteller aus Hayden, Idaho, bekannt für die Erfindung des I-Box-Stahlschienensystems für Holzstrukturen. Diese Technologie erlaubt Parks, alte rumpelige Holzachterbahnen in Weltklasse-Hybrid-Coaster zu verwandeln — mit intensivem Airtime, Inversionen und Überkopf-Abfällen. RMC-Konversionen wie Steel Vengeance (Cedar Point), Untamed (Walibi Holland) und Wildfire (Kolmården Zoo) gelten als die besten Achterbahnen ihrer jeweiligen Parks. In Europa ist RMCs neuer Hybrid-Bau Untamed in Walibi Holland weitgehend als eine der besten Bahnen des Kontinents anerkannt.',
    relatedTermIds: ['hybrid-coaster', 'wooden-coaster', 'airtime'],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      'Niederländischer Achterbahn-Hersteller und einer der größten der Welt — bekannt für den allgegenwärtigen Boomerang sowie eine umfangreiche Palette an modernen Familien- und Thrill-Coasern in europäischen Parks.',
    definition:
      'Vekoma Rides Manufacturing ist ein niederländischer Achterbahn-Hersteller mit Sitz in Vlodrop und einer der weltweit produktivsten nach Gesamtanlagen. 1926 als Maschinenbauunternehmen gegründet, stieg Vekoma in den 1970er Jahren auf Freizeitattraktionen um. Weltweite Bekanntheit erlangte das Unternehmen mit dem Boomerang — einem kompakten Shuttle-Coaster mit drei Inversionen, der günstig lizenziert und rund um den Globus aufgestellt wurde. Weitere ikonische Modelle sind der Suspended Looping Coaster (SLC), der Giant Inverted Boomerang und der Mine Train. Ab den 2010er Jahren erfand sich Vekoma mit einer modernen „New Generation"-Produktlinie neu: sanftere Fahrsysteme, innovative Layouts und verbesserte Familienattraktionen. Neue Modelle wie der Family Boomerang, der Tilt Coaster und hängende Familiencoaster tauchen zunehmend in europäischen Parks auf. Auch Disney hat maßgeschneiderte Vekoma-Anlagen für seine Resorts in Auftrag gegeben.',
    relatedTermIds: ['boomerang', 'b-and-m', 'intamin', 'gerstlauer'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Deutscher Hersteller, vor allem bekannt für den Euro-Fighter mit seinem über-vertikalen Abfall sowie für Spinning Coaster und kompakte Familienbahnen.',
    definition:
      'Gerstlauer Amusement Rides GmbH ist ein deutscher Achterbahn-Hersteller aus Münsterhausen in Bayern. 1946 als metallverarbeitendes Unternehmen gegründet, stieg es in den 1980er Jahren in den Attraktionsmarkt ein und baute seinen Ruf mit dem Euro-Fighter-Modell aus — einem kompakten Elektro-Launch-Coaster mit berühmtem 97-Grad-Abfall über die Vertikale. Euro-Fighter lassen sich auf engem Raum installieren und sind damit attraktiv für Stadtparks und kleinere Veranstaltungsorte; Beispiele sind Rage im Adventure Island und Speed im Oakwood. Gerstlauer produziert außerdem das Infinity-Coaster-Modell, Spinning Coaster und den SkyRoller, bei dem die Fahrgäste ihr eigenes Drehen steuern können. In der Enthusiasten-Szene werden Gerstlauer-Bahnen für ihre Intensität auf kleinem Footprint geschätzt.',
    relatedTermIds: ['euro-fighter', 'spinning-coaster', 'b-and-m', 'intamin'],
  },
  {
    id: 'schwarzkopf',
    name: 'Schwarzkopf',
    shortDefinition:
      'Legendärer deutscher Hersteller, dessen klassische Looping-Achterbahnen aus den 70er und 80er Jahren noch heute in europäischen Parks für ihr intensives, buttereiches Fahrgefühl geliebt werden.',
    definition:
      'Anton Schwarzkopf GmbH & Co. KG war ein deutscher Achterbahn-Hersteller aus Münsterhausen, Bayern — später der Heimatort von Gerstlauer. Das 1954 von Anton Schwarzkopf gegründete Unternehmen war maßgeblich daran beteiligt, Looping-Achterbahnen nach Europa zu bringen. Die Revolution im Six Flags Magic Mountain (1976) war die erste moderne Looping-Achterbahn der Welt — ein Schwarzkopf-Design. Zu den bekanntesten Modellen gehören der Looping Star, der Thriller/Wildcat und der transportable Looping Coaster, der durch ganz Europa tourte. Schwarzkopf-Bahnen sind für ihre butterweichen Fahrten und die elegante Layouteffizienz bekannt — ein Ergebnis von Schwarzkopfs präzisem Ingenieurswesen. Nach der Insolvenz 1983 blieben viele Anlagen über Jahrzehnte in Betrieb und werden von Parks und Enthusiasten als unersetzliche Klassiker gehegt. Heute übernehmen Spezialfirmen oder Gerstlauer (das einige Werkzeuge übernahm) die Wartung.',
    relatedTermIds: ['b-and-m', 'intamin', 'gerstlauer', 'vekoma'],
  },
  {
    id: 'lifthill',
    name: 'Lifthill',
    shortDefinition:
      'Der mechanisch angetriebene Aufstieg einer Achterbahn, der den Zug auf den höchsten Punkt bringt und dabei Lageenergie für die restliche Fahrt aufbaut.',
    definition:
      "Der Lifthill ist der Abschnitt, an dem ein externes Antriebssystem — meistens eine Kette entlang der Gleismitte — den Zug von Bodenniveau auf den Scheitelpunkt der Bahn zieht. Der bekannte 'Klack-Klack-Klack'-Sound ist der Rückrollsperr-Ratschen. Alternativen zum Kettenlift: Seil-/Kabellift (leiser und weicher), Reibrollen-Lift (bei manchen modernen B&M-Coaster) und magnetischer Antrieb. Die Höhe des Lifthills bestimmt die maximal mögliche Geschwindigkeit der Bahn. Manche Designs nutzen mehrere Lifthills oder kombinieren einen Lift mit Launch-Segmenten. Der Lifthill ist typischerweise der langsamste, erwartungsgeladenste Moment der Fahrt.",
    relatedTermIds: ['first-drop', 'launch-coaster', 'block-brake'],
  },
  {
    id: 'first-drop',
    name: 'First Drop',
    shortDefinition:
      'Der erste Abfall nach dem Lifthill — meist der höchste und schnellste Punkt der Bahn, der den Charakter des Coasters prägt.',
    definition:
      'Der First Drop ist der Hauptabfall unmittelbar nach dem Lifthill oder dem Launch. Bei den meisten traditionellen Achterbahnen ist er der höchste Hügel und erzeugt die maximale Geschwindigkeit der Bahn. Winkel, Höhe und Profil prägen das Gesamterlebnis stark: Steilabfälle über 80–90 Grad erzeugen intensive Beschleunigungsgefühle; parabolische Abfälle können trotz sanfterem Winkel starken Airtime erzeugen. Dive Coaster haben Abfälle von über 90 Grad (Überkopf-Abfall), was die Fahrgäste zwingt, sich über die Kante zu lehnen. Der First Drop ist oft der meisterwartete Moment auf einer neuen Achterbahn.',
    relatedTermIds: ['lifthill', 'airtime', 'airtime-hill', 'dive-coaster'],
  },
  {
    id: 'airtime-hill',
    name: 'Airtime-Hügel',
    shortDefinition:
      'Ein kuppelförmiges Element, das negative G-Kräfte erzeugt und die Fahrgäste aus dem Sitz hebt — das Herzstück jeder guten Hypercoaster-Strecke.',
    definition:
      'Ein Airtime-Hügel (englisch: Camelback) ist ein kurvenförmiger Auf-Ab-Abschnitt, der negative G-Kräfte erzeugt — das Gefühl zu schweben oder aus dem Sitz gehoben zu werden. Floater Airtime: sanfte negative G, weiches Schweben. Ejector Airtime: intensiv, der Schoßbügel ist das Einzige was den Fahrer hält. Stahlbahnen nutzen präzise geformte Parabelkurven für gleichmäßigen, vorhersehbaren Airtime; Holzbahnen liefern unberechenbares, raues Airtime durch Schienenflex. Airtime-Hügel gelten in Enthusiasten-Rankings als die wichtigsten Qualitätselemente und sind das charakteristische Merkmal von Hyper- und Gigacoastern.',
    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      'Ein kontinuierlicher Spiralabschnitt, bei dem die Strecke um eine Mittelachse wickelt und anhaltende Seitwärts-G-Kräfte erzeugt.',
    definition:
      'Eine Helix ist ein Streckenabschnitt, der kontinuierlich spiralförmig um eine Mittelachse verläuft — ähnlich wie eine Schraube, aber ohne Überschlag. Helices erzeugen anhaltende Seitwärts-G-Kräfte, die Fahrgäste in die Außenkurve drücken. Eine abwärts führende Helix beschleunigt den Zug beim Kurvenfahren; eine aufwärts führende verzögert ihn. Helices werden häufig am Ende einer Strecke eingesetzt, um die verbleibende kinetische Energie zu nutzen und gleichzeitig ein aufregendes Dreherlebnis zu liefern. Berühmte Helices: die unterirdische Abschlusshelix von Nemesis in Alton Towers und die Schlusshelix von Expedition GeForce in Holiday Park.',
    relatedTermIds: ['horseshoe', 'first-drop'],
  },
  {
    id: 'block-brake',
    name: 'Blockbremse',
    shortDefinition:
      'Eine Bremssektion, die die Strecke in unabhängige Blöcke aufteilt, damit mehrere Züge gleichzeitig ohne Kollisionsgefahr fahren können.',
    definition:
      "Eine Blockbremse teilt die Achterbahnstrecke in unabhängige Abschnitte ('Blöcke'), von denen jeder genau einen Zug aufnehmen kann. Wenn ein Zug weiter vorne bremst oder hält, hält das Steuerungssystem alle folgenden Züge automatisch an ihren Blockbremsen an. Dieses Sicherheitssystem erlaubt Parks, mehrere Züge gleichzeitig zu betreiben — was die stündliche Kapazität erheblich erhöht — ohne Kollisionsrisiko. Blockbremsen werden an Punkten platziert, an denen ein haltender Zug nicht zurückrollen kann (typisch: ein flacher oder leicht ansteigender Abschnitt). Die bekannteste Form ist die Mid-Course Brake Run (MCBR) in der Mitte der Strecke.",
    relatedTermIds: ['brake-run', 'ride-capacity', 'stacking'],
  },
  {
    id: 'brake-run',
    name: 'Brake Run',
    shortDefinition:
      'Der Bremsabschnitt am Ende der Strecke, in dem der Zug auf Stationsgeschwindigkeit verzögert wird — meist mit Wirbelstrombremsen.',
    definition:
      'Der Brake Run ist der Streckenabschnitt nach dem Hauptlayout, in dem der Achterbahnzug von Fahrtgeschwindigkeit auf eine sichere Stationsanfahrt-Geschwindigkeit abbremst. Moderne Brake Runs verwenden Wirbelstrombremsen (Eddycurrent-Bremsen) — Reihen von Permanentmagneten, die mit Metalllamellen am Zuguntergestell interagieren und Widerstand ohne Reibung oder Verschleiß erzeugen. Ältere Achterbahnen nutzen pneumatische oder mechanische Klotzbremsen. Ein Mid-Course Brake Run (MCBR) in der Streckenmitte dient als Blockabschnitt für den Mehrzugbetrieb. Der finale Brake Run vor der Station kann bewusst sanft gebremst sein, um die Dynamik der Stationseinfahrt zu erhalten.',
    relatedTermIds: ['block-brake', 'lifthill'],
  },
  {
    id: 'cobra-roll',
    name: 'Cobra Roll',
    shortDefinition:
      'Ein Doppel-Inversions-Element, das in der Form eines erhobenen Kobrakopfs aussieht — zwei Inversionen verbunden durch eine 180-Grad-Drehung am Scheitelpunkt.',
    definition:
      'Der Cobra Roll ist eines der markantesten B&M-Elemente und besteht aus zwei Inversionen in rascher Folge: Die Strecke zieht sich in einen halben Looping aufwärts, dreht am Scheitelpunkt 180 Grad durch eine kurze Überkopf-Passage, spiegelt dann die Sequenz und verlässt das Element in der ursprünglichen Fahrtrichtung. Aus der Seitenansicht ähnelt der Streckenverlauf dem erhobenen und gespreizten Kopf einer Kobra. Berühmte Cobra Rolls: Shambhala in PortAventura, Pyrenees in Madrid und zahlreiche B&M-Inverted-Coaster weltweit.',
    relatedTermIds: ['inversion', 'immelmann', 'batwing', 'b-and-m'],
  },
  {
    id: 'corkscrew',
    name: 'Korkenzieher',
    shortDefinition:
      'Eine spiralförmige 360-Grad-Inversion, bei der die Strecke um eine Mittelachse gewickelt ist — einer der frühesten und meistgebauten Inversionstypen.',
    definition:
      "Der Korkenzieher (englisch: Corkscrew) ist eine der ältesten modernen Inversionen, von Arrow Dynamics in den 1970ern eingeführt. Die Strecke windet sich wie ein Weinkorkenziehen um einen zentralen Zylinder und dreht die Fahrgäste durch einen vollständigen 360-Grad-Roll, der seitlich versetzt zum Fahrtweg verläuft. Korkenzieher werden oft paarweise (hintereinander) gebaut und sind das Markenzeichen der 'klassischen' Stahl-Achterbahn-Ära. Auf deutschen Parkplänen und Beschilderungen wird der Begriff 'Korkenzieher' verwendet. Neuere Inversions-Designs haben den Korkenzieher weitgehend abgelöst, doch er bleibt ein nostalgisches Lieblingselement.",
    relatedTermIds: ['inversion', 'inline-twist', 'flat-spin'],
  },
  {
    id: 'dive-loop',
    name: 'Dive Loop',
    shortDefinition:
      'Das Spiegelbild eines Immelmanns: Die Strecke taucht steil nach unten in einen halben Looping und verlässt ihn horizontal — umgekehrte Richtung zum Immelmann.',
    definition:
      'Ein Dive Loop (auch Dive Turn oder umgekehrter Immelmann genannt) beginnt dort, wo der Immelmann endet: Anstatt aufwärts und über den Scheitelpunkt zu ziehen, taucht die Strecke steil nach unten, beschreibt den unteren Teil eines Loopings und verlässt ihn in die entgegengesetzte Richtung zum Eingang. Die Empfindung ist ein wuchtiger Sturzflug gefolgt von einem kräftigen Herausziehen. Dive Loops sind typische B&M-Elemente und erscheinen auf vielen Inverted- und Sitzcoastern des Herstellers. Die Kombination von Immelmanns und Dive Loops in einem Layout schafft abwechslungsreiche Richtungswechsel und Inversionstypen.',
    relatedTermIds: ['inversion', 'immelmann', 'b-and-m'],
  },
  {
    id: 'inline-twist',
    name: 'Inline Twist',
    shortDefinition:
      'Eine einzelne 360-Grad-Drehung direkt um die Gleisachse — eine sanfte Inversion, die die Fahrtrichtung kaum verändert.',
    definition:
      "Ein Inline Twist (auch Inline Roll oder Barrel Roll) dreht den Zug 360 Grad um die Längsachse der Strecke — die Achterbahn 'rollt' ohne wesentliche Richtungsänderung. Anders als ein Korkenzieher (der spiralförmig von der Gleismitte abweicht) dreht der Inline Twist genau um den Gleis-Mittelpunkt. Das Ergebnis ist eine sanfte, kurze Inversion mit minimalen Seitwärts-G-Kräften. Inline Twists sind häufig auf B&M-Flying-Coastern und Inverted-Coastern zu finden und erscheinen oft in Paaren oder in rascher Kombination mit anderen Elementen.",
    relatedTermIds: ['inversion', 'corkscrew', 'heartline-roll', 'flat-spin'],
  },
  {
    id: 'heartline-roll',
    name: 'Heartline Roll',
    shortDefinition:
      'Eine 360-Grad-Drehung, bei der der Mittelpunkt am Schwerpunkt des Fahrgastes liegt statt am Gleis — für ein schwereloses, sanftes Rotationsgefühl.',
    definition:
      'Ein Heartline Roll (Herzlinien-Rolle) ist so konstruiert, dass das Herz des Fahrgastes — annähernd der Körperschwerpunkt — während der gesamten Drehung auf konstanter Höhe und Position bleibt, anstatt dass das Gleis der Drehpunkt ist. Dieses Design minimiert die G-Kräfte während der Rolle und erzeugt ein sanftes, schwebendes Gefühl. Heartline Rolls sind ein Markenzeichen moderner B&M- und Intamin-Coaster, besonders auf Hyper- und Inverted-Coastern. Das Element verdeutlicht die ingenieurtechnische Präzision, die für ein ruhiges Fahrerlebnis erforderlich ist.',
    relatedTermIds: ['inversion', 'zero-g-roll', 'inline-twist'],
  },
  {
    id: 'sidewinder',
    name: 'Sidewinder',
    shortDefinition:
      'Ein halber Looping kombiniert mit einem halben Korkenzieher, der die Strecke um 90 Grad dreht und die Fahrtrichtung ändert — Markenzeichen von Vekoma-Boomerang-Coastern.',
    definition:
      'Ein Sidewinder besteht aus einem halben Vertikalen Looping, der den Zug aufwärts zieht, gefolgt von einem halben Korkenzieher, der ihn wieder aufrichtet und dabei 90 Grad dreht. Das Ergebnis ist eine Inversion mit erheblicher Richtungsänderung in kompakter Bauweise. Sidewinder sind die Bausteine von Vekomas ikonischem Boomerang-Coaster-Modell: Zwei Sidewinder (einer vorwärts, einer gespiegelt) flankieren einen zentralen Looping, um das vollständige Layout zu bilden. Der Name bezieht sich auf die schlängelartige Drehbewegung des Elements.',
    relatedTermIds: ['inversion', 'boomerang', 'cobra-roll'],
  },
  {
    id: 'pretzel-loop',
    name: 'Pretzel Loop',
    shortDefinition:
      'Eine massive Inversion ausschließlich für B&M-Flying-Coaster, bei der Fahrgäste in Superman-Position durch den Tiefpunkt eines großen Loopings passieren.',
    definition:
      'Der Pretzel Loop ist eine der intensivsten Inversionen im Freizeitparkbereich, ausschließlich bei B&M-Flying-Coastern (wo die Fahrgäste horizontal in Superman-Position liegen) zu finden. Das Element schickt Fahrgäste steil nach unten — auf dem Kopf stehend — durch den Tiefpunkt eines großen Loopings, bevor es wieder steil aufwärts geht. Die Gesamtform ähnelt einer Brezel. Da der Tiefpunkt unten liegt und die Fahrgäste mit dem Gesicht nach unten liegen, sind die G-Kräfte in diesem Moment außergewöhnlich intensiv. Berühmte Pretzel Loops: Manta in SeaWorld Orlando und Tatsu in Six Flags Magic Mountain.',
    relatedTermIds: ['inversion', 'b-and-m', 'inline-twist'],
  },
  {
    id: 'batwing',
    name: 'Batwing',
    shortDefinition:
      'Ein Doppel-Inversions-Element mit 180-Grad-Richtungsumkehr, das in der Form einer Fledermaus-Flügelspannweite aussieht.',
    definition:
      "Ein Batwing besteht aus zwei Inversionen mit Richtungsumkehr: Die Strecke zieht in einen halben Looping aufwärts, durchläuft am Scheitelpunkt einen halben Korkenzieher, der den Zug in einen kurzen Überkopf-Bereich bringt, und spiegelt dann die Sequenz zurück auf Bodenniveau — mit einer 180-Grad-Drehung der Fahrtrichtung. Aus der Vogelperspektive ähnelt der Streckenverlauf den ausgebreiteten Flügeln einer Fledermaus. Batswings sind ein Markenzeichen von B&M und erscheinen auf Coastern wie Afterburn in Carowinds und The Incredible Hulk Coaster im Universal's Islands of Adventure. Anders als ein Bowtie (ohne Richtungsänderung) kehrt der Batwing die Fahrtrichtung um.",
    relatedTermIds: ['inversion', 'bowtie', 'cobra-roll', 'b-and-m'],
  },
  {
    id: 'norwegian-loop',
    name: 'Norwegian Loop',
    shortDefinition:
      'Eine Looping-Variante, bei der Einfahrt und Ausfahrt oben liegen statt unten — die umgekehrte Geometrie eines Standard-Loopings.',
    definition:
      'Der Norwegian Loop (auch Reverse Loop oder umgekehrter Looping) hat die entgegengesetzte Geometrie eines Standard-Loopings: Statt in Bodennähe einzufahren und auf gleicher Höhe auszufahren, nähert sich der Zug von oben, taucht in den kreisförmigen Looping-Pfad hinab und verlässt ihn wieder oben. Am Tiefpunkt des Kreises sind die G-Kräfte wie beim normalen Looping stark positiv, doch die Einfahrt- und Ausfahrt-Empfindungen unterscheiden sich deutlich. Norwegian Loops sind vergleichsweise selten und werden vor allem mit bestimmten Vekoma-Modellen und Individualprojekten assoziiert.',
    relatedTermIds: ['inversion', 'vertical-loop', 'dive-loop'],
  },
  {
    id: 'flat-spin',
    name: 'Flat Spin',
    shortDefinition:
      'Ein Korkenzieher-Element auf Inverted- oder Flying-Coastern, bei dem die Drehung in nahezu horizontaler Ebene stattfindet.',
    definition:
      'Ein Flat Spin ist eine Korkenzieher-artige Inversion, die hauptsächlich auf B&M-Inverted- und Flying-Coastern vorkommt. Die Geometrie des Elements ist so ausgerichtet, dass die Spirale für Außenstehende nahezu horizontal erscheint. Bei Inverted-Coastern (wo der Zug unter dem Gleis hängt) erzeugt ein Flat Spin ein besonders spektakuläres visuelles Bild, da die Fahrgäste in einem breiten, nahezu ebenen Kreis schwingen. Das Fahrgefühl ist eine sanfte, anhaltende Drehung mit moderaten G-Kräften. Flat Spins sind Markenzeichen von B&M-Inverted-Coastern wie Banshee in Kings Island.',
    relatedTermIds: ['inversion', 'corkscrew', 'inline-twist', 'b-and-m'],
  },
  {
    id: 'cutback',
    name: 'Cutback',
    shortDefinition:
      'Eine halbe Korkenzieher-Inversion, die gleichzeitig die Fahrtrichtung um ca. 180 Grad umkehrt — Inversion und Richtungsänderung in einem Element.',
    definition:
      "Ein Cutback ist ein Element, bei dem die Strecke einen halben Korkenzieher ausführt und sich dabei um etwa 180 Grad zurückbiegt. Das Ergebnis ist eine Inversion mit erheblicher Richtungsumkehr — im Gegensatz zu einem normalen Korkenzieher, der die Fahrtrichtung weitgehend beibehält. Cutbacks sind vergleichsweise selten und finden sich auf bestimmten Vekoma-Modellen und individuellen Coastern, die eine kompakte Richtungsänderung mit Inversion benötigen. Der Name 'Cutback' beschreibt das visuelle Erscheinungsbild: Die Strecke 'schneidet' zurück auf ihre frühere Fahrtrichtung, während sie umschlägt.",
    relatedTermIds: ['inversion', 'corkscrew', 'sidewinder'],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    shortDefinition:
      'Eine Doppel-Inversions-Variante der Sea Serpent mit tieferem Verbindungsscheitelpunkt — zwei aufeinanderfolgende Inversionen ohne Richtungsänderung in kompakter Bauform.',
    definition:
      'Der Butterfly ist ein Doppel-Inversions-Element ähnlich einem Sea Serpent (zwei halbe Loopings, an der Spitze verbunden), aber mit tieferem Scheitelpunkt und anderer Geometrie. Wie der Sea Serpent erzeugt er zwei Inversionen ohne Richtungsänderung des Zugs, aber das Verbindungsstück zwischen den halben Loopings passiert einen niedrigeren Überkopf-Abschnitt statt einer hohen Spitze. Das macht den Butterfly vertikal kompakter. Das Element erscheint auf bestimmten Vekoma- und Individualcoastern und unterscheidet sich vom Bowtie (andere Geometrie, gleiche Anzahl Inversionen ohne Richtungsänderung) und dem Batwing (hat eine Richtungsänderung).',
    relatedTermIds: ['inversion', 'bowtie', 'batwing'],
  },
  {
    id: 'bowtie',
    name: 'Bowtie',
    shortDefinition:
      'Ein Doppel-Inversions-Element mit zwei gespiegelten halben Loopings, die eine Fliegen-Form bilden — zwei Inversionen ohne Richtungsänderung.',
    definition:
      'Ein Bowtie besteht aus zwei gespiegelten halben Loopings, die an ihrer Spitze verbunden sind. Anders als ein Batwing (der die Richtung umkehrt) verlässt der Bowtie das Element in der gleichen Richtung wie die Einfahrt. Aus der Vogelperspektive ähnelt der Streckenverlauf einer Fliege (Bowtie). Bowties sind vergleichsweise selten und finden sich hauptsächlich auf bestimmten Vekoma- und Individualanlagen. Das Element erzeugt zwei sanfte Inversionen in rascher Folge, während die Fahrtrichtung beibehalten wird — dies unterscheidet es vom ähnlich aussehenden Batwing.',
    relatedTermIds: ['inversion', 'batwing', 'butterfly'],
  },
  {
    id: 'bunnyhop',
    name: 'Bunnyhop',
    shortDefinition:
      'Eine Reihe kleiner, schneller Airtime-Hügel am Ende der Strecke, die sanften Floater-Airtime bei reduzierter Geschwindigkeit erzeugen.',
    definition:
      'Ein Bunnyhop ist eine Reihe kleiner, rascher Hügel gegen Ende eines Coaster-Layouts, wenn der Zug bereits den Großteil seiner kinetischen Energie abgebaut hat. Bei dieser reduzierten Geschwindigkeit erzeugen die Hügel sanften Floater-Airtime — ein weiches, rhythmisches Schweben statt des intensiven Ejector-Airtimes schnellerer Hügel früher im Layout. Der Begriff spiegelt die leichte, hüpfende Bewegung wider, die an ein Kaninchen erinnert. Bunnyhops sind häufige Abschluss-Elemente auf Hyper-Coastern, Gigacoastern und Holzachterbahnen und gelten als ein Zeichen durchdachten Streckendesigns.',
    relatedTermIds: ['airtime', 'airtime-hill', 'brake-run'],
  },
  {
    id: 'stengel-dive',
    name: 'Stengel Dive',
    shortDefinition:
      'Ein überkippter Airtime-Hügel mit über 90 Grad Querneigung, benannt nach Ingenieur Werner Stengel — Fahrgäste hängen seitlich während sie gleichzeitig Airtime erleben.',
    definition:
      'Der Stengel Dive ist ein Airtime-Element, bei dem die Strecke mehr als 90 Grad neigt — über die Vertikale hinaus —, sodass Fahrgäste seitlich oder leicht über Kopf hängen und gleichzeitig negative G-Kräfte durch die Hügelform erleben. Diese einzigartige Kombination aus seitlicher Ausrichtung und Airtime ist ein unverwechselbares Erlebnis. Das Element ist nach dem legendären deutschen Ingenieur Werner Stengel benannt, der das Design entwickelt hat. Stengel Dives sind besonders mit Mack Rides Hypercoastern verbunden: Blue Fire Megacoaster im Europa-Park (2009) war die erste Bahn mit einem solchen Element; Folgebahnen wie Ride to Happiness und Kondaa haben es weiterentwickelt.',
    relatedTermIds: ['airtime-hill', 'mack-rides', 'airtime'],
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    shortDefinition:
      'Eine stark überkippte 180-Grad-Kurve in Hufeisenform, die den Zug in die entgegengesetzte Richtung umlenkt — häufig zwischen Launch-Segmenten eingesetzt.',
    definition:
      'Ein Horseshoe (Hufeisen) ist eine extrem stark überkippte Halbkreiskurve — typisch 75 bis 90 Grad Querneigung —, die den Coaster um 180 Grad wendet. Die extreme Neigung verhindert trotz des engen Radius übermäßige Seitwärts-G-Kräfte. Horseshoes werden häufig in Launch-Coaster-Layouts als Wendeelemente zwischen mehreren Launch-Segmenten eingesetzt und ermöglichen eine U-förmige Umkehr vor dem nächsten Beschleunigungsabschnitt. Das Element ist visuell eindrucksvoll und prägt die Layouts von Intamin-Accelerator-Coastern und Macks Multi-Launch-Designs.',
    relatedTermIds: ['launch-coaster', 'intamin', 'mack-rides'],
  },
  {
    id: 'predrop',
    name: 'Predrop',
    shortDefinition:
      'Ein kleiner Hügel kurz vor dem First Drop auf Kettenlift-Coastern, der die Kettenspannung verringert und einen kurzen Vorgeschmack auf Airtime liefert.',
    definition:
      'Ein Predrop ist ein kleiner Hügel oder eine Senke, die am Ende des Lifthills kurz vor dem Hauptabfall platziert wird. Sein primärer technischer Zweck ist es, die Spannung auf die Liftkette beim Überqueren der Kuppe zu verringern — um einen ruckartigen Übergang zu vermeiden. Der Nebeneffekt ist ein erlebnisbezogener: Der kurze Airtime-Moment beim Überqueren des Predrops gibt einen Vorgeschmack auf das Haupterlebnis und steigert die Vorfreude. Predrops sind ein beliebtes Designmerkmal bei Holz- und Stahlachterbahnen; der Predrop des Goliath in Six Flags Magic Mountain ist einer der bekanntesten.',
    relatedTermIds: ['lifthill', 'first-drop', 'airtime'],
  },
  {
    id: 'top-hat',
    name: 'Top Hat',
    shortDefinition:
      'Ein hohes, schmales Element mit nahezu vertikalem Auf- und Abstieg — Wahrzeichen der Intamin-Hydraulik-Launch-Coaster.',
    definition:
      'Ein Top Hat ist ein markantes Element, bei dem die Strecke nahezu senkrecht auf eine scharfe Kuppe ansteigt und auf der anderen Seite nahezu senkrecht wieder abfällt — im Seitenriss ähnelt das Profil einem Zylinderhut. Inside-Top-Hats neigen am Scheitelpunkt nach innen; Outside-Top-Hats neigen nach außen für ein besonderes, exponiertes Airtime-Erlebnis. Das Element ist fest mit Intamins Hydraulik-Launch-Coastern (Acceleratoren) verbunden: Nach dem initialen Launch auf über 200 km/h ist der Top Hat das dramatische Herzstück der Bahn. Kingda Ka (139 m), Top Thrill Dragster (128 m) und Red Force in Ferrari Land zeigen den Top Hat in seiner imposantesten Form.',
    relatedTermIds: ['launch-coaster', 'intamin', 'first-drop'],
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    shortDefinition:
      'Ein kompaktes Vekoma-Coaster-Modell, das Fahrgäste durch drei Inversionen schickt — einmal vorwärts, einmal rückwärts — für insgesamt sechs Inversionen in einer Hin-und-Her-Bahn.',
    definition:
      'Der Boomerang ist eines der meistgebauten Achterbahn-Modelle der Geschichte, hergestellt von Vekoma. Das Layout enthält drei Inversionen — einen Looping flankiert von zwei Sidewindern —, die zunächst vorwärts, dann rückwärts durchfahren werden, nachdem der Zug auf einen zweiten geneigten Lift-Abschnitt gezogen und rückwärts durch die gleichen Elemente entlassen wird. Zusammen liefert die Fahrt sechs Inversionen (drei in jede Richtung) auf sehr kompakter Grundfläche — ideal für Parks mit begrenztem Platz. Über 50 Boomerangs wurden weltweit gebaut. Trotz ihres Alters sind sie beliebte Einstiegsbahnen in mittelgroßen Parks.',
    relatedTermIds: ['inversion', 'sidewinder', 'vertical-loop'],
  },
  {
    id: 'euro-fighter',
    name: 'Euro-Fighter',
    shortDefinition:
      'Ein kompaktes Gerstlauer-Coaster-Modell mit nahezu vertikalem oder Überkopf-First-Drop nach einem vertikalen Kettenlift — intensive Fahrten auf kleiner Grundfläche.',
    definition:
      'Der Euro-Fighter ist Gerstlauers Signature-Kompaktcoaster, erkennbar an seinem vertikalen (90-Grad-) oder Überkopf-Abfall (bis zu 97 Grad) nach einem vertikalen Kettenlift. Er liefert intensive Fahrten — mehrere Inversionen, enge Kurven, hohe G-Kräfte — auf kleiner Grundfläche. Der Überkopf-Abfall (steiler als senkrecht) ist besonders bemerkenswert: Der Zug hält kurz an der Spitze an, Fahrgäste lehnen sich über die Kante, bevor der Abfall beginnt. Europäische Euro-Fighter: Saw – The Ride in Thorpe Park, Rage in Adventure Island und Fluch von Novgorod im Hansa-Park.',
    relatedTermIds: ['first-drop', 'inversion', 'lifthill'],
  },
  {
    id: 'dive-coaster',
    name: 'Dive Coaster',
    shortDefinition:
      'Ein Coaster-Typ mit extrem breitem Zug und nahezu vertikalem Abfall, der oben dramatisch anhält — für maximale Vorspannung vor dem Sturz.',
    definition:
      'Ein Dive Coaster zeichnet sich durch extrem breite Züge (meist 8–10 Sitzplätze in einer Reihe), einen nahezu vertikalen oder Überkopf-Abfall (90+ Grad) und einen theatralischen Halt an der Abfallkante aus — der Zug hält kurz über der Kante an, bevor er freigelassen wird. Das maximiert die Vorspannung. Das breite Format gibt allen Fahrgästen den Blick senkrecht nach unten. B&Ms Dive Machine (Oblivion in Alton Towers, Krake in Heide-Park) hat das Konzept geprägt; Gerstlauer bietet ein Konkurrenzmodell an. Der bewusste Stopp an der Kante ist eine Designentscheidung zur Steigerung der psychologischen Spannung.',
    relatedTermIds: ['first-drop', 'b-and-m', 'euro-fighter'],
  },
  {
    id: 'credit',
    name: 'Credit',
    shortDefinition:
      'Eine gefahrene Achterbahn, die ein Enthusiast in seine persönliche Gesamtzahl aufnimmt — Credits zu sammeln ist eine der Kernaktivitäten der Coaster-Enthusiasten-Community.',
    definition:
      "Ein Credit (auch Cred) ist eine Achterbahn, die ein Enthusiast gefahren ist und offiziell in seine persönliche Anzahl aufnimmt. Das 'Credits sammeln' — so viele verschiedene Achterbahnen wie möglich zu fahren — ist eine der zentralen Aktivitäten der Coaster-Enthusiasten-Community. Regeln dazu variieren: Manche zählen nur Sitzcoaster, andere alle Schienenbahnen; manche brauchen jeden Zugtyp einer Bahn nicht separat zu zählen, andere schon. Websites wie die Roller Coaster Database (RCDB) erlauben das Protokollieren der Credit-Zahlen. Der Credit-Erwerb motiviert viele Enthusiasten zu internationalen Reisen und Besuchen abgelegener Parks.",
    relatedTermIds: ['pov', 'wooden-coaster', 'hybrid-coaster'],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      'Point-of-View-Aufnahme aus der Perspektive der ersten Reihe einer Achterbahn — das wichtigste Videoformat der Coaster-Enthusiasten-Community auf YouTube.',
    definition:
      'POV (Point of View) bezeichnet Onride-Videoaufnahmen aus der Perspektive eines Frontreihensitzers, typischerweise von einer am Zug befestigten Kamera. POV-Videos sind eines der populärsten Content-Formate in der Freizeitpark-Enthusiasten-Community und werden von Besuchern genutzt, um eine Achterbahn vor dem Parkbesuch virtuell zu erkunden. Parks produzieren manchmal offizielle POVs für Werbezwecke; häufiger werden sie von Gästen oder Medienvertretern aufgenommen. Ein gut produzierter POV zeigt jedes Element, jeden Abfall und jede Inversion in Reihenfolge. YouTube beherbergt zehntausende Coaster-POV-Videos. Der Begriff wird auch allgemein für Ich-Perspektive-Aufnahmen von Parkattraktionen verwendet.',
    relatedTermIds: ['credit', 'dark-ride'],
  },
  {
    id: 'vr-coaster',
    name: 'VR Coaster',
    shortDefinition:
      'Eine Achterbahn, bei der Fahrgäste VR-Brillen tragen, die eine synchronisierte virtuelle Welt über die physische Fahrt legen.',
    definition:
      'Ein VR Coaster rüstet Fahrgäste mit VR-Brillen aus, die eine synchronisierte virtuelle Umgebung anzeigen, die die physischen Bewegungen der Achterbahn spiegelt. Wenn die Bahn durch einen Looping zieht, taucht die virtuelle Welt in gleicher Weise; beim Abfall stürzt die virtuelle Welt mit. VR Coaster wurden ab ca. 2015–2019 populär, viele Parks rüsteten bestehende Bahnen um. Das Konzept stieß auf geteilte Reaktionen: Manche Gäste lieben das immersive Erlebnis, andere empfinden die Brillen als unbequem, unhygienisch oder Motion-sickness-auslösend. Viele Parks, die VR eingeführt hatten, haben es wieder entfernt. Mack Rides bietet mit VR Coaster eine der ausgereifteren Lösungen.',
    relatedTermIds: ['dark-ride', 'height-requirement'],
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      'Exclusive Ride Time — eine Session mit exklusivem Zugang zu einer oder mehreren Attraktionen für Enthusiasten-Clubs oder Hotelgäste, ohne normales Publikum.',
    definition:
      'ERT (Exclusive Ride Time, auf Deutsch auch EFZ: Exklusive Fahrzeit) ist ein Zeitraum, in dem eine ausgewählte Gruppe — typischerweise Mitglieder eines Coaster-Enthusiasten-Clubs (wie European Coaster Club oder Coasterfriends), Hotelgäste oder Jahrespass-Inhaber — exklusiven Zugang zu einer oder mehreren Attraktionen erhält, ohne normales Publikum. Während ERT können Teilnehmer die Bahn mit minimalen Wartezeiten wiederholt fahren und dabei oft Dutzende Fahrten in einer einzigen Session erleben. Für Enthusiasten ist ERT eines der wertvollsten Park-Erlebnisse überhaupt — es offenbart den wahren Charakter einer Bahn ohne Warteschlangen-Druck.',
    relatedTermIds: ['hard-ticket-event', 'early-entry', 'rope-drop', 'credit'],
  },
  {
    id: 'touring-plan',
    name: 'Touringplan',
    shortDefinition:
      'Ein detaillierter, optimierter Besuchsplan für einen Freizeitparkbesuch, der die Abfolge der Attraktionen so ordnet, dass Wartezeiten minimiert und möglichst viele Fahrten erreicht werden.',
    definition:
      'Ein Touringplan ist eine vorbereitete Abfolge von Attraktionen, Mahlzeiten und Parkbewegungen, die darauf ausgelegt ist, die Gesamtwartezeit über den Tag zu minimieren. Effektive Touringpläne berücksichtigen Besuchermuster (welche Parkbereiche sich zuerst füllen), Attraktionskapazitäten, Schlangenverhalten, Showpläne und Wetter. Seiten wie TouringPlans.com (heute Thrill-Data) veröffentlichen detaillierte Pläne für große Parks. Die Live-Wartezeiten und der Besucherkalender von park.fan sind komplementäre Werkzeuge: Echtzeit-Wartezeiten ermöglichen spontane Anpassungen des Plans. An belebten Tagen kann ein guter Touringplan die Gesamtwartezeit um 30–50 % gegenüber einem spontanen Ansatz reduzieren.',
    relatedTermIds: ['crowd-calendar', 'rope-drop', 'wait-time', 'early-entry'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      'Situation, bei der mehrere Züge in der Bremssektion aufeinander warten, weil das Be- und Entladen langsamer als der Fahrzyklus ist — reduziert die Kapazität und verlängert Wartezeiten.',
    definition:
      "Stacking (Aufstapeln) tritt auf, wenn der Be- und Entladevorgang einer Achterbahn langsamer als die Fahrtzykluszeit ist, sodass Züge in der Bremssektion auf die Freigabe der Station warten müssen. Statt einen Zug abzufertigen, wenn der vorherige zurückkommt, muss der Betreiber mehrere Züge in der Bremssektion halten — was die Bahn zwischen den Zügen kurz anhalten kann. Stacking reduziert die Kapazität direkt und verlängert die Wartezeiten. Häufige Ursachen: langsames Be- und Entladen (oft durch komplexe Rückhaltesysteme), Gepäckpflicht-Checks oder Personalmangel. Erfahrene Parkbesucher können während des Wartens beobachten, ob eine Bahn 'stackt', und dies in ihre Entscheidungen einbeziehen.",
    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      'Achterbahntyp, bei dem der Zug unter der Schiene hängt und die Beine der Fahrgäste frei in der Luft baumeln.',
    definition:
      'Ein Inverted Coaster (auch Invert) ist eine Achterbahn, bei der der Zug starr unterhalb der Schiene befestigt ist — anders als ein Swinging Coaster, der sich seitlich bewegen kann. Die Fahrgäste sitzen mit frei hängenden Beinen über dem Zug. B&M entwickelte das moderne Inverted-Konzept 1992 mit Batman The Ride und ist bis heute der dominierende Hersteller. Inverted Coasters sind bekannt für intensive Head-Chopper-Nahbegegnungen, Zero-G Rolls und Cobra Rolls. Bekannte europäische Beispiele: Nemesis (Alton Towers), Katun (Mirabilandia), Oziris (Parc Astérix) und Banshee (Kings Island).',
    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'Achterbahntyp mit seitlich an der Schiene platzierten Sitzen — über, unter und neben den Fahrgästen ist nichts als Luft.',
    definition:
      'Ein Wing Coaster (auch Wing Rider) platziert jeweils zwei Sitze links und rechts neben der Schiene, sodass die Fahrgäste keinerlei Struktur über, unter oder neben sich haben. Das Design maximiert das Flugerleben und ermöglicht spektakuläre Nahbegegnungen mit Theming und Konstruktionsteilen. B&M ist der primäre Hersteller von Wing Coastern. Herausragende europäische Beispiele: Flug der Dämonen in Europa-Park — oft als einer der besten Coaster Europas bezeichnet — sowie The Swarm in Thorpe Park. Mit park.fan findest du aktuelle Wartezeiten für alle Wing Coaster.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'dive-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      'Achterbahn mit frei drehbaren Fahrzeugen — jede Fahrt bietet eine andere Perspektive.',
    definition:
      'Ein Spinning Coaster (auch Drehachterbahn) verwendet Fahrzeuge, die sich auf einer vertikalen Achse frei drehen. Da die Rotation nicht gesteuert wird, erlebt jedes Fahrzeug eine andere Abfolge von Vorwärts-, Rückwärts- und Seitwärtsfahrten. Mack Rides aus dem deutschen Waldkirch ist der führende Hersteller; ihre Modelle sind in Phantasialand, Efteling und Alton Towers zu finden. Spinning Coaster gelten als hervorragende Familienbahnen — aufregend genug für Enthusiasten, aber ohne extreme Größenanforderungen.',
    relatedTermIds: ['mack-rides', 'launch-coaster', 'credit'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'Achterbahn mit mehr als 61 m Höhe — ohne Inversionen, dafür mit Fokus auf Geschwindigkeit und Airtime.',
    definition:
      'Hyper Coaster ist die Klassifikation für Achterbahnen zwischen 61 und 91 m Höhe. B&M nennt ihre Modelle "Hyper Coaster"; Intamin verwendet für vergleichbare Bahnen den Begriff "Mega Coaster". Beide Typen setzen auf ausgedehnte Airtime-Hügel bei hoher Geschwindigkeit statt auf Inversionen. Shambhala in PortAventura (Spanien) ist mit 76 m Europas höchster und schnellster Hyper Coaster. Weitere bekannte Beispiele: Goliath in Walibi Holland und Mako in SeaWorld Orlando.',
    relatedTermIds: ['giga-coaster', 'airtime', 'b-and-m', 'intamin', 'airtime-hill'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition: 'Achterbahn mit mehr als 91 m Höhe — eine Stufe über dem Hyper Coaster.',
    definition:
      'Giga Coaster ist die Klassifikation für Achterbahnen zwischen 91 und 121 m Höhe. Der Begriff wurde 2000 von Cedar Fair und Intamin für Millennium Force in Cedar Point geprägt. Giga Coaster betonen extreme Höhe, lange Layouts und massive Airtime-Momente. Fury 325 in Carowinds gilt vielen Enthusiasten als der beste Stahlcoaster der Welt. In Europa gibt es Stand 2025 noch keinen echten Giga Coaster; Hyperion in Energylandia (Polen) mit 77 m fällt technisch noch in die Hyper-Kategorie.',
    relatedTermIds: ['hyper-coaster', 'airtime', 'first-drop'],
  },
  {
    id: 'overbank',
    name: 'Übergeneigte Kurve',
    shortDefinition:
      'Kurve, bei der die Schiene über 90° geneigt ist — die Fahrgäste werden kurzzeitig über die Senkrechte hinaus gekippt.',
    definition:
      'Eine übergeneigte Kurve (englisch: Overbanked Turn) ist eine Kurve mit einer Querneigung von mehr als 90 Grad — die äußere Schiene liegt dabei höher als die Senkrechte, sodass die Fahrgäste kurzzeitig über die Kopf-über-Position hinaus geneigt werden, ohne eine vollständige Inversion zu durchfahren. Das Element erzeugt eine ungewöhnliche Mischung aus Seitenkräften und leicht negativen G-Kräften. Übergeneigte Kurven sind charakteristisch für moderne B&M-Hyper und Intamin-Mega Coaster sowie allgegenwärtig auf RMC-Layouts. Sie werden manchmal mit Inversionen verwechselt, da sie von außen dramatisch wirken.',
    relatedTermIds: ['inversion', 'airtime', 'b-and-m', 'rmc', 'intamin'],
  },
  {
    id: 'trim-brake',
    name: 'Trim-Bremse',
    shortDefinition:
      'Eine Magnetbremse im Streckenverlauf, die den Zug abbremst, ohne ihn vollständig anzuhalten.',
    definition:
      'Eine Trim-Bremse ist ein Bremssystem, das an einem bestimmten Punkt einer Achterbahn platziert wird, um die Geschwindigkeit des Zuges zu reduzieren — jedoch ohne ihn wie eine Blockbremse vollständig zu stoppen. Trim-Bremsen werden eingesetzt, um G-Kräfte im weiteren Streckenverlauf zu begrenzen, Verschleiß zu reduzieren oder Sicherheitsanforderungen zu erfüllen. Unter Achterbahn-Enthusiasten sind Trim-Bremsen oft umstritten, da sie das Fahrerlebnis spürbar abschwächen können — Airtime-Hügel wirken weniger intensiv, wenn der Zug vor ihnen abgebremst wird. Ob Trims aktiv sind, kann je nach Saison, Witterung und Beladung variieren.',
    relatedTermIds: ['block-brake', 'brake-run', 'airtime'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      'Wenn ein Launch-Coaster den höchsten Punkt nicht erreicht und rückwärts auf die Abschussbahn rollt.',
    definition:
      'Ein Rollback tritt auf, wenn ein gestarteter Zug nicht genug Geschwindigkeit aufgebaut hat, um den höchsten Punkt der Strecke zu überwinden, und daraufhin rückwärts durch die Schwerkraft auf die Abschussposition zurückrollt. Bei hydraulischen Launch Coastern (Top Thrill Dragster, Stealth) passiert dies, wenn der Abschussmechanismus nicht die volle Kraft liefert. Am Tiefpunkt fangen Magnetbremsen den Zug sicher auf. Rollbacks sind selten, aber ein bekanntes Merkmal hydraulischer Launch Coaster. Die Fahrgäste kommen nicht zu Schaden — der Zug wird sicher gestoppt —, aber die Fahrt wird unterbrochen.',
    relatedTermIds: ['launch-coaster', 'block-brake', 'downtime'],
  },
  {
    id: 'animatronics',
    name: 'Animatronic',
    shortDefinition:
      'Elektromechanische Roboterfiguren in Themenfahrten und Shows, die Charaktere oder Szenen lebendig wirken lassen.',
    definition:
      'Animatronics (Singular: Animatronic, auch Animatronik) sind elektromechanische Roboterfiguren, die in Themenfahrten und Live-Shows eingesetzt werden, um Charaktere oder Szenenbewohner realistisch darzustellen. Disney prägte den Begriff "Audio-Animatronics" 1964 auf der Weltausstellung. Moderne Animatronics reichen von einfachen Zyklus-Figuren bis zu hochentwickelten Servo- und Pneumatik-Robotern mit komplexen Gesichtsausdrücken und ganzkörperlichen Bewegungsabläufen. Der Schamane in Disneys Pandora – The World of Avatar und die Dinosaurier der Jurassic World-Fahrt bei Universal sind Meilensteine der Technik.',
    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Eine Themenfahrt ohne feste Schiene — die Fahrzeuge navigieren frei durch den Raum, geführt von in den Boden eingelassener Technologie.',
    definition:
      "Eine Trackless Ride (schienenlose Themenfahrt) ist eine Dark-Ride-Variante, bei der die Fahrzeuge nicht an eine feste Schiene gebunden sind, sondern autonom durch den Attractionsraum navigieren — geführt durch Induktionsschleifen, WLAN oder Lasertechnik im Boden. Die freie Beweglichkeit ermöglicht wesentlich komplexere Szenengestaltung und nichtlineare Narrative: Fahrzeuge können drehen, kreisen und Szenen aus verschiedenen Winkeln anfahren. Bekannte Beispiele: Star Wars: Rise of the Resistance (Disney), Ratatouille: L'Aventure Totalement Toquée de Rémy (Disneyland Paris) und Symbolica (Efteling, Niederlande).",
    relatedTermIds: ['dark-ride', 'animatronics', 'themed-land'],
  },
];

export default translations;
