import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: 'Wartezeit',
    shortDefinition:
      'Die geschätzte Zeit, die ein Besucher warten muss, bevor er eine Attraktion betreten kann.',
    definition:
      'Die Wartezeit ist die Zeit, die ein Besucher zwischen dem Eintritt in die normale Warteschlange einer Attraktion und dem Einsteigen ansteht. Die Zahl auf der Tafel am Eingang und in der App des Parks ist eine Schätzung, die der Park selbst festlegt, aus der Länge der Warteschlange und dem Tempo, mit dem gerade eingestiegen wird. Manche Parks prüfen sie, indem sie einem Gast am Ende der Warteschlange eine Karte mit Uhrzeit mitgeben und sie am Bahnsteig wieder einsammeln.\n\npark.fan liest die angezeigte Wartezeit jeder Attraktion alle fünf Minuten aus drei öffentlichen Quellen: ThemeParks.wiki, Wartezeiten.app und Queue-Times.com. Weichen sie voneinander ab, entscheidet die Mehrheit, dann der Median, dann der Mittelwert, und das Ergebnis wird auf fünf Minuten gerundet, so wie die Parks sie anzeigen. Jede Messung wird gespeichert. Aus diesen Messungen entstehen die typischen Wartezeiten auf den Attraktionsseiten, die Besucherdichte und die Prognosen.\n\nEin Park, der keine Wartezeiten veröffentlicht, hat auch auf park.fan keine.',
    relatedTermIds: ['express-pass', 'posted-wait-time', 'single-rider', 'virtual-queue'],
    aliases: ['Wartezeiten', 'Wartezeit-Daten'],
    alternateNames: ['Wartezeit in der Warteschlange', 'Queue Time', 'Queue Times'],
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'Eine eigene Warteschlange für Besucher, die allein fahren und damit einzelne freie Plätze füllen.',
    definition:
      'Die Single-Rider-Spur ist für alle, die getrennt von ihrer Gruppe fahren, und füllt die einzelnen freien Plätze in den Zügen auf. Weil diese Fahrgäste in Lücken einsortiert werden, geht es dort schneller voran als in der normalen Warteschlange, die Wartezeit ist oft 50–70 % kürzer. Nicht jede Attraktion hat eine Single-Rider-Spur.',
    alternateNames: ['Single Rider Lane', 'Einzelfahrer', 'Single-Spur'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Single Riders'],
  },
  {
    id: 'virtual-queue',
    name: 'Virtuelle Warteschlange',
    shortDefinition:
      'Ein digitales Warteschlangensystem, bei dem Besucher eine Fahrzeit reservieren, statt in der Warteschlange anzustehen.',
    definition:
      'Bei einer virtuellen Warteschlange (auch Boarding-Gruppe oder Rückkehrzeit) melden sich Besucher über die Park-App oder an einem Kiosk für eine Attraktion an und bekommen eine Nachricht, wenn sie bald an der Reihe sind. Statt in einer echten Warteschlange zu stehen, kann man bis zum Aufruf der eigenen Gruppe woanders im Park sein. Parks setzen das bei ihren gefragtesten neuen Attraktionen ein, wo eine echte Warteschlange mehr Menschen an einer Stelle bündeln würde, als die Wege fassen. Eine virtuelle Warteschlange öffnet meist zu einer festen Uhrzeit, oft mit dem Einlass, und kann nach wenigen Minuten voll sein.',
    relatedTermIds: ['express-pass', 'single-rider', 'wait-time'],
    aliases: ['Virtuelle Warteschlangen'],
  },
  {
    id: 'express-pass',
    name: 'Express Pass',
    shortDefinition:
      'Ein kostenpflichtiges oder im Paket enthaltenes Ticket-Upgrade für eine kürzere Vorrang-Warteschlange.',
    definition:
      'Ein Express Pass ist ein Ticket-Upgrade, mit dem man einen eigenen Vorrangeingang nutzt und deutlich kürzer wartet. Der Name hängt vom Park ab: Universal Express, Disney Lightning Lane, Six Flags Flash Pass. Manche Parks packen den Express-Zugang in Premium-Hotelpakete, andere verkaufen ihn als Tageszusatz zu einem Preis, der steigt, je voller der Park wird. In den Universal-Studios-Parks lässt sich die unbegrenzte Variante den ganzen Tag über immer wieder an derselben Attraktion nutzen.',
    alternateNames: ['Flash Pass'],

    relatedTermIds: ['single-rider', 'virtual-queue', 'wait-time'],
    aliases: ['Express-Pass', 'Express-Pässe', 'Universal Express', 'Flash Pass'],
  },
  {
    id: 'posted-wait-time',
    name: 'Angezeigte Wartezeit',
    shortDefinition: 'Die offizielle Wartezeit, die der Park am Eingang einer Attraktion anzeigt.',
    definition:
      'Die angezeigte Wartezeit ist die offizielle Schätzung, die am Eingang einer Attraktion und in der Park-App steht. Die Parks berechnen sie aus der gemessenen Länge der Warteschlange, dem bisherigen Durchsatz der Bahn und dem Tempo, mit dem gerade beladen wird. park.fan führt die angezeigten Wartezeiten aus mehreren öffentlichen Quellen alle fünf Minuten zusammen.',
    relatedTermIds: ['crowd-level', 'wait-time'],
    aliases: ['Angezeigte Wartezeit', 'Angezeigte Wartezeiten'],
  },
  {
    id: 'crowd-level',
    name: 'Besucherdichte',
    shortDefinition:
      'Ein Maß dafür, wie voll ein Freizeitpark an einem bestimmten Tag ist, von „sehr niedrig“ bis „extrem“.',
    definition:
      'Die Besucherdichte beschreibt, wie voll ein Park an einem bestimmten Tag oder zu einer bestimmten Stunde ist. park.fan misst jeden Park an sich selbst: 100 % sind die Wartezeiten der großen Attraktionen an einem typischen Tag in diesem Park, und die aktuellen Wartezeiten werden als Anteil davon angegeben. Bis 60 % heißt „Sehr niedrig“, 61 bis 89 % „Niedrig“, 90 bis 110 % „Normal“, 111 bis 150 % „Hoch“, 151 bis 200 % „Sehr hoch“, alles darüber „Extrem“. Die Prognosetage im Besucherkalender nutzen dieselbe Skala.\n\nWeil jeder Park sein eigener Maßstab ist, steht „Extrem“ in einem kleinen Familienpark und im Disneyland Paris für unterschiedlich viele Minuten, aber für dieselbe Lage: Die Warteschlangen sind doppelt so lang wie üblich oder länger. Bewegt wird die Stufe von Schulferien, Feiertagen, Sonderveranstaltungen wie Halloween-Nächten oder Feuerwerken und vom Wetter.',
    relatedTermIds: ['crowd-calendar', 'peak-day', 'wait-time'],
    aliases: ['Besucherdichten', 'Besucherandrang', 'Crowd Level'],
    alternateNames: ['Crowd Level', 'Crowd Levels', 'Besucherandrang'],
  },
  {
    id: 'crowd-calendar',
    name: 'Besucherkalender',
    shortDefinition:
      'Eine Vorschau der erwarteten Besucherdichte, Tag für Tag, zum Planen eines Besuchs.',
    definition:
      'Ein Besucherkalender zeigt die kommenden Monate eines Parks als Raster aus Tagen, jeder in der Farbe der erwarteten Besucherdichte. Bei park.fan kommt die Farbe von Fancast, dem Prognosemodell, das park.fan selbst trainiert. Es rechnet für jede Attraktion und jede Stunde eines Tages eine erwartete Wartezeit aus und fasst sie zu einer Besucherdichte für den Tag zusammen, auf derselben Skala von „Sehr niedrig“ bis „Extrem“, die auch die Live-Anzeige nutzt.\n\nDas Modell lernt aus den Wartezeiten, die park.fan in dem Park gemessen hat. Dazu fließen der Wetterbericht, Schulferien, Feiertage und Brückentage in den Ländern, in denen die Parks stehen, in die Prognose ein, außerdem das Programm des Parks, etwa eine Halloween-Saison oder die ersten Tage des Jahres. Jeden Morgen um 06:00 UTC wird es mit den Wartezeiten des Vortags neu trainiert, deshalb kann sich die Farbe eines Datums ändern, je näher es rückt.\n\nDer Kalender reicht so weit wie der Zeitplan des Parks. Ein ganzjährig geöffneter Park bekommt eine Stufe für Tage, die fast ein Jahr entfernt sind, ein Saisonpark zeigt nach seinem veröffentlichten letzten Öffnungstag „Geschlossen“.',
    relatedTermIds: ['crowd-level', 'peak-day', 'rope-drop'],
    aliases: ['Besucherkalender', 'Crowd-Kalender', 'Crowd-Kalendar'],
  },
  {
    id: 'peak-day',
    name: 'Spitzentag',
    shortDefinition:
      'Ein Tag mit maximalen Besucherzahlen, typischerweise während Feiertagen oder Sonderveranstaltungen.',
    definition:
      'Ein Spitzentag ist ein Tag, an dem ein Park an oder nahe seiner Kapazitätsgrenze läuft. Typisch sind große Feiertage wie Ostern und die Tage um Weihnachten, Sonderveranstaltungen wie Halloween-Nächte oder das Silvesterfeuerwerk und die Wochen der Schulferien. An solchen Tagen stehen die großen Attraktionen im Disneyland Paris oder im Europa-Park regelmäßig bei 90 bis 120 Minuten, und vor den Restaurants bilden sich schon vor Mittag Warteschlangen. Im Besucherkalender von park.fan erscheinen solche Tage mit der Stufe „Sehr hoch“ oder „Extrem“.',
    aliases: ['Spitzentage'],
    alternateNames: ['Stoßzeiten', 'Hochbetrieb'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Renovierung',
    shortDefinition:
      'Eine geplante Schließungszeit, in der eine Attraktion oder ein Bereich gewartet oder modernisiert wird.',
    definition:
      'Eine Renovierung (unter Fans oft „Rehab“ genannt) ist ein geplanter Zeitraum für Wartung oder Umbau, in dem eine Attraktion, eine Show oder ein Parkbereich vorübergehend geschlossen ist. Renovierungen können von einigen Tagen bis zu mehreren Monaten dauern und werden in der Regel für die Nebensaison geplant. park.fan markiert Attraktionen, die derzeit renoviert werden.',
    aliases: ['Revisions'],
    alternateNames: ['Rehab', 'Wartungsschließung'],

    relatedTermIds: ['downtime', 'ride-capacity'],
  },
  {
    id: 'downtime',
    name: 'Betriebsstörung',
    shortDefinition:
      'Eine ungeplante, vorübergehende Schließung einer Attraktion wegen eines technischen Defekts oder einer Sicherheitsprüfung.',
    definition:
      'Eine Betriebsstörung ist die ungeplante, vorübergehende Schließung einer Attraktion. Eine Renovierung ist dagegen geplant. Ursachen sind technische Defekte, Sicherheitsüberprüfungen, Vorfälle mit Besuchern oder schlechtes Wetter. Die meisten Störungen dauern wenige Minuten bis einige Stunden. park.fan zeigt den aktuellen Betriebsstatus jeder Attraktion in Echtzeit an und unterscheidet zwischen „In Betrieb“, „Störung“, „Geschlossen“ und „Renovierung“.',
    alternateNames: ['Außer Betrieb', 'Technische Störung'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'wait-time'],
    aliases: ['Betriebsstörungen', 'Ausfälle'],
  },
  {
    id: 'ride-capacity',
    name: 'Kapazität',
    shortDefinition: 'Die Anzahl der Besucher, die eine Attraktion pro Stunde aufnehmen kann.',
    definition:
      'Die Kapazität einer Attraktion, auch Durchsatz, ist die Zahl der Fahrgäste, die sie unter guten Betriebsbedingungen pro Stunde befördern kann. Sie ergibt sich aus der Größe der Fahrzeuge, der Zahl der fahrenden Fahrzeuge, dem Tempo beim Ein- und Aussteigen und der Dauer eines Fahrzyklus. Karussells, Wildwasserbahnen und große Dark Rides schaffen 1.500 bis 2.000 Gäste pro Stunde, ein Dark Ride mit Einzelfahrzeugen oder eine Achterbahn mit nur einem Zug eher 500 bis 800. Die Kapazität bestimmt, wie schnell eine Warteschlange vorankommt: 30 Minuten Wartezeit bei 1.800 Gästen pro Stunde bewegen dreimal so viele Menschen wie dieselben 30 Minuten bei 600. Deshalb setzen Parks an vollen Tagen zusätzliche Züge oder Fahrzeuge ein.',
    relatedTermIds: ['downtime', 'refurbishment', 'wait-time'],
    aliases: ['Fahrgäste pro Stunde'],
  },
  {
    id: 'rope-drop',
    name: 'Rope Drop',
    shortDefinition:
      'Der Moment der Parköffnung, wenn die Absperrung fällt und die Warteschlangen für beliebte Attraktionen am kürzesten sind.',
    definition:
      'Rope Drop ist der Moment, in dem ein Freizeitpark für den Tag öffnet. Der Name kommt von dem Seil (oder Absperrband), das Parkmitarbeiter absenken, um die ersten Besucher einzulassen. Wer zum Rope Drop am Eingang steht, findet an den gefragten Attraktionen die kürzesten Warteschlangen des Tages, weil der Park sich erst im Lauf des Vormittags füllt. Viele Parks lassen Hotelgäste zusätzlich per Early Entry vor dem regulären Einlass zu bestimmten Attraktionen. Die genauen Öffnungszeiten stehen bei park.fan im Zeitplan des Parks.',
    aliases: ['Rope-Drop'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'early-entry', 're-ride', 'wait-time'],
  },
  {
    id: 'early-entry',
    name: 'Früheinlass',
    shortDefinition: 'Eintritt in den Park vor der regulären Öffnung, meist für Hotelgäste.',
    definition:
      'Beim Früheinlass (bei Disney „Extra Zauberzeit“, sonst oft „Early Park Entry“) dürfen Gäste von Partnerhotels oder mit bestimmten Tickets eine halbe bis eine Stunde früher in den Park. In dieser Zeit sind die Warteschlangen deutlich kürzer, weil der Großteil der Besucher noch nicht eingelassen ist. An Spitzentagen ist der Früheinlass die Stunde, in der die Warteschlangen an den gefragten Bahnen noch kurz sind.',
    alternateNames: ['Extra Magic Hours', 'Magic Hours', 'Early Park Entry', 'Extra Zauberzeit'],

    relatedTermIds: ['express-pass', 'peak-day', 'rope-drop'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'Ein Ticket-Upgrade, mit dem man an einem Tag mehrere Parks desselben Betreibers besuchen kann.',
    definition:
      'Mit einem Park-Hopper-Ticket kann man an einem Tag zwei oder mehr Parks desselben Resorts besuchen. Bei Disney wechselt man damit jederzeit zwischen Magic Kingdom, EPCOT, Hollywood Studios und Animal Kingdom, die Regel, nach der erst ab 14 Uhr gewechselt werden durfte, fiel im Januar 2024. Das Park-to-Park-Ticket von Universal Orlando verbindet Universal Studios Florida und Islands of Adventure, zwischen denen auch der Hogwarts Express fährt, den nur Inhaber dieses Tickets nutzen dürfen. PortAventura World hat ein Kombiticket für PortAventura Park und Ferrari Land. Lohnend ist das, wenn die eigentlich gesuchte Attraktion im zweiten Park steht, wenn auf einen Vormittag in einem Park eine Abendshow im anderen folgen soll, oder bei einem kurzen Aufenthalt. Der Aufpreis gegenüber einem Ein-Park-Ticket hängt vom Resort ab und steigt an Spitzentagen.',
    alternateNames: ['Park Hopping', 'Multi-Park-Ticket', 'Park-Hopper-Ticket'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'season-pass'],
    aliases: ['Park-Hopper-Ticket'],
  },
  {
    id: 'season-pass',
    name: 'Jahrespass',
    shortDefinition: 'Ein Ticket für unbegrenzt viele Parkbesuche innerhalb eines Jahres.',
    definition:
      'Ein Jahrespass (auch Saisonkarte oder Annual Pass) gewährt unbegrenzte Eintritte in einen oder mehrere Parks über einen Zeitraum von üblicherweise zwölf Monaten. Viele Jahrespässe enthalten Zusatzleistungen wie Rabatte auf Gastronomie, Merchandise oder Parken. Je nach Stufe können an Spitzentagen Sperrtage (Blockout Dates) gelten. Wer mehr als drei- bis viermal im Jahr kommt, zahlt mit einem Jahrespass in der Regel weniger als mit Einzeltickets.',
    aliases: ['Jahreskarte', 'Jahrespässe', 'Saisonpass', 'Saisonpässe', 'Jahreskarten'],
    alternateNames: ['Annual Pass', 'Season Pass', 'Saisonkarte', 'Saisonpass'],

    relatedTermIds: ['express-pass', 'park-hopper', 'peak-day'],
  },
  {
    id: 'height-requirement',
    name: 'Mindestgröße',
    shortDefinition:
      'Eine Mindestkörpergröße, die Besucher erfüllen müssen, um eine bestimmte Attraktion nutzen zu dürfen.',
    definition:
      'Die Mindestgröße ist eine Sicherheitsregel, mit der Parks sicherstellen, dass Rückhaltesysteme, also Schoßbügel, Schulterbügel und Gurte, bei jedem Fahrgast richtig sitzen. Sie reicht von etwa 90 cm bei sanften Familienachterbahnen bis 140 cm bei den heftigsten Bahnen. Einige Attraktionen haben zusätzlich eine Maximalgröße oder ein Gewichtslimit, das ist aber seltener. Die Websites und Apps der Parks führen die Größenangaben für jede Attraktion, und mit Kindern liest man sie besser vor dem Besuch als erst am Eingang. Ist ein Kind zu klein, bieten die meisten Parks einen Kinderwechsel (Rider Switch) an, damit die Erwachsenen nacheinander fahren können, ohne zweimal anzustehen.',
    aliases: ['Mindestgrößen', 'Mindestgrößenanforderungen', 'Mindestgrößenanforderung'],
    alternateNames: ['Körpergrößenanforderung', 'Größenbeschränkung', 'Größenanforderung'],

    relatedTermIds: ['refurbishment', 'ride-capacity'],
  },
  {
    id: 'themed-land',
    name: 'Themenbereich',
    shortDefinition:
      'Ein eigenständig gestalteter Bereich innerhalb eines Freizeitparks mit durchgehendem Thema.',
    definition:
      'Ein Themenbereich ist ein abgegrenzter Teil eines Parks mit einheitlicher Gestaltung, einer eigenen Hintergrundgeschichte und passenden Attraktionen, Restaurants und Läden. Wer ihn betritt, soll das Gefühl haben, an einen anderen Ort zu kommen. Beispiele sind The Wizarding World of Harry Potter bei Universal, Star Wars: Galaxy’s Edge bei Disney, Klugheim im Phantasialand und Skandinavien im Europa-Park. Ein neuer Themenbereich ist auch für die Besucherzahlen ein Ereignis: Die erste Saison bringt Medienberichte und spürbar mehr Besucher. Weil ein Bereich oft eine Hauptattraktion mit wenig Kapazität neben mehrere Bahnen mit viel Kapazität stellt, können die Wartezeiten innerhalb desselben Bereichs um eine Stunde auseinanderliegen.',
    aliases: ['Themenbereiche', 'Themenbereichen', 'Themenbereichs'],
    alternateNames: ['Themenzone', 'Land', 'Theming Area'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      'Die inoffizielle, vorzeitige Öffnung einer Attraktion vor dem offiziellen Eröffnungsdatum.',
    definition:
      'Ein Soft Opening ist der stille Probebetrieb einer neuen Attraktion oder eines Themenbereichs vor dem offiziellen Eröffnungstermin, meist ganz ohne Ankündigung. Parks testen dabei die Technik mit echten Fahrgästen, finden die Schwachstellen im Ablauf und schulen das Personal. Ein Soft Opening kann ohne Vorwarnung beginnen und enden und dauert manchmal nur einen Tag oder ein paar Stunden. Wer gerade im Park ist, fährt eine brandneue Attraktion fast ohne Wartezeit. Fan-Foren und Park-News-Kanäle in den sozialen Medien berichten meist als erste davon. Eine Reise lässt sich darauf nicht planen.',
    alternateNames: ['Soft Launch'],

    relatedTermIds: ['downtime', 'refurbishment', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby',
    shortDefinition:
      'Die normale Warteschlange einer Attraktion, ohne Reservierung oder besonderes Ticket.',
    definition:
      'Die Standby-Warteschlange ist die reguläre physische Warteschlange, die alle Besucher ohne zusätzliches Ticket oder Upgrade nutzen können. Wer in der Standby-Warteschlange steht, kommt in der Reihenfolge des Eintreffens dran, und die angezeigte Wartezeit hängt direkt davon ab, wie viele gerade anstehen. An vollen Tagen sind es bei Hauptattraktionen 90 Minuten und mehr. park.fan zeigt die Standby-Wartezeit jeder Attraktion neben den Zeiten der anderen Warteschlangen.',
    alternateNames: ['Normale Warteschlange', 'Reguläre Warteschlange', 'Standby-Warteschlange'],

    relatedTermIds: ['express-pass', 'single-rider', 'virtual-queue', 'wait-time'],
    aliases: ['Standby', 'Standby-Warteschlange'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      'Disneys kostenpflichtiges Vorrangwarteschlangen-System als Nachfolger des früheren FastPass+-Programms.',
    definition:
      'Lightning Lane ist Disneys Bezeichnung für sein Priority-Queue-System, das 2021 als Nachfolger des kostenlosen FastPass+-Programms eingeführt wurde. Seit Juli 2024 verkauft Walt Disney World Lightning Lane Single Pass (bis dahin Individual Lightning Lane, ILL) für die gefragtesten Attraktionen, die einzeln gekauft werden muss, und Lightning Lane Multi Pass (LLMP), ein Tageszusatz, mit dem man Rückkehrzeiten für eine Auswahl an Attraktionen buchen kann. Beide lassen sich schon Tage vor dem Besuch buchen. Der teurere Lightning Lane Premier Pass gilt für je einen Eintritt an jeder teilnehmenden Attraktion. Was vorher kostenlos war, kostet seitdem Geld. Im Besucherkalender von park.fan steht, an welchen Tagen mit langen Standby-Warteschlangen zu rechnen ist.',
    alternateNames: [
      'Lightning Lane Multi Pass',
      'Lightning Lane Single Pass',
      'Individual Lightning Lane',
      'LLMP',
      'ILL',
      'Lightning Lanes',
    ],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: [
      'Lightning Lanes',
      'Lightning Lane Multi Pass',
      'Lightning Lane Single Pass',
      'Lightning Lane Premier Pass',
    ],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      'Disneys ehemaliges tägliches Zusatzabo für Lightning-Lane-Zugang zu den meisten Attraktionen.',
    definition:
      'Genie+ (im Juli 2024 durch Lightning Lane Multi Pass ersetzt, das sich in Walt Disney World schon Tage vor dem Besuch buchen lässt) war Disneys kostenpflichtiges Tages-Add-on, das FastPass+ ersetzte. Für eine personenbezogene Tagesgebühr konnten Gäste jeweils ein Lightning-Lane-Rückkehrzeitfenster für eine breite Auswahl an Attraktionen buchen. Die gefragtesten Attraktionen gab es nur einzeln als Individual Lightning Lane. Der Preis von Genie+ war dynamisch und stieg an den besucherstärksten Tagen.',
    aliases: ['Genie Plus'],
    alternateNames: ['Disney Genie'],

    relatedTermIds: ['express-pass', 'lightning-lane', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      'Eine nummerierte Zuteilung im virtuellen Warteschlangensystem, die den Zugang zu einer Attraktion bei Aufruf ermöglicht.',
    definition:
      'Eine Boarding Group ist eine nummerierte Zuteilung innerhalb eines virtuellen Warteschlangensystems, das vor allem bei den begehrtesten neuen Attraktionen eingesetzt wird. Besucher melden sich über die Park-App an, oft direkt bei Parköffnung, und erhalten eine Gruppennummer. Wird diese Nummer aufgerufen, haben sie ein begrenztes Zeitfenster, um zur Attraktion zu kommen. An besonders vollen Tagen sind alle Boarding Groups innerhalb von Minuten vergeben. Bekannt wurde der Begriff durch Disney, das Boarding Groups bei Attraktionen wie Tron Lightcycle Run oder Star Wars: Rise of the Resistance einsetzt.',
    alternateNames: ['Boarding Groups', 'Boarding-Gruppen'],

    relatedTermIds: ['lightning-lane', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'off-peak',
    name: 'Nebensaison',
    shortDefinition:
      'Zeiträume mit geringerer Besucherauslastung, kürzeren Wartezeiten und günstigeren Preisen.',
    definition:
      'Nebensaison sind die ruhigeren Wochen im Jahr, in denen Schule ist und keine großen Feiertage liegen, typischerweise Januar bis Anfang Februar, Mitte September bis Oktober (außerhalb von Halloween-Events) und die ersten Novemberwochen. In der Nebensaison sind die Wartezeiten an gefragten Attraktionen oft deutlich kürzer und die Ticketpreise häufig am niedrigsten. Wer den Termin frei wählen kann, fährt in der Nebensaison. Der Besucherkalender von park.fan markiert die Nebensaison-Fenster eines Parks.',
    alternateNames: ['Ruhige Zeiten', 'Schwache Saison', 'Off-Peak', 'Quieter Season'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
  },
  {
    id: 'offseason',
    name: 'OffSeason',
    shortDefinition:
      'Die Zeit, in der ein Park für Wartungsarbeiten, Umbauten oder die Winterpause ganz geschlossen ist.',
    definition:
      'Die OffSeason ist der Teil des Jahres, in dem ein Park ganz geschlossen ist, ohne Fahrbetrieb, Restaurants oder Shows. In der Nebensaison ist ein Park dagegen geöffnet, nur leerer. Viele Parks mit Freiluftsaison schließen zwischen November und März oder April, manche mit einer Wintersaison oder ein paar Weihnachtswochenenden dazwischen. Parks in warmem Klima oder mit den meisten Attraktionen in Hallen haben oft gar keine.\n\nDie geschlossenen Monate gehören der Arbeit, die mit Besuchern im Park nicht geht: den jährlichen Prüfungen, der Wartung von Strecken und Zügen, größeren Umbauten und dem Bau neuer Attraktionen.\n\nZeigt park.fan für einen Park OffSeason an, gibt es für den aktuellen Zeitraum keinen Öffnungsplan, und der nächste bestätigte Öffnungstag ist noch einige Wochen entfernt. Der Besucherkalender markiert die geschlossenen Tage als „Geschlossen“, und das Datum der Wiedereröffnung erscheint, sobald der Park es veröffentlicht.',
    alternateNames: ['Saisonpause', 'Geschlossene Saison', 'Off Season'],

    relatedTermIds: ['crowd-calendar', 'refurbishment', 'soft-opening'],
  },
  {
    id: 'ride-photo',
    name: 'Fahrfoto',
    shortDefinition:
      'Automatisch aufgenommenes Foto oder Video der Besucher während einer Attraktion, das man nach der Fahrt kaufen kann.',
    definition:
      'Das Fahrfoto ist ein Bild, das eine fest installierte Kamera automatisch aufnimmt, meist an der Abfahrt einer Wasserbahn oder am Scheitelpunkt einer Achterbahn. Nach der Fahrt können Besucher ihr Foto an Kiosks oder in der Park-App ansehen und entscheiden, ob sie es kaufen. Viele Parks verkaufen Foto-Tagespakete mit unbegrenzt vielen Fahrfotos aller Attraktionen.',
    aliases: ['Fahrfotos'],
    alternateNames: ['On-Ride-Foto', 'Onride-Foto', 'On-Ride-Bild', 'Ride Photo'],

    relatedTermIds: ['onride-offride', 'themed-land'],
  },
  {
    id: 'queue-line',
    name: 'Warteschlange',
    shortDefinition:
      'Der physische Wartebereich vor einer Attraktion, der oft selbst thematisch gestaltet ist.',
    definition:
      'Die Warteschlange ist der Weg, den Besucher vor dem Einsteigen zurücklegen: Gänge im Gebäude, abgesperrte Kehren im Freien oder gestaltete Räume. In vielen modernen Parks gehört die Warteschlange schon zur Attraktion. Bei der Haunted Mansion stimmen Grabsteine, Grüfte und der sich streckende Raum auf die Fahrt ein, lange bevor jemand in einen Doom Buggy steigt, und die Harry-Potter-Attraktionen von Universal beginnen ihre Geschichte, sobald man das Gebäude betritt. Eine so gebaute Warteschlange macht lange Wartezeiten leichter erträglich.',
    relatedTermIds: ['single-rider', 'standby-queue', 'wait-time'],
    aliases: ['Warteschlangen', 'Warteschlange', 'Warteschlangen'],
  },
  {
    id: 'opening-day',
    name: 'Eröffnungstag',
    shortDefinition:
      'Das offizielle Eröffnungsdatum eines neuen Parks, Themenbereichs oder einer neuen Attraktion.',
    definition:
      'Der Eröffnungstag ist das offiziell angekündigte Datum, an dem ein neuer Park, eine Erweiterung oder eine Attraktion erstmals für die Öffentlichkeit öffnet. Am Eröffnungstag ist meist Presse da, und die Warteschlangen sind lang. Oft gibt es eine Eröffnungszeremonie mit eigenem Programm. Wer eine neue Attraktion mit kurzer Wartezeit fahren will, wählt deshalb besser einen anderen Tag. Manchmal gibt es vor dem offiziellen Eröffnungstag ein Soft Opening.',
    relatedTermIds: ['crowd-level', 'rope-drop', 'soft-opening'],
    aliases: ['Eröffnungstage'],
  },
  {
    id: 'rider-switch',
    name: 'Rider Switch',
    shortDefinition:
      'System, bei dem sich Erwachsene beim Fahren abwechseln, während der andere bei Kindern bleibt, die die Mindestgröße nicht erfüllen.',
    definition:
      'Beim Rider Switch (auch Kindertausch oder Child Swap) wechseln sich Erwachsene an einer Attraktion ab, wenn jemand aus der Gruppe nicht mitfahren kann, meist ein Kind unter der Mindestgröße. Ein Erwachsener fährt, der andere wartet mit dem Kind am Eingang. Kommt der erste zurück, darf der zweite sofort einsteigen, ohne noch einmal in der Standby-Warteschlange anzustehen. Bei Disney heißt das System offiziell Rider Switch, bei Universal Child Swap. An Spitzentagen spart das einer Familie mit kleinen Kindern eine zweite Wartezeit. Man fragt am Eingang der Attraktion beim Personal danach.',
    alternateNames: ['Child Swap', 'Kindertausch', 'Baby Switch'],

    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Sperrtag',
    shortDefinition:
      'Ein Kalendertag, an dem bestimmte Jahrespass-Stufen nicht für den Parkeintritt gültig sind, meist ein Spitzentag.',
    definition:
      'Ein Sperrtag (englisch: Blockout Date oder Blackout Date) ist ein bestimmter Kalendertag, an dem Jahrespässe niedrigerer Stufen nicht eingelöst werden können. Parks setzen Sperrtage ein, um die Besucherzahlen an den stärksten Tagen zu steuern. Teure Pässe haben wenige oder keine Sperrtage, günstige Einsteigerpässe können an 30–60 Tagen pro Jahr gesperrt sein. Wer einen Pass mit Sperrtagen hat, sieht vor dem Besuch im Sperrtagkalender des Parks nach. Der Besucherkalender von park.fan markiert die typischen Spitzentage.',
    aliases: ['Sperrtage'],
    alternateNames: ['Blackout-Tage', 'Blackout-Datum', 'Blockout Date'],

    relatedTermIds: ['crowd-calendar', 'peak-day', 'season-pass'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Sonderveranstaltung',
    shortDefinition:
      'Ein Abendevent mit eigenem Ticket, etwa eine Halloween- oder Weihnachtsparty, das im normalen Tageseintritt nicht enthalten ist.',
    definition:
      'Eine Sonderveranstaltung (englisch Hard Ticket Event) ist ein Abend-Event im Freizeitpark mit eigenem Eintrittsticket, zusätzlich zum oder anstelle des Tagestickets. Es gibt Shows, Dekoration und begehbare Attraktionen, die der normale Parktag nicht hat. Beispiele sind Mickey’s Not-So-Scary Halloween Party und Mickey’s Very Merry Christmas Party in Walt Disney World, die Halloween Horror Nights bei Universal und Traumatica im Europa-Park, das ein eigenes Abendticket hat. An Veranstaltungstagen müssen reguläre Tagesgäste am späten Nachmittag oder frühen Abend gehen, in Magic Kingdom beginnt die Halloween-Party um 19 Uhr. Die Stunden davor sind ungewöhnlich voll, weil alle noch eine letzte Fahrt mitnehmen wollen. Die Tickets gehen Monate vorher in den Verkauf, und die beliebten Halloween-Abende sind Wochen vor dem Termin ausverkauft.',
    aliases: ['Sonderveranstaltungen'],
    alternateNames: ['After-Hours-Event', 'Hard-Ticket-Event', 'Exklusivangebot'],

    relatedTermIds: ['early-entry', 'peak-day', 'season-pass'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      'Disneys ehemaliges kostenloses Vorrang-Warteschlangen-System, das 2021 durch das kostenpflichtige Lightning Lane ersetzt wurde.',
    definition:
      'FastPass+ (1999 als FastPass eingeführt) war Disneys kostenloses Vorrangsystem: Gäste buchten ohne Aufpreis ein Rückkehrzeitfenster für eine Attraktion. In Walt Disney World hieß das bis zu drei Reservierungen pro Tag im Voraus über die App My Disney Experience, danach weitere jeweils einzeln am selben Tag. FastPass+ gab es nur in den vier Parks von Walt Disney World, das Disneyland Paris behielt die FastPass-Zettel aus Papier und hat sie inzwischen durch das kostenpflichtige Premier Access ersetzt. Disney setzte das System bei der COVID-19-Schließung im März 2020 aus, nahm es nie wieder in Betrieb und ersetzte es Ende 2021 durch das kostenpflichtige Lightning Lane. Unter Disney-Fans wird über den Wechsel bis heute gestritten, weil aus einem kostenlosen Vorteil ein bezahlter wurde, und in Reiseberichten und Planungshilfen von vor 2021 taucht der Begriff überall auf.',
    aliases: ['FastPass Plus', 'Fast Pass'],

    relatedTermIds: ['express-pass', 'genie-plus', 'lightning-lane', 'return-time'],
  },
  {
    id: 'dark-ride',
    name: 'Dark Ride',
    shortDefinition:
      'Eine Indoor-Attraktion, bei der Besucher in geführten Fahrzeugen durch thematisch gestaltete Szenen fahren.',
    definition:
      'Ein Dark Ride ist eine Indoor-Attraktion, bei der Besucher in Fahrzeugen (Wagen, Booten oder Gondeln auf einem festen Schienensystem) durch thematisch gestaltete Szenen fahren. „Dark“ steht für die abgedunkelte Halle, in der gezielt gesetztes Licht Animatronics, Projektionen und Kulissen beleuchtet. Auch im Deutschen sagt man Dark Ride. Es gibt ruhige Familienfahrten wie „it’s a small world“ und aufwendige Attraktionen mit durchgehender Handlung wie Star Wars: Rise of the Resistance. Bei Trackless Dark Rides fahren die Fahrzeuge ohne feste Schiene frei durch den Raum, die Szenen lassen sich damit freier anlegen. Dark Rides gehören zu den Attraktionen mit der höchsten Kapazität.',
    aliases: ['Dark Rides'],
    alternateNames: ['Dark Ride', 'Indoor-Attraktion', 'Innenfahrt', 'Geisterbahn'],

    relatedTermIds: [
      'height-requirement',
      'ride-capacity',
      'soft-opening',
      'themed-land',
      'vr-coaster',
      'wait-time',
    ],
  },
  {
    id: 'return-time',
    name: 'Rückkehrzeit',
    shortDefinition:
      'Ein reserviertes Zeitfenster, in dem man mit einem Lightning Lane, einer virtuellen Warteschlange oder einem ähnlichen System zur Attraktion zurückkehren kann.',
    definition:
      'Eine Rückkehrzeit (oder Returntime) ist ein festes Zeitfenster, meist eine Stunde, in dem Besucher mit gebuchtem Vorrangzugang (über Lightning Lane, virtuelle Warteschlange oder ähnliche Systeme) am eigenen Eingang der Attraktion einsteigen können. Bis dahin kann man sich woanders im Park aufhalten, statt anzustehen. Wer das Zeitfenster und die kurze Toleranzzeit danach verpasst, verliert die Reservierung.',
    relatedTermIds: ['boarding-group', 'fastpass', 'lightning-lane', 'virtual-queue'],
    aliases: ['Rückkehrzeiten'],
    alternateNames: ['Returntime', 'Return Time', 'Rückkehrfenster', 'Rückkehrzeit'],
  },
  {
    id: 'airtime',
    name: 'Airtime',
    shortDefinition: 'Das Abheben aus dem Sitz bei negativen G-Kräften auf einer Achterbahn.',
    definition:
      'Airtime ist das Abheben aus dem Sitz bei negativen G-Kräften. Es entsteht, wenn ein Zug eine Kuppe so schnell überfährt, dass die Strecke unter den Fahrgästen schneller abfällt, als sie selbst fallen würden. Bei Floater Airtime sind die negativen G-Kräfte schwach, man schwebt. Bei Ejector Airtime sind sie stark, und nur der Schoßbügel hält den Fahrgast im Sitz. Airtime-Hügel (Camelbacks) sind dafür als Parabel geformt, die der Flugbahn im freien Fall folgt.',
    relatedTermIds: [
      'airtime-hill',
      'bunnyhop',
      'first-drop',
      'quad-down',
      'restraint-freedom',
      's-hill',
      'wooden-coaster',
    ],
  },
  {
    id: 'inversion',
    name: 'Inversion',
    shortDefinition:
      'Jedes Element auf einer Achterbahn, bei dem die Strecke die Fahrgäste über Kopf dreht.',
    definition:
      'Eine Inversion ist jedes Element, bei dem die Strecke die Fahrgäste über die Senkrechte hinaus dreht, also zumindest teilweise auf den Kopf stellt. Die wichtigsten Arten sind Looping, Cobra Roll, Immelmann, Dive Loop, Korkenzieher, Inline Twist, Heartline Roll, Zero-G Roll, Flat Spin, Batwing und Pretzel Loop, jede mit eigener Mischung aus G-Kräften und Richtungswechsel. Moderne Achterbahnen haben oft sechs bis vierzehn davon, und die Zahl gehört zu den Standardangaben einer Bahn. Den Rekord hält The Smiler in Alton Towers mit 14. Am Tiefpunkt eines Loopings wirken positive G-Kräfte, am Scheitel negative, und dort heben die Fahrgäste kopfüber kurz aus dem Sitz ab.',
    relatedTermIds: ['cobra-roll', 'corkscrew', 'immelmann', 'vertical-loop', 'zero-g-roll'],
    aliases: ['Inversionen'],
    alternateNames: ['Inversion', 'Überkopfelement', 'Kopf-über-Element'],
  },
  {
    id: 'vertical-loop',
    name: 'Looping',
    shortDefinition:
      'Die klassische kreisförmige Inversion, bei der die Strecke einen vollständigen vertikalen Kreis beschreibt und die Fahrgäste am Scheitelpunkt auf den Kopf stellt.',
    definition:
      'Der Looping (englisch: Vertical Loop) ist ein vollständiger 360-Grad-Kreis in der Senkrechten und die bekannteste Inversion. Moderne Loopings haben statt eines reinen Kreises eine Klothoiden-Form (Tropfenform) mit weiter Ein- und Ausfahrt und enger Spitze. So bleiben die G-Kräfte gleichmäßig, ohne harte Spitzen. Der erste moderne Loop-Coaster (Revolution, Six Flags Magic Mountain, 1976, von Schwarzkopf und Werner Stengel) setzte das Format durch. Heute haben kleine Einsteigerbahnen ebenso einen Looping wie Rekordbahnen.',
    aliases: ['Loopings'],
    alternateNames: ['Loop', 'Vertical Loop', 'Vertikaler Loop'],

    relatedTermIds: ['cobra-roll', 'immelmann', 'inclined-loop', 'interlocking-loops', 'inversion'],
  },
  {
    id: 'immelmann',
    name: 'Immelmann',
    shortDefinition:
      'Ein halber Looping aufwärts, gefolgt von einer halben Rolle, der die Fahrtrichtung um 180 Grad ändert. Benannt nach dem Jagdflieger Max Immelmann.',
    definition:
      'Der Immelmann besteht aus zwei Teilen. Zuerst steigt die Strecke als halber Looping auf, die Fahrgäste sind kurz über Kopf. Dann richtet eine halbe Rolle den Zug wieder auf, und er fährt in die Gegenrichtung weiter. Benannt ist das Element nach Max Immelmann, einem Jagdflieger des Ersten Weltkriegs, der eine ähnliche Flugfigur entwickelte. Der Immelmann findet sich auf nahezu jeder Sitzachterbahn und jedem Inverted Coaster von B&M.',
    relatedTermIds: ['b-and-m', 'dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'zero-g-roll',
    name: 'Zero-G Roll',
    shortDefinition:
      'Eine 360-Grad-Drehung entlang einer Parabel, bei der die Fahrgäste am Scheitelpunkt kopfüber schwerelos sind.',
    definition:
      'Beim Zero-G Roll dreht sich die Strecke einmal um 360 Grad, während sie einen parabelförmigen Hügel beschreibt. Am Scheitelpunkt hängen die Fahrgäste kopfüber und spüren kurz negative G-Kräfte (Airtime). Das Element findet sich vor allem bei B&M, auf Wing Coastern, Hypercoastern und Inverted Coastern. Auf einem Wing Coaster schwingen die Außensitze dabei weit durch die Luft.',
    relatedTermIds: ['airtime', 'b-and-m', 'heartline-roll', 'inversion', 'zero-g-winder'],
  },
  {
    id: 'launch-coaster',
    name: 'Launch Coaster',
    shortDefinition:
      'Eine Achterbahn, die die Fahrgäste per Magnetantrieb, Hydraulik oder Druckluft aus dem Stand auf Höchstgeschwindigkeit beschleunigt, statt sie über einen Kettenlift zu ziehen.',
    definition:
      'Ein Launch Coaster (Katapultachterbahn) ersetzt den Kettenlift durch einen Antrieb, der den Zug in wenigen Sekunden aus dem Stand auf volle Geschwindigkeit bringt. Beim LSM (Linearsynchronmotor) beschleunigen elektromagnetische Spulen eine Finne unter dem Zug, der LIM (Linearinduktionsmotor) arbeitet ähnlich, aber weniger effizient. Der hydraulische Launch ist Intamins Seil-und-Kolben-System hinter Rekordbahnen wie Kingda Ka, das bis zur Schließung 2024 in 3,5 Sekunden von 0 auf 206 km/h beschleunigte. Dazu kommen Druckluft-Launches. Manche Bahnen haben zwei oder drei Launches im Streckenverlauf, damit auf einer langen Strecke die Energie reicht. Taron im Phantasialand hat zwei LSM-Launches durch eine thematisierte Felslandschaft und war bei der Eröffnung die schnellste Multi-Launch-Achterbahn der Welt, Red Force in Ferrari Land erreicht per LSM in fünf Sekunden 180 km/h. Bei neuen Katapultachterbahnen in Europa ist LSM inzwischen der Standard.',
    alternateNames: [
      'LSM Coaster',
      'LIM Coaster',
      'Katapultbahn',
      'Launcher',
      'Katapultachterbahn',
    ],

    relatedTermIds: ['horseshoe', 'intamin', 'lifthill', 'top-hat'],
    aliases: ['Launch Coasters', 'Abschuss-Coaster', 'Accelerator Coaster'],
  },
  {
    id: 'wooden-coaster',
    name: 'Holzachterbahn',
    shortDefinition:
      'Eine Achterbahn, die überwiegend aus Holz gebaut ist. Sie rumpelt, schaukelt seitlich, und ihre Airtime fällt bei jeder Fahrt etwas anders aus.',
    definition:
      'Eine Holzachterbahn ist eine Bahn mit hölzerner Strecke und hölzernem Gerüst. Holz gibt nach und lässt sich nicht so genau verbauen wie Stahl. Daher kommen das Rumpeln, das seitliche Schaukeln und die Airtime, die sich nicht genau vorhersagen lässt. Beispiele sind Balder in Liseberg, Colossos im Heide-Park und Wodan im Europa-Park. Holzachterbahnen brauchen viel Wartung, das Schienenprofil muss regelmäßig erneuert werden. Mit dem Umbauverfahren von RMC (Rocky Mountain Construction) werden alte Holzachterbahnen zu Hybrid Coastern: Das Holzgerüst bleibt, die Schiene wird aus Stahl.',
    relatedTermIds: ['airtime', 'cci', 'hybrid-coaster', 'ptc', 'quad-down', 'rattle', 'rmc'],
    aliases: ['Holzachterbahnen', 'Holzbahn'],
    alternateNames: ['Woodie', 'Woodies', 'Holzcoaster'],
  },
  {
    id: 'steel-coaster',
    name: 'Stahlachterbahn',
    shortDefinition:
      'Eine Achterbahn mit Stahlschiene und Stahlgerüst, die glatt und präzise fährt.',
    definition:
      'Eine Stahlachterbahn hat eine Stahlschiene und ein Stützgerüst aus Stahl. Stahl gibt weniger nach als Holz, Ingenieure können G-Kräfte, Übergänge und Inversionen deshalb genau festlegen. Weil die Fahrt glatt und vorhersagbar bleibt, sind Layouts mit mehreren Inversionen, engen Kurvenradien und hohen Geschwindigkeiten möglich.\n\nDie meisten neuen Achterbahnen sind aus Stahl, weil sich damit fast jede Form bauen lässt, auch Überkopf-Drops, Inversionen und schnelle Richtungswechsel. Beispiele in Europa sind Shambhala in PortAventura, Nemesis in Alton Towers und Silver Star im Europa-Park. Es gibt sie als kleine Familienbahn ebenso wie als Mega-Coaster mit Rekordwerten. Auch eine Stahlbahn muss regelmäßig kontrolliert und gewartet werden, sie ist aber weniger anfällig als eine Holzkonstruktion.',
    relatedTermIds: [
      'bobsled-coaster',
      'hyper-coaster',
      'inversion',
      'launch-coaster',
      'single-rail-coaster',
      'stand-up-coaster',
      'wooden-coaster',
    ],
    aliases: ['Stahlachterbahnen'],
  },
  {
    id: 'suspended-coaster',
    name: 'Suspended Coaster',
    shortDefinition:
      'Eine Achterbahn, bei der die Wagen an einem Drehpunkt unter der Schiene hängen und seitlich frei schwingen können.',
    definition:
      'Beim Suspended Coaster hängt der Zug an einem Drehpunkt unter der Schiene und kann seitlich frei schwingen. In einer Kurve pendelt er nach außen und schlägt am Ausgang zurück, auf Englisch heißt das „whip“. Beim Inverted Coaster ist der Zug dagegen starr an der Schiene befestigt.\n\nSuspended Coasters sind seltener als Inverted Coasters. Schon in einer mäßigen Kurve schwingt der Wagen weit aus, und wie weit, ist nicht bei jeder Fahrt gleich. Vekomas Suspended Looping Coaster (SLC) aus den 1990er Jahren gehört trotz des Namens nicht dazu: Sein Zug sitzt fest an der Schiene, es ist ein Inverted Coaster. Gebaut wurden etwa 40.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'vekoma'],
    alternateNames: ['Suspended Coaster', 'Hängende Achterbahn', 'Schwingende Achterbahn'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Hybrid Coaster',
    shortDefinition:
      'Eine Achterbahn mit Holzgerüst und einer genau gefertigten Stahlschiene (I-Box), entwickelt von Rocky Mountain Construction (RMC).',
    definition:
      'Ein Hybrid Coaster hat das Holzgerüst einer klassischen Holzachterbahn und eine I-Box-Schiene aus Stahl von Rocky Mountain Construction (RMC). Die I-Box-Schiene wird sehr genau gefertigt, damit sind Inversionen möglich, die auf einer Holzschiene nicht gehen. RMC entwickelte das System vor allem, um alte Holzachterbahnen zu sanieren, die zu rau gefahren waren. Beim Umbau kommen Inversionen, steilere Abfahrten und Airtime-Hügel dazu. Beispiele sind Steel Vengeance in Cedar Point und Untamed in Walibi Holland, 2019 aus der Holzachterbahn Robin Hood umgebaut.',
    aliases: ['Hybrid-Achterbahnen', 'I-Box Track', 'IBox Track', 'Topper Track'],
    alternateNames: ['RMC Hybrid', 'I-Box Coaster', 'Stahl-Holz-Hybrid'],

    relatedTermIds: ['airtime', 'rmc', 'wooden-coaster'],
  },
  {
    id: 'b-and-m',
    name: 'B&M',
    shortDefinition:
      'Bolliger & Mabillard, ein Schweizer Achterbahn-Hersteller, dessen Bahnen ruhig und zuverlässig fahren. Immelmann, Cobra Roll und Zero-G Roll kehren in vielen davon wieder.',
    definition:
      'B&M (Bolliger & Mabillard) ist ein Schweizer Achterbahn-Hersteller, 1988 von Walter Bolliger und Claude Mabillard gegründet. B&M-Bahnen fahren sehr ruhig und fallen selten aus. Typisch sind starke positive G-Kräfte, immer wieder dieselben Inversionen (Immelmann, Cobra Roll, Zero-G Roll) und ein hoher Durchsatz. B&M baut vor allem Inverted Coaster, Sit-Down-Looper, Hypercoaster (über 61 m), Gigacoaster (über 91 m), Wing Coaster und Dive Machines. Nahezu jeder große europäische Park hat mindestens eine B&M-Bahn, etwa Shambhala und Dragon Khan in PortAventura, Silver Star im Europa-Park und Nemesis in Alton Towers.',
    aliases: ['Bolliger & Mabillard', 'Bolliger and Mabillard'],
    relatedTermIds: [
      'cobra-roll',
      'dive-coaster',
      'hybrid-coaster',
      'immelmann',
      'smoothness',
      'stand-up-coaster',
      'zero-g-roll',
    ],
  },
  {
    id: 'intamin',
    name: 'Intamin',
    shortDefinition:
      'Schweizer Hersteller von Fahrgeschäften. Von Intamin stammen hydraulische Launches für Rekordbahnen, Mega- und Gigacoaster und viele der schnellsten und höchsten Achterbahnen der Welt.',
    definition:
      'Intamin AG ist ein Schweizer Hersteller von Fahrgeschäften, 1967 gegründet, und steht hinter einer langen Reihe von Achterbahnrekorden. Sein hydraulischer Launch trieb jahrelang die höchsten Achterbahnen der Welt an: Kingda Ka in Six Flags Great Adventure (139 m), 2024 geschlossen und 2025 abgerissen, und Top Thrill Dragster in Cedar Point (128 m), 2024 mit Zamperla zu Top Thrill 2 umgebaut. Neben den Rekordbahnen baut Intamin Mega- und Gigacoaster (Millennium Force in Cedar Point), Achterbahnen mit mehreren Launches, Wasserbahnen und Dark Rides. In Europa stehen Taron im Phantasialand mit zwei LSM-Launches durch eine Felslandschaft, Red Force in Ferrari Land bei Tarragona, mit 180 km/h die schnellste Achterbahn des Kontinents, Expedition GeForce im Holiday Park und die Holzachterbahn Colossos im Heide Park. Intamin-Bahnen sind aufwendiger im Betrieb als die von B&M, und mehrere standen nach Defekten lange still.',
    relatedTermIds: ['b-and-m', 'launch-coaster', 'mack-rides', 'top-hat'],
    aliases: ['Intamin AG'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      'Deutsches Familienunternehmen aus Waldkirch nahe dem Europa-Park, das Wasserbahnen, Dark Rides und immer mehr große Stahlachterbahnen baut.',
    definition:
      'Mack Rides ist ein deutscher Hersteller von Fahrgeschäften aus Waldkirch in Baden-Württemberg, wenige Kilometer vom Europa-Park entfernt, der ebenfalls der Familie Mack gehört. Paul Mack gründete die Firma 1780 als Wagenbauerei. Heute baut sie Wasserbahnen, Dark Rides und immer mehr große Achterbahnen. Blue Fire Megacoaster im Europa-Park (2009) ist ein Launch Coaster mit Stengel Dive. Macks Hypercoaster ist Hyperia in Thorpe Park (2024, 72 m), The Ride to Happiness im Plopsaland ein Spinning Coaster mit Launch.',
    alternateNames: ['Mack'],

    relatedTermIds: [
      'b-and-m',
      'bobsled-coaster',
      'intamin',
      'launch-coaster',
      'mackprodukt',
      'powered-coaster',
      'splashdown',
      'stengel-dive',
      'water-coaster',
    ],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      'Amerikanischer Hersteller, der die I-Box-Stahlschiene für Holzachterbahnen und damit den Hybrid Coaster erfunden hat.',
    definition:
      'Rocky Mountain Construction (RMC) ist ein amerikanischer Achterbahnhersteller und Wartungsbetrieb aus Hayden, Idaho. Bekannt ist die Firma für ihre I-Box-Stahlschiene, die sich auf das Gerüst einer bestehenden Holzachterbahn setzen lässt. Der Umbau macht aus einer rumpelnden, gealterten Holzbahn eine Fahrt mit harter Airtime, Inversionen, Abfahrten über die Senkrechte hinaus und übergeneigten Kurven, die eine Schiene aus geschichtetem Holz nicht tragen kann. Steel Vengeance in Cedar Point (aus Mean Streak) und Wicked Cyclone in Six Flags New England sind zwei solche Umbauten, ebenso Untamed in Walibi Holland (2019), entstanden aus der Holzachterbahn Robin Hood. Wildfire in Kolmården in Schweden (2016), die erste RMC-Bahn in Europa, ist dagegen ein Neubau mit demselben Schienensystem. Für einen Park mit einer Holzachterbahn, die niemand mehr fahren will, ist der Umbau eine Alternative zum Abriss.',
    alternateNames: ['Rocky Mountain Construction'],

    aliases: ['Rocky Mountain Construction'],
    relatedTermIds: [
      'airtime',
      'barrel-roll-drop',
      'hybrid-coaster',
      'single-rail-coaster',
      'stall',
      'wooden-coaster',
    ],
  },
  {
    id: 'rcca',
    name: 'Roller Coaster Corporation of America (RCCA)',
    shortDefinition:
      'Amerikanischer Hersteller von Holzachterbahnen aus Atlanta, 1979 gegründet, 2005 aufgelöst. In Europa stehen von ihm The Bandit im Movie Park Germany und Coaster Express im Parque Warner Madrid.',
    definition:
      'Die Roller Coaster Corporation of America (RCCA) aus Atlanta baute Holzachterbahnen. Teile des Holzgerüsts und der Schiene fertigte sie vorab in eigenen Hallen und setzte sie im Park zusammen, was die Bauzeit verkürzte. Ihre erste große Bahn war 1992 Rattler in Six Flags Fiesta Texas, ihre bekannteste Son of Beast in Kings Island (2000), damals die höchste Holzachterbahn der Welt und die erste moderne Holzachterbahn mit Inversion. Son of Beast ist abgerissen, Rattler hat Rocky Mountain Construction zu Iron Rattler umgebaut.\n\nIn Europa baute RCCA drei Bahnen: The Bandit im Movie Park Germany (1999), Magnus Colossus in Terra Mítica (2000, geschlossen) und Coaster Express im Parque Warner Madrid (2002), die letzte Bahn der Firma. 2005 stellte RCCA den Betrieb ein.',
    aliases: ['Roller Coaster Corporation of America', 'RCCA'],
    relatedTermIds: ['wooden-coaster', 'gci', 'rmc'],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      'Niederländischer Achterbahn-Hersteller, einer der größten der Welt. Von Vekoma stammen der Boomerang, der weltweit in sehr vielen Parks steht, und viele Familien- und Thrill-Coaster in Europa.',
    definition:
      'Vekoma Rides Manufacturing ist ein niederländischer Achterbahn-Hersteller mit Sitz in Vlodrop und hat nach Zahl der Anlagen mehr gebaut als fast jeder andere Hersteller. Die Firma wurde 1926 als Maschinenbauunternehmen gegründet und stieg in den 1970er Jahren auf Fahrgeschäfte um. Bekannt wurde Vekoma mit dem Boomerang, einem kompakten Shuttle-Coaster mit drei Inversionen, der günstig lizenziert und weltweit aufgestellt wurde. Weitere verbreitete Modelle sind der Suspended Looping Coaster (SLC), der Giant Inverted Boomerang und der Mine Train. Seit den 2010er Jahren baut Vekoma eine neue Produktlinie („New Generation“) mit ruhiger laufenden Zügen, neuen Layouts und überarbeiteten Familienbahnen. Modelle wie der Family Boomerang, der Tilt Coaster und hängende Familiencoaster stehen inzwischen in vielen europäischen Parks. Auch Disney hat eigens entworfene Vekoma-Anlagen für seine Resorts bestellt.',
    alternateNames: ['Vekoma Rides'],

    relatedTermIds: ['b-and-m', 'boomerang', 'gerstlauer', 'intamin', 'single-rail-coaster'],
    aliases: ['Vekoma Rides'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Deutscher Hersteller des Euro-Fighter mit seiner überhängenden Abfahrt, dazu von Spinning Coastern und kompakten Familienbahnen.',
    definition:
      'Gerstlauer Amusement Rides GmbH ist ein deutscher Achterbahn-Hersteller aus Münsterhausen in Bayern. Hubert Gerstlauer gründete die Firma 1982. Bekannt wurde sie mit dem Euro-Fighter, einem kompakten Coaster mit senkrechtem Kettenlift und einer Abfahrt von bis zu 121 Grad (Takabisha in Fuji-Q Highland, 2011). Ein Euro-Fighter braucht wenig Platz und passt deshalb auch in Stadtparks und kleinere Anlagen, etwa Rage in Adventure Island. Gerstlauer baut außerdem den Infinity Coaster, Spinning Coaster und den SkyRoller, bei dem die Fahrgäste die Drehung ihres Sitzes selbst steuern.',
    alternateNames: ['Gerstlauer Rides'],

    relatedTermIds: [
      'b-and-m',
      'beyond-vertical-drop',
      'euro-fighter',
      'intamin',
      'spinning-coaster',
    ],
    aliases: ['Gerstlauer Rides', 'Gerstlauer Amusement Rides'],
  },
  {
    id: 'schwarzkopf',
    name: 'Schwarzkopf',
    shortDefinition:
      'Deutscher Hersteller, dessen Looping-Achterbahnen aus den 70er und 80er Jahren noch heute in europäischen Parks fahren, meist sehr ruhig.',
    definition:
      'Anton Schwarzkopf GmbH & Co. KG war ein deutscher Achterbahn-Hersteller aus Münsterhausen in Bayern, wo heute Gerstlauer sitzt. Der Familienbetrieb baute ab 1954 Fahrgeschäfte, 1960 übernahm ihn Anton Schwarzkopf. Das Unternehmen war maßgeblich daran beteiligt, Looping-Achterbahnen nach Europa zu bringen. Die erste moderne Looping-Achterbahn der Welt war Revolution in Six Flags Magic Mountain (1976), ein Schwarzkopf-Design. Zu den bekanntesten Modellen gehören der Looping Star, der Thriller/Wildcat und der transportable Looping Coaster, der durch ganz Europa tourte. Schwarzkopf-Bahnen fahren sehr ruhig und kommen mit kompakten Layouts aus. Nach der ersten Insolvenz 1983 und der endgültigen 1992 blieben viele Anlagen über Jahrzehnte in Betrieb. Heute warten sie Spezialfirmen oder Gerstlauer, das die Produktionshallen übernahm.',
    relatedTermIds: ['b-and-m', 'gerstlauer', 'intamin', 'vekoma'],
    aliases: ['Anton Schwarzkopf'],
  },
  {
    id: 'lifthill',
    name: 'Lifthill',
    shortDefinition:
      'Der mechanisch angetriebene Aufstieg einer Achterbahn, der den Zug auf den höchsten Punkt bringt und dabei Lageenergie für die restliche Fahrt aufbaut.',
    definition:
      'Der Lifthill ist der Abschnitt, auf dem ein Antrieb, meist eine Kette in der Gleismitte, den Zug vom Boden auf den höchsten Punkt der Bahn zieht. Das bekannte „Klack-klack-klack“ kommt von der Rückrollsperre. Statt einer Kette gibt es auch Seillifte (leiser und ruhiger), Reibrollenlifte (bei manchen modernen B&M-Coastern) und magnetische Antriebe. Die Höhe des Lifthills bestimmt, wie schnell die Bahn höchstens werden kann. Manche Bahnen haben mehrere Lifthills oder kombinieren einen Lift mit Launches. Meist ist der Lifthill der langsamste Teil der Fahrt.',
    aliases: ['Lifthills', 'Kettenlift'],
    alternateNames: ['Kettenlift', 'Aufzughügel', 'Chain Lift', 'Lift Hill'],

    relatedTermIds: ['block-brake', 'first-drop', 'launch-coaster'],
  },
  {
    id: 'first-drop',
    name: 'First Drop',
    shortDefinition:
      'Die erste Abfahrt nach dem Lifthill, meist der höchste und schnellste Abschnitt der Bahn.',
    definition:
      'Der First Drop ist die erste große Abfahrt direkt nach dem Lifthill oder dem Launch. Bei den meisten klassischen Achterbahnen ist er der höchste Hügel, an seinem Ende erreicht die Bahn ihre Höchstgeschwindigkeit. Winkel, Höhe und Form bestimmen, wie er sich fährt. Bei 80–90 Grad fällt der Zug fast frei, eine parabelförmige Abfahrt kann trotz flacherem Winkel starke Airtime haben. Dive Coaster haben Abfahrten von über 90 Grad (Überkopf-Abfall), vor denen die Fahrgäste nach vorn über der Kante hängen.',
    aliases: ['ersten Drop', 'erster Drop', 'erste Drop', 'First Drops'],
    relatedTermIds: ['airtime', 'airtime-hill', 'beyond-vertical-drop', 'dive-coaster', 'lifthill'],
  },
  {
    id: 'airtime-hill',
    name: 'Airtime Hill',
    shortDefinition: 'Eine Kuppe, auf der negative G-Kräfte die Fahrgäste aus dem Sitz heben.',
    definition:
      'Ein Airtime-Hügel (englisch: Camelback) ist eine Kuppe, über die der Zug so schnell fährt, dass negative G-Kräfte entstehen: Die Fahrgäste schweben oder werden aus dem Sitz gehoben. Bei Floater Airtime sind die Kräfte schwach, bei Ejector Airtime so stark, dass nur der Schoßbügel den Fahrgast hält. Auf Stahlbahnen ist die Kuppe als genaue Parabel geformt, und die Airtime kommt gleichmäßig. Auf Holzbahnen gibt die Schiene nach, die Airtime ist ruppiger und weniger vorhersehbar. Hyper- und Gigacoaster bestehen zu einem großen Teil aus Airtime-Hügeln.',
    aliases: ['Airtime-Hügel'],
    alternateNames: ['Camelback', 'Bunny Hill', 'Airtimehügel', 'Airtime Hills'],

    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 's-hill', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      'Ein spiralförmiger Streckenabschnitt, der sich um eine Mittelachse windet. Die seitlichen G-Kräfte halten dabei lange an.',
    definition:
      'Eine Helix ist ein Streckenabschnitt, der sich spiralförmig um eine Mittelachse windet wie das Gewinde einer Schraube, ohne dass der Zug sich überschlägt. In einer Helix wirken lang anhaltende seitliche G-Kräfte, die die Fahrgäste nach außen drücken. Eine abwärts führende Helix beschleunigt den Zug, eine aufwärts führende bremst ihn. Oft liegt die Helix am Ende einer Strecke und verbraucht dort die restliche Geschwindigkeit. Beispiele sind die unterirdische Schlusshelix von Nemesis in Alton Towers und die Schlusshelix von Expedition GeForce im Holiday Park.',
    aliases: ['Helices'],
    alternateNames: ['Helix', 'Spirale', 'Schraubenkurve'],

    relatedTermIds: ['first-drop', 'horseshoe'],
  },
  {
    id: 'block-brake',
    name: 'Block Brake',
    shortDefinition:
      'Eine Bremssektion, die die Strecke in unabhängige Blöcke aufteilt, damit mehrere Züge gleichzeitig ohne Kollisionsgefahr fahren können.',
    definition:
      'Eine Blockbremse teilt die Achterbahnstrecke in unabhängige Abschnitte („Blöcke“), in denen jeweils nur ein Zug sein darf. Bremst oder hält ein Zug weiter vorn, hält die Steuerung alle folgenden Züge automatisch an ihren Blockbremsen an. So können mehrere Züge gleichzeitig fahren, ohne zusammenstoßen zu können, und die Bahn schafft deutlich mehr Fahrgäste pro Stunde. Blockbremsen sitzen an Stellen, an denen ein haltender Zug nicht zurückrollen kann, meist auf einem flachen oder leicht ansteigenden Abschnitt. Die bekannteste ist der Mid-Course Brake Run (MCBR) in der Mitte der Strecke.',
    relatedTermIds: ['brake-run', 'ride-capacity', 'stacking'],
  },
  {
    id: 'brake-run',
    name: 'Brake Run',
    shortDefinition:
      'Der Bremsabschnitt am Ende der Strecke, auf dem der Zug auf Stationstempo abgebremst wird, meist mit Wirbelstrombremsen.',
    definition:
      'Der Brake Run ist der Abschnitt am Ende der Strecke, auf dem der Zug auf das Tempo abgebremst wird, mit dem er sicher in die Station einfährt. Moderne Brake Runs haben Wirbelstrombremsen (Eddy-Current-Bremsen), Reihen von Permanentmagneten, zwischen denen Metalllamellen am Fahrgestell hindurchlaufen. Sie bremsen ohne Reibung und nutzen sich deshalb nicht ab. Ältere Achterbahnen haben pneumatische oder mechanische Klotzbremsen. Ein Mid-Course Brake Run (MCBR) in der Streckenmitte ist ein Blockabschnitt für den Betrieb mit mehreren Zügen. Den letzten Brake Run vor der Station stimmen manche Parks bewusst sanft ab, damit der Zug noch zügig einfährt.',
    relatedTermIds: ['block-brake', 'lifthill'],
  },
  {
    id: 'cobra-roll',
    name: 'Cobra Roll',
    shortDefinition:
      'Ein Element mit zwei Inversionen, das aussieht wie der erhobene Kopf einer Kobra. Verbunden sind die beiden durch eine 180-Grad-Drehung am Scheitelpunkt.',
    definition:
      'Der Cobra Roll ist ein Element aus zwei Inversionen kurz hintereinander. Die Strecke steigt als halber Looping auf, dreht am Scheitelpunkt in einer kurzen Überkopf-Passage um 180 Grad, wiederholt die Folge gespiegelt und verlässt das Element in der Gegenrichtung. Von der Seite gleicht der Streckenverlauf dem aufgerichteten, gespreizten Kopf einer Kobra. Bekannt gemacht hat ihn B&M: Cobra Rolls haben Dragon Khan in PortAventura und viele B&M-Inverted-Coaster. Vekoma baut aber auch einen in jeden Boomerang, und andere Hersteller setzen ihn ebenfalls ein.',
    relatedTermIds: ['b-and-m', 'banana-roll', 'batwing', 'immelmann', 'inversion', 'sea-serpent'],
  },
  {
    id: 'corkscrew',
    name: 'Corkscrew',
    shortDefinition:
      'Eine spiralförmige 360-Grad-Inversion, bei der sich die Strecke um eine Mittelachse windet. Eine der ältesten und am häufigsten gebauten Inversionen.',
    definition:
      'Der Korkenzieher (englisch: Corkscrew) ist eine der ältesten modernen Inversionen, eingeführt von Arrow Dynamics in den 1970ern. Die Strecke windet sich wie ein Korkenzieher um einen gedachten Zylinder und dreht die Fahrgäste einmal um 360 Grad, seitlich versetzt zur Fahrtrichtung. Korkenzieher wurden oft paarweise hintereinander gebaut und waren typisch für die klassischen Stahlachterbahnen dieser Zeit. Auf deutschen Parkplänen heißt das Element Korkenzieher. Auf neueren Bahnen haben andere Inversionen ihn weitgehend abgelöst.',
    relatedTermIds: ['flat-spin', 'inline-twist', 'inversion'],
  },
  {
    id: 'dive-loop',
    name: 'Dive Loop',
    shortDefinition:
      'Das Spiegelbild eines Immelmanns. Die Strecke taucht steil in einen halben Looping hinab und verlässt ihn waagerecht in der Gegenrichtung.',
    definition:
      'Ein Dive Loop (auch Dive Turn oder umgekehrter Immelmann) ist der Immelmann in umgekehrter Richtung. Statt von unten in einen halben Looping zu steigen, stürzt die Strecke steil nach unten, beschreibt die untere Hälfte eines Loopings und verlässt ihn in der Gegenrichtung zur Einfahrt. Im Sitz ist das ein steiler Sturz, auf den beim Abfangen ein kräftiger Druck in den Sitz folgt, das Spiegelbild der negativen G-Kräfte am Scheitel eines Immelmanns. Dive Loops sind ein B&M-Element und stehen auf vielen Inverted Coastern und Sitz-Loopern des Herstellers, oft im Wechsel mit Immelmanns, sodass beide im Layout aufeinander folgen.',
    relatedTermIds: ['b-and-m', 'immelmann', 'inversion'],
  },
  {
    id: 'inline-twist',
    name: 'Inline Twist',
    shortDefinition:
      'Eine einzelne 360-Grad-Drehung direkt um die Gleisachse. Eine sanfte Inversion, bei der die Fahrtrichtung fast gleich bleibt.',
    definition:
      'Ein Inline Twist (auch Inline Roll oder Barrel Roll) dreht den Zug um 360 Grad um die Längsachse der Strecke, ohne dass sich die Fahrtrichtung wesentlich ändert. Ein Korkenzieher weicht spiralförmig von der Gleismitte ab, der Inline Twist dreht sich genau um sie. Die Inversion ist kurz und sanft, seitliche G-Kräfte sind gering. Inline Twists haben viele B&M-Flying- und Inverted-Coaster, oft paarweise oder kurz hintereinander mit anderen Elementen.',
    relatedTermIds: ['corkscrew', 'flat-spin', 'heartline-roll', 'inversion'],
  },
  {
    id: 'heartline-roll',
    name: 'Heartline Roll',
    shortDefinition:
      'Eine 360-Grad-Drehung um den Schwerpunkt des Fahrgastes statt um das Gleis. Die G-Kräfte bleiben dabei gering.',
    definition:
      'Bei einem Heartline Roll (Herzlinien-Rolle) dreht sich die Strecke um das Herz des Fahrgastes, ungefähr seinen Körperschwerpunkt, statt um das Gleis. Das Herz bleibt während der ganzen Drehung auf gleicher Höhe und an gleicher Stelle. So bleiben die G-Kräfte in der Rolle klein. Heartline Rolls haben viele moderne B&M- und Intamin-Coaster, besonders Hyper- und Inverted Coaster.',
    relatedTermIds: ['inline-twist', 'inversion', 'zero-g-roll'],
  },
  {
    id: 'sidewinder',
    name: 'Sidewinder',
    shortDefinition:
      'Ein halber Looping mit anschließendem halbem Korkenzieher, der die Strecke um 90 Grad dreht und die Fahrtrichtung ändert.',
    definition:
      'Ein Sidewinder besteht aus einem halben Looping, der den Zug nach oben führt, und einem halben Korkenzieher, der ihn wieder aufrichtet und dabei um 90 Grad dreht. So entsteht auf wenig Raum eine Inversion mit deutlicher Richtungsänderung. Der Name spielt auf die schlangenartige Drehung des Elements an.',
    relatedTermIds: ['cobra-roll', 'inversion'],
  },
  {
    id: 'pretzel-loop',
    name: 'Pretzel Loop',
    shortDefinition:
      'Eine große Inversion, die es nur auf B&M-Flying-Coastern gibt. Die Fahrgäste liegen in Superman-Position und fahren durch den Tiefpunkt eines großen Loopings.',
    definition:
      'Den Pretzel Loop gibt es nur auf B&M-Flying-Coastern, auf denen die Fahrgäste waagerecht in Superman-Position liegen. Die Fahrgäste fahren kopfüber steil hinab durch den Tiefpunkt eines großen Loopings und dann wieder steil hinauf. Die Gesamtform ähnelt einer Brezel. Am Tiefpunkt, wo die Fahrgäste mit dem Gesicht nach unten liegen, sind die G-Kräfte außergewöhnlich hoch. Pretzel Loops haben Manta in SeaWorld Orlando und Tatsu in Six Flags Magic Mountain.',
    relatedTermIds: ['b-and-m', 'inline-twist', 'inversion'],
  },
  {
    id: 'batwing',
    name: 'Batwing',
    shortDefinition:
      'Ein Element mit zwei Inversionen, das die Fahrtrichtung um 180 Grad umkehrt und aussieht wie die ausgebreiteten Flügel einer Fledermaus.',
    definition:
      'Ein Batwing besteht aus zwei Inversionen. Die Strecke steigt als halber Looping auf, führt am Scheitelpunkt durch einen halben Korkenzieher kurz über Kopf und läuft dann gespiegelt zurück zum Boden. Danach fährt der Zug in die Gegenrichtung. Von oben gleicht der Streckenverlauf den ausgebreiteten Flügeln einer Fledermaus. Batwings baut vor allem B&M, etwa bei Afterburn in Carowinds und The Incredible Hulk Coaster in Universal’s Islands of Adventure. Ein Bowtie sieht ähnlich aus, ändert die Fahrtrichtung aber nicht.',
    relatedTermIds: ['b-and-m', 'bowtie', 'cobra-roll', 'inversion'],
  },
  {
    id: 'norwegian-loop',
    name: 'Norwegian Loop',
    shortDefinition:
      'Eine Looping-Variante, bei der Einfahrt und Ausfahrt oben liegen statt unten.',
    definition:
      'Ein Norwegian Loop ist ein Element mit zwei Inversionen, das wie ein großer Looping aussieht, in den der Zug von oben einfährt: ein Dive Loop, direkt gefolgt von einem Immelmann. Der Zug steigt, rollt in einen halben Looping, der ihn Richtung Boden stürzen lässt, schwingt durch den Tiefpunkt und steigt in einen zweiten halben Looping, aus dem er oben herausrollt, wieder in der Richtung, aus der er kam. Von der Seite sieht das Paar aus wie ein einziger Looping mit Ein- und Ausfahrt oben statt unten.\n\nZum ersten Mal gebaut wurde das Element bei SpeedMonster in TusenFryd bei Oslo (Intamin, 2006), daher der Name. Dort umschließt der Looping die Rolltreppe, die die Besucher in den Park hinaufbringt, sie fahren also durch ihn hindurch, bevor sie überhaupt eine Achterbahn betreten haben. Norwegian Loops sind bis heute selten.',
    relatedTermIds: ['dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'flat-spin',
    name: 'Flat Spin',
    shortDefinition:
      'Ein Korkenzieher-Element auf Inverted- oder Flying-Coastern, bei dem die Drehung in nahezu horizontaler Ebene stattfindet.',
    definition:
      'Ein Flat Spin ist eine Korkenzieher-artige Inversion, die hauptsächlich auf B&M-Inverted- und Flying-Coastern vorkommt. Die Spirale ist so ausgerichtet, dass sie von außen fast waagerecht aussieht. Auf einem Inverted Coaster, bei dem der Zug unter dem Gleis hängt, schwingen die Fahrgäste dabei in einem breiten, fast flachen Kreis. Die Drehung ist langsam und anhaltend, die G-Kräfte sind mäßig. Flat Spins haben B&M-Inverted-Coaster wie Banshee in Kings Island.',
    relatedTermIds: ['b-and-m', 'corkscrew', 'inline-twist', 'inversion'],
  },
  {
    id: 'cutback',
    name: 'Cutback',
    shortDefinition:
      'Eine halbe Korkenzieher-Inversion, die zugleich die Fahrtrichtung um etwa 180 Grad umkehrt.',
    definition:
      'Beim Cutback führt die Strecke einen halben Korkenzieher aus und biegt sich dabei um etwa 180 Grad zurück. Anders als nach einem normalen Korkenzieher fährt der Zug danach fast in die Gegenrichtung. Cutbacks sind selten. Man findet sie auf bestimmten Vekoma-Modellen und Einzelanfertigungen, die auf wenig Raum wenden und dabei invertieren sollen. Der Name beschreibt, wie die Strecke beim Überschlag auf ihre alte Richtung „zurückschneidet“.',
    relatedTermIds: ['corkscrew', 'inversion', 'sidewinder'],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    shortDefinition:
      'Eine Variante des Sea Serpent mit zwei Inversionen und tiefer liegendem Verbindungsstück. Der Zug behält seine Richtung, das Element ist niedriger gebaut.',
    definition:
      'Der Butterfly ist ein Element mit zwei Inversionen, ähnlich dem Sea Serpent (zwei halbe Loopings, an der Spitze verbunden), aber mit tieferem Scheitelpunkt und anderer Form. Wie beim Sea Serpent fährt der Zug durch zwei Inversionen und behält seine Richtung. Das Verbindungsstück zwischen den halben Loopings liegt aber tiefer, der Butterfly ist deshalb niedriger. Das Element findet sich auf bestimmten Vekoma-Coastern und Einzelanfertigungen. Vom Bowtie unterscheidet es sich in der Form (beide haben zwei Inversionen ohne Richtungsänderung), vom Batwing darin, dass es die Richtung nicht umkehrt.',
    relatedTermIds: ['batwing', 'bowtie', 'inversion'],
  },
  {
    id: 'bowtie',
    name: 'Bowtie',
    shortDefinition:
      'Ein Element aus zwei gespiegelten halben Loopings in Form einer Fliege. Nach den zwei Inversionen fährt der Zug in dieselbe Richtung weiter.',
    definition:
      'Ein Bowtie besteht aus zwei gespiegelten halben Loopings, die an ihrer Spitze verbunden sind. Der Zug verlässt ihn in derselben Richtung, in der er eingefahren ist, ein Batwing kehrt die Richtung dagegen um. Von oben gleicht der Streckenverlauf einer Fliege (englisch „bow tie“). Bowties sind selten und finden sich vor allem auf bestimmten Vekoma-Anlagen und Einzelanfertigungen. Die beiden Inversionen sind sanft und folgen kurz aufeinander.',
    relatedTermIds: ['batwing', 'butterfly', 'inversion'],
  },
  {
    id: 'bunnyhop',
    name: 'Bunnyhop',
    shortDefinition:
      'Eine Reihe kleiner Airtime-Hügel am Ende der Strecke, auf denen der langsamer gewordene Zug sanfte Floater-Airtime hat.',
    definition:
      'Ein Bunnyhop ist eine Reihe kleiner, kurz aufeinander folgender Hügel gegen Ende einer Strecke, wenn der Zug schon den Großteil seiner Geschwindigkeit verloren hat. Bei diesem Tempo reicht es für sanfte Floater-Airtime, die Fahrgäste heben im Takt der Hügel kurz ab. Auf den schnelleren Hügeln weiter vorn im Layout ist es eher Ejector Airtime. Der Name kommt vom Hüpfen eines Kaninchens. Bunnyhops stehen oft am Ende von Hyper-Coastern, Gigacoastern und Holzachterbahnen.',
    relatedTermIds: ['airtime', 'airtime-hill', 'brake-run', 's-hill'],
  },
  {
    id: 'stengel-dive',
    name: 'Stengel Dive',
    shortDefinition:
      'Ein Airtime-Hügel mit über 90 Grad Querneigung, benannt nach dem Ingenieur Werner Stengel. Die Fahrgäste hängen seitlich und heben zugleich aus dem Sitz ab.',
    definition:
      'Beim Stengel Dive neigt sich die Strecke auf einem Airtime-Hügel um mehr als 90 Grad, also über die Senkrechte hinaus. Die Fahrgäste hängen seitlich oder leicht kopfüber, und die Form des Hügels erzeugt zugleich negative G-Kräfte. Benannt ist das Element nach dem deutschen Ingenieur Werner Stengel, der es entwickelt hat. Stengel Dives findet man vor allem auf Hypercoastern von Mack Rides. Goliath in Walibi Holland (2002) hatte als erste Bahn einen, Blue Fire Megacoaster im Europa-Park (2009) hat auch einen, spätere Bahnen wie Ride to Happiness haben das Element weiterentwickelt.',
    relatedTermIds: ['airtime', 'airtime-hill', 'mack-rides'],
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    shortDefinition:
      'Eine stark geneigte 180-Grad-Kurve in Hufeisenform, die den Zug in die Gegenrichtung umlenkt, oft zwischen zwei Launches.',
    definition:
      'Ein Horseshoe (Hufeisen) ist eine sehr stark geneigte Halbkreiskurve, meist mit 75 bis 90 Grad Querneigung, in der der Zug um 180 Grad wendet. Durch die starke Neigung bleiben die seitlichen G-Kräfte trotz des engen Radius gering. Auf Launch Coastern mit mehreren Launches wendet der Zug oft in einem Horseshoe, bevor der nächste Launch folgt. Man findet das Element auf Intamin-Accelerator-Coastern und auf Multi-Launch-Bahnen von Mack.',
    relatedTermIds: ['intamin', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'predrop',
    name: 'Predrop',
    shortDefinition:
      'Ein kleiner Hügel kurz vor dem First Drop auf Coastern mit Kettenlift. Er entlastet die Kette, und die Fahrgäste haben dort kurz Airtime.',
    definition:
      'Ein Predrop ist ein kleiner Hügel oder eine Senke am Ende des Lifthills, kurz vor der ersten großen Abfahrt. Er entlastet die Liftkette, wenn der Zug über die Kuppe fährt, damit der Übergang nicht ruckt. Nebenbei heben die Fahrgäste auf dem Predrop kurz aus dem Sitz ab. Predrops gibt es auf Holz- und Stahlachterbahnen. Einer der bekanntesten ist der von Goliath in Six Flags Magic Mountain.',
    relatedTermIds: ['airtime', 'first-drop', 'lifthill'],
  },
  {
    id: 'top-hat',
    name: 'Top Hat',
    shortDefinition:
      'Ein hohes, schmales Element, das fast senkrecht aufsteigt und fast senkrecht wieder abfällt. Typisch für Intamins hydraulische Launch Coaster.',
    definition:
      'Beim Top Hat steigt die Strecke fast senkrecht zu einer scharfen Kuppe auf und fällt auf der anderen Seite fast senkrecht wieder ab. Von der Seite sieht das aus wie ein Zylinderhut. Beim Inside Top Hat dreht sich die Strecke am Scheitelpunkt nach innen, beim Outside Top Hat nach außen, und die Fahrgäste haben die Airtime dort in Schräglage. Auf Intamins hydraulischen Launch Coastern (Accelerator Coaster) fährt der Zug nach dem Launch auf über 200 km/h direkt in den Top Hat. Die höchsten hatten Kingda Ka (139 m, 2024 geschlossen) und Top Thrill Dragster (128 m, 2024 mit LSM-Launch zu Top Thrill 2 umgebaut). In Europa hat Red Force in Ferrari Land einen, nach einem LSM-Launch.',
    relatedTermIds: ['first-drop', 'intamin', 'launch-coaster'],
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    shortDefinition:
      'Ein kompaktes Achterbahn-Modell von Vekoma. Der Zug fährt drei Inversionen erst vorwärts und dann rückwärts, zusammen sechs.',
    definition:
      'Der Boomerang von Vekoma ist eines der am häufigsten gebauten Achterbahn-Modelle. Das Layout hat drei Inversionen, eine Cobra Roll (zwei Inversionen) und danach einen Looping. Der Zug fährt sie zuerst vorwärts, wird dann auf einen zweiten, schrägen Lift gezogen, dort losgelassen und fährt dieselben Elemente rückwärts. So kommt die Fahrt auf sechs Inversionen (drei in jede Richtung) und braucht sehr wenig Grundfläche, auch Parks mit wenig Platz können einen aufstellen. Weltweit wurden über 50 Boomerangs gebaut. In mittelgroßen Parks fahren viele davon bis heute als Einstiegsbahn.',
    relatedTermIds: ['cobra-roll', 'inversion', 'vertical-loop'],
  },
  {
    id: 'euro-fighter',
    name: 'Euro-Fighter',
    shortDefinition:
      'Ein kompaktes Achterbahn-Modell von Gerstlauer. Nach einem senkrechten Kettenlift fällt die Strecke senkrecht oder überhängend ab.',
    definition:
      'Der Euro-Fighter ist Gerstlauers kompaktes Achterbahn-Modell. Nach einem senkrechten Kettenlift fällt die Strecke senkrecht (90 Grad) oder überhängend (bis zu 121 Grad) ab. Auf kleiner Grundfläche folgen mehrere Inversionen, enge Kurven und hohe G-Kräfte. Beim überhängenden Abfall (steiler als senkrecht) hält der Zug oben kurz an, und die Fahrgäste hängen über der Kante, bevor es hinuntergeht. Euro-Fighter in Europa sind etwa Saw – The Ride in Thorpe Park, Rage in Adventure Island und Fluch von Novgorod im Hansa-Park.',
    relatedTermIds: ['beyond-vertical-drop', 'first-drop', 'inversion', 'lifthill'],
  },
  {
    id: 'dive-coaster',
    name: 'Dive Coaster',
    shortDefinition:
      'Ein Achterbahntyp mit sehr breitem Zug und fast senkrechter Abfahrt, vor der der Zug an der Kante kurz anhält.',
    definition:
      'Ein Dive Coaster hat sehr breite Züge (meist 8–10 Sitze in einer Reihe) und eine fast senkrechte oder überhängende Abfahrt (90 Grad und mehr). Direkt über der Kante hält der Zug kurz an, bevor die Bremse ihn freigibt. Der Halt ist gewollt und soll die Spannung vor dem Sturz steigern. Durch die breiten Reihen sieht jeder Fahrgast senkrecht nach unten. Geprägt hat das Konzept B&Ms Dive Machine (Oblivion in Alton Towers, Krake im Heide-Park). Gerstlauer baut ein Konkurrenzmodell.',
    relatedTermIds: [
      'b-and-m',
      'beyond-vertical-drop',
      'euro-fighter',
      'first-drop',
      'launch-coaster',
    ],
    aliases: ['Dive Coasters'],
  },
  {
    id: 'credit',
    name: 'Credit',
    shortDefinition:
      'Eine gefahrene Achterbahn, die ein Coaster-Fan in seine persönliche Zählung aufnimmt.',
    definition:
      'Ein Credit (auch Cred) ist eine Achterbahn, die jemand gefahren ist und in seine persönliche Zählung aufnimmt. Credits sammeln heißt, so viele verschiedene Achterbahnen wie möglich zu fahren, und ist unter Coaster-Fans weit verbreitet. Die Regeln sind nicht einheitlich. Manche zählen nur Sitzcoaster, andere alle Schienenbahnen, und ob verschiedene Zugtypen derselben Bahn einzeln zählen, hält jeder anders. Auf Websites wie der Roller Coaster Database (RCDB) lassen sich die Credits festhalten. Für neue Credits reisen viele Sammler ins Ausland oder in abgelegene Parks.',
    alternateNames: ['Cred', 'Creds', 'Credit', 'Zähler'],

    relatedTermIds: [
      'hybrid-coaster',
      'mackprodukt',
      'onride-offride',
      'pov',
      'powered-coaster',
      're-ride',
      'wooden-coaster',
    ],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      'Ein Video aus der ersten Reihe einer Achterbahn, gefilmt aus Sicht des Fahrgasts.',
    definition:
      'POV (Point of View) ist ein Onride-Video aus Sicht eines Fahrgasts in der ersten Reihe, meist von einer am Zug befestigten Kamera. Viele Besucher sehen sich vor dem Parkbesuch das POV einer Achterbahn an, um die Strecke vorher zu kennen. Manche Parks drehen offizielle POVs als Werbung, häufiger filmen Gäste oder Medien. Auf einem guten POV sind alle Elemente, Abfahrten und Inversionen in ihrer Reihenfolge zu sehen. Auf YouTube gibt es zehntausende Coaster-POVs. Der Begriff steht auch allgemein für Aufnahmen von Parkattraktionen aus der Ich-Perspektive.',
    alternateNames: ['Point of View', 'On-Ride Video', 'Onboard Video', 'Fahrperspektive'],

    relatedTermIds: ['credit', 'dark-ride', 'onride-offride'],
  },
  {
    id: 'vr-coaster',
    name: 'VR Coaster',
    shortDefinition:
      'Eine Achterbahn, bei der Fahrgäste VR-Brillen tragen, die eine synchronisierte virtuelle Welt über die physische Fahrt legen.',
    definition:
      'Auf einem VR Coaster tragen die Fahrgäste VR-Brillen, in denen eine virtuelle Umgebung synchron zu den Bewegungen der Achterbahn läuft. Fährt die Bahn einen Looping, dreht sich auch das Bild, bei einer Abfahrt stürzt die virtuelle Welt mit. Zwischen etwa 2015 und 2019 rüsteten viele Parks bestehende Bahnen mit VR um. Manchen Gästen sind die Brillen unbequem oder unhygienisch, manchen wird darin übel. Viele Parks, die VR eingeführt hatten, haben es wieder abgeschafft. Mack Rides hat mit VR Coaster ein eigenes System im Angebot.',
    relatedTermIds: ['dark-ride', 'height-requirement'],
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      'Exclusive Ride Time: eine Zeit, in der nur eine bestimmte Gruppe, etwa ein Fanclub oder Hotelgäste, eine oder mehrere Attraktionen fahren darf.',
    definition:
      'ERT (Exclusive Ride Time, auf Deutsch auch EFZ, Exklusive Fahrzeit) ist ein Zeitraum, in dem eine bestimmte Gruppe eine oder mehrere Attraktionen für sich hat und das übrige Publikum draußen bleibt: Mitglieder eines Achterbahnclubs, Hotelgäste mit Premium-Paket oder Jahreskarteninhaber bei einer Sonderveranstaltung. Während der ERT fahren dieselben Leute immer wieder fast ohne Wartezeit, oft Dutzende Runden in einer Session. Parks bieten sie für Clubtreffen an (European Coaster Club, Coasterfriends, American Coaster Enthusiasts und zahlreiche nationale Vereine), für Hotelpakete mit Zugang vor oder nach den regulären Öffnungszeiten und als Teil von Sonderveranstaltungen. Fünfzehn oder zwanzig Fahrten hintereinander, in verschiedenen Reihen und zu verschiedenen Tageszeiten, zeigen den Charakter einer Achterbahn so, wie es eine einzelne Fahrt in einem vollen Park nicht kann.',
    alternateNames: ['ERT', 'Exclusive Ride Time', 'Exklusive Fahrzeit', 'EFZ'],

    relatedTermIds: ['credit', 'early-entry', 'hard-ticket-event', 're-ride', 'rope-drop'],
  },
  {
    id: 'touring-plan',
    name: 'Touringplan',
    shortDefinition:
      'Ein Besuchsplan, der die Attraktionen so ordnet, dass man möglichst wenig wartet und möglichst viel fährt.',
    definition:
      'Ein Touringplan legt vorab fest, in welcher Reihenfolge man Attraktionen besucht, wann man isst und welchen Weg man durch den Park nimmt, damit die Wartezeit über den Tag möglichst kurz bleibt. Wer einen guten Touringplan aufstellt, plant ein, welche Bereiche sich zuerst füllen, wie viele Fahrgäste eine Attraktion pro Stunde schafft, wie sich die Warteschlangen entwickeln, wann Shows sind und wie das Wetter wird. Seiten wie TouringPlans.com veröffentlichen ausführliche Pläne für große Parks. Mit den Live-Wartezeiten von park.fan lässt sich ein Plan unterwegs anpassen, im Besucherkalender sucht man vorher den Tag aus.',
    aliases: ['Touringpläne'],
    alternateNames: ['Touring Plan', 'Besuchsplan', 'Parkplan', 'Besuchsstrategie'],

    relatedTermIds: ['crowd-calendar', 'early-entry', 'rope-drop', 'wait-time'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      'Mehrere Züge warten in der Bremssektion hintereinander, weil das Be- und Entladen länger dauert als eine Fahrt. Das senkt die Kapazität und verlängert die Wartezeiten.',
    definition:
      'Stacking (Aufstapeln) tritt auf, wenn das Be- und Entladen einer Achterbahn länger dauert als eine Fahrt, sodass Züge in der Bremssektion warten müssen, bis die Station frei ist. Statt einen Zug loszuschicken, sobald der vorherige zurück ist, hält das Personal mehrere Züge in der Bremssektion fest, und die Bahn steht zwischen den Abfahrten kurz still. Stacking senkt die Kapazität direkt und verlängert die Wartezeiten. Häufige Ursachen sind langsames Be- und Entladen (oft wegen aufwendiger Rückhaltesysteme), Kontrollen auf lose Gegenstände oder zu wenig Personal. Aus der Warteschlange sieht man oft, ob eine Bahn „stackt“: Dann stehen Züge vor der Station.',
    alternateNames: ['Train Stacking', 'Zugstau'],

    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      'Achterbahntyp, bei dem der Zug unter der Schiene hängt und die Beine der Fahrgäste frei in der Luft baumeln.',
    definition:
      'Ein Inverted Coaster (auch Invert) ist eine Achterbahn, bei der der Zug starr unterhalb der Schiene befestigt ist. Bei einem Swinging Coaster kann er dagegen seitlich schwingen. Die Fahrgäste sitzen mit frei hängenden Beinen. B&M entwickelte den modernen Inverted Coaster 1992 mit Batman The Ride und ist bis heute der führende Hersteller. Typisch sind Head Chopper, bei denen Stützen und Streckenteile knapp an den Fahrgästen vorbeiziehen, sowie Zero-G Rolls und Cobra Rolls. Beispiele sind Nemesis (Alton Towers), Katun (Mirabilandia), Oziris (Parc Astérix) und Banshee (Kings Island).',
    alternateNames: ['Inverted Coaster', 'Inverted', 'Invert', 'Hängebahn', 'Invert Coaster'],

    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'Achterbahntyp mit Sitzen links und rechts neben der Schiene. Über und unter den Fahrgästen ist keine Strecke.',
    definition:
      'Beim Wing Coaster (auch Wing Rider) sitzen je zwei Fahrgäste links und rechts neben der Schiene, ohne Strecke oder Wagen über, unter oder neben sich. Die Strecke kann deshalb knapp an Kulissen und Bauteilen vorbeiführen. Die meisten Wing Coaster hat B&M gebaut. Europäische Beispiele sind Flug der Dämonen im Heide-Park und The Swarm in Thorpe Park.',
    alternateNames: ['Wing Coaster', 'Wing Rider', 'Wingcoaster', 'Flügelachterbahn'],

    relatedTermIds: ['b-and-m', 'dive-coaster', 'inverted-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition: 'Achterbahn mit frei drehbaren Wagen. Jede Fahrt verläuft etwas anders.',
    definition:
      'Ein Spinning Coaster (auch Drehachterbahn) hat Wagen auf einer Plattform, die sich während der Fahrt frei um eine senkrechte Achse dreht. Niemand steuert die Drehung, deshalb fährt jeder Wagen die Strecke in einer anderen Folge aus vorwärts, rückwärts und seitwärts, und zwei Fahrten hintereinander auf derselben Bahn fühlen sich verschieden an. Die meisten baut Mack Rides aus Waldkirch, auch Maurer und Gerstlauer haben eigene Modelle. Europäische Beispiele sind Winja’s Fear und Winja’s Force im Phantasialand und Dwervelwind im Toverland. Für Familien passen Spinning Coaster gut, weil die Mindestgröße meist niedriger liegt als bei einer vergleichbaren Bahn ohne Drehung.',
    alternateNames: ['Spinning Coaster', 'Spinner', 'Drehachterbahn'],

    relatedTermIds: ['credit', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'xtreme-spinning-coaster',
    name: 'Xtreme Spinning Coaster',
    shortDefinition:
      'Das große Spinning-Coaster-Modell von Mack Rides. Es ist schneller und höher als ein normaler Spinning Coaster, und die Wagen drehen sich stärker.',
    definition:
      'Der Xtreme Spinning Coaster (XSC) ist das größte Spinning-Coaster-Modell von Mack Rides. Der erste war Time Traveler in Silver Dollar City (2018), in Europa fährt The Ride to Happiness im Plopsaland De Panne (2021). Ein normaler Spinning Coaster ist eher auf Familien ausgelegt. Der XSC ist größer, hat steilere Abfahrten und höhere Geschwindigkeiten, und sein Drehmechanismus lässt die Wagen stärker rotieren: Sie drehen sich in jedem Element schneller und öfter.\n\nWeil die Wagen bei höherem Tempo schneller die Richtung wechseln, fährt sich dieselbe Strecke von Fahrt zu Fahrt sehr unterschiedlich. Das Modell liegt zwischen den Spinning Coastern für Familien und großen Thrill-Coastern.',
    alternateNames: ['XSC'],
    relatedTermIds: ['credit', 'mack-rides', 'spinning-coaster'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'Achterbahn mit mehr als 61 m Höhe, ohne Inversionen, mit hoher Geschwindigkeit und viel Airtime.',
    definition:
      'Hyper Coaster ist die Klasse der Achterbahnen zwischen 61 und 91 m Höhe. B&M nennt eines seiner Modelle „Hyper Coaster“, Intamin ein vergleichbares „Mega Coaster“. Die Modellnamen garantieren die Höhenklasse aber nicht: Goliath in Walibi Holland (46,8 m) und Kondaa in Walibi Belgium (50 m) sind Mega Coaster von Intamin, Goliath in La Ronde (53,3 m) ist ein Hyper Coaster von B&M. Hyper Coaster haben statt Inversionen lange Airtime-Hügel, die mit hoher Geschwindigkeit befahren werden. Shambhala in PortAventura (76 m) und Hyperion in Energylandia (77 m) sind die höchsten Hyper Coaster Europas. Ein weiteres Beispiel ist Mako in SeaWorld Orlando.',
    aliases: ['Hyper Coasters'],
    alternateNames: ['Hyper Coaster', 'Hypercoaster'],

    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'giga-coaster', 'intamin'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition: 'Achterbahn mit mehr als 91 m Höhe, die nächste Stufe über dem Hyper Coaster.',
    definition:
      'Giga Coaster ist die Klasse der Achterbahnen zwischen 91 und 121 m Höhe. Den Begriff prägten Cedar Fair und Intamin im Jahr 2000 für Millennium Force in Cedar Point. Giga Coaster sind sehr hoch, haben lange Strecken und starke Airtime. Ein Beispiel ist Fury 325 in Carowinds. In Europa gibt es genau einen: Red Force in Ferrari Land (PortAventura World, Spanien) ist seit 2017 mit 112 m ein Giga Coaster. Hyperion in Energylandia (Polen) ist mit 77 m ein Hyper Coaster.',
    aliases: ['Giga Coasters'],
    alternateNames: ['Giga Coaster', 'Gigacoaster'],

    relatedTermIds: ['airtime', 'first-drop', 'hyper-coaster'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'Eine Kurve mit mehr als 90 Grad Querneigung, in der die Fahrgäste kurz über die Senkrechte hinaus gekippt werden.',
    definition:
      'Eine übergeneigte Kurve (englisch: Overbanked Turn) ist eine Kurve mit mehr als 90 Grad Querneigung. Die Strecke ist also über die Senkrechte hinaus gekippt, und die Fahrgäste werden kurz über die Seitenlage hinaus geneigt, ohne eine vollständige Inversion zu fahren. Dabei wirken seitliche und leicht negative G-Kräfte zugleich. Übergeneigte Kurven haben viele moderne B&M-Hyper- und Intamin-Mega-Coaster, auf RMC-Bahnen gehören sie zu fast jedem Layout. Von außen werden sie manchmal für Inversionen gehalten.',
    alternateNames: ['Overbanked', 'Übergeneigte Kurve', 'Banked Turn'],

    relatedTermIds: ['airtime', 'b-and-m', 'intamin', 'inversion', 'rmc'],
  },
  {
    id: 'trim-brake',
    name: 'Trim Brake',
    shortDefinition:
      'Eine Magnetbremse im Streckenverlauf, die den Zug abbremst, ohne ihn vollständig anzuhalten.',
    definition:
      'Eine Trim-Bremse sitzt mitten auf der Strecke und nimmt dem Zug vor einem bestimmten Abschnitt etwas Tempo, ohne ihn wie eine Blockbremse anzuhalten. Parks setzen sie ein, um die G-Kräfte eines heftigen Elements in Grenzen zu halten, den Verschleiß der Strecke zu senken, Lärm und Vibrationen zu dämpfen oder die Bahn bei jeder Temperatur und Beladung im vorgesehenen Bereich zu halten. Eine Trim kostet Airtime: Ein Hügel, der für ein bestimmtes Tempo gezeichnet ist, gibt weniger her, wenn der Zug langsamer ankommt. Wie stark eine Trim greift, hängt von der Jahreszeit ab (bei Kälte mehr), vom Gewicht im Zug und von der Linie des Parks, und so kann sich dieselbe Strecke wie zwei verschiedene Bahnen anfühlen.',
    relatedTermIds: ['airtime', 'block-brake', 'brake-run'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      'Ein Launch Coaster schafft den höchsten Punkt nicht und rollt rückwärts auf die Abschussstrecke zurück.',
    definition:
      'Ein Rollback tritt auf, wenn ein Zug nach dem Launch zu langsam ist, um den höchsten Punkt der Strecke zu überwinden, und deshalb rückwärts auf die Abschussstrecke zurückrollt. Bei hydraulischen Launch Coastern (Stealth, bis 2024 auch Top Thrill Dragster) passiert das, wenn der Abschuss nicht die volle Kraft bringt. Am Tiefpunkt fangen Magnetbremsen den Zug auf. Rollbacks sind selten, kommen bei hydraulischen Launch Coastern aber immer wieder vor. Den Fahrgästen passiert dabei nichts, die Fahrt wird aber unterbrochen.',
    relatedTermIds: ['block-brake', 'downtime', 'launch-coaster'],
  },
  {
    id: 'animatronics',
    name: 'Animatronic',
    shortDefinition:
      'Elektromechanische Roboterfiguren in Themenfahrten und Shows, die sich bewegen und Figuren oder Szenen darstellen.',
    definition:
      'Animatronics (Singular: Animatronic, auch Animatronik) sind elektromechanische Roboterfiguren, die in Themenfahrten und Live-Shows Figuren möglichst echt darstellen. Disney prägte den Begriff „Audio-Animatronics“ und zeigte die Technik zum ersten Mal öffentlich im Juni 1963 in Walt Disney’s Enchanted Tiki Room in Disneyland. Es gibt einfache Figuren, die immer dieselbe Bewegung wiederholen, und Roboter mit Servo- und Pneumatikantrieb, die Gesichtsausdrücke zeigen und den ganzen Körper bewegen. Aufwendige Beispiele sind der Schamane in Disneys Pandora – The World of Avatar und die Dinosaurier der Jurassic-World-Fahrt bei Universal.',
    alternateNames: ['Animatronics', 'Audio-Animatronics', 'Roboterfigur'],

    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'KI-Prognose',
    shortDefinition:
      'KI-gestützte Vorhersagen für Besucherdichte und Wartezeiten in Freizeitparks, so weit ein Park seinen Zeitplan veröffentlicht hat.',
    definition:
      'Eine KI-Prognose ist bei park.fan eine Vorhersage von Fancast, dem Machine-Learning-Modell, das park.fan mit seinen eigenen Messungen trainiert. Für jede Attraktion und jede Stunde eines kommenden Tages sagt es die erwartete Wartezeit voraus und leitet daraus die Besucherdichte des Tages ab.\n\nTrainiert wird es mit den Wartezeiten, die park.fan in über 200 Parks gemessen hat. Zu dieser Historie kommen der Wetterbericht, Schulferien, Feiertage und Brückentage sowie das Programm des Parks, etwa Halloween-Abende oder der Saisonstart. Neu trainiert wird jeden Tag um 06:00 UTC mit den Wartezeiten des Vortags.\n\nWie weit die Prognose reicht, bestimmt der Zeitplan des Parks. Ein ganzjährig geöffneter Park bekommt Prognosen für Tage, die fast ein Jahr entfernt sind, ein Saisonpark bis zum Ende seiner veröffentlichten Saison. Jede Prognose wird hinterher mit den tatsächlich gemessenen Wartezeiten verglichen, der Fehler steht auf park.fan und erscheint je Attraktion als Badge zur Genauigkeit.',
    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
    alternateNames: ['AI Forecast', 'AI Forecasts'],
    aliases: ['KI-Prognose', 'KI-Prognosen', 'KI-Vorhersage', 'KI-Vorhersagen'],
  },
  {
    id: 'ki',
    name: 'KI',
    shortDefinition:
      'Künstliche Intelligenz. Bei park.fan sind das Machine-Learning-Modelle, die Besucherprognosen und Wartezeiten für Freizeitparks berechnen.',
    definition:
      'KI (Künstliche Intelligenz) steht hier für Machine-Learning-Algorithmen, die Muster in großen Datensätzen erkennen und Vorhersagen treffen. park.fan setzt KI-Modelle ein, die auf den mitgeschriebenen Wartezeiten, Schulferienkalendern, Wetterdaten und Veranstaltungsankündigungen trainiert wurden. Diese Modelle berechnen täglich neue Prognosen für Besucherdichte und erwartete Wartezeiten, für jeden Park und jeden Tag, den der Park schon veröffentlicht hat.',
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-forecast'],
    alternateNames: ['Künstliche Intelligenz'],
  },
  {
    id: 'realtime-wait-time',
    name: 'Echtzeit-Wartezeit',
    shortDefinition:
      'Live-Wartezeit direkt aus den Systemen eines Freizeitparks, alle fünf Minuten neu.',
    definition:
      'Eine Echtzeit-Wartezeit ist die Wartezeit, die ein Park in diesem Moment für eine Attraktion anzeigt, im Unterschied zu einem Durchschnitt über vergangene Tage. Sie ändert sich über den Tag, und fällt eine Attraktion aus, meldet der Park sie als gestört, bis sie wieder fährt.\n\npark.fan fragt die Wartezeitdaten der Parks alle fünf Minuten bei ThemeParks.wiki, Wartezeiten.app und Queue-Times.com ab. Dazu gehören die normale Warteschlange, Single Rider, bezahlte Vorrangspuren wie Lightning Lane und virtuelle Warteschlangen, wo ein Park sie veröffentlicht, außerdem der Betriebsstatus jeder Attraktion. Neben der Wartezeit auf der Attraktionskarte zeigt ein kleines Badge, ob die letzten beiden Messungen höher oder niedriger lagen als die beiden davor.\n\nAuch eine Echtzeit-Wartezeit bleibt die Schätzung des Parks, und die tatsächlich in der Warteschlange verbrachte Zeit kann länger oder kürzer ausfallen.',
    relatedTermIds: ['crowd-forecast', 'posted-wait-time', 'wait-time'],
    alternateNames: ['Live-Wartezeit', 'Live-Wartezeiten'],
    aliases: ['Echtzeit-Wartezeit', 'Echtzeit-Wartezeiten', 'Live-Wartezeit', 'Live-Wartezeiten'],
  },
  {
    id: 'crowd-forecast',
    name: 'Crowd-Prognose',
    shortDefinition:
      'KI-basierte Vorhersage der Besucherdichte für einen Freizeitpark an einem bestimmten Tag.',
    definition:
      'Eine Crowd-Prognose sagt, wie voll ein Park an einem bestimmten Tag wird und zu welchen Stunden. Die Prognosen von park.fan kommen von Fancast, dem eigenen Modell. Es sagt für jede Attraktion und jede Stunde die Wartezeit voraus und fasst sie zur Besucherdichte des Tages zusammen, auf derselben Skala wie die Live-Anzeige.\n\nDas Modell lernt aus den gemessenen Wartezeiten des Parks. Außerdem gehen Wetterbericht, Schulferien und Feiertage ein und das, was an dem Tag im Park passiert, etwa eine Sonderveranstaltung oder der Saisonstart. Neu trainiert wird das Modell täglich um 06:00 UTC.\n\nAm Tag danach wird jede Prognose neben die tatsächlich gemessenen Wartezeiten gelegt, und die Differenz geht in das nächste Training ein. Die Fehlerwerte, der mittlere prozentuale Fehler und R², stehen auf park.fan und werden nach jedem Lauf neu berechnet, auch wenn sie schlechter werden. Auf den Attraktionsseiten zeigt ein Badge die Prognosegenauigkeit für die jeweilige Attraktion.',
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-level', 'peak-day'],
    alternateNames: ['Besucherprognose', 'Besucherprognosen'],
    aliases: [
      'Crowd-Prognose',
      'Crowd-Prognosen',
      'Besucherprognose',
      'Besucherprognosen',
      'Fancast',
    ],
  },
  {
    id: 'opening-hours',
    name: 'Öffnungszeiten',
    shortDefinition:
      'Der offizielle Tagesplan mit den Öffnungs- und Schließzeiten eines Freizeitparks oder einer Attraktion.',
    definition:
      'Öffnungszeiten sind die Zeiten, zu denen ein Park Gäste einlässt und schließt. Die Parks veröffentlichen sie in ihrem Kalender, meist Wochen oder Monate im Voraus, und ändern sie kurzfristig bei Veranstaltungen, Wetter oder technischen Problemen. Einzelne Attraktionen können später öffnen oder früher schließen als der Park, und Wasserbahnen bleiben an kalten Tagen oft zu.\n\npark.fan zeigt die veröffentlichten Zeiten jedes Parks und, wo der Park sie angibt, auch die einzelner Attraktionen. Veröffentlicht ein Park keine Öffnungszeiten, zeigt park.fan Zeiten, die aus der gemessenen Aktivität im Park abgeleitet sind, gekennzeichnet als „Rekonstruierte Zeiten“. In den meisten Parks schließen zur Schließzeit die Warteschlangen, die Attraktionen fahren weiter, bis alle, die schon anstehen, gefahren sind.\n\nWie sich die Wartezeiten in der ersten und der letzten Stunde verhalten, ist von Attraktion zu Attraktion verschieden, und die Seite jeder Attraktion zeigt ihren typischen Tagesverlauf Stunde für Stunde.',
    alternateNames: ['Betriebszeiten', 'Park-Öffnungszeiten'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Trend',
    shortDefinition:
      'Wohin sich eine Warteschlange bewegt, gemessen an den letzten vier Messungen: steigend, fallend oder stabil.',
    definition:
      'Der Trend zeigt, ob die Warteschlange einer Attraktion wächst, schrumpft oder gleich bleibt. park.fan vergleicht den Durchschnitt der letzten beiden Messungen mit dem der beiden davor und zeigt die Differenz, auf fünf Minuten gerundet, auf einem kleinen Badge neben der Wartezeit: Pfeil nach oben mit +10 min, Pfeil nach unten mit −5 min, oder „stabil“, wenn die Differenz auf null gerundet wird.\n\nEine Attraktion mit 45 Minuten und fallendem Trend kann kürzer sein als eine mit 40 Minuten und steigendem, bis man quer durch den Park dort angekommen ist. Der Trend reagiert schnell, eine einzelne ungewöhnliche Messung, etwa der Sprung, wenn eine Attraktion nach einer Störung wieder öffnet, bewegt den Pfeil für die nächsten Messungen.',
    alternateNames: ['Queue Trend', 'Wait Trend'],

    relatedTermIds: ['crowd-level', 'posted-wait-time', 'wait-time'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Eine Themenfahrt ohne feste Schiene. Die Fahrzeuge fahren frei durch den Raum und werden über Technik im Boden geführt.',
    definition:
      'Ein Trackless Ride ist ein Dark Ride, dessen Fahrzeuge an keine feste Schiene gebunden sind und ihren Weg durch die Halle selbst finden, geführt über Induktionsschleifen im Boden, WLAN-Ortung oder optische Systeme. Ohne Schiene lassen sich Szenen dichter anordnen, ein Fahrzeug kann sich in jede Richtung drehen, die eine Szene verlangt, und mehrere Fahrzeuge können sich denselben Raum teilen. Star Wars: Rise of the Resistance in Disneyland und den Disney’s Hollywood Studios schickt schienenlose Fahrzeuge durch eine Folge mehrerer Räume. Ratatouille: L’Aventure Totalement Toquée de Rémy im Disneyland Paris war 2014 der frühe europäische Vertreter, und Symbolica ist seit 2017 die Hauptattraktion des Efteling. Bei großen neuen Dark Rides ist schienenlos inzwischen der Normalfall.',
    aliases: ['Trackless'],
    alternateNames: ['Trackless Dark Ride', 'Gleislose Attraktion'],

    relatedTermIds: ['animatronics', 'dark-ride', 'themed-land'],
  },
  {
    id: 'g-force',
    name: 'G-Force',
    shortDefinition:
      'Die Beschleunigung, die auf Fahrgäste wirkt, gemessen in Vielfachen der Erdbeschleunigung (9,81 m/s²).',
    definition:
      'Die G-Kraft (in Vielfachen der Erdbeschleunigung) gibt an, wie stark die Beschleunigung auf einen Fahrgast im Vergleich zur Schwerkraft der Erde ist. Positive G-Kräfte (über 1G) drücken Fahrgäste in den Sitz, wenn der Zug durch ein Tal oder eine enge Kurve fährt. Negative G-Kräfte (unter 0G) heben sie aus dem Sitz, das ist Airtime. Seitliche G-Kräfte (Laterals) wirken quer zur Fahrtrichtung und schieben Fahrgäste in Kurven und Übergängen zur Seite.\n\nBeim Entwurf einer Achterbahn wird festgelegt, in welcher Reihenfolge diese Kräfte auftreten. Im Tal nach einem kräftigen First Drop sind 4–5G typisch. Auf einem Airtime-Hügel wirken kurz −0,5G bis −1G, und die Fahrgäste schweben. Die meisten Bahnen bleiben bei anhaltenden Kräften zwischen 0 und 5G, mit kurzen Spitzen. Hohe G-Kräfte über mehrere Sekunden können Unwohlsein oder einen Greyout auslösen, deshalb folgen auf starke Belastungen meist ruhigere Abschnitte.',
    relatedTermIds: ['airtime', 'greyout', 'hangtime', 'inversion', 'lateral-gs', 'smoothness'],
    aliases: ['G-Kräfte', 'G-Kraft'],
  },
  {
    id: 'greyout',
    name: 'Greyout',
    shortDefinition:
      'Vorübergehende Verdunkelung des Sichtfelds durch positive G-Kräfte, die Blut aus dem Gehirn nach unten drücken.',
    definition:
      'Beim Greyout (auch Grey-out) sieht ein Fahrgast unter starken positiven G-Kräften vorübergehend wie durch einen grauen Schleier. Die G-Kräfte drücken Blut aus dem Kopf nach unten in Arme und Beine, Augen und Gehirn werden schlechter durchblutet. Das Sichtfeld wird von den Rändern her enger und grau. Der Fahrgast bleibt dabei bei Bewusstsein und kann sich bewegen.\n\nBei noch höheren oder länger anhaltenden G-Kräften kann aus einem Greyout ein Blackout werden (das Sichtfeld wird ganz schwarz), in extremen Fällen auch ein G-LOC (G-Force Induced Loss of Consciousness), eine Bewusstlosigkeit. Achterbahnen halten G-Spitzen deshalb kurz und wechseln zwischen belastenden und entlastenden Abschnitten, damit kein anhaltender Greyout entsteht.',
    aliases: ['Greyouts', 'Grey-out'],
    alternateNames: ['Grauschleier', 'positives G-Phänomen'],
    relatedTermIds: ['airtime', 'g-force', 'hangtime', 'lateral-gs'],
  },
  {
    id: 'grey-zone',
    name: 'Grauzone',
    shortDefinition:
      'Ein Achterbahn-Element an der Grenze zur Inversion, das je nach Zählweise als Inversion gewertet wird oder nicht.',
    definition:
      'Grauzone nennen Coaster-Fans Elemente, die an der Grenze zwischen Inversion und Nicht-Inversion liegen. Bei klassischen Inversionen wie Looping oder Korkenzieher ist die Sache klar, der Fahrgast ist vollständig kopfüber. Grauzone-Elemente erreichen die 180 Grad knapp oder gar nicht, bringen die Fahrgäste aber fast in Überkopflage.\n\nTypische Grauzone-Elemente sind stark übergeneigte Kurven (Overbanks über 90 Grad) und bestimmte Varianten des Wave Turn. Ein Stall gehört nicht dazu, er dreht den Zug ganz auf den Kopf und zählt als Inversion. RMC und Intamin setzen sie gezielt anstelle klassischer Inversionen ein. Je nachdem, ob man streng (nur vollständige Drehungen) oder weit (alle Überkopflagen) zählt, kommt eine Bahn auf eine andere offizielle Inversionszahl.',
    aliases: ['Grauzonen', 'Grauzone-Element', 'Grauzone-Elemente'],
    alternateNames: ['Inversions-Grauzone', 'Borderline-Inversion'],
    relatedTermIds: ['inversion', 'overbank', 'roller-coaster-element', 'stall'],
  },
  {
    id: 'lateral-gs',
    name: 'Lateral Gs',
    shortDefinition:
      'Seitwärtskräfte, die Fahrgäste auf Kurven, Übergängen und Helix-Abschnitten seitlich in den Sitz drücken.',
    definition:
      'Seitliche G-Kräfte (Laterals) entstehen, wenn eine Achterbahn schneller die Richtung wechselt, als ihre Neigung auffangen kann. In einer gut geneigten Kurve ist die Schiene so gekippt, dass die Kraft nach unten in den Sitz zeigt. Ist die Neigung geringer, als das Tempo verlangt, drückt der Rest den Fahrgast zur Außenseite des Wagens.\n\nKonstrukteure setzen sie gezielt ein: Die flachen, schnellen Kurven einer klassischen Holzachterbahn und die schnellen Richtungswechsel einer GCI-Strecke fährt man wegen ihrer Laterals. Ungewollte Laterals kommen von abgenutzter Strecke oder von einem Layout, das die Neigung zu abrupt wechselt, und werfen die Fahrgäste gegen die Wagenwand oder den Bügel. Holzachterbahnen sind am anfälligsten, weil Holzschienen sich mit Wetter und Betrieb verziehen und ihre Kurven oft flacher geneigt sind als bei Stahlbahnen.\n\nBalder in Liseberg (Intamin, 2003) ist eine Holzachterbahn mit gleichmäßigen Laterals in ihren Kurven.',
    relatedTermIds: ['airtime', 'g-force', 'helix', 'wooden-coaster'],
    alternateNames: ['Lateral G', 'Lateral-G-Kräfte', 'Laterale G-Kräfte'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Starke negative G-Kräfte, die Fahrgäste schlagartig aus dem Sitz heben. Nur der Schoßbügel hält sie.',
    definition:
      'Ejector Airtime ist die starke Form negativer G-Kräfte. Über einem Hügel, dessen Kuppe spitzer ist als die Bahn, die der Zug im freien Fall nehmen würde, fällt die Strecke schneller weg als der Fahrgast, und er wird für Sekundenbruchteile aus dem Sitz gegen den Bügel gezogen. Der Name kommt vom englischen „eject“, auswerfen.\n\nFloater Airtime ist das sanfte Gegenstück, ein langsames Abheben über einer runden Kuppe. Ejector braucht Tempo und einen kurzen, steilen Hügel, und RMC-Hybride, viele Intamin-Bahnen und moderne Holzachterbahnen sind darauf gebaut. Untamed in Walibi Holland, Wildfire in Kolmården und Steel Vengeance in Cedar Point haben lange Ejector-Passagen. Am stärksten trifft es die letzte Reihe, und ein fest gedrückter Schoßbügel nimmt das meiste davon weg.',
    relatedTermIds: ['airtime', 'airtime-hill', 'floater-airtime', 'g-force', 'rmc'],
    alternateNames: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      'Schwache, länger anhaltende negative G-Kräfte, bei denen die Fahrgäste über einer Kuppe schweben.',
    definition:
      'Floater Airtime ist die sanfte Form negativer G-Kräfte. Über einer breiten, runden Kuppe folgt der Zug fast genau der Bahn eines geworfenen Gegenstands, und die Fahrgäste heben leicht aus dem Sitz ab und schweben ein, zwei Sekunden lang, nahezu schwerelos.\n\nEs ist die Airtime der B&M-Hyper- und Gigacoaster, deren große, parabelförmige Hügel dafür gezeichnet sind. Shambhala in PortAventura und Silver Star im Europa-Park haben lange Floater-Abschnitte. Weil das Abheben sanft ist, lässt sich Floater Runde um Runde fahren, und wem Ejector zu heftig ist, kommt damit meist gut zurecht. Derselbe Hügel kann vorn im Zug Floater geben und hinten Ejector, weil das Ende die Kuppe schneller überquert.',
    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'ejector-airtime', 'g-force'],
    alternateNames: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      'Das Hängen im Rückhaltesystem, wenn ein Zug kopfüber langsam wird und negative G-Kräfte wirken.',
    definition:
      'Hangtime entsteht, wenn ein Zug am höchsten Punkt einer Inversion so lange bleibt, dass negative G-Kräfte wirken. Die Fahrgäste hängen dann kopfüber im Rückhaltesystem. In einem schnellen Looping ist man nur kurz kopfüber, bei Hangtime wird der Zug nahe dem Scheitelpunkt langsamer, und das Hängen dauert deutlich länger. Das ganze Körpergewicht liegt dann im Schulter- oder Schoßbügel.\n\nAm stärksten ist Hangtime bei Elementen, in denen der Zug kopfüber stark abbremst. Das kann etwa der Heartline Roll mancher moderner Bahnen sein.',
    relatedTermIds: ['airtime', 'g-force', 'heartline-roll', 'inversion'],
    alternateNames: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Achterbahn-Element',
    shortDefinition:
      'Ein benannter Streckenabschnitt einer Achterbahn, z. B. Looping, Airtime-Hügel oder Inversion.',
    definition:
      'Ein Achterbahn-Element ist ein Abschnitt der Strecke mit eigenem Namen. Manche sind Inversionen wie Looping, Korkenzieher oder Zero-G Roll, andere lassen die Fahrgäste aufrecht, wie Airtime-Hügel, Helix und Overbank. Jedes ist auf eine bestimmte Kraft ausgelegt: negative G-Kräfte über einer Kuppe, seitliche in einer Kurve, positive am Tiefpunkt eines Loopings oder die Drehung über Kopf.\n\nMit den Namen lassen sich Strecken vergleichen. Eine Bahn, die sich als Lifthill, First Drop, Dive Loop, Camelback und Helix beschreiben lässt, ist zur Hälfte erklärt, bevor jemand sie gefahren ist. Manche Elemente gehören zu einem Hersteller, etwa der Stall und der Wave Turn zu Rocky Mountain Construction, und es kommen immer neue hinzu. Der Celestial Spin von Mack Rides auf Stardust Racers (2025) gehört zu den jüngsten.',
    relatedTermIds: ['airtime', 'first-drop', 'helix', 'inversion', 'vertical-loop'],
    aliases: ['Achterbahn-Elemente'],
    alternateNames: ['Achterbahn-Figur', 'Coaster-Element'],
  },
  // ── Ride Experience ────────────────────────────────────────────────────────
  {
    id: 'front-row',
    name: 'Erste Reihe',
    shortDefinition: 'Die erste Reihe eines Fahrgeschäfts, mit freiem Blick nach vorn.',
    definition:
      'Die erste Reihe ist die vorderste Sitzreihe eines Achterbahnzugs, vor ihr sitzt niemand, und der Blick auf die Strecke ist frei. Wer dort sitzt, sieht jede Abfahrt und jede Kurve kommen und bekommt beim Launch den Fahrtwind voll ins Gesicht.\n\nOben an einer Abfahrt wird der vordere Wagen noch vom Rest des Zuges gebremst, der hinter ihm klettert, und überquert die Kuppe langsamer als jede andere Reihe. Die starke Airtime auf dem Scheitel bekommt das Ende des Zuges. Die erste Reihe bekommt dafür den Blick in die Tiefe, bevor es hinuntergeht.\n\nViele Parks lassen an einem eigenen Gatter am Bahnsteig auf die erste Reihe warten, das kostet ein paar Zugumläufe zusätzlich.',
    relatedTermIds: ['airtime', 'back-row', 'first-drop', 'middle-row'],
  },
  {
    id: 'back-row',
    name: 'Letzte Reihe',
    shortDefinition:
      'Die letzte Reihe eines Fahrgeschäfts. Auf Bahnen mit vielen Airtime-Hügeln hat sie die stärkste Ejector Airtime.',
    definition:
      'Die letzte Reihe ist die hinterste Sitzreihe eines Achterbahnzugs. Fährt die Spitze des Zuges über eine Kuppe, klettert das Ende noch langsam hinterher. Erreicht der letzte Wagen den Scheitel, ist der Rest des Zuges schon auf dem Weg nach unten und zieht ihn mit vollem Tempo darüber. Die letzte Reihe überquert deshalb jede Kuppe am schnellsten und bekommt die stärkste Ejector Airtime, und am ersten Drop wird sie über die Kante gerissen, während die erste Reihe noch gemächlich darüberrollt.\n\nAuf Airtime-Bahnen wie Goliath in Walibi Holland oder Shambhala in PortAventura ist die letzte Reihe der stärkste Platz. Auf älteren Achterbahnen fährt der letzte Wagen dafür oft am rauesten, und der Blick nach vorn fällt auf die Sitzlehnen davor.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'front-row', 'middle-row'],
  },
  {
    id: 'middle-row',
    name: 'Mittlere Reihe',
    shortDefinition:
      'Die Reihen zwischen der ersten und der letzten, mit mäßiger Airtime und noch freiem Blick nach vorn.',
    definition:
      'In den mittleren Reihen ist die Airtime schwächer als hinten, und der Blick nach vorn weniger frei als ganz vorn. Die kommenden Elemente sieht man noch, die Airtime ist mäßig. Für Familien oder beim ersten Mal sind die mittleren Reihen deshalb die sanftere Wahl.\n\nAuf Achterbahnen mit starken Seitenkräften sind die G-Kräfte aber auch in der Mitte deutlich. Wer nicht auf die erste oder letzte Reihe warten will, nimmt eine aus der Mitte.',
    relatedTermIds: ['airtime', 'back-row', 'front-row', 'ride-cart'],
  },
  {
    id: 'ride-cart',
    name: 'Fahrwagen',
    shortDefinition: 'Ein einzelner Wagen eines Achterbahnzugs mit einer oder mehreren Sitzreihen.',
    definition:
      'Ein Fahrwagen ist ein Fahrzeug eines Achterbahnzugs: ein Fahrgestell mit Rädern unten, eine oder mehrere Sitzreihen oben und die Bügel. Mehrere gekoppelte Wagen bilden einen Zug, eine kleine Familienbahn fährt manchmal mit einem einzigen Wagen. Jeder Wagen läuft auf drei Sätzen Rädern je Seite, auf der Schiene, darunter und seitlich daran, die ihn bei negativen und seitlichen G-Kräften auf der Strecke halten.\n\nDie Form des Wagens folgt der Strecke. Beim Inverted Coaster hängen die Wagen unter der Schiene, beim Wing Coaster sitzen die Fahrgäste links und rechts neben ihr mit nichts unter sich, beim Flying Coaster liegen sie bäuchlings, und beim Spinning Coaster stehen die Sitze auf einer Drehscheibe. Die Hersteller bauen ihre Wagen selbst, deshalb erkennt man Sitze und Bügel von B&M, Intamin oder Mack von Park zu Park wieder.',
    relatedTermIds: ['back-row', 'front-row', 'lap-bar', 'shoulder-harness'],
  },
  {
    id: 'lap-bar',
    name: 'Schoßbügel',
    shortDefinition:
      'Ein waagerechter Sicherheitsbügel über dem Schoß, mit dem man sich freier bewegen kann als mit einem Schulterbügel.',
    definition:
      'Ein Schoßbügel ist ein Rückhaltesystem, das sich über die Oberschenkel legt und dort einrastet, der Oberkörper bleibt frei. Auf den meisten modernen Achterbahnen ist er ein Einzelbügel oder ein T-Bügel mit Ratsche oder hydraulischer Verriegelung, oft ergänzt um einen Gurt als zweite, unabhängige Sicherung.\n\nEr ist der übliche Bügel auf Hyper- und Gigacoastern, auf den meisten Holzachterbahnen und vielen Familienbahnen, weil er die Fahrgäste über einer Kuppe aus dem Sitz steigen lässt, bis der Bügel sie stoppt. In diesem Moment spürt man Airtime, und wie weit man abhebt, hängt davon ab, wie tief der Bügel in der Station gedrückt wurde. Drückt das Personal ihn zu weit hinunter, ist die Airtime weg. Fans nennen das Stapling.\n\nWie ein Schoßbügel sitzt, hängt vom Körperbau ab. Ein Bügel, der beim einen auf den Oberschenkeln liegt, drückt beim anderen auf den Bauch, und viele Parks stellen am Eingang von Bahnen mit engen Bügeln einen Testsitz auf.',
    relatedTermIds: ['airtime', 'restraint-freedom', 'ride-cart', 'shoulder-harness'],
  },
  {
    id: 'shoulder-harness',
    name: 'Schulterbügel',
    shortDefinition:
      'Ein Sicherheitsbügel über beiden Schultern, der den Oberkörper umschließt und die Bewegung einschränkt.',
    definition:
      'Ein Schulterbügel kommt über beide Schultern herunter und rastet über dem Schoß ein, sodass der Oberkörper in einem gepolsterten Rahmen sitzt. In den 1980er- und 1990er-Jahren wurde er der übliche Bügel auf Stahlachterbahnen mit Loopings, und auf den meisten Inverted Coastern und vielen hängenden Familienachterbahnen ist er bis heute Standard.\n\nDer Bügel hält Schultern und Hüfte, und das zählt, wenn ein Zug langsam kopfüber hängt oder hart die Richtung wechselt. Der Preis ist am Kopf zu spüren: Auf rauer Strecke schlagen die Polster an die Ohren, und über Airtime-Hügeln können die Fahrgäste nicht weit abheben, weil der Bügel sie früher stoppt als ein Schoßbügel. Neuere Bauarten ersetzen die harten Schulterbügel durch weichere Westen, und Rocky Mountain Construction schickt Fahrgäste nur mit Schoßbügel über Kopf.',
    relatedTermIds: ['airtime', 'lap-bar', 'restraint-freedom', 'ride-cart'],
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    id: 'souvenir',
    name: 'Andenken',
    shortDefinition:
      'Ein Erinnerungsstück, das man im Freizeitpark kauft, um sich an den Besuch zu erinnern.',
    definition:
      'Ein Andenken ist etwas, das man im Park kauft, um sich an den Besuch zu erinnern: ein T-Shirt oder eine Kappe mit Park-Logo, ein Pin, eine Postkarte, das Maskottchen als Plüschtier, ein Modell einer Attraktion. Verkauft werden die meisten in den Läden am Parkausgang und an den Ausgängen der großen Attraktionen.\n\nDie Preise liegen deutlich über denen vergleichbarer Ware in einem gewöhnlichen Geschäft, und was zu einem Park oder einer Attraktion gehört, gibt es nur dort. Das On-Ride-Foto ist ein Andenken für sich: Eine Kamera an der Abfahrt nimmt es auf, verkauft wird es am Ausgang, gedruckt oder als Download. Auch Sammler gibt es, am bekanntesten ist das Pin Trading in den Disney-Parks.',
    relatedTermIds: ['gift-shop', 'merchandise', 'park-exclusive'],
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    shortDefinition:
      'Offizielle Produkte und Waren eines Freizeitparks, einschließlich Kleidung, Sammelobjekte und thematische Artikel.',
    definition:
      'Merchandise ist alles, was ein Park verkauft, außer Essen, Getränken und Eintritt: Kleidung mit dem Logo des Parks oder einer Attraktion, Plüschtiere, Pins, Tassen, Spielzeug zu einem Film oder einem Maskottchen und Themenartikel zu einem Bereich oder einer Attraktion. Große Parks verkaufen es an Dutzenden Stellen, vom Wagen am Wegrand bis zu großen Läden am Haupteingang, die nach Betriebsschluss der Attraktionen noch offen haben.\n\nIn den Disney- und Universal-Parks liefern lizenzierte Filme einen großen Teil des Sortiments, und ein Bereich, der um einen Film gebaut ist, verkauft dessen Requisiten: Zauberstäbe bei Ollivanders in The Wizarding World of Harry Potter, Lichtschwerter, die man in Savi’s Workshop in Galaxy’s Edge selbst zusammenbaut. Parks mit eigenen Figuren verkaufen stattdessen diese, etwa der Europa-Park mit Ed Euromaus oder der Efteling mit seinen Märchenfiguren. Neue Attraktionen eröffnen meist mit einem eigenen Sortiment.',
    relatedTermIds: ['gift-shop', 'park-exclusive', 'souvenir'],
    alternateNames: ['Merch'],
  },
  {
    id: 'gift-shop',
    name: 'Geschenkeladen',
    shortDefinition:
      'Ein Einzelhandelsladen in einem Freizeitpark, der Andenken und Merchandise verkauft.',
    definition:
      'Ein Geschenkeladen ist ein Laden im Park, im Resorthotel oder am Ausgang einer Attraktion, der Andenken und Merchandise verkauft. Große Parks haben Dutzende, vom kleinen Kiosk bis zum kaufhausgroßen Gebäude am Haupteingang, das Besucher als Letztes passieren und das nach Betriebsschluss der Attraktionen noch offen hat.\n\nViele Attraktionen enden in einem eigenen Laden, und der Ausgang führt mitten hindurch: Wer aussteigt, geht an Regalen mit T-Shirts, Plüschtieren und Fotos genau dieser Attraktion vorbei, bevor er wieder im Freien steht. Diese Läden sind passend zur Attraktion gestaltet und haben ein kleineres Sortiment als die großen Geschäfte.',
    relatedTermIds: ['merchandise', 'park-exclusive', 'souvenir'],
  },
  {
    id: 'park-exclusive',
    name: 'Parkexklusiv',
    shortDefinition: 'Ein Produkt, das es nur in einem bestimmten Freizeitpark zu kaufen gibt.',
    definition:
      'Parkexklusive Ware gibt es nur in einem Park oder nur bei einer Gruppe von Parks zu kaufen, nicht in den gewöhnlichen Läden der Marke. Typisch sind T-Shirts und Pins mit dem Logo einer Attraktion, das Park-Maskottchen als Plüschtier, Artikel zu einem Jubiläum oder einer neuen Attraktion und Saisonware zu Halloween oder Weihnachten.\n\nAuf dem Etikett steht meist ausdrücklich, dass es den Artikel nur im Park gibt. Limitierte Auflagen sind schnell ausverkauft, und die selteneren Stücke tauchen auf Wiederverkaufsplattformen über dem Ladenpreis auf. Die Disney-Parks geben Pins in nummerierten Auflagen heraus, für die Sammler am Erscheinungstag anstehen.\n\nMehrere Parks verkaufen einen Teil ihres Sortiments inzwischen im eigenen Onlineshop, und damit verschwimmt der Begriff: Ein Artikel kann exklusiv sein, weil kein anderer Händler ihn führt, und sich trotzdem von zu Hause bestellen lassen.',
    relatedTermIds: ['gift-shop', 'merchandise', 'souvenir'],
  },
  {
    id: 'flying-coaster',
    name: 'Flying Coaster',
    shortDefinition: 'Achterbahn, bei der die Fahrgäste liegend transportiert werden.',
    definition:
      'Auf einem Flying Coaster liegen die Fahrgäste waagerecht unter der Schiene, mit dem Gesicht nach unten, wie beim Fliegen. Eingestiegen wird aufrecht, in Sitze, die unter der Schiene hängen. Sind die Bügel zu, klappen die Sitze nach hinten, bis die Fahrgäste auf dem Rücken liegen und in den Himmel schauen, und so geht es den Lifthill hinauf. Oben dreht eine Schraube in der Strecke den Zug um, der Rest der Fahrt geht bäuchlings.\n\nAm bekanntesten ist der Flyer von B&M. Galactica in Alton Towers eröffnete 2002 als Air und war der erste B&M-Flyer, Tatsu in Six Flags Magic Mountain (2006) und Manta in SeaWorld Orlando (2009) folgten. Das Element, das zum B&M-Flyer gehört, ist der Pretzel Loop. Der Zug taucht von oben in einen Looping ab, durch dessen Tiefpunkt die Fahrgäste auf dem Rücken liegend fahren, kräftig in den Sitz gedrückt.\n\nDas Einsteigen dauert länger als bei einer Sitzachterbahn, weil die Sitze vor jeder Abfahrt und nach jeder Ankunft geschwenkt werden.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster'],
    alternateNames: ['Flying Coaster', 'Flyer', 'Superman-Ride', 'prone coaster'],
  },
  {
    id: 'mine-train',
    name: 'Mine Train',
    shortDefinition: 'Familien-Stahlachterbahn im Thema eines Minenzuges.',
    definition:
      'Ein Mine Train ist eine Familienachterbahn aus Stahl, gestaltet als durchgegangener Erzzug in einer Bergbaustadt oder einem Wüstencanyon. Vorn fährt eine Lok, die Strecke bleibt niedrig und führt durch Felsen, Tunnel und verfallene Gebäude. Ihren Reiz machen enge Kurven und kurze Abfahrten dicht an der Kulisse aus, die Höhe spielt kaum eine Rolle. Oft teilen mehrere Lifthills die Fahrt in Abschnitte mit eigener Szene.\n\nDie ersten baute Arrow Development in den 1960er-Jahren. Run-A-Way Mine Train in Six Flags Over Texas (1966) gehörte zu den frühesten, bis 1997 baute Arrow sechzehn davon. Big Thunder Mountain eröffnete 1979 in Disneyland. Die Version im Disneyland Paris (1992) steht auf einer Insel im Rivers of the Far West, der Zug erreicht sie durch einen Tunnel unter dem Wasser, Mindestgröße 102 cm. Colorado Adventure im Phantasialand (Vekoma, 1996) bringt eine lange Strecke auf kleiner Fläche unter.',
    relatedTermIds: ['powered-coaster', 'steel-coaster', 'themed-land'],
    alternateNames: ['Mine Train', 'Minenzug', 'Mine Coaster', 'Familienachterbahn'],
  },
  {
    id: 'terrain-coaster',
    name: 'Terrain Coaster',
    shortDefinition: 'Achterbahn, deren Strecke dem natürlichen Gelände folgt.',
    definition:
      'Ein Terrain Coaster folgt dem Gelände, auf dem er steht. Statt die ganze Strecke auf ein Stahl- oder Holzgerüst zu setzen, führt der Konstrukteur sie einen Hang hinunter, in Schluchten und durch Wald. Einen Teil der Höhe liefert die Landschaft, das Gerüst bleibt niedrig. Weil Bäume und Felsen nur wenige Meter neben der Schiene stehen, wirkt die Fahrt schneller, als sie ist.\n\nThe Beast in Kings Island (1979) ist das klassische Beispiel aus Holz, eine lange Fahrt durch ein Waldstück, das man vom Park aus kaum sieht. Ravine Flyer II in Waldameer (2008) überquert eine Straße auf einer Brücke und taucht in eine Schlucht ab. In Europa folgt Lisebergbanan in Göteborg (1987) dem steilen Berg, auf dem der Park liegt. Entworfen haben sie Anton Schwarzkopf und Werner Stengel. Ihr Plan legte die Strecke dichter an den Boden als ein konkurrierender Entwurf von Vekoma, und es mussten weniger Bäume fallen.',
    relatedTermIds: ['airtime', 'alpine-coaster', 'steel-coaster', 'wooden-coaster'],
    alternateNames: ['Terrain Coaster', 'Landschaftsachterbahn'],
  },
  {
    id: 'floorless-coaster',
    name: 'Floorless Coaster',
    shortDefinition: 'Stahlachterbahn ohne Boden, bei der die Beine frei hängen.',
    definition:
      'Ein Floorless Coaster ist eine Stahlachterbahn mit Sitzwagen ohne Boden. Die Sitze stehen auf einem Rahmen über der Schiene, und die Station hat einen eigenen Boden, auf dem die Fahrgäste beim Einsteigen stehen. Sind alle Bügel geschlossen, klappt dieser Stationsboden weg oder senkt sich ab, und der Zug fährt los, die Beine baumeln ein Stück über den Schienen. Die Schiene liegt wie bei jeder Sitzachterbahn unter dem Zug, Aussicht und Inversionen sind die einer Looping-Achterbahn, nur ist unter den Füßen nichts.\n\nDie erste Bahn baute B&M: Medusa in Six Flags Great Adventure, eröffnet im April 1999. Im Jahr darauf folgten vier weitere, darunter Kraken in SeaWorld Orlando. In Europa fährt Superman la Atracción de Acero im Parque Warner Madrid (2002). Cedar Point hat seinen Stand-up Coaster Mantis von 1996 im Jahr 2015 zum Floorless Coaster Rougarou umgebaut, auf derselben Strecke mit neuen Zügen.',
    relatedTermIds: [
      'b-and-m',
      'dive-coaster',
      'inverted-coaster',
      'stand-up-coaster',
      'steel-coaster',
    ],
    alternateNames: ['Floorless', 'Floorless Coaster', 'open floor coaster'],
  },
  {
    id: 'arrow-dynamics',
    name: 'Arrow Dynamics',
    shortDefinition:
      'Amerikanischer Achterbahnhersteller, der mit einem Korkenzieher die erste moderne Inversion baute.',
    definition:
      'Arrow Dynamics (1946 als Arrow Development gegründet, 1986 umbenannt) baute als einer der ersten moderne Stahlachterbahnen und führte die gebogenen Stahlrohrschienen ein, dazu die erste moderne Inversion, den Korkenzieher von Corkscrew (Knott’s Berry Farm, 1975). Typisch für Arrow-Bahnen sind Korkenzieher und hängende Loopingbahnen. Das Unternehmen meldete 2001 Insolvenz an, S&S übernahm die Vermögenswerte.',
    relatedTermIds: ['corkscrew', 'rattle', 'steel-coaster', 'suspended-coaster', 'vertical-loop'],
    alternateNames: ['Arrow', 'Arrow Development', 'S&S Arrow'],
    aliases: ['Arrow Development', 'S&S Arrow'],
  },
  {
    id: 'gci',
    name: 'Great Coasters International (GCI)',
    shortDefinition:
      'Amerikanischer Hersteller von Holzachterbahnen mit schnellen, kurvenreichen Layouts.',
    definition:
      'Great Coasters International (GCI) ist ein Hersteller von Holzachterbahnen aus Sunbury, Pennsylvania, 1994 gegründet von Clair Hain Jr. und Mike Boodley, die zuvor bei Custom Coasters International zusammengearbeitet hatten. GCI-Strecken winden sich auf kleiner Fläche viele Male über und unter sich selbst hindurch, mit schnellen Richtungswechseln und Airtime auf den Kuppen.\n\nDie Züge baut GCI selbst. Der Millennium Flyer besteht aus kurzen, gelenkig gekoppelten Wagen und nimmt enge Kurven ruhiger als die langen, starren Züge älterer Holzachterbahnen. In den USA stammen Thunderhead in Dollywood (2004) und Mystic Timbers in Kings Island (2017) von GCI. Troy im Toverland (2007) war nach Thunderbird in Finnland die zweite GCI-Bahn in Europa. Joris en de Draak im Efteling (2010) ist ein Racing Coaster mit zwei Strecken, Wodan Timburcoaster im Europa-Park eröffnete 2012.',
    aliases: ['Great Coasters International', 'GCI coaster'],
    relatedTermIds: ['airtime', 'cci', 'rmc', 'terrain-coaster', 'wooden-coaster'],
    alternateNames: ['Great Coasters International', 'GCI Coaster', 'Millennium Flyer'],
  },
  {
    id: 'premier-rides',
    name: 'Premier Rides',
    shortDefinition:
      'Amerikanischer Hersteller von Katapultachterbahnen mit LSM- oder LIM-Antrieb. In Europa steht etwa Sky Scream im Holiday Park.',
    definition:
      'Premier Rides (gegründet 1995, Baltimore, Maryland) ist ein amerikanischer Achterbahnhersteller, der sich auf Launches mit Linearsynchronmotor (LSM) und Linearinduktionsmotor (LIM) spezialisiert hat. Das Modell Sky Rocket II, ein kompakter Katapultcoaster mit einer einzigen Inversion, einer Heartline Roll, steht in vielen mittelgroßen Parks weltweit.\n\nIn Europa kennt man Premier Rides vor allem durch Sky Scream im Holiday Park (Haßloch, Deutschland), einen solchen Sky Rocket II.',
    alternateNames: ['Premier'],
    relatedTermIds: ['gerstlauer', 'intamin', 'launch-coaster'],
  },
  {
    id: 'maurer-rides',
    name: 'Maurer Rides',
    shortDefinition:
      'Münchner Hersteller von Spinning Coastern mit Trick Track, der X-Car-Plattform und dem Sky Loop mit senkrechtem Looping.',
    definition:
      'Maurer Rides (Maurer AG, Metallbau seit 1876, Fahrgeschäfte seit 1993) ist ein Münchner Hersteller. Maurer entwickelte die SC-Spinning-Coaster mit Trick Track, einem Abschnitt, auf dem sich der Wagen seitlich neigt, und die X-Car-Plattform für kompakte Einzellayouts mit Launches und Inversionen.\n\nDer Sky Loop ist ein eigenes Modell mit senkrechtem Looping, das wenig Platz braucht und in vielen europäischen Parks steht. In Europa stehen außerdem Winja’s Fear und Winja’s Force im Phantasialand (Deutschland), zwei Spinning Coaster mit Trick Track in einer Halle, dazu mehrere X-Car-Bahnen.',
    alternateNames: ['Maurer', 'Maurer Söhne', 'Maurer AG'],
    relatedTermIds: ['gerstlauer', 'launch-coaster', 'spinning-coaster', 'xtreme-spinning-coaster'],
    aliases: ['Maurer Söhne', 'Maurer AG'],
  },
  {
    id: 'zamperla',
    name: 'Zamperla',
    shortDefinition:
      'Italienischer Hersteller vor allem von Familienachterbahnen und Fahrgeschäften, mit über 350 gebauten Achterbahnen.',
    definition:
      'Zamperla (gegründet 1966, Altavilla Vicentina, Italien) gehört nach Stückzahl zu den größten Herstellern von Fahrgeschäften weltweit. Intamin, B&M und Mack bauen vor allem große Thrill-Bahnen, Zamperla baut viele kleine und mittlere: Family Coaster, Mini Coaster, Twister und Disk’O Coaster stehen in kleineren Parks und auf Resort-Midways in aller Welt.\n\nWeil sie wenig Platz brauchen und niedrige Mindestgrößen haben, sind Zamperla-Bahnen in europäischen Stadtparks, Ferienanlagen und Indoor-Parks verbreitet. Zamperla hat auch größere Bahnen gebaut, etwa Thunderbolt auf Coney Island (New York).',
    alternateNames: ['Zamperla rides', 'Antonio Zamperla'],
    relatedTermIds: ['credit', 'gerstlauer', 'mine-train'],
    aliases: ['Antonio Zamperla'],
  },
  {
    id: 'huss-rides',
    name: 'Huss Rides',
    shortDefinition:
      'Deutscher Flat-Ride-Hersteller aus Bremen, baut seit 1969 Fahrgeschäfte, bekannt für Top Spin, Break Dance, Enterprise, Ranger und Condor.',
    definition:
      'HUSS ist ein deutsches Unternehmen für Fahrgeschäfte, 1919 in Bremen gegründet, das seit 1969 Fahrgeschäfte baut. Nach der Insolvenz 2006 führte die HUSS Park Attractions GmbH das Geschäft weiter, gefertigt wird in Budapest. Von Huss stammen viele Flat-Ride-Modelle aus dem späten 20. Jahrhundert, die in Freizeitparks und auf Jahrmärkten weltweit stehen.\n\nWichtige Huss-Modelle sind der Top Spin, der Break Dance (drehende Wagen auf einer drehenden Scheibe), das Enterprise (ein Rad mit Gondeln, die die Fliehkraft nach außen drückt), der Ranger (schwingendes Pendelschiff), der Condor (rotierender Sitzturm) und die Troika. Viele dieser Modelle haben andere Hersteller nachgebaut. In europäischen Parks stehen viele Huss-Anlagen seit den 1980er und 1990er Jahren, als dort besonders viele Flat Rides gebaut wurden.',
    relatedTermIds: ['drop-tower', 'flat-ride', 'pendulum-ride', 'top-spin'],
    aliases: ['Huss', 'Huss Park Attractions'],
  },
  {
    id: 's-and-s-worldwide',
    name: 'S&S Worldwide',
    shortDefinition:
      'Amerikanischer Hersteller von pneumatischen Freifalltürmen, dem kompakten El Loco und dem 4D-Coaster Free Fly.',
    definition:
      'S&S Worldwide (gegründet 1994, Logan, Utah; 2012 von Sansei Technologies übernommen) baute zuerst pneumatische Freifalltürme (Space Shot und Turbo Drop) und später auch Achterbahnen. Der El Loco ist ein kompakter Coaster mit überhängender erster Abfahrt und einer Inversion auf sehr kleiner Grundfläche. Der Free Fly ist ein 4D-Coaster mit frei schwenkendem Sitz.\n\nNach der Insolvenz von Arrow Dynamics 2001 übernahm S&S dessen Vermögenswerte. In Europa gibt es weniger S&S-Anlagen als in Nordamerika.',
    alternateNames: ['S&S', 'S&S-Sansei', 'S&S Power', 'S&S Sansei'],
    relatedTermIds: ['arrow-dynamics', 'gerstlauer', 'launch-coaster'],
    aliases: ['S&S', 'S&S-Sansei', 'S&S Sansei', 'S&S – Sansei Technologies', 'S&S Power'],
  },
  {
    id: 'zierer',
    name: 'Zierer',
    shortDefinition:
      'Bayerischer Hersteller aus Deggendorf, spezialisiert auf Familienachterbahnen, mit über 190 gebauten Anlagen weltweit.',
    definition:
      'Zierer (gegründet 1930, Deggendorf, Bayern) ist ein bayerischer Hersteller von Familienachterbahnen und klassischen Parkattraktionen. Die Force-Coaster-Reihe reicht von kompakten Junior-Modellen bis zu schnelleren Einzelanfertigungen (Force Custom). Zierer-Bahnen fahren auf Stahlrohrschienen, laufen ruhig und haben niedrige Mindestgrößen, Kinder und Erwachsene können sie gemeinsam fahren.\n\nMit über 190 ausgelieferten Achterbahnen gehört Zierer nach Stückzahl zu den größten Achterbahnbauern Europas. Dazu gehören der Feuerdrache im Legoland Deutschland und Familienachterbahnen in deutschen, niederländischen und skandinavischen Parks.',
    alternateNames: ['Zierer GmbH', 'Zierer rides'],
    relatedTermIds: ['credit', 'gerstlauer', 'mack-rides'],
    aliases: ['Zierer GmbH'],
  },
  {
    id: 'stall',
    name: 'Stall',
    shortDefinition: 'Inversion, bei der der Zug kurzzeitig kopfüber fast zum Stehen kommt.',
    definition:
      'Beim Stall (auch Zero-G-Stall) fährt der Zug in eine Inversion und wird am höchsten Punkt so langsam, dass er fast steht. Die Fahrgäste hängen dabei kopfüber. Das Element stammt von Rocky Mountain Construction (RMC) und hat lange Hangtime. Beispiele sind Zadra (Energylandia) und Steel Vengeance (Cedar Point).',
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'zero-g-roll'],
    alternateNames: ['Stall', 'Zero-G-Stall', 'RMC Stall', 'Hangtime-Element'],
  },
  {
    id: 'wave-turn',
    name: 'Wave Turn',
    shortDefinition:
      'Eine schnelle Kurve, in der die Fahrgäste mitten im Richtungswechsel Airtime haben.',
    definition:
      'Ein Wave Turn ist ein Airtime-Hügel, der auf die Seite gelegt wurde. Die Strecke steigt und fällt wie bei einem Camelback und ist dabei um etwa 90 Grad geneigt, von oben gesehen ist das eine Kurve. Im Sitz kommt die Airtime nach oben und zur Seite zugleich: Die Fahrgäste werden zur Außenseite der Kurve und aus dem Sitz gehoben, und der Bügel hält sie in beide Richtungen.\n\nDen Namen hat Rocky Mountain Construction geprägt. Outlaw Run in Silver Dollar City (2013) und Lightning Rod in Dollywood (2016) haben Wave Turns, inzwischen haben auch andere Hersteller das Element übernommen: B&M bei Orion in Kings Island (2020), Intamin bei Toutatis im Parc Astérix (2023) und Mack Rides bei Voltron Nevera im Europa-Park (2024).\n\nEin Overbank kippt über 90 Grad hinaus und wird mit Druck in den Sitz gefahren. Der Wave Turn bleibt bei etwa 90 Grad und ist auf Airtime ausgelegt.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'lateral-gs', 'overbank', 'rmc', 's-hill'],
    alternateNames: ['Wave Turn', 'Airtime-Kurve', 'überneigte Kurve'],
  },
  {
    id: 'shoulder-season',
    name: 'Zwischensaison',
    shortDefinition: 'Zeitraum zwischen Hoch- und Nebensaison mit mäßigem Besucherandrang.',
    definition:
      'Die Zwischensaison ist die Übergangszeit zwischen der Hauptsaison und den ruhigsten Wochen eines Freizeitparks. In europäischen Parks sind das meist der Frühling (März–Mai) und der frühe Herbst (September–Oktober). Der Andrang ist mäßig, die Preise sind oft niedriger, und die meisten Attraktionen sind geöffnet.',
    relatedTermIds: ['crowd-forecast', 'crowd-level', 'peak-day', 'school-holiday'],
    alternateNames: ['Zwischensaison', 'shoulder season', 'ruhige Saison', 'Vor-/Nachsaison'],
  },
  {
    id: 'school-holiday',
    name: 'Schulferien',
    shortDefinition: 'Schulferienzeiten, die zu deutlich höherem Besucherandrang führen.',
    definition:
      'Schulferien sind die Wochen, in denen die Schulen geschlossen sind: Sommer, Weihnachten und Neujahr, Ostern und in vielen Ländern Herbst- und Fastnachts- oder Karnevalsferien. Familien mit Schulkindern können nur dann verreisen, und die Parks füllen sich entsprechend.\n\nWie stark, hängt davon ab, wessen Ferien es sind. Deutschland staffelt die Sommerferien nach Bundesländern, ein Park in Reichweite mehrerer Länder hat deshalb einen langen vollen Sommer statt einer einzelnen Spitze. Die Niederlande teilen ihre Sommerferien auf drei Regionen mit unterschiedlichen Terminen auf. Ein Park nahe der Grenze, etwa der Europa-Park nahe Frankreich und der Schweiz oder das Phantasialand in Reichweite der Niederlande und Belgiens, zieht Gäste aus mehreren Ferienkalendern, und eine Woche, die in einem Land ruhig ist, kann im Nachbarland voll sein.\n\nDie Prognose von park.fan berücksichtigt die Schulferien, und die Seite Beste Reisezeit jedes Parks zeigt Monat für Monat, wie viel voller die Ferien ihn machen.',
    relatedTermIds: ['crowd-forecast', 'crowd-level', 'peak-day', 'shoulder-season'],
    aliases: ['Ferien', 'Schulferien'],
    alternateNames: [
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
    shortDefinition: 'Ein Paket mit unbegrenzt vielen digitalen Park- und Fahrfotos.',
    definition:
      'Mit einem Fotopass (oder Memory Maker) bekommt man alle professionell aufgenommenen Fotos und Videos eines Parkbesuchs digital, also Fahrfotos, Bilder von Charaktertreffen und von Fotografen, die im Park unterwegs sind. Er wird als Paket zum Festpreis verkauft und lohnt sich für Familien, die sonst viele Einzelfotos kaufen würden. Beispiele sind Disneys Memory Maker und Universals Photo Pass.',
    relatedTermIds: ['character-meet-and-greet', 'ride-photo', 'season-pass'],
    alternateNames: ['Fotopass', 'Memory Maker', 'Fotopaket', 'Parkfotos', 'photo pass'],
  },
  {
    id: 'accessibility-pass',
    name: 'Barrierefreiheits-Pass',
    shortDefinition:
      'Ein Pass für Gäste mit Behinderung, mit dem sie Attraktionen ohne langes Anstehen nutzen können.',
    definition:
      'Ein Barrierefreiheits-Pass (je nach Park auch DAS für Disability Access Service, Zugänglichkeitskarte oder Attraktionszugangspass) bekommen Gäste, die wegen einer Behinderung nicht in der regulären Warteschlange anstehen können. Der Gast und seine Begleitung erhalten eine Rückkehrzeit und können sich bis dahin woanders aufhalten. Wer berechtigt ist und wie man den Pass bekommt, ist von Park zu Park und von Land zu Land verschieden.',
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Behindertenpass'],
    alternateNames: [
      'DAS',
      'Disability Access Service',
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
      'Bei einer Simulator-Attraktion sitzen die Fahrgäste in einer Kabine oder auf einer Plattform, die sich passend zu einem Film bewegt. Die Plattform steht auf hydraulischen oder elektrischen Zylindern, meist sechs, die sie in einem kleinen Bereich kippen, neigen, heben und drehen, während auf der Leinwand eine viel größere Bewegung läuft. Das Kippen hält der Körper für Beschleunigung, den Rest liefern die Augen. Eine Schiene gibt es nicht, die Kabine fährt nirgendwohin.\n\nStar Tours eröffnete im Januar 1987 in Disneyland mit Kabinen von Rediffusion Simulation, einer britischen Firma, die Flugsimulatoren für die Pilotenausbildung baute. Die Version im Disneyland Paris folgte 1992. Seit 2011 setzt sich der Star-Tours-Film aus zufällig gewählten Abschnitten zusammen, zwei Fahrten hintereinander gleichen sich deshalb selten. Flying Theater wie das Voletarium im Europa-Park (2017) sind ein späterer Zweig derselben Idee, mit Sitzreihen, die vor eine Kuppelleinwand gehoben werden.\n\nSimulatoren befördern viele Fahrgäste auf wenig Fläche, und mit einem neuen Film lässt sich die Attraktion erneuern. Übelkeit entsteht auf ihnen aus dem Widerspruch zwischen dem, was die Augen sehen, und dem, was das Innenohr spürt.',
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'trackless-ride'],
    alternateNames: [
      'Simulator-Attraktion',
      'Simulatorfahrt',
      'Simulator',
      'Flugsimulator',
      'motion simulator',
    ],
  },
  {
    id: 'character-meet-and-greet',
    name: 'Character Meet & Greet',
    shortDefinition:
      'Ein fester Ort oder Termin, an dem Gäste einer kostümierten Figur des Parks begegnen.',
    definition:
      'Ein Meet & Greet ist ein fester Ort zu einer festen Zeit, an dem eine kostümierte Figur Gäste trifft, eine Familie nach der anderen, für ein Foto, ein paar Worte und ein Autogramm. Manche Figuren haben ein eigenes Gebäude mit Warteschlange und angezeigter Wartezeit, andere stehen nach einem Zeitplan in der Park-App oder im Programmheft an einer markierten Stelle. Meist ist ein Fotograf dabei, die Bilder werden danach verkauft oder sind in einem Fotopass enthalten.\n\nIn den Disney- und Universal-Parks kommen die Figuren aus den Filmen. Europäische Parks nehmen eigene oder lizenzierte: Der Europa-Park hat seine Maskottchen Ed Euromaus und Edda Euromausi, der Efteling seine Narren Pardoes und Pardijn, das Plopsaland De Panne die Studio-100-Figuren wie Biene Maja und Kabouter Plop. Familien mit kleinen Kindern planen ihren Tag um diese Zeiten.',
    relatedTermIds: ['character-dining', 'photo-pass', 'themed-land'],
    alternateNames: [
      'Meet & Greet',
      'Character Meet & Greet',
      'Charakterbegegnung',
      'Charakter-Auftritt',
    ],
  },
  {
    id: 'pre-show',
    name: 'Vorshow',
    shortDefinition:
      'Ein Raum vor dem Einsteigen, in dem Gäste auf eine Attraktion eingestimmt werden.',
    definition:
      'Eine Vorshow ist ein Raum bei thematisierten Attraktionen, in dem sich Gäste vor der Fahrt oder der Hauptshow sammeln. Dort hören sie die Vorgeschichte, bekommen Sicherheitshinweise oder sehen eine kurze Show. Die Vorshow gehört zur Handlung der Attraktion und zugleich zu ihrem Betriebsablauf. Beispiele sind der Dehnraum im Haunted Mansion und das Sicherheitsvideo bei Guardians of the Galaxy – Mission: BREAKOUT!.',
    relatedTermIds: ['animatronics', 'dark-ride', 'motion-simulator', 'themed-land'],
    alternateNames: ['Pre-Show', 'Vorshow', 'Warteschlangenunterhaltung', 'Staging-Bereich'],
  },
  {
    id: 'flat-ride',
    name: 'Flat Ride',
    shortDefinition: 'Ein Fahrgeschäft, das dreht, schwingt oder kreist, ohne Achterbahnstrecke.',
    definition:
      'Flat Rides sind Fahrgeschäfte, die auf einer weitgehend waagerechten Fläche stehen und keine erhöhte Fahrstrecke haben. Dazu gehören Drehattraktionen (Karussells, Teacups, Drehscheiben), Frisbees (Pendelfahrgeschäfte), Top Spins und Schwingattraktionen (Wellenflieger), Drop Towers und runde Drehplattformen.\n\nFlat Rides brauchen meist weniger Platz als Achterbahnen und passen auch in kleine Parkbereiche. Viele schaffen viele Fahrgäste pro Stunde, haben eine niedrige oder gar keine Mindestgröße und eignen sich für fast jedes Alter. In vielen Parks machen sie den größten Teil des Angebots für Familien und Kinder aus.',
    relatedTermIds: ['drop-tower', 'height-requirement', 'ride-capacity', 'swing-ride'],
    aliases: ['Flat Rides'],
  },
  {
    id: 'water-ride',
    name: 'Wasserfahrt',
    shortDefinition:
      'Attraktion, bei der Gäste in Booten oder Fahrzeugen durch Wasser fahren und dabei nass werden können.',
    definition:
      'Eine Wasserfahrt ist eine Attraktion, bei der die Fahrzeuge durch einen Wasserkanal fahren oder Wasser gezielt als Effekt eingesetzt wird. Die drei häufigsten Typen sind Wildwasserbahnen (Bootsfahrten durch Kanäle mit steiler Abfahrt), Wildwasser-Rafting-Bahnen (runde Boote durch künstliche Stromschnellen) und Spritz-Battles (Gäste beschießen sich gegenseitig mit Wasserkanonen). Wasserfahrten haben meist eine niedrige Mindestgröße, fahren können sie fast alle. An heißen Sommertagen werden die Wartezeiten dort sehr lang.',
    relatedTermIds: ['height-requirement', 'log-flume', 'ride-capacity', 'river-rapids'],
    alternateNames: ['Water Ride', 'Wasserattraktion', 'Nassattraktion'],
    aliases: ['Wasserfahrten', 'Wasserattraktionen', 'Wasserrutschen'],
  },
  {
    id: 'live-show',
    name: 'Live-Show',
    shortDefinition:
      'Geplante Aufführung mit lebenden Darstellern, Musik, Stunts oder Charakteren in einem Vorführungsbereich.',
    definition:
      'Eine Live-Show ist ein Programm zu festen Zeiten, bei dem Darsteller auftreten, anders als bei Fahrattraktionen oder Ausstellungen. Gespielt wird in offenen Arenen, in Theatern oder auf den Wegen des Parks. Es gibt Bühnenshows im Broadway-Stil, Stuntshows, Paraden mit Figuren, 4D-Shows mit Live-Elementen sowie Laser- und Feuerwerksshows. Anders als eine Attraktion hat eine Show nur begrenzt viele Plätze. Mittags, wenn die Wartezeiten an den Attraktionen am längsten sind, ist eine Show eine gute Pause.',
    relatedTermIds: ['pre-show', 'ride-capacity', 'themed-land'],
    alternateNames: ['Show', 'Live-Entertainment', 'Bühnenshow', 'Stuntshow', 'Vorstellung'],
  },
  {
    id: 'quick-service',
    name: 'Schnellrestaurant',
    shortDefinition: 'Selbstbedienungsrestaurant ohne Bedienung am Tisch.',
    definition:
      'Im Schnellrestaurant (englisch Quick Service, auch Counter Service) bestellen Gäste an einer Theke oder einem Kiosk, bezahlen und tragen ihr Tablett selbst an einen Tisch. Burger, Pizza, Bowls und Pommes füllen die Karten, das Essen ist wenige Minuten nach der Bestellung fertig, und reservieren muss man nicht. Es ist die häufigste Restaurantform im Freizeitpark und die, vor der sich mittags die Warteschlangen bilden.\n\nDer Begriff stammt von Disney. Sein Gastronomiesystem teilt Restaurants in Quick Service und Table Service, und der Disney Dining Plan führte die beiden als getrennte Guthaben.\n\nAm vollsten sind die Theken mittags und noch einmal vor einer Abendshow. Viele Parks nehmen Bestellungen über ihre App an, dann verlagert sich das Warten von der Kasse an die Ausgabe. Ein Food Court stellt mehrere Schnellrestaurant-Theken um einen gemeinsamen Sitzbereich.',
    relatedTermIds: ['character-dining', 'table-service'],
    alternateNames: ['Schnellrestaurant', 'Counter Service', 'Fast Food', 'Selbstbedienung'],
  },
  {
    id: 'table-service',
    name: 'Tischservice',
    shortDefinition: 'Sitzrestaurant mit Bedienung, bei dem Reservierungen oft erforderlich sind.',
    definition:
      'Ein Tischservice-Restaurant ist ein Restaurant im Park oder in einem der Parkhotels, in dem man sitzt und am Tisch bestellt. Ein Essen dauert eine Stunde oder länger und kostet deutlich mehr als an der Theke, dafür sitzt man mittags ruhig und geschützt vor Sonne oder Regen.\n\nIn den Disney-Parks sind die gefragten Restaurants ausgebucht, reserviert werden kann 60 Tage im Voraus. Der Disney Dining Plan rechnet sie als Tischservice-Guthaben ab, die Signature-Restaurants als zwei. Character Dining ist ein Essen mit Tischservice, bei dem kostümierte Figuren an die Tische kommen.\n\nEuropäische Parks betreiben eigene, vom thematisierten Restaurant im Themenbereich bis zur gehobenen Küche in den Resorthotels. Im Europa-Park hat das Ammolite im Leuchtturm des Hotels Bell Rock zwei Michelin-Sterne.',
    relatedTermIds: ['character-dining', 'peak-day', 'quick-service'],
    alternateNames: ['Tischservice', 'Table Service', 'Sitzrestaurant', 'Restaurant mit Bedienung'],
  },
  {
    id: 'character-dining',
    name: 'Character Dining',
    shortDefinition: 'Restaurant, bei dem Kostümcharaktere die Tische der Gäste besuchen.',
    definition:
      'Beim Character Dining, meist einem Buffet oder einem Menü mit Tischservice, gehen kostümierte Figuren von Tisch zu Tisch. Jede bleibt lange genug für ein paar Worte, ein Foto und ein Autogramm, so trifft eine Familie während eines Essens mehrere Figuren, ohne für jede an einem eigenen Meet & Greet anzustehen.\n\nIn den Disney-Parks sind diese Essen früh ausgebucht und teurer als ein gewöhnliches Restaurant derselben Art. In Florida sind Chef Mickey’s im Disney’s Contemporary Resort und Cinderella’s Royal Table im Schloss von Magic Kingdom die bekanntesten. Im Disneyland Paris kommen die Prinzessinnen in die Auberge de Cendrillon in Fantasyland, zum Frühstück, Mittag- und Abendessen.\n\nAußerhalb von Disney gibt es das Format im Kleinen. Zu einer Übernachtung in den Europa-Park-Hotels kann ein Frühstücksbesuch der Maskottchen Ed Euromaus und Edda Euromausi gehören.',
    relatedTermIds: ['character-meet-and-greet', 'quick-service', 'table-service'],
    alternateNames: [
      'Character Dining',
      'Character Meal',
      'Frühstück mit Charakteren',
      'Dinner mit Charakteren',
    ],
  },
  {
    id: 'drop-tower',
    name: 'Drop Tower',
    shortDefinition: 'Eine Turmattraktion, die Gäste nach oben fährt und dann fallen lässt.',
    definition:
      'Beim Drop Tower (auch Freifallturm oder Free-Fall-Tower) werden Fahrgäste in einer Gondel oder auf Sitzen rund um einen Turm nach oben gefahren und dann fallen gelassen. Der Fall ist nahezu schwerelos (echter freier Fall) oder gebremst, bei manchen Modellen wird die Gondel auch nach oben katapultiert. Unten bremst die Anlage die Gondel sanft ab. Es gibt auch Drop Towers, die sich drehen, Modelle mit mehreren Achsen und Mischformen. Drop Towers brauchen wenig Grundfläche und stehen weltweit in vielen Parks. Hersteller sind unter anderem Intamin, Mondial und S&S Worldwide.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'intamin', 's-and-s-worldwide'],
    aliases: ['Freifallturm', 'Drop Towers'],
    alternateNames: ['Drop Tower', 'Freifallturm', 'Free-Fall-Tower', 'Freefall', 'Drop Ride'],
  },
  {
    id: 'log-flume',
    name: 'Wildwasserbahn',
    shortDefinition:
      'Wasserkanal-Attraktion, bei der bootförmige Fahrzeuge durch einen Kanal fahren und mit einem Steilabfall enden.',
    definition:
      'Eine Wildwasserbahn (auch Flossfahrt oder Logflume) ist eine Wasserattraktion, bei der Gäste in Booten, traditionell Kunststoffbooten in Form eines Baumstamms, durch einen Wasserkanal fahren. Nach ruhigeren Abschnitten folgt eine steile Abfahrt, unten taucht das Boot in ein Becken ein, und die Fahrgäste werden nass. Wildwasserbahnen kamen in den 1960er Jahren auf und stehen heute in fast jedem Freizeitpark. Familien können sie gemeinsam fahren, die Kapazität ist mäßig, und im Sommer sind sie besonders gefragt. In Europa ist die Tiroler Wildwasserbahn im Europa-Park ein Beispiel, dazu kommen viele Wildwasserbahnen in deutschsprachigen Parks.',
    relatedTermIds: [
      'height-requirement',
      'river-rapids',
      'splashdown',
      'water-coaster',
      'water-ride',
    ],
    aliases: ['Logflume'],
    alternateNames: ['Log Flume', 'Flossfahrt', 'Bootsfahrt'],
  },
  {
    id: 'river-rapids',
    name: 'Wildwasser-Rafting',
    shortDefinition:
      'Rundboot-Attraktion durch turbulente Wildwasserstrecken, bei der alle Mitfahrer nass werden können.',
    definition:
      'Eine Wildwasser-Rafting-Bahn (auch Wild-Water-Ride oder River-Rapids-Bahn) befördert Gäste in kreisförmigen aufblasbaren oder Kunststoffbooten durch einen künstlich angelegten Kanal, der Wildwasser-Stromschnellen simuliert. Weil sich das runde Boot frei in der Strömung dreht, ist jede Fahrt anders. Je nachdem, wie das Boot gerade steht, werden manche Mitfahrer komplett nass und andere bleiben fast trocken. Die Bahnen schaffen viele Fahrgäste pro Stunde und haben meist eine niedrige Mindestgröße, Familien fahren sie gemeinsam. In Europa gibt es solche Bahnen etwa im Phantasialand, im Efteling, im Europa-Park und in Thorpe Park.',
    relatedTermIds: ['height-requirement', 'log-flume', 'water-ride'],
    alternateNames: [
      'River Rapids',
      'Wildwasserfahrt',
      'Wild Water Ride',
      'Rafting-Bahn',
      'Rundboot-Bahn',
    ],
  },
  {
    id: 'top-spin',
    name: 'Top Spin',
    shortDefinition:
      'Flat Ride von Huss, bei dem eine Gondel mit Fahrgästen frei in alle Richtungen rotiert, während der Trägerrahmen auf und ab schwingt.',
    definition:
      'Der Top Spin ist ein Fahrgeschäft des Herstellers Huss Rides. Eine Gondel für bis zu 40 Fahrgäste ist an einem schwenkbaren Rahmen befestigt. Während der Rahmen schwingt, kann sich die Gondel ununterbrochen in beliebiger Richtung weiterdrehen, Schwung- und Drehkräfte wechseln dabei kaum vorhersehbar. Das Programm reicht von sanftem Schaukeln bis zu Überschlägen ohne Pause.\n\nTop Spins waren von den 1990er bis in die 2010er Jahre in Freizeitparks und auf Jahrmärkten weit verbreitet und stehen noch heute in vielen Parks. Ein Pendelfahrgeschäft im engeren Sinn ist der Top Spin trotz des schwingenden Rahmens nicht: Die Gondel ist zwischen zwei seitlichen Dreharmen eingespannt, statt an einem langen Pendelarm zu hängen.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    aliases: ['Top Spins'],
    alternateNames: ['Huss Top Spin'],
  },
  {
    id: 'break-dance',
    name: 'Break Dance',
    shortDefinition:
      'Ein Huss-Fahrgeschäft mit mehreren Wagen auf einer großen rotierenden Scheibe, wobei sich jeder Wagen frei um seine eigene Achse dreht.',
    definition:
      'Beim Break Dance von Huss Rides stehen kleine Wagen für je zwei bis vier Fahrgäste auf einer großen drehenden Scheibe. Während sich die Scheibe dreht, drehen sich die Wagen frei um ihre eigene Achse. In welche Richtung ein Wagen gerade zeigt, lässt sich nicht vorhersagen.\n\nSeit den 1980er Jahren gehört der Break Dance zu den häufigsten Flat Rides auf Jahrmärkten und in Parks. Typisch sind die beleuchtete Drehscheibe und laute Musik. Andere Hersteller bauen Varianten und Nachbauten unter eigenen Namen.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Breakdance', 'Break Dancer'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    shortDefinition:
      'Ein Flat Ride, bei dem die Fliehkraft die Fahrgäste in den Gondeln eines großen drehenden Rings hält, während sich der Ring senkrecht aufstellt.',
    definition:
      'Bei der Enterprise hängen Gondeln rund um einen großen drehenden Ring. Dreht der Ring schneller, drückt die Fliehkraft die Fahrgäste fest in die Sitze. Bei voller Geschwindigkeit hebt sich der ganze Ring bis fast in die Senkrechte, und die Fahrgäste kreisen kopfüber.\n\nDie erste baute Anton Schwarzkopf 1972, Huss Rides brachte später eine verbesserte Version heraus, und weitere Hersteller folgten. Seit den 1970er Jahren steht sie in Freizeitparks und auf Jahrmärkten. Aufgerichtet ist der Ring von weitem zu sehen.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Enterprises'],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    shortDefinition:
      'Ein Überschlag-Pendel von Huss: Eine Käfiggondel an einem langen Arm schwingt immer höher, bis sie ganz über den Scheitel geht.',
    definition:
      'Der Ranger ist das Überschlag-Pendel von Huss Rides. Eine Käfiggondel sitzt am Ende eines langen Arms, der vor und zurück schwingt und mit jedem Schwung höher kommt, bis er die Gondel einmal ganz herumdreht und die Fahrgäste oben kopfüber hängen. Sie sitzen in Reihen im Käfig und tragen Schulterbügel.\n\nEin Schaukelschiff ist der Ranger nicht, das verkauft Huss als eigenes Modell unter dem Namen Pirat. Der Ranger gehört zu den am weitesten verbreiteten Huss-Modellen und steht in Parks und auf Jahrmärkten in ganz Europa und darüber hinaus.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    aliases: ['Huss Ranger'],
    alternateNames: ['Huss Ranger'],
  },
  {
    id: 'condor',
    name: 'Condor',
    shortDefinition:
      'Ein Flat Ride von Huss mit Gondelarmen, die sich während der Fahrt nach außen strecken, drehen und nach oben fahren.',
    definition:
      'Der Condor von Huss Rides besteht aus einer hohen Mittelsäule mit mehreren Gondelarmen. Während sich die ganze Anlage dreht, schwenken die Arme nach außen, und die Gondeln fahren nach oben. Die Fahrgäste drehen sich, steigen und werden nach außen geneigt, aus mittlerer Höhe sieht man über den Park.\n\nVon den 1970er bis in die 1990er Jahre stand der Condor in vielen europäischen Parks, an vielen festen Standorten steht er bis heute. Er wird manchmal mit Kettenkarussell-Attraktionen verwechselt, hat aber geschlossene Gondeln statt offener hängender Stühle.',
    relatedTermIds: ['flat-ride', 'huss-rides', 'swing-ride'],
  },
  {
    id: 'troika',
    name: 'Troika',
    shortDefinition:
      'Ein Flat Ride von Huss mit drei drehenden Armen, an denen je eine Gondel mit drehbaren Wagen hängt.',
    definition:
      'Bei der Troika von Huss Rides gehen drei Arme von einer Nabe in der Mitte aus. Jeder Arm trägt eine Gondel mit mehreren drehbaren Wagen. Hauptplattform, Gondeln und Wagen drehen sich gleichzeitig, jeweils um ihre eigene Achse, und die Bewegung ist kaum vorhersehbar.\n\nAb den 1970er Jahren stellten viele europäische Vergnügungsparks und Jahrmärkte eine Troika auf. Mit ihren drei Armen ist sie von weitem zu erkennen. Varianten anderer Hersteller heißen manchmal Trabant oder Walzer.',
    relatedTermIds: ['break-dance', 'flat-ride', 'huss-rides'],
    aliases: ['Troikas', 'Trojka'],
    alternateNames: ['Huss Troika'],
  },
  {
    id: 'pendulum-ride',
    name: 'Pendelfahrgeschäft',
    shortDefinition:
      'Fahrgeschäft, bei dem eine Gondel in einem weiten Pendelbogen schwingt, oft kombiniert mit einer Rotationsbewegung.',
    definition:
      'Ein Pendelfahrgeschäft ist ein Flat Ride, bei dem eine Gondel an einem langen Arm hängt, der in einem immer größeren Bogen vor- und zurückschwingt, oft fast bis in die Senkrechte. Dabei dreht sich die Gondel zusätzlich um ihre eigene Achse.\n\nDas bekannteste Beispiel ist der Frisbee (Huss), eine scheibenförmige Gondel, die sich im Pendelbogen dreht. Weitere verbreitete Pendelfahrgeschäfte sind der KMG Afterburner und der Giant Frisbee von Huss. Pendelfahrgeschäfte sind von weitem zu sehen, brauchen vergleichsweise wenig Platz und stehen deshalb in vielen Freizeitparks und auf Jahrmärkten.',
    relatedTermIds: ['drop-tower', 'flat-ride', 'height-requirement', 'swing-ride'],
    aliases: ['Frisbee', 'Frisbees', 'Pendelfahrgeschäfte', 'Pendelanlage', 'Pendelbahn'],
    alternateNames: ['Pendelanlage', 'Schwingattraktion'],
  },
  {
    id: 'swing-ride',
    name: 'Kettenkarussell',
    shortDefinition:
      'Ein Karussell, dessen Sitze an Ketten hängen und beim Drehen nach außen schwingen.',
    definition:
      'Ein Kettenkarussell (auch Kettenflieger oder Wellenflieger) ist ein Karussell, bei dem die Sitze an Ketten von einem drehenden Oberteil hängen. Beim Drehen trägt die Fliehkraft die Sitze nach außen und oben. Kettenkarussells gehören zu den ältesten Jahrmarktsfahrgeschäften, die noch verbreitet sind, und gehen bis ins frühe 20. Jahrhundert zurück. Heute gibt es kleine Kinderkarussells und Kettentürme (Starflyer), die die Fahrgäste weit nach oben heben. Kettenkarussells stehen in fast jedem Freizeitpark und auf Jahrmärkten weltweit.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'ride-capacity'],
    aliases: ['Wellenflieger', 'Kettenflieger', 'Kettenkarussells'],
    alternateNames: [
      'Swing Ride',
      'Kettenflieger',
      'Wellenflieger',
      'Hängekarussell',
      'Chairoplane',
    ],
  },
  {
    id: 'racing-coaster',
    name: 'Racing Coaster',
    shortDefinition:
      'Zwei parallele Achterbahn-Strecken, auf denen Züge gleichzeitig starten und Seite an Seite fahren.',
    definition:
      'Ein Racing Coaster hat zwei getrennte, spiegelbildliche Strecken, die nebeneinander verlaufen. Die Züge starten gleichzeitig und fahren gegeneinander um die Wette. An mehreren Stellen kreuzen sich die Strecken oder kommen sich sehr nahe. Manche Racing Coaster sind als Möbius-Loop gebaut: Beide Strecken bilden eine einzige Schleife, und wer auf der einen Seite losfährt, kommt auf der anderen an. Es gibt Racing Coaster aus Holz und aus Stahl. In Europa sind sie selten. Das bekannteste Beispiel ist Grand National in Blackpool Pleasure Beach, eine Holzachterbahn als Möbius-Loop.',
    relatedTermIds: ['credit', 'steel-coaster', 'wooden-coaster'],
    alternateNames: ['Racing Coaster', 'Paarachterbahn', 'Twin Coaster', 'Dueling Coaster'],
  },
  {
    id: 'high-five',
    name: 'High Five',
    shortDefinition:
      'Achterbahn-Element, bei dem zwei Züge auf parallelen Strecken in Armreichweite aneinander vorbeifahren.',
    definition:
      'Bei einem High Five fahren zwei Züge auf getrennten, eng benachbarten Strecken sehr dicht aneinander vorbei, manchmal in Armreichweite. Der Name kommt daher, dass man die Fahrgäste im anderen Zug scheinbar „abklatschen“ könnte. Dafür müssen beide Züge genau zur richtigen Zeit abfahren, damit sie sich an der Stelle treffen. Besonders gut geht das mit Wing Coastern und Inverted Coastern, weil die Sitze dort außen liegen und die Fahrgäste näher an den anderen Zug kommen. Ein frühes Beispiel war Duelling Dragons / Dragon Challenge in Universal’s Islands of Adventure, heute haben verschiedene B&M-Wing-Coaster weltweit das Element.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'wing-coaster'],
    alternateNames: ['High Five', 'Beinahe-Kollisions-Element', 'Near Miss', 'Near-Miss-Element'],
  },
  {
    id: 'dining-reservation',
    name: 'Tischreservierung',
    shortDefinition:
      'Vorab-Buchung für ein Tischservice-Restaurant in einem Freizeitpark oder Resort.',
    definition:
      'Eine Tischreservierung ist ein im Voraus gebuchter Tisch in einem Tischservice- oder Character-Dining-Restaurant im Park oder in den Parkhotels. In den Disney-Parks sind die gefragten Restaurants ohne Reservierung oft für den ganzen Tag voll, und zu den vollsten Zeiten gibt es nirgends einen Tisch ohne Buchung.\n\nIn Walt Disney World öffnen die Buchungen 60 Tage im Voraus, und Gäste der Disney-Hotels können ab diesem Tag für ihren ganzen Aufenthalt buchen, das sind bis zu zehn Tage mehr. Eine Kreditkarte sichert die Buchung, und wer nicht kommt oder nach dem Vortag absagt, zahlt eine Gebühr pro Person. Disney-Fans nennen diese Buchungen ADR, für Advance Dining Reservation.\n\nIn europäischen Parks geht es einfacher: Der Europa-Park und der Efteling nehmen Tischreservierungen online an, mit kürzerem Vorlauf und in den meisten Restaurants ohne Gebühr bei Nichterscheinen.',
    relatedTermIds: ['character-dining', 'peak-day', 'table-service'],
    alternateNames: [
      'Tischreservierung',
      'ADR',
      'Advance Dining Reservation',
      'Restaurantreservierung',
    ],
  },
  {
    id: 'mobile-ordering',
    name: 'Mobile Bestellung',
    shortDefinition:
      'App-Funktion, mit der Gäste Essen vorbestellen und bezahlen, ohne an der Theke anzustehen.',
    definition:
      'Bei der mobilen Bestellung wählen Gäste in der App des Parks aus der Karte eines Restaurants, bezahlen dort und holen das Essen an einem eigenen Schalter ab, sobald eine Nachricht meldet, dass es fertig ist, ohne an der Kasse anzustehen. Manche Systeme fragen vorab nach einem Abholzeitfenster, andere beginnen mit der Zubereitung, wenn der Gast in der App meldet, dass er da ist.\n\nDisney hat das in den Schnellrestaurants seiner amerikanischen Parks eingeführt, Universal, Six Flags, die Merlin-Parks und mehrere europäische Parks haben eigene Varianten. Mittags sind die beliebten Abholfenster oft schon am späten Vormittag vergeben, und die Warteschlange verlagert sich von der Kasse an die Ausgabe.\n\nVoraussetzung sind ein geladenes Handy und eine Mobilfunkverbindung, und in großen Gebäuden und an den Rändern eines Parks ist der Empfang oft schwach.',
    relatedTermIds: ['dining-reservation', 'quick-service'],
    alternateNames: ['Mobile Order', 'App-Bestellung', 'Mobile Bestellung'],
  },
  {
    id: 'food-court',
    name: 'Food Court',
    shortDefinition:
      'Großer gemeinsamer Essbereich mit mehreren Schnellrestaurant-Theken verschiedener Küchen unter einem Dach.',
    definition:
      'Ein Food Court ist eine Essenshalle mit mehreren Schnellrestaurant-Theken um einen gemeinsamen Sitzbereich, jede Theke mit eigener Karte: Pizza an der einen, Burger oder Nudeln an der anderen. Eine Gruppe kann sich zum Bestellen aufteilen und trotzdem zusammen essen, und ein großer Food Court hat Platz für mehrere hundert Gäste zugleich.\n\nManche sind als Teil ihres Themenbereichs gestaltet, andere sind schlichte Hallen nahe dem Eingang oder zwischen zwei belebten Bereichen. Bestellt wird wie an jeder Theke, oft zusätzlich über die Park-App, eine Reservierung braucht man nicht. Die Preise entsprechen denen der übrigen Schnellrestaurants im Park.',
    relatedTermIds: ['mobile-ordering', 'quick-service', 'table-service'],
    alternateNames: ['Food Court', 'Gastronomiehof', 'Essensbereich', 'Speisehalle'],
  },
  {
    id: 'capacity-closure',
    name: 'Kapazitätsschließung',
    shortDefinition:
      'Ein Park lässt keine neuen Besucher mehr ein, weil die maximale Besucherzahl erreicht ist.',
    definition:
      'Eine Kapazitätsschließung tritt ein, wenn so viele Gäste im Park sind, wie er aufnehmen darf oder kann, und er keine Tagestickets mehr verkauft oder niemanden mehr einlässt, bis genug gegangen sind. Die Grenze kommt aus der Betriebsgenehmigung und den Sicherheitsvorschriften, in der Praxis daraus, wie viele Menschen Wege, Toiletten und Restaurants aufnehmen.\n\nParks lösen das auf zwei Arten. Manche verkaufen datierte Tickets oder verlangen für jeden Besuch eine Reservierung, dann ist die Grenze Wochen vorher auf der Buchungsseite erreicht statt am Drehkreuz, und Jahreskarteninhaber ohne Reservierung kommen an solchen Tagen ebenfalls nicht hinein. Andere zählen die Gäste am Eingang und schließen ihn für ein, zwei Stunden, wenn die Grenze erreicht ist.\n\nDie Schließungen fallen jedes Jahr auf dieselben Termine: Feiertage, die vollsten Wochenenden der Schulferien, Eröffnungstage neuer Attraktionen und Feuerwerksabende. Parks melden sie in ihrer App und in den sozialen Medien, meist am selben Morgen.',
    relatedTermIds: ['crowd-level', 'peak-day', 'school-holiday', 'season-pass'],
    alternateNames: ['Kapazitätsschließung', 'Park ausverkauft', 'Kapazitätsgrenze', 'Park voll'],
  },
  {
    id: 'zero-g-winder',
    name: 'Zero-G Winder',
    shortDefinition:
      'Ein Zero-G Roll mit Richtungswechsel. Der Zug verlässt die Inversion in eine andere Richtung, als er hineingefahren ist.',
    definition:
      'Der Zero-G Winder ist ein Zero-G Roll, bei dem die Strecke zugleich die Richtung wechselt. Beim klassischen Zero-G Roll fährt der Zug in derselben Richtung aus, in der er eingefahren ist. Beim Winder biegt die Strecke während der Drehung ab, und der Zug kommt in einer deutlich anderen Richtung heraus. Die Inversion mit ihrer Schwerelosigkeit ist damit zugleich die Kurve in den nächsten Streckenabschnitt.\n\nZero-G Winder findet man vor allem auf neueren Bahnen von Herstellern wie Intamin und B&M. Ein Beispiel ist VelociCoaster in Universal’s Islands of Adventure.',
    relatedTermIds: ['airtime', 'intamin', 'inversion', 'zero-g-roll'],
    aliases: ['Zero-G-Winder'],
    alternateNames: ['Zero G Winder', 'Winder'],
  },
  {
    id: 'banana-roll',
    name: 'Banana Roll',
    shortDefinition:
      'Ein langgezogenes Element mit einer einzigen Inversion entlang eines weiten Bogens. Von oben sieht es aus wie eine Banane.',
    definition:
      'Der Banana Roll sieht aus wie ein in die Länge gezogener Cobra Roll, stellt die Fahrgäste aber nur einmal auf den Kopf. Der Cobra Roll packt zwei Überschläge eng und symmetrisch zusammen, der Banana Roll verteilt einen einzigen Überschlag auf einen langen, geschwungenen Bogen. Von oben hat dieser Bogen die Form einer Banane. Weil sich die Drehung über mehr Strecke zieht, geht es langsamer und fließender über Kopf als beim Cobra Roll.\n\nDen ersten Banana Roll baute Gerstlauer 2011 für Takabisha in Fuji-Q Highland, Japan. S&S Worldwide baute später eine eigene Variante für Steel Curtain in Kennywood. Weil das Element seitlich viel Platz braucht, steht es meist in größeren, bodennah gebauten Anlagen, in denen die Strecke weit ausschwingen kann.',
    relatedTermIds: ['cobra-roll', 'gerstlauer', 'inversion', 's-and-s-worldwide'],
  },
  {
    id: 'inclined-loop',
    name: 'Geneigter Looping',
    shortDefinition:
      'Ein Looping, der aus der Senkrechten gekippt ist. Der Zug fährt schräg ein und schräg wieder aus.',
    definition:
      'Ein geneigter Looping (englisch: Inclined Loop oder Tilted Loop) ist ein klassischer Looping, der zur Seite gekippt ist, meist um 45 bis 80 Grad gegenüber der Fahrtrichtung. Der Zug fährt schräg ein und schräg wieder aus, der Looping sieht dadurch schief aus und fährt sich anders als ein aufrechter.\n\nBei der Einfahrt wirken mehr seitliche Kräfte als im klassischen Looping, und unten verlässt der Zug den Looping in eine andere Richtung, als er hineingefahren ist. Von außen ist ein geneigter Looping sofort als ungewöhnlich zu erkennen. Geneigte Loopings haben verschiedene B&M- und Intamin-Coaster, oft im mittleren oder letzten Teil der Strecke.',
    relatedTermIds: ['b-and-m', 'intamin', 'inversion', 'vertical-loop'],
    aliases: ['geneigter Looping'],
    alternateNames: ['Tilted Loop', 'Inclined Loop'],
  },
  {
    id: 'sea-serpent',
    name: 'Sea Serpent',
    shortDefinition:
      'Ein Vekoma-Element mit zwei Inversionen, nach dem der Zug in dieselbe Richtung weiterfährt, in die er eingefahren ist.',
    definition:
      'Der Sea Serpent ist ein Element mit zwei Inversionen, das vor allem auf Inverted Coastern von Vekoma vorkommt. Wie beim Cobra Roll sind zwei Inversionen durch ein Mittelstück verbunden. Der Cobra Roll kehrt den Zug aber um 180 Grad um, beim Sea Serpent fährt er ungefähr in der Richtung weiter, in der er eingefahren ist. Die beiden Inversionen steigen bogenförmig auf und überschlagen sich, ohne dass sich die Fahrtrichtung ändert. Von der Seite sieht das Element lang und S-förmig aus, wie der Körper einer Seeschlange, der sich in zwei Wellen hebt.\n\nSea Serpents gehören zu Vekomas Suspended Looping Coaster (SLC) und einigen Sonderanlagen des Herstellers. Weil der SLC in großer Stückzahl gebaut wurde, ist der Sea Serpent eines der häufigsten Elemente mit zwei Inversionen, auch wenn sein Name weniger bekannt ist als der des Cobra Roll.',
    relatedTermIds: ['batwing', 'cobra-roll', 'inversion', 'vekoma'],
    alternateNames: ['Sea Serpent', 'Roll Over'],
  },
  {
    id: 'cobra-loop',
    name: 'Cobra Loop',
    shortDefinition:
      'Der Name, den Hersheypark der ersten Inversion des Storm Runner gab: ein Looping, aus dem der Zug seitlich herausdreht, statt ihn zu vollenden.',
    definition:
      'Ein Cobra Loop steigt an wie ein Looping und dreht oben zur Seite heraus, statt auf der anderen Seite wieder herunterzukommen. Der Zug verlässt das Element also in einer anderen Richtung, als er hineingefahren ist. Er überschlägt die Fahrgäste einmal.\n\nDer Name gehört zu einer einzigen Bahn. Intamin baute das Element 2004 für den Storm Runner im Hersheypark, und der Park vermarktete es als weltweit ersten Cobra Loop. Geometrisch ist es das, was andere Hersteller Sidewinder nennen. Wo ein Cobra Roll zwei dieser Formen aneinanderhängt und den Zug umkehrt, ist der Cobra Loop nur die eine Hälfte davon.',
    relatedTermIds: ['sidewinder', 'cobra-roll', 'vertical-loop', 'inversion', 'intamin'],
    alternateNames: ['Sidewinder'],
  },
  {
    id: 'jojo-roll',
    name: 'Jojo Roll',
    shortDefinition:
      'Eine langsame Heartline-Roll direkt hinter der Station, bevor der Zug überhaupt etwas erklommen hat.',
    definition:
      'Eine Jojo Roll ist eine 360-Grad-Heartline-Roll unmittelbar nach der Station, bei der sich der Zug kaum schneller als im Schritttempo überschlägt. Weil fast kein Tempo dahintersteckt, hängen die Fahrgäste in den Bügeln, statt in den Sitz gedrückt zu werden. Bei voller Fahrt später im Layout bewirkt dieselbe Figur das Gegenteil.\n\nHydra: The Revenge im Dorney Park führte sie 2005 ein. Vorgeschlagen hat das Element der Wartungs- und Bauleiter des Parks, Joe Greene, nach dem sie auch benannt ist. Copperhead Strike in Carowinds hat inzwischen ebenfalls eine.',
    relatedTermIds: ['heartline-roll', 'inversion', 'hangtime', 'lifthill'],
    aliases: ['Jojo Rolls', 'JoJo Roll'],
  },
  {
    id: 'flying-snake-dive',
    name: 'Flying Snake Dive',
    shortDefinition:
      'Eine Heartline-Roll, die direkt in einen gedrehten Sturzflug übergeht. Die zwei Überschläge werfen den Zug seitlich weg.',
    definition:
      'Beim Flying Snake Dive dreht sich der Zug durch eine Heartline-Roll und fällt, ohne sich je wieder zu stabilisieren, in einen gedrehten Sturzflug, der ihn in die Gegenrichtung schickt. Das zählt als zwei Überschläge, die so dicht ineinander übergehen, dass kaum jemand merkt, wo der eine endet und der andere beginnt.\n\nIntamin entwarf das Element 2005 für Maverick in Cedar Point, und Maverick bekam nie eines. Bei den Testfahrten zeigte sich, dass es zu hohe Kräfte auf die Fahrgäste ausgeübt hätte, also wurde es noch vor der Eröffnung 2007 gestrichen und durch eine S-Kurve ersetzt. Fahren kann man eines auf dem drei Jahre älteren Storm Runner im Hersheypark: eine Heartline-Roll, gefolgt von einem halben Immelmann, der zurück zum Bach hinunterstürzt.',
    relatedTermIds: ['heartline-roll', 'dive-drop', 'immelmann', 'inversion', 'intamin'],
  },
  {
    id: 'barrel-roll-drop',
    name: 'Barrel Roll Drop',
    shortDefinition:
      'Ein RMC-Element, bei dem sich der Zug auf der ersten Abfahrt einmal ganz um die Längsachse dreht.',
    definition:
      'Beim Barrel Roll Drop von Rocky Mountain Construction sind die erste Abfahrt und eine vollständige Inversion ein einziges Element. Hinter dem Lifthill dreht die Strecke den Zug einmal ganz um die Längsachse, während er hinunterfährt. Nahe der steilsten Stelle sind die Fahrgäste kopfüber, unten sind sie wieder aufgerichtet. Weil der Zug dabei beschleunigt, fährt er die Inversion schon mit hohem Tempo.\n\nMöglich macht das RMCs I-Box-Stahlschiene mit ihren engen Radien, auf einer klassischen Holzschiene ließe sich diese Form nicht bauen. Medusa Steel Coaster in Six Flags Mexico war eine der ersten Bahnen damit, weitere Beispiele sind Steel Vengeance in Cedar Point und Zadra in Energylandia.',
    relatedTermIds: ['first-drop', 'hybrid-coaster', 'inversion', 'rmc', 'stall'],
    alternateNames: ['Barrel Roll Drop', 'RMC Barrel Roll'],
  },
  {
    id: 'mcbr',
    name: 'MCBR',
    shortDefinition:
      'Mittelstreckenbremse: ein Bremsabschnitt in der Streckenmitte, der den Zug ganz anhalten kann, damit mehrere Züge sicher gleichzeitig fahren.',
    definition:
      'Eine Mittelstreckenbremse (englisch: Mid-Course Brake Run, kurz MCBR) ist eine Bremse etwa in der Mitte der Strecke, nach den ersten großen Elementen und vor dem letzten Abschnitt. Eine Trimbremse macht den Zug nur langsamer und lässt ihn sofort weiterfahren. Eine MCBR ist eine vollständige Blockbremse und kann den Zug anhalten und festhalten, bis der nächste Block frei gemeldet ist. Dadurch können mehrere Züge ohne Kollisionsgefahr zugleich auf der Strecke sein, und die Kapazität steigt deutlich.\n\nAn einem vollen Tag, an dem die Züge dicht hintereinander fahren, gibt eine gut abgestimmte MCBR den Zug fast sofort wieder frei, und die Fahrgäste merken den kurzen Halt kaum. An ruhigeren Tagen mit weniger Zügen kann der Halt länger dauern und abrupter sein. Die meisten großen Achterbahnen haben eine MCBR, darunter B&M-Inverted- und Floorless-Coaster, viele Intamin-Anlagen und andere Bahnen mit hoher Kapazität.',
    relatedTermIds: ['block-brake', 'brake-run', 'ride-capacity', 'stacking', 'trim-brake'],
    alternateNames: ['Mittelstreckenbremse', 'Zwischenbremse', 'Mittelbremse'],
  },
  {
    id: 'interlocking-loops',
    name: 'Verschlungene Loops',
    shortDefinition:
      'Zwei senkrechte Loopings, deren Ebenen sich kreuzen, sodass sie wie zwei Kettenglieder ineinanderhängen.',
    definition:
      'Verschlungene Loops (englisch Interlocking Loops) sind zwei senkrechte Loopings, deren Ebenen sich schneiden, meist ungefähr im rechten Winkel. Aus manchen Blickwinkeln scheint der eine durch den anderen hindurchzulaufen, wie zwei Kettenglieder oder eine riesige Acht, die aus dem Boden steigt. Zwei Loopings so zu kreuzen, dass sich die Schienen nicht berühren, verlangt eine aufwendige Stahlkonstruktion, und das Paar ist in der Silhouette eines Parks von weitem zu erkennen.\n\nDas klassische Beispiel ist Loch Ness Monster in Busch Gardens Williamsburg (Arrow Dynamics, 1978), dessen gekreuzte Loopings zu den meistfotografierten Teilen der Bahn gehören. Das Element steht auch auf einigen anderen Achterbahnen mit vielen Inversionen. Im Sitz fährt sich das Paar wie zwei kurz aufeinanderfolgende Loopings, wegen der engen Geometrie kommen die Übergänge schnell.',
    relatedTermIds: ['arrow-dynamics', 'inversion', 'vertical-loop'],
    alternateNames: ['Verschlungene Loops', 'Interlocking Loops', 'sich kreuzende Loops'],
  },
  {
    id: 'anti-rollback',
    name: 'Anti-Rollback',
    shortDefinition:
      'Die Ratschensicherung am Lifthill, die den Zug am Zurückrollen hindert. Von ihr kommt das bekannte Klick-Klack.',
    definition:
      'Ein Anti-Rollback-System (auch Rollback-Sperrklinke oder Anti-Rollback-Dog) ist eine mechanische Sicherung entlang des Lifthills. Beim Aufstieg rasten federnde Metallklinken am Zug, die „Dogs“, über eine Zahnleiste im Lifthill. Fällt die Kette oder der Antrieb aus, greifen die Klinken in die Zähne und halten den Zug fest, sodass er nicht zurückrollen kann. Das Rasten der Klinken über die Zähne ist das rhythmische Klick-Klack, das man von klassischen Achterbahnen kennt.\n\nModerne Bahnen mit leisem Seillift oder LSM-Lift haben statt der Klinken oft leise elektromagnetische Bremsen, am Lifthill sind sie deshalb deutlich leiser.',
    relatedTermIds: ['launch-coaster', 'lifthill', 'rollback'],
    alternateNames: ['Anti-Rollback', 'Rollback-Sperre', 'Click-Clack', 'Sperrklinke'],
  },
  {
    id: 'head-choppers',
    name: 'Head Choppers',
    shortDefinition:
      'Bauteile, die so knapp über den Köpfen der Fahrgäste vorbeiziehen, dass es nach einem Zusammenstoß aussieht.',
    definition:
      'Head Choppers sind Stellen, an denen Träger, Querstreben, Tunnel oder andere Streckenteile absichtlich knapp über den Köpfen der Fahrgäste vorbeiziehen, während der Zug mit hoher Geschwindigkeit fährt. Es sieht aus, als würde man gleich anstoßen, obwohl die Abstände genau berechnet sind und keine Gefahr besteht. Am stärksten wirkt das, wenn man es nicht kommen sieht, etwa wenn der Zug aus einer geneigten Kurve heraus unter einem tiefen Träger hindurchschießt.\n\nHead Choppers gibt es vor allem auf eng gebauten Holzachterbahnen und auf Inverted Coastern, wo die hängenden Beine der Fahrgäste und die tief liegenden Züge besonders nah an Stützen, Stationsgebäude und andere Streckenteile kommen.',
    relatedTermIds: ['inverted-coaster', 'roller-coaster-element', 'twister-coaster'],
    alternateNames: ['Head Chopper', 'Beinahe-Kollision', 'Near Miss'],
  },
  {
    id: 'stapling',
    name: 'Stapling',
    shortDefinition:
      'Wenn das Personal einen Schulter- oder Schoßbügel zu fest schließt. Die Fahrt wird unbequemer, und die Airtime geht verloren.',
    definition:
      'Beim Stapling drückt das Personal einen Schoß- oder Schulterbügel viel weiter hinunter, als die Sicherheit verlangt, bis er den Fahrgast in den Sitz presst. Der Name kommt vom englischen „staple“, heften: Man sitzt wie festgetackert. Auf einer Airtime-Bahn soll der Bügel Luft lassen, damit die Fahrgäste über den Kuppen vom Sitz abheben. Wer „gestapled“ ist, bleibt über jedem Hügel unten.\n\nAm meisten kostet das auf Holz- und Hybridachterbahnen, die man wegen der Airtime fährt. Wie fest die Bügel gedrückt werden, unterscheidet sich von Park zu Park und von Mitarbeiter zu Mitarbeiter am selben Bahnsteig. Auf den meisten modernen Bahnen schließen die Fahrgäste den Bügel selbst, und das Personal prüft nur, ob er eingerastet ist. Manche Parks lassen jeden Bügel routinemäßig noch eine Raste weiter drücken.\n\nBügel rasten stufenweise ein, und einen zu weit gedrückten Bügel kann der Fahrgast nicht selbst lösen. Er bleibt bis zum Ende der Fahrt, wo er ist.',
    relatedTermIds: [
      'airtime',
      'ejector-airtime',
      'lap-bar',
      'restraint-freedom',
      'shoulder-harness',
    ],
    aliases: ['Stapled'],
    alternateNames: ['Überstapeln', 'zu fester Bügel', 'Bügel zu eng'],
  },
  {
    id: 'valleying',
    name: 'Valleying',
    shortDefinition:
      'Ein Achterbahnzug verliert unterwegs so viel Schwung, dass er in einem Tal stecken bleibt und die Station nicht mehr erreicht.',
    definition:
      'Valleying heißt, dass ein Achterbahnzug in einer Senke der Strecke stehen bleibt, weil ihm vor dem nächsten Hügel oder Element die Energie ausgeht. Er bleibt im Anstieg hängen, rollt zurück und pendelt am tiefsten Punkt zwischen zwei Kuppen aus. Dort gibt es weder Bremsen noch Antrieb, und die Steuerung der Bahn kann den Zug nicht weiterbewegen.\n\nDas Wartungspersonal holt die Fahrgäste dann über Leitern oder Stege heraus und schiebt oder zieht den Zug mit einer Winde über die nächste Kuppe oder zurück. Die Bahn steht für Stunden still.\n\nAchterbahnen werden mit einer Reserve an Tempo geplant, Valleying ist selten. Wahrscheinlicher wird es bei Kälte, wenn das Fett in den Radlagern zäh wird und der Zug langsamer läuft, mit einem leicht besetzten Zug auf einer Bahn, die für volle Züge eingestellt ist, wenn eine Trim-Bremse zu viel Tempo nimmt, oder auf einer alten Holzachterbahn, deren Strecke sich gesetzt hat.',
    relatedTermIds: ['brake-run', 'downtime', 'rollback', 'trim-brake'],
    alternateNames: ['Valleying', 'im Tal feststecken', 'stecken gebliebener Zug'],
  },
  {
    id: 'wild-mouse',
    name: 'Wilde Maus',
    shortDefinition:
      'Ein Achterbahntyp mit kleinen Einzelwagen und engen, kaum geneigten Spitzkehren am Rand erhöhter Plattformen.',
    definition:
      'Eine Wilde Maus (englisch: Wild Mouse) fährt mit kleinen Wagen für zwei bis vier Personen statt mit langen Zügen. Typisch sind enge, kaum geneigte Haarnadelkurven ganz am Rand der Strecke. Weil die Kurven, anders als bei anderen Achterbahnen, kaum geneigt sind, drückt es die Fahrgäste seitlich gegen die Wagenwand. Die Wagen sind oft breiter als die Schiene, deshalb sieht es in jeder Kurve so aus, als rutschten sie gleich über den Rand.\n\nWilde Mäuse brauchen sehr wenig Platz, weil die Ebenen mit den Haarnadelkurven übereinander liegen und so viel Strecke auf eine kleine Fläche passt. Sie stehen in ganz Europa und weltweit, in Deutschland kennen viele Parkbesucher den Namen „Wilde Maus“. Hersteller sind unter anderem Mack Rides, Maurer und Gerstlauer.',
    relatedTermIds: [
      'bobsled-coaster',
      'gerstlauer',
      'mack-rides',
      'spinning-coaster',
      'steel-coaster',
    ],
    alternateNames: ['Wilde Maus', 'Wild Mouse', 'Mausbahn'],
  },
  {
    id: 'fourth-dimension-coaster',
    name: '4D-Coaster',
    shortDefinition:
      'Ein Achterbahntyp, bei dem die Sitze auf drehbaren Armen seitlich außerhalb des Zuges montiert sind und sich unabhängig von der Fahrtrichtung drehen können.',
    definition:
      'Ein Fourth-Dimension-Coaster (4D-Coaster) ist eine Achterbahn, bei der die Sitze auf schwenkbaren Armen links und rechts vom Wagen sitzen, statt fest am Zug montiert zu sein. Die Sitze drehen sich vorwärts oder rückwärts. Entweder gibt eine zusätzliche Steuerschiene neben der Strecke ihre Stellung an jeder Stelle vor, oder sie drehen sich frei, je nach Schwerkraft und Gewichtsverteilung der Fahrgäste. So schauen die Fahrgäste auf einer Abfahrt nach unten, stehen in einer Kurve kopfüber oder drehen sich in einer Inversion um mehrere Achsen zugleich.\n\nDas Konzept stammt von Arrow Dynamics und wurde später von S&S Worldwide weiterentwickelt. X2 in Six Flags Magic Mountain (Kalifornien) eröffnete 2002 als erster 4D-Coaster und ist der bekannteste. Bei Eejanaika in Fuji-Q Highland, Japan, werden die Drehungen der Sitze als Inversionen mitgezählt. Den Guinness-Rekord für die meisten Inversionen hält aber The Smiler in Alton Towers mit 14.',
    relatedTermIds: [
      'arrow-dynamics',
      'inversion',
      'inverted-coaster',
      's-and-s-worldwide',
      'spinning-coaster',
    ],
    alternateNames: [
      '4D Coaster',
      '4D-Achterbahn',
      'Fourth Dimension Coaster',
      'Free Spin Coaster',
    ],
  },
  {
    id: 'out-and-back',
    name: 'Out-and-Back',
    shortDefinition:
      'Ein Achterbahn-Layout, das von der Station geradeaus wegführt, am Ende des Geländes umdreht und parallel zurückführt.',
    definition:
      'Ein Out-and-Back ist einer der zwei grundlegenden Layouttypen für Achterbahnen. Der Zug fährt von der Station ungefähr geradeaus weg, meist über eine Reihe von Airtime-Hügeln, wendet am Ende des Geländes und kommt auf einer ähnlichen Linie parallel zur Hinfahrt zurück. Die beiden Abschnitte kreuzen sich kaum, der Grundriss ist lang und schmal, anders als beim kompakteren Twister.\n\nTypisch ist das Layout für klassische Holzachterbahnen. Das Tempo aus den großen Hügeln der Hinfahrt wird auf dem Rückweg über kleinere Hügel mit Floater Airtime verbraucht. Jeder Hügel ist für das Tempo gezeichnet, das der Zug an dieser Stelle hat, und weil der Zug unterwegs Energie verliert, sind die Hügel auf dem Rückweg niedriger und stehen dichter, damit er über jeden noch schwebt. Beispiele sind The Voyage in Holiday World, Comet in The Great Escape und die verschiedenen Racer-Bahnen. Auch Stahlachterbahnen haben manchmal ein Out-and-Back-Layout, aber seltener als Holzbahnen.',
    relatedTermIds: ['airtime', 'airtime-hill', 'twister-coaster', 'wooden-coaster'],
    alternateNames: [
      'Out and Back',
      'Out-and-Back-Layout',
      'Out-and-Back Coaster',
      'Hin-und-Rück-Coaster',
    ],
  },
  {
    id: 'twister-coaster',
    name: 'Twister',
    shortDefinition:
      'Ein Achterbahn-Layout, das sich spiralförmig über sich selbst zurückfaltet und viele Elemente auf kleiner Grundfläche unterbringt.',
    definition:
      'Beim Twister-Coaster (auch Cyclone-Layout) windet sich die Strecke, faltet sich zurück und kreuzt sich immer wieder über oder unter sich selbst. Ein Out-and-Back fährt dagegen einfach hin und zurück. Der Zug fährt oft dicht an anderen Abschnitten derselben Bahn vorbei, in anderer Richtung und auf anderer Höhe, dabei entstehen Head Choppers.\n\nViel Strecke und Höhenunterschied passen so auf einen kompakten, ungefähr quadratischen oder rechteckigen Grundriss. Ein klassischer Holz-Twister ist der Twister in Gröna Lund in Stockholm, bei Stahlbahnen haben viele B&M- und Intamin-Designs ein Twister-Layout. Weil der Zug ständig die Richtung wechselt, fahren sich Twister meist heftiger als Out-and-Back-Bahnen.',
    relatedTermIds: ['head-choppers', 'helix', 'out-and-back', 'wooden-coaster'],
    aliases: ['Twister-Layout'],
    alternateNames: ['Twister Coaster', 'Cyclone-Layout', 'Twister'],
  },
  {
    id: 'mae',
    name: 'MAE',
    shortDefinition:
      'Mean Absolute Error: die durchschnittliche Abweichung in Minuten zwischen Vorhersage und tatsächlicher Wartezeit.',
    definition:
      'MAE (Mean Absolute Error, mittlerer absoluter Fehler) ist das Standardmaß für die Vorhersagegenauigkeit bei park.fan. Er ist die durchschnittliche Differenz in Minuten zwischen jeder vorhergesagten Wartezeit und der tatsächlich an der Attraktion gemessenen. Ein MAE von 8 Minuten bedeutet, dass die Vorhersagen im Schnitt 8 Minuten danebenliegen.\n\nDer MAE gewichtet jeden Fehler gleich, ein 5-Minuten-Fehler und ein 15-Minuten-Fehler gehen linear in den Durchschnitt ein. Deshalb ist er leicht zu lesen. Bei einem MAE von 10 liegen die Vorhersagen typischerweise um bis zu 10 Minuten neben der tatsächlichen Wartezeit. Ein niedrigerer MAE bedeutet immer genauere Vorhersagen.',
    relatedTermIds: ['ai-forecast', 'mape', 'r-squared', 'rmse'],
    alternateNames: ['Mean Absolute Error'],
  },
  {
    id: 'rmse',
    name: 'RMSE',
    shortDefinition:
      'Root Mean Square Error: wie der MAE, gewichtet große Vorhersagefehler aber stärker.',
    definition:
      'RMSE (Root Mean Square Error, mittlere quadratische Abweichung) misst die Vorhersagegenauigkeit, indem jeder Fehler vor der Mittelung quadriert wird. Große Ausreißer, etwa eine um 40 Minuten falsch vorhergesagte Wartezeit, zählen im RMSE dadurch viel stärker als ein kleiner 5-Minuten-Fehler. Für denselben Datensatz ist der RMSE immer gleich groß oder größer als der MAE.\n\nLiegen RMSE und MAE weit auseinander, liegt das Modell gelegentlich stark daneben, auch wenn die meisten Vorhersagen nah an der tatsächlichen Wartezeit sind. Beide Werte stehen live auf der Startseite von park.fan.',
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'r-squared'],
    alternateNames: ['Root Mean Square Error'],
  },
  {
    id: 'mape',
    name: 'MAPE',
    shortDefinition:
      'Mean Absolute Percentage Error: der Vorhersagefehler in Prozent der tatsächlichen Wartezeit.',
    definition:
      'MAPE (Mean Absolute Percentage Error, mittlerer absoluter prozentualer Fehler) gibt die Vorhersagegenauigkeit in Prozent an statt in Minuten. Statt „8 Minuten daneben“ heißt es dann „15 % der tatsächlichen Wartezeit daneben“. So lässt sich die Genauigkeit bei Attraktionen mit sehr unterschiedlichen Wartezeiten vergleichen. Ein 10-Minuten-Fehler wiegt bei einer Attraktion mit sonst 15 Minuten Wartezeit viel schwerer als bei einer mit 90 Minuten.\n\nDer MAPE kann irreführend hoch sein, wenn die tatsächlichen Wartezeiten sehr kurz sind. Deshalb zeigt park.fan ihn immer zusammen mit MAE und RMSE.',
    relatedTermIds: ['ai-forecast', 'mae', 'r-squared', 'rmse'],
    alternateNames: ['Mean Absolute Percentage Error'],
  },
  {
    id: 'r-squared',
    name: 'R²',
    shortDefinition:
      'Bestimmtheitsmaß: wie gut das KI-Modell die Schwankungen der gemessenen Wartezeiten erklärt (0–1, höher ist besser).',
    definition:
      'R² (R-Quadrat, auch Bestimmtheitsmaß) misst, wie viel von den Schwankungen der tatsächlichen Wartezeiten das Modell erklärt. Ein Wert von 1,0 würde bedeuten, dass das Modell jede Warteschlange perfekt vorhersagt. Bei 0,0 erklärt es nichts, was ein einfacher Durchschnitt nicht auch erklärt. In der Praxis sind Werte über 0,7 ein starkes Ergebnis, Werte über 0,9 ein ausgezeichnetes.\n\nFür Wartezeit-Prognosen ist ein hoher R²-Wert schwer zu erreichen, weil unvorhersehbare Ereignisse die Warteschlangen beeinflussen: Ausfälle von Attraktionen, plötzliche Wetterwechsel, spontane Veranstaltungen. Der R²-Wert auf park.fan stammt aus dem Abgleich aller nachgerechneten Vorhersagen und wird täglich neu bestimmt.',
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'rmse'],
    alternateNames: ['R-squared', 'Bestimmtheitsmaß'],
  },
  {
    id: 'seasonal-attraction',
    name: 'Saisonale Attraktion',
    shortDefinition:
      'Eine Attraktion oder Show, die nur in bestimmten Monaten läuft, etwa eine Eisbahn im Winter oder eine Wildwasserbahn im Sommer.',
    definition:
      'Eine saisonale Attraktion ist eine Fahrt, Show oder ein anderes Angebot, das der Park nur in einem festen Teil des Jahres betreibt. Eislaufflächen, Rodelstrecken und Wintershows laufen typischerweise von November bis Februar, Wildwasserbahnen, Wasserattraktionen und Open-Air-Shows von Mai bis September. Manche saisonalen Angebote gehören zu einem bestimmten Event wie Halloween oder Weihnachten.\n\npark.fan erkennt saisonale Attraktionen und Shows automatisch an den bisherigen Betriebsdaten und blendet sie in der Parkübersicht und auf der Karte aus, solange sie außerhalb ihrer Saison sind. So bleibt die Ansicht übersichtlich, und es stehen dort nur die Attraktionen, die heute tatsächlich geöffnet sind. Auf jeder betroffenen Karte steht ein Saison-Badge (Winter, Sommer oder allgemein). Ist die Attraktion gerade nicht in Saison, ist das Badge abgeblendet. Über einen Schalter in den Tabs lassen sich die ausgeblendeten Einträge wieder anzeigen, etwa um einen Winterbesuch zu planen.',
    relatedTermIds: ['crowd-calendar', 'offseason', 'refurbishment'],
    alternateNames: ['Saisonfahrt', 'saisonale Show', 'Saisonangebot'],
  },
  {
    id: 'gravity-group',
    name: 'The Gravity Group',
    shortDefinition:
      'Ein US-amerikanisches Designbüro, das auf moderne Holzachterbahnen spezialisiert ist.',
    definition:
      'The Gravity Group ist ein amerikanisches Ingenieur- und Designbüro, das moderne Holzachterbahnen in aller Welt entwirft. Gegründet haben es frühere Mitarbeiter von Custom Coasters International (CCI). Typisch sind kompakte, heftige Layouts mit Elementen, die für Holzkonstruktionen ungewöhnlich sind. Oft fahren darauf „Timberliner“-Züge, die engere und stärker verdrehte Passagen schaffen als klassische Holzachterbahnzüge. Beispiele sind The Voyage in Holiday World und Cú Chulainn im irischen Emerald Park (früher Tayto Park).',
    relatedTermIds: ['cci', 'hybrid-coaster', 'rmc', 'wooden-coaster'],
    aliases: ['Gravity Group'],
  },
  {
    id: 'sally-dark-rides',
    name: 'Sally Dark Rides',
    shortDefinition: 'Hersteller von Dark Rides und Animatronics.',
    definition:
      'Sally Dark Rides (ehemals Sally Corporation) entwickelt Dark Rides und Animatronics. Die Firma aus Florida liefert Attraktionen „schlüsselfertig“, von der Geschichte und den Kulissen über das Fahrsystem bis zu den animierten Figuren. Bekannt ist Sally vor allem für interaktive Dark Rides, in denen Gäste mit Blastern Punkte sammeln, etwa die verschiedenen Justice League: Battle for Metropolis-Attraktionen und viele Scooby-Doo-Fahrten weltweit.',
    relatedTermIds: ['animatronics', 'dark-ride', 'interactive-dark-ride'],
    aliases: ['Sally Corporation'],
  },
  {
    id: 'mondial',
    name: 'Mondial',
    shortDefinition: 'Ein niederländischer Hersteller großer Thrill-Flat-Rides.',
    definition:
      'Mondial ist ein Hersteller aus den Niederlanden, der große, heftige Flat Rides baut. Viele Mondial-Anlagen drehen die Fahrgäste um mehrere Achsen zugleich. Zu den bekanntesten Modellen gehören der Top Scan, der Shake und der Turbine. Mondial-Fahrgeschäfte stehen in großen Freizeitparks und reisen über europäische Kirmessen.',
    relatedTermIds: ['flat-ride', 'huss-rides', 'top-spin'],
  },
  {
    id: 'kmg',
    name: 'KMG',
    shortDefinition: 'Ein niederländischer Hersteller transportabler Flat Rides.',
    definition:
      'KMG ist ein niederländischer Hersteller aus Neede, 1989 von Isje Kroon gegründet, und einer der großen Anbieter von Flat Rides. Ursprünglich baute KMG für die Kirmes. Weil die Anlagen zuverlässig laufen und leicht zu warten sind, stehen sie inzwischen auch fest in Freizeitparks. Von KMG stammen der Afterburner (ein Frisbee-Modell) und der Freak Out. Die Anlagen sind schnell aufgebaut und laufen ruhig.',
    relatedTermIds: ['flat-ride', 'mondial', 'pendulum-ride'],
  },
  {
    id: 'oceaneering',
    name: 'Oceaneering',
    shortDefinition:
      'Ein Technikunternehmen, das Fahrsysteme und Bewegungsplattformen für Themenparks baut.',
    definition:
      'Oceaneering Entertainment Systems (OES) baut Attraktionstechnik. Die Sparte gehörte zu Oceaneering International und wurde im Mai 2025 von Falcon’s Beyond übernommen. Aus dem Wissen von Oceaneering über Unterwasserroboter entstanden die Fahrzeuge mit Bewegungsplattform, die bei The Amazing Adventures of Spider-Man in Universal Islands of Adventure fahren. OES baut auch schienenlose Fahrsysteme und aufwendige Animatronics.',
    relatedTermIds: ['dark-ride', 'motion-simulator', 'trackless-ride'],
    aliases: ['Oceaneering International'],
  },
  {
    id: 'etf-ride-systems',
    name: 'ETF Ride Systems',
    shortDefinition:
      'Ein niederländischer Hersteller, der auf schienenlose und Multi-Mover-Fahrsysteme spezialisiert ist.',
    definition:
      'ETF Ride Systems ist ein niederländisches Unternehmen, das Fahrplattformen baut, vor allem schienenlose Fahrzeuge. Die Fahrzeuge folgen einem Leitdraht im Boden oder orten sich selbst und fahren frei über eine ebene Fläche. So können sie unterschiedliche Wege nehmen und „tanzen“. Mit ETF-Technik fahren zum Beispiel Symbolica im Efteling und Ratatouille: Das Abenteuer im Disneyland Paris und in Walt Disney World.',
    relatedTermIds: ['dark-ride', 'oceaneering', 'trackless-ride'],
  },
  {
    id: 'chance-rides',
    name: 'Chance Rides',
    shortDefinition:
      'Ein US-amerikanischer Hersteller von Achterbahnen, Flat Rides und Transportsystemen.',
    definition:
      'Chance Rides ist ein amerikanischer Hersteller, der Karussells, Miniaturbahnen und schnelle Achterbahnen gebaut hat. Nach der Übernahme der Vermögenswerte von D.H. Morgan Manufacturing stieg Chance in den Bau von Hypercoastern ein. Heute baut die Firma das Modell „Hyper GT-X“ und klassische Flat Rides wie Zipper und Wipeout und ist einer der größten Anbieter von Parkeisenbahnen und Karussells.',
    relatedTermIds: ['arrow-dynamics', 'flat-ride', 'hyper-coaster', 'morgan', 'steel-coaster'],
  },
  {
    id: 'non-inverting-loop',
    name: 'Non-Inverting Loop',
    shortDefinition:
      'Ein loopförmiges Element, bei dem die Schiene so verdreht ist, dass die Fahrgäste nie ganz auf dem Kopf stehen.',
    definition:
      'Ein Non-Inverting Loop hat die Form eines klassischen Loopings, aber die Schiene dreht sich am Scheitelpunkt, sodass der Zug aufrecht bleibt. Die Fahrgäste fahren durch eine Loopingform und spüren starke senkrechte G-Kräfte, stehen aber nie kopfüber. Bekannt gemacht hat das Element Maurer Rides auf seinen X-Car-Coastern (etwa Hollywood Rip Ride Rockit), inzwischen bauen es auch andere Hersteller wie Mack Rides.',
    relatedTermIds: ['airtime', 'inversion', 'vertical-loop'],
    aliases: ['Non-Inverting Loops', 'Nicht-invertierender Loop'],
  },
  {
    id: 'pretzel-knot',
    name: 'Pretzel Knot',
    shortDefinition: 'Ein großes, brezelförmiges Element, bei dem sich die Schienen kreuzen.',
    definition:
      'Ein Pretzel Knot (Brezelknoten) ist ein Element, bei dem Ein- und Ausfahrt nebeneinander liegen und zusammen eine Brezelform bilden. Vom Pretzel Loop der Flying Coaster ist er zu unterscheiden. Der Pretzel Knot ist seltener, man findet ihn etwa auf Banshee in Kings Island. Er besteht aus zwei Inversionen, einem Dive Loop und einem Immelmann, deren Strecken sich kreuzen, und hat hohe G-Kräfte.',
    relatedTermIds: ['corkscrew', 'inversion', 'pretzel-loop'],
    aliases: ['Pretzel Knots', 'Brezelknoten'],
  },
  {
    id: 'raven-turn',
    name: 'Raven Turn',
    shortDefinition:
      'Ein Element bei 4D-Coastern, das aus einem halben Loop besteht und die Sitzorientierung ändert.',
    definition:
      'Ein Raven Turn ist ein typisches Element von 4D-Achterbahnen (etwa X2 oder Eejanaika). Es ist ein halber Looping, den der Zug entweder „innen“ oder „außen“ fährt. Weil sich die Sitze auf 4D-Coastern unabhängig von der Schiene drehen, überschlagen sie sich im Raven Turn oft zusätzlich, und oben und unten wechseln kurz hintereinander mehrmals.',
    relatedTermIds: ['fourth-dimension-coaster', 'inversion', 'wing-coaster'],
    aliases: ['Raven Turns'],
  },
  {
    id: 'dive-drop',
    name: 'Dive Drop',
    shortDefinition:
      'Eine Inversion bei Wing Coastern, die mit einer Inline-Drehung oben auf dem Lifthill beginnt.',
    definition:
      'Den Dive Drop gibt es fast nur auf B&M-Wing-Coastern. Er ist die erste Abfahrt: Oben am Lifthill dreht sich der Zug langsam um 180 Grad auf den Kopf und stürzt dann in einem halben Looping hinab. Die Fahrgäste hängen dabei lange kopfüber (Hangtime), und von den Außensitzen blickt man direkt in die Tiefe.',
    relatedTermIds: ['first-drop', 'hangtime', 'inversion', 'wing-coaster'],
    aliases: ['Dive Drops'],
  },
  {
    id: 'outerbanked-turn',
    name: 'Outerbanked Turn',
    shortDefinition: 'Eine Kurve, bei der die Schiene entgegen der Kurvenrichtung geneigt ist.',
    definition:
      'In einer Outerbanked Turn ist die Schiene zur Kurvenaußenseite geneigt, also andersherum als üblich. Normalerweise liegt eine Kurve nach innen geneigt, damit sich die Seitenkräfte aufheben. Hier kippt die Schiene nach außen, und die Fahrgäste werden zur Außenseite des Wagens gedrückt. Das Element bauen vor allem RMC und Intamin. Es verbindet seitliche und negative G-Kräfte (Airtime).',
    relatedTermIds: ['airtime', 'lateral-gs', 'overbank', 'rmc'],
    aliases: ['Outerbanked Turns', 'Außengeneigte Kurve'],
  },
  {
    id: 'camelback',
    name: 'Camelback',
    shortDefinition: 'Ein höckerförmiger Hügel für Airtime, oft mehrere hintereinander.',
    definition:
      'Ein Camelback ist ein großer, runder Hügel in einer Achterbahnstrecke, geformt wie der Höcker, nach dem er heißt. Der Zug fährt hinauf, über die Kuppe und auf der anderen Seite hinunter, ohne Kurve und ohne Neigung. Ist die Kuppe als Parabel gezeichnet, die zur Fallkurve des Zuges passt, heben die Fahrgäste ein, zwei Sekunden lang leicht aus dem Sitz ab, das ist Floater Airtime. Eine spitzere Kuppe bei höherem Tempo macht aus derselben Art Hügel Ejector Airtime.\n\nCamelbacks sind der Grundbaustein der Out-and-Back-Hypercoaster, die mehrere davon auf Hin- und Rückweg aneinanderreihen. Jeder ist etwas niedriger als der vorige, weil der Zug unterwegs Energie verliert. Silver Star im Europa-Park (B&M, 2002) setzt nach dem ersten Drop einen großen Camelback, Magnum XL-200 in Cedar Point (Arrow, 1989) endet mit einer Reihe kleiner Hügel.',
    relatedTermIds: ['airtime', 'airtime-hill', 'hyper-coaster', 'quad-down'],
    aliases: ['Camelbacks', 'Kamelbuckel'],
  },
  {
    id: 'zero-g-stall',
    name: 'Zero-G Stall',
    shortDefinition:
      'Eine Inversion, bei der der Zug längere Zeit auf dem Kopf fährt, während er einen geraden Schienenabschnitt passiert.',
    definition:
      'Beim Zero-G Stall dreht sich die Schiene um 180 Grad auf den Kopf, bleibt über einen längeren geraden oder leicht gebogenen Abschnitt so und dreht sich dann zurück. Ein Zero-G Roll dreht ohne Pause durch, beim Stall bleibt der Zug eine Weile kopfüber, und die Fahrgäste hängen schwerelos in den Bügeln. Bekannt gemacht hat das Element RMC auf seinen Hybrid- und I-Box-Coastern.',
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'stall', 'zero-g-roll'],
    aliases: ['Zero-G Stalls'],
  },
  {
    id: 'gp',
    name: 'GP (General Public)',
    shortDefinition: 'Fan-Jargon für „normale“ Parkbesucher.',
    definition:
      'GP oder „General Public“ nennen Freizeitpark- und Achterbahnfans die durchschnittlichen Parkbesucher, die weniger über Technik wissen und sich weniger für Fahrgeschäfte begeistern. Der Begriff fällt oft, wenn es darum geht, wie Parks ihre Attraktionen vermarkten oder wie Gäste auf Abläufe und Schließungen reagieren. Die Parks selbst benutzen ihn in der Regel nicht.',
    relatedTermIds: ['credit', 'ert', 'fanboy', 'hype-train', 'mackprodukt', 'touring-plan'],
    aliases: ['General Public'],
  },
  {
    id: 'strata-coaster',
    name: 'Strata-Coaster',
    shortDefinition:
      'Eine Achterbahn mit einer Höhe oder einem Gefälle von über 400 Fuß (122 Meter).',
    definition:
      'Ein Strata-Coaster ist eine Achterbahn, die eine Höhe von 400 Fuß (122 Meter) oder mehr erreicht. Den Begriff prägte Cedar Point zur Eröffnung von Top Thrill Dragster. Strata-Coaster sind sehr teuer und technisch aufwendig, bis heute wurde nur eine Handvoll gebaut, darunter Kingda Ka in Six Flags Great Adventure, das 2024 geschlossen und 2025 abgerissen wurde.',
    relatedTermIds: ['giga-coaster', 'hyper-coaster', 'launch-coaster'],
    aliases: ['Strata Coasters', 'Strata-Achterbahn'],
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    shortDefinition: 'Das Losschicken eines Zuges oder Fahrzeugs aus der Station.',
    definition:
      'Beim Dispatch gibt das Personal ein Fahrzeug zur Abfahrt frei, und die Fahrt beginnt. Wie schnell die Dispatches aufeinander folgen, bestimmt die Kapazität (Personen pro Stunde) mit. Dauern sie zu lange, kommt es zum „Stacking“, und die folgenden Züge warten vor der Station. Manche Fans stoppen die „Dispatch-Zeiten“, um zu vergleichen, wie zügig ein Park abfertigt.',
    relatedTermIds: ['queue-line', 'ride-capacity', 'stacking'],
    aliases: ['Dispatches', 'Abfertigung'],
  },
  {
    id: 'near-miss',
    name: 'Near-Miss',
    shortDefinition:
      'Ein Bauteil so nah an der Strecke, dass es aussieht, als würde der Fahrgast dagegenstoßen.',
    definition:
      'Ein Near-Miss (oder Head-Chopper/Foot-Chopper) ist eine Kulisse oder ein Bauteil, das absichtlich sehr nah an der Strecke steht. Die Fahrgäste bleiben immer im sicheren „Lichtraumprofil“, aber bei dem Tempo und aus ihrem Blickwinkel sieht es aus, als könnten sie einen Balken, eine Tunnelwand oder ein anderes Stück Strecke treffen. Die Fahrt wirkt dadurch schneller und gefährlicher, als sie ist.',
    relatedTermIds: ['clearance-envelope', 'foot-chopper', 'head-choppers'],
    aliases: ['Near-Misses', 'Beinahe-Kollision'],
  },
  {
    id: 'clearance-envelope',
    name: 'Lichtraumprofil',
    shortDefinition:
      'Der Sicherheitsbereich um ein Fahrgeschäft, der frei von Hindernissen bleiben muss.',
    definition:
      'Das Lichtraumprofil (englisch: Clearance Envelope) ist der berechnete dreidimensionale Raum um ein Fahrzeug, in dem keine Bauteile, Stützen oder Pflanzen stehen dürfen. So können auch die größten Fahrgäste mit ausgestreckten Armen oder Beinen nichts außerhalb des Fahrzeugs berühren. Bei den Tests befestigen Parks oft Rahmen am Zug (Reach Envelopes), um zu prüfen, dass nichts in diesen Bereich hineinragt.',
    relatedTermIds: ['foot-chopper', 'head-choppers', 'near-miss', 'testing'],
    aliases: ['Clearance Envelope', 'Clearance-Envelope'],
  },
  {
    id: 'testing',
    name: 'Testfahrten',
    shortDefinition:
      'Die Runden, die eine Bahn leer dreht: vor der Eröffnung, jeden Morgen und nach jeder Reparatur.',
    definition:
      'Testfahrten sind alles, was zwischen einer fertigen Bahn und einem besetzten Zug liegt. Bei der Inbetriebnahme sitzen Wasserdummies oder Sandsäcke an Stelle der Fahrgäste, das Fahrsystem wird über Tausende Zyklen nachgewiesen, und mit dem Lichtraumprofil wird geprüft, dass entlang der Strecke nichts so nah steht, dass ein ausgestreckter Arm es berühren könnte.\n\nNach der Eröffnung hört das nicht auf. Parks fahren jeden Morgen vor den ersten Gästen leere Runden, und nach jeder Störung oder Wartung noch einmal. Deshalb kann eine Bahn als geöffnet angezeigt werden und trotzdem nicht abfertigen. Neue Bahnen testen vor aller Augen: Wochen vor der Eröffnung fahren die Züge über die Köpfe der Gäste hinweg. Ein Soft Opening ist selbst ein Test, nur mit echten Fahrgästen. In Deutschland muss der TÜV eine Bahn abnehmen, bevor sie jemanden befördern darf.',
    relatedTermIds: ['clearance-envelope', 'soft-opening', 'downtime', 'refurbishment'],
    aliases: ['Test runs', 'Test cycles'],
  },
  {
    id: 'kuka',
    name: 'KUKA',
    shortDefinition:
      'Ein deutscher Industrieroboter-Hersteller, dessen Fabrikarme zu Fahrgeschäften umgebaut wurden.',
    definition:
      'KUKA (die Abkürzung steht für Keller und Knappich Augsburg, wo das Unternehmen bis heute sitzt) baut die orangefarbenen Roboterarme, die an Automontagelinien stehen. Der schwere KR 500 wurde als RoboCoaster für den Fahrgeschäftsbetrieb angepasst: eine Viererbank am Ende des Arms, frei genug zu nicken, zu rollen und Bewegungen zu fahren, die keine feste Schiene hergibt.\n\nDie bekannteste Anlage ist Harry Potter and the Forbidden Journey, 2010 eröffnet, wo RoboCoaster-G2-Bänke auf fahrenden Untersätzen sitzen. Die Arme fahren also durch die Szenen, statt an einer Stelle zu bleiben. Epcots Sum of All Thrills (2009–2016) drehte das Prinzip um: Die Gäste entwarfen an einem Terminal ihr eigenes Streckenprofil, und ein eigens gebauter KUKA-Arm fuhr anschließend genau das nach.',
    relatedTermIds: ['dynamic-attractions', 'dark-ride', 'motion-simulator', 'flying-theater'],
    alternateNames: ['Keller und Knappich Augsburg'],
    aliases: ['Keller und Knappich Augsburg'],
  },
  {
    id: 'foot-chopper',
    name: 'Foot-Chopper',
    shortDefinition:
      'Ein Near-Miss-Effekt, der speziell für Achterbahnen entwickelt wurde, bei denen die Beine der Fahrgäste frei hängen.',
    definition:
      'Ein Foot-Chopper ist ein Near-Miss auf Inverted, Suspended oder Floorless Coastern. Stützen, Wasser oder Kulissen stehen dicht an der Stelle, an der die Füße der Fahrgäste vorbeikommen. Für einen Moment sieht es so aus, als würden die Füße dagegenstoßen.',
    relatedTermIds: [
      'clearance-envelope',
      'head-choppers',
      'inverted-coaster',
      'near-miss',
      'wing-coaster',
    ],
    aliases: ['Foot-Choppers'],
  },
  {
    id: 'projection-mapping',
    name: 'Projection Mapping',
    shortDefinition:
      'Eine Technologie, um Videos auf unebene Oberflächen wie Gebäude oder Kulissen zu projizieren.',
    definition:
      'Beim Projection Mapping (oder Videomapping) werden Videos auf Objekte projiziert, oft auf unregelmäßig geformte wie Schlossmauern oder Dark-Ride-Kulissen. Eine spezielle Software vermisst dafür die 3D-Form des Objekts („Kartierung“), und das Bild wird genau darauf angepasst. So scheinen sich Mauern zu bewegen, zu verwandeln oder in die Tiefe zu öffnen. Eingesetzt wird es häufig in Abendshows (etwa am Schloss) und in modernen Dark Rides, wo es gebaute Kulissen ersetzen kann.',
    relatedTermIds: ['animatronics', 'dark-ride', 'interactive-dark-ride', 'pre-show'],
    aliases: ['Video mapping', 'Videomapping', 'Digitales Mapping'],
  },
  {
    id: 'omnimover',
    name: 'Omnimover',
    shortDefinition:
      'Ein Fahrsystem mit einer kontinuierlichen Kette von Fahrzeugen, die sich mit konstanter Geschwindigkeit bewegen.',
    definition:
      'Der Omnimover ist ein von Disney entwickeltes Fahrsystem, bei dem eine ununterbrochene Kette von Fahrzeugen im Kreis fährt. Weil die Fahrzeuge nie anhalten, ist die Kapazität sehr hoch. Die Fahrzeuge drehen sich und richten die Gäste genau auf die Szene aus, die sie sehen sollen. Beispiele sind The Haunted Mansion und Spaceship Earth. Andere Hersteller haben seitdem ähnliche Systeme mit kontinuierlicher Kette entwickelt.',
    relatedTermIds: ['dark-ride', 'ride-capacity', 'trackless-ride'],
    aliases: ['Omnimovers'],
  },
  {
    id: 'pepper-ghost',
    name: 'Pepper’s Ghost',
    shortDefinition:
      'Eine klassische Illusion, bei der Glas und Licht durchsichtige „Geister“ entstehen lassen.',
    definition:
      'Pepper’s Ghost ist eine Illusion aus dem Theater, mit der durchsichtige „Geister“ entstehen. Eine große Glasscheibe steht schräg zwischen Publikum und Szene. Wird eine Figur in einem verborgenen Raum angeleuchtet, spiegelt sie sich im Glas, und es sieht aus, als stünde sie durchsichtig mitten in der Szene. Das bekannteste große Beispiel für die Technik aus dem 19. Jahrhundert ist die Ballsaalszene in Disneys Haunted Mansion.',
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'projection-mapping'],
    aliases: ['Peppers Ghost', 'Peppers Geist', 'pepper-ghost-effekt', 'peppers-ghost'],
  },
  {
    id: 'dynamic-attractions',
    name: 'Dynamic Attractions',
    shortDefinition:
      'Kanadischer Hersteller aufwendiger Fahrgeschäfte, bekannt für den Dark Ride mit Roboterarm.',
    definition:
      'Dynamic Attractions ist ein kanadisches Unternehmen, das technisch aufwendige Fahrgeschäfte entwickelt und baut. Bekannt ist es vor allem für das Fahrsystem von Harry Potter and the Forbidden Journey, bei dem ein KUKA-Roboterarm auf einer Schiene fährt und die Sitze bewegt. Die Arme selbst sind RoboCoaster der Firma RoboCoaster Ltd. Dynamic Attractions baut außerdem Flying Theater, Dark-Ride-Fahrzeuge und aufwendige Achterbahnsysteme wie den SFX Coaster.',
    relatedTermIds: ['dark-ride', 'flying-theater', 'kuka', 'motion-simulator'],
    aliases: ['Dynamic Structures'],
  },
  {
    id: 'flying-theater',
    name: 'Flying Theater',
    shortDefinition:
      'Ein Simulator, bei dem die Sitze vor eine riesige Kuppelleinwand gehoben werden, sodass man scheinbar über die Landschaft im Film fliegt.',
    definition:
      "Ein Flying Theater verbindet einen Flugsimulator mit einem Kino. Die Fahrgäste sitzen in mehreren Reihen, die zu Beginn der Show vor eine riesige, halbkugelförmige Leinwand (Dome) gehoben werden. Die Beine hängen frei, und die Sitzreihen neigen sich passend zum Film. Beispiele sind das Voletarium (Europa-Park) und Soarin' (Disney Parks).",
    relatedTermIds: ['dark-ride', 'dynamic-attractions', 'motion-simulator', 'pre-show'],
    aliases: ['Flugsimulator-Kino'],
  },
  {
    id: 'shuttle-coaster',
    name: 'Shuttle Coaster',
    shortDefinition:
      'Eine Achterbahn, die keinen geschlossenen Kreislauf bildet und vorwärts sowie rückwärts fährt.',
    definition:
      'Ein Shuttle Coaster fährt seine Strecke und dann dieselbe Strecke rückwärts. Die Schiene schließt sich nicht zum Rundkurs: Der Zug verlässt die Station, fährt am Ende einen Turm, einen Spike oder einen Looping hinauf, bleibt stehen und rollt auf denselben Schienen zurück durch die Station, oft noch einen zweiten Turm am anderen Ende hinauf, bevor er am Bahnsteig hält. Jedes Element fährt man zweimal, einmal mit Blick darauf und einmal, ohne es kommen zu sehen.\n\nAm weitesten verbreitet ist der Boomerang von Vekoma. Ein Lift zieht den Zug rückwärts einen Turm hinauf und lässt ihn los. Er fährt durch eine Cobra Roll und einen Looping den zweiten Turm hinauf und durch alle drei Inversionen wieder zurück. Die ersten vier eröffneten 1984, inzwischen sind es über fünfzig, darunter Speed of Sound in Walibi Holland. Bei Shuttle Coastern mit Launch ersetzt ein Abschuss den Lift, etwa bei Pulsar in Walibi Belgium (2016), einer Wasserachterbahn, die ihr Boot vorwärts und rückwärts einen 45 Meter hohen Spike hinaufschießt.\n\nDie Strecke passt auf ein schmales Grundstück. Weil aber nur ein Zug auf einer Schiene fährt, ist der Durchsatz gering und die Warteschlange bewegt sich langsam.',
    relatedTermIds: ['boomerang', 'launch-coaster', 'spike', 'steel-coaster'],
    aliases: ['Pendel-Achterbahn', 'Impulse Coaster'],
  },
  {
    id: 'carousel',
    name: 'Karussell',
    shortDefinition:
      'Ein klassisches Fahrgeschäft mit einer rotierenden Plattform und oft auf- und absteigenden Figuren.',
    definition:
      'Ein Karussell ist eine runde Plattform, die sich um eine Mittelsäule dreht, mit Sitzen in Form von Pferden, anderen Tieren oder Kutschen. Bei den meisten hängen die Pferde an Stangen, die über Kurbeln im Dach bewegt werden, und heben und senken sich, während die Plattform dreht. Daher kommt der britische Name Gallopers. Dazu spielt eine Orgel oder eine Aufnahme.\n\nDie Drehrichtung ist Landessitte: Britische Gallopers drehen meist im Uhrzeigersinn, nordamerikanische Karussells gegen ihn. Das älteste erhaltene feststehende Karussell steht im Staatspark Hanau-Wilhelmsbad. Es wurde 1780 gebaut und drehte sich 2016 nach einer Restaurierung zum ersten Mal seit über siebzig Jahren wieder.\n\nFast jeder Freizeitpark hat eines, oft nahe dem Eingang. Es gehört zu den wenigen Fahrgeschäften, in die Großeltern und Kleinkinder gemeinsam steigen.',
    relatedTermIds: ['flat-ride', 'themed-land'],
    aliases: ['Pferdekarussell', 'Merry-Go-Round'],
  },
  {
    id: 'walkthrough',
    name: 'Laufgeschäft',
    shortDefinition:
      'Eine Attraktion, die die Besucher zu Fuß erkunden, anstatt in einem Fahrzeug zu sitzen.',
    definition:
      'Ein Walkthrough ist eine Attraktion, bei der sich die Besucher in ihrem eigenen Tempo zu Fuß durch thematisierte Räume bewegen. Das können Abenteuerpfade, Spukhäuser (Mazes) oder interaktive Ausstellungen sein. Anders als bei einem Dark Ride gibt es kein Fahrsystem, die Besucher kommen also näher an alles heran. Beispiele sind die Pagode im Efteling oder saisonale Horror-Mazes.',
    relatedTermIds: ['dark-ride', 'funhouse', 'themed-land'],
    aliases: ['Laufgeschäft'],
  },
  {
    id: 'funhouse',
    name: 'Funhouse',
    shortDefinition:
      'Ein Laufgeschäft mit Hindernissen, optischen Täuschungen und beweglichen Bodenelementen.',
    definition:
      'Ein Funhouse ist ein Laufgeschäft voller Hindernisse zum Durchgehen: Böden, die kippen oder rütteln, eine drehende Tonne, Zerrspiegel, Luftdüsen, wackelige Brücken und Rutschen zwischen den Etagen. Ein Fahrzeug gibt es nicht, jeder geht im eigenen Tempo, und ein Gutteil des Spaßes ist, vor den Nachfolgenden das Gleichgewicht zu verlieren.\n\nDie Form kommt vom Jahrmarkt und aus den Seebädern. Das Fun House im Blackpool Pleasure Beach, ein fünfstöckiger Art-déco-Bau des Architekten Joseph Emberton aus den 1930er-Jahren, stand bis 1991, dann zerstörte es ein Brand. Auf deutschen Kirmessen gehören reisende Laufgeschäfte bis heute dazu, und viele Parks betreiben feste als Familienattraktion.',
    relatedTermIds: ['flat-ride', 'walkthrough'],
    aliases: ['Lachhaus', 'Verrücktes Haus'],
  },
  {
    id: 'ferris-wheel',
    name: 'Riesenrad',
    shortDefinition:
      'Ein großes, vertikal rotierendes Rad mit hängenden Gondeln für eine weite Aussicht.',
    definition:
      'Riesenräder stehen in vielen Freizeitparks und auf Jahrmärkten und sind oft von weitem zu sehen. Ein Riesenrad ist ein großes senkrechtes Rad, an dessen Umfang Gondeln für die Fahrgäste hängen. Es dreht sich langsam, und aus den Gondeln sieht man weit über den Park und die Umgebung. Es gibt kleine Familienräder und riesige Aussichtsräder wie das London Eye.',
    relatedTermIds: ['flat-ride', 'opening-hours'],
    aliases: ['Aussichtsrad'],
  },
  {
    id: 'spike',
    name: 'Spike',
    shortDefinition:
      'Das senkrechte oder steile Ende einer Schiene bei einer Achterbahn ohne geschlossenen Kreislauf.',
    definition:
      'Ein Spike ist ein Schienenstück am Ende eines Shuttle Coasters, das senkrecht oder sehr steil nach oben führt und in der Luft endet. Der Zug fährt hinauf, bis die Schwerkraft ihm das Tempo genommen hat, steht einen Moment still und fällt auf denselben Schienen rückwärts zurück in die übrige Strecke. Manche Spikes sind verdreht, der Zug fährt hinauf eine Schraube und dreht sich auf dem Rückweg zurück, so bei Wicked Twister in Cedar Point (Intamin, 2002).\n\nEin Spike braucht weder Bremse noch Wendekurve, deshalb setzen Shuttle Coaster mit Launch ihn ein: Der Abschuss gibt dem Zug die Energie, der Spike kehrt die Richtung um. Top Thrill 2 in Cedar Point bekam 2024 einen 128 Meter hohen senkrechten Spike für den Rückwärts-Launch. In Europa schießt Pulsar in Walibi Belgium (2016) sein Boot vorwärts und rückwärts einen 45 Meter hohen Spike hinauf, bevor es ins Wasser fällt.',
    relatedTermIds: ['rollback', 'shuttle-coaster', 'steel-coaster'],
    aliases: ['Senkrechtschiene', 'Schienenende'],
  },
  {
    id: 'forced-perspective',
    name: 'Erzwungene Perspektive',
    shortDefinition:
      'Eine optische Täuschung, die Gebäude oder Objekte durch geschickte Größenverhältnisse größer oder weiter entfernt erscheinen lässt.',
    definition:
      'Die erzwungene Perspektive (Forced Perspective) ist eine verbreitete Technik bei der Gestaltung von Freizeitparks. Obere Stockwerke eines Gebäudes oder weiter entfernte Objekte werden bewusst kleiner gebaut, sodass das Auge das Gebäude für deutlich höher oder die Landschaft für viel weitläufiger hält, als sie ist. Disney setzt die Technik auf der Main Street, USA ein, damit die Häuser größer wirken.',
    relatedTermIds: ['themed-land'],
    aliases: ['Optische Täuschung', 'Perspektivtrick'],
  },
  {
    id: 'show-building',
    name: 'Show-Gebäude',
    shortDefinition:
      'Die oft schlichte Halle, in der sich die eigentliche Technik und die Szenen eines Dark Rides befinden.',
    definition:
      'Ein Show-Gebäude (oder Show Building) ist die Halle, in der eine Indoor-Attraktion steht. Der Eingangsbereich ist oft aufwendig gestaltet, das Show-Gebäude selbst meist eine große, fensterlose Halle, die von außen hinter Pflanzen oder künstlichen Felsen verschwindet. Darin stehen das Fahrsystem, die Kulissen, die Beleuchtung und die gesamte Effekttechnik eines Dark Rides.',
    relatedTermIds: ['dark-ride', 'forced-perspective', 'themed-land'],
    aliases: ['Attraktionshalle', 'Halle'],
  },
  {
    id: 'practical-effects',
    name: 'Physische Effekte',
    shortDefinition:
      'Spezialeffekte, die tatsächlich im Raum passieren, im Gegensatz zu digitalen Projektionen.',
    definition:
      'Physische Effekte (Practical Effects) sind Effekte, die im Raum gebaut sind und dort laufen, wo die Fahrgäste vorbeikommen: Animatronics, Wasser, Feuer, Nebel, Wind, herabfallende Gegenstände, bewegte Kulissen und Lichttricks. Medienbasierte Effekte zeigen das Geschehen dagegen auf einer Leinwand oder als Projektion. Einen physischen Effekt sieht man räumlich und in echter Größe, von wo auch immer das Fahrzeug gerade steht, ein Bildschirm kann das nur aus einem Blickwinkel nachahmen.\n\nManche der ältesten Tricks sind bis heute im Einsatz. Die tanzenden Geister im Ballsaal der Haunted Mansion (Disneyland, 1969) sind ein Pepper’s Ghost, eine Bühnenillusion aus dem 19. Jahrhundert: Figuren unterhalb der Sichtlinie spiegeln sich in einer großen Glasscheibe. Die Droomvlucht im Efteling (1993) fährt an Dutzenden animierten Feen, Trollen und Tieren in modellierten Landschaften vorbei.\n\nEin defekter physischer Effekt fällt sofort auf, als stehende Figur oder trockener Brunnen, und Parks nehmen Attraktionen dafür außer Betrieb.',
    relatedTermIds: ['animatronics', 'dark-ride', 'projection-mapping'],
    aliases: ['Praktische Effekte', 'Spezialeffekte'],
  },
  {
    id: 'chicken-exit',
    name: 'Chicken Exit',
    shortDefinition:
      'Ein Ausgang direkt vor dem Einstieg für Besucher, die sich im letzten Moment gegen die Fahrt entscheiden.',
    definition:
      'Der Chicken Exit (wörtlich „Feiglings-Ausgang“) ist ein Durchgang am Ende der Warteschlange eines Fahrgeschäfts. Dort können Besucher die Warteschlange verlassen, ohne einsteigen zu müssen. Gedacht ist er vor allem bei Thrill-Attraktionen für alle, die beim Anstehen Angst bekommen haben, und für Eltern, die ihre Kinder durch die Warteschlange begleitet haben, aber selbst nicht mitfahren wollen.',
    relatedTermIds: ['queue-line', 'rider-switch', 'single-rider', 'wait-time'],
    aliases: ['Angsthase-Ausgang', 'Letzter Ausgang'],
  },
  {
    id: 'in-show-exit',
    name: 'In-Show Exit',
    shortDefinition:
      'Das Verlassen eines Fahrzeugs innerhalb des Showbereichs einer Attraktion, meist bei einer Evakuierung.',
    definition:
      'Bei einem In-Show Exit (Evakuierung) bleibt eine Attraktion stehen, und die Fahrgäste müssen ihr Fahrzeug mitten in der Anlage verlassen statt am Ausstieg. Auslöser ist meist eine Störung oder eine Sicherheitsabschaltung. Die Steuerung hält alle Fahrzeuge an, eine Ansage bittet, sitzen zu bleiben, und das Arbeitslicht geht an.\n\nDann führt das Personal die Fahrgäste über Wartungsstege und Servicegänge zu einem Notausgang, oft hinter oder über den Szenen entlang. Bei vollem Licht sieht man, wie ein Dark Ride gebaut ist: Figuren stehen mitten in der Bewegung still, und hinter den bemalten Kulissen liegen Kabel und Lautsprecher offen. Bei einer Achterbahn ist das Gegenstück der Abstieg über die Treppe neben dem Lifthill.\n\nEine evakuierte Attraktion bleibt geschlossen, bis das Personal sie geprüft und leere Testfahrten gemacht hat, und so lange meldet der Park sie als gestört.',
    relatedTermIds: ['dark-ride', 'downtime', 'e-stop'],
    aliases: ['Szenenausstieg', 'Evakuierung'],
  },
  {
    id: 'e-stop',
    name: 'Notstopp',
    shortDefinition:
      'Das sofortige Anhalten aller beweglichen Teile einer Attraktion aus Sicherheitsgründen.',
    definition:
      'Der E-Stop (Emergency Stop) ist die sofortige Notabschaltung einer Attraktion. Das Personal löst ihn von Hand aus, oder Sicherheitssensoren lösen ihn automatisch aus, wenn sie etwas Ungewöhnliches erkennen (z. B. einen blockierten Fahrweg oder einen offenen Bügel). Nach einem E-Stop halten alle Fahrzeuge sofort an der nächsten sicheren Stelle (an einer Bremse). Bevor die Anlage wieder anlaufen darf, sind meist aufwendige Prüfungen nötig.',
    relatedTermIds: ['block-brake', 'downtime', 'in-show-exit'],
    aliases: ['Not-Aus', 'Notabschaltung', 'Emergency Stop'],
  },
  {
    id: 'mackprodukt',
    name: 'Mackprodukt',
    shortDefinition:
      'Szene-Spott für die reflexhafte, unkritische Lobhudelei, mit der eingefleischte Mack-Rides-Fans jede Neuheit des Herstellers feiern.',
    definition:
      '„Mackprodukt“ ist ein Insider-Witz der deutschsprachigen Achterbahnszene über die Markentreue von Mack-Rides-Fans. Mack ist ein deutscher Hersteller, und dieselbe Familie betreibt den Europa-Park. Wer den Begriff benutzt, unterstellt, dass jede neue Mack-Bahn schon vor der ersten Fahrt zum Meisterwerk erklärt wird.\n\nDer Witz lebt von ein paar Standardsätzen, die angeblich jede Analyse ersetzen: dass die Schiene so schön gebogen sei („die Schiene ist so toll gebogen“), und die „wunderschönen Fahrfiguren“. Beides lobt, wie die Bahn aussieht, und sagt nichts darüber, wie sie sich fährt. Wer etwas „Mackprodukt“ nennt oder die Sätze zitiert, macht sich über Markentreue lustig, die an die Stelle eines Urteils tritt.',
    relatedTermIds: ['credit', 'fanboy', 'gp', 'hype-train', 'mack-rides'],
    aliases: ['Mack-Produkt', 'Mackprodukte'],
  },
  {
    id: 'onride-offride',
    name: 'On-Ride / Off-Ride',
    shortDefinition:
      'Szene-Kurzform für Aufnahmen, die an Bord einer Bahn entstehen (On-Ride), gegenüber solchen, die vom Boden aus gefilmt werden (Off-Ride).',
    definition:
      'On-Ride und Off-Ride sind die zwei Arten, eine Achterbahn zu filmen. Ein On-Ride-Video entsteht auf dem Sitz, darauf sind Tempo, Airtime und die Kräfte der Fahrt zu sehen. Ein Off-Ride-Video wird vom Streckenrand aus gefilmt und zeigt Layout, Gestaltung und die Züge in Bewegung. Das Begriffspaar fällt ständig, wenn es um POVs und Fahrvideos geht. Weil viele Parks das Filmen mit dem Handy an Bord verbieten, sind offiziell genehmigte On-Ride-Aufnahmen besonders gefragt.',
    relatedTermIds: ['pov', 'ride-photo', 'credit'],
    aliases: ['On-Ride', 'Off-Ride', 'Onride', 'Offride'],
  },
  {
    id: 're-ride',
    name: 'Re-Ride',
    shortDefinition:
      'Für eine weitere Runde sitzen bleiben oder gleich wieder einsteigen, ohne noch einmal anzustehen.',
    definition:
      'Beim Re-Ride darf ein Gast für eine weitere Runde sitzen bleiben oder in der Station gleich wieder einsteigen, ohne noch einmal durch die ganze Warteschlange zu gehen. Re-Rides sind spät am Tag, in ruhigen Phasen oder bei Fan-Events üblich, wenn wenig los ist und das Personal die Fahrgäste einfach sitzen lässt. Wo das großzügig gehandhabt wird, fahren Coaster-Fans Runde um Runde, um Reihen zu vergleichen oder eine Lieblingsbahn noch einmal zu fahren.',
    relatedTermIds: ['credit', 'ert', 'rope-drop'],
    aliases: ['Re-Rides', 'Reride'],
  },
  {
    id: 'hype-train',
    name: 'Hype-Train',
    shortDefinition:
      'Die Vorfreude, die sich unter Fans um eine angekündigte Bahn aufbaut und die Erwartungen manchmal höher treibt, als die Bahn sie erfüllen kann.',
    definition:
      'Der „Hype-Train“ ist die Welle an Vorfreude, die in Foren und sozialen Medien entsteht, sobald eine neue Attraktion angedeutet oder angekündigt wird. Genährt wird er von Baufortschritten, geleakten Layouts und frühen POV-Videos, und die Erwartungen steigen oft lange vor der Eröffnung sehr hoch. Fans sagen im Scherz, sie „fahren im Hype-Train mit“, und spotten über die Enttäuschung, wenn die fertige Bahn nicht mithält. Der Begriff fällt oft zusammen mit Markentreue und Memes wie dem Mackprodukt.',
    relatedTermIds: ['gp', 'mackprodukt', 'fanboy'],
    aliases: ['Hype', 'Hypetrain'],
  },
  {
    id: 'fanboy',
    name: 'Fanboy',
    shortDefinition:
      'Ein Fan, dessen Hingabe an einen bestimmten Park, Hersteller oder eine Bahn sein Urteil reflexhaft positiv und unkritisch färbt.',
    definition:
      'Unter Coaster-Fans ist ein „Fanboy“ (der Begriff wird für alle Geschlechter verwendet) jemand, der einem bestimmten Park oder Hersteller so verbunden ist, dass er dessen Produkte fast reflexartig verteidigt und lobt. Das Etikett wird meist halb im Scherz vergeben. Gemeint ist, dass Markentreue das Urteil über eine Bahn verdrängt. Das Mackprodukt-Meme der deutschsprachigen Szene ist ein Witz genau darüber.',
    relatedTermIds: ['mackprodukt', 'hype-train', 'gp'],
    aliases: ['Fanboys', 'Fangirl'],
  },
  {
    id: 'smoothness',
    name: 'Laufruhe',
    shortDefinition:
      'Wie frei eine Achterbahn von Stößen, Rütteln und Vibrationen fährt. Das Gegenteil ist eine raue, ratternde Fahrt.',
    definition:
      'Die Laufruhe (englisch „Smoothness“) beschreibt, wie sauber die Züge einer Achterbahn durch das Layout fahren, ohne Kopfschlagen, Rütteln oder Vibrationen. Sie hängt davon ab, wie genau die Schiene gefertigt ist, wie Zug und Räder gebaut sind und wie alt und gut gewartet die Bahn ist. Bahnen von B&M und Mack fahren meist sehr ruhig. Fährt eine Bahn auch nach vielen Jahren noch ruhig, spricht das für ihre Konstruktion.',
    relatedTermIds: ['rattle', 'b-and-m', 'g-force'],
    aliases: ['Smoothness', 'glasglatt'],
  },
  {
    id: 'rattle',
    name: 'Rattern',
    shortDefinition:
      'Vibrationen und Erschütterungen, die über den Zug an die Fahrgäste gehen und eine sonst gute Fahrt rau machen.',
    definition:
      'Das Rattern (englisch „Rattle“) ist das Brummen, Zittern oder Rütteln, das entsteht, wenn die Räder einer Achterbahn nicht mehr sauber an den Schienen laufen. Oft sind die Schienen verschlissen, die Räder abgenutzt oder die Bahn einfach alt. Rattern kann ein gutes Layout unbequem machen und betrifft besonders oft ältere Stahlbahnen von Arrow und Vekoma. Das Gegenteil ist Laufruhe.',
    relatedTermIds: ['smoothness', 'wooden-coaster', 'arrow-dynamics'],
    aliases: ['Rattle', 'Geruckel', 'Geratter'],
  },
  {
    id: 'restraint-freedom',
    name: 'Bügelfreiheit',
    shortDefinition:
      'Wie viel Spielraum ein Fahrgast unter dem Schoß- oder Schulterbügel hat. Davon hängt ab, wie stark er Airtime spürt.',
    definition:
      'Die Bügelfreiheit beschreibt, wie viel Platz zwischen Fahrgast und Bügel bleibt, wenn dieser verriegelt ist. Sitzt ein Schoßbügel locker, heben die Fahrgäste bei Airtime aus dem Sitz, und Floater wie Ejector Airtime sind deutlich zu spüren. Ein enger oder fest heruntergedrückter Bügel hält sie im Sitz, und von der Airtime bleibt wenig. Locker sitzende Schoßbügel haben etwa viele Bahnen von Intamin und Mack. Drückt das Personal die Bügel zu fest an, heißt das Stapling.',
    relatedTermIds: ['lap-bar', 'shoulder-harness', 'airtime', 'stapling'],
    aliases: ['Restraint Freedom', 'Bügel-Freiheit'],
  },
  {
    id: 'single-rail-coaster',
    name: 'Single-Rail-Coaster',
    shortDefinition:
      'Ein neuerer Achterbahntyp, der auf einer einzigen schmalen Mittelschiene fährt. Die Fahrgäste sitzen einzeln hintereinander.',
    definition:
      'Ein Single-Rail-Coaster fährt auf einer einzigen schmalen Kastenschiene statt auf zwei parallelen Schienen. Die Fahrgäste sitzen einzeln hintereinander, rittlings über der Schiene. Mit der dünnen Schiene lassen sich sehr enge, verwundene Layouts bauen, und um die Fahrgäste herum ist fast nichts. Die moderne Form begründete Rocky Mountain Construction mit dem Modell „Raptor“ (etwa RailBlazer in Kaliforniens Great America). Vekoma und Intamin haben seitdem eigene Single-Rail-Konstruktionen entwickelt.',
    relatedTermIds: ['rmc', 'vekoma', 'steel-coaster'],
    aliases: ['Single Rail', 'Single-Rail', 'Raptor Track'],
  },
  {
    id: 'stand-up-coaster',
    name: 'Stand-up-Coaster',
    shortDefinition:
      'Eine Achterbahn, bei der die Fahrgäste im Stehen statt im Sitzen gesichert werden.',
    definition:
      'Auf einem Stand-up-Coaster fahren die Fahrgäste stehend, gehalten von einem Sitz wie ein Fahrradsattel und einem Schulterbügel. In den späten 1980ern und 1990ern waren sie verbreitet, gebaut vor allem von TOGO und B&M. Im Stehen wirken die Kräfte anders auf den Körper, in Loopings und Kurven tragen die Beine ungewohnt viel. Seitdem wurden kaum neue Stand-ups gebaut, mehrere wurden umgebaut (aus B&Ms Mantis wurde die Floorless-Bahn Rougarou), und die verbliebenen sind unter Credit-Sammlern gefragt.',
    relatedTermIds: ['b-and-m', 'floorless-coaster', 'steel-coaster'],
    aliases: ['Stand-up-Coaster', 'Stehachterbahn', 'Standup Coaster'],
  },
  {
    id: 'bobsled-coaster',
    name: 'Bobbahn',
    shortDefinition:
      'Eine Achterbahn, deren Wagen frei durch eine offene, gekrümmte Rinne fahren, statt fest an eine Schiene gebunden zu sein.',
    definition:
      'Bei einer Bobbahn (englisch „Bobsled Coaster“) fahren die Wagen durch eine gekrümmte, halbrunde Rinne statt auf einer Schiene und suchen sich ihre Linie durch die geneigten Kurven selbst, wie ein Bob im Eiskanal. Die Fahrt schwingt hin und her, hat viele Seitenkräfte und keine Inversionen, und wie sie sich anfühlt, hängt von Tempo und Form der Rinne ab. Schwarzkopf baute frühe Versionen. Der bekannteste Hersteller moderner Stahl-Bobbahnen ist Mack Rides, mehrere davon fahren in deutschen Parks und im Alpenraum.',
    relatedTermIds: ['mack-rides', 'wild-mouse', 'steel-coaster'],
    aliases: ['Bobsled Coaster', 'Bobbahnen', 'Bob Coaster'],
  },
  {
    id: 'powered-coaster',
    name: 'Powered Coaster',
    shortDefinition:
      'Eine Achterbahn-ähnliche Bahn, die durchgängig von einem Motor an Bord oder in der Schiene angetrieben wird, statt auf die Schwerkraft zu setzen.',
    definition:
      'Ein Powered Coaster sieht aus wie eine Achterbahn, wird aber über den gesamten Rundkurs von Elektromotoren angetrieben, statt einmal hochgezogen und der Schwerkraft überlassen zu werden. Weil er sein Tempo hält und mehrere Runden fahren kann, ist er meist eine ruhige Familienbahn, oft als Minenzug, Drache oder Tier gestaltet, mit hoher Kapazität. Ob ein Powered Coaster als Credit „zählt“, darüber streiten Coaster-Fans seit Langem, meist halb im Scherz.',
    relatedTermIds: ['alpine-coaster', 'credit', 'mack-rides', 'mine-train'],
    aliases: ['Powered Coasters', 'angetriebene Achterbahn'],
  },
  {
    id: 'water-coaster',
    name: 'Wasserachterbahn',
    shortDefinition:
      'Eine Mischung aus Achterbahn und Wasserfahrt, die Achterbahn-Schiene und Lifte mit einem oder mehreren Splashdowns verbindet.',
    definition:
      'Eine Wasserachterbahn (Water Coaster) verbindet Achterbahntechnik (Ketten- oder angetriebene Lifte, Abfahrten, geneigte Schiene) mit der Wasserlandung einer Wasserfahrt. Boote oder achterbahnähnliche Wagen werden Lifthills hinaufgezogen, fahren durch Täler und bremsen am Ende scharf in einer Wasserrinne ab, wobei eine Welle hochschlägt. Die meisten modernen Wasserachterbahnen baut Mack Rides, etwa Poseidon im Europa-Park. An heißen Tagen sind sie besonders gefragt.',
    relatedTermIds: ['mack-rides', 'log-flume', 'splashdown'],
    aliases: ['Water Coaster', 'Wasser-Coaster', 'Wasserachterbahnen'],
  },
  {
    id: 'alpine-coaster',
    name: 'Alpine Coaster',
    shortDefinition:
      'Eine schienengeführte Bergabfahrt, meist an einem Hang, bei der die Fahrgäste ihr Tempo selbst über einen Bremshebel steuern.',
    definition:
      'Ein Alpine Coaster (auch Mountain Coaster) ist eine Bahn mit Schlitten oder kleinen Wagen, die fest auf einer Schiene laufen und dem Gelände eines Hangs folgen. Das Tempo bestimmen die Fahrgäste selbst mit einer Handbremse. Anders als bei einer klassischen Achterbahn gibt es keinen Zug und meist keinen angetriebenen Start, bergab fährt man allein mit der Schwerkraft, und ein Seil zieht die Wagen wieder nach oben. In den Alpen fahren sie das ganze Jahr, inzwischen stehen sie weltweit. Ein naher Verwandter ist die ältere Sommerrodelbahn, die in einer Rinne fährt.',
    relatedTermIds: ['terrain-coaster', 'powered-coaster'],
    aliases: ['Mountain Coaster', 'Sommerrodelbahn', 'Alpine Coasters'],
  },
  {
    id: 'beyond-vertical-drop',
    name: 'Beyond-Vertical Drop',
    shortDefinition:
      'Eine Abfahrt steiler als 90 Grad, sodass die Schiene die Fahrgäste über die Senkrechte hinaus kippt und sie kurz nach hinten blicken lässt.',
    definition:
      'Ein Beyond-Vertical Drop (überhängende Abfahrt) ist steiler als 90 Grad. Die Schiene krümmt sich unter sich selbst zurück, und die Fahrgäste werden kurz über die Senkrechte hinaus gekippt, sodass sie leicht rückwärts zur Konstruktion zeigen. Sie fallen dabei nahezu frei. Bekannt gemacht hat das Format Gerstlauers Euro-Fighter mit Abfahrten bis 121°, B&M und andere haben Dive Coaster mit ähnlich überhängenden ersten Abfahrten gebaut. Mumbo Jumbo und Takabisha (121°, 2011) hielten den Rekord für die steilste derartige Abfahrt, seit 2019 hält ihn TMNT Shellraiser in American Dream mit 121,5°.',
    relatedTermIds: ['dive-coaster', 'euro-fighter', 'first-drop', 'gerstlauer'],
    aliases: ['Beyond Vertical Drop', 'überüberhängende Abfahrt'],
  },
  {
    id: 'splashdown',
    name: 'Splashdown',
    shortDefinition:
      'Das Ende einer Abfahrt auf einer Wasserbahn oder Wasserachterbahn, bei dem das Boot in eine Wasserrinne eintaucht, abbremst und eine Welle aufwirft.',
    definition:
      'Ein Splashdown ist der Moment, in dem ein Boot oder Wagen am Fuß einer Abfahrt in eine Wasserrinne fährt. Das Wasser bremst das Fahrzeug auf wenigen Metern ab und wirft die Energie als Gischtwand hoch, die auf die Fahrgäste niedergeht, auf das nächste Boot und oft auf Zuschauer, die auf einer eigens dafür gebauten Brücke stehen.\n\nWie nass eine Fahrt wird, legen Tiefe und Form der Rinne, die Form des Bootsbugs und das Tempo unten fest. Bei Wildwasserbahnen trifft es meist die vorderen Plätze. Atlantica SuperSplash im Europa-Park (Mack Rides, 2005) fährt am Ende einer steilen Abfahrt in den See, Pulsar in Walibi Belgium fällt aus 45 Metern in ein Becken, das zugleich die Bremse ist.\n\nAn heißen Tagen sind die Warteschlangen an den Wasserbahnen länger.',
    relatedTermIds: ['water-coaster', 'log-flume', 'mack-rides'],
    aliases: ['Splash-down', 'Wasser-Splashdown'],
  },
  {
    id: 'quad-down',
    name: 'Quad-Down',
    shortDefinition:
      'Eine Folge von vier aufeinanderfolgenden abwärts führenden Hügeln, die gegen Ende eines Layouts wiederholte, schnell aufeinanderfolgende Airtime liefern.',
    definition:
      'Ein Quad-Down (kleiner: Triple-Down und Double-Down) ist eine Abfahrt aus vier Stufen kurz hintereinander. Der Zug fällt, flacht kurz ab und fällt wieder, und jede Stufe hebt die Fahrgäste kurz und hart aus dem Sitz. Holz- und Hybrid-Coaster haben das Element oft, weil es auf wenig Raum viele Airtime-Stöße schnell hintereinander bringt. Die Idee ist dieselbe wie bei Camelback und Bunnyhop, nur folgen die Hügel dichter aufeinander.',
    relatedTermIds: ['airtime', 'camelback', 'wooden-coaster'],
    aliases: ['Quad Down', 'Triple-Down', 'Double-Down'],
  },
  {
    id: 's-hill',
    name: 'S-Hill',
    shortDefinition:
      'Ein S-förmiger Airtime-Hügel, auf dem die Fahrgäste abheben und zugleich zur Seite gedrückt werden.',
    definition:
      'Ein S-Hill ist ein Airtime-Hügel mit S-förmigem Verlauf. Während die Fahrgäste über der Kuppe abheben, drückt es sie erst zur einen, dann zur anderen Seite. Zur Airtime kommt also ein seitlicher Ruck, mit dem man nicht rechnet. S-Hills sind typisch für moderne Holz- und Hybrid-Coaster, die sich wild und „außer Kontrolle“ fahren sollen. Eng verwandt ist der Wave Turn, der die Airtime ganz zur Seite legt.',
    relatedTermIds: ['airtime', 'airtime-hill', 'wave-turn', 'bunnyhop'],
    aliases: ['S Hill', 'S-Hügel', 'Speed Bump'],
  },
  {
    id: 'celestial-spin',
    name: 'Celestial Spin',
    shortDefinition:
      'Eine Inversion von Mack Rides auf zwei Schienen: Zwei Züge fahren im Rennen über eine gemeinsame Kuppe, und ihre Schienen drehen sich umeinander. Der eine rollt nach oben, der andere nach unten.',
    definition:
      'Ein Celestial Spin ist eine von Mack Rides patentierte Inversion auf zwei Schienen, gebaut für [Stardust Racers](/de/parks/north-america/united-states/orlando/universal-epic-universe/stardust-racers), die Duell-Launch-Achterbahn im [Universal Epic Universe](/de/parks/north-america/united-states/orlando/universal-epic-universe). Während die beiden Züge über eine gemeinsame Kuppe fahren, winden sich ihre Schienen umeinander. Der eine Zug rollt in einem Zero-G Roll nach oben, der andere im selben Moment in einem Barrel Roll nach unten, und die Wagen scheinen sich in der Luft umeinander zu drehen.\n\nBeide Rollen sind auf den Scheitel der Kuppe abgestimmt, die Fahrgäste sind lange schwerelos, während der andere Zug wenige Meter entfernt vorbeidreht. Das Element ist mit dem Zero-G Roll und dem Airtime-Hügel verwandt und wirkt nur wie gedacht, wenn beide Züge es gleichzeitig erreichen.',
    relatedTermIds: ['zero-g-roll', 'airtime-hill', 'inversion', 'hangtime'],
    aliases: ['Celestial Roll', 'Celestial Rolls', 'Celestial Spins'],
    alternateNames: ['Celestial Roll'],
  },
  {
    id: 'launch',
    name: 'Abschuss',
    shortDefinition:
      'Ein Antriebsabschnitt, der den Zug in Sekunden auf Geschwindigkeit bringt, statt ihn einen Lifthill hinaufzuziehen.',
    definition:
      'Ein Launch ist der Streckenabschnitt, in dem eine Achterbahn ihre Energie von einem Motor bekommt statt von der Schwerkraft. Es gibt vier gängige Techniken. Beim LSM-Launch (Linearsynchronmotor) sitzen Elektromagnete entlang der Strecke und ziehen an einer Finne unter dem Zug. Er beschleunigt gleichmäßig, lässt sich genau steuern und auch mitten im Layout wiederholen, deshalb setzt heute fast jede neue Launch-Bahn darauf. LIM-Launches (Linearinduktionsmotor) funktionieren ähnlich, verlieren aber mehr Energie als Wärme. Hydraulische Launches arbeiten mit einer Winde, die aus Speichern unter Stickstoffdruck angetrieben wird, und beschleunigen stärker als jede andere gebaute Technik. Druckluft-Launches wie bei Maxx Force sind auf den ersten Metern noch schneller.\n\nEin Launch unterscheidet sich vom Lifthill auch darin, wo er die Energie einbringen kann. Ein Lifthill muss der höchste Punkt der Bahn sein, alles danach geht bergab. Ein Launch kann überall sitzen. Deshalb bleiben Multi-Launch-Layouts wie [Taron](/de/parks/europe/germany/bruehl/phantasialand/taron) im [Phantasialand](/de/parks/europe/germany/bruehl/phantasialand) oder [Voltron Nevera](/de/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) im [Europa-Park](/de/parks/europe/germany/rust/europa-park) über ihre gesamte Länge schnell, statt Höhe einmalig gegen Tempo zu tauschen. Schafft es ein Launch nicht durchs Layout, kommt es zum Rollback.',
    relatedTermIds: ['launch-coaster', 'lifthill', 'swing-launch', 'rollback', 'top-hat'],
    aliases: ['Launch', 'Launches', 'Katapultstart', 'LSM-Launch', 'LIM-Launch'],
    alternateNames: ['Launch', 'Katapultstart'],
  },
  {
    id: 'swing-launch',
    name: 'Schaukel-Abschuss',
    shortDefinition:
      'Ein Launch, der den Zug mehrfach vor und zurück schleudert und bei jedem Durchgang Tempo aufbaut, bis es fürs Layout reicht.',
    definition:
      'Ein Swing Launch (auch Shuttle- oder Multi-Pass-Launch) beschleunigt den Zug, lässt ihn auf einem ansteigenden Streckenstück auslaufen, fängt ihn auf dem Rückweg wieder ein und wiederholt das zwei- bis dreimal, bis genug Energie für den kompletten Kurs da ist. Jeder Durchgang bringt Tempo, das die Motoren in einem Anlauf nicht schaffen würden. So erreicht ein Swing Launch auf einer deutlich kürzeren Launch-Strecke eine deutlich höhere Endgeschwindigkeit.\n\nDie Fahrgäste fahren dabei rückwärts durch einen Teil des Layouts, meist einen senkrechten Spike hinauf, bevor es wieder vorwärts geht. [Toutatis](/de/parks/europe/france/plailly/parc-asterix/toutatis) im Parc Astérix, [The Ride to Happiness](/de/parks/europe/belgium/de-panne/plopsaland-belgium/the-ride-to-happiness-by-tomorrowland) in Plopsaland nutzen ihn. Premier Rides baut mit dem Modell Sky Rocket II eine ganze kompakte Achterbahn um diese Idee.',
    relatedTermIds: ['launch', 'spike', 'shuttle-coaster', 'launch-coaster'],
    aliases: ['Swing Launch', 'Shuttle-Launch', 'Multi-Pass-Launch'],
    alternateNames: ['Swing Launch', 'Shuttle-Launch'],
  },
  {
    id: 'vertical-lift',
    name: 'Vertikallift',
    shortDefinition:
      'Ein Lifthill mit 90 Grad Steigung. Der Zug wird senkrecht an der Konstruktion hinaufgezogen.',
    definition:
      'Ein Vertikallift ersetzt die üblichen 30 bis 45 Grad Kettenanstieg durch einen Abschnitt, der im rechten Winkel zum Boden aufsteigt. Weil eine normale Kette samt Rücklaufsperre einen Zug an einer senkrechten Wand nicht zuverlässig hält, arbeiten diese Lifts mit Seil, Catch-Car oder einer Kette mit formschlüssigem Mitnehmer. Die Fahrgäste liegen während des Anstiegs auf dem Rücken und schauen direkt in den Himmel.\n\nTypisch ist der Vertikallift für Gerstlauers Euro-Fighter und Infinity Coaster, bei denen er direkt in eine überhängende Abfahrt übergeht. [Takabisha](/de/parks/asia/japan/fujikawaguchiko/fuji-q-highland/takabisha-steepest-roller-coaster) im Fuji-Q Highland steigt senkrecht auf und fällt dann mit 121 Grad ab. Am steilsten fällt TMNT Shellraiser in American Dream (2019) mit 121,5 Grad. Der [Schwur des Kärnan](/de/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) im Hansa-Park nutzt einen 73 Meter hohen Vertikallift in einem geschlossenen Turm, sodass man im Dunkeln hinauffährt. Etwas anderes ist ein Aufzuglift, bei dem sich das Gleisstück mitsamt Zug hebt.',
    relatedTermIds: ['lifthill', 'beyond-vertical-drop', 'euro-fighter', 'anti-rollback'],
    aliases: ['Vertical Lift', 'Vertikallifte', 'Senkrechtlift'],
    alternateNames: ['Vertical Lift', '90°-Lifthill'],
  },
  {
    id: 'drop-track',
    name: 'Absenkschiene',
    shortDefinition:
      'Ein Gleisstück, das mit dem stehenden Zug darauf nach unten wegfällt. Für die Fahrgäste sackt der Boden weg.',
    definition:
      'Eine Drop Track ist ein kurzes, bewegliches Gleisstück auf einer hydraulischen oder elektrischen Plattform. Der Zug fährt darauf und hält, dann fällt das ganze Stück samt Schienen und Zug nach unten, meist einige Meter, rastet in der neuen Position ein, und die Fahrt geht weiter. Anders als bei einer normalen Abfahrt fällt man im Stand und waagerecht, es fühlt sich an, als gäbe der Boden nach.\n\nDrop Tracks gehören fast immer zur Geschichte einer Attraktion. Der Effekt wirkt nur, wenn man ihn nicht kommen sieht, deshalb stecken sie in Showgebäuden und Tunneln. [Hagrid’s Magical Creatures Motorbike Adventure](/de/parks/north-america/united-states/orlando/universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure) lässt die Fahrgäste mitten im Layout ins Dunkel fallen, [Verbolten](/de/parks/north-america/united-states/williamsburg/busch-gardens-williamsburg/verbolten) in Busch Gardens Williamsburg aus dem Schwarzwald heraus, und Harry Potter and the Escape from Gringotts setzt eine in der Tresorsequenz ein.',
    relatedTermIds: ['switch-track', 'dark-ride', 'first-drop', 'indoor-coaster'],
    aliases: ['Drop Track', 'Drop Tracks', 'Fallschiene'],
    alternateNames: ['Drop Track'],
  },
  {
    id: 'scorpion-tail',
    name: 'Skorpionschwanz',
    shortDefinition:
      'Ein Launch-Spike von Mack Rides und Premier Rides: Die Strecke krümmt sich über die Senkrechte hinaus in einen Überhang, und der Zug klettert rückwärts eine Wand hinauf, die steiler als 90 Grad ist.',
    definition:
      'Der Scorpion Tail ist ein Launch-Spike, der über die Senkrechte hinausgeht. Die Strecke krümmt sich durch die Senkrechte hindurch bis auf rund 105 Grad, ein Überhang. Ein hineingeschossener Zug klettert kopfüber und leicht rückwärts hinauf, hängt am Scheitel und fällt denselben Weg zurück.\n\nPremier Rides baute 2022 einen für Ice Breaker in SeaWorld Orlando. Mack Rides baute 2024 einen eigenen für [Voltron Nevera](/de/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) im [Europa-Park](/de/parks/europe/germany/rust/europa-park), wo er der steilste Launch-Abschnitt aller Achterbahnen weltweit ist. Die Hangtime entsteht hier ganz ohne Vorwärtsfahrt. Oben halten einen nur die Form der Strecke und der Restschwung des Zuges kopfüber. Der Name kommt von der Form, einem Skorpionschwanz, der sich nach oben und über sich selbst krümmt.',
    relatedTermIds: ['spike', 'swing-launch', 'launch', 'hangtime', 'mack-rides'],
    aliases: ['Scorpion Tail', 'Scorpion Tails'],
    alternateNames: ['Scorpion Tail'],
  },
  {
    id: 'step-up-under-flip',
    name: 'Step-Up Under-Flip',
    shortDefinition:
      'Eine RMC-Inversion: Der Zug steigt einen stark überhöhten Hügel hinauf, rollt oben herum und fällt auf der anderen Seite kopfüber heraus.',
    definition:
      'Der Step-Up Under-Flip ist eine zweistufige Inversion von Rocky Mountain Construction. Der Zug „steigt“ zuerst über einen ansteigenden, stark geneigten Abschnitt auf und dreht sich dann auf dem Weg nach unten unter sich selbst hindurch. Die Rolle liegt also in der absteigenden Hälfte statt am Scheitel. Die Drehung ist länger und langsamer als bei einem Barrel Roll, und beim Herausfallen gibt es einen harten Stoß Ejector Airtime.\n\nDas Element gehört zu den typischen Figuren einer RMC-Hybridbahn und steht auf [Steel Vengeance](/de/parks/north-america/united-states/sandusky/cedar-point/steel-vengeance) in Cedar Point, [Zadra](/de/parks/europe/poland/zator/energylandia/zadra-rc) in der Energylandia und [Untamed](/de/parks/europe/netherlands/biddinghuizen/walibi-holland/untamed) in Walibi Holland, dem ersten RMC-Umbau in Europa. Weil das Manöver präzise verwundenes Stahlgleis auf einer Holz- oder Stahlkonstruktion braucht, ist es auf klassischem Holzgleis praktisch unmöglich.',
    relatedTermIds: [
      'rmc',
      'hybrid-coaster',
      'inversion',
      'ejector-airtime',
      'twisted-horseshoe-roll',
    ],
    aliases: ['Step Up Under Flip', 'Step-Up-Under-Flip'],
  },
  {
    id: 'twisted-horseshoe-roll',
    name: 'Twisted Horseshoe Roll',
    shortDefinition:
      'Ein RMC-Element: eine 180-Grad-Hufeisenkurve mit je einer Rolle in beiden Schenkeln, zweimal kopfüber bei voller Richtungsumkehr.',
    definition:
      'Ein Twisted Horseshoe Roll ist ein Horseshoe (eine enge 180-Grad-Wende, die den Zug zurückschickt) mit einer Inversion in beiden Schenkeln. Der Zug rollt beim Hineinfahren herum, durchfährt das Hufeisen und rollt beim Herausfahren erneut. Zwei Inversionen und ein kompletter Richtungswechsel passieren in einem einzigen, ungewöhnlich lang gezogenen Manöver.\n\nRocky Mountain Construction führte es auf Outlaw Run in Silver Dollar City ein, der ersten Holzachterbahn mit einem doppelten Barrel Roll, und hat es seitdem in [Steel Vengeance](/de/parks/north-america/united-states/sandusky/cedar-point/steel-vengeance), [Zadra](/de/parks/europe/poland/zator/energylandia/zadra-rc), [Iron Gwazi](/de/parks/north-america/united-states/tampa/busch-gardens-tampa/iron-gwazi) und [Untamed](/de/parks/europe/netherlands/biddinghuizen/walibi-holland/untamed) verbaut. Man verbringt den Großteil des Elements seitlich oder kopfüber bei sehr geringen G-Kräften, daher die lange Hangtime.',
    relatedTermIds: ['horseshoe', 'rmc', 'inversion', 'hangtime', 'step-up-under-flip'],
    aliases: ['Twisted Horseshoe Rolls', 'Doppelter Barrel Roll'],
  },
  {
    id: 'double-down',
    name: 'Double Down',
    shortDefinition:
      'Ein Drop, der auf halber Höhe kurz abflacht und dadurch zwei getrennte Airtime-Schläge statt einem liefert.',
    definition:
      'Ein Double Down ist eine zweistufige Abfahrt: Die Strecke fällt, flacht kurz ab oder steigt sogar minimal an, und fällt dann erneut. Jeder Übergang hebt die Fahrgäste aus den Sitzen, sodass ein einzelner Hügel zwei deutliche Airtime-Stöße erzeugt statt eines langen Schwebens. Das Spiegelbild-Element, ein Double Up, macht dasselbe auf dem Weg einen Hügel hinauf.\n\nDas Element ist eines der ältesten im Holzachterbahnbau. [Jack Rabbit](/de/parks/north-america/united-states/west-mifflin/kennywood/jack-rabbit) in Kennywood hebt die Fahrgäste seit 1920 mit seinem Double Dip aus den Sitzen. Auch moderne Holz- und Hybridbahnen beenden Abfahrten so, etwa [Colossos](/de/parks/europe/germany/soltau/heide-park/colossos-kampf-der-giganten) im Heide-Park, [Balder](/de/parks/europe/sweden/gothenburg/liseberg/balder) in Liseberg und [Troy](/de/parks/europe/netherlands/sevenum/attractiepark-toverland/troy) in Toverland. Treibt man die Idee weiter, entsteht ein Quad-Down: vier Stufen in einer Abfahrt.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'quad-down', 'camelback', 'wooden-coaster'],
    aliases: ['Double Downs', 'Double Dip'],
    alternateNames: ['Double Dip'],
  },
  {
    id: 'switch-track',
    name: 'Weiche',
    shortDefinition:
      'Ein bewegliches Gleisstück, das den Zug auf eine andere Strecke lenkt, etwa für Rückwärtspassagen, verzweigte Layouts und Abstellgleise.',
    definition:
      'Eine Switch Track ist das Achterbahn-Pendant zur Eisenbahnweiche: ein Gleisstück, das sich verschiebt, schwenkt oder dreht und dabei den Hauptkurs mit einem zweiten Weg verbindet. Mechanisch ist das einfach. Eine Weiche kann einen Zug rückwärts durch einen bereits gefahrenen Abschnitt schicken, aus derselben Station zwei verschiedene Routen anbieten oder Züge zum Feierabend schlicht in die Wartungshalle ausschleusen.\n\nIn der Show dient sie meist der Überraschung. Bei [Expedition Everest](/de/parks/north-america/united-states/orlando/disneys-animal-kingdom-theme-park/expedition-everest-legend-of-the-forbidden-mountain) endet das Gleis vor dem Zug zerstört, und eine Weiche schickt ihn rückwärts den Berg hinunter. [Big Grizzly Mountain](/de/parks/asia/hong-kong/hong-kong/hong-kong-disneyland-park/big-grizzly-mountain-runaway-mine-cars) im Hongkong Disneyland nutzt gleich zwei. Bobbejaanlands [Fury](/de/parks/europe/belgium/kasterlee/bobbejaanland/fury) bietet damit aus einem Layout eine Vorwärts- und eine Rückwärtsfahrt.',
    relatedTermIds: ['drop-track', 'turntable', 'block-brake', 'dark-ride'],
    aliases: ['Switch Track', 'Switch Tracks', 'Gleisweiche'],
    alternateNames: ['Switch Track'],
  },
  {
    id: 'turntable',
    name: 'Drehscheibe',
    shortDefinition:
      'Eine drehbare Plattform im Streckenverlauf, die den Zug auf der Stelle wendet, meist um ihn rückwärts wieder loszuschicken.',
    definition:
      'Eine Drehscheibe ist ein Gleisstück auf einer rotierenden Scheibe. Der Zug fährt auf, die Scheibe dreht sich (meist um 180 Grad), und der Zug fährt in die andere Richtung weiter. Weil die Drehung im Stand passiert, ist es ein bewusst ruhiger Moment. Die Bahn wechselt die Richtung ohne Shuttle-Spike oder Weiche, und in der Pause kann die Show den Fahrgästen etwas zeigen.\n\nBei [Voltron Nevera](/de/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) im Europa-Park bereitet die Drehscheibe einen Rückwärts-Launch vor, in vielen Dark Rides dreht sie die Fahrgäste im richtigen Moment zur Szene. Trackless Rides erreichen denselben Effekt ohne Sonderhardware, weil ihre Fahrzeuge sich jederzeit frei drehen können.',
    relatedTermIds: ['switch-track', 'swing-launch', 'trackless-ride', 'dark-ride'],
    aliases: ['Turntable', 'Drehscheiben'],
    alternateNames: ['Turntable'],
  },
  {
    id: 'treble-clef',
    name: 'Notenschlüssel',
    shortDefinition:
      'Ein nicht-invertierendes Element in Form des Violinschlüssels: Die Strecke schlingt sich über sich selbst und fädelt durch die eigene Kurve zurück.',
    definition:
      'Ein Treble Clef ist eine übereinandergelegte Kurve, die sich selbst kreuzt. Der Zug steigt in eine Schleife, kreuzt sein eigenes Gleis und verlässt die Figur durch ihre Mitte, ungefähr in der Form eines Violinschlüssels. Der Zug bleibt dabei durchgehend aufrecht, gehalten von starker Querneigung, eine Inversion ist es also nicht. Man schwenkt lange herum, mit Gleis sehr dicht über und unter sich.\n\nMaurer Rides baute das Element für [Hollywood Rip Ride Rockit](/de/parks/north-america/united-states/orlando/universal-studios-florida/hollywood-rip-ride-rockit) in den Universal Studios Florida, deren Layout musikalisch thematisiert ist und seine Figuren entsprechend benennt. Der Violinschlüssel folgt auf den nicht-invertierenden „Double Take“-Looping. Er blieb ein Einzelstück.',
    relatedTermIds: ['non-inverting-loop', 'maurer-rides', 'overbank', 'inversion'],
    aliases: ['Treble Clef', 'Violinschlüssel'],
    alternateNames: ['Treble Clef'],
  },
  {
    id: 'indoor-coaster',
    name: 'Indoor-Achterbahn',
    shortDefinition:
      'Eine Achterbahn komplett im Gebäude, bei der Licht, Sound und Kulisse die Aussicht ersetzen.',
    definition:
      'Eine Indoor-Achterbahn fährt ihren gesamten Kurs in einem geschlossenen Showgebäude. Im Dunkeln sieht man keine Abfahrt und keine Kurve kommen, deshalb wirkt ein mäßiges Layout deutlich heftiger als dasselbe Gleis unter freiem Himmel. Außerdem lassen sich Licht, Projektion, Ton und Kulisse vollständig steuern, deshalb sind Mischformen aus Achterbahn und Dark Ride meist Indoor-Achterbahnen.\n\nDas Vorbild ist Space Mountain. Die erste eröffnete 1975 im Magic Kingdom, [Disneyland](/de/parks/north-america/united-states/anaheim/disneyland-park/space-mountain) folgte 1977, und keine andere Indoor-Achterbahn wurde so oft nachgebaut. In Europa stehen etwa [Eurosat](/de/parks/europe/germany/rust/europa-park/eurosat-cancan-coaster) im Europa-Park, Eftelings [Vogel Rok](/de/parks/europe/netherlands/kaatsheuvel/efteling/vogel-rok) und Phantasialands [Crazy Bats](/de/parks/europe/germany/bruehl/phantasialand/crazy-bats).',
    relatedTermIds: ['dark-ride', 'show-building', 'projection-mapping', 'vr-coaster'],
    aliases: ['Indoor-Achterbahnen', 'Indoor Coaster', 'Hallenachterbahn'],
    alternateNames: ['Indoor Coaster'],
  },
  {
    id: 'family-coaster',
    name: 'Familienachterbahn',
    shortDefinition:
      'Eine Achterbahn, die Kinder und Erwachsene gemeinsam fahren können, mit mäßigen Kräften, niedriger Mindestgröße und ohne Inversionen.',
    definition:
      'Eine Familienachterbahn ist so gebaut, dass Kinder und Erwachsene sie gemeinsam fahren können. Die Mindestgröße liegt typischerweise bei 100 bis 110 Zentimetern (darunter oft in Begleitung), die Geschwindigkeit bleibt unter etwa 60 km/h, und das Layout hat keine Inversionen und keine lang anhaltenden hohen G-Kräfte. Eine gute Familienachterbahn hat trotzdem Airtime und ein sauber abgestimmtes Layout, nur mit kleineren Kräften.\n\nFür einen Park rechnen sie sich besonders, weil eine ganze Gruppe zusammen fahren kann und die Warteschlange nie leer wird. Die häufigsten Modelle sind Vekomas Family Boomerang, Macks Youngstar und Zierers Tivoli. Beispiele sind [Pegasus](/de/parks/europe/germany/rust/europa-park/pegasus) im Europa-Park, [Raik](/de/parks/europe/germany/bruehl/phantasialand/raik) im Phantasialand und [Slinky Dog Dash](/de/parks/north-america/united-states/orlando/disneys-hollywood-studios/slinky-dog-dash) in Disney’s Hollywood Studios.',
    relatedTermIds: ['height-requirement', 'mine-train', 'wild-mouse', 'launch-coaster'],
    aliases: ['Familienachterbahnen', 'Family Coaster', 'Juniorachterbahn'],
    alternateNames: ['Family Coaster', 'Juniorachterbahn'],
  },
  {
    id: 'motorbike-coaster',
    name: 'Motorrad-Achterbahn',
    shortDefinition:
      'Eine Achterbahn, auf der man wie auf einem Motorrad sitzt, hintereinander und nach vorn über Lenkergriffe gelehnt.',
    definition:
      'Auf einer Motorrad-Achterbahn sitzt man rittlings auf dem Fahrzeug statt darin, greift Lenker und lehnt sich nach vorn, die Füße auf Rasten. Der Schwerpunkt liegt tief und direkt über den Schienen, in geneigten Kurven legt man sich hinein wie auf einem Motorrad. Die Züge werden dadurch lang und schmal, und die Kapazität pro Fahrzeug ist niedrig.\n\nDie erste baute Vekoma 2004 mit Booster Bike in [Toverland](/de/parks/europe/netherlands/sevenum/attractiepark-toverland/booster-bike). Am weitesten trieb Intamin die Idee mit [Hagrid’s Magical Creatures Motorbike Adventure](/de/parks/north-america/united-states/orlando/universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure), das zusätzlich einen Beiwagen hat, damit auch Gäste mitfahren können, die nicht rittlings sitzen können. Disneys [TRON Lightcycle / Run](/de/parks/north-america/united-states/orlando/magic-kingdom-park/tron-lightcycle-run) nutzt dieselbe Haltung mit geschlossener Haube über jedem Fahrgast.',
    relatedTermIds: ['launch-coaster', 'vekoma', 'intamin', 'suspended-coaster'],
    aliases: ['Motorrad-Achterbahnen', 'Motorbike Coaster'],
    alternateNames: ['Motorbike Coaster'],
  },
  {
    id: 'infinity-coaster',
    name: 'Infinity Coaster',
    shortDefinition:
      'Gerstlauers Nachfolger des Euro-Fighters: dieselben steilen Drops und der kompakte Flächenbedarf, aber offene Züge in Stadionbestuhlung.',
    definition:
      'Der Infinity Coaster ist Gerstlauers aktuelle Plattform für Individualanlagen. Er behält, was den Euro-Fighter erfolgreich machte (überhängende Abfahrten, Vertikallifts und Layouts auf kleinster Fläche), hat aber statt der kantigen Vierer-Wagen längere, tiefer liegende Züge mit offenen Seiten und Bügeln statt Schulterbügeln. Er fährt spürbar ruhiger und kann mehr Airtime-Hügel haben, mit denen das ältere Modell schlecht zurechtkam.\n\nEs gibt kleine, kompakte Anlagen und Rekordhalter. [The Smiler](/de/parks/europe/united-kingdom/farley/alton-towers/the-smiler) in Alton Towers hält mit vierzehn Inversionen den Weltrekord, und der [Schwur des Kärnan](/de/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) im Hansa-Park kombiniert einen 73-Meter-Vertikallift mit einem Abschnitt, in dem der Zug rückwärts frei fällt.',
    relatedTermIds: ['gerstlauer', 'euro-fighter', 'beyond-vertical-drop', 'vertical-lift'],
    aliases: ['Infinity Coasters'],
  },
  {
    id: 'interactive-dark-ride',
    name: 'Interaktive Dunkelfahrt',
    shortDefinition:
      'Eine Dunkelfahrt, bei der man schießt, zielt oder mitspielt, und die Bahn zählt die Punkte.',
    definition:
      'Bei einer interaktiven Dunkelfahrt haben die Fahrgäste ein Gerät in der Hand, meist einen Infrarot-Blaster, manchmal einen Touchscreen, oder sie benutzen einfach die Hände. Die Show ist darauf aufgebaut, was sie damit tun. Ziele in jeder Szene zählen die Treffer, am Ende steht für jeden Fahrgast ein Punktestand. Weil man seinen Punktestand verbessern will, fahren viele diese Attraktionen öfter als jede andere im Park, und die Parks bauen deshalb immer wieder neue.\n\nEs gibt zwei Arten. Bei der einen zielt man auf gebaute, bewegte Kulissen, etwa bei [Maus au Chocolat](/de/parks/europe/germany/bruehl/phantasialand/maus-au-chocolat) im Phantasialand und [Men in Black: Alien Attack](/de/parks/north-america/united-states/orlando/universal-studios-florida/men-in-black-alien-attack) in den Universal Studios Florida. Bei der anderen zielt man auf projizierte Ziele, damit sind weit aufwendigere Effekte möglich, etwa bei [Toy Story Mania](/de/parks/north-america/united-states/orlando/disneys-hollywood-studios/toy-story-mania) und [WEB SLINGERS](/de/parks/north-america/united-states/anaheim/disney-california-adventure-park/web-slingers-a-spider-man-adventure), das die Handbewegungen ganz ohne Blaster erfasst.',
    relatedTermIds: ['dark-ride', 'animatronics', 'projection-mapping', 'trackless-ride'],
    aliases: ['Interaktive Dunkelfahrten', 'Interactive Dark Ride', 'Schießbahn'],
    alternateNames: ['Interactive Dark Ride', 'Shooting Dark Ride'],
  },
  {
    id: 'madhouse',
    name: 'Madhouse',
    shortDefinition:
      'Eine Attraktion, bei der sich der Raum um eine sanft schwingende Bank dreht und man überzeugt ist, kopfüber zu hängen.',
    definition:
      'Ein Madhouse beruht auf einem einzigen Trick. Die Sitzbank schwingt nur um wenige Grad, während sich der ganze Raum um sie herum einmal um 360 Grad dreht. Weil Wände, Decke und Requisiten sich alle mitbewegen, fehlt ein fester Bezugspunkt, und das Gehirn hält die Bewegung für einen Überschlag der Bank. Man ist sicher, kopfüber gehangen zu haben, dabei ist die Bank nur ein wenig hin und her geschwungen.\n\nVekoma machte das Format zum Standard, nachdem 1996 [Villa Volta](/de/parks/europe/netherlands/kaatsheuvel/efteling/villa-volta) für das Efteling entstanden war. Sie ist bis heute das bekannteste Beispiel, und das System heißt deshalb oft schlicht „Vekoma Madhouse“. Phantasialands [Feng Ju Palace](/de/parks/europe/germany/bruehl/phantasialand/feng-ju-palace), der [Fluch der Kassandra](/de/parks/europe/germany/rust/europa-park/cassandras-curse) im Europa-Park und Toverlands [Villa Fiasko](/de/parks/europe/netherlands/sevenum/attractiepark-toverland/villa-fiasko) fahren dasselbe System hinter anderen Geschichten.',
    relatedTermIds: ['dark-ride', 'vekoma', 'pre-show', 'animatronics'],
    aliases: ['Madhouses', 'Vekoma Madhouse', 'Geisterschaukel'],
    alternateNames: ['Geisterschaukel'],
  },
  {
    id: 'boat-ride',
    name: 'Bootsfahrt',
    shortDefinition:
      'Eine Dunkelfahrt, bei der man im Boot durch einen Wasserkanal fährt statt auf einer Schiene.',
    definition:
      'Eine Bootsfahrt trägt die Gäste in einer Wasserrinne durch die Show, geführt von einer Unterwasserschiene oder von den Kanalwänden selbst. Gegenüber einer Schiene hat das Wasser zwei Vorteile. Die Kapazität ist hoch, weil lange Boote schnell beladen werden und dicht aufeinander folgen, und es ist leise, weil unter den Gästen kein Antrieb sitzt, der die Show übertönt. Viele der größten und ältesten Dunkelfahrten der Welt sind deshalb Bootsfahrten.\n\nDazu gehören die meisten Klassiker: [Pirates of the Caribbean](/de/parks/north-america/united-states/anaheim/disneyland-park/pirates-of-the-caribbean), [„it’s a small world“](/de/parks/north-america/united-states/anaheim/disneyland-park/its-a-small-world-holiday), Eftelings [Fata Morgana](/de/parks/europe/netherlands/kaatsheuvel/efteling/fata-morgana) und [Piraten in Batavia](/de/parks/europe/germany/rust/europa-park/pirates-in-batavia) im Europa-Park. Bei Pirates of the Caribbean im Shanghai Disneyland fahren die Boote mit einem schienenlosen Magnetantrieb und können sich drehen und seitwärts bewegen.',
    relatedTermIds: ['dark-ride', 'animatronics', 'trackless-ride', 'log-flume', 'water-ride'],
    aliases: ['Bootsfahrten', 'Boat Ride', 'Wasser-Dunkelfahrt'],
    alternateNames: ['Boat Ride'],
  },
  {
    id: 'shoot-the-chute',
    name: 'Shoot-the-Chute',
    shortDefinition:
      'Eine Großboot-Wasserbahn mit einem einzigen großen Drop in eine Wanne, die eine Wasserwand über die Splash-Brücke wirft.',
    definition:
      'Eine Shoot-the-Chute zieht ein breites, flachbodiges Boot mit zwanzig oder mehr Personen einen einzigen Lift hinauf und lässt es über eine steile Rutsche in eine flache Wanne fallen. Beim Aufprall verdrängt das Boot große Wassermengen, und der Schwall trifft eine Zuschauerbrücke ebenso wie die Fahrgäste. Anders als eine Wildwasserbahn, die mehrere kleine Drops über eine lange, mäandernde Strecke verteilt, ist eine Shoot-the-Chute um einen Drop und einen Splash herum gebaut.\n\nOft ist eine Shoot-the-Chute die Hauptattraktion eines ganzen Themenbereichs. [Jurassic Park River Adventure](/de/parks/north-america/united-states/orlando/universal-islands-of-adventure/jurassic-park-river-adventure) in Islands of Adventure fährt vor dem 26-Meter-Drop durch eine komplette Dunkelfahrt, [Atlantica SuperSplash](/de/parks/europe/germany/rust/europa-park/atlantica-supersplash) im Europa-Park verbindet sie mit einem Wasserachterbahn-Layout.',
    relatedTermIds: ['log-flume', 'water-ride', 'splashdown', 'water-coaster'],
    aliases: ['Shoot the Chutes', 'Großbootbahn'],
    alternateNames: ['Großbootbahn'],
  },
  {
    id: 'people-mover',
    name: 'People Mover',
    shortDefinition:
      'Eine durchgehend fahrende Transportattraktion, die Gäste langsam durch oder über ein Themengebiet trägt.',
    definition:
      'Ein People Mover ist eine langsame Transportattraktion mit hoher Kapazität: eine ununterbrochene Kette von Fahrzeugen im Schritttempo, oft auf einem Hochbahnträger, mit beweglichem Bahnsteig, sodass sie nie anhalten muss. Im Park bringt er Gäste von einem Bereich in den anderen und ist zugleich eine ruhige Rundfahrt, auf der man das Gebiet und oft auch das Innere anderer Attraktionen sieht.\n\nDer Tomorrowland Transit Authority PeopleMover im [Magic Kingdom](/de/parks/north-america/united-states/orlando/magic-kingdom-park/tomorrowland-transit-authority-peoplemover) ist der bekannteste, der noch fährt, und führt auf seiner Runde durch das Showgebäude von Space Mountain. Der dort eingesetzte Linearinduktionsantrieb wurde später für echte Nahverkehrssysteme lizenziert. Universals Villain-Con Minion Blast überträgt dieselbe Idee auf einen Fahrsteig.',
    relatedTermIds: ['dark-ride', 'omnimover', 'observation-tower', 'walkthrough'],
    aliases: ['People Movers', 'Peoplemover'],
    alternateNames: ['Transitsystem'],
  },
  {
    id: 'bumper-cars',
    name: 'Autoscooter',
    shortDefinition:
      'Ein Flat Ride, bei dem Gäste kleine Elektroautos über einen Metallboden steuern und absichtlich zusammenstoßen.',
    definition:
      'Autoscooter fahren auf einem Stahlboden mit leitfähigem Deckengitter: Ein Stab an jedem Wagen nimmt oben Strom ab und leitet ihn über den Boden zurück, sodass die Fahrzeuge ohne Akku und ohne Schiene frei gefahren werden können. Schwere Gummiwülste fangen die Zusammenstöße ab, um die es bei der ganzen Fahrt geht. Neuere Anlagen nehmen den Strom immer öfter über den Boden ab oder fahren mit Akku. Ein Deckengitter braucht es dann nicht mehr, und die Decke kann gestaltet werden.\n\nAutoscooter gehören zu den ältesten Fahrgeschäften, die bis heute gebaut werden, der Lusse Auto-Skooter stammt aus den 1920er-Jahren. Es ist eines der wenigen, bei denen die Fahrgäste selbst bestimmen, was passiert. Fast jeder große Park hat einen, etwa Phantasialands [Bumper Klumpen](/de/parks/europe/germany/bruehl/phantasialand/bumper-klumpen) oder das Lada Autodrom im Europa-Park.',
    relatedTermIds: ['flat-ride', 'funhouse', 'carousel'],
    aliases: ['Autoscooter', 'Bumper Cars', 'Skooter', 'Boxauto'],
    alternateNames: ['Bumper Cars', 'Skooter'],
  },
  {
    id: 'observation-tower',
    name: 'Aussichtsturm',
    shortDefinition:
      'Ein Turmfahrgeschäft, an dem eine drehende Kabine langsam nach oben fährt, für die Aussicht und ohne Fall.',
    definition:
      'Beim Aussichtsturm fährt eine verglaste oder offene Gondel an einer Mittelsäule nach oben, meist drehend, damit man von jedem Platz das ganze Panorama sieht, hält oben und senkt sich wieder. Technisch ist er ein naher Verwandter des Freifallturms, und die beiden werden oft verwechselt. Ein Aussichtsturm ist zum Hinausschauen gebaut, ein Freifallturm zum Herunterfallen.\n\nFür den Park ist er vor allem ein Orientierungspunkt, der von weitem zu sehen ist, und erst danach ein Fahrgeschäft. Im Europa-Park ist das seit 1983 der [Euro-Tower](/de/parks/europe/germany/rust/europa-park/euro-tower).',
    relatedTermIds: ['drop-tower', 'ferris-wheel', 'flat-ride', 'people-mover'],
    aliases: ['Aussichtstürme', 'Observation Tower', 'Gyro Tower'],
    alternateNames: ['Gyro Tower'],
  },
  {
    id: 'wdi',
    name: 'Walt Disney Imagineering',
    shortDefinition:
      'Disneys hauseigene Design- und Ingenieurabteilung, die jede Disney-Attraktion erfindet, entwirft und baut.',
    definition:
      'Walt Disney Imagineering (WDI) ist die Abteilung, die Disneys Parks entwirft und baut, vom Gesamtplan eines Themenbereichs bis zur Mechanik einer einzelnen Figur. Sie wurde 1952 als WED Enterprises gegründet, um Disneyland zu bauen. Anders als sonst in der Branche sitzen dort Showdesign, Architektur, Fahrgeschäftstechnik und Software unter einem Dach: Wer die Geschichte schreibt, arbeitet in derselben Organisation wie die Leute, die das Fahrzeug dafür bauen.\n\nVon WDI stammt vieles, was andere Parks heute selbstverständlich nutzen: Audio-Animatronics, der Omnimover (ein durchgehend fahrender Wagen, der sich zu jeder Szene hindreht), das schienenlose Fahrsystem, das zuerst bei [Pooh’s Hunny Hunt](/de/parks/asia/japan/tokyo/tokyo-disneyland/poohs-hunny-hunt) fuhr, und das Stahlrohrgleis, das Arrow 1959 für die [Matterhorn Bobsleds](/de/parks/north-america/united-states/anaheim/disneyland-park/matterhorn-bobsleds) baute und auf das jede spätere Stahlachterbahn zurückgeht. Auch wenn eine Disney-Attraktion von einem anderen Hersteller stammt, hat WDI die Show darum herum in aller Regel selbst entworfen.',
    relatedTermIds: ['omnimover', 'trackless-ride', 'animatronics', 'dark-ride', 'arrow-dynamics'],
    aliases: ['WDI', 'Imagineering', 'Imagineers', 'WED Enterprises'],
    alternateNames: ['WDI', 'Imagineering'],
  },
  {
    id: 'parade',
    name: 'Parade',
    shortDefinition:
      'Ein Umzug mit Festwagen, Tänzern und kostümierten Figuren, der zu festen Zeiten auf einer festen Route durch den Park zieht.',
    definition:
      'Bei einer Parade ziehen Festwagen, Tänzerinnen, Tänzer und kostümierte Figuren auf einer festen Route durch den Park, meist ein- oder zweimal am Tag zu den Zeiten im Parkplan. Kurz vor Beginn sperren Mitarbeiter die Strecke ab. Wer vorne am Rand stehen will, wartet dort lange vorher. Wo die Route einen Hauptweg kreuzt, bleibt der Übergang zu, solange die Wagen vorbeiziehen.\n\nDie Main Street Electrical Parade mit Wagen voller kleiner Lämpchen fuhr 1972 zum ersten Mal in Disneyland und später auch in Walt Disney World und im Disneyland Paris. Dort läuft seit 2017 Disney Stars on Parade. Auch der Europa-Park zeigt an vielen Tagen der Saison eine Parade.\n\nEine Parade am Tag zieht für etwa eine halbe Stunde viele Besucher in einen Teil des Parks. Die Warteschlangen an Attraktionen abseits der Route sind in dieser Zeit oft kürzer.',
    relatedTermIds: [
      'live-show',
      'character-meet-and-greet',
      'park-mascot',
      'nighttime-spectacular',
    ],
    aliases: ['Paraden', 'Parkparade', 'Lichterparade'],
  },
  {
    id: 'nighttime-spectacular',
    name: 'Nachtshow',
    shortDefinition:
      'Eine große Show nach Einbruch der Dunkelheit über einem See, einem Schloss oder einer Fassade, mit Feuerwerk, Projektionen oder Fontänen.',
    definition:
      'Eine Nachtshow ist eine große Show nach Einbruch der Dunkelheit, meist der letzte Programmpunkt des Tages. Sie arbeitet mit Feuerwerk, Projektionen auf Gebäude oder auf Wände aus Wassernebel, Fontänen, Lasern und Flammen zu eingespielter Musik. Zugeschaut wird von einem festen Zuschauerbereich aus oder von überall vor dem Schloss oder dem See. Im Englischen heißt das Format Nighttime Spectacular.\n\nFantasmic! eröffnete 1992 in Disneyland, mit Darstellern auf einer Insel im Rivers of America. World of Color im Disney California Adventure (2010) ist eine Fontänenshow, bei der Bilder auf Wasserwände projiziert werden. Das Efteling folgte 2012 mit Aquanura, entwickelt mit WET Design, mit rund 200 Fontänen.\n\nViele Besucher gehen direkt nach dem letzten Effekt. Ausgänge und Parkplätze sind deshalb in den Minuten danach am vollsten.',
    relatedTermIds: ['live-show', 'parade', 'projection-mapping', 'hard-ticket-event'],
    aliases: [
      'Nachtshows',
      'Feuerwerk',
      'Feuerwerksshow',
      'Wassershow',
      'Fontänenshow',
      'Nighttime Spectacular',
    ],
    alternateNames: ['Nighttime Spectacular'],
  },
  {
    id: '4d-cinema',
    name: '4D-Kino',
    shortDefinition:
      'Ein Kino mit 3D-Film, in dem Sitze und Saal passende Effekte wie Wasserspritzer, Luftstöße und Sitzbewegungen beisteuern.',
    definition:
      'Ein 4D-Kino zeigt einen 3D-Film und ergänzt ihn um Effekte im Saal, die zum Bild passen: Wasser aus der Lehne des Vordersitzes, Luftstöße an den Knöcheln, Gerüche, Seifenblasen, Vibrationen und kurze Stöße im Sitz. Die vierte Dimension ist ein Werbename für diese Effekte. Der Film läuft mit einem Timecode, der jeden Effekt in jeder Vorstellung an derselben Stelle auslöst.\n\nHoney, I Shrunk the Audience eröffnete 1994 im Epcot und nutzte schon die meisten dieser Tricks. Shrek 4-D folgte 2003 in den Universal Studios Florida. Im Europa-Park laufen die Filme im Magic Cinema 4D.\n\nBei einer Simulator-Attraktion bewegt sich die ganze Kabine oder Plattform passend zum Film. Im 4D-Kino bleiben die Sitze in ihren Reihen und rucken höchstens ein paar Zentimeter. Ein voller Saal wird auf einmal eingelassen, die Warteschlange leert sich deshalb schubweise mit jeder Vorstellung.',
    relatedTermIds: ['motion-simulator', 'flying-theater', 'pre-show', 'practical-effects'],
    aliases: ['4D-Kinos', '4-D-Kino', '4D Kino', '4D-Film', '4D-Filme', '4D Cinema'],
  },
  {
    id: 'slc',
    name: 'Suspended Looping Coaster (SLC)',
    shortDefinition:
      'Hängeachterbahn-Modell von Vekoma mit festgelegter Strecke, seit 1994 über 40-mal gebaut.',
    definition:
      'Der Suspended Looping Coaster ist ein Inverted-Coaster-Modell des niederländischen Herstellers Vekoma. Der Zug hängt unter der Schiene, die Füße der Fahrgäste baumeln frei, und die Strecke ist in jedem Park dieselbe, nur unterschiedlich lang. Der erste, El Condor, eröffnete 1994 in Walibi Flevo, dem heutigen Walibi Holland. Gebaut wurden über 40.\n\nDie Standardversion ist 689 Meter lang. Ein Kettenlift zieht den Zug 33 Meter hoch, nach der Abfahrt folgen ein Roll-over, ein Sidewinder, eine Helix und ein doppelter Inline Twist, zusammen fünf Inversionen. Limit im Heide Park (1999), seit 2023 Toxic Garden, ist eine davon.\n\nDie ursprünglichen Züge haben zwei Sitze pro Reihe und harte Schulterbügel, an die der Kopf in den Übergängen schlägt. Vekoma bietet inzwischen Züge mit weicheren Westenbügeln an, und mehrere Parks haben umgerüstet.',
    relatedTermIds: [
      'vekoma',
      'inverted-coaster',
      'suspended-coaster',
      'shoulder-harness',
      'inversion',
    ],
    aliases: [
      'SLC',
      'SLCs',
      'Suspended Looping Coaster',
      'Suspended Looping Coasters',
      'Vekoma SLC',
    ],
    alternateNames: ['Vekoma SLC'],
  },
  {
    id: 'water-park',
    name: 'Wasserpark',
    shortDefinition:
      'Ein Park mit Wasserrutschen, Wellenbecken und Strömungskanal, den man in Badekleidung besucht.',
    definition:
      'Ein Wasserpark besteht aus Wasserrutschen, Wellenbecken, Strömungskanälen und Planschbereichen für Kinder, und die Besucher sind den ganzen Tag in Badekleidung unterwegs. Wasserparks unter freiem Himmel öffnen in den warmen Monaten, überdachte und beheizte das ganze Jahr. Viele liegen neben einem Freizeitpark und verkaufen eigene Tickets.\n\nDisney eröffnete 1989 Typhoon Lagoon in Walt Disney World. Der Europa-Park eröffnete am 28. November 2019 Rulantica, eine Wasserwelt in einer Halle mit 32.600 Quadratmetern, mit 25 Attraktionen zum Start und einem eigenen Ticket, getrennt vom Freizeitpark.\n\nAn einer Rutsche funktioniert das Anstehen anders als an einem Fahrgeschäft. Man trägt Reifen oder Matte selbst den Turm hinauf, und die Rutsche lässt den Nächsten erst los, wenn eine Ampel oder ein Bademeister den Vorherigen freigibt. Pro Stunde rutschen deshalb weit weniger Gäste als in einer Achterbahn mit ganzem Zug fahren.',
    relatedTermIds: ['water-ride', 'log-flume', 'seasonal-attraction', 'ride-capacity'],
    aliases: ['Wasserparks', 'Wasserwelt', 'Erlebnisbad', 'Spaßbad', 'Water Park'],
    alternateNames: ['Erlebnisbad'],
  },
  {
    id: 'sky-ride',
    name: 'Seilbahn',
    shortDefinition:
      'Ein Sessellift oder eine Gondelbahn, die Besucher an einem Seil über den Park trägt, oft von einem Themenbereich zum anderen.',
    definition:
      'Bei einer Seilbahn im Park hängen Sessel oder kleine Kabinen an einem umlaufenden Stahlseil, das über Stützen oberhalb der Wege läuft. Meist verbindet sie zwei Stationen in verschiedenen Teilen des Parks, in eine oder in beide Richtungen, und der Blick von oben gehört zur Fahrt dazu.\n\nDer Skyway in Disneyland, gebaut von der Schweizer Firma Von Roll, eröffnete 1956 zwischen Fantasyland und Tomorrowland und fuhr mitten durch das Matterhorn. 1994 wurde er stillgelegt, nachdem Spannungsrisse an seinen Stützen im Berg gefunden worden waren. In Walt Disney World fährt seit 2019 der Skyliner, eine Gondelbahn zwischen Hotels, Epcot und Disney’s Hollywood Studios.\n\nBei starkem Wind und Gewitter steht eine Seilbahn früher still als die meisten anderen Attraktionen.',
    relatedTermIds: ['monorail', 'park-railway', 'people-mover', 'observation-tower'],
    aliases: ['Seilbahnen', 'Sesselbahn', 'Sessellift', 'Gondelbahn', 'Kabinenbahn', 'Sky Ride'],
    alternateNames: ['Sessellift', 'Gondelbahn'],
  },
  {
    id: 'park-railway',
    name: 'Parkeisenbahn',
    shortDefinition:
      'Ein Zug, der auf Schienen um den Park oder zwischen seinen Themenbereichen fährt, meist als gemächliche Rundfahrt mit Bahnhöfen.',
    definition:
      'Eine Parkeisenbahn fährt auf schmalspurigen Gleisen am Rand des Parks entlang oder zwischen seinen Themenbereichen, mit einem oder mehreren Bahnhöfen. Manche Züge zieht eine Dampflok, andere eine Diesel- oder Elektrolok, die wie eine Dampflok aussieht.\n\nDie Disneyland Railroad umrundet Disneyland seit der Eröffnung 1955. Der Stoomtrein im Efteling fährt seit März 1969 und umrundet heute den ganzen Park mit zwei Bahnhöfen. Die Panoramabahn im Europa-Park gehörte 1975 zu den ersten Attraktionen des Parks.\n\nEin Zug nimmt einen ganzen Bahnsteig voller Fahrgäste auf einmal mit und fährt nach Takt. Wie lange man wartet, hängt deshalb mehr vom Abstand der Abfahrten ab als von der Länge der Warteschlange.',
    relatedTermIds: ['monorail', 'sky-ride', 'people-mover', 'ride-capacity'],
    aliases: ['Parkeisenbahnen', 'Parkbahn', 'Dampfeisenbahn', 'Park Railway'],
  },
  {
    id: 'monorail',
    name: 'Monorail',
    shortDefinition:
      'Eine Bahn auf einem einzigen Fahrbalken, meist auf Stützen, im Park Verkehrsmittel und gemächliche Rundfahrt zugleich.',
    definition:
      'Eine Monorail, auf Deutsch Einschienenbahn, fährt auf einem einzigen Fahrbalken statt auf zwei Schienen. Bei der häufigsten Bauart sitzt der Zug rittlings auf einem Träger aus Beton oder Stahl und rollt auf Gummireifen, bei der hängenden Bauart hängt er darunter. Der Balken steht auf Stützen, die Strecke führt also über Wege und Attraktionen hinweg und braucht am Boden kaum Platz.\n\nDie Disneyland Monorail eröffnete am 14. Juni 1959, gebaut mit Hilfe der deutschen Firma Alweg, und war die erste täglich betriebene Einschienenbahn der USA. In Walt Disney World fährt die Monorail seit 1971 zum Magic Kingdom und seit 1982 auch zum Epcot, vor allem für Gäste aus den Hotels und vom großen Parkplatz. Der Europa-Park eröffnete 1995 den EP-Express, eine Monorail von Von Roll, die auch an den Hotels des Parks hält.',
    relatedTermIds: ['people-mover', 'park-railway', 'sky-ride', 'wdi'],
    aliases: ['Monorails', 'Einschienenbahn', 'Einschienenbahnen'],
    alternateNames: ['Einschienenbahn'],
  },
  {
    id: 'park-mascot',
    name: 'Parkmaskottchen',
    shortDefinition:
      'Eine Figur, die ein Park als eigenes Gesicht erfindet und im Kostüm, auf Schildern, in Shows und als Merchandise einsetzt.',
    definition:
      'Ein Parkmaskottchen ist eine Figur, die dem Park selbst gehört und für ihn steht: im Kostüm für Fotos und Meet-and-Greets, in Shows und Paraden, auf Wegweisern und Parkplänen und als Plüschtier im Shop. Parks ohne Filmlizenzen setzen ihr Maskottchen so ein wie Disney Micky Maus.\n\nIm Europa-Park sind das Ed Euromaus und Edda Euromausi, zwei Mäuse, die auch im Animationsfilm Grand Prix of Europe vorkommen. Mit der Wasserwelt Rulantica kam Snorri dazu, ein Krake mit sechs statt acht Armen. Er hat im Europa-Park mit Snorri Touren einen eigenen Dark Ride. Im Efteling ist es der Narr und Zauberer Pardoes, meist zusammen mit Prinzessin Pardijn.\n\nDie Auftritte finden zu festen Zeiten statt, die im Parkplan oder am Treffpunkt stehen.',
    relatedTermIds: ['character-meet-and-greet', 'parade', 'live-show', 'merchandise'],
    aliases: ['Maskottchen', 'Parkmaskottchens'],
  },
  {
    id: 'teacups',
    name: 'Teetassen',
    shortDefinition:
      'Ein Rundfahrgeschäft mit großen Tassen auf Drehscheiben, die die Fahrgäste mit einem Rad in der Mitte selbst drehen.',
    definition:
      'Bei den Teetassen sitzt eine Familie in einer übergroßen Tasse. Die Tassen stehen auf kleinen Drehscheiben, die wiederum auf einer großen drehenden Plattform sitzen. Die Plattform dreht sich in die eine Richtung, die Scheiben in die andere, und in der Mitte jeder Tasse sitzt ein Rad, mit dem die Fahrgäste die Tasse um sich selbst drehen. Wie schnell, hängt davon ab, wie kräftig sie am Rad drehen: Dieselbe Fahrt ist in der einen Tasse gemütlich und in der nächsten wild.\n\nDie Mad Tea Party eröffnete im Juli 1955 mit Disneyland, gestaltet nach der Teeparty aus Alice im Wunderland. Karl Bacon und Ed Morgan von Arrow Development bauten sie. In den ersten Monaten schweißte die Technik jeden Morgen Risse, bis die Bahn noch im selben Jahr umkonstruiert wurde.\n\nAuch D. H. Morgan Manufacturing, gegründet von Ed Morgans Sohn Dana, baute Teetassen.',
    relatedTermIds: ['flat-ride', 'carousel', 'arrow-dynamics', 'morgan'],
    aliases: [
      'Teetassenkarussell',
      'Tassenkarussell',
      'Teetassen-Karussell',
      'Teacups',
      'Tea Cups',
    ],
  },
  {
    id: 'lockers',
    name: 'Schließfächer',
    shortDefinition:
      'Fächer am Eingang einer Attraktion, in denen Fahrgäste Taschen und lose Gegenstände lassen, die nicht mitfahren dürfen.',
    definition:
      'Schließfächer stehen am Eingang vieler Achterbahnen und mancher Wasserattraktionen, für alles, was man während der Fahrt nicht festhalten kann: Taschen, Mützen, Handys, Schlüssel, lose Brillen. Auf einer Achterbahn fällt ein verlorener Gegenstand auf die Strecke, auf andere Besucher oder einem Fahrgast weiter hinten ins Gesicht. Liegt etwas auf der Strecke, steht die Bahn still, bis es gefunden ist.\n\nDie Regeln legt der Park für jede Attraktion fest. In Universal Orlando darf bei Jurassic World VelociCoaster und The Incredible Hulk Coaster gar nichts Loses mit, und vor dem Einsteigen geht man durch einen Metalldetektor. Die Fächer sind dort für eine Zeit kostenlos, die sich nach der aktuellen Wartezeit richtet, danach kosten sie Geld. An anderen Attraktionen dürfen kleine Dinge in einer geschlossenen Tasche bleiben.\n\nAn vollen Tagen stehen die Besucher erst an den Schließfächern an, bevor sie die Warteschlange der Bahn erreichen.',
    relatedTermIds: ['queue-line', 'standby-queue', 'downtime', 'e-stop'],
    aliases: ['Schließfach', 'Spinde', 'Spind', 'lose Gegenstände', 'Lockers'],
  },
  {
    id: 'ptc',
    name: 'Philadelphia Toboggan Coasters (PTC)',
    shortDefinition:
      'Amerikanische Firma, 1904 gegründet, die Holzachterbahnen und Karussells baute und heute Züge für Holzachterbahnen herstellt.',
    definition:
      'Philadelphia Toboggan Coasters wurde 1904 von Henry B. Auchy und Chester Albright als Philadelphia Toboggan Company gegründet. Karussells baute die Firma bis 1934, Holzachterbahnen bis in die 1970er-Jahre, entworfen unter anderem von John A. Miller, Herbert Schmeck und John C. Allen. Als Allen 1976 in den Ruhestand ging, hörte PTC auf, Achterbahnen zu entwerfen. Seitdem baut die Firma Züge, die auch auf Holzachterbahnen anderer Konstrukteure fahren, darunter The Beast in Kings Island (1979).\n\nEinige der eigenen Bahnen fahren noch. Comet im Hersheypark (1946) und Phoenix in Knoebels stammen beide von Schmeck. Phoenix fuhr ab den späten 1940er-Jahren als Rocket im Playland Park in San Antonio und wurde 1985 in Knoebels wiedereröffnet. Blue Streak in Cedar Point (1964) entwarfen Frank Hoover und John C. Allen.\n\nTom Rebbie und Bill Dauphinee kauften die Firma 1991. Sie sitzt heute in Hatfield, Pennsylvania.',
    relatedTermIds: ['wooden-coaster', 'carousel', 'cci', 'gci', 'ride-cart'],
    aliases: [
      'PTC',
      'Philadelphia Toboggan Coasters',
      'Philadelphia Toboggan Company',
      'Philadelphia Toboggan Coasters, Inc.',
      'PTC-Züge',
    ],
    alternateNames: ['Philadelphia Toboggan Company'],
  },
  {
    id: 'cci',
    name: 'Custom Coasters International (CCI)',
    shortDefinition:
      'Amerikanischer Hersteller von Holzachterbahnen aus Ohio, der zwischen 1991 und 2002 34 Bahnen baute.',
    definition:
      'Custom Coasters International war ein Hersteller von Holzachterbahnen in West Chester, Ohio, 1991 gegründet von Denise Dinn-Larrick, ihrem Bruder Jeff Dinn und ihrem Mann Randy Larrick. Denise ist die Tochter von Charles Dinn, der den Bau von The Beast in Kings Island geleitet hatte. In elf Jahren entstanden 34 Holzachterbahnen.\n\nIn Europa baute CCI Megafobia in Oakwood in Wales (1996) und die beiden Holzachterbahnen in PortAventura, Stampida und Tomahawk (1997). In den USA eröffneten 1998 GhostRider in Knott’s Berry Farm und Shivering Timbers in Michigan’s Adventure, 2000 dann Boulder Dash in Lake Compounce.\n\n2002 ging CCI in Konkurs, während der New Mexico Rattler noch im Bau war. Der Park stellte ihn mit früheren CCI-Leuten fertig. Aus der Firma gingen zwei heutige Holzachterbahnbauer hervor: Clair Hain Jr. und Mike Boodley gründeten 1994 Great Coasters International, Larry Bill, Chad Miller, Korey Kiepert und Michael Graham 2002 The Gravity Group.',
    relatedTermIds: ['wooden-coaster', 'gci', 'gravity-group', 'ptc'],
    aliases: [
      'CCI',
      'Custom Coasters International',
      'Custom Coasters International, Inc.',
      'Custom Coasters Incorporated',
    ],
  },
  {
    id: 'morgan',
    name: 'D. H. Morgan Manufacturing',
    shortDefinition:
      'Kalifornischer Hersteller von Stahlachterbahnen, Zügen für Holzachterbahnen und Familienfahrgeschäften, 2001 von Chance übernommen.',
    definition:
      'D. H. Morgan Manufacturing wurde 1983 von Dana Morgan in La Selva Beach, Kalifornien, gegründet. Sein Vater Ed Morgan gehörte zu den Gründern von Arrow Development. Der erste Auftrag waren neue Züge für den Giant Dipper am Santa Cruz Beach Boardwalk. Danach baute die Firma Züge für weitere Holzachterbahnen, Karussells und Familienfahrgeschäfte wie Teetassen.\n\nIn den 1990er-Jahren kamen große Stahlachterbahnen mit hohen Abfahrten und langen Airtime-Hügeln dazu: Wild Thing in Valleyfair (1996), Steel Force in Dorney Park (1997), Mamba in Worlds of Fun (1998) und Steel Eel in SeaWorld San Antonio (1999). Steel Dragon 2000 in Nagashima Spa Land (2000) ist die längste Achterbahn der Welt. Phantom’s Revenge in Kennywood (2001) nutzt Lifthill und Station von Arrows Steel Phantom.\n\nIm Juni 2001 kaufte Michael Chance die Firma und gründete Chance Morgan. Später kehrte das Unternehmen zum Namen Chance Rides zurück.',
    relatedTermIds: ['chance-rides', 'arrow-dynamics', 'hyper-coaster', 'airtime-hill'],
    aliases: [
      'D. H. Morgan Manufacturing',
      'D.H. Morgan Manufacturing',
      'D. H. Morgan',
      'D.H. Morgan',
      'Morgan Manufacturing',
    ],
    alternateNames: ['Morgan Manufacturing'],
  },
  {
    id: 'reverchon',
    name: 'Reverchon',
    shortDefinition:
      'Französischer Hersteller von drehenden Wilde-Maus-Bahnen, Wildwasserbahnen und Autoscootern aus der Nähe von Fontainebleau.',
    definition:
      'Reverchon Industries ist ein französischer Hersteller von Fahrgeschäften. Die Firma geht auf den Karosseriebauer Gaston Reverchon zurück, der Ende der 1920er-Jahre eine Werkstatt bei Paris eröffnete und zuerst Autoscooter aus Autokarosserien baute. Die Produktion zog später nach Samois-sur-Seine bei Fontainebleau. Die erste Wildwasserbahn von Reverchon eröffnete 1976 im Bagatelle in Berck, die erste Achterbahn 1990 in Le Pal.\n\nDas bekannteste Modell ist die drehende Wilde Maus, verkauft als Crazy Mouse: Wagen für vier Personen, die sich in den Haarnadelkurven einer kompakten Stahlstrecke frei drehen. Die erste eröffnete 1997 am Dinosaur Beach in Wildwood, New Jersey. Dizzy Mouse im Wiener Prater (1998) und Flagermusen in Fårup Sommerland (2001) folgten. Insgesamt hat die Firma über 80 Achterbahnen gebaut.\n\nVon 2003 bis 2005 baute und verkaufte Zamperla Reverchon-Bahnen in Lizenz und behielt danach einen eigenen Spinning Coaster im Programm.',
    relatedTermIds: ['wild-mouse', 'spinning-coaster', 'log-flume', 'bumper-cars', 'zamperla'],
    aliases: ['Reverchon Industries', 'Reverchon Crazy Mouse', 'Crazy Mouse'],
    alternateNames: ['Reverchon Industries'],
  },
  {
    id: 'brogent',
    name: 'Brogent Technologies',
    shortDefinition:
      'Taiwanischer Hersteller des i-Ride-Flying-Theater-Systems, das die meisten Flying Theaters außerhalb von Disney nutzen.',
    definition:
      'Brogent Technologies, 2001 in Kaohsiung gegründet, baut das Flying Theater i-Ride. Eine hängende Sitzgondel schwenkt vor eine große Kugelleinwand, die Beine baumeln frei, und Wind-, Duft- und Nebeleffekte laufen synchron zum Film. Bekannt gemacht hat das Format Disneys Soarin’, Brogent baut es in Serie: Wenn ein Park ein Flying Theater will, kauft er meist ein i-Ride, und es läuft inzwischen auf jedem Kontinent.\n\nIn Europa ist die bekannteste Anlage das [Voletarium](/de/parks/europe/germany/rust/europa-park/voletarium) im Europa-Park, dessen Film über die Wahrzeichen des Kontinents fliegt. Für mehr Kapazität laufen dort zwei Säle parallel. Daneben baut Brogent kleinere Fahrsysteme mit Film und Kuppelkinos.',
    relatedTermIds: ['flying-theater', 'motion-simulator', 'projection-mapping', 'pre-show'],
    aliases: ['Brogent', 'i-Ride'],
    alternateNames: ['Brogent'],
  },
  {
    id: 'quick-pass',
    name: 'QUICK Pass',
    shortDefinition:
      'Das kostenpflichtige Warteschlangen-Produkt im Phantasialand, das pro Attraktion gekauft wird.',
    definition:
      'Der QUICK Pass ist Phantasialands kostenpflichtiger Zugang an der Warteschlange vorbei. Anders als in den meisten Parks kauft man ihn pro Attraktion statt für den ganzen Tag, etwa für Taron, Black Mamba, Chiapas, Talocan oder Maus au Chocolat.\n\nVerkauft wird er nur im Park, beim Gästeservice in der Themenwelt Berlin, und er gilt nur an dem Datum, das auf ihm steht. Der Preis je Attraktion steht fest und schwankt nicht mit dem Andrang. Daneben gibt es den Quick Pass Ultimate: einmal jede Quick-Pass-Attraktion und dazu einmal F.L.Y.\n\nAuch am QUICK-Pass-Eingang gibt es eine Warteschlange, sie ist nur deutlich kürzer.',
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time', 'fastpass'],
    aliases: ['Quick Pass', 'QuickPass', 'Quickpass'],
  },
  {
    id: 'virtual-line',
    name: 'VirtualLine',
    shortDefinition:
      'Die kostenlose virtuelle Warteschlange des Europa-Parks, reserviert in der Park-App.',
    definition:
      'VirtualLine ist der kostenlose Reservierungsdienst des Europa-Parks: In der Europa-Park & Rulantica App buchst du für eine ausgewählte Attraktion ein Zeitfenster und betrittst sie in diesem Fenster über einen verkürzten Eingang. Bis dahin kannst du andere Attraktionen fahren, Shows ansehen oder essen gehen.\n\nAngeboten wird der Dienst für blue fire Megacoaster, Euro-Mir, Piraten in Batavia, Poseidon, Voletarium, Voltron Nevera powered by Rimac und WODAN – Timburcoaster. Die Zahl der Plätze pro Tag ist begrenzt.\n\nAnders als bei einem Fastpass wird hier kein Vorrang verkauft, VirtualLine kostet nichts. Gewartet wird trotzdem, nur eben nicht in der Warteschlange.',
    relatedTermIds: ['virtual-queue', 'return-time', 'boarding-group', 'wait-time'],
    aliases: ['Virtual Line', 'Virtualline'],
  },
  {
    id: 'fast-lane',
    name: 'Fast Lane',
    shortDefinition:
      'Der kostenpflichtige Pass an der Warteschlange vorbei, meist für den ganzen Besuchstag gekauft.',
    definition:
      'Fast Lane heißt das Warteschlangen-Produkt in vielen Parks der Six-Flags- und Walibi-Familie, etwa in Cedar Point und Walibi Holland. Man kauft es für den ganzen Besuch statt für eine einzelne Fahrt. Ein Armband oder ein digitales Ticket öffnet den ganzen Tag über den Fast-Lane-Eingang der teilnehmenden Attraktionen.\n\nMeist gibt es mehrere Stufen, bei Walibi Holland etwa Gold (unbegrenzt, rund 90 % weniger Wartezeit), Silber, Bronze sowie Einzel-Shots für eine oder vier Fahrten. Welche Bahnen dazugehören, legt der Park fest. Halloween-Häuser sind häufig ausgenommen.\n\nWeil der Preis für den Tag gilt und nicht pro Bahn, steht auf park.fan an solchen Bahnen ein „ab“-Preis statt eines festen.',
    relatedTermIds: ['express-pass', 'quick-pass', 'wait-time', 'single-rider'],
    aliases: ['Fastlane'],
  },
  {
    id: 'speedy-pass',
    name: 'Speedy Pass',
    shortDefinition: 'Der kostenpflichtige virtuelle Warteschlangendienst im Movie Park Germany.',
    definition:
      'Der Speedy Pass ist das Warteschlangen-Produkt des Movie Park Germany. Er funktioniert als virtuelle Warteschlange: Über das Smartphone reservierst du eine Fahrt an einer der einbezogenen Attraktionen und betrittst sie zur reservierten Zeit über einen eigenen Eingang.\n\nEs gibt ihn in mehreren Stufen, von Speedy Pass One Ride für eine einzelne Attraktion bis zu Gold und Platinum, die fast alle Attraktionen abdecken. Er gilt für über 25 Attraktionen, einzelne Häuser und Sonderattraktionen sind ausgenommen.',
    relatedTermIds: ['virtual-queue', 'express-pass', 'quick-pass', 'wait-time'],
    aliases: ['Speedypass'],
  },
  {
    id: 'fastrack',
    name: 'Fastrack',
    shortDefinition:
      'Das kostenpflichtige Vorbeigehen an der Warteschlange in den Merlin-Parks, etwa Alton Towers.',
    definition:
      'Unter dem Namen Fastrack verkaufen die britischen Merlin-Parks (Alton Towers, Thorpe Park, Chessington) ihren Zugang an der Warteschlange vorbei. Es gibt ihn einzeln für eine Bahn oder als Paket: Bronze für eine Auswahl von Bahnen, Silber für je eine Fahrt an allen einbezogenen Attraktionen, Gold für unbegrenzte Nutzung.\n\nFastrack ist immer ein Zusatzticket: Der Parkeintritt ist darin nicht enthalten.',
    relatedTermIds: ['express-pass', 'quick-pass', 'wait-time'],
    aliases: ['Fast Track', 'Fasttrack'],
  },
  {
    id: 'premier-access',
    name: 'Disney Premier Access',
    shortDefinition:
      'Disneys kostenpflichtiger Zugang an der Warteschlange vorbei außerhalb der USA, pro Attraktion buchbar.',
    definition:
      'Disney Premier Access ist das, was in den US-Parks Lightning Lane heißt: der kostenpflichtige Zugang an der Warteschlange vorbei, im Disneyland Paris und in Tokyo Disney Resort.\n\nPremier Access One wird pro Attraktion gekauft, in der Regel am Besuchstag über die App, und der Preis hängt vom Datum und von der Attraktion ab. Bei neuen Attraktionen liegt er deutlich höher. Premier Access Ultimate deckt alle teilnehmenden Attraktionen je einmal ab.\n\nWeil der Preis täglich neu gesetzt wird, steht auf park.fan an diesen Bahnen kein fester Preis.',
    relatedTermIds: ['lightning-lane', 'express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Premier Access'],
  },
  {
    id: 'headliner',
    name: 'Headliner',
    shortDefinition:
      'Die Attraktion, für die Leute den Park überhaupt erst ansteuern, meist die neueste oder größte Bahn.',
    definition:
      'Ein Headliner ist die Attraktion, wegen der ein Park auf der Reiseliste steht: die neueste Achterbahn, der teuerste Dark Ride, das, was auf dem Plakat abgebildet ist. Parks bauen ungefähr alle fünf bis zehn Jahre einen, und im Eröffnungsjahr zieht er einen erheblichen Teil aller Besucher an sich.\n\nFür die Planung eines Tages ist er der wichtigste Einzelposten. Am Headliner steht meist die längste Warteschlange des Parks, oft von der Öffnung bis zum Abend, während der Rest des Geländes am Vormittag noch leer ist. Deshalb steht er auf fast jeder Empfehlungsliste ganz vorn: erst der Headliner, dann alles andere. Die Ausnahme ist eine virtuelle Warteschlange, die ihn ohnehin auf eine Uhrzeit legt.\n\npark.fan markiert Headliner in der Attraktionsliste eines Parks und zieht sie in der Rangliste nach Wartezeit nach oben. Ob eine Bahn als Headliner gilt, ist eine kuratierte Angabe und keine Ableitung aus der Wartezeit: eine Bahn kann an einem einzelnen Tag lange Warteschlangen haben, ohne dass jemand ihretwegen anreist.',
    aliases: ['Headliner-Attraktion', 'Hauptattraktion', 'E-Ticket'],
    relatedTermIds: ['wait-time', 'crowd-level', 'rope-drop', 'virtual-queue', 'peak-day'],
  },
  {
    id: 'scare-maze',
    name: 'Horror-Maze',
    shortDefinition:
      'Ein Gruselrundgang für die Halloween-Saison, in dem kostümierte Darsteller die Besucher erschrecken.',
    definition:
      'Eine Horror-Maze ist ein Rundgang, den ein Park für seine Halloween-Saison aufbaut oder umdekoriert. Die Besucher gehen in kleinen Gruppen durch Kulissen, Nebel und Geräusche, und Darsteller in Kostüm und Maske springen aus Verstecken auf sie zu. Die meisten Mazes öffnen nur abends, viele erst ab einem Mindestalter.\n\nDie erste in den Universal Studios Florida hieß Dungeon of Terror und gehörte 1991 zu den Fright Nights, die ein Jahr später in Halloween Horror Nights umbenannt wurden. In Europa tragen Mazes die Traumatica im Europa-Park und die Halloween-Saison in PortAventura, wo sie pasajes del terror heißen.\n\npark.fan kennzeichnet eine Maze mit dem Badge „Halloween-Maze“ und führt sie auf der Parkseite in einem eigenen Abschnitt unter den Fahrgeschäften.',
    relatedTermIds: ['halloween-event', 'scare-zone', 'walkthrough', 'hard-ticket-event'],
    aliases: [
      'Horror-Mazes',
      'Halloween-Maze',
      'Halloween-Mazes',
      'Maze',
      'Mazes',
      'Spukhaus',
      'Spukhäuser',
      'Horrorhaus',
    ],
    alternateNames: ['Scare Maze', 'Haunted House'],
  },
  {
    id: 'halloween-event',
    name: 'Halloween-Event',
    shortDefinition:
      'Die Wochen um den 31. Oktober, in denen ein Park für Halloween dekoriert und Shows, Mazes und längere Öffnungszeiten dazunimmt.',
    definition:
      'Ein Halloween-Event ist das Programm eines Parks in den Wochen um den 31. Oktober. Tagsüber heißt das Kürbisse, Dekoration und Shows für Familien. Abends bauen viele Parks Horror-Mazes und Scare Zones für Erwachsene auf, manchmal mit eigenem Ticket und Mindestalter.\n\nDas älteste der großen ist Knott’s Scary Farm in Kalifornien, das 1973 als dreitägiger Halloween Haunt anfing. Universal folgte 1991 mit den Fright Nights, die ein Jahr später Halloween Horror Nights hießen. Der Europa-Park veranstaltet seine Horror Nights seit 2007, seit 2017 unter dem Namen Traumatica.\n\nDie Halloween-Wochenenden gehören zu den vollsten Tagen im Herbst eines Parks, vor allem, wenn sie in die Herbstferien fallen. Die Prognose von park.fan bezieht die Veranstaltungen eines Parks ein, Halloween eingeschlossen.',
    relatedTermIds: [
      'scare-maze',
      'scare-zone',
      'hard-ticket-event',
      'crowd-calendar',
      'school-holiday',
    ],
    aliases: [
      'Halloween-Events',
      'Halloween-Saison',
      'Halloween-Nächte',
      'Halloween-Festival',
      'Halloweensaison',
    ],
  },
  {
    id: 'scare-zone',
    name: 'Scare Zone',
    shortDefinition:
      'Ein offener Bereich im Park, in dem während eines Halloween-Events Darsteller zwischen den Besuchern umherziehen.',
    definition:
      'Eine Scare Zone ist eine Straße oder ein Platz, den ein Park für sein Halloween-Event gestaltet und mit Darstellern besetzt. Es gibt keinen Eingang und keine Warteschlange. Die Besucher laufen auf dem Weg durch den Park hindurch, und die Darsteller suchen sich ihre Opfer aus der vorbeiziehenden Menge.\n\nScare Zones gehören zum Abendteil eines Events und beginnen meist mit der Dämmerung. Die Halloween Horror Nights in den Universal Studios Florida bauen jedes Jahr mehrere in den Straßen zwischen ihren Häusern auf, die Traumatica im Europa-Park legt sie an die Wege zwischen ihren Mazes.',
    relatedTermIds: ['scare-maze', 'halloween-event', 'hard-ticket-event'],
    aliases: ['Scare Zones', 'Scarezone', 'Scarezones', 'Erschreckzone'],
  },
  {
    id: 'retired-attraction',
    name: 'Stillgelegte Attraktion',
    shortDefinition:
      'Eine Bahn, die ein Park endgültig geschlossen hat, ob sie abgerissen, verkauft oder stehen gelassen wird.',
    definition:
      'Eine stillgelegte Attraktion hat ein Park endgültig außer Betrieb genommen. Manche werden abgerissen, um Platz für Neues zu machen, manche an einen anderen Park verkauft, manche stehen jahrelang ungenutzt herum. Kingda Ka in Six Flags Great Adventure, mit 139 Metern damals die höchste Achterbahn der Welt, fuhr am 10. November 2024 zum letzten Mal und wurde am 28. Februar 2025 gesprengt.\n\nAuf park.fan behält eine endgültig geschlossene Bahn ihre Seite, mit dem Status „Dauerhaft geschlossen“ und dem Datum der Schließung. Die Seite zeigt weiter die Wartezeiten von vor der Schließung, das Fahrprofil und die Beiträge über die Bahn und verlinkt, wo es einen gibt, den News-Beitrag von park.fan zur Schließung. Eine Live-Wartezeit hat sie nicht mehr. Auf der Parkseite wandert die Bahn aus dem Raster in eine eigene Liste geschlossener Bahnen, die sie ein Jahr nach der Schließung verlässt.',
    relatedTermIds: ['refurbishment', 'downtime', 'seasonal-attraction', 'wait-time'],
    aliases: [
      'Stillgelegte Attraktionen',
      'Stillgelegte Bahn',
      'Stillgelegte Bahnen',
      'Dauerhaft geschlossen',
      'Abgerissene Bahn',
    ],
    alternateNames: ['Ehemalige Attraktion', 'Retired Attraction'],
  },
  {
    id: 'weather-closure',
    name: 'Wetterbedingte Schließung',
    shortDefinition:
      'Eine Bahn stoppt wegen Gewitter, Sturm oder Starkregen und fährt wieder, sobald das Wetter durchgezogen ist.',
    definition:
      'Bei einer wetterbedingten Schließung steht eine Bahn still, solange das Wetter den Betrieb unsicher macht. Achterbahnen und Freifalltürme im Freien schließen, sobald Blitze in einem festgelegten Umkreis um den Park gemeldet werden. Böen über einem Grenzwert, den der Hersteller vorgibt, stoppen hohe Bahnen und solche mit viel Angriffsfläche, und manche Launch-Coaster schließen auch bei Starkregen. Bahnen in Hallen fahren weiter, und ihre Warteschlangen wachsen, solange draußen nichts läuft.\n\nIn den Live-Daten von park.fan steht eine solche Bahn als gestört oder geschlossen, so wie der Park sie meldet. Auf der Parkseite steht auch das Wetter: Eine Kurzfristvorhersage warnt vor Regen, Gewitter, Hagel und Sturmböen, mit einer Schätzung, wann sie anfangen und aufhören, und amtliche Unwetterwarnungen erscheinen mit Warnstufe und Quelle.',
    relatedTermIds: ['downtime', 'wait-time', 'indoor-coaster', 'dark-ride'],
    aliases: [
      'Wetterbedingte Schließungen',
      'Gewitterpause',
      'Wetterpause',
      'wegen Wetter geschlossen',
      'Windsperre',
    ],
  },
  {
    id: 'typical-wait',
    name: 'Typische Wartezeit',
    shortDefinition:
      'Der Median der gemessenen Wartezeiten einer Bahn: Die Hälfte der Messungen lag darunter, die Hälfte darüber.',
    definition:
      'Die typische Wartezeit ist die Zahl, die park.fan als normale Warteschlange einer Bahn angibt. Sie ist der Median der Wartezeiten, die im angezeigten Zeitraum gemessen wurden: Die Hälfte der Messungen lag darunter, die Hälfte darüber. Ein paar extreme Tage ziehen einen Durchschnitt nach oben, den Median verschieben sie kaum. Er bleibt deshalb nah an dem, was ein Besucher an einem gewöhnlichen Tag erlebt.\n\nAuf der Seite einer Bahn steht sie als „Normal“, getrennt für Wochentage und Wochenende, neben der Spitzenwartezeit als „Voll“. Die Statistik eines Parks führt sie als „Typisch (Median)“. Die Stundenkurve zeichnet den Median vergangener Tage als Linie und das Band vom 25. bis zum 90. Perzentil als üblichen Bereich. Jede Zahl ist auf fünf Minuten gerundet, in diesem Raster melden die Parks ihre Wartezeiten. Nur Disneys Walk-on-Wert 13 bleibt, wie er gemeldet wird.',
    relatedTermIds: ['peak-wait', 'wait-time', 'posted-wait-time', 'crowd-level', 'walk-on'],
    aliases: ['Typische Wartezeiten', 'Median-Wartezeit', 'Median der Wartezeit', 'P50'],
  },
  {
    id: 'peak-wait',
    name: 'Spitzenwartezeit',
    shortDefinition:
      'Das 90. Perzentil der gemessenen Wartezeiten einer Bahn: Nur jede zehnte Messung lag darüber.',
    definition:
      'Die Spitzenwartezeit ist die Zahl, mit der park.fan einen vollen Tag an einer Bahn beschreibt. Sie ist das 90. Perzentil der gemessenen Wartezeiten: Neun von zehn Messungen lagen darunter oder genau darauf, eine von zehn darüber. Sie liegt über der typischen Wartezeit und unter dem Rekord. Ein Maximum setzt ein einzelner Tag, eine Störung oder ein Feiertagssamstag, für das 90. Perzentil muss ein Zehntel aller Messungen so hoch liegen.\n\nAuf der Seite einer Bahn steht die Spitzenwartezeit als „Voll“ neben „Normal“, für Wochentage und Wochenende, und sie ist die Zahl über dem Balken jedes Wochentags. Die Statistik eines Parks führt sie als „Spitze (P90)“ neben dem Median. Der Rekord steht mit Datum gesondert darunter.',
    relatedTermIds: ['typical-wait', 'wait-time', 'peak-day', 'crowd-level'],
    aliases: ['Spitzenwartezeiten', 'P90', '90. Perzentil'],
  },
  {
    id: 'public-holiday',
    name: 'Feiertag',
    shortDefinition:
      'Ein gesetzlich freier Tag, an dem Schulen und die meisten Betriebe zu sind und die Parks sich füllen.',
    definition:
      'Ein Feiertag ist ein gesetzlich freier Tag, bundesweit oder nur in einem Bundesland oder einer Region. Ostermontag, Christi Himmelfahrt und Pfingstmontag sind in Deutschland bundesweite Feiertage. Fronleichnam ist nur in einigen Ländern frei, darunter Baden-Württemberg und Nordrhein-Westfalen, wo der Europa-Park und das Phantasialand stehen. Ein Park nahe der Grenze bekommt auch die Feiertage der Nachbarn zu spüren: Christi Himmelfahrt ist auch in Frankreich, den Niederlanden, Belgien und der Schweiz frei.\n\nDie Prognose von park.fan berücksichtigt die Feiertage der Länder, in denen die Parks stehen. Der Besucherkalender markiert sie, unterscheidet bundesweite und regionale Feiertage, und seine Legende vermerkt, dass solche Tage meist deutlich voller sind.',
    relatedTermIds: [
      'bridge-day',
      'school-holiday',
      'crowd-calendar',
      'crowd-forecast',
      'peak-day',
    ],
    aliases: [
      'Feiertage',
      'Feiertagen',
      'Feiertags',
      'gesetzlicher Feiertag',
      'gesetzliche Feiertage',
    ],
  },
  {
    id: 'bridge-day',
    name: 'Brückentag',
    shortDefinition:
      'Ein Arbeitstag zwischen einem Feiertag und dem Wochenende, den viele freinehmen.',
    definition:
      'Ein Brückentag ist ein Arbeitstag, der zwischen einem Feiertag und einem Wochenende eingeklemmt ist: ein Freitag nach einem Feiertag am Donnerstag oder ein Montag vor einem am Dienstag. Mit einem Urlaubstag werden daraus vier freie Tage. In Deutschland ist der bekannteste der Freitag nach Christi Himmelfahrt, in den Ländern mit Fronleichnam kommt der Freitag danach hinzu. In Frankreich heißt das Freinehmen faire le pont, in den Niederlanden spricht man von einer brugdag.\n\nFür einen Park verhält sich ein Brückentag wie ein Teil eines langen Wochenendes. Die Prognose von park.fan rechnet Brückentage als eigenen Faktor ein, und der Besucherkalender wie auch der Wartezeitverlauf einer Bahn kennzeichnen sie als Brückentag.',
    relatedTermIds: ['public-holiday', 'school-holiday', 'crowd-calendar', 'crowd-forecast'],
    aliases: ['Brückentage', 'Brückentagen'],
    alternateNames: ['Bridge Day'],
  },
  {
    id: 'dynamic-pricing',
    name: 'Dynamische Preise',
    shortDefinition: 'Ticketpreise, die sich nach dem Besuchstag und der Nachfrage richten.',
    definition:
      'Bei dynamischen Preisen legt ein Park für jeden Tag einen eigenen Ticketpreis fest. Ein datiertes Ticket gilt nur an dem Tag, für den es gekauft wurde, und kostet an einem ruhigen Wochentag weniger als an einem Feiertagssamstag. Der Preis eines Tages kann sich außerdem ändern, je mehr Tickets dafür verkauft sind. Ein undatiertes Ticket lässt sich an jedem Tag seiner Gültigkeit einlösen und hat einen festen Preis.\n\nDas Disneyland Paris verkauft datierte Tickets innerhalb einer festen Spanne: 2026 kostete ein Tagesticket für einen Park an den ruhigsten Tagen ab 56 €, an den vollsten über 100 €. Das undatierte Ticket ist teurer als die meisten datierten Tage, dafür bleibt das Datum offen.',
    relatedTermIds: ['crowd-calendar', 'off-peak', 'peak-day', 'season-pass', 'evening-ticket'],
    aliases: [
      'Dynamic Pricing',
      'Dynamische Preisgestaltung',
      'datiertes Ticket',
      'datierte Tickets',
      'undatiertes Ticket',
      'undatierte Tickets',
      'Datumsticket',
    ],
  },
  {
    id: 'evening-ticket',
    name: 'Abendticket',
    shortDefinition: 'Ein günstigeres Ticket für die letzten Stunden eines Parktags.',
    definition:
      'Ein Abendticket gilt ab dem späten Nachmittag bis zur Schließung und kostet weniger als ein Tagesticket. Parks verkaufen es an Tagen, die lange dauern, im Sommer oder in einer Wintersaison, die bis in die Dunkelheit geht. Der Europa-Park bietet in seiner Wintersaison ein Abendticket an, und 2018 verkaufte er zur Sommernachtsparty ein Mondschein-Ticket ab 17 Uhr.\n\nViele Bahnen haben gegen Ende des Tages ein zweites ruhiges Fenster, wenn die Tagesgäste gehen, und die Warteschlangen schließen zur angegebenen Schließzeit. Die Stundenkurve auf der Seite einer Bahn zeigt bei park.fan, wie sich die mittlere Wartezeit über Nachmittag und Abend entwickelt.',
    relatedTermIds: [
      'queue-closure',
      'opening-hours',
      'winter-season',
      'dynamic-pricing',
      'hard-ticket-event',
    ],
    aliases: [
      'Abendtickets',
      'Abendkarte',
      'Mondscheinticket',
      'Mondschein-Ticket',
      'Feierabendticket',
    ],
  },
  {
    id: 'winter-season',
    name: 'Wintersaison',
    shortDefinition:
      'Wochen, in denen ein Park, der sonst über den Winter schließt, mit Lichtern, Weihnachtsmarkt und Wintershows öffnet.',
    definition:
      'In einer Wintersaison öffnet ein Park in Monaten, in denen er sonst geschlossen wäre, meist von Ende November bis in den Januar. Manche Bahnen im Freien bleiben wegen Frost oder Wartung zu, dafür kommen Lichter, Weihnachtsmärkte, Eisbahnen und Wintershows dazu.\n\nDer Europa-Park öffnete 2001 als erster deutscher Park im Winter und hatte in dieser ersten Saison 180.000 Besucher. Das Phantasialand folgte im Dezember 2002 mit dem Wintertraum und schließt seit 2021 Ende Oktober nicht mehr dafür. In den Niederlanden läuft Winter Efteling in denselben Wochen.\n\nAuf park.fan tragen Bahnen, die nur im Winter oder nur im Sommer fahren, ein Saison-Badge. Außerhalb ihrer Saison verschwinden sie von der Parkseite, solange der Schalter für die ausgeblendeten Einträge nicht an ist.',
    relatedTermIds: [
      'seasonal-attraction',
      'offseason',
      'season-opening',
      'evening-ticket',
      'crowd-calendar',
    ],
    aliases: ['Winteröffnung', 'Wintersaisons', 'Weihnachtssaison'],
  },
  {
    id: 'season-opening',
    name: 'Saisonstart',
    shortDefinition: 'Der erste Tag der Hauptsaison eines Parks nach der Winterpause.',
    definition:
      'Der Saisonstart ist der erste Tag der Hauptsaison eines Parks nach den geschlossenen Monaten. Die meisten Parks in Mitteleuropa öffnen zwischen Ende März und Mitte April wieder, oft passend zu den Osterferien, und viele eröffnen an diesem Tag eine neue Bahn oder einen neuen Bereich. Parks mit Wintersaison haben Ende November einen zweiten Start.\n\nZu den Eröffnungswochenenden kommen die Jahreskarteninhaber in großer Zahl zurück, und die ersten warmen Frühlingswochenenden bringen noch Tagesgäste dazu.\n\nDie Prognose von park.fan behandelt den Saisonstart als eigenes Ereignis. Solange ein Park geschlossen ist, zeigt der Besucherkalender die Tage als „Geschlossen“, und das Eröffnungsdatum erscheint dort, sobald der Park es veröffentlicht.',
    relatedTermIds: ['offseason', 'opening-day', 'soft-opening', 'winter-season', 'crowd-forecast'],
    aliases: [
      'Saisoneröffnung',
      'Saisoneröffnungen',
      'Saisonbeginn',
      'Saisonstarts',
      'Eröffnungswochenende',
    ],
  },
  {
    id: 'queue-closure',
    name: 'Anstellschluss',
    shortDefinition:
      'Der Zeitpunkt, ab dem man sich an einer Bahn nicht mehr anstellen kann, meist die Schließzeit des Parks.',
    definition:
      'Mit dem Anstellschluss nimmt eine Bahn niemanden mehr in die Warteschlange auf. In den meisten Parks ist das die angegebene Schließzeit, und wer bis dahin in der Warteschlange steht, fährt noch, an einem vollen Tag auch eine Stunde später. Manche Bahnen schließen ihre Warteschlange früher, wenn darin schon mehr Leute stehen, als die Bahn bis zum Ende des Tages befördern kann.\n\nDer Tagesplaner von park.fan rechnet genauso. Er plant eine Bahn nur ein, wenn der Besuch dort samt Warteschlange vor der Schließung des Parks beginnt, die letzte Fahrt eines geplanten Tages kann also nach der Schließzeit enden. Nach der Schließzeit beginnt im Plan nichts mehr.',
    relatedTermIds: ['opening-hours', 'touring-plan', 'wait-time', 'evening-ticket', 'rope-drop'],
    aliases: ['Warteschlangenschluss'],
  },
  {
    id: 'walk-on',
    name: 'Walk-on',
    shortDefinition: 'Eine Bahn ohne Warteschlange: Man läuft direkt bis zur Station durch.',
    definition:
      'Eine Bahn ist ein Walk-on, wenn keine Warteschlange davor steht und die Besucher direkt bis zur Station gehen, höchstens bis zum nächsten Zug. Das kommt beim Rope Drop vor, in der letzten Stunde des Tages, an ruhigen Wochentagen und in den Minuten, nachdem eine Bahn nach einer Störung wieder öffnet.\n\nDisney-Parks melden manche Walk-ons als 13 Minuten, abseits des Fünf-Minuten-Rasters, in dem alle anderen angezeigten Wartezeiten stehen. park.fan rundet jede Wartezeit, die es anzeigt, auf fünf Minuten und lässt diese 13 stehen. Gerundet sähe sie aus wie eine gewöhnliche Warteschlange von 15 Minuten.',
    relatedTermIds: ['wait-time', 'posted-wait-time', 'rope-drop', 'typical-wait', 'off-peak'],
    aliases: ['Walk-ons', 'Walk on', 'Walkon'],
  },
  {
    id: 'on-site-hotel',
    name: 'Parkhotel',
    shortDefinition:
      'Ein Hotel, das der Park selbst betreibt, auf dem Gelände oder direkt daneben.',
    definition:
      'Ein Parkhotel gehört zum Park und steht auf seinem Gelände oder direkt daneben, meist im passenden Thema gestaltet. Der Europa-Park eröffnete 2019 mit dem Krønasår sein sechstes Themenhotel, über eine Brücke mit der Wasserwelt Rulantica verbunden. Das Phantasialand hat Ling Bao, Matamba und Charles Lindbergh, und die Hotels des Disneyland Paris liegen in Gehweite beider Parks.\n\nDie Gäste gehen zu Fuß zum Eingang, und viele Resorts lassen sie vor allen anderen hinein. Im Disneyland Paris heißt das Extra Magic Time.\n\nWo ein Park ein Zeitfenster für den Früheinlass veröffentlicht, zeigt park.fan es im Zeitplan als Früheinlass für Hotelgäste an, mit den Minuten vor der Öffnung.',
    relatedTermIds: ['early-entry', 'rope-drop', 'season-pass', 'opening-hours'],
    aliases: [
      'Parkhotels',
      'Themenhotel',
      'Themenhotels',
      'Resorthotel',
      'Resorthotels',
      'Erlebnishotel',
      'Erlebnishotels',
    ],
    alternateNames: ['On-site Hotel', 'Resort-Hotel'],
  },
];

export default translations;
