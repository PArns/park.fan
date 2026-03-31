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
    aliases: ['Wartezeiten', 'Queue Time', 'Queue Times'],
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'Eine separate Warteschlangenspur für Besucher, die bereit sind, allein zu fahren, um freie Plätze zu füllen.',
    definition:
      'Einzelfahrer-Warteschlangen ermöglichen es Besuchern, die bereit sind, allein (oder getrennt von ihrer Gruppe) zu fahren, freie Plätze in Fahrzeugserien zu belegen. Da Einzelfahrer in Lücken eingeschoben werden, bewegt sich die Warteschlange deutlich schneller als die normale Reihe — oft 50–70 % kürzere Wartezeiten. Nicht alle Attraktionen bieten Einzelfahrerzugang an.',
    aliases: ['Single Rider', 'Single Rider Lane'],

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
    aliases: ['Flash Pass', 'Express Pass'],

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
    aliases: ['Crowd-Level', 'Crowd-Levels', 'Besucherdichten', 'Besucherandrang'],
  },
  {
    id: 'crowd-calendar',
    name: 'Besucherkalender',
    shortDefinition:
      'Eine tagesweise Vorschau mit vorhergesagten Besucherdichten, um den Besuch zu planen.',
    definition:
      'Ein Besucherkalender ist ein Monats- oder Jahreskalender, der vorhergesagte Besucherdichten für jeden Tag zeigt. park.fan erstellt Besucherkalender mit KI-Modellen, die auf jahrelangen historischen Wartezeitdaten, kombinierten Schulferienkalendern, bevorstehenden Veranstaltungen und saisonalen Trends trainiert wurden. Grüne Tage zeigen niedrige Besucherzahlen an; orange und rote Tage zeigen hohe Besucherzahlen an.',
    relatedTermIds: ['crowd-level', 'peak-day', 'rope-drop'],
    aliases: ['Crowd-Kalender', 'Besucherkalender'],
  },
  {
    id: 'peak-day',
    name: 'Spitzentag',
    shortDefinition:
      'Ein Tag mit maximalen Besucherzahlen, typischerweise während Feiertagen oder Sonderveranstaltungen.',
    definition:
      'Ein Spitzentag ist jeder Tag, an dem die Besucherzahlen auf oder nahe der maximalen Kapazität eines Parks sind. Häufige Spitzentage sind große gesetzliche Feiertage (Weihnachten, Ostern, Sommerferien), Sonderveranstaltungstage (Halloween-Nächte, Feuerwerke) und Schulferienwochen. park.fan hebt Spitzentage im Besucherkalender hervor, damit du sie gezielt einplanst oder meidest.',
    aliases: ['Spitzentage', 'Stoßzeiten', 'Hochbetrieb'],

    relatedTermIds: ['crowd-level', 'crowd-calendar', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Renovierung',
    shortDefinition:
      'Eine geplante Schließungszeit, in der eine Attraktion oder ein Bereich gewartet oder modernisiert wird.',
    definition:
      'Eine Renovierung (von Enthusiasten oft als "Rehab" abgekürzt) ist ein geplanter Wartungs- oder Renovierungszeitraum, in dem eine Attraktion, eine Show oder ein Parkbereich vorübergehend geschlossen ist. Renovierungen können von einigen Tagen bis zu mehreren Monaten dauern und werden in der Regel für die Nebensaison geplant. park.fan markiert Attraktionen, die derzeit renoviert werden.',
    aliases: ['Revisions', 'Rehab', 'Wartungsschließung'],

    relatedTermIds: ['downtime', 'ride-capacity'],
  },
  {
    id: 'downtime',
    name: 'Betriebsstörung',
    shortDefinition:
      'Eine ungeplante, vorübergehende Schließung einer Attraktion aufgrund eines technischen Defekts oder Sicherheitsprüfung.',
    definition:
      'Eine Betriebsstörung bezeichnet die ungeplante, vorübergehende Schließung einer Attraktion — im Gegensatz zur geplanten Renovierung. Ursachen sind technische Defekte, Sicherheitsüberprüfungen, Vorfälle mit Besuchern oder schlechtes Wetter. Die meisten Störungen dauern wenige Minuten bis einige Stunden. park.fan zeigt den aktuellen Betriebsstatus jeder Attraktion in Echtzeit an und unterscheidet zwischen "In Betrieb", "Störung", "Geschlossen" und "Renovierung".',
    aliases: ['Betriebsstörung', 'Außer Betrieb', 'Technische Störung'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'wait-time'],
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
    aliases: ['Rope Drop'],

    relatedTermIds: ['crowd-calendar', 'wait-time', 'early-entry'],
  },
  {
    id: 'early-entry',
    name: 'Früheinlass',
    shortDefinition:
      'Ein exklusiver Vorteil für Hotelgäste, der den Parkeintritt vor der regulären Öffnung erlaubt.',
    definition:
      'Früheinlass (auch "Extra Zauberzeit" bei Disney oder "Early Park Entry") ist ein Vorteil, der Gästen von Partnerhotels oder bestimmten Ticketkategorien ermöglicht, den Park eine halbe bis eine Stunde früher zu betreten. In dieser Zeit sind die Warteschlangen deutlich kürzer, da der Großteil der Besucher noch nicht eingelassen wird. Besonders an Spitzentagen ist der Früheinlass eine der wirkungsvollsten Strategien, um beliebte Attraktionen ohne langes Warten zu erleben.',
    aliases: ['Früheinlass', 'Extra Magic Hours', 'Magic Hours'],

    relatedTermIds: ['rope-drop', 'express-pass', 'peak-day'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'Ein Ticket-Upgrade, das den Besuch mehrerer Parks desselben Betreibers an einem Tag ermöglicht.',
    definition:
      'Ein Park-Hopper-Ticket erlaubt es, an einem Tag zwischen zwei oder mehr Parks desselben Betreibers zu wechseln. Disney bietet etwa den klassischen Park Hopper an, mit dem man täglich zwischen Magic Kingdom, EPCOT, Hollywood Studios und Animal Kingdom wechseln kann. Das Upgrade kostet mehr als ein einfaches Tagesticket, lohnt sich aber bei kurzen Aufenthalten oder wenn begehrte Attraktionen über mehrere Parks verteilt sind.',
    aliases: ['Park Hopper', 'Park Hopping'],

    relatedTermIds: ['season-pass', 'rope-drop', 'crowd-calendar'],
  },
  {
    id: 'season-pass',
    name: 'Jahrespass',
    shortDefinition: 'Ein Ticket, das unbegrenzte Parkbesuche innerhalb eines Jahres ermöglicht.',
    definition:
      'Ein Jahrespass (auch Saisonkarte oder Annual Pass) gewährt unbegrenzte Eintritte in einen oder mehrere Parks über einen Zeitraum von üblicherweise zwölf Monaten. Viele Jahrespässe enthalten Zusatzleistungen wie Rabatte auf Gastronomie, Merchandise oder Parken. Je nach Stufe können Sperrdaten (Blockout-Dates) an Spitzentagen gelten. Für regelmäßige Besucher — mehr als drei bis vier Mal jährlich — rechnet sich ein Jahrespass in der Regel gegenüber Einzeltickets.',
    aliases: ['Annual Pass', 'Season Pass', 'Jahrespass', 'Jahreskarte'],

    relatedTermIds: ['park-hopper', 'peak-day', 'express-pass'],
  },
  {
    id: 'height-requirement',
    name: 'Mindestgröße',
    shortDefinition:
      'Eine Mindestkörpergröße, die Besucher erfüllen müssen, um eine bestimmte Attraktion nutzen zu dürfen.',
    definition:
      'Die Mindestgröße ist eine Sicherheitsanforderung, die Parks für bestimmte Attraktionen festlegen. Sie stellt sicher, dass Sicherheitsgurte und Rückhaltesysteme korrekt sitzen. Typische Mindestgrößen liegen zwischen 90 und 140 cm. Einige Attraktionen haben auch eine maximale Größe oder ein Gewichtslimit. Bei Familienbesuchen empfiehlt es sich, die Mindestgrößen vorab zu prüfen, um Enttäuschungen vor Ort zu vermeiden.',
    aliases: ['Mindestgröße', 'Mindestgrößen', 'Körpergrößenanforderung'],

    relatedTermIds: ['ride-capacity', 'refurbishment'],
  },
  {
    id: 'themed-land',
    name: 'Themenbereich',
    shortDefinition:
      'Ein eigenständig gestalteter Bereich innerhalb eines Freizeitparks mit durchgehendem Thema.',
    definition:
      'Ein Themenbereich (englisch: Themed Land) ist eine abgegrenzte Zone innerhalb eines Freizeitparks, die ein einheitliches Design, eine Hintergrundgeschichte (Storyline) und passende Attraktionen, Gastronomie und Shops vereint. Bekannte Beispiele sind Hogsmeade in den Universal-Parks, Fantasyland in Disney-Parks oder Scandinavica in Europa-Park. Theemenbereiche sorgen für ein immersives Erlebnis und leiten Besucher durch den Park.',
    aliases: ['Themenbereich', 'Themenzone', 'Bereich'],

    relatedTermIds: ['ride-capacity', 'refurbishment', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      'Die inoffizielle, vorzeitige Öffnung einer Attraktion vor dem offiziellen Eröffnungsdatum.',
    definition:
      'Ein Soft Opening bezeichnet die vorzeitige, inoffizielle Öffnung einer neuen Attraktion oder eines Themenbereichs — oft ohne jede Ankündigung. Parks nutzen Soft Openings, um Systeme unter echten Besucherbedingungen zu testen und Kapazitätsprobleme zu identifizieren. In der Freizeitpark-Community wird der Begriff unverändert auf Englisch verwendet. Da Soft Openings jederzeit unterbrochen werden können, sind sie ein Bonus für glückliche Besucher — aber keine verlässliche Planungsgrundlage. Fan-Foren und Social Media berichten üblicherweise als erste davon.',
    aliases: ['Soft Launch', 'Soft Opening'],

    relatedTermIds: ['refurbishment', 'downtime', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby',
    shortDefinition:
      'Die normale Warteschlange einer Attraktion, ohne Reservierung oder besonderes Ticket.',
    definition:
      'Die Standby-Warteschlange ist die reguläre physische Warteschlange, die alle Besucher ohne zusätzliches Ticket oder Upgrade nutzen können. Wer in der Standby-Schlange steht, wartet in der Reihenfolge des Eintreffens — die angezeigte Wartezeit spiegelt direkt die aktuelle Auslastung der Attraktion wider. An vollen Tagen können Standby-Zeiten bei Hauptattraktionen 90 Minuten und mehr erreichen. park.fan verfolgt Standby-Wartezeiten in Echtzeit, damit du jederzeit die kürzeste Schlange findest.',
    aliases: ['Standby', 'Normale Warteschlange', 'Reguläre Warteschlange'],

    relatedTermIds: ['wait-time', 'single-rider', 'virtual-queue', 'express-pass'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      'Disneys kostenpflichtiges Vorrangwarteschlangen-System als Nachfolger des früheren FastPass+-Programms.',
    definition:
      'Lightning Lane ist Disneys Bezeichnung für sein Priority-Queue-System, das 2021 als Nachfolger des kostenlosen FastPass+-Programms eingeführt wurde. Es gibt zwei Varianten: Individual Lightning Lane (ILL) für die gefragtesten Attraktionen, die separat erworben werden muss, und Lightning Lane Multi Pass (LLMP), ein tägliches Abo, das Rückkehrzeitfenster für eine Auswahl an Attraktionen ermöglicht. Da Lightning Lane ein vormals kostenloses Angebot in ein kostenpflichtiges umgewandelt hat, wird es in der Community kontrovers diskutiert. Der Besucherkalender von park.fan hilft dir einzuschätzen, an welchen Tagen Lightning Lane den Preis wert ist.',
    aliases: ['LLMP', 'ILL', 'Lightning Lane Multi Pass', 'Individual Lightning Lane'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      'Disneys ehemaliges tägliches Zusatzabo für Lightning-Lane-Zugang zu den meisten Attraktionen.',
    definition:
      'Genie+ (heute umbenannt in Lightning Lane Multi Pass) war Disneys kostenpflichtiges Tages-Add-on, das FastPass+ ersetzte. Für eine personenbezogene Tagesgebühr konnten Gäste jeweils ein Lightning-Lane-Rückkehrzeitfenster für eine breite Auswahl an Attraktionen buchen. Die begehrtesten Highlights wurden als Individual Lightning Lane separat verkauft. Der Preis von Genie+ war dynamisch und stieg an den besucherstärksten Tagen. park.fan zeigt dir die aktuellen Besucherdichten, damit du entscheiden kannst, ob sich das Zusatzabo lohnt.',
    aliases: ['Genie Plus', 'Disney Genie'],

    relatedTermIds: ['lightning-lane', 'express-pass', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      'Eine nummerierte Zuteilung im virtuellen Warteschlangensystem, die den Zugang zu einer Attraktion bei Aufruf ermöglicht.',
    definition:
      'Eine Boarding Group ist eine nummerierte Zuteilung innerhalb eines virtuellen Warteschlangensystems, das vor allem bei den begehrtesten neuen Attraktionen eingesetzt wird. Besucher melden sich über die Park-App an — oft direkt bei Parköffnung — und erhalten eine Gruppennummer. Wird diese Nummer aufgerufen, haben sie ein begrenztes Zeitfenster, um zur Attraktion zu kommen. An besonders vollen Tagen sind alle Boarding Groups innerhalb von Minuten vergeben. Disneys System bei Attraktionen wie Tron Lightcycle Run oder Star Wars: Rise of the Resistance hat den Begriff in der gesamten Freizeitpark-Community bekannt gemacht.',
    aliases: ['Boarding Groups', 'Boarding Group'],

    relatedTermIds: ['virtual-queue', 'wait-time', 'lightning-lane'],
  },
  {
    id: 'off-peak',
    name: 'Nebensaison',
    shortDefinition:
      'Zeiträume mit geringerer Besucherauslastung, kürzeren Wartezeiten und günstigeren Preisen.',
    definition:
      'Als Nebensaison gelten die ruhigeren Perioden im Kalender, in denen Schule ist und keine großen Feiertage fallen — typischerweise Januar bis Anfang Februar, Mitte September bis Oktober (außerhalb von Halloween-Events) und die ersten Novemberwochen. In der Nebensaison sind Wartezeiten für beliebte Attraktionen oft deutlich kürzer, Ticketpreise häufig am günstigsten und der Park spürbar entspannter. Für Besucher mit flexiblem Zeitplan ist der Besuch in der Nebensaison eine der wirkungsvollsten Strategien. Der Besucherkalender von park.fan markiert Nebensaison-Fenster, damit du deinen Besuch optimal planen kannst.',
    aliases: ['Ruhige Zeiten', 'Schwache Saison'],

    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
  },
  {
    id: 'offseason',
    name: 'OffSeason',
    shortDefinition:
      'Saisonale Schließungsperiode, in der der Park für Wartungsarbeiten, Umbauten oder die Winterpause vollständig geschlossen und nicht für Besucher zugänglich ist.',
    definition:
      'Die OffSeason bezeichnet den Zeitraum, in dem ein Freizeitpark seine Tore vollständig schließt — nicht bloß eine ruhigere Besuchsphase, sondern eine echte Betriebspause. Parks nutzen dieses Fenster für notwendige Wartungsarbeiten an Attraktionen und Anlagen, umfangreichere Umbauten, die während des laufenden Betriebs nicht möglich wären, sowie zur Erholung des Personals vor der neuen Saison. OffSeason-Schließungen finden am häufigsten in den Wintermonaten statt und dauern je nach Park und Klima einige Wochen bis mehrere Monate. In dieser Zeit sind keinerlei Attraktionen, Restaurants oder Shows zugänglich.\n\nZeigt park.fan den Status OffSeason für einen Park an, bedeutet das: Für den aktuellen Zeitraum liegt kein Öffnungsplan vor und das nächste bestätigte Öffnungsdatum liegt noch einige Wochen entfernt. Prüfe die offizielle Park-Website für das genaue Wiedereröffnungsdatum — beliebte Parks verkaufen die ersten Tage nach der OffSeason erfahrungsgemäß schnell aus.',
    aliases: ['Off-Season', 'Wintersaison', 'Saisonende'],

    relatedTermIds: ['refurbishment', 'soft-opening', 'crowd-calendar'],
  },
  {
    id: 'ride-photo',
    name: 'Fahrfoto',
    shortDefinition:
      'Automatisch aufgenommenes Foto oder Video der Besucher während einer Attraktion, das nach der Fahrt käuflich erworben werden kann.',
    definition:
      'Das Fahrfoto ist ein automatisch von einer fest installierten Kamera aufgenommenes Bild — typischerweise an einem dramatischen Punkt wie dem Abfall einer Wasserbahn oder dem Scheitelpunkt einer Achterbahn. Nach der Fahrt können Besucher ihr Foto an Kiosks oder in der Park-App einsehen und entscheiden, ob sie es kaufen möchten. Viele Parks bieten Foto-Tagespakete an, die unbegrenzte Fahrfotos aller Attraktionen einschließen. Das Fahrfoto ist ein beliebtes Souvenir und ein klassischer Social-Media-Moment.',
    aliases: ['Fahrfoto', 'On-Ride-Foto', 'Onride-Foto'],

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
    aliases: ['Warteschlangen', 'Schlange', 'Schlangen', 'Warteschlange'],
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
    aliases: ['Child Swap', 'Rider Switch'],

    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Sperrtag',
    shortDefinition:
      'Ein Kalendertag, an dem bestimmte Jahrespass-Stufen nicht für den Parkeintritt gültig sind — meist an Spitzentagen.',
    definition:
      'Ein Sperrtag (englisch: Blockout Date oder Blackout Date) ist ein bestimmter Kalendertag, an dem Jahrespässe niedrigerer Stufen nicht eingelöst werden können. Parks setzen Sperrtage ein, um die Besucherzahlen an den stärksten Tagen zu steuern. Hochwertige Pässe haben wenige oder keine Sperrtage; günstige Einsteigerpässe können an 30–60 Tagen pro Jahr gesperrt sein. Vor dem Besuch unbedingt den Sperrtagkalender prüfen. Der Besucherkalender von park.fan hebt typische Spitzentage hervor, damit du deine Jahrespass-Stufe entsprechend planen kannst.',
    aliases: ['Sperrtage', 'Blackout-Tage', 'Blackout-Datum'],

    relatedTermIds: ['season-pass', 'peak-day', 'crowd-calendar'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Sonderveranstaltung',
    shortDefinition:
      'Ein separat ticketpflichtiges Abendevent — wie Halloween- oder Weihnachtspartys — das über den normalen Tageseintritt hinausgeht.',
    definition:
      "Eine Sonderveranstaltung (englisch: Hard Ticket Event) ist ein separat buchbares Abend-Event mit eigenem Eintrittsticket. Diese Events bieten exklusive Unterhaltung, thematische Dekorationen und Erlebnisse, die beim regulären Parkbesuch nicht verfügbar sind. Bekannte Beispiele sind Halloween Horror Nights bei Universal, Mickey's Not-So-Scary Halloween Party in Walt Disney World, die Weihnachtsgala im Europa-Park oder die Halloween-Events in Phantasialand. An Sonderveranstaltungstagen werden reguläre Tagesbesucher oft ab 17–18 Uhr gebeten, den Park zu verlassen. Tickets sind meist Wochen im Voraus ausverkauft.",
    aliases: ['Sonderveranstaltung', 'Halloween-Party', 'After-Hours-Event'],

    relatedTermIds: ['season-pass', 'peak-day', 'early-entry'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      'Disneys ehemaliges kostenloses Vorrang-Warteschlangen-System, das 2021 durch das kostenpflichtige Lightning Lane ersetzt wurde.',
    definition:
      'FastPass+ (ursprünglich FastPass, eingeführt 1999) war Disneys kostenloses Priority-Queue-System. In Walt Disney World konnten Gäste täglich bis zu drei FastPass+-Reservierungen über die My Disney Experience App buchen und damit Rückkehrzeitfenster für Attraktionen kostenlos sichern. Nach der COVID-19-Schließung 2020 wurde das System nicht reaktiviert und Ende 2021 durch das kostenpflichtige Lightning Lane ersetzt. FastPass+ ist bis heute eines der meistdiskutierten Themen in der Disney-Community, da es ein zuvor kostenloses Angebot in ein bezahltes umwandelte. Wer ältere Reiseberichte liest, stößt häufig auf den Begriff.',
    aliases: ['FastPass+', 'FastPass Plus'],

    relatedTermIds: ['lightning-lane', 'genie-plus', 'express-pass', 'return-time'],
  },
  {
    id: 'dark-ride',
    name: 'Dark Ride',
    shortDefinition:
      'Eine Indoor-Attraktion, bei der Besucher in geführten Fahrzeugen durch thematisch gestaltete Szenen fahren.',
    definition:
      "Ein Dark Ride ist eine Indoor-Attraktion, bei der Besucher in Fahrzeugen — Waggons, Booten oder Gondeln auf einem festen Schienensystem — durch thematisch gestaltete Szenen fahren. Das 'Dunkle' bezieht sich auf die gesteuerte Lichtumgebung, die Animatronics, Projektionen und Kulissen wirkungsvoll inszeniert. In der Freizeitpark-Community wird der Begriff 'Dark Ride' durchgängig auf Englisch verwendet. Dark Rides reichen von sanften Familienerlebnissen ('it's a small world') bis zu intensiven Erzählattraktionen (Star Wars: Rise of the Resistance). Trackless Dark Rides bewegen sich ohne feste Schiene frei im Raum und ermöglichen dynamischere Szenengestaltung. Dark Rides gehören zu den kapazitätsstärksten und beliebtesten Attraktionen.",
    aliases: ['Dark Ride', 'Dark Rides', 'Indoor-Attraktion', 'Innenfahrt'],

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
    aliases: ['Rückkehrzeiten', 'Returntime', 'Returntimes'],
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
    aliases: ['Looping', 'Loop', 'Vertikaler Loop'],

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
    aliases: ['LSM Coaster', 'LIM Coaster', 'Katapultbahn', 'Launcher'],

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
    aliases: ['Holzachterbahnen', 'Holzbahn', 'Woodie', 'Woodies'],
  },
  {
    id: 'steel-coaster',
    name: 'Stahlachterbahn',
    shortDefinition:
      'Eine Achterbahn mit Stahlschiene und Stahlstruktur, bekannt für ihre glatte und präzise Fahrt.',
    definition:
      'Eine Stahlachterbahn wird mit Stahlschiene und Stahlstützgerüst gebaut. Anders als Holzachterbahnen mit ihrer natürlichen Flexibilität bietet Stahl Ingenieuren präzise Kontrolle über G-Kräfte, Übergänge und Inversionen. Die glatte, vorhersagbare Fahrt einer Stahlachterbahn ermöglicht komplexe Layouts mit mehreren Inversionen, engen Kurvenradien und hohen Geschwindigkeiten.\n\nStahlachterbahnen dominieren die moderne Achterbahnentwicklung, weil Designer damit fast jede Form verwirklichen können — Überkopf-Drops, vollständige Inversionen und schnelle Richtungswechsel. Berühmte Stahlachterbahnen in Europa sind Shambhala in PortAventura, Nemesis in Alton Towers und Silver Star im Europa-Park. Stahlachterbahnen reichen von kleinen Familienbahnen bis zu Rekord-Mega-Coastern. Die Präzision von Stahl erfordert regelmäßige Kontrolle und Wartung, ist aber weniger fehleranfällig als die flexible Holzkonstruktion.',
    relatedTermIds: ['wooden-coaster', 'inversion', 'launch-coaster', 'hyper-coaster'],
    aliases: ['Stahlachterbahnen', 'Stahlschiene', 'Stahlbahn'],
  },
  {
    id: 'suspended-coaster',
    name: 'Suspended Coaster',
    shortDefinition:
      'Eine Achterbahn, bei der die Wagen unter der Schiene an einem Pivot hängen und seitlich frei schwingen können.',
    definition:
      'Eine Suspended Coaster ist ein spezieller Achterbahntyp, bei dem der Zug von oben an einem Pivot aufgehängt ist und seitlich unabhängig von der Schienenbahn schwingen kann. Während der Zug durch Kurven navigiert, schwingt er wie ein Pendel — eine Bewegung, die die charakteristische "Whip"-Sensation erzeugt. Diese Schwingbewegung unterscheidet sich von einer Inverted Coaster, wo der Zug starr an der Schiene befestigt ist.\n\nSuspended Coasters sind seltener als Inverted Coasters, bieten aber ein einzigartiges Erlebnis. Die Schwingbewegung macht selbst moderate Kurven dramatisch wirken, und das Gefühl des Fliegens erzeugt eine spannende Exposition. Vekoma entwickelte in den 1990er Jahren die Suspended Looping Coaster (SLC), von denen weltweit hunderte gebaut wurden. Die Schwingbewegung kann chaotisch wirken im Vergleich zur Präzision moderner Inversionen — manche Enthusiasten lieben sie für ihre rohe, unvorhersagbare Natur, während andere sie weniger mochten.',
    relatedTermIds: ['inverted-coaster', 'b-and-m', 'vekoma'],
    aliases: ['Suspended', 'Hängende Achterbahn'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Hybrid Coaster',
    shortDefinition:
      'Eine Achterbahn, die eine klassische Holzkonstruktion mit einer präzisen Stahlschiene (I-Box) kombiniert — Pionierarbeit von Rocky Mountain Construction (RMC).',
    definition:
      'Ein Hybrid Coaster verbindet die Holzstruktur einer traditionellen Achterbahn mit einer Stahl-I-Box-Schiene von Rocky Mountain Construction (RMC). Die I-Box-Schiene ist extrem präzise und ermöglicht Inversionen, die auf traditionellen Holzbahnen unmöglich wären. RMC entwickelte diese Technologie primär zur Sanierung alter Holzachterbahnen — Inversionen, steilere Abfälle und Airtime-Hügel werden in Layouts eingefügt, die zuvor zu rau zum Genießen waren. Berühmte RMC-Hybrids: Steel Vengeance in Cedar Point, Untamed in Walibi Holland und Wildfire im Kolmården Zoo. Das Ergebnis sind oft die bestbewerteten Achterbahnen der Welt.',
    aliases: ['Hybrid', 'I-Box Coaster', 'RMC Hybrid', 'Hybrid-Achterbahn'],

    relatedTermIds: ['wooden-coaster', 'rmc', 'airtime'],
  },
  {
    id: 'b-and-m',
    name: 'B&M',
    shortDefinition:
      'Bolliger & Mabillard, ein Schweizer Achterbahn-Hersteller, bekannt für ruhige, zuverlässige Bahnen und Signature-Elemente wie Immelmann, Cobra Roll und Zero-G Roll.',
    definition:
      'B&M (Bolliger & Mabillard) ist ein Schweizer Achterbahn-Hersteller, 1988 von Walter Bolliger und Claude Mabillard gegründet. Das Unternehmen ist für außergewöhnlich ruhige, zuverlässige Bahnen mit einem charakteristischen Fahrerlebnis bekannt: starke positive G-Kräfte, Signature-Inversionen (Immelmann, Cobra Roll, Zero-G Roll) und hoher Durchsatz. B&M spezialisiert sich auf Inverted Coaster, Sit-Down-Looper, Hypercoaster (über 61 m), Gigacoaster (über 91 m), Wing Coaster und Dive Machines. Nahezu jeder große europäische Park beherbergt mindestens eine B&M-Anlage: Shambhala und Dragon Khan in PortAventura, Silver Star im Europa-Park, Nemesis in Alton Towers.',
    aliases: ['Bolliger & Mabillard', 'Bolliger and Mabillard'],

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
    aliases: ['Mack'],

    relatedTermIds: ['stengel-dive', 'b-and-m', 'intamin', 'launch-coaster'],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      'Amerikanischer Hersteller, der das Hybrid-Coaster-Konzept mit dem I-Box-Stahlschienenverfahren für Holzachterbahnen erfunden hat — und damit die bestbewerteten Bahnen der Welt schafft.',
    definition:
      'Rocky Mountain Construction (RMC) ist ein amerikanischer Achterbahn-Hersteller aus Hayden, Idaho, bekannt für die Erfindung des I-Box-Stahlschienensystems für Holzstrukturen. Diese Technologie erlaubt Parks, alte rumpelige Holzachterbahnen in Weltklasse-Hybrid-Coaster zu verwandeln — mit intensivem Airtime, Inversionen und Überkopf-Abfällen. RMC-Konversionen wie Steel Vengeance (Cedar Point), Untamed (Walibi Holland) und Wildfire (Kolmården Zoo) gelten als die besten Achterbahnen ihrer jeweiligen Parks. In Europa ist RMCs neuer Hybrid-Bau Untamed in Walibi Holland weitgehend als eine der besten Bahnen des Kontinents anerkannt.',
    aliases: ['Rocky Mountain Construction'],

    relatedTermIds: ['hybrid-coaster', 'wooden-coaster', 'airtime'],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      'Niederländischer Achterbahn-Hersteller und einer der größten der Welt — bekannt für den allgegenwärtigen Boomerang sowie eine umfangreiche Palette an modernen Familien- und Thrill-Coasern in europäischen Parks.',
    definition:
      'Vekoma Rides Manufacturing ist ein niederländischer Achterbahn-Hersteller mit Sitz in Vlodrop und einer der weltweit produktivsten nach Gesamtanlagen. 1926 als Maschinenbauunternehmen gegründet, stieg Vekoma in den 1970er Jahren auf Freizeitattraktionen um. Weltweite Bekanntheit erlangte das Unternehmen mit dem Boomerang — einem kompakten Shuttle-Coaster mit drei Inversionen, der günstig lizenziert und rund um den Globus aufgestellt wurde. Weitere ikonische Modelle sind der Suspended Looping Coaster (SLC), der Giant Inverted Boomerang und der Mine Train. Ab den 2010er Jahren erfand sich Vekoma mit einer modernen „New Generation"-Produktlinie neu: sanftere Fahrsysteme, innovative Layouts und verbesserte Familienattraktionen. Neue Modelle wie der Family Boomerang, der Tilt Coaster und hängende Familiencoaster tauchen zunehmend in europäischen Parks auf. Auch Disney hat maßgeschneiderte Vekoma-Anlagen für seine Resorts in Auftrag gegeben.',
    aliases: ['Vekoma Rides'],

    relatedTermIds: ['boomerang', 'b-and-m', 'intamin', 'gerstlauer'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Deutscher Hersteller, vor allem bekannt für den Euro-Fighter mit seinem über-vertikalen Abfall sowie für Spinning Coaster und kompakte Familienbahnen.',
    definition:
      'Gerstlauer Amusement Rides GmbH ist ein deutscher Achterbahn-Hersteller aus Münsterhausen in Bayern. 1946 als metallverarbeitendes Unternehmen gegründet, stieg es in den 1980er Jahren in den Attraktionsmarkt ein und baute seinen Ruf mit dem Euro-Fighter-Modell aus — einem kompakten Elektro-Launch-Coaster mit berühmtem 97-Grad-Abfall über die Vertikale. Euro-Fighter lassen sich auf engem Raum installieren und sind damit attraktiv für Stadtparks und kleinere Veranstaltungsorte; Beispiele sind Rage im Adventure Island und Speed im Oakwood. Gerstlauer produziert außerdem das Infinity-Coaster-Modell, Spinning Coaster und den SkyRoller, bei dem die Fahrgäste ihr eigenes Drehen steuern können. In der Enthusiasten-Szene werden Gerstlauer-Bahnen für ihre Intensität auf kleinem Footprint geschätzt.',
    aliases: ['Gerstlauer Rides'],

    relatedTermIds: [
      'euro-fighter',
      'spinning-coaster',
      'xtreme-spinning-coaster',
      'b-and-m',
      'intamin',
    ],
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
    aliases: ['Lift Hill', 'Chain Lift', 'Kettenlift', 'Aufzughügel'],

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
    name: 'Airtime Hill',
    shortDefinition:
      'Ein kuppelförmiges Element, das negative G-Kräfte erzeugt und die Fahrgäste aus dem Sitz hebt — das Herzstück jeder guten Hypercoaster-Strecke.',
    definition:
      'Ein Airtime-Hügel (englisch: Camelback) ist ein kurvenförmiger Auf-Ab-Abschnitt, der negative G-Kräfte erzeugt — das Gefühl zu schweben oder aus dem Sitz gehoben zu werden. Floater Airtime: sanfte negative G, weiches Schweben. Ejector Airtime: intensiv, der Schoßbügel ist das Einzige was den Fahrer hält. Stahlbahnen nutzen präzise geformte Parabelkurven für gleichmäßigen, vorhersehbaren Airtime; Holzbahnen liefern unberechenbares, raues Airtime durch Schienenflex. Airtime-Hügel gelten in Enthusiasten-Rankings als die wichtigsten Qualitätselemente und sind das charakteristische Merkmal von Hyper- und Gigacoastern.',
    aliases: ['Camelback', 'Camelback Hill', 'Airtime-Hügel'],

    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      'Ein kontinuierlicher Spiralabschnitt, bei dem die Strecke um eine Mittelachse wickelt und anhaltende Seitwärts-G-Kräfte erzeugt.',
    definition:
      'Eine Helix ist ein Streckenabschnitt, der kontinuierlich spiralförmig um eine Mittelachse verläuft — ähnlich wie eine Schraube, aber ohne Überschlag. Helices erzeugen anhaltende Seitwärts-G-Kräfte, die Fahrgäste in die Außenkurve drücken. Eine abwärts führende Helix beschleunigt den Zug beim Kurvenfahren; eine aufwärts führende verzögert ihn. Helices werden häufig am Ende einer Strecke eingesetzt, um die verbleibende kinetische Energie zu nutzen und gleichzeitig ein aufregendes Dreherlebnis zu liefern. Berühmte Helices: die unterirdische Abschlusshelix von Nemesis in Alton Towers und die Schlusshelix von Expedition GeForce in Holiday Park.',
    aliases: ['Helices', 'Spirale'],

    relatedTermIds: ['horseshoe', 'first-drop'],
  },
  {
    id: 'block-brake',
    name: 'Block Brake',
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
    name: 'Corkscrew',
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
    aliases: ['Credits', 'Cred', 'Creds'],

    relatedTermIds: ['pov', 'wooden-coaster', 'hybrid-coaster'],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      'Point-of-View-Aufnahme aus der Perspektive der ersten Reihe einer Achterbahn — das wichtigste Videoformat der Coaster-Enthusiasten-Community auf YouTube.',
    definition:
      'POV (Point of View) bezeichnet Onride-Videoaufnahmen aus der Perspektive eines Frontreihensitzers, typischerweise von einer am Zug befestigten Kamera. POV-Videos sind eines der populärsten Content-Formate in der Freizeitpark-Enthusiasten-Community und werden von Besuchern genutzt, um eine Achterbahn vor dem Parkbesuch virtuell zu erkunden. Parks produzieren manchmal offizielle POVs für Werbezwecke; häufiger werden sie von Gästen oder Medienvertretern aufgenommen. Ein gut produzierter POV zeigt jedes Element, jeden Abfall und jede Inversion in Reihenfolge. YouTube beherbergt zehntausende Coaster-POV-Videos. Der Begriff wird auch allgemein für Ich-Perspektive-Aufnahmen von Parkattraktionen verwendet.',
    aliases: ['Point of View', 'On-Ride POV', 'On-Ride Video'],

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
    aliases: ['Exclusive Ride Time', 'ERT'],

    relatedTermIds: ['hard-ticket-event', 'early-entry', 'rope-drop', 'credit'],
  },
  {
    id: 'touring-plan',
    name: 'Touringplan',
    shortDefinition:
      'Ein detaillierter, optimierter Besuchsplan für einen Freizeitparkbesuch, der die Abfolge der Attraktionen so ordnet, dass Wartezeiten minimiert und möglichst viele Fahrten erreicht werden.',
    definition:
      'Ein Touringplan ist eine vorbereitete Abfolge von Attraktionen, Mahlzeiten und Parkbewegungen, die darauf ausgelegt ist, die Gesamtwartezeit über den Tag zu minimieren. Effektive Touringpläne berücksichtigen Besuchermuster (welche Parkbereiche sich zuerst füllen), Attraktionskapazitäten, Schlangenverhalten, Showpläne und Wetter. Seiten wie TouringPlans.com (heute Thrill-Data) veröffentlichen detaillierte Pläne für große Parks. Die Live-Wartezeiten und der Besucherkalender von park.fan sind komplementäre Werkzeuge: Echtzeit-Wartezeiten ermöglichen spontane Anpassungen des Plans. An belebten Tagen kann ein guter Touringplan die Gesamtwartezeit um 30–50 % gegenüber einem spontanen Ansatz reduzieren.',
    aliases: ['Touring Plan', 'Besuchsplan', 'Parkplan'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'wait-time', 'early-entry'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      'Situation, bei der mehrere Züge in der Bremssektion aufeinander warten, weil das Be- und Entladen langsamer als der Fahrzyklus ist — reduziert die Kapazität und verlängert Wartezeiten.',
    definition:
      "Stacking (Aufstapeln) tritt auf, wenn der Be- und Entladevorgang einer Achterbahn langsamer als die Fahrtzykluszeit ist, sodass Züge in der Bremssektion auf die Freigabe der Station warten müssen. Statt einen Zug abzufertigen, wenn der vorherige zurückkommt, muss der Betreiber mehrere Züge in der Bremssektion halten — was die Bahn zwischen den Zügen kurz anhalten kann. Stacking reduziert die Kapazität direkt und verlängert die Wartezeiten. Häufige Ursachen: langsames Be- und Entladen (oft durch komplexe Rückhaltesysteme), Gepäckpflicht-Checks oder Personalmangel. Erfahrene Parkbesucher können während des Wartens beobachten, ob eine Bahn 'stackt', und dies in ihre Entscheidungen einbeziehen.",
    aliases: ['Train Stacking'],

    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      'Achterbahntyp, bei dem der Zug unter der Schiene hängt und die Beine der Fahrgäste frei in der Luft baumeln.',
    definition:
      'Ein Inverted Coaster (auch Invert) ist eine Achterbahn, bei der der Zug starr unterhalb der Schiene befestigt ist — anders als ein Swinging Coaster, der sich seitlich bewegen kann. Die Fahrgäste sitzen mit frei hängenden Beinen über dem Zug. B&M entwickelte das moderne Inverted-Konzept 1992 mit Batman The Ride und ist bis heute der dominierende Hersteller. Inverted Coasters sind bekannt für intensive Head-Chopper-Nahbegegnungen, Zero-G Rolls und Cobra Rolls. Bekannte europäische Beispiele: Nemesis (Alton Towers), Katun (Mirabilandia), Oziris (Parc Astérix) und Banshee (Kings Island).',
    aliases: ['Inverted', 'Invert', 'Hängebahn', 'Inverted Coaster'],

    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'Achterbahntyp mit seitlich an der Schiene platzierten Sitzen — über, unter und neben den Fahrgästen ist nichts als Luft.',
    definition:
      'Ein Wing Coaster (auch Wing Rider) platziert jeweils zwei Sitze links und rechts neben der Schiene, sodass die Fahrgäste keinerlei Struktur über, unter oder neben sich haben. Das Design maximiert das Flugerleben und ermöglicht spektakuläre Nahbegegnungen mit Theming und Konstruktionsteilen. B&M ist der primäre Hersteller von Wing Coastern. Herausragende europäische Beispiele: Flug der Dämonen in Europa-Park — oft als einer der besten Coaster Europas bezeichnet — sowie The Swarm in Thorpe Park. Mit park.fan findest du aktuelle Wartezeiten für alle Wing Coaster.',
    aliases: ['Wing Rider', 'Wing Coasters', 'Wingcoaster', 'Wing Coaster'],

    relatedTermIds: ['b-and-m', 'inverted-coaster', 'dive-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      'Achterbahn mit frei drehbaren Fahrzeugen — jede Fahrt bietet eine andere Perspektive.',
    definition:
      'Ein Spinning Coaster (auch Drehachterbahn) verwendet Fahrzeuge, die sich auf einer vertikalen Achse frei drehen. Da die Rotation nicht gesteuert wird, erlebt jedes Fahrzeug eine andere Abfolge von Vorwärts-, Rückwärts- und Seitwärtsfahrten. Mack Rides aus dem deutschen Waldkirch ist der führende Hersteller; ihre Modelle sind in Phantasialand, Efteling und Alton Towers zu finden. Spinning Coaster gelten als hervorragende Familienbahnen — aufregend genug für Enthusiasten, aber ohne extreme Größenanforderungen.',
    aliases: ['Spinner'],

    relatedTermIds: ['mack-rides', 'launch-coaster', 'credit'],
  },
  {
    id: 'xtreme-spinning-coaster',
    name: 'Xtreme Spinning Coaster',
    shortDefinition:
      'Gerstlauers Hochintensitäts-Spinning-Coaster-Modell — schneller, höher und mit aggressiverer Rotation als ein Standard-Spinning Coaster.',
    definition:
      'Der Xtreme Spinning Coaster (XSC) ist Gerstlauers Top-Modell unter den Spinning Coastern und treibt das Konzept auf die Spitze. Wo ein normaler Spinning Coaster eher familienfreundlich ausgelegt ist, bietet der XSC eine größere Struktur, steilere Abfälle, höhere Spitzengeschwindigkeiten und einen auf ausgeprägtere Rotation ausgelegten Drehmechanismus — die Fahrzeuge drehen sich kräftiger und häufiger durch jedes Streckenelement.\n\nDie Unvorhersehbarkeit des Drehens wird durch das höhere Tempo noch verstärkt: Die Fahrtrichtung ändert sich schneller, sodass dieselbe Strecke von Fahrt zu Fahrt völlig unterschiedlich wirken kann. Das XSC-Modell positioniert Gerstlauer zwischen familienfreundlichen Spinners und ausgewachsenen Thrill-Coastern — intensive Erlebnisse bei gleichzeitiger Wiederspielbarkeit.',
    aliases: ['XSC'],
    relatedTermIds: ['spinning-coaster', 'gerstlauer', 'credit'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'Achterbahn mit mehr als 61 m Höhe — ohne Inversionen, dafür mit Fokus auf Geschwindigkeit und Airtime.',
    definition:
      'Hyper Coaster ist die Klassifikation für Achterbahnen zwischen 61 und 91 m Höhe. B&M nennt ihre Modelle "Hyper Coaster"; Intamin verwendet für vergleichbare Bahnen den Begriff "Mega Coaster". Beide Typen setzen auf ausgedehnte Airtime-Hügel bei hoher Geschwindigkeit statt auf Inversionen. Shambhala in PortAventura (Spanien) ist mit 76 m Europas höchster und schnellster Hyper Coaster. Weitere bekannte Beispiele: Goliath in Walibi Holland und Mako in SeaWorld Orlando.',
    aliases: ['Hyper', 'Mega Coaster', 'Hyper-Achterbahn', 'Mega-Achterbahn'],

    relatedTermIds: ['giga-coaster', 'airtime', 'b-and-m', 'intamin', 'airtime-hill'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition: 'Achterbahn mit mehr als 91 m Höhe — eine Stufe über dem Hyper Coaster.',
    definition:
      'Giga Coaster ist die Klassifikation für Achterbahnen zwischen 91 und 121 m Höhe. Der Begriff wurde 2000 von Cedar Fair und Intamin für Millennium Force in Cedar Point geprägt. Giga Coaster betonen extreme Höhe, lange Layouts und massive Airtime-Momente. Fury 325 in Carowinds gilt vielen Enthusiasten als der beste Stahlcoaster der Welt. In Europa gibt es Stand 2025 noch keinen echten Giga Coaster; Hyperion in Energylandia (Polen) mit 77 m fällt technisch noch in die Hyper-Kategorie.',
    aliases: ['Giga', 'Giga-Achterbahn'],

    relatedTermIds: ['hyper-coaster', 'airtime', 'first-drop'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'Kurve, bei der die Schiene über 90° geneigt ist — die Fahrgäste werden kurzzeitig über die Senkrechte hinaus gekippt.',
    definition:
      'Eine übergeneigte Kurve (englisch: Overbanked Turn) ist eine Kurve mit einer Querneigung von mehr als 90 Grad — die äußere Schiene liegt dabei höher als die Senkrechte, sodass die Fahrgäste kurzzeitig über die Kopf-über-Position hinaus geneigt werden, ohne eine vollständige Inversion zu durchfahren. Das Element erzeugt eine ungewöhnliche Mischung aus Seitenkräften und leicht negativen G-Kräften. Übergeneigte Kurven sind charakteristisch für moderne B&M-Hyper und Intamin-Mega Coaster sowie allgegenwärtig auf RMC-Layouts. Sie werden manchmal mit Inversionen verwechselt, da sie von außen dramatisch wirken.',
    aliases: ['Overbanked', 'Overbanked Turn'],

    relatedTermIds: ['inversion', 'airtime', 'b-and-m', 'rmc', 'intamin'],
  },
  {
    id: 'trim-brake',
    name: 'Trim Brake',
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
    aliases: ['Animatronic', 'Audio-Animatronics', 'Animatroniken'],

    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'KI-Prognose',
    shortDefinition:
      'KI-gestützte Vorhersagen für Besucherdichte und Wartezeiten in Freizeitparks – bis zu 30+ Tage im Voraus.',
    definition:
      'Eine KI-Prognose nutzt Machine-Learning-Modelle, die mit historischen Besuchsdaten, Wetterdaten, Schulferienkalendern und Echtzeit-Warteschlangendaten trainiert wurden, um vorherzusagen, wie voll ein Freizeitpark oder eine einzelne Attraktion an einem bestimmten Tag oder zu einer bestimmten Stunde sein wird. park.fan generiert KI-Prognosen für Besucherdichte und erwartete Wartezeiten bis zu 30+ Tage im Voraus.\n\nDie Vorhersagen werden kontinuierlich aktualisiert, wenn neue Daten eintreffen. Kurzfristige Prognosen (1–7 Tage) sind typischerweise sehr präzise, da aktuelle Wetterdaten, Veranstaltungsankündigungen und Buchungssignale einbezogen werden können. Langfristige Prognosen sind naturgemäß weniger präzise, aber dennoch wertvoll für die Planung – sie identifizieren zuverlässig ruhige oder belebte Zeiträume weit im Voraus.\n\nKI-Prognosen unterscheiden sich von einfachen historischen Durchschnittswerten dadurch, dass sie sich an aktuelle Bedingungen anpassen: Ein Freizeitpark, der gerade eine neue Attraktion angekündigt hat, ein Feiertag, der auf einen anderen Wochentag fällt als üblich, oder ein ungewöhnlich warmes Frühlingswochenende verschieben die Vorhersage spürbar vom historischen Basiswert.',
    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
    aliases: ['KI-Prognosen', 'AI Forecast', 'AI Forecasts'],
  },
  {
    id: 'ki',
    name: 'KI',
    shortDefinition:
      'Künstliche Intelligenz — Machine-Learning-Modelle, die Besucherprognosen und Wartezeiten für Freizeitparks berechnen.',
    definition:
      'KI (Künstliche Intelligenz) bezeichnet Machine-Learning-Algorithmen, die Muster in großen Datensätzen erkennen und Vorhersagen treffen. park.fan setzt KI-Modelle ein, die auf jahrelangen historischen Wartezeitdaten, Schulferienkalendern, Wetterdaten und Veranstaltungsankündigungen trainiert wurden. Diese Modelle berechnen täglich neue Prognosen für Besucherdichte und erwartete Wartezeiten – für jeden Park, jeden Tag, bis zu 30+ Tage im Voraus.',
    relatedTermIds: ['ai-forecast', 'crowd-forecast', 'crowd-calendar'],
    aliases: ['Künstliche Intelligenz'],
  },
  {
    id: 'realtime-wait-time',
    name: 'Echtzeit-Wartezeit',
    shortDefinition:
      'Minütlich aktualisierte Live-Wartezeit direkt aus den Systemen eines Freizeitparks.',
    definition:
      'Eine Echtzeit-Wartezeit ist die aktuelle, live aus den Erfassungssystemen eines Freizeitparks abgerufene Wartezeit — kein historischer Durchschnitt, sondern der tatsächliche Stand von heute, jetzt, auf die Minute genau. park.fan ruft Echtzeit-Wartezeiten aus offiziellen Park-APIs und Drittquellen ab und aktualisiert die Daten im Minutentakt. So siehst du immer, welche Attraktion gerade leer ist und wo du wirklich 60 Minuten warten müsstest.',
    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-forecast'],
    aliases: ['Echtzeit-Wartezeiten', 'Live-Wartezeit', 'Live-Wartezeiten'],
  },
  {
    id: 'crowd-forecast',
    name: 'Crowd-Prognose',
    shortDefinition:
      'KI-basierte Vorhersage der Besucherdichte für einen Freizeitpark an einem bestimmten Tag.',
    definition:
      'Eine Crowd-Prognose (auch Besucherprognose) ist eine datengestützte Vorhersage, wie voll ein Freizeitpark an einem bestimmten Tag oder zu einer bestimmten Uhrzeit sein wird. park.fan berechnet Crowd-Prognosen täglich neu auf Basis historischer Besuchszahlen, Schulferienkalender, Wetterdaten und Sonderveranstaltungen. Die Ergebnisse fließen direkt in den Besucherkalender ein: Grüne Tage bedeuten kurze Warteschlangen, rote Tage stehen für Spitzenbetrieb mit langen Wartezeiten.',
    relatedTermIds: ['crowd-calendar', 'ai-forecast', 'peak-day', 'crowd-level'],
    aliases: ['Crowd-Prognosen', 'Besucherprognose', 'Besucherprognosen'],
  },
  {
    id: 'opening-hours',
    name: 'Öffnungszeiten',
    shortDefinition:
      'Der offizielle Tagesplan mit den Öffnungs- und Schließzeiten eines Freizeitparks oder einer Attraktion.',
    definition:
      "Die Öffnungszeiten sind der veröffentlichte Tagesplan für einen Freizeitpark oder eine einzelne Attraktion – er gibt an, wann der Einlass beginnt und wann der Betrieb endet. Die meisten großen Parks veröffentlichen einen rollierenden Fahrplan Wochen oder Monate im Voraus, obwohl sich die Zeiten kurzfristig aufgrund von Sonderveranstaltungen, saisonalen Anpassungen oder betrieblichen Problemen ändern können.\n\npark.fan zeigt Öffnungszeiten für jeden Park an. Zeiten, die als 'Est.' (Estimated / Geschätzt) gekennzeichnet sind, wurden aus historischen Mustern abgeleitet und nicht vom Park offiziell bestätigt – sie sollten vor einem geplanten Besuch überprüft werden.\n\nÖffnungszeiten sind strategisch äußerst wichtig: Parks, die früh öffnen, belohnen Rope-Drop-Besucher mit kürzeren Warteschlangen, bevor sich die Massen aufbauen; Parks, die spät schließen, bieten ein zweites Fenster kürzerer Wartezeiten in der letzten Betriebsstunde.",
    aliases: ['Betriebszeiten', 'Park-Öffnungszeiten'],

    relatedTermIds: ['rope-drop', 'crowd-calendar', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Trend',
    shortDefinition:
      'Die Entwicklungsrichtung der Warteschlangenlänge in den letzten 30 Minuten – steigend, fallend oder stabil.',
    definition:
      'Der Trend zeigt an, ob die Warteschlange einer Attraktion im Vergleich zu vor 30 Minuten länger, kürzer oder gleich geblieben ist. park.fan stellt dies als Pfeil dar: aufwärts (Warteschlange wächst), abwärts (Warteschlange schrumpft) oder horizontal (stabil).\n\nDer Trend ist oft aussagekräftiger als die reine Wartezeit. Eine Attraktion mit 45 Minuten und fallendem Trend ist eine bessere Wahl als eine mit 40 Minuten und stark steigendem Trend – bis man ankommt, kann die erste Schlange auf 30 Minuten gesunken sein, während die zweite bereits bei 55 Minuten liegt.\n\nTrend-Daten sind besonders wertvoll in den Übergangsphasen des Parks am späten Vormittag und frühen Nachmittag, wenn sich die Besucher schnell durch den Park verteilen.',
    aliases: ['Queue Trend', 'Wait Trend'],

    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-level'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Eine Themenfahrt ohne feste Schiene — die Fahrzeuge navigieren frei durch den Raum, geführt von in den Boden eingelassener Technologie.',
    definition:
      "Eine Trackless Ride (schienenlose Themenfahrt) ist eine Dark-Ride-Variante, bei der die Fahrzeuge nicht an eine feste Schiene gebunden sind, sondern autonom durch den Attractionsraum navigieren — geführt durch Induktionsschleifen, WLAN oder Lasertechnik im Boden. Die freie Beweglichkeit ermöglicht wesentlich komplexere Szenengestaltung und nichtlineare Narrative: Fahrzeuge können drehen, kreisen und Szenen aus verschiedenen Winkeln anfahren. Bekannte Beispiele: Star Wars: Rise of the Resistance (Disney), Ratatouille: L'Aventure Totalement Toquée de Rémy (Disneyland Paris) und Symbolica (Efteling, Niederlande).",
    aliases: ['Trackless', 'Trackless Dark Ride', 'Gleislose Attraktion'],

    relatedTermIds: ['dark-ride', 'animatronics', 'themed-land'],
  },
  {
    id: 'g-force',
    name: 'G-Force',
    shortDefinition:
      'Die Beschleunigungseinheit, die Fahrgäste erleben, gemessen in Vielfachen der Erdgravitation (9,81 m/s²).',
    definition:
      'G-Kraft (Erdbeschleunigungsäquivalent) misst die Beschleunigung, die ein Fahrgast im Vergleich zur normalen Schwerkraft der Erde erlebt. Positive G-Kräfte (über 1G) drücken Fahrgäste in ihre Sitze, wenn der Zug durch ein Tal oder eine enge Kurve zieht. Negative G-Kräfte (unter 0G) heben Fahrgäste aus ihren Sitzen und erzeugen Airtime. Seitliche G-Kräfte (Laterals) wirken quer zur Fahrtrichtung und schieben Fahrgäste auf Kurven und Übergängen seitlich.\n\nAchterbahnen sind so konstruiert, dass diese Kräfte gezielt sequenziert werden. 4–5G in einem Talboden sind das Merkmal einer kraftvollen First-Drop-Einleitung. Ein kurzer Moment von −0,5G bis −1G auf einem Airtime-Hügel erzeugt das typische Schwebegefühl. Die meisten Bahnen zielen auf 0–5G anhaltende positive Kräfte ab, mit kurzen Spitzen für dramatische Effekte. Anhaltend hohe G-Belastungen über mehrere Sekunden können zu Unbehagen oder Greyout führen; gut gestaltete Coaster balancieren Intensitätspitzen mit Erholungsabschnitten.',
    relatedTermIds: ['airtime', 'inversion', 'lateral-gs', 'hangtime'],
    aliases: ['G-Kräfte', 'G-Force', 'G-Forces'],
  },
  {
    id: 'lateral-gs',
    name: 'Lateral Gs',
    shortDefinition:
      'Seitwärtskräfte, die Fahrgäste auf Kurven, Übergängen und Helix-Abschnitten seitlich in den Sitz drücken.',
    definition:
      'Seitliche G-Kräfte (Laterals) entstehen, wenn sich eine Achterbahn in der horizontalen Ebene ändert – auf überhöhten und nichtüberhöhten Kurven, Helices und Richtungswechseln. Gut gestaltete Laterals sind weich und kontrolliert und tragen zu einem energetischen Fahrerlebnis bei. Schlecht konstruierte oder raue Laterals fühlen sich an, als würde man brutal gegen den Rückhalt oder die Sitzlehne geworfen – unangenehm und oft schmerzhaft.\n\nEnthusiasten unterscheiden zwischen glatten, beabsichtigten Laterals – wie in den weiten Tiefkurven einer klassischen Holzachterbahn – und harten, unbeabsichtigten Laterals durch Gleisverschleiß oder mangelhaftes Engineering. Holzachterbahnen sind besonders für Laterals bekannt: das Spiel im Gleis und die seitliche Energie nichtüberhöhter Kurven gelten als Teil des authentischen Holzachterbahn-Erlebnisses. Sanfte Lateral-Sequenzen in Helix-Passagen – wie bei Balder in Liseberg – werden von Coaster-Enthusiasten oft als Highlights genannt.',
    relatedTermIds: ['g-force', 'airtime', 'helix', 'wooden-coaster'],
    aliases: ['Laterals', 'Lateral-G-Kräfte', 'Lateral G', 'Laterale G-Kräfte'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Intensive negative G-Kräfte, die Fahrgäste schlagartig aus dem Sitz reißen – gehalten nur vom Schoßbügel.',
    definition:
      'Ejector Airtime bezeichnet die intensivste Form negativer G-Kräfte: Die Bahn verlässt die freie Fallbahn so abrupt, dass Fahrgäste schlagartig aus ihren Sitzen gerissen werden – einzig der Schoßbügel hält sie im Fahrzeug. Der Name beschreibt genau das Gefühl: Es wirkt, als wolle der Sitz die Fahrgäste aktiv herausschleudern. Das unterscheidet sich fundamental vom sanften, langen Schweben beim Floater Airtime; Ejector ist scharf, plötzlich und kann bei abrupten Übergängen fast gewaltsam wirken.\n\nEjector Airtime ist am häufigsten mit RMC-Hybridachterbahnen, bestimmten Intamin-Hyper-Coastern und modernen Holzachterbahnen mit steilen, parabolischen Hügeln verbunden. Enthusiasten beschreiben die intensivsten Ejector-Momente als Höhepunkt eines Fahrprofils – ein kurzer, herzstockender Augenblick echter Schwerelosigkeit. Untamed in Walibi Holland, Wildfire in Kolmården und Steel Vengeance in Cedar Point gelten als Maßstab für intensive Ejector-Sequenzen.',
    relatedTermIds: ['airtime', 'floater-airtime', 'airtime-hill', 'rmc', 'g-force'],
    aliases: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      'Sanfte, anhaltende negative G-Kräfte mit einem langen Schwebegefühl beim Überkuppen eines Hügels.',
    definition:
      'Floater Airtime beschreibt das sanfte Ende des negativen G-Kraft-Spektrums: ein langsames, anhaltendes Schwebegefühl, bei dem Fahrgäste leicht aus dem Sitz aufsteigen und für einen ausgedehnten Moment schwerelos schweben, während der Zug einen Hügel auf einem flachen Parabelbogen überquert. Die Kraft ist mild – typischerweise etwa −0,1G bis −0,3G – und damit auch für Fahrgäste zugänglich, die den intensiven Ejector Airtime als zu viel empfinden.\n\nFloater Airtime ist am stärksten mit B&M-Hyper- und Giga-Coastern verbunden, die große, sanft gerundete Hügel nutzen, um lange Schwebeabschnitte zu erzeugen. Shambhala in PortAventura, Silver Star in Europa-Park und Goliath in Walibi Holland sind europäische Beispiele, die für ihre langen Floater-Sequenzen gefeiert werden. Viele Enthusiasten empfinden die entspannte Qualität des Floater Airtime als angenehmer und wiederholfähiger als den schroffen Ejector – die Gemeinschaft ist jedoch gespalten, welcher Stil vorzuziehen ist.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'airtime-hill', 'b-and-m', 'g-force'],
    aliases: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      'Das Gefühl, beim Überkopffahren schwerelos im Rückhalt zu hängen – ausgelöst durch negative G-Kräfte während einer Inversion.',
    definition:
      'Hangtime beschreibt die besondere Erfahrung negativer G-Kräfte während einer Inversion: Der Zug verweilt lange genug an der Spitze einer Überschlagsfigur, dass negative G-Kräfte wirksam werden – Fahrgäste hängen buchstäblich im Rückhalt. Anders als der kurze Kopf-unten-Moment eines schnellen Loopings entsteht Hangtime, wenn der Zug in der Nähe des Inversionsapex verlangsamt und ein ausgedehntes Hängegefühl erzeugt. Das Gewicht verlagert sich vollständig in die Schulterbügel oder den Schoßbügel, was eine einzigartig desorientierende Empfindung erzeugt.\n\nHangtime tritt am ausgeprägtesten bei Elementen auf, bei denen der Zug an der Inversions-Spitze stark verlangsamt – der Pretzel Loop auf Flying Coastern ist das klassische Beispiel, da die Geschwindigkeit so gering ist, dass anhaltende negative G-Kräfte im voll invertierten Zustand entstehen. Der Heartline Roll mancher moderner Bahnen kann ebenfalls Hangtime erzeugen. Enthusiasten betrachten Hangtime als eine der aufregendsten Inversionsempfindungen überhaupt.',
    relatedTermIds: ['inversion', 'pretzel-loop', 'heartline-roll', 'g-force', 'airtime'],
    aliases: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Achterbahn-Element',
    shortDefinition:
      'Ein benannter Streckenabschnitt einer Achterbahn, z. B. Looping, Airtime-Hügel oder Inversion.',
    definition:
      'Ein Achterbahn-Element bezeichnet einen eigenständigen, benannten Teil einer Achterbahn-Strecke – von klassischen Inversionen wie Looping und Korkenzieher bis hin zu nicht-invertierenden Elementen wie Airtime-Hügeln, Helices und überneigten Kurven (Overbanks). Ingenieure gestalten jedes Element gezielt, um ein bestimmtes körperliches Erlebnis zu erzeugen: Schwerelosigkeit (Airtime), seitliche G-Kräfte oder die Desorientierung beim Kopf-über-Fahren. Enthusiasten und Hersteller weltweit verwenden präzise Begriffe für diese Elemente, um Coaster-Designs zu beschreiben und zu vergleichen.\n\nDas park.fan-Glossar erklärt Dutzende solcher Elemente – vom ersten Drop und Lifthill bis hin zu modernen Spezialformen wie dem Stengel Dive, Norwegian Loop und Heartline Roll.',
    relatedTermIds: ['airtime', 'inversion', 'vertical-loop', 'helix', 'first-drop'],
    aliases: ['Achterbahn-Elemente', 'Achterbahn-Elementen'],
  },
  // ── Ride Experience ────────────────────────────────────────────────────────
  {
    id: 'front-row',
    name: 'Erste Reihe',
    shortDefinition:
      'Die erste Reihe eines Fahrgeschäfts, oft mit bester Aussicht und intensivem Airtime-Erlebnis.',
    definition:
      'Die erste Reihe eines Achterbahn-Zugs bietet einen freien Blick nach vorne und gilt unter Gästen als begehrte Position. Bei Hypercoastern und Gigacoastern erleben Fahrgäste in der ersten Reihe beim ersten Drop intensives Airtime, da sie ungehindert sehen, wie der Drop näher kommt – und dann ins Leere stürzen. Der psychologische Effekt dieses ungehinderten Ausblicks vor dem Absturz verstärkt den Thrill deutlich.\n\nAuf vielen Achterbahnen ist die erste Reihe so begehrt, dass Parks separate Warteschlangen oder Express-Plätze nur für diese Sitzposition anbieten. Der längere Wartezeitraum kann sich für viele Fahrgäste lohnen, besonders beim ersten Mal, um die maximale psychologische Intensität zu erleben.',
    relatedTermIds: ['back-row', 'middle-row', 'airtime', 'first-drop'],
    aliases: ['Erster Platz'],
  },
  {
    id: 'back-row',
    name: 'Letzte Reihe',
    shortDefinition:
      'Die letzte Reihe eines Fahrgeschäfts, bekannt für intensives Ejector Airtime auf Airtime-orientierten Layouts.',
    definition:
      'Die letzte Reihe eines Achterbahn-Zugs ist bei Enthusiasten für intensive Airtime-Empfindungen berühmt. Bei jeder Airtime-Kuppe erlebt die letzte Reihe den stärksten Effekt: Fahrgäste werden intensiv aus den Sitzen gehoben und von den Bügeln gehalten (Ejector Airtime). Dieser Effekt verstärkt sich über mehrere Hügel hinweg – das intensive, anhaltende Schwebelosigkeitsgefühl macht die letzte Reihe auf Airtime-Achterbahnen zur bevorzugten Position.\n\nBei Coastern wie Goliath oder Shambhala gilt die letzte Reihe als die beste Position für Enthusiasten. Der Nachteil: Letzte Reihen können auf älteren Achterbahnen rauer wirken, und bei steilen Drops sitzt man mit dem Blick auf die Kehre statt ins Leere. Enthusiasten-Rankings platzieren die letzte Reihe dennoch konsistent oben bei der Intensität des Airtime-Erlebnisses.',
    relatedTermIds: ['front-row', 'middle-row', 'airtime', 'ejector-airtime'],
    aliases: ['Letzter Platz'],
  },
  {
    id: 'middle-row',
    name: 'Mittlere Reihe',
    shortDefinition:
      'Die mittleren Reihen eines Fahrgeschäfts, die ein ausgewogenes Erlebnis zwischen erster und letzter Reihe bieten.',
    definition:
      'Die mittleren Reihen sitzen zwischen der intensiven psychologischen Wirkung der ersten Reihe und dem starken Ejector Airtime der letzten Reihe. Sie bieten ein ausgewogenes Erlebnis: genügend Ausblick auf die kommenden Elemente, moderates Airtime, aber ohne die Extreme der Randreihen. Für Familien oder erste Besucher sind mittlere Reihen eine zugänglichere Wahl.\n\nMittlere Reihen erhalten weniger Aufmerksamkeit von Enthusiasten, weil sie weder extreme Intensität noch spezielle Sensationen bieten. Auf Achterbahnen mit starken Seitenkräften können mittlere Reihen aber bemerkenswerte G-Effekte erzeugen. Sie sind eine verlässliche Wahl, wenn erste oder letzte Reihe nicht verfügbar sind.',
    relatedTermIds: ['front-row', 'back-row', 'airtime', 'ride-cart'],
    aliases: ['Mittlerer Platz'],
  },
  {
    id: 'ride-cart',
    name: 'Fahrwagen',
    shortDefinition:
      'Einzelner Wagen oder Auto in einem Achterbahn-Zug, der eine oder mehrere Reihen von Fahrgästen aufnimmt.',
    definition:
      'Ein Fahrwagen (auch Auto, Wagen oder einfach Teil eines Zuges genannt) ist das einzelne Fahrzeug-Segment, das Fahrgäste auf einer Achterbahn hält. Ein typischer Achterbahn-Zug besteht aus mehreren Wagen, die aneinander gekoppelt sind und jeweils Fahrgäste in einer oder mehreren Reihen aufnehmen. Die Hersteller gestalten Wagengröße, Sitzbeschaffenheit und Bügel-Geometrie, um Komfort und Sensation zu optimieren.\n\nDie Wagenkonstruktion variiert dramatisch: Hypercoaster nutzen schlanke, niedrige Wagen zur Minderung von Luftwiderstand; Inverted Coaster hängen Fahrgäste unter der Schiene; Wing Coaster positionieren Fahrgäste seitlich mit nichts unter sich. Hersteller wie B&M, Intamin und Mack prägen mit ihren Designs die Fahrqualität erheblich. Der Hersteller gibt oft Hinweise auf Komfort, Bügel-Straffer und G-Kraft-Art.',
    relatedTermIds: ['lap-bar', 'shoulder-harness', 'front-row', 'back-row'],
    aliases: ['Wagen', 'Auto'],
  },
  {
    id: 'lap-bar',
    name: 'Schoßbügel',
    shortDefinition:
      'Ein horizontaler Sicherheitsbügel über dem Schoß, der mehr Bewegungsfreiheit als Schulterbügel ermöglicht.',
    definition:
      'Ein Schoßbügel ist ein horizontaler Sicherheitsbügel, der Fahrgäste über den Oberschenkeln festklemmt. Anders als Schulterbügel, die den ganzen Oberkörper umschließen, ermöglichen Schoßbügel mehr freie Bewegung – eine offenere, weniger eingeschränkte Empfindung. Schoßbügel sind Standard auf modernen Hypercoastern, Gigacoastern und vielen Stahl- und Holzachterbahnen. Während Airtime-Momenten ermöglichen Schoßbügel das volle Aufschwebensgefühl – Fahrgäste spüren deutlich den Abstand zwischen Sitz und Körper.\n\nSchoßbügel werden von Enthusiasten für Airtime-Achterbahnen bevorzugt, weil sie das intensivste Airtime-Gefühl bieten. Allerdings können sie bei bestimmten Körperformen unbequem sein. Moderne Schoßbügel sind deutlich bequemer als frühere Generationen. Bei Achterbahnen mit starken Seitenkräften können Schoßbügel leicht vor- und zurück gleiten – was manche Fahrgäste störend, andere aufregend finden.',
    relatedTermIds: ['shoulder-harness', 'airtime', 'ride-cart'],
    aliases: ['Schoss-Bügel'],
  },
  {
    id: 'shoulder-harness',
    name: 'Schulterbügel',
    shortDefinition:
      'Ein über-den-Schultern-Sicherheitsbügel, der den Oberkörper umschließt und Bewegung einschränkt.',
    definition:
      'Ein Schulterbügel ist ein Sicherheitssystem, das über beide Schultern und über den Schoß kommt und den Oberkörper vollständig umhüllt. Schulterbügel waren Standard auf Achterbahnen der 1980er und 2000er und bleiben verbreitet auf Inverted Coastern, manchen Suspended Coastern und Family-Rides, wo maximale Sicherheit Vorrang hat. Moderne Bügel haben Ratschenmechanismen, die unterschiedliche Engstellung ermöglichen.\n\nWenn man mit Schulterbügel auf einer Airtime-Achterbahn sitzt, fühlt sich das Erlebnis anders an: Fahrgäste können nicht so dramativ aus dem Sitz aufstehen, weil der Bügel sie festhält. Dieser Kompromiss – bessere Sicherheit gegen weniger intensive Airtime-Empfindung – ist ein bewusster Designentscheid. Enthusiasten bevorzugen Schoßbügel für Airtime-Achterbahnen, aber Schulterbügel fühlen sich für nervöse Fahrgäste sicherer an.',
    relatedTermIds: ['lap-bar', 'airtime', 'ride-cart'],
    aliases: ['OTS-Bügel'],
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    id: 'souvenir',
    name: 'Andenken',
    shortDefinition:
      'Ein Erinnerungsstück oder kleines Objekt, das im Freizeitpark gekauft wird, um einen Besuch zu erinnern.',
    definition:
      'Ein Andenken ist ein physisches Erinnerungsstück – Merchandise, Kleidung oder Sammelobjekt – das Besucher kaufen, um ihren Parkbesuch zu erinnern. Häufige Andenken sind T-Shirts mit Park-Logos, Kappen, Pins, Postkarten, Plüschtiere und thematische Sammelobjekte. Andenken erfüllen zwei Funktionen: praktisch (tragbare Kleidung) und emotional (Erinnerungen verankern).\n\nFreizeitparks verdienen beträchtlich mit Andenken-Verkäufen; die Gewinnspanne beträgt typischerweise 2–3x Einzelhandelspreis. Parks inszenieren Andenken-Foto-Momente gezielt, um Impulskäufe zu fördern. Limitierte oder saisonale Andenken erzeugen Dringlichkeit, während Park-Exklusiv-Artikel höhere Preise ermöglichen. Für viele Gäste ist das Sammeln von Andenken aus mehreren Parks Teil des Erlebnisses.',
    relatedTermIds: ['merchandise', 'gift-shop', 'park-exclusive'],
    aliases: ['Erinnerungsstück', 'Souvenir'],
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    shortDefinition:
      'Offizielle Produkte und Waren eines Freizeitparks, einschließlich Kleidung, Sammelobjekte und thematische Artikel.',
    definition:
      'Merchandise umfasst alle Waren eines Freizeitparks – von Markenbekleidung (T-Shirts, Hoodies, Kappen) über Sammelobjekte (Pins, Figuren, Plüschtiere) bis hin zu Spezial- und themengebundenen Artikeln. Parks betreiben umfangreiche Merchandise-Operationen über Dutzende Läden, mobile Verkaufswagen und spezialisierte Boutiquen. Merchandise ist eine kritische Einnahmequelle, oft 15–25% der Besucherausgaben.\n\nModerne Parks nutzen strategische Merchandising-Methoden: Limitierte saisonale Artikel, Kooperations-Merchandise mit beliebten Franchises, Park-exklusive Designs und Spezial-Releases zu neuen Eröffnungen. Merchandise-Design wird zunehmend datengesteuert – Parks verfolgen, welche Artikel am schnellsten verkaufen und am meisten auf Social Media funktionieren. Für dedizierte Fans wird Merchandise-Sammlung Teil ihrer Park-Erfahrung, und Sekundärmärkte existieren für seltene, ausverkaufte Artikel.',
    relatedTermIds: ['souvenir', 'gift-shop', 'park-exclusive'],
    aliases: ['Merch'],
  },
  {
    id: 'gift-shop',
    name: 'Geschenkeladen',
    shortDefinition:
      'Ein Einzelhandelsladen in einem Freizeitpark, der Andenken und Merchandise verkauft.',
    definition:
      'Ein Geschenkeladen ist ein Einzelhandelspace innerhalb eines Freizeitparks für Andenken und thematische Produkte – entweder zentral oder integriert in thematische Bereiche. Große Parks betreiben Dutzende Läden von kleinen Verkaufswagen bis zu großen Abteilungsgeschäften. Geschenkeläden positionieren sich strategisch an Hochverkehrspunkten: Ausstiegsschlangen von Attraktionen, Hotelkorridore, Eingang/Ausgang.\n\nModerne Geschenkeläden nutzen Retail-Design: Eingangspositionierung, thematische Umgebung und geschickte Produktplatzierung. Viele Attraktionen führen Gäste direkt durch Merchandise-Bereiche – eine bewährte Strategie für Impulskäufe. Parks nutzen zunehmend lizenziertes IP-Merchandise zu Premium-Preisen. Sammler-fokussierte Läden in Premium-Resorts verkaufen exklusive Artikel zu deutlich höheren Preisen.',
    relatedTermIds: ['merchandise', 'souvenir', 'park-exclusive'],
    aliases: ['Souvenir-Laden', 'Laden'],
  },
  {
    id: 'park-exclusive',
    name: 'Parkexklusiv',
    shortDefinition:
      'Ein Produkt, das nur in einem bestimmten Freizeitpark erhältlich ist und nirgendwo sonst gekauft werden kann.',
    definition:
      'Park-exklusive Merchandise sind Produkte, die nur in einem bestimmten Park oder Parksystem verkauft werden – nirgendwo sonst erhältlich. Park-Exklusiva erzeugen Knappheit, fördern Impulskäufe durch das Gefühl der Nicht-Verfügbarkeit anderswo, und ermöglichen 2–3x höhere Preismargen. Häufige Exklusiva sind limitierte Kleidung, Sammel-Pins, thematische Artikel zu neuen Attraktionen und Novelty-Lebensmittel.\n\nDie Park-Exklusiv-Strategie ist psychologisch zentral: Gäste, die weit gereist sind und viel für Eintritt gezahlt haben, kaufen eher Artikel, die sie daheim nicht bekommen. Sekundärmärkte zeigen, dass begehrte, limitierte Park-Exklusiva an Wert gewinnen und sammlerische Verhaltensweisen fördern. Parks betonen strategisch „Park Exklusiv" auf Verpackungen. Online-Foren und Social Media zeigen ständig Diskussionen über die begehrtesten oder rärsten Exklusiva.',
    relatedTermIds: ['merchandise', 'souvenir', 'gift-shop'],
    aliases: ['Exklusiv'],
  },
  {
    id: 'flying-coaster',
    name: 'Flying Coaster',
    shortDefinition: 'Achterbahn, bei der die Fahrgäste liegend transportiert werden.',
    definition:
      'Ein Flying Coaster transportiert die Fahrgäste in horizontaler Bauchlage, sodass das Gefühl des Fliegens entsteht. Die Züge schwenken von der sitzenden Position am Bahnhof in die horizontale Lage, bevor die Fahrt beginnt. Bekannte Beispiele sind Manta (SeaWorld Orlando) und Tatsu (Six Flags Magic Mountain) von B&M.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster'],
    aliases: ['Flyer', 'fliegender Achterbahn', 'Superman-Ride', 'prone coaster', 'flying coaster'],
  },
  {
    id: 'mine-train',
    name: 'Mine Train',
    shortDefinition: 'Familien-Stahlachterbahn im Thema eines Minenzuges.',
    definition:
      'Ein Mine Train Coaster ist eine familienfreundliche Stahlachterbahn, die als entlaufener Minenkarren gestaltet ist. Typischerweise moderate Geschwindigkeiten, kleine Drops und enge Kurven durch thematisierte Tunnel und Felsformationen. Geeignet für ein breites Altersspektrum. Beispiele: Big Thunder Mountain Railroad (Disney Parks) und Gold Rush (Plopsaland).',
    relatedTermIds: ['steel-coaster', 'themed-land'],
    aliases: ['Minenzug', 'Mine Coaster', 'mine train', 'Familienachterbahn', 'mine car coaster'],
  },
  {
    id: 'terrain-coaster',
    name: 'Terrain Coaster',
    shortDefinition: 'Achterbahn, die die natürliche Landschaft intensiv nutzt.',
    definition:
      'Ein Terrain Coaster wird so gebaut, dass er die natürliche Topographie – Hügel, Täler und Schluchten – intensiv nutzt, anstatt vollständig auf künstliche Struktur angewiesen zu sein. Die Strecke interagiert eng mit dem Boden und erzeugt ein starkes Geschwindigkeitsgefühl. Klassische Beispiele: The Beast (Kings Island) und Ravine Flyer II (Waldameer).',
    relatedTermIds: ['wooden-coaster', 'steel-coaster', 'airtime'],
    aliases: ['terrain coaster', 'Landschaftsachterbahn', 'bodennahe Achterbahn'],
  },
  {
    id: 'floorless-coaster',
    name: 'Floorless Coaster',
    shortDefinition: 'Stahlachterbahn ohne Boden, bei der die Beine frei hängen.',
    definition:
      'Bei einem Floorless Coaster klappt der Wagenboden weg, sobald die Fahrgäste gesichert sind, sodass die Beine frei über dem Schienenstrang hängen. Im Gegensatz zum Inverted Coaster verläuft die Schiene unterhalb des Wagens. B&M war mit Medusa (1999) Pionier dieser Bauform. Europäisches Beispiel: Goliath (Walibi Holland).',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster', 'dive-coaster'],
    aliases: ['Floorless', 'open floor coaster', 'floorless coaster'],
  },
  {
    id: 'arrow-dynamics',
    name: 'Arrow Dynamics',
    shortDefinition: 'Amerikanischer Achterbahnhersteller und Erfinder der modernen Loopingbahn.',
    definition:
      "Arrow Dynamics (gegründet 1945) war ein Pionier des modernen Achterbahnbaus und führte die gebogenen Stahlrohre sowie den ersten modernen Loop auf Corkscrew (Knott's Berry Farm, 1975) ein. Arrow-Bahnen sind bekannt für Korkenzieher und hängende Loopingbahnen. Das Unternehmen meldete 2001 Insolvenz an; die Vermögenswerte wurden von S&S übernommen.",
    relatedTermIds: ['steel-coaster', 'corkscrew', 'suspended-coaster', 'vertical-loop'],
    aliases: ['Arrow', 'Arrow Development', 'S&S Arrow', 'arrow dynamics'],
  },
  {
    id: 'gci',
    name: 'Great Coasters International (GCI)',
    shortDefinition:
      'Amerikanischer Holzachterbahnhersteller bekannt für schnelle, kurvenreiche Layouts.',
    definition:
      'Great Coasters International (GCI) ist ein amerikanischer Hersteller, der auf Holzachterbahnen spezialisiert ist. Gegründet 1994 ist GCI bekannt für die Millennium-Flyer-Züge und Layouts mit raschen Richtungswechseln und anhaltendem Airtime. Bekannte Installationen: Wodan (Europa-Park), Thunderhead (Dollywood) und Troy (Toverland).',
    relatedTermIds: ['wooden-coaster', 'airtime', 'rmc', 'terrain-coaster'],
    aliases: ['Great Coasters International', 'GCI Coaster', 'Millennium Flyer', 'gci'],
  },
  {
    id: 'premier-rides',
    name: 'Premier Rides',
    shortDefinition:
      'Amerikanischer Hersteller, spezialisiert auf LSM/LIM-Katapultachterbahnen — in Europa bekannt durch Sky Scream im Holiday Park.',
    definition:
      "Premier Rides (gegründet 1995, Baltimore, Maryland) ist ein amerikanischer Achterbahnhersteller, der sich auf Linear-Synchron-Motor (LSM)- und Linear-Induktions-Motor (LIM)-Abschusstechnologien spezialisiert hat. Das Sky Rocket II-Modell — ein kompakter, einsliniger Katapultcoaster — hat sich weltweit in mittelgroßen Parks etabliert.\n\nIn Europa ist Premier Rides vor allem durch Sky Scream im Holiday Park (Haßloch, Deutschland) bekannt, einem invertierten Familienkatapultcoaster. Auch Hagrid's Magical Creatures Motorbike Adventure in Universal Orlando nutzt Premier's LSM-Technologie und zeigt die Vielseitigkeit des Systems.",
    aliases: ['Premier'],
    relatedTermIds: ['launch-coaster', 'gerstlauer', 'intamin'],
  },
  {
    id: 'maurer-rides',
    name: 'Maurer Rides',
    shortDefinition:
      'Münchner Hersteller bekannt für Spinning Coaster mit Trick Track, die X-Car-Plattform und den Vertikallooping Sky Loop.',
    definition:
      "Maurer Rides (Maurer AG, Metallbau seit 1876, Freizeitanlagen ab 1993) ist ein Münchner Hersteller. Das Unternehmen entwickelte die SC-Spinning-Coaster-Serie mit dem charakteristischen Trick Track — einem Abschnitt, bei dem sich der Wagen seitlich neigt — sowie die X-Car-Plattform für individuelle Kompaktlayouts mit Katapultstarts und Inversionen.\n\nDer Sky Loop ist ein eigenständiges Vertikallooping-Modell, das platzsparend in vielen europäischen Parks steht. Bekannte europäische Installationen: Winja's Fear und Winja's Force im Phantasialand (Deutschland), Indoor-Spinning-Coaster mit Trick Track, sowie X-Car-Installationen in europäischen Parks.",
    aliases: ['Maurer', 'Maurer Söhne', 'Maurer AG'],
    relatedTermIds: ['spinning-coaster', 'xtreme-spinning-coaster', 'launch-coaster', 'gerstlauer'],
  },
  {
    id: 'zamperla',
    name: 'Zamperla',
    shortDefinition:
      'Italienischer Hersteller mit einem der größten Portfolios familienfreundlicher Achterbahnen und Fahrgeschäfte weltweit — über 250 Achterbahnen installiert.',
    definition:
      "Zamperla (gegründet 1966, Altavilla Vicentina, Italien) ist einer der produktivsten Freizeitattraktionshersteller weltweit. Während Intamin, B&M und Mack auf große Thrill-Installationen abzielen, fokussiert sich Zamperla auf Zugänglichkeit und Volumen — Family Coaster, Mini Coaster, Twister und Disk'O Coaster sind Standardattraktionen kleinerer Parks und Resort-Midways weltweit.\n\nKompakte Grundrisse und moderate Mindestgrößen machen Zamperla-Bahnen besonders in europäischen Stadtparks, Ferienresorts und Innenbereichen verbreitet. Das Unternehmen baute auch Thunderbolt auf Coney Island (New York) und zeigt damit auch Kapazität für größere Projekte.",
    aliases: ['Zamperla rides', 'Antonio Zamperla'],
    relatedTermIds: ['credit', 'mine-train', 'gerstlauer'],
  },
  {
    id: 's-and-s-worldwide',
    name: 'S&S Worldwide',
    shortDefinition:
      'Amerikanischer Hersteller bekannt für pneumatische Drop-Tower, den kompakten El Loco und Free-Fly-4D-Coaster.',
    definition:
      'S&S Worldwide (gegründet 1994, Logan, Utah; übernommen von Sansei Technologies 2012) entwickelte ursprünglich pneumatische Drop-Türme — Space Shot und Turbo Drop — bevor das Unternehmen auf Achterbahnen ausweitete. Der El Loco ist ein kompakter Extremcoaster mit jenseits-vertikalem Erstabfall und Inversion auf kleinstem Grundriss. Der Free Fly ist ein 4D-Coaster mit frei schwenkendem Sitz.\n\nS&S übernahm außerdem die Vermögenswerte des historisch bedeutenden Arrow Dynamics nach dessen Insolvenz 2001. In Europa sind S&S-Installationen seltener als in Nordamerika, die Luftkatapult-Technologie hat jedoch die Branche beeinflusst.',
    aliases: ['S&S', 'S&S-Sansei', 'S&S Power', 'S&S Sansei'],
    relatedTermIds: ['launch-coaster', 'arrow-dynamics', 'gerstlauer'],
  },
  {
    id: 'zierer',
    name: 'Zierer',
    shortDefinition:
      'Bayerischer Hersteller aus Deggendorf, spezialisiert auf familienfreundliche Achterbahnen — über 190 gebaute Anlagen weltweit.',
    definition:
      'Zierer (gegründet 1930, Deggendorf, Bayern) ist ein bayerischer Hersteller für familienfreundliche Achterbahnen und klassische Parkattraktionen. Die Force-Coaster-Reihe umfasst mehrere Stufen: von kompakten Junior-Modellen bis zu schnelleren Force-Custom-Installationen. Zierer-Bahnen zeichnen sich durch Stahlrohrschienenführung, sanften Fahrkomfort und moderate Mindestgrößenanforderungen aus — ideal für Parks mit breitem demografischen Zielpublikum.\n\nMit über 190 weltweit ausgelieferten Achterbahnen ist Zierer einer der produktivsten europäischen Achterbahnbauer nach Stückzahl. Bekannte Installationen: Feuerdrache im Legoland Deutschland sowie Familienachterbahnen in deutschen, niederländischen und skandinavischen Parks.',
    aliases: ['Zierer GmbH', 'Zierer rides'],
    relatedTermIds: ['credit', 'mack-rides', 'gerstlauer'],
  },
  {
    id: 'stall',
    name: 'Stall',
    shortDefinition: 'Inversion, bei der der Zug kurzzeitig kopfüber fast zum Stehen kommt.',
    definition:
      'Ein Stall (auch Zero-G-Stall) ist ein Element, bei dem der Zug in eine Inversion fährt und am höchsten Punkt kurzzeitig fast anhält – die Fahrgäste hängen kopfüber. Entwickelt von Rocky Mountain Construction (RMC), erzeugt das Element langen Hangtime. Bekannte Beispiele: Zadra (Energylandia) und Steel Vengeance (Cedar Point).',
    relatedTermIds: ['inversion', 'hangtime', 'rmc', 'zero-g-roll'],
    aliases: ['Zero-G-Stall', 'RMC Stall', 'Hangtime-Element', 'stall element'],
  },
  {
    id: 'wave-turn',
    name: 'Wave Turn',
    shortDefinition: 'Schwungvolle Kurve mit Airtime-Effekt mitten in der Richtungsänderung.',
    definition:
      'Ein Wave Turn ist eine schnelle, überneigte Kurve, die kurzzeitig negative oder seitliche G-Kräfte erzeugt, was ein Airtime-Gefühl mitten in der Kurve entsteht. Häufig auf RMC-Bahnen eingesetzt, verbindet das Element Richtungsänderung mit Ejector- oder Floater-Airtime. Zu finden auf Wildfire (Kolmården) und Untamed (Walibi Holland).',
    relatedTermIds: ['airtime', 'overbank', 'ejector-airtime', 'rmc', 'lateral-gs'],
    aliases: ['wave turn', 'Airtime-Kurve', 'überneigte Kurve'],
  },
  {
    id: 'shoulder-season',
    name: 'Zwischensaison',
    shortDefinition: 'Zeitraum zwischen Hoch- und Nebensaison mit moderatem Besucherandrang.',
    definition:
      'Die Zwischensaison bezeichnet die Übergangszeiten zwischen der Hauptsaison und den ruhigsten Zeiten eines Freizeitparks. In europäischen Parks typischerweise Frühling (März–Mai) und früher Herbst (September–Oktober). Der Andrang ist moderat, Preise oft günstiger und die meisten Attraktionen geöffnet – ein beliebter Zeitraum für Enthusiasten, die ein gutes Verhältnis von Erlebnis und Aufwand suchen.',
    relatedTermIds: ['crowd-forecast', 'school-holiday', 'crowd-level'],
    aliases: ['Nebensaison', 'shoulder season', 'ruhige Saison', 'Vor-/Nachsaison', 'off-peak'],
  },
  {
    id: 'school-holiday',
    name: 'Schulferien',
    shortDefinition: 'Schulferienzeiten, die zu deutlich höherem Besucherandrang führen.',
    definition:
      'Schulferien – Sommerferien, Weihnachtsferien, Osterferien und Herbstferien – sind der wichtigste Treiber für Besucherspitzen in Freizeitparks. Familien mit Kindern sind das größte Besuchersegment und konzentrieren ihre Besuche auf diese Zeitfenster. Parks verlängern oft die Öffnungszeiten, erweitern das Unterhaltungsangebot und erhöhen die Preise. Das Meiden der Schulferien ist die effektivste Strategie zur Wartezeit-Reduzierung.',
    relatedTermIds: ['crowd-forecast', 'shoulder-season', 'crowd-level'],
    aliases: [
      'Ferien',
      'Sommerferien',
      'Osterferien',
      'Herbstferien',
      'Weihnachtsferien',
      'school holiday',
      'school holidays',
    ],
  },
  {
    id: 'photo-pass',
    name: 'Fotopass',
    shortDefinition: 'Service für unbegrenzte digitale Park- und Fahrfotos.',
    definition:
      'Ein Fotopass (oder Memory Maker) ist ein optionales Zusatzangebot, das digitalen Zugang zu allen professionell aufgenommenen Fotos und Videos eines Parkbesuchs gewährt – einschließlich Fahrfotos, Charaktertreffen und Roaming-Fotografen. Als Pauschalpaket verkauft, kann es für Familien, die ansonsten viele Einzelfotos kaufen würden, wirtschaftlich sinnvoll sein. Bekannte Beispiele: Disneys Memory Maker und Universals Photo Pass.',
    relatedTermIds: ['ride-photo', 'character-meet-and-greet', 'season-pass'],
    aliases: ['Memory Maker', 'Fotopaket', 'Parkfotos', 'photo pass', 'photopass'],
  },
  {
    id: 'accessibility-pass',
    name: 'Barrierefreiheits-Pass',
    shortDefinition:
      'Pass für Gäste mit Behinderungen zur Nutzung von Attraktionen mit reduzierter Wartezeit.',
    definition:
      'Ein Barrierefreiheits-Pass (je nach Park auch DAS – Disability Access Service, Zugänglichkeitskarte oder Attraktionszugangspass) wird Gästen ausgestellt, die aufgrund einer Behinderung nicht in der regulären Warteschlange warten können. Er ermöglicht es dem Gast und einer Begleitgruppe, zu einem bestimmten Zeitpunkt zurückzukehren, anstatt physisch zu warten. Berechtigung und Prozesse variieren je nach Park und Land.',
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: [
      'DAS',
      'Disability Access Service',
      'Behindertenpass',
      'Rollstuhlpass',
      'accessibility pass',
      'Attraktionszugangspass',
    ],
  },
  {
    id: 'motion-simulator',
    name: 'Simulator-Attraktion',
    shortDefinition: 'Attraktion mit beweglicher Plattform und Filmprojektion.',
    definition:
      'Eine Simulator-Attraktion kombiniert eine hydraulisch oder elektrisch angetriebene Bewegungsplattform mit einer Großleinwand, die physische Bewegungen mit dem Filmgeschehen synchronisiert. Es wird ein immersives Erlebnis ohne klassische Schiene erzeugt. Die Kapazität ist oft hoch, und die Erfahrung kann durch Filmwechsel aktualisiert werden. Bekannte Beispiele: Star Tours (Disney), Mystic Manor (HKDL).',
    relatedTermIds: ['dark-ride', 'trackless-ride', 'pre-show', 'animatronics'],
    aliases: [
      'Simulatorfahrt',
      'Simulator',
      '4D-Kino',
      'Flugsimulator',
      'motion simulator',
      'motion base',
    ],
  },
  {
    id: 'character-meet-and-greet',
    name: 'Character Meet & Greet',
    shortDefinition: 'Geplante Möglichkeit, einem Parkkostümcharakter persönlich zu begegnen.',
    definition:
      'Ein Charaktertreffen (Character Meet & Greet) ist ein ausgewiesener Bereich oder ein geplantes Event, bei dem Gäste Kostümcharakteren begegnen, für Fotos posieren und Autogramme erhalten können. Besonders beliebt in Disney- und Universal-Parks; populäre Charaktere haben oft eigene Meet-&-Greet-Bereiche mit eigenem Wartesystem. Besonders bei Familien mit Kindern sehr beliebt.',
    relatedTermIds: ['photo-pass', 'character-dining', 'themed-land'],
    aliases: [
      'Meet & Greet',
      'Charakterbegegnung',
      'Charakter-Auftritt',
      'character meet and greet',
      'character encounter',
    ],
  },
  {
    id: 'pre-show',
    name: 'Vorshow',
    shortDefinition:
      'Unterhaltungsbereich, der Gäste vor dem Einsteigen auf eine Attraktion vorbereitet.',
    definition:
      'Eine Vorshow ist ein Vorbereitungsbereich bei thematisierten Attraktionen, in dem sich Gäste vor der eigentlichen Fahrt oder dem Haupterlebnis versammeln, um Handlungskontext, Sicherheitshinweise oder Unterhaltung zu erhalten, die die Atmosphäre aufbaut. Vorshows dienen sowohl narrativen als auch operativen Funktionen. Bekannte Beispiele: Der Dehnraum im Haunted Mansion und das Sicherheitsvideo auf Guardians of the Galaxy – Mission: BREAKOUT!.',
    relatedTermIds: ['dark-ride', 'motion-simulator', 'animatronics', 'themed-land'],
    aliases: ['Pre-Show', 'Warteschlangenunterhaltung', 'Staging-Bereich', 'pre show'],
  },
  {
    id: 'flat-ride',
    name: 'Flat Ride',
    shortDefinition:
      'Bodennahe Attraktion, die dreht, schwingt oder rotiert – ohne klassische Achterbahnstrecke.',
    definition:
      'Als Flat Ride bezeichnet man eine Kategorie von Fahrgeschäften, die auf einer weitgehend horizontalen Ebene ohne erhöhte Fahrstrecke betrieben werden. Der Begriff umfasst Drehattraktionen (Karussells, Teacups, Drehscheiben), Pendel- und Schwingattraktionen (Top Spins, Frisbees, Wellenflieger), Drop Towers sowie kreisförmige Drehplattformen. Im Gegensatz zu Achterbahnen haben Flat Rides meist einen kompakten Platzbedarf und eignen sich hervorragend zur Ausfüllung kleinerer Parkbereiche. Viele Flat Rides bieten hohe Stundendurchsätze, niedrige oder keine Mindestgrößenanforderungen und eine breite Alterseignung – sie bilden häufig das Rückgrat des Familien- und Kinderangebots eines Parks.',
    relatedTermIds: ['swing-ride', 'drop-tower', 'ride-capacity', 'height-requirement'],
    aliases: ['Flat Rides', 'Fahrgeschäft', 'Kirmesspiel', 'flat ride'],
  },
  {
    id: 'water-ride',
    name: 'Wasserfahrt',
    shortDefinition:
      'Attraktion, bei der Gäste in Booten oder Fahrzeugen durch Wasser fahren und dabei nass werden können.',
    definition:
      'Als Wasserfahrt bezeichnet man Attraktionen, bei denen Wasser ein zentraler Bestandteil des Erlebnisses ist – entweder fahren die Fahrzeuge durch einen Wasserkanal, oder Wasser wird als gezielter Effekt eingesetzt. Die drei häufigsten Typen sind: Wildwasserbahnen (Bootsfahrten durch Kanäle mit Steilabfall), Wildwasser-Rafting-Bahnen (kreisförmige Boote durch künstliche Stromschnellen) und Spritz-Battles (Gäste beschießen sich gegenseitig mit Wasserkanonen). Wasserfahrten haben in der Regel niedrige Mindestgrößenanforderungen und eine sehr breite Zielgruppe. An heißen Sommertagen können die Wartezeiten extrem lang werden.',
    relatedTermIds: ['log-flume', 'river-rapids', 'ride-capacity', 'height-requirement'],
    aliases: ['Wasserattraktion', 'Nassattraktion', 'Aquattraktion', 'water ride'],
  },
  {
    id: 'live-show',
    name: 'Live-Show',
    shortDefinition:
      'Geplante Aufführung mit lebenden Darstellern, Musik, Stunts oder Charakteren in einem Vorführungsbereich.',
    definition:
      'Eine Live-Show ist ein zu festen Zeiten stattfindendes Unterhaltungsprogramm, das von menschlichen Cast-Mitgliedern aufgeführt wird – im Gegensatz zu Fahrattraktionen oder festen Exponaten. Spielorte sind offene Amphitheater, geschlossene Theater oder Straßenauftrittsflächen. Das Spektrum reicht von Broadway-ähnlichen Bühnenshows und Stuntshows über Charakter-Paraden und 4D-Erlebnisse mit Live-Elementen bis hin zu Laser- und Feuerwerksshows. Im Gegensatz zu Attraktionen finden Live-Shows zu festen Uhrzeiten statt und haben begrenzte Zuschauerkapazitäten. Strategisch sind Shows eine willkommene Pause in ruhigeren Zeiten – insbesondere mittags, wenn die Wartezeiten an Attraktionen am längsten sind.',
    relatedTermIds: ['themed-land', 'pre-show', 'ride-capacity'],
    aliases: ['Show', 'Live-Entertainment', 'Bühnenshow', 'Stuntshow', 'Vorstellung', 'Liveshow'],
  },
  {
    id: 'quick-service',
    name: 'Schnellrestaurant',
    shortDefinition: 'Selbstbedienungsrestaurant ohne Bedienung am Tisch.',
    definition:
      'Ein Schnellrestaurant (auch Counter Service oder Fast Casual) bezeichnet Parkrestaurants, bei denen Gäste an einer Theke bestellen und ihr Essen selbst zum Tisch tragen. Es ist die häufigste Restaurantform in Freizeitparks und bietet Schnelligkeit und Komfort. Disney popularisierte den Begriff „Quick Service" zur Unterscheidung vom „Table Service" in seinem Dining-Reservierungssystem.',
    relatedTermIds: ['table-service', 'character-dining'],
    aliases: ['Counter Service', 'Fast Food', 'Selbstbedienung', 'quick service', 'Imbiss'],
  },
  {
    id: 'table-service',
    name: 'Tischservice',
    shortDefinition: 'Sitzrestaurant mit Bedienung, bei dem Reservierungen oft erforderlich sind.',
    definition:
      'Tischservice-Restaurants in Freizeitparks bieten ein vollständiges Sitzessen mit Bedienung. Reservierungen (bei Disney-Parks oft 60–180 Tage im Voraus buchbar) sind dringend empfohlen, da beliebte Restaurants, besonders in der Hochsaison, schnell ausgebucht sind. Tischservice ist deutlich teurer als Schnellrestaurants, bietet aber höhere Qualität und eine entspannte Atmosphäre.',
    relatedTermIds: ['quick-service', 'character-dining', 'peak-season'],
    aliases: [
      'Table Service',
      'Sitzrestaurant',
      'Restaurant mit Bedienung',
      'Reservierungsrestaurant',
      'table service',
    ],
  },
  {
    id: 'character-dining',
    name: 'Character Dining',
    shortDefinition: 'Restaurant, bei dem Kostümcharaktere die Tische der Gäste besuchen.',
    definition:
      "Character Dining ist ein Tischservice- (oder gelegentlich Buffet-)Restauranterlebnis, bei dem Kostümcharaktere jeden Tisch besuchen, mit Gästen interagieren, Fotos machen und Autogramme geben. Es garantiert Charakterbegegnungen ohne separates Warteschlangenanstehen, was es bei Familien besonders beliebt macht. Beispiele: Chef Mickey's (Disney World) und das Prinzessinnen-Dinner in der Auberge de Cendrillon (Disneyland Paris).",
    relatedTermIds: ['table-service', 'character-meet-and-greet', 'quick-service'],
    aliases: [
      'Character Dining',
      'Character Meal',
      'Frühstück mit Charakteren',
      'Dinner mit Charakteren',
      'character dining',
    ],
  },
  {
    id: 'drop-tower',
    name: 'Drop Tower',
    shortDefinition:
      'Turmattraktion, die Gäste in die Höhe befördert und in einem rasanten freien Fall absinken lässt.',
    definition:
      'Ein Drop Tower (auch Freifallturm oder Free-Fall-Tower) ist eine Attraktion, bei der Fahrgäste in einer Gondel oder einzelnen Sitzen rund um einen zentralen Turmaufbau in die Höhe gefahren und dann in einem raschen Sturz nach unten entlassen werden. Der Absturz kann nahezu schwerelos (echter freier Fall), gebremst oder in Kombination mit einem Katapultstart nach oben erfolgen. Am unteren Ende bremst das System die Gondel sanft ab. Varianten umfassen rotierende Drop Towers, Mehrachsen-Modelle und Hybrid-Versionen. Drop Towers bieten intensive Erlebnisse auf kleiner Grundfläche und sind weltweit verbreitet. Bekannte Hersteller sind Intamin, Mondial und S&S Worldwide.',
    relatedTermIds: ['flat-ride', 'height-requirement', 's-and-s-worldwide', 'intamin'],
    aliases: ['Freifallturm', 'Free-Fall-Tower', 'Freefall', 'Drop Ride', 'Freifall-Attraktion'],
  },
  {
    id: 'log-flume',
    name: 'Wildwasserbahn',
    shortDefinition:
      'Wasserkanal-Attraktion, bei der bootförmige Fahrzeuge durch einen Kanal fahren und mit einem Steilabfall enden.',
    definition:
      'Eine Wildwasserbahn (auch Flossfahrt oder Logflume) ist eine Wasserattraktion, bei der Gäste in bootförmigen Fahrzeugen – traditionell Baumstamm-förmigen Kunststoffbooten – durch einen wasserführenden Kanal gleiten. Nach mehreren ruhigeren Abschnitten folgt ein steiler Abfall, bei dem das Boot in einen Wassertrog eintaucht und Fahrgäste garantiert nass macht. Wildwasserbahnen wurden in den 1960er Jahren eingeführt und sind heute in fast jedem Freizeitpark zu finden. Sie gelten als familienfreundlich, haben moderate Stundendurchsätze und sind klassische Sommerattraktionen. Bekannte europäische Beispiele: Poseidon im Europa-Park sowie zahlreiche Wildwasserbahn-Anlagen in deutschsprachigen Parks.',
    relatedTermIds: ['water-ride', 'river-rapids', 'height-requirement'],
    aliases: ['Flossfahrt', 'Logflume', 'Log Flume', 'Bootsfahrt', 'wildwasserbahn'],
  },
  {
    id: 'river-rapids',
    name: 'Wildwasser-Rafting',
    shortDefinition:
      'Rundboot-Attraktion durch turbulente Wildwasserstrecken, bei der alle Mitfahrer nass werden können.',
    definition:
      'Eine Wildwasser-Rafting-Bahn (auch Wild-Water-Ride oder River-Rapids-Bahn) befördert Gäste in kreisförmigen aufblasbaren oder Kunststoffbooten durch einen künstlich angelegten Kanal, der Wildwasser-Stromschnellen simuliert. Da das kreisförmige Boot frei auf der Strömung rotiert, ist jede Fahrt unvorhersehbar: Je nach Position des Bootes werden manche Mitfahrer komplett durchnässt, andere bleiben relativ trocken. Wildwasser-Rafting-Bahnen bieten hohen Stundendurchsatz und große Familieneignung bei meist niedrigen Mindestgrößen. Bekannte europäische Beispiele sind die Wildwasser-Attraktionen im Phantasialand sowie Anlagen in Efteling, Europa-Park und Thorpe Park.',
    relatedTermIds: ['water-ride', 'log-flume', 'height-requirement'],
    aliases: [
      'Wildwasserfahrt',
      'Wild Water Ride',
      'Rafting-Bahn',
      'River Rapids',
      'Rundboot-Bahn',
    ],
  },
  {
    id: 'swing-ride',
    name: 'Kettenkarussell',
    shortDefinition:
      'Rotierende Attraktion, bei der kettenaufgehängte Sitze beim Drehen nach außen schwingen.',
    definition:
      'Ein Kettenkarussell (auch Kettenflieger oder Wellenflieger) ist eine rotierende Attraktion, bei der Sitze an Ketten von einer zentralen Drehstruktur aufgehängt sind. Beim Drehen werden die Sitze durch die Fliehkraft nach außen und oben geschleudert und vermitteln Fahrgästen das Gefühl des Fliegens. Kettenkarussells gehören zu den ältesten noch verbreiteten Jahrmarktsfahrgeschäften und gehen bis ins frühe 20. Jahrhundert zurück. Moderne Versionen reichen von sanften Kinderkarussells bis hin zu riesigen Kettenturm-Anlagen (Starflyer), die Fahrgäste auf beachtliche Höhen heben. Sie sind in nahezu jedem Freizeitpark und auf Jahrmärkten weltweit anzutreffen.',
    relatedTermIds: ['flat-ride', 'ride-capacity', 'height-requirement'],
    aliases: [
      'Kettenflieger',
      'Wellenflieger',
      'Hängekarussell',
      'Swing Ride',
      'Chairoplane',
      'Kettenflug',
    ],
  },
  {
    id: 'racing-coaster',
    name: 'Racing Coaster',
    shortDefinition:
      'Zwei parallele Achterbahn-Strecken, auf denen Züge gleichzeitig starten und Seite an Seite fahren.',
    definition:
      'Ein Racing Coaster verfügt über zwei separate, aber spiegelbildliche Achterbahn-Strecken, die parallel zueinander verlaufen. Züge werden gleichzeitig losgeschickt, sodass Fahrgäste das Gefühl haben, gegen den anderen Zug zu rennen. Die Strecken überkreuzen sich oder verlaufen an mehreren Punkten extrem nah aneinander, um die Wettbewerbsspannung zu maximieren. Einige Racing Coaster sind als Möbius-Loop konzipiert: Beide Strecken bilden eine einzige zusammenhängende Schleife, sodass Fahrgäste automatisch die Seite wechseln. Das Format funktioniert sowohl mit Holz- als auch mit Stahlachterbahnen. Bekannte europäische Beispiele sind Piraten im Djurs Sommerland und Dwervelwind im Plopsaland.',
    relatedTermIds: ['wooden-coaster', 'steel-coaster', 'credit'],
    aliases: [
      'Paarachterbahn',
      'Twin Coaster',
      'Dueling Coaster',
      'Rennachterbahn',
      'racing coaster',
    ],
  },
  {
    id: 'high-five',
    name: 'High Five',
    shortDefinition:
      'Achterbahn-Element, bei dem zwei Züge auf parallelen Strecken in Armreichweite aneinander vorbeifahren.',
    definition:
      'Ein High Five ist ein Beinahekollisions-Element bei Achterbahnen, bei dem zwei Züge auf separaten, aber eng benachbarten Strecken in extremer Nähe – manchmal in Armreichweite – aneinander vorbeifahren. Der Name leitet sich von der Empfindung ab, dass Fahrgäste die Insassen des anderen Zuges „abklatschen" könnten. Das Element erfordert präzise Abfahrtssteuerung, um beide Züge zur richtigen Zeit am Kreuzungspunkt zusammenzuführen. Wing Coaster und Inverted Coaster eignen sich besonders gut für High-Five-Elemente, da die außenliegenden Sitze den Nahbereichseffekt verstärken. Duelling Dragons / Dragon Challenge in Universal\'s Islands of Adventure war ein bekanntes frühes Beispiel; das Element findet sich heute an verschiedenen B&M-Wing-Coastern weltweit.',
    relatedTermIds: ['wing-coaster', 'inverted-coaster', 'b-and-m'],
    aliases: [
      'Beinahe-Kollisions-Element',
      'Near Miss',
      'Near-Miss-Element',
      'high five',
      'Nearfly',
    ],
  },
  {
    id: 'dining-reservation',
    name: 'Tischreservierung',
    shortDefinition:
      'Vorab-Buchung für ein Tischservice-Restaurant in einem Freizeitpark oder Resort.',
    definition:
      'Eine Tischreservierung ist die Vorab-Buchung eines Platzes in einem Tischservice- oder Charakter-Dinner-Restaurant in einem Freizeitpark, Resort-Hotel oder angeschlossenen Unterhaltungskomplex. Bei Disney-Parks sind Reservierungen bis zu 60 Tage im Voraus möglich (für Resort-Hotel-Gäste mit bis zu 10 Tagen Vorsprung) und für die beliebtesten Restaurants praktisch unerlässlich – wer nicht rechtzeitig bucht, findet in Stoßzeiten oft keine Plätze mehr. Reservierungen werden meist mit einer Kreditkarte gesichert; bei Disney gilt eine Stornierungsgebühr bei Nichterscheinen oder zu kurzfristiger Absage. In der Enthusiasten-Community wird die Vorabreservierung häufig mit ADR (Advance Dining Reservation) abgekürzt.',
    relatedTermIds: ['table-service', 'character-dining', 'peak-season'],
    aliases: [
      'ADR',
      'Advance Dining Reservation',
      'Restaurantreservierung',
      'dining reservation',
      'Tischbuchung',
    ],
  },
  {
    id: 'mobile-ordering',
    name: 'Mobile Bestellung',
    shortDefinition:
      'App-Funktion, mit der Gäste Essen vorbestellen und bezahlen – ohne an der Theke Schlange stehen zu müssen.',
    definition:
      'Die mobile Bestellung ermöglicht es Gästen, über die offizielle Park-App ein Restaurantmenü zu durchsuchen, eine Bestellung aufzugeben, zu bezahlen und ein Abholzeitfenster zu wählen – ohne an der Theke anstehen zu müssen. Disney hat das System in seinen Schnellrestaurants eingeführt; Universal, Six Flags, Merlin-Parks und viele weitere Betreiber haben inzwischen eigene Varianten entwickelt. Wenn das gewählte Zeitfenster erreicht ist, erhalten Gäste eine App-Benachrichtigung und holen ihre Bestellung am Mobile-Order-Abholschalter ab. Besonders zu Mittagsstoßzeiten spart die mobile Bestellung erheblich Zeit. Voraussetzung sind ein geladenes Smartphone und ausreichende Netzabdeckung im Park.',
    relatedTermIds: ['quick-service', 'dining-reservation'],
    aliases: ['Mobile Order', 'App-Bestellung', 'mobile ordering', 'Mobile-Bestellung'],
  },
  {
    id: 'food-court',
    name: 'Food Court',
    shortDefinition:
      'Großer gemeinsamer Essbereich mit mehreren Schnellrestaurant-Theken verschiedener Küchen unter einem Dach.',
    definition:
      'Ein Food Court ist ein gemeinsamer Gastronomiebereich mit mehreren eigenständigen Schnellrestaurant-Theken oder Imbissständen, die verschiedene Küchen anbieten und einen gemeinsamen Sitzbereich teilen. In Freizeitparks sind Food Courts in der Regel die gastronomiestärksten Bereiche und darauf ausgelegt, das mittägliche Besuchervolumen zu bewältigen. Verschiedene Mitglieder einer Gruppe können an unterschiedlichen Theken bestellen und trotzdem zusammensitzen. Die thematische Gestaltung variiert: Disney und Universal integrieren Food Courts oft in die Landthematik, während andere Parks sie als rein funktionale Rastbereiche nahe Eingangsbereichen betreiben. Food Courts sind in der Regel die günstigste Verpflegungsoption innerhalb eines Parks.',
    relatedTermIds: ['quick-service', 'table-service', 'mobile-ordering'],
    aliases: ['Gastronomiehof', 'Essensbereich', 'food court', 'Fressmeile', 'Speisehalle'],
  },
  {
    id: 'capacity-closure',
    name: 'Kapazitätsschließung',
    shortDefinition:
      'Wenn ein Park keine neuen Besucher mehr einlässt, weil die maximale Besucherzahl erreicht wurde.',
    definition:
      'Eine Kapazitätsschließung (auch Ausverkauf oder Kapazitätsobergrenze) tritt auf, wenn ein Freizeitpark seine maximal zulässige oder betrieblich sichere Besucherzahl erreicht und vorübergehend keine Tagestickets mehr verkauft oder keine neuen Gäste einlässt. Parks steuern die Kapazität über zeitgebundene Eintrittsbuchungen, Echtzeit-Besucherzählung und temporäre Eingangsschließungen. Inhaber von Jahreskarten können an Kapazitätstagen je nach Park-Regelung vom Einlass ausgeschlossen sein; andere Parks nutzen Reservierungssysteme, die Überfüllung bereits im Voraus verhindern. Kapazitätsschließungen sind am häufigsten in Schulferienspitzen, bei Sonderveranstaltungen und an Feiertagen. Ein Blick in die Park-App oder die sozialen Medien am Morgen des Besuchs kann Überraschungen vermeiden.',
    relatedTermIds: ['peak-season', 'annual-pass', 'school-holiday', 'crowd-level'],
    aliases: [
      'Park ausverkauft',
      'Kapazitätsgrenze',
      'capacity closure',
      'Park voll',
      'Ausverkauft-Tag',
    ],
  },
  {
    id: 'zero-g-winder',
    name: 'Zero-G Winder',
    shortDefinition:
      'Eine Zero-G-Roll-Variante mit integriertem Richtungswechsel — der Zug verlässt die Inversion auf einem anderen Kurs als er eingefahren ist.',
    definition:
      "Der Zero-G Winder verbindet die schwebende Sensation eines Zero-G Rolls mit einem Richtungswechsel in der Streckengeometrie. Während beim klassischen Zero-G Roll der Zug parallel ein- und ausfährt, kurven beim Winder die Schienen während der Drehung so, dass der Zug in eine deutlich andere Richtung zeigt, als er das Element begonnen hat. Damit erfüllt das Element zwei Funktionen gleichzeitig: Es liefert die Schwerelosigkeit einer Inversion und leitet den Coaster gleichzeitig in den nächsten Streckenabschnitt über.\n\nZero-G Winder sind vor allem auf moderneren, technisch anspruchsvollen Coaster-Designs zu finden, die von Herstellern wie Intamin und B&M gebaut werden. Kondaa im Walibi Belgium und VelociCoaster in Universal's Islands of Adventure zählen zu den bekanntesten Beispielen. Die Kombination aus Airtime, Inversion und Richtungsänderung in einem einzigen Element macht den Zero-G Winder zu einem der vielschichtigsten Elemente im modernen Achterbahnbau.",
    relatedTermIds: ['zero-g-roll', 'inversion', 'airtime', 'intamin'],
    aliases: ['Zero G Winder', 'Zero-G-Winder', 'Winder'],
  },
  {
    id: 'banana-roll',
    name: 'Banana Roll',
    shortDefinition:
      'Ein gestrecktes Doppel-Inversions-Element, bei dem zwei Inversionen durch einen langen geschwungenen Bogen verbunden sind — von oben betrachtet in der Form einer Banane.',
    definition:
      'Der Banana Roll ist eine gestreckte Variante des Doppel-Inversions-Konzepts: Die zwei Überschläge sind weiter auseinander positioniert und durch einen geschwungenen Bogen verbunden, anstatt wie beim Cobra Roll eng und symmetrisch aufeinanderzufolgen. Von oben betrachtet folgt die Strecke einem sanften Bogen durch beide Inversionen, der an die Form einer Banane erinnert. Durch die lockere Geometrie verteilen sich die zwei Inversionen über einen längeren Streckenabschnitt, was dem Fahrer ein fließenderes, ausgedehnteres Erlebnis durch beide Überschläge verschafft.\n\nDer Banana Roll wurde erstmals 2011 auf Takabisha in Fuji-Q Highland, Japan von Gerstlauer realisiert. S&S Worldwide entwickelte später eine eigene, doppelt invertierende Variante für Steel Curtain im Kennywood. Da das Element erheblichen lateralen Raum benötigt, findet es sich meist in größeren, bodennah gebauten Anlagen, wo die Strecke weit ausschwingen kann.',
    relatedTermIds: ['cobra-roll', 'inversion', 'gerstlauer', 's-and-s-worldwide'],
    aliases: ['Banana Roll'],
  },
  {
    id: 'inclined-loop',
    name: 'Geneigter Looping',
    shortDefinition:
      'Ein vertikaler Looping, der aus der Senkrechten gekippt ist — der Zug fährt schräg ein und aus statt geradeaus.',
    definition:
      'Ein geneigter Looping (englisch: Inclined Loop oder Tilted Loop) ist ein klassischer vertikaler Looping, der um seine Achse gedreht wurde — typischerweise um 45 bis 80 Grad relativ zur Fahrtrichtung. Statt dass der Zug den Looping geradeaus einleitet und verlässt, nähert er sich und verlässt das Element schräg, was sowohl ein asymmetrisches Erscheinungsbild als auch eine deutlich veränderte Fahrerfahrung erzeugt.\n\nDie gekippte Geometrie beeinflusst das Empfinden der Inversion: Die Einfahrt fühlt sich lateraler an als beim klassischen Looping, und die Ausleitung am Tiefstobjekt kommt aus einer anderen Richtung als erwartet — das kann sowohl orientierungsberaubend als auch aufregend sein. Für Zuschauer ist ein geneigter Looping sofort als ungewöhnlich erkennbar und wirkt visuell deutlich dramatischer als ein aufrechter Looping. Geneigte Loopings finden sich auf verschiedenen B&M- und Intamin-Coasters, oft im mittleren oder abschließenden Teil der Strecke.',
    relatedTermIds: ['vertical-loop', 'inversion', 'b-and-m', 'intamin'],
    aliases: ['Tilted Loop', 'schräger Looping', 'geneigter Loop', 'inclined loop'],
  },
  {
    id: 'sea-serpent',
    name: 'Sea Serpent',
    shortDefinition:
      'Ein Vekoma-Doppel-Inversions-Element, bei dem der Zug in dieselbe Richtung ausfährt, in die er eingefahren ist.',
    definition:
      'Der Sea Serpent ist ein Doppel-Inversions-Element, das vor allem mit Vekomas Inverted-Coaster-Designs verbunden ist. Ähnlich wie der Cobra Roll besteht er aus zwei Inversionen, die durch einen mittleren Verbindungsabschnitt zusammengefügt sind — jedoch unterscheidet sich die Streckengeometrie wesentlich: Während der Cobra Roll den Zug um 180 Grad umdreht, verlässt der Zug beim Sea Serpent das Element in derselben allgemeinen Richtung, in der er es betreten hat. Die beiden Inversionen schwingen bogenförmig auf und über, ohne die Fahrtrichtung zu wechseln, was dem Element von der Seite ein langes, S-kurvenartiges Erscheinungsbild gibt — wie der Körper einer Seeschlange, der durch zwei Wellen aufsteigt.\n\nSea Serpents sind Bestandteil von Vekomas Suspended Looping Coaster (SLC) und einigen Sonderanlagen des Herstellers. Da der SLC in großer Stückzahl produziert wurde, ist der Sea Serpent eines der am weitesten verbreiteten Doppel-Inversions-Elemente weltweit — auch wenn er namentlich weniger bekannt ist als der Cobra Roll.',
    relatedTermIds: ['inversion', 'cobra-roll', 'batwing', 'vekoma'],
    aliases: ['Sea Serpent', 'Roll Over'],
  },
  {
    id: 'barrel-roll-drop',
    name: 'Barrel Roll Drop',
    shortDefinition:
      'Ein RMC-Signaturelement, das ersten Abfall und vollständigen Barrel Roll zu einer einzigen Sequenz verschmilzt — der Zug überschlägt sich während er noch fällt.',
    definition:
      'Der Barrel Roll Drop ist eines der bekanntesten Signaturelemente von Rocky Mountain Construction und verbindet zwei normalerweise getrennte Erlebnisse — den ersten Sturz und eine vollständige Inversion — zu einer ununterbrochenen Sequenz. Nach dem Verlassen des Liftbergs dreht die Strecke den Zug durch einen kompletten Barrel Roll, während er gleichzeitig abfällt: Die Fahrgäste befinden sich nahe dem steilsten Punkt des Abfalls vollständig auf dem Kopf, bevor sie beim Erreichen des Tiefpunkts wieder aufgerichtet werden. Die Inversion ereignet sich bei hoher Geschwindigkeit, da der Zug im selben Moment beschleunigt, in dem er sich dreht.\n\nErmöglicht wurde das Element durch RMCs I-Box-Stahlschienensystem, das die engen Radien und komplexe dreidimensionale Geometrie für einen simultanen Roll und Abfall erlaubt — eine Kombination, die auf traditionellem Holzachterbahngleis strukturell unmöglich gewesen wäre. Medusa Steel Coaster im Six Flags Mexico gehörte zu den frühen Anlagen mit diesem Element; Steel Vengeance im Cedar Point und Zadra im Energylandia sind weitere gefeierte Beispiele.',
    relatedTermIds: ['inversion', 'rmc', 'first-drop', 'hybrid-coaster', 'stall'],
    aliases: ['Barrel Roll Drop', 'RMC Barrel Roll', 'Barrel Roll Downdrop'],
  },
  {
    id: 'mcbr',
    name: 'MCBR',
    shortDefinition:
      'Mittelstreckenbremse — eine Bremszone in der Mitte der Strecke, die den Zug vollständig anhalten kann, um den sicheren Mehrzugbetrieb zu ermöglichen.',
    definition:
      'Eine Mittelstreckenbremse (englisch: Mid-Course Brake Run, kurz MCBR) ist eine Bremsanlage, die irgendwo in der Mitte einer Achterbahn-Strecke installiert ist — nach den ersten großen Elementen, aber vor der Abschlusssequenz. Anders als Trimbremsen, die lediglich die Geschwindigkeit reduzieren und den Zug unmittelbar weiterfahren lassen, ist eine MCBR eine vollständige Blockabschnitts-Bremse: Sie kann den Zug vollständig anhalten und halten, bis der nächste Blockabschnitt davor als frei gemeldet wurde. Dies ermöglicht den gleichzeitigen Betrieb mehrerer Züge auf derselben Strecke ohne Kollisionsgefahr und steigert erheblich den Durchsatz der Anlage.\n\nAn einem betriebsreichen Tag mit voll ausgelasteten Zugfolgen gibt eine gut getimte MCBR den angehaltenen Zug fast sofort wieder frei, und die Fahrgäste bemerken kaum die kurze Verzögerung. An ruhigeren Betriebstagen mit weniger Zügen kann der Stopp länger andauern und abrupter wirken. MCBRs sind Standard auf den meisten großen Achterbahnen: B&M Inverted- und Floorless-Coaster, viele Intamin-Anlagen und andere Hochkapazitätsattraktionen nutzen sie routinemäßig.',
    relatedTermIds: ['block-brake', 'brake-run', 'trim-brake', 'stacking', 'ride-capacity'],
    aliases: [
      'Mittelstreckenbremse',
      'mid-course brake run',
      'Zwischenbremse',
      'Mittelbremse',
      'MCBR',
    ],
  },
  {
    id: 'interlocking-loops',
    name: 'Verschlungene Loops',
    shortDefinition:
      'Zwei vertikale Loops, deren Ebenen sich kreuzen — ein visuell spektakuläres Kettenglied- oder Acht-Muster.',
    definition:
      'Verschlungene Loops (englisch: Interlocking Loops) sind zwei vertikale Loops, die so angeordnet sind, dass sich ihre Strukturebenen schneiden — typischerweise nahezu rechtwinklig zueinander. Das Ergebnis ist eine beeindruckende visuelle Konfiguration, bei der ein Loop aus bestimmten Perspektiven scheinbar durch den anderen hindurch verläuft, wie ein Kettenglied oder eine überdimensionale Acht, die aus dem Boden aufsteigt. Der konstruktive Aufwand, zwei Loops so zu verschachteln, dass sich die Schienen nicht tatsächlich berühren, ist erheblich — der visuelle Effekt macht die Elemente jedoch zu einem markanten Blickfang im Parkpanorama.\n\nVerschlungene Loops werden am häufigsten mit B&M Inverted Coasters und Sitzachterbahnen mit hoher Inversionsanzahl assoziiert. Dragon Khan im PortAventura, lange einer der bekanntesten europäischen Coaster, weist verschlungene Loops als Teil seines acht-Inversions-Layouts auf, und der sich kreuzende Loops-Abschnitt gehört zu den meistfotografierten Streckenpassagen des Rides.',
    relatedTermIds: ['vertical-loop', 'inversion', 'b-and-m'],
    aliases: ['Verschlungene Loops', 'Interlocking Loops', 'sich kreuzende Loops'],
  },
  {
    id: 'anti-rollback',
    name: 'Anti-Rollback',
    shortDefinition:
      'Die Ratschensicherung am Liftberg, die verhindert, dass der Zug rückwärts rollt — Quelle des charakteristischen Click-Clack-Geräuschs.',
    definition:
      'Ein Anti-Rollback-System (auch Rollback-Sperrklinke oder Anti-Rollback-Dog) ist eine mechanische Sicherungsvorrichtung entlang der Unterseite eines Liftbergs. Während der Zug aufsteigt, rasten federbelastete Metallklinken — sogenannte „Dogs" — über eine Zahnreihe, die in die Liftberg-Struktur eingelassen ist. Falls die Kette oder der Antrieb versagen würde, würden die Klinken in den Zähnen einrasten und den Zug blockieren, sodass er nicht rückwärts abrutschen kann. Das Rasten der Klinken über die Zähne erzeugt das rhythmische Klick-Klack-Geräusch, das zu den bekanntesten akustischen Erkennungszeichen klassischer Achterbahnen gehört.\n\nBei modernen Bahnen mit lautlosen Kabelliften oder LSM-betriebenen Liftbergen werden Anti-Rollback-Klinken oft durch leise elektromagnetische Bremssysteme ersetzt — weshalb neuere Anlagen am Liftberg auffällig leiser sind. Enthusiasten vermissen dieses akustische Ritual manchmal als Teil des klassischen Achterbahn-Erlebnisses.',
    relatedTermIds: ['lifthill', 'rollback', 'launch-coaster'],
    aliases: ['Anti-Rollback-System', 'Rollback-Sperre', 'Click-Clack', 'Sperrklinke'],
  },
  {
    id: 'head-choppers',
    name: 'Head Choppers',
    shortDefinition:
      'Konstruktionselemente, die so knapp über den Köpfen der Fahrgäste vorbeiziehen, dass der Eindruck einer unmittelbaren Kollision entsteht.',
    definition:
      'Head Choppers sind bewusst eingesetzte Gestaltungselemente, bei denen Träger, Querstreben, Tunnel oder andere Streckenabschnitte in dem Moment knapp über den Köpfen der Fahrgäste vorbeiziehen, in dem der Zug in Höchstgeschwindigkeit unterwegs ist. Die Nähe und das Timing erzeugen eine starke Illusion drohender Gefahr — obwohl die Abstände exakt berechnet sind und keine echte Gefahr besteht. Der Effekt ist besonders stark, wenn Fahrgäste unvorbereitet sind: Ein Zug, der aus einer geneigten Kurve herausbeschleunigt, kann unter einem tiefen Träger hindurchschießen, bevor das Gehirn die Situation einordnen kann.\n\nHead Choppers sind vor allem mit eng gebauten Holzachterbahnen und mit Inverted Coasters verbunden, wo die hängenden Beine der Fahrgäste und das tief liegende Profil der Züge besonders nahe an Stützen, Stationsgebäude und andere Streckenabschnitte heranführen. Für viele Enthusiasten sind gut gemachte Head Choppers ein Zeichen kreativer Streckenführung.',
    relatedTermIds: ['roller-coaster-element', 'inverted-coaster', 'twister-coaster'],
    aliases: ['Head Chopper', 'Beinahe-Kollision', 'Near Miss'],
  },
  {
    id: 'stapling',
    name: 'Stapling',
    shortDefinition:
      'Wenn ein Ride-Operator Schulterbügel oder Schoßbügel zu fest anzieht — wodurch Komfort und Airtime verloren gehen.',
    definition:
      'Stapling bezeichnet die Praxis — ob absichtlich oder übervorsichtig — eines Operators, der einen Schoßbügel oder Schulterbügel so fest gegen den Fahrgast drückt, dass er deutlich enger sitzt als für die Sicherheit notwendig. Der Begriff leitet sich vom Gefühl ab, in den Sitz „geheftet" zu sein. Bei Airtime-orientierten Achterbahnen sollen Schoßbügel so locker sitzen, dass Fahrgäste an den Kammkuppen tatsächlich leicht vom Sitz abheben können — das ist Airtime. Wer gestapelt ist, wird während der gesamten Fahrt flach in den Sitz gepresst und kann das beabsichtigte Schwebebefühl nicht erleben, egal wie gut die Hügel gestaltet sind.\n\nStapling ist ein häufiger Kritikpunkt in der Enthusiasten-Community, insbesondere bei Holzachterbahnen und Hybrid-Coastern, wo Airtime die Hauptattraktion ist. Manche Parks sind für konsequent lockere, fahrerfreundliche Bügelpolitik bekannt; andere werden für systematisches Überzurren kritisiert.',
    relatedTermIds: ['lap-bar', 'shoulder-harness', 'airtime', 'ejector-airtime'],
    aliases: ['Stapled', 'Überstapeln', 'zu fester Bügel', 'Bügel zu eng'],
  },
  {
    id: 'valleying',
    name: 'Valleying',
    shortDefinition:
      'Wenn ein Achterbahn-Zug auf der Strecke so viel Schwung verliert, dass er in einem Tiefpunkt stecken bleibt und das Ziel nicht erreichen kann.',
    definition:
      'Valleying (deutsch: „im Tal stecken bleiben") tritt auf, wenn ein Zug während der Fahrt zu viel kinetische Energie verliert, keinen ausreichenden Schwung mehr hat, um den nächsten Hügel oder das nächste Element zu überwinden, und zum Stillstand kommt — oder zurückrollt — in einem Tiefpunkt zwischen zwei Hochpunkten der Strecke. Da der Zug nun an einem Tiefpunkt steht und nicht an einer Bremsstrecke oder im Bahnhof, kann er mit den normalen Betriebssystemen nicht bewegt werden. Die Bergung erfordert in der Regel Wartungspersonal, das den Zug manuell über den nächsten Hochpunkt schiebt oder windet und die Fahrgäste evakuiert.\n\nValleying ist unter normalen Betriebsbedingungen selten, da Anlagen mit erheblichen Geschwindigkeitspuffern ausgelegt werden. Wahrscheinlicher tritt es bei ungewöhnlich kaltem Wetter auf (wenn Radlager steif laufen), bei zu vielen Trimbremsen oder auf gealtertem Streckenbelag, dessen Geometrie sich verschoben hat.',
    relatedTermIds: ['rollback', 'trim-brake', 'brake-run', 'downtime'],
    aliases: ['Valleyed', 'im Tal feststecken', 'stecken gebliebener Zug'],
  },
  {
    id: 'wild-mouse',
    name: 'Wilde Maus',
    shortDefinition:
      'Ein Achterbahntyp mit kleinen Einzelwagen und engen, flachen Spitzkurven an den Kanten erhöhter Plattformen — das Gefühl, gleich herunterzufallen, ist Programm.',
    definition:
      'Eine Wilde Maus (englisch: Wild Mouse) nutzt kleine Wagen für zwei bis vier Personen statt langer Züge. Das Markenzeichen ist eine Reihe enger, kaum überhöhter Haarnadel-Kurven, die an den äußersten Kanten der Strecke ausgeführt werden. Da die Kurven nicht steil überhöht sind — anders als bei anderen Achterbahnen — werden Fahrgäste seitlich gegen die Wagenwand gedrückt, und die Trägheit der Anfahrt lässt die Kurve später als erwartet kommen. Dies erzeugt überzeugend das Gefühl, gleich von der Strecke zu rutschen.\n\nWilde-Maus-Achterbahnen gehören zu den platzsparendsten Designs überhaupt und verpacken erstaunlich viel Strecke in ein kompaktes Gelände, indem die Haarnadel-Ebenen übereinander gestapelt werden. Sie sind in ganz Europa und weltweit verbreitet — insbesondere in Deutschland ist der Begriff „Wilde Maus" vielen Parkkunden geläufig. Hersteller sind unter anderem Mack Rides, Maurer und Gerstlauer.',
    relatedTermIds: ['spinning-coaster', 'steel-coaster', 'mack-rides', 'gerstlauer'],
    aliases: ['Wilde Maus', 'Wild Mouse', 'Mausbahn'],
  },
  {
    id: 'fourth-dimension-coaster',
    name: '4D-Coaster',
    shortDefinition:
      'Ein Achterbahntyp, bei dem die Sitze auf drehbaren Armen seitlich außerhalb des Zuges montiert sind und sich unabhängig von der Fahrtrichtung drehen können.',
    definition:
      'Ein Fourth-Dimension-Coaster (4D-Coaster) ist ein Achterbahn-Design, bei dem die Sitze nicht starr am Zug befestigt sind, sondern auf schwenkbaren Armen links und rechts vom Wagen sitzen. Die Sitze können sich vorwärts oder rückwärts drehen — entweder durch eine feste Steuerungsschiene neben der Hauptstrecke, die die Sitzposition zu jedem Moment des Layouts vorgibt, oder durch freie Rotation via Schwerkraft und Gewichtsverteilung der Fahrgäste. Das Ergebnis: Fahrgäste können während eines Abfalls nach unten zeigen, während einer Kurve auf dem Kopf stehen oder beim Durchfahren von Inversionen mehrere Achsen gleichzeitig rotieren.\n\nDas Konzept wurde von Arrow Dynamics entwickelt und später von S&S Worldwide verfeinert. X2 im Six Flags Magic Mountain (Kalifornien) ist der bekannteste 4D-Coaster weltweit, eröffnet 2002 als erster seiner Art. Eejanaika in Fuji-Q Highland, Japan, hält den Rekord für die meisten Inversionen einer Achterbahn — unter anderem dank der Sitzrotation, die die Inversionszählung vervielfacht.',
    relatedTermIds: [
      'inverted-coaster',
      'spinning-coaster',
      'arrow-dynamics',
      's-and-s-worldwide',
      'inversion',
    ],
    aliases: ['4D Coaster', '4D-Achterbahn', 'Fourth Dimension', 'Free Spin Coaster'],
  },
  {
    id: 'out-and-back',
    name: 'Out-and-Back',
    shortDefinition:
      'Ein Achterbahn-Layout, das von der Station geradeaus wegführt, am Ende des Geländes umdreht und parallel zurückführt.',
    definition:
      'Ein Out-and-Back ist einer der zwei grundlegenden Achterbahn-Layouttypen. Der Zug verlässt den Bahnhof, fährt in einer im Wesentlichen geraden Richtung heraus — typischerweise über eine Reihe von Hügeln, die für Airtime optimiert sind —, dreht am Ende des Geländes um und kehrt parallel zur Ausfahrtstrecke zurück. Die beiden Abschnitte kreuzen sich kaum und ergeben einen langen, schmalen Grundriss.\n\nOut-and-Back-Designs sind eng mit klassischen Holzachterbahnen verbunden, bei denen die auf der langen Ausfahrt aufgebaute Geschwindigkeit auf dem Rückweg durch eine Folge immer schnellerer, niedrigerer Hügel mit maximalem Floater-Airtime ausgenutzt wird. Zu den bekanntesten Beispielen zählen The Voyage im Holiday World und verschiedene Racer-Modelle. Stahlachterbahnen können ebenfalls Out-and-Back-Layouts folgen, obwohl dieser Stil im Stahlbereich weniger verbreitet ist.',
    relatedTermIds: ['twister-coaster', 'airtime', 'wooden-coaster', 'airtime-hill'],
    aliases: ['Out and Back', 'Out-and-Back-Layout', 'Hin-und-Rück-Coaster'],
  },
  {
    id: 'twister-coaster',
    name: 'Twister',
    shortDefinition:
      'Ein Achterbahn-Layout, das sich spiralförmig über sich selbst zurückfaltet und viele Elemente auf kompaktem Grundriss verpackt.',
    definition:
      'Ein Twister-Coaster (auch Cyclone-Layout) ist ein Achterbahn-Design, bei dem die Strecke spiralförmig verläuft, zurückfaltet und sich immer wieder über oder unter sich selbst kreuzt, anstatt dem einfachen Zwei-Bein-Pfad eines Out-and-Back-Layouts zu folgen. Das Kennzeichen ist, dass der Zug häufig in unmittelbarer Nähe anderer Streckenabschnitte desselben Rides vorbeifährt — oft in verschiedene Richtungen und auf verschiedenen Höhen —, was Head-Chopper-Effekte und visuelle Komplexität erzeugt.\n\nTwister-Layouts nutzen das Gelände effizient: Viel Streckenlänge und Höhenunterschied passen in einen relativ kompakten, annähernd quadratischen oder rechteckigen Grundriss. Holz-Twister-Classics sind unter anderem der Twister im Gröna Lund in Stockholm; Stahl-Twister umfassen viele B&M- und Intamin-Designs. Da der Zug ständig die Richtung wechselt, wirken Twister-Layouts tendenziell intensiver und visuell komplexer als Out-and-Back-Designs.',
    relatedTermIds: ['out-and-back', 'wooden-coaster', 'head-choppers', 'helix'],
    aliases: ['Twister-Layout', 'Cyclone-Layout', 'Twister Coaster'],
  },
];

export default translations;
