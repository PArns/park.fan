import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: 'Wartezeit',
    shortDefinition:
      'Die geschätzte Zeit, die ein Besucher warten muss, bevor er eine Attraktion betreten kann.',
    definition:
      'Die Wartezeit (auch Wartezeit in der Warteschlange) ist die geschätzte Dauer, die ein Besucher in der Warteschlange verbringt, bevor er in eine Attraktion einsteigen kann. Parks zeigen Wartezeiten an Attraktionseingängen und in ihren Apps an. park.fan liest die Wartezeiten alle fünf Minuten neu ein, für jede Attraktion eines Parks.',
    relatedTermIds: ['express-pass', 'posted-wait-time', 'single-rider', 'virtual-queue'],
    aliases: ['Wartezeiten', 'Warteschlange', 'Warteschlangen', 'Wartezeit-Daten'],
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
      'Bei einer virtuellen Warteschlange (manchmal auch Boarding-Gruppe oder Rückkehrzeit genannt) melden sich Besucher über eine App oder an einem Kiosk für eine Attraktion an und bekommen eine Nachricht, wenn sie an der Reihe sind. Bis dahin kann man woanders im Park unterwegs sein und kommt zurück, wenn die eigene Gruppe aufgerufen wird.',
    relatedTermIds: ['express-pass', 'single-rider', 'wait-time'],
    aliases: ['Virtuelle Warteschlangen'],
  },
  {
    id: 'express-pass',
    name: 'Express Pass',
    shortDefinition:
      'Ein kostenpflichtiges oder im Paket enthaltenes Ticket-Upgrade für eine kürzere Vorrang-Warteschlange.',
    definition:
      'Ein Express Pass (der Name hängt vom Park ab, etwa Universal Express oder Disney Lightning Lane) ist ein Ticket-Upgrade. Wer ihn hat, nutzt einen eigenen Vorrangeingang und wartet deutlich kürzer. Manche Parks packen den Express-Zugang in Premium-Hotelpakete, andere verkaufen ihn einzeln.',
    alternateNames: ['Flash Pass'],

    relatedTermIds: ['single-rider', 'virtual-queue', 'wait-time'],
    aliases: ['Express-Pass', 'Express-Pässe'],
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
      'Die Besucherdichte beschreibt, wie voll ein Park an einem bestimmten Tag oder zu einer bestimmten Uhrzeit ist. park.fan rechnet sie aus den gemessenen Wartezeiten, der aktuellen Auslastung und der Prognose und gibt sie auf einer Skala von „sehr niedrig“ bis „extrem“ aus. Sehr niedrig heißt kurze Warteschlangen und freie Wege, extrem heißt lange Wartezeiten an fast jeder Attraktion.',
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
      'Ein Besucherkalender ist ein Monats- oder Jahreskalender, in dem für jeden Tag die vorhergesagte Besucherdichte steht. park.fan erstellt Besucherkalender mit KI-Modellen, die auf den mitgeschriebenen Wartezeiten, kombinierten Schulferienkalendern, bevorstehenden Veranstaltungen und saisonalen Trends trainiert wurden. Grün steht für wenig Andrang, Orange und Rot für viel.',
    relatedTermIds: ['crowd-level', 'peak-day', 'rope-drop'],
    aliases: ['Besucherkalender', 'Crowd-Kalender', 'Crowd-Kalendar'],
  },
  {
    id: 'peak-day',
    name: 'Spitzentag',
    shortDefinition:
      'Ein Tag mit maximalen Besucherzahlen, typischerweise während Feiertagen oder Sonderveranstaltungen.',
    definition:
      'Ein Spitzentag ist ein Tag, an dem ein Park an oder nahe seiner maximalen Kapazität ist. Häufige Spitzentage sind große Feiertage und Ferien (Weihnachten, Ostern, Sommerferien), Sonderveranstaltungstage (Halloween-Nächte, Feuerwerke) und Schulferienwochen. Im Besucherkalender von park.fan sind die Spitzentage markiert.',
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
      'Die Kapazität einer Attraktion (oder Durchsatz) ist die maximale Anzahl von Besuchern, die eine Attraktion pro Stunde unter optimalen Betriebsbedingungen befördern kann. Die Kapazität hängt von der Fahrzeuggröße, der Anzahl der fahrenden Fahrzeuge, der Be- und Entladungsgeschwindigkeit und der Fahrzykluszeit ab. Die Kapazität bestimmt direkt, wie schnell sich die Warteschlange bewegt.',
    relatedTermIds: ['downtime', 'refurbishment', 'wait-time'],
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
      'Mit einem Park-Hopper-Ticket kann man an einem Tag zwischen zwei oder mehr Parks desselben Betreibers wechseln. Bei Disney heißt es Park Hopper und gilt täglich für Magic Kingdom, EPCOT, Hollywood Studios und Animal Kingdom. Das Upgrade kostet mehr als ein einfaches Tagesticket, lohnt sich aber bei kurzen Aufenthalten oder wenn begehrte Attraktionen über mehrere Parks verteilt sind.',
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
    aliases: ['Jahreskarte', 'Jahrespässe', 'Saisonpass', 'Saisonpässe'],
    alternateNames: ['Annual Pass', 'Season Pass', 'Saisonkarte', 'Saisonpass'],

    relatedTermIds: ['express-pass', 'park-hopper', 'peak-day'],
  },
  {
    id: 'height-requirement',
    name: 'Mindestgröße',
    shortDefinition:
      'Eine Mindestkörpergröße, die Besucher erfüllen müssen, um eine bestimmte Attraktion nutzen zu dürfen.',
    definition:
      'Die Mindestgröße ist eine Sicherheitsanforderung, die Parks für bestimmte Attraktionen festlegen. Sie soll sicherstellen, dass Sicherheitsgurte und Rückhaltesysteme korrekt sitzen. Typische Mindestgrößen liegen zwischen 90 und 140 cm. Einige Attraktionen haben auch eine Maximalgröße oder ein Gewichtslimit. Mit Kindern lohnt es sich, die Mindestgrößen vor dem Besuch nachzusehen.',
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
      'Ein Themenbereich (englisch: Themed Land) ist eine abgegrenzte Zone innerhalb eines Freizeitparks, die ein einheitliches Design, eine Hintergrundgeschichte (Storyline) und passende Attraktionen, Gastronomie und Shops vereint. Beispiele sind Hogsmeade in den Universal-Parks, Fantasyland in den Disney-Parks oder Scandinavica im Europa-Park. Themenbereiche teilen einen Park in Abschnitte, nach denen sich Besucher orientieren.',
    aliases: ['Themenbereiche'],
    alternateNames: ['Themenzone', 'Land', 'Theming Area'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      'Die inoffizielle, vorzeitige Öffnung einer Attraktion vor dem offiziellen Eröffnungsdatum.',
    definition:
      'Ein Soft Opening ist die vorzeitige, inoffizielle Öffnung einer neuen Attraktion oder eines Themenbereichs, oft ohne jede Ankündigung. Parks testen dabei die Technik mit echten Besuchern und suchen nach Engpässen bei der Kapazität. Auch im Deutschen sagt man Soft Opening. Ein Soft Opening kann jederzeit abgebrochen werden, planen lässt sich damit nicht. Meist berichten Fan-Foren und Social Media als erste davon.',
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
      'Lightning Lane ist Disneys Bezeichnung für sein Priority-Queue-System, das 2021 als Nachfolger des kostenlosen FastPass+-Programms eingeführt wurde. Es gibt zwei Varianten: Individual Lightning Lane (ILL) für die gefragtesten Attraktionen, die einzeln gekauft werden muss, und Lightning Lane Multi Pass (LLMP), ein Tageszusatz, mit dem man Rückkehrzeiten für eine Auswahl an Attraktionen buchen kann. Was vorher kostenlos war, kostet seitdem Geld. Im Besucherkalender von park.fan steht, an welchen Tagen mit langen Standby-Warteschlangen zu rechnen ist.',
    alternateNames: [
      'Lightning Lane Multi Pass',
      'Individual Lightning Lane',
      'LLMP',
      'ILL',
      'Lightning Lanes',
    ],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Lightning Lanes'],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      'Disneys ehemaliges tägliches Zusatzabo für Lightning-Lane-Zugang zu den meisten Attraktionen.',
    definition:
      'Genie+ (heute umbenannt in Lightning Lane Multi Pass) war Disneys kostenpflichtiges Tages-Add-on, das FastPass+ ersetzte. Für eine personenbezogene Tagesgebühr konnten Gäste jeweils ein Lightning-Lane-Rückkehrzeitfenster für eine breite Auswahl an Attraktionen buchen. Die gefragtesten Attraktionen gab es nur einzeln als Individual Lightning Lane. Der Preis von Genie+ war dynamisch und stieg an den besucherstärksten Tagen. park.fan zeigt die aktuelle Besucherdichte jedes Parks.',
    aliases: ['Genie Plus'],
    alternateNames: ['Disney Genie', 'Lightning Lane Multi Pass'],

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
      'Die OffSeason ist der Zeitraum, in dem ein Freizeitpark ganz geschlossen ist. In der Nebensaison ist er nur leerer, in der OffSeason ruht der Betrieb. Parks nutzen diese Wochen für Wartungsarbeiten an Attraktionen und Anlagen, für größere Umbauten, die im laufenden Betrieb nicht möglich wären, und damit sich das Personal vor der neuen Saison erholt. OffSeason-Schließungen finden am häufigsten in den Wintermonaten statt und dauern je nach Park und Klima einige Wochen bis mehrere Monate. In dieser Zeit sind keinerlei Attraktionen, Restaurants oder Shows zugänglich.\n\nZeigt park.fan den Status OffSeason für einen Park an, bedeutet das: Für den aktuellen Zeitraum liegt kein Öffnungsplan vor und das nächste bestätigte Öffnungsdatum liegt noch einige Wochen entfernt. Das genaue Datum der Wiedereröffnung steht auf der offiziellen Website des Parks. Bei gefragten Parks sind die ersten Tage nach der OffSeason oft schnell ausverkauft.',
    alternateNames: ['Wintersaison', 'Saisonpause', 'Geschlossene Saison', 'Off Season'],

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
      'Die Warteschlange ist der Weg (Gänge, abgesperrte Außenbereiche oder thematisch gestaltete Innenräume), den Besucher zurücklegen, bevor sie in eine Attraktion einsteigen. In vielen Parks ist die Warteschlange selbst thematisiert. Bei Disney und Universal beginnt die Geschichte einer Attraktion oft schon dort, in Räumen, die zu ihrer Kulisse gehören. park.fan zeigt die aktuelle Wartezeit jeder Attraktion eines Parks.',
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
      'Eine Sonderveranstaltung (englisch: Hard Ticket Event) ist ein separat buchbares Abend-Event mit eigenem Eintrittsticket. Dazu gehören Shows, Dekoration und Programmpunkte, die es beim regulären Parkbesuch nicht gibt. Beispiele sind Halloween Horror Nights bei Universal, Mickey’s Not-So-Scary Halloween Party in Walt Disney World, die Weihnachtsgala im Europa-Park oder die Halloween-Events im Phantasialand. An Sonderveranstaltungstagen werden reguläre Tagesbesucher oft ab 17–18 Uhr gebeten, den Park zu verlassen. Tickets sind meist Wochen im Voraus ausverkauft.',
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
      'FastPass+ (ursprünglich FastPass, eingeführt 1999) war Disneys kostenloses Priority-Queue-System. In Walt Disney World konnten Gäste täglich bis zu drei FastPass+-Reservierungen über die My Disney Experience App buchen und damit Rückkehrzeitfenster für Attraktionen kostenlos sichern. Nach der COVID-19-Schließung 2020 wurde das System nicht reaktiviert und Ende 2021 durch das kostenpflichtige Lightning Lane ersetzt. In älteren Reiseberichten taucht der Begriff noch häufig auf.',
    aliases: ['FastPass Plus'],

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
      'Eine Rückkehrzeit (oder Returntime) ist ein festes Zeitfenster, meist eine Stunde, in dem Besucher mit gebuchtem Vorrangzugang (über Lightning Lane, virtuelle Warteschlange oder ähnliche Systeme) am eigenen Eingang der Attraktion einsteigen können. Bis dahin kann man sich woanders im Park aufhalten, statt anzustehen. Wer das Zeitfenster und die kurze Toleranzzeit danach verpasst, verliert die Reservierung. park.fan zeigt Live-Wartezeiten und Besucherdichte neben den Rückkehrzeiten eines Parks.',
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
      'Eine Inversion ist jedes Element, bei dem die Strecke die Fahrgäste über die Senkrechte hinaus dreht, also zumindest teilweise auf den Kopf stellt. Häufige Inversionen sind Looping, Cobra Roll, Korkenzieher, Immelmann, Dive Loop, Inline Twist, Heartline Roll und Zero-G Roll. Viele moderne Achterbahnen haben sechs bis vierzehn davon. In einer Inversion wirken positive G-Kräfte (am unteren Ende eines Loopings) und negative G-Kräfte (am Scheitelpunkt).',
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
      'Der Looping (englisch: Vertical Loop) ist ein vollständiger 360-Grad-Kreis in der Senkrechten und die bekannteste Inversion. Moderne Loopings haben statt eines reinen Kreises eine Klothoiden-Form (Tropfenform) mit weiter Ein- und Ausfahrt und enger Spitze. So bleiben die G-Kräfte gleichmäßig, ohne harte Spitzen. Der erste moderne Loop-Coaster (Corkscrew, Knott’s Berry Farm, 1975) setzte das Format durch. Heute haben kleine Einsteigerbahnen ebenso einen Looping wie Rekordbahnen.',
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
      'Der Immelmann besteht aus zwei Teilen. Zuerst steigt die Strecke als halber Looping auf, die Fahrgäste sind kurz über Kopf. Dann richtet eine halbe Rolle den Zug wieder auf, und er fährt in die Gegenrichtung weiter. Benannt ist das Element nach Max Immelmann, einem Jagdflieger des Ersten Weltkriegs, der eine ähnliche Flugfigur entwickelte. Der Immelmann findet sich auf nahezu jeder Sitzachterbahn, jedem Inverted Coaster und jedem Hypercoaster von B&M.',
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
      'Ein Launch Coaster (Katapultachterbahn) hat statt des Kettenlifts einen Antrieb, der den Zug in wenigen Sekunden von 0 auf Höchstgeschwindigkeit bringt. Beim LSM (Linear Synchronous Motor) beschleunigen elektromagnetische Spulen eine Lamelle am Zug. Der LIM (Linear Induction Motor) arbeitet ähnlich, aber weniger effizient. Der Hydraulik-Launch ist Intamins kolbengetriebenes Seilsystem für Rekordbahnen wie Kingda Ka. Dazu kommen Druckluft-Launches. Manche Bahnen haben mehrere Launches im Streckenverlauf.',
    alternateNames: [
      'LSM Coaster',
      'LIM Coaster',
      'Katapultbahn',
      'Launcher',
      'Katapultachterbahn',
    ],

    relatedTermIds: ['horseshoe', 'intamin', 'lifthill', 'top-hat'],
    aliases: ['Launch Coasters', 'Abschuss-Coaster'],
  },
  {
    id: 'wooden-coaster',
    name: 'Holzachterbahn',
    shortDefinition:
      'Eine Achterbahn, die überwiegend aus Holz gebaut ist. Sie rumpelt, schaukelt seitlich, und ihre Airtime fällt bei jeder Fahrt etwas anders aus.',
    definition:
      'Eine Holzachterbahn ist eine Bahn mit hölzerner Strecke und hölzernem Gerüst. Holz gibt nach und lässt sich nicht so genau verbauen wie Stahl. Daher kommen das Rumpeln, das seitliche Schaukeln und die Airtime, die sich nicht genau vorhersagen lässt. Beispiele sind Balder in Liseberg, Colossos im Heide-Park und Wodan im Europa-Park. Holzachterbahnen brauchen viel Wartung, das Schienenprofil muss regelmäßig erneuert werden. Mit dem Umbauverfahren von RMC (Rocky Mountain Construction) werden alte Holzachterbahnen zu Hybrid Coastern: Das Holzgerüst bleibt, die Schiene wird aus Stahl.',
    relatedTermIds: ['airtime', 'hybrid-coaster', 'quad-down', 'rattle', 'rmc'],
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
      'Beim Suspended Coaster hängt der Zug an einem Drehpunkt unter der Schiene und kann seitlich frei schwingen. In einer Kurve pendelt er nach außen und schlägt am Ausgang zurück, auf Englisch heißt das „whip“. Beim Inverted Coaster ist der Zug dagegen starr an der Schiene befestigt.\n\nSuspended Coasters sind seltener als Inverted Coasters. Schon in einer mäßigen Kurve schwingt der Wagen weit aus, und wie weit, ist nicht bei jeder Fahrt gleich. Vekoma entwickelte in den 1990er Jahren den Suspended Looping Coaster (SLC), von dem weltweit hunderte gebaut wurden.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'vekoma'],
    alternateNames: ['Suspended Coaster', 'Hängende Achterbahn', 'Schwingende Achterbahn'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Hybrid Coaster',
    shortDefinition:
      'Eine Achterbahn mit Holzgerüst und einer genau gefertigten Stahlschiene (I-Box), entwickelt von Rocky Mountain Construction (RMC).',
    definition:
      'Ein Hybrid Coaster hat das Holzgerüst einer klassischen Holzachterbahn und eine I-Box-Schiene aus Stahl von Rocky Mountain Construction (RMC). Die I-Box-Schiene wird sehr genau gefertigt, damit sind Inversionen möglich, die auf einer Holzschiene nicht gehen. RMC entwickelte das System vor allem, um alte Holzachterbahnen zu sanieren, die zu rau gefahren waren. Beim Umbau kommen Inversionen, steilere Abfahrten und Airtime-Hügel dazu. Beispiele sind Steel Vengeance in Cedar Point, Untamed in Walibi Holland und Wildfire im Kolmården Zoo.',
    aliases: ['Hybrid-Achterbahnen'],
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
      'Intamin AG ist ein 1967 gegründeter Schweizer Hersteller von Fahrgeschäften, auf den mehrere Höhen- und Geschwindigkeitsrekorde bei Achterbahnen zurückgehen. Sein hydraulischer Launch trieb jahrelang die schnellsten und höchsten Coaster der Welt an (Kingda Ka, 139 m; Top Thrill Dragster). Intamin baut außerdem Mega- und Gigacoaster (Millennium Force in Cedar Point), Multi-Launch-Coaster, Wasserbahnen und Dark Rides. In Europa stehen unter anderem Taron im Phantasialand, Expedition GeForce im Holiday Park und Red Force in Ferrari Land.',
    relatedTermIds: ['b-and-m', 'launch-coaster', 'mack-rides', 'top-hat'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      'Deutsches Familienunternehmen aus Waldkirch nahe dem Europa-Park, das Wasserbahnen, Dark Rides und immer mehr große Stahlachterbahnen baut.',
    definition:
      'Mack Rides ist ein deutscher Hersteller von Fahrgeschäften aus Waldkirch in Baden-Württemberg, wenige Kilometer vom Europa-Park entfernt, der ebenfalls der Familie Mack gehört. Die 1921 gegründete Firma baut Wasserbahnen, Dark Rides (darunter Disney’s Test Track und Radiator Springs Racers) und immer mehr große Achterbahnen. Blue Fire Megacoaster im Europa-Park (2009) war die erste Bahn mit einem Stengel Dive. Zu Macks neueren Hypercoastern gehören Ride to Happiness im Plopsaland und Kondaa in Walibi Belgien.',
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
      'Rocky Mountain Construction (RMC) ist ein amerikanischer Achterbahn-Hersteller aus Hayden, Idaho, der das I-Box-Stahlschienensystem für Holzgerüste erfunden hat. Parks können damit alte, rumpelnde Holzachterbahnen zu Hybrid Coastern umbauen lassen, mit starker Airtime, Inversionen und Überkopf-Abfahrten. Zu den RMC-Umbauten gehören Steel Vengeance (Cedar Point), Untamed (Walibi Holland) und Wildfire (Kolmården Zoo).',
    alternateNames: ['Rocky Mountain Construction'],

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
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      'Niederländischer Achterbahn-Hersteller, einer der größten der Welt. Von Vekoma stammen der Boomerang, der weltweit in sehr vielen Parks steht, und viele Familien- und Thrill-Coaster in Europa.',
    definition:
      'Vekoma Rides Manufacturing ist ein niederländischer Achterbahn-Hersteller mit Sitz in Vlodrop und hat nach Zahl der Anlagen mehr gebaut als fast jeder andere Hersteller. Die Firma wurde 1926 als Maschinenbauunternehmen gegründet und stieg in den 1970er Jahren auf Fahrgeschäfte um. Bekannt wurde Vekoma mit dem Boomerang, einem kompakten Shuttle-Coaster mit drei Inversionen, der günstig lizenziert und weltweit aufgestellt wurde. Weitere verbreitete Modelle sind der Suspended Looping Coaster (SLC), der Giant Inverted Boomerang und der Mine Train. Seit den 2010er Jahren baut Vekoma eine neue Produktlinie („New Generation“) mit ruhiger laufenden Zügen, neuen Layouts und überarbeiteten Familienbahnen. Modelle wie der Family Boomerang, der Tilt Coaster und hängende Familiencoaster stehen inzwischen in vielen europäischen Parks. Auch Disney hat eigens entworfene Vekoma-Anlagen für seine Resorts bestellt.',
    alternateNames: ['Vekoma Rides'],

    relatedTermIds: ['b-and-m', 'boomerang', 'gerstlauer', 'intamin', 'single-rail-coaster'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Deutscher Hersteller des Euro-Fighter mit seiner überhängenden Abfahrt, dazu von Spinning Coastern und kompakten Familienbahnen.',
    definition:
      'Gerstlauer Amusement Rides GmbH ist ein deutscher Achterbahn-Hersteller aus Münsterhausen in Bayern. Die Firma wurde 1946 als metallverarbeitender Betrieb gegründet, stieg in den 1980er Jahren in den Bau von Fahrgeschäften ein und wurde mit dem Euro-Fighter bekannt, einem kompakten Coaster mit senkrechtem Kettenlift und einer Abfahrt von bis zu 97 Grad. Ein Euro-Fighter braucht wenig Platz und passt deshalb auch in Stadtparks und kleinere Anlagen, etwa Rage in Adventure Island und Speed in Oakwood. Gerstlauer baut außerdem den Infinity Coaster, Spinning Coaster und den SkyRoller, bei dem die Fahrgäste die Drehung ihres Sitzes selbst steuern.',
    alternateNames: ['Gerstlauer Rides'],

    relatedTermIds: [
      'b-and-m',
      'beyond-vertical-drop',
      'euro-fighter',
      'intamin',
      'spinning-coaster',
      'xtreme-spinning-coaster',
    ],
  },
  {
    id: 'schwarzkopf',
    name: 'Schwarzkopf',
    shortDefinition:
      'Deutscher Hersteller, dessen Looping-Achterbahnen aus den 70er und 80er Jahren noch heute in europäischen Parks fahren, meist sehr ruhig.',
    definition:
      'Anton Schwarzkopf GmbH & Co. KG war ein deutscher Achterbahn-Hersteller aus Münsterhausen in Bayern, wo heute Gerstlauer sitzt. Das 1954 von Anton Schwarzkopf gegründete Unternehmen war maßgeblich daran beteiligt, Looping-Achterbahnen nach Europa zu bringen. Die erste moderne Looping-Achterbahn der Welt war Revolution in Six Flags Magic Mountain (1976), ein Schwarzkopf-Design. Zu den bekanntesten Modellen gehören der Looping Star, der Thriller/Wildcat und der transportable Looping Coaster, der durch ganz Europa tourte. Schwarzkopf-Bahnen fahren sehr ruhig und kommen mit kompakten Layouts aus. Nach der Insolvenz 1983 blieben viele Anlagen über Jahrzehnte in Betrieb. Heute übernehmen Spezialfirmen oder Gerstlauer (das einige Werkzeuge übernahm) die Wartung.',
    relatedTermIds: ['b-and-m', 'gerstlauer', 'intamin', 'vekoma'],
  },
  {
    id: 'lifthill',
    name: 'Lifthill',
    shortDefinition:
      'Der mechanisch angetriebene Aufstieg einer Achterbahn, der den Zug auf den höchsten Punkt bringt und dabei Lageenergie für die restliche Fahrt aufbaut.',
    definition:
      'Der Lifthill ist der Abschnitt, auf dem ein Antrieb, meist eine Kette in der Gleismitte, den Zug vom Boden auf den höchsten Punkt der Bahn zieht. Das bekannte „Klack-klack-klack“ kommt von der Rückrollsperre. Statt einer Kette gibt es auch Seillifte (leiser und ruhiger), Reibrollenlifte (bei manchen modernen B&M-Coastern) und magnetische Antriebe. Die Höhe des Lifthills bestimmt, wie schnell die Bahn höchstens werden kann. Manche Bahnen haben mehrere Lifthills oder kombinieren einen Lift mit Launches. Meist ist der Lifthill der langsamste Teil der Fahrt.',
    aliases: ['Lifthills'],
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
      'Der Cobra Roll ist ein B&M-Element aus zwei Inversionen kurz hintereinander. Die Strecke steigt als halber Looping auf, dreht am Scheitelpunkt in einer kurzen Überkopf-Passage um 180 Grad, wiederholt die Folge gespiegelt und verlässt das Element in der ursprünglichen Fahrtrichtung. Von der Seite gleicht der Streckenverlauf dem aufgerichteten, gespreizten Kopf einer Kobra. Cobra Rolls haben Dragon Khan in PortAventura und viele B&M-Inverted-Coaster.',
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
      'Ein Dive Loop (auch Dive Turn oder umgekehrter Immelmann) ist der Immelmann in umgekehrter Reihenfolge. Statt über einen Scheitelpunkt aufzusteigen, taucht die Strecke steil ab, beschreibt die untere Hälfte eines Loopings und verlässt ihn in der Gegenrichtung zur Einfahrt. Auf den steilen Sturz folgt beim Abfangen ein kräftiger Druck in den Sitz. B&M baut Dive Loops in viele seiner Inverted- und Sitzcoaster, oft zusammen mit Immelmanns im selben Layout.',
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
      'Ein halber Looping mit anschließendem halbem Korkenzieher, der die Strecke um 90 Grad dreht und die Fahrtrichtung ändert. Typisch für den Vekoma Boomerang.',
    definition:
      'Ein Sidewinder besteht aus einem halben Looping, der den Zug nach oben führt, und einem halben Korkenzieher, der ihn wieder aufrichtet und dabei um 90 Grad dreht. So entsteht auf wenig Raum eine Inversion mit deutlicher Richtungsänderung. Vekomas Boomerang ist aus Sidewindern aufgebaut: Zwei davon (einer vorwärts, einer gespiegelt) liegen vor und hinter einem Looping. Der Name spielt auf die schlangenartige Drehung des Elements an.',
    relatedTermIds: ['boomerang', 'cobra-roll', 'inversion'],
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
      'Beim Norwegian Loop (auch Reverse Loop oder umgekehrter Looping) ist die Form eines normalen Loopings umgedreht. Statt unten einzufahren, kommt der Zug von oben, taucht in den Kreis hinab und verlässt ihn wieder oben. Am Tiefpunkt des Kreises sind die G-Kräfte wie beim normalen Looping stark positiv. Norwegian Loops sind selten, man findet sie vor allem auf bestimmten Vekoma-Modellen und Einzelanfertigungen.',
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
      'Beim Stengel Dive neigt sich die Strecke auf einem Airtime-Hügel um mehr als 90 Grad, also über die Senkrechte hinaus. Die Fahrgäste hängen seitlich oder leicht kopfüber, und die Form des Hügels erzeugt zugleich negative G-Kräfte. Benannt ist das Element nach dem deutschen Ingenieur Werner Stengel, der es entwickelt hat. Stengel Dives findet man vor allem auf Hypercoastern von Mack Rides. Blue Fire Megacoaster im Europa-Park (2009) hatte als erste Bahn einen, spätere Bahnen wie Ride to Happiness und Kondaa haben das Element weiterentwickelt.',
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
      'Beim Top Hat steigt die Strecke fast senkrecht zu einer scharfen Kuppe auf und fällt auf der anderen Seite fast senkrecht wieder ab. Von der Seite sieht das aus wie ein Zylinderhut. Beim Inside Top Hat dreht sich die Strecke am Scheitelpunkt nach innen, beim Outside Top Hat nach außen, und die Fahrgäste haben die Airtime dort in Schräglage. Auf Intamins hydraulischen Launch Coastern (Accelerator Coaster) fährt der Zug nach dem Launch auf über 200 km/h direkt in den Top Hat. Die höchsten stehen bei Kingda Ka (139 m), Top Thrill Dragster (128 m) und Red Force in Ferrari Land.',
    relatedTermIds: ['first-drop', 'intamin', 'launch-coaster'],
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    shortDefinition:
      'Ein kompaktes Achterbahn-Modell von Vekoma. Der Zug fährt drei Inversionen erst vorwärts und dann rückwärts, zusammen sechs.',
    definition:
      'Der Boomerang von Vekoma ist eines der am häufigsten gebauten Achterbahn-Modelle. Das Layout hat drei Inversionen, einen Looping zwischen zwei Sidewindern. Der Zug fährt sie zuerst vorwärts, wird dann auf einen zweiten, schrägen Lift gezogen, dort losgelassen und fährt dieselben Elemente rückwärts. So kommt die Fahrt auf sechs Inversionen (drei in jede Richtung) und braucht sehr wenig Grundfläche, auch Parks mit wenig Platz können einen aufstellen. Weltweit wurden über 50 Boomerangs gebaut. In mittelgroßen Parks fahren viele davon bis heute als Einstiegsbahn.',
    relatedTermIds: ['inversion', 'sidewinder', 'vertical-loop'],
  },
  {
    id: 'euro-fighter',
    name: 'Euro-Fighter',
    shortDefinition:
      'Ein kompaktes Achterbahn-Modell von Gerstlauer. Nach einem senkrechten Kettenlift fällt die Strecke senkrecht oder überhängend ab.',
    definition:
      'Der Euro-Fighter ist Gerstlauers kompaktes Achterbahn-Modell. Nach einem senkrechten Kettenlift fällt die Strecke senkrecht (90 Grad) oder überhängend (bis zu 97 Grad) ab. Auf kleiner Grundfläche folgen mehrere Inversionen, enge Kurven und hohe G-Kräfte. Beim überhängenden Abfall (steiler als senkrecht) hält der Zug oben kurz an, und die Fahrgäste hängen über der Kante, bevor es hinuntergeht. Euro-Fighter in Europa sind etwa Saw – The Ride in Thorpe Park, Rage in Adventure Island und Fluch von Novgorod im Hansa-Park.',
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
      'ERT (Exclusive Ride Time, auf Deutsch auch EFZ, Exklusive Fahrzeit) ist ein Zeitraum, in dem nur eine bestimmte Gruppe eine oder mehrere Attraktionen fahren darf, meist Mitglieder eines Coaster-Clubs (etwa European Coaster Club oder Coasterfriends), Hotelgäste oder Jahrespass-Inhaber. Die Wartezeiten sind dann minimal, und viele Teilnehmer kommen in einer Session auf Dutzende Fahrten hintereinander.',
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
      'Beim Wing Coaster (auch Wing Rider) sitzen je zwei Fahrgäste links und rechts neben der Schiene, ohne Strecke oder Wagen über, unter oder neben sich. Die Strecke kann deshalb knapp an Kulissen und Bauteilen vorbeiführen. Die meisten Wing Coaster hat B&M gebaut. Europäische Beispiele sind Flug der Dämonen im Heide-Park und The Swarm in Thorpe Park. Die aktuellen Wartezeiten der Wing Coaster stehen bei park.fan auf der Seite des jeweiligen Parks.',
    alternateNames: ['Wing Coaster', 'Wing Rider', 'Wingcoaster', 'Flügelachterbahn'],

    relatedTermIds: ['b-and-m', 'dive-coaster', 'inverted-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition: 'Achterbahn mit frei drehbaren Wagen. Jede Fahrt verläuft etwas anders.',
    definition:
      'Ein Spinning Coaster (auch Drehachterbahn) hat Wagen, die sich frei um eine senkrechte Achse drehen. Weil niemand die Drehung steuert, fährt jeder Wagen eine andere Folge aus Vorwärts-, Rückwärts- und Seitwärtsfahrt. Die meisten baut Mack Rides aus Waldkirch, Modelle stehen etwa im Phantasialand, im Efteling und in Alton Towers. Viele Spinning Coaster sind Familienbahnen mit niedriger Mindestgröße.',
    alternateNames: ['Spinning Coaster', 'Spinner', 'Drehachterbahn'],

    relatedTermIds: ['credit', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'xtreme-spinning-coaster',
    name: 'Xtreme Spinning Coaster',
    shortDefinition:
      'Gerstlauers großes Spinning-Coaster-Modell. Es ist schneller und höher als ein normaler Spinning Coaster, und die Wagen drehen sich stärker.',
    definition:
      'Der Xtreme Spinning Coaster (XSC) ist das größte Spinning-Coaster-Modell von Gerstlauer. Ein normaler Spinning Coaster ist eher auf Familien ausgelegt. Der XSC ist größer, hat steilere Abfahrten und höhere Geschwindigkeiten, und sein Drehmechanismus lässt die Wagen stärker rotieren: Sie drehen sich in jedem Element schneller und öfter.\n\nWeil die Wagen bei höherem Tempo schneller die Richtung wechseln, fährt sich dieselbe Strecke von Fahrt zu Fahrt sehr unterschiedlich. Das Modell liegt zwischen den Spinning Coastern für Familien und großen Thrill-Coastern.',
    alternateNames: ['XSC'],
    relatedTermIds: ['credit', 'gerstlauer', 'spinning-coaster'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'Achterbahn mit mehr als 61 m Höhe, ohne Inversionen, mit hoher Geschwindigkeit und viel Airtime.',
    definition:
      'Hyper Coaster ist die Klasse der Achterbahnen zwischen 61 und 91 m Höhe. B&M nennt seine Modelle „Hyper Coaster“, Intamin sagt zu vergleichbaren Bahnen „Mega Coaster“. Beide haben statt Inversionen lange Airtime-Hügel, die mit hoher Geschwindigkeit befahren werden. Shambhala in PortAventura (76 m) und Hyperion in Energylandia (77 m) sind die höchsten Hyper Coaster Europas. Weitere Beispiele sind Goliath in Walibi Holland und Mako in SeaWorld Orlando.',
    aliases: ['Hyper Coasters'],
    alternateNames: ['Hyper Coaster', 'Mega Coaster', 'Mega-Achterbahn', 'Hypercoaster'],

    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'giga-coaster', 'intamin'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition: 'Achterbahn mit mehr als 91 m Höhe, die nächste Stufe über dem Hyper Coaster.',
    definition:
      'Giga Coaster ist die Klasse der Achterbahnen zwischen 91 und 121 m Höhe. Den Begriff prägten Cedar Fair und Intamin im Jahr 2000 für Millennium Force in Cedar Point. Giga Coaster sind sehr hoch, haben lange Strecken und starke Airtime. Ein Beispiel ist Fury 325 in Carowinds. In Europa gibt es bislang keinen echten Giga Coaster. Hyperion in Energylandia (Polen) ist mit 77 m ein Hyper Coaster.',
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
      'Eine Trim-Bremse ist eine Bremse an einer bestimmten Stelle der Strecke, die den Zug langsamer macht, ohne ihn wie eine Blockbremse anzuhalten. Parks setzen sie ein, um die G-Kräfte im weiteren Verlauf zu begrenzen, den Verschleiß zu senken oder Sicherheitsvorgaben einzuhalten. Bremst eine Trim den Zug vor einem Airtime-Hügel, ist die Airtime dort schwächer. Ob eine Trim bremst, hängt oft von Saison, Wetter und Beladung ab.',
    relatedTermIds: ['airtime', 'block-brake', 'brake-run'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      'Ein Launch Coaster schafft den höchsten Punkt nicht und rollt rückwärts auf die Abschussstrecke zurück.',
    definition:
      'Ein Rollback tritt auf, wenn ein Zug nach dem Launch zu langsam ist, um den höchsten Punkt der Strecke zu überwinden, und deshalb rückwärts auf die Abschussstrecke zurückrollt. Bei hydraulischen Launch Coastern (Top Thrill Dragster, Stealth) passiert das, wenn der Abschuss nicht die volle Kraft bringt. Am Tiefpunkt fangen Magnetbremsen den Zug auf. Rollbacks sind selten, kommen bei hydraulischen Launch Coastern aber immer wieder vor. Den Fahrgästen passiert dabei nichts, die Fahrt wird aber unterbrochen.',
    relatedTermIds: ['block-brake', 'downtime', 'launch-coaster'],
  },
  {
    id: 'animatronics',
    name: 'Animatronic',
    shortDefinition:
      'Elektromechanische Roboterfiguren in Themenfahrten und Shows, die sich bewegen und Figuren oder Szenen darstellen.',
    definition:
      'Animatronics (Singular: Animatronic, auch Animatronik) sind elektromechanische Roboterfiguren, die in Themenfahrten und Live-Shows Figuren möglichst echt darstellen. Disney prägte den Begriff „Audio-Animatronics“ 1964 auf der Weltausstellung. Es gibt einfache Figuren, die immer dieselbe Bewegung wiederholen, und Roboter mit Servo- und Pneumatikantrieb, die Gesichtsausdrücke zeigen und den ganzen Körper bewegen. Aufwendige Beispiele sind der Schamane in Disneys Pandora – The World of Avatar und die Dinosaurier der Jurassic-World-Fahrt bei Universal.',
    alternateNames: ['Animatronics', 'Audio-Animatronics', 'Roboterfigur'],

    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'KI-Prognose',
    shortDefinition:
      'KI-gestützte Vorhersagen für Besucherdichte und Wartezeiten in Freizeitparks, so weit ein Park seinen Zeitplan veröffentlicht hat.',
    definition:
      'Eine KI-Prognose nutzt Machine-Learning-Modelle, die mit historischen Besuchsdaten, Wetterdaten, Schulferienkalendern und Echtzeit-Warteschlangendaten trainiert wurden, um vorherzusagen, wie voll ein Freizeitpark oder eine einzelne Attraktion an einem bestimmten Tag oder zu einer bestimmten Stunde sein wird. park.fan erstellt KI-Prognosen für die Besucherdichte und die erwarteten Wartezeiten an jedem Tag, den ein Park schon veröffentlicht hat.\n\nDie Vorhersagen werden mit jedem Trainingslauf neu berechnet, täglich um 06:00 UTC. Prognosen für die nächsten 1–7 Tage sind genauer, weil dann aktuelle Wetterdaten, Veranstaltungsankündigungen und Buchungssignale einfließen. Langfristige Prognosen sind ungenauer, ruhige und volle Zeiträume lassen sich damit aber weit im Voraus erkennen.\n\nAnders als ein einfacher historischer Durchschnitt passt sich eine KI-Prognose an aktuelle Bedingungen an. Eine neu angekündigte Attraktion, ein Feiertag, der auf einen anderen Wochentag fällt als sonst, oder ein ungewöhnlich warmes Frühlingswochenende verschieben die Vorhersage deutlich gegenüber dem historischen Wert.',
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
      'Eine Echtzeit-Wartezeit ist die Wartezeit, die ein Freizeitpark gerade aus seinen Erfassungssystemen meldet, im Unterschied zum historischen Durchschnitt. park.fan ruft die Wartezeiten aus öffentlichen Quellen ab und aktualisiert sie alle fünf Minuten. So siehst du, welche Attraktion gerade leer ist und wo du 60 Minuten anstehen müsstest.',
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
      'Eine Crowd-Prognose (auch Besucherprognose) ist eine datengestützte Vorhersage, wie voll ein Freizeitpark an einem bestimmten Tag oder zu einer bestimmten Uhrzeit sein wird. park.fan berechnet Crowd-Prognosen täglich neu auf Basis historischer Besuchszahlen, Schulferienkalender, Wetterdaten und Sonderveranstaltungen. Die Ergebnisse gehen direkt in den Besucherkalender ein. Grün steht dort für kurze Warteschlangen, Rot für Spitzenbetrieb mit langen Wartezeiten.',
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-level', 'peak-day'],
    alternateNames: ['Besucherprognose', 'Besucherprognosen'],
    aliases: ['Crowd-Prognose', 'Crowd-Prognosen', 'Besucherprognose', 'Besucherprognosen'],
  },
  {
    id: 'opening-hours',
    name: 'Öffnungszeiten',
    shortDefinition:
      'Der offizielle Tagesplan mit den Öffnungs- und Schließzeiten eines Freizeitparks oder einer Attraktion.',
    definition:
      'Die Öffnungszeiten sind der veröffentlichte Tagesplan eines Freizeitparks oder einer einzelnen Attraktion. Sie geben an, wann der Einlass beginnt und wann der Betrieb endet. Die meisten großen Parks veröffentlichen ihren Plan fortlaufend Wochen oder Monate im Voraus, die Zeiten können sich aber kurzfristig ändern, etwa wegen Sonderveranstaltungen, saisonaler Anpassungen oder betrieblicher Probleme.\n\npark.fan zeigt die Öffnungszeiten für jeden Park an. Zeiten mit dem Zusatz „Est.“ (Estimated, geschätzt) sind aus früheren Mustern abgeleitet und vom Park nicht offiziell bestätigt. Vor einem Besuch sollte man sie nachprüfen.\n\nWer zur Öffnung da ist, findet kürzere Warteschlangen, bevor der Park sich füllt. In Parks, die spät schließen, werden die Wartezeiten in der letzten Betriebsstunde oft noch einmal kürzer.',
    alternateNames: ['Betriebszeiten', 'Park-Öffnungszeiten'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Trend',
    shortDefinition:
      'Wie sich die Länge der Warteschlange in den letzten 30 Minuten entwickelt hat: steigend, fallend oder stabil.',
    definition:
      'Der Trend gibt an, ob die Warteschlange einer Attraktion im Vergleich zu vor 30 Minuten länger, kürzer oder gleich lang ist. park.fan stellt ihn als Pfeil dar: aufwärts (Warteschlange wächst), abwärts (Warteschlange schrumpft) oder waagerecht (stabil).\n\nOft hilft der Trend mehr als die Wartezeit allein. Eine Attraktion mit 45 Minuten und fallendem Trend ist die bessere Wahl als eine mit 40 Minuten und stark steigendem Trend. Bis man ankommt, kann die erste Warteschlange auf 30 Minuten gesunken sein und die zweite schon bei 55 Minuten liegen.\n\nAm meisten nützt der Trend am späten Vormittag und frühen Nachmittag, wenn sich die Besucher schnell im Park verteilen.',
    alternateNames: ['Queue Trend', 'Wait Trend'],

    relatedTermIds: ['crowd-level', 'posted-wait-time', 'wait-time'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Eine Themenfahrt ohne feste Schiene. Die Fahrzeuge fahren frei durch den Raum und werden über Technik im Boden geführt.',
    definition:
      'Ein Trackless Ride (schienenlose Themenfahrt) ist ein Dark Ride ohne feste Schiene. Die Fahrzeuge fahren selbstständig durch die Halle und werden über Induktionsschleifen, WLAN oder Lasertechnik im Boden geführt. Sie können sich drehen, im Kreis fahren und eine Szene aus verschiedenen Winkeln anfahren, und nicht jedes Fahrzeug nimmt denselben Weg. Beispiele sind Star Wars: Rise of the Resistance (Disney), Ratatouille: L’Aventure Totalement Toquée de Rémy (Disneyland Paris) und Symbolica (Efteling, Niederlande).',
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
      'Grauzone nennen Coaster-Fans Elemente, die an der Grenze zwischen Inversion und Nicht-Inversion liegen. Bei klassischen Inversionen wie Looping oder Korkenzieher ist die Sache klar, der Fahrgast ist vollständig kopfüber. Grauzone-Elemente erreichen die 180 Grad knapp oder gar nicht, bringen die Fahrgäste aber fast in Überkopflage.\n\nTypische Grauzone-Elemente sind Stalls (eine gehaltene Überkopflage ohne vollständige Drehung), stark übergeneigte Kurven (Overbanks über 90 Grad) und bestimmte Varianten des Wave Turn. RMC und Intamin setzen sie gezielt anstelle klassischer Inversionen ein. Je nachdem, ob man streng (nur vollständige Drehungen) oder weit (alle Überkopflagen) zählt, kommt eine Bahn auf eine andere offizielle Inversionszahl.',
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
      'Seitliche G-Kräfte (Laterals) entstehen, wenn eine Achterbahn in der Waagerechten die Richtung ändert, also in geneigten und ungeneigten Kurven, Helices und Richtungswechseln. Sauber eingeleitete Laterals drücken den Fahrgast gleichmäßig zur Seite. Raue Laterals werfen ihn gegen den Bügel oder die Seitenlehne, das ist unangenehm und tut oft weh.\n\nMan unterscheidet gewollte, gleichmäßige Laterals, etwa in den weiten, flachen Kurven einer klassischen Holzachterbahn, von harten, ungewollten durch abgenutzte Schienen oder schlechte Konstruktion. Holzachterbahnen haben besonders viele Laterals, weil die Schiene Spiel hat und viele Kurven kaum geneigt sind. Gleichmäßige Laterals in Helix-Abschnitten hat zum Beispiel Balder in Liseberg.',
    relatedTermIds: ['airtime', 'g-force', 'helix', 'wooden-coaster'],
    alternateNames: ['Lateral G', 'Lateral-G-Kräfte', 'Laterale G-Kräfte'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Starke negative G-Kräfte, die Fahrgäste schlagartig aus dem Sitz heben. Nur der Schoßbügel hält sie.',
    definition:
      'Ejector Airtime ist die stärkste Form negativer G-Kräfte. Die Strecke fällt hinter der Kuppe so abrupt steiler ab als die Flugbahn im freien Fall, dass die Fahrgäste schlagartig aus dem Sitz gehoben werden und nur der Schoßbügel sie im Wagen hält. Der Name kommt vom englischen „eject“ (auswerfen). Floater Airtime ist dagegen ein sanftes, langes Schweben, Ejector Airtime kommt kurz und plötzlich.\n\nEjector Airtime haben vor allem RMC-Hybride, bestimmte Intamin-Hyper-Coaster und moderne Holzachterbahnen mit steilen, parabelförmigen Hügeln. Beispiele mit viel Ejector Airtime sind Untamed in Walibi Holland, Wildfire in Kolmården und Steel Vengeance in Cedar Point.',
    relatedTermIds: ['airtime', 'airtime-hill', 'floater-airtime', 'g-force', 'rmc'],
    alternateNames: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      'Schwache, länger anhaltende negative G-Kräfte, bei denen die Fahrgäste über einer Kuppe schweben.',
    definition:
      'Floater Airtime ist die schwache Form negativer G-Kräfte. Fährt der Zug auf einem flachen Parabelbogen über einen Hügel, heben die Fahrgäste leicht aus dem Sitz ab und schweben eine Weile. Die Kraft liegt meist bei etwa −0,1G bis −0,3G. Wem Ejector Airtime zu heftig ist, der kommt mit Floater Airtime oft gut zurecht.\n\nTypisch ist Floater Airtime für B&M-Hyper- und Giga-Coaster mit großen, sanft gerundeten Hügeln. Europäische Beispiele mit langen Floater-Abschnitten sind Shambhala in PortAventura, Silver Star im Europa-Park und Goliath in Walibi Holland.',
    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'ejector-airtime', 'g-force'],
    alternateNames: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      'Das Hängen im Rückhaltesystem, wenn ein Zug kopfüber langsam wird und negative G-Kräfte wirken.',
    definition:
      'Hangtime entsteht, wenn ein Zug am höchsten Punkt einer Inversion so lange bleibt, dass negative G-Kräfte wirken. Die Fahrgäste hängen dann kopfüber im Rückhaltesystem. In einem schnellen Looping ist man nur kurz kopfüber, bei Hangtime wird der Zug nahe dem Scheitelpunkt langsamer, und das Hängen dauert deutlich länger. Das ganze Körpergewicht liegt dann im Schulter- oder Schoßbügel.\n\nAm stärksten ist Hangtime bei Elementen, in denen der Zug kopfüber stark abbremst. Das klassische Beispiel ist der Pretzel Loop auf Flying Coastern, wo der Zug in voller Überkopflage so langsam ist, dass die negativen G-Kräfte anhalten. Auch der Heartline Roll mancher moderner Bahnen kann Hangtime haben.',
    relatedTermIds: ['airtime', 'g-force', 'heartline-roll', 'inversion', 'pretzel-loop'],
    alternateNames: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Achterbahn-Element',
    shortDefinition:
      'Ein benannter Streckenabschnitt einer Achterbahn, z. B. Looping, Airtime-Hügel oder Inversion.',
    definition:
      'Ein Achterbahn-Element ist ein abgegrenzter Teil der Strecke mit eigenem Namen. Dazu gehören Inversionen wie Looping und Korkenzieher, aber auch Elemente ohne Überschlag wie Airtime-Hügel, Helices und übergeneigte Kurven (Overbanks). Jedes Element ist auf eine bestimmte Wirkung auf den Körper ausgelegt, etwa Schwerelosigkeit (Airtime), seitliche G-Kräfte oder eine Überkopflage. Hersteller und Fans benutzen die Namen, um Bahnen zu beschreiben und zu vergleichen.\n\nDas park.fan-Wörterbuch erklärt Dutzende davon, darunter First Drop und Lifthill und neuere Formen wie Stengel Dive, Norwegian Loop und Heartline Roll.',
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
      'Aus der ersten Reihe eines Achterbahnzugs sieht man frei nach vorn, viele Gäste wollen deshalb dort sitzen. Auf Hyper- und Gigacoastern haben Fahrgäste in der ersten Reihe am ersten Drop starke Airtime und sehen die Abfahrt kommen, bevor es hinuntergeht.\n\nAuf vielen Achterbahnen gibt es für die erste Reihe eine eigene Warteschlange, manche Parks verkaufen Express-Plätze nur für diese Reihe. Die Wartezeit ist dort länger. Wer die Bahn zum ersten Mal fährt, für den lohnt sie sich oft.',
    relatedTermIds: ['airtime', 'back-row', 'first-drop', 'middle-row'],
  },
  {
    id: 'back-row',
    name: 'Letzte Reihe',
    shortDefinition:
      'Die letzte Reihe eines Fahrgeschäfts. Auf Bahnen mit vielen Airtime-Hügeln hat sie die stärkste Ejector Airtime.',
    definition:
      'Über jede Airtime-Kuppe hebt es die Fahrgäste in der letzten Reihe eines Achterbahnzugs am stärksten aus dem Sitz, nur die Bügel halten sie (Ejector Airtime). Auf Bahnen mit vielen Hügeln wiederholt sich das an jedem.\n\nAuf Coastern wie Goliath oder Shambhala ist die Airtime deshalb hinten am stärksten. Auf älteren Achterbahnen fährt die letzte Reihe dafür oft rauer, und vor steilen Abfahrten sieht man von hinten den Zug statt der Tiefe.',
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
      'Ein Fahrwagen (auch Auto oder Wagen) ist ein einzelnes Glied eines Achterbahnzugs, in dem die Fahrgäste sitzen. Ein typischer Zug besteht aus mehreren gekoppelten Wagen mit jeweils einer oder mehreren Sitzreihen. Größe, Sitze und Bügelform legt der Hersteller fest, und sie bestimmen mit, wie bequem die Fahrt ist und wie viel man von den Kräften spürt.\n\nDie Wagen unterscheiden sich stark. Auf Hypercoastern sind sie schlank und niedrig, damit der Luftwiderstand klein bleibt, auf Inverted Coastern hängen die Fahrgäste unter der Schiene, auf Wing Coastern sitzen sie seitlich mit nichts unter sich. Wie ruhig eine Bahn fährt, hängt stark von den Wagen ab, die Hersteller wie B&M, Intamin und Mack dafür bauen. Am Hersteller lässt sich deshalb oft ablesen, wie bequem die Sitze sind, wie die Bügel schließen und welche G-Kräfte zu erwarten sind.',
    relatedTermIds: ['back-row', 'front-row', 'lap-bar', 'shoulder-harness'],
  },
  {
    id: 'lap-bar',
    name: 'Schoßbügel',
    shortDefinition:
      'Ein waagerechter Sicherheitsbügel über dem Schoß, mit dem man sich freier bewegen kann als mit einem Schulterbügel.',
    definition:
      'Ein Schoßbügel ist ein waagerechter Sicherheitsbügel, der Fahrgäste über den Oberschenkeln festhält. Ein Schulterbügel umschließt den ganzen Oberkörper, mit einem Schoßbügel bleibt der Oberkörper frei. Schoßbügel sind Standard auf modernen Hypercoastern, Gigacoastern und vielen Stahl- und Holzachterbahnen. Bei Airtime heben die Fahrgäste damit ein Stück vom Sitz ab und spüren den Abstand deutlich.\n\nAuf Airtime-Bahnen ist die Airtime mit Schoßbügel am stärksten zu spüren. Bei bestimmten Körperformen kann er aber unbequem sein. Moderne Schoßbügel sind deutlich bequemer als frühere. Auf Achterbahnen mit starken Seitenkräften kann ein Schoßbügel leicht vor- und zurückgleiten.',
    relatedTermIds: ['airtime', 'restraint-freedom', 'ride-cart', 'shoulder-harness'],
  },
  {
    id: 'shoulder-harness',
    name: 'Schulterbügel',
    shortDefinition:
      'Ein Sicherheitsbügel über beiden Schultern, der den Oberkörper umschließt und die Bewegung einschränkt.',
    definition:
      'Ein Schulterbügel wird über beide Schultern bis auf den Schoß heruntergezogen und umschließt den Oberkörper. Auf Achterbahnen der 1980er und 2000er Jahre waren Schulterbügel Standard, verbreitet sind sie bis heute auf Inverted Coastern, manchen Suspended Coastern und Familienbahnen. Moderne Bügel rasten mit einer Ratsche in mehreren Stufen ein.\n\nAuf einer Airtime-Bahn hält ein Schulterbügel die Fahrgäste enger im Sitz, sie heben weniger ab. Die Hersteller nehmen die schwächere Airtime bewusst für mehr Sicherheit in Kauf. Ängstlichen Fahrgästen gibt ein Schulterbügel oft mehr Halt.',
    relatedTermIds: ['airtime', 'lap-bar', 'restraint-freedom', 'ride-cart'],
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    id: 'souvenir',
    name: 'Andenken',
    shortDefinition:
      'Ein Erinnerungsstück, das man im Freizeitpark kauft, um sich an den Besuch zu erinnern.',
    definition:
      'Ein Andenken ist ein Gegenstand, den Besucher kaufen, um sich an ihren Parkbesuch zu erinnern, etwa Merchandise, Kleidung oder ein Sammelobjekt. Häufige Andenken sind T-Shirts mit Park-Logo, Kappen, Pins, Postkarten, Plüschtiere und Sammelfiguren zu einzelnen Themen.\n\nFreizeitparks verdienen an Andenken gut, die Aufschläge liegen typischerweise beim 2- bis 3-Fachen. Parks richten gezielt Fotopunkte ein, die zu Spontankäufen führen sollen. Limitierte oder saisonale Andenken sollen zum schnellen Kauf bewegen, und Artikel, die es nur im Park gibt, kosten mehr. Manche Gäste sammeln Andenken aus vielen Parks.',
    relatedTermIds: ['gift-shop', 'merchandise', 'park-exclusive'],
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    shortDefinition:
      'Offizielle Produkte und Waren eines Freizeitparks, einschließlich Kleidung, Sammelobjekte und thematische Artikel.',
    definition:
      'Merchandise sind alle Waren, die ein Freizeitpark verkauft: Markenkleidung (T-Shirts, Hoodies, Kappen), Sammelobjekte (Pins, Figuren, Plüschtiere) und Artikel zu einzelnen Themen. Große Parks verkaufen sie in Dutzenden Läden, an Verkaufswagen und in eigenen Boutiquen. Merchandise macht oft 15–25 % der Ausgaben eines Besuchers aus.\n\nParks setzen auf limitierte Saisonartikel, Merchandise zu bekannten Filmen und Marken, Designs, die es nur im Park gibt, und Sonderauflagen zu neuen Attraktionen. Viele Parks werten aus, welche Artikel sich am schnellsten verkaufen und in sozialen Medien am meisten geteilt werden. Manche Fans sammeln Merchandise, und für seltene, ausverkaufte Stücke gibt es einen Wiederverkaufsmarkt.',
    relatedTermIds: ['gift-shop', 'park-exclusive', 'souvenir'],
    alternateNames: ['Merch'],
  },
  {
    id: 'gift-shop',
    name: 'Geschenkeladen',
    shortDefinition:
      'Ein Einzelhandelsladen in einem Freizeitpark, der Andenken und Merchandise verkauft.',
    definition:
      'Ein Geschenkeladen ist ein Laden im Freizeitpark für Andenken und Themenartikel, entweder zentral gelegen oder in einem Themenbereich. Große Parks haben Dutzende davon, vom kleinen Verkaufswagen bis zum großen Kaufhaus. Die Läden liegen dort, wo viele Menschen vorbeikommen: am Ausgang von Attraktionen, in Hotelfluren, am Ein- und Ausgang des Parks.\n\nEingang, Dekoration und Warenplatzierung sind auf den Verkauf ausgelegt. Bei vielen Attraktionen führt der Ausgang direkt durch einen Laden, damit Gäste spontan kaufen. Immer mehr Parks verkaufen lizenzierte Artikel zu Filmen und Marken zu hohen Preisen. Läden für Sammler in teuren Resorts verkaufen exklusive Stücke zu deutlich höheren Preisen.',
    relatedTermIds: ['merchandise', 'park-exclusive', 'souvenir'],
  },
  {
    id: 'park-exclusive',
    name: 'Parkexklusiv',
    shortDefinition: 'Ein Produkt, das es nur in einem bestimmten Freizeitpark zu kaufen gibt.',
    definition:
      'Parkexklusive Artikel gibt es nur in einem bestimmten Park oder bei einem Parkbetreiber zu kaufen. Weil sie anderswo nicht zu haben sind, kaufen Gäste sie eher spontan, und die Parks können 2- bis 3-mal so hohe Margen verlangen. Häufige Exklusivartikel sind limitierte Kleidung, Sammel-Pins, Artikel zu neuen Attraktionen und besondere Süßigkeiten oder Snacks.\n\nWer weit gereist ist und viel Eintritt bezahlt hat, kauft eher etwas, das es zu Hause nicht gibt. Begehrte, limitierte Stücke werden im Wiederverkauf teurer gehandelt als im Park. Auf der Verpackung steht deshalb oft groß „Park Exklusiv“. In Foren und sozialen Medien wird viel über die seltensten Stücke diskutiert.',
    relatedTermIds: ['gift-shop', 'merchandise', 'souvenir'],
  },
  {
    id: 'flying-coaster',
    name: 'Flying Coaster',
    shortDefinition: 'Achterbahn, bei der die Fahrgäste liegend transportiert werden.',
    definition:
      'Auf einem Flying Coaster liegen die Fahrgäste waagerecht auf dem Bauch, wie beim Fliegen. In der Station sitzen sie noch, vor der Fahrt schwenken die Sitze in die Waagerechte. Beispiele sind die B&M-Bahnen Manta (SeaWorld Orlando) und Tatsu (Six Flags Magic Mountain).',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster'],
    alternateNames: ['Flying Coaster', 'Flyer', 'Superman-Ride', 'prone coaster'],
  },
  {
    id: 'mine-train',
    name: 'Mine Train',
    shortDefinition: 'Familien-Stahlachterbahn im Thema eines Minenzuges.',
    definition:
      'Ein Mine Train Coaster ist eine Familien-Stahlachterbahn, die als durchgegangener Grubenzug gestaltet ist. Er fährt meist mäßig schnell, mit kleinen Abfahrten und engen Kurven durch gestaltete Tunnel und Felsen. Fahren können ihn fast alle Altersgruppen. Beispiele sind Big Thunder Mountain Railroad (Disney Parks) und Gold Rush (Plopsaland).',
    relatedTermIds: ['powered-coaster', 'steel-coaster', 'themed-land'],
    alternateNames: ['Mine Train', 'Minenzug', 'Mine Coaster', 'Familienachterbahn'],
  },
  {
    id: 'terrain-coaster',
    name: 'Terrain Coaster',
    shortDefinition: 'Achterbahn, deren Strecke dem natürlichen Gelände folgt.',
    definition:
      'Ein Terrain Coaster folgt dem Gelände, also Hügeln, Tälern und Schluchten, und braucht deshalb weniger Gerüst. Weil die Strecke dicht über dem Boden verläuft, wirkt die Fahrt schneller. Klassische Beispiele sind The Beast (Kings Island) und Ravine Flyer II (Waldameer).',
    relatedTermIds: ['airtime', 'alpine-coaster', 'steel-coaster', 'wooden-coaster'],
    alternateNames: ['Terrain Coaster', 'Landschaftsachterbahn'],
  },
  {
    id: 'floorless-coaster',
    name: 'Floorless Coaster',
    shortDefinition: 'Stahlachterbahn ohne Boden, bei der die Beine frei hängen.',
    definition:
      'Bei einem Floorless Coaster klappt der Wagenboden weg, sobald die Fahrgäste gesichert sind, sodass die Beine frei über dem Schienenstrang hängen. Anders als beim Inverted Coaster verläuft die Schiene unter dem Wagen. Die erste Bahn dieser Bauart war Medusa von B&M (1999). Ein europäisches Beispiel ist Goliath (Walibi Holland).',
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
    shortDefinition: 'Amerikanischer Achterbahnhersteller und Erfinder der modernen Loopingbahn.',
    definition:
      'Arrow Dynamics (gegründet 1945) baute als einer der ersten moderne Stahlachterbahnen und führte die gebogenen Stahlrohrschienen ein, dazu den ersten modernen Loop auf Corkscrew (Knott’s Berry Farm, 1975). Typisch für Arrow-Bahnen sind Korkenzieher und hängende Loopingbahnen. Das Unternehmen meldete 2001 Insolvenz an, S&S übernahm die Vermögenswerte.',
    relatedTermIds: ['corkscrew', 'rattle', 'steel-coaster', 'suspended-coaster', 'vertical-loop'],
    alternateNames: ['Arrow', 'Arrow Development', 'S&S Arrow'],
  },
  {
    id: 'gci',
    name: 'Great Coasters International (GCI)',
    shortDefinition:
      'Amerikanischer Hersteller von Holzachterbahnen mit schnellen, kurvenreichen Layouts.',
    definition:
      'Great Coasters International (GCI) ist ein amerikanischer Hersteller von Holzachterbahnen. Die 1994 gegründete Firma baut die Millennium-Flyer-Züge und Layouts mit schnellen Richtungswechseln und viel Airtime. Beispiele sind Wodan (Europa-Park), Thunderhead (Dollywood) und Troy (Toverland).',
    relatedTermIds: ['airtime', 'rmc', 'terrain-coaster', 'wooden-coaster'],
    alternateNames: ['Great Coasters International', 'GCI Coaster', 'Millennium Flyer'],
  },
  {
    id: 'premier-rides',
    name: 'Premier Rides',
    shortDefinition:
      'Amerikanischer Hersteller von Katapultachterbahnen mit LSM- oder LIM-Antrieb. In Europa steht etwa Sky Scream im Holiday Park.',
    definition:
      'Premier Rides (gegründet 1995, Baltimore, Maryland) ist ein amerikanischer Achterbahnhersteller, der sich auf Launches mit Linearsynchronmotor (LSM) und Linearinduktionsmotor (LIM) spezialisiert hat. Das Modell Sky Rocket II, ein kompakter Katapultcoaster auf einer einzelnen Schiene, steht in vielen mittelgroßen Parks weltweit.\n\nIn Europa kennt man Premier Rides vor allem durch Sky Scream im Holiday Park (Haßloch, Deutschland), einen Familienkatapultcoaster mit Inversion. Auch Hagrid’s Magical Creatures Motorbike Adventure in Universal Orlando fährt mit LSM-Technik von Premier.',
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
  },
  {
    id: 'zamperla',
    name: 'Zamperla',
    shortDefinition:
      'Italienischer Hersteller vor allem von Familienachterbahnen und Fahrgeschäften, mit über 250 gebauten Achterbahnen.',
    definition:
      'Zamperla (gegründet 1966, Altavilla Vicentina, Italien) gehört nach Stückzahl zu den größten Herstellern von Fahrgeschäften weltweit. Intamin, B&M und Mack bauen vor allem große Thrill-Bahnen, Zamperla baut viele kleine und mittlere: Family Coaster, Mini Coaster, Twister und Disk’O Coaster stehen in kleineren Parks und auf Resort-Midways in aller Welt.\n\nWeil sie wenig Platz brauchen und niedrige Mindestgrößen haben, sind Zamperla-Bahnen in europäischen Stadtparks, Ferienanlagen und Indoor-Parks verbreitet. Zamperla hat auch größere Bahnen gebaut, etwa Thunderbolt auf Coney Island (New York).',
    alternateNames: ['Zamperla rides', 'Antonio Zamperla'],
    relatedTermIds: ['credit', 'gerstlauer', 'mine-train'],
  },
  {
    id: 'huss-rides',
    name: 'Huss Rides',
    shortDefinition:
      'Deutscher Flat-Ride-Hersteller, gegründet 1961, bekannt für Top Spin, Break Dance, Enterprise, Ranger und Condor.',
    definition:
      'Huss Rides GmbH ist ein deutsches Unternehmen für Fahrgeschäfte, gegründet 1961 von Paul Huss mit Sitz in Bremen. Von Huss stammen viele Flat-Ride-Modelle aus dem späten 20. Jahrhundert, die in Freizeitparks und auf Jahrmärkten weltweit stehen.\n\nWichtige Huss-Modelle sind der Top Spin, der Break Dance (drehende Wagen auf einer drehenden Scheibe), das Enterprise (ein Rad mit Gondeln, die die Fliehkraft nach außen drückt), der Ranger (schwingendes Pendelschiff), der Condor (rotierender Sitzturm) und die Troika. Viele dieser Modelle haben andere Hersteller nachgebaut. In europäischen Parks stehen viele Huss-Anlagen seit den 1980er und 1990er Jahren, als dort besonders viele Flat Rides gebaut wurden.',
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
      'Ein Wave Turn ist eine schnelle, übergeneigte Kurve. Mitten in der Kurve wirken kurz negative oder seitliche G-Kräfte, und die Fahrgäste heben aus dem Sitz ab. Das Element ist häufig auf RMC-Bahnen und hat dort Ejector- oder Floater-Airtime. Wave Turns haben zum Beispiel Wildfire (Kolmården) und Untamed (Walibi Holland).',
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
      'Schulferien (Sommer-, Weihnachts-, Oster- und Herbstferien) sind der wichtigste Grund für volle Tage in Freizeitparks. Familien mit Kindern sind die größte Besuchergruppe und kommen vor allem in den Ferien. Parks verlängern dann oft die Öffnungszeiten, bieten mehr Programm und erhöhen die Preise. Wie stark die Ferien einen Park füllen, steht Monat für Monat auf der Seite Beste Reisezeit.',
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
      'Bei einer Simulator-Attraktion bewegt sich eine hydraulisch oder elektrisch angetriebene Plattform synchron zu einem Film auf einer Großleinwand. Eine Schiene gibt es nicht. Die Kapazität ist oft hoch, und mit einem neuen Film lässt sich die Attraktion erneuern. Beispiele sind Star Tours (Disney) und Mystic Manor (HKDL).',
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'trackless-ride'],
    alternateNames: [
      'Simulator-Attraktion',
      'Simulatorfahrt',
      'Simulator',
      '4D-Kino',
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
      'Ein Charaktertreffen (Character Meet & Greet) ist ein ausgewiesener Bereich oder ein geplanter Termin, bei dem Gäste kostümierte Figuren treffen, sich mit ihnen fotografieren lassen und Autogramme bekommen. In Disney- und Universal-Parks haben gefragte Figuren oft einen eigenen Meet-&-Greet-Bereich mit eigener Warteschlange. Vor allem Familien mit Kindern stehen dafür an.',
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
      'Im Schnellrestaurant (auch Counter Service oder Fast Casual) bestellen Gäste an einer Theke und tragen ihr Essen selbst zum Tisch. Es ist die häufigste Restaurantform in Freizeitparks, man bekommt dort schnell etwas zu essen. Bekannt gemacht hat den Begriff „Quick Service“ Disney, um diese Restaurants in seinem Reservierungssystem vom „Table Service“ zu unterscheiden.',
    relatedTermIds: ['character-dining', 'table-service'],
    alternateNames: ['Schnellrestaurant', 'Counter Service', 'Fast Food', 'Selbstbedienung'],
  },
  {
    id: 'table-service',
    name: 'Tischservice',
    shortDefinition: 'Sitzrestaurant mit Bedienung, bei dem Reservierungen oft erforderlich sind.',
    definition:
      'In einem Tischservice-Restaurant im Freizeitpark sitzt man und wird am Tisch bedient. Man sollte reservieren (in Disney-Parks oft 60–180 Tage im Voraus möglich), weil gefragte Restaurants besonders in der Hochsaison schnell ausgebucht sind. Tischservice kostet deutlich mehr als ein Schnellrestaurant, dafür ist das Essen meist besser und man sitzt ruhiger.',
    relatedTermIds: ['character-dining', 'peak-day', 'quick-service'],
    alternateNames: ['Tischservice', 'Table Service', 'Sitzrestaurant', 'Restaurant mit Bedienung'],
  },
  {
    id: 'character-dining',
    name: 'Character Dining',
    shortDefinition: 'Restaurant, bei dem Kostümcharaktere die Tische der Gäste besuchen.',
    definition:
      'Beim Character Dining, meist in einem Restaurant mit Bedienung, manchmal am Buffet, kommen kostümierte Figuren an jeden Tisch, reden mit den Gästen, lassen sich fotografieren und geben Autogramme. So trifft man die Figuren, ohne dafür extra anzustehen, und Familien buchen es deshalb oft. Beispiele sind Chef Mickey’s (Disney World) und das Prinzessinnen-Dinner in der Auberge de Cendrillon (Disneyland Paris).',
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
      'Eine Wildwasserbahn (auch Flossfahrt oder Logflume) ist eine Wasserattraktion, bei der Gäste in Booten, traditionell Kunststoffbooten in Form eines Baumstamms, durch einen Wasserkanal fahren. Nach ruhigeren Abschnitten folgt eine steile Abfahrt, unten taucht das Boot in ein Becken ein, und die Fahrgäste werden nass. Wildwasserbahnen kamen in den 1960er Jahren auf und stehen heute in fast jedem Freizeitpark. Familien können sie gemeinsam fahren, die Kapazität ist mäßig, und im Sommer sind sie besonders gefragt. In Europa ist Poseidon im Europa-Park ein Beispiel, dazu kommen viele Wildwasserbahnen in deutschsprachigen Parks.',
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
      'Bei der Enterprise hängen Gondeln rund um einen großen drehenden Ring. Dreht der Ring schneller, drückt die Fliehkraft die Fahrgäste fest in die Sitze. Bei voller Geschwindigkeit hebt sich der ganze Ring bis fast in die Senkrechte, und die Fahrgäste kreisen kopfüber.\n\nHuss Rides hat die Enterprise entwickelt, später bauten sie auch andere Hersteller. Seit den 1970er Jahren steht sie in Freizeitparks und auf Jahrmärkten. Aufgerichtet ist der Ring von weitem zu sehen.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Enterprises'],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    shortDefinition:
      'Ein Schaukelschiff: eine große Gondel in Form eines Wikinger- oder Piratenschiffs, die in einem immer größeren Bogen schwingt.',
    definition:
      'Der Ranger ist das Schaukelschiff von Huss Rides, eine große Gondel in Form eines Wikinger-Langschiffs oder Piratenschiffs, die vor und zurück schwingt und mit jedem Schwung höher kommt. Die Fahrgäste sitzen an den Seiten des Schiffs und schauen zur Mitte. Am höchsten Punkt steht die Gondel sehr schräg, und es wirken starke negative G-Kräfte.\n\nSchaukelschiffe bauen weltweit viele Hersteller unter verschiedenen Namen (Viking, Pirate Ship, Sea Monster). Der Ranger gehört zu den am weitesten verbreiteten Huss-Modellen und steht in Parks und auf Jahrmärkten in ganz Europa und darüber hinaus.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    aliases: [
      'swinging ship',
      'swinging ships',
      'pirate ship ride',
      'Viking ship ride',
      'Schaukelschiff',
      'Piratenschiff',
      'Wikingerschiff',
    ],
    alternateNames: ['Huss Ranger', 'Wikingerschiff', 'Piratenschiff'],
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
      'Ein Pendelfahrgeschäft ist ein Flat Ride, bei dem eine Gondel an einem langen Arm hängt, der in einem immer größeren Bogen vor- und zurückschwingt, oft fast bis in die Senkrechte. Dabei dreht sich die Gondel zusätzlich um ihre eigene Achse.\n\nDas bekannteste Beispiel ist der Frisbee (Mondial), eine scheibenförmige Gondel, die sich im Pendelbogen dreht. Weitere verbreitete Pendelfahrgeschäfte sind der KMG Afterburner und der Intamin Giant Frisbee. Pendelfahrgeschäfte sind von weitem zu sehen, brauchen vergleichsweise wenig Platz und stehen deshalb in vielen Freizeitparks und auf Jahrmärkten.',
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
      'Eine Tischreservierung ist die Vorab-Buchung eines Platzes in einem Tischservice- oder Charakter-Dinner-Restaurant in einem Freizeitpark, Resort-Hotel oder angeschlossenen Unterhaltungskomplex. In Disney-Parks kann man bis zu 60 Tage im Voraus reservieren (Gäste der Resort-Hotels bis zu 10 Tage früher). Für die gefragtesten Restaurants geht es kaum ohne, wer nicht rechtzeitig bucht, findet zu Stoßzeiten oft keinen Platz mehr. Reservierungen werden meist mit einer Kreditkarte gesichert. Bei Disney kostet es eine Gebühr, wenn man nicht erscheint oder zu kurzfristig absagt. Unter Disney-Fans heißt die Vorabreservierung oft ADR (Advance Dining Reservation).',
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
      'Bei der mobilen Bestellung sehen Gäste in der offiziellen Park-App die Speisekarte eines Restaurants, bestellen, bezahlen und wählen ein Zeitfenster zum Abholen, ohne an der Theke anzustehen. Disney hat das System in seinen Schnellrestaurants eingeführt, Universal, Six Flags, die Merlin-Parks und viele andere Betreiber haben inzwischen eigene Varianten. Ist das Zeitfenster erreicht, kommt eine Nachricht in der App, und man holt das Essen am Abholschalter für mobile Bestellungen ab. Vor allem zur Mittagszeit spart das viel Zeit. Voraussetzung sind ein geladenes Smartphone und ausreichende Netzabdeckung im Park.',
    relatedTermIds: ['dining-reservation', 'quick-service'],
    alternateNames: ['Mobile Order', 'App-Bestellung', 'Mobile Bestellung'],
  },
  {
    id: 'food-court',
    name: 'Food Court',
    shortDefinition:
      'Großer gemeinsamer Essbereich mit mehreren Schnellrestaurant-Theken verschiedener Küchen unter einem Dach.',
    definition:
      'Ein Food Court ist ein gemeinsamer Gastronomiebereich mit mehreren eigenständigen Schnellrestaurant-Theken oder Imbissständen, die verschiedene Küchen anbieten und einen gemeinsamen Sitzbereich teilen. In Freizeitparks sind Food Courts meist die größten Essbereiche und auf den Andrang zur Mittagszeit ausgelegt. Wer in einer Gruppe unterwegs ist, kann an verschiedenen Theken bestellen und trotzdem zusammensitzen. Disney und Universal gestalten Food Courts oft passend zum Themenbereich, andere Parks betreiben sie als schlichte Essbereiche nahe dem Eingang. Meist isst man dort am günstigsten im Park.',
    relatedTermIds: ['mobile-ordering', 'quick-service', 'table-service'],
    alternateNames: ['Food Court', 'Gastronomiehof', 'Essensbereich', 'Speisehalle'],
  },
  {
    id: 'capacity-closure',
    name: 'Kapazitätsschließung',
    shortDefinition:
      'Ein Park lässt keine neuen Besucher mehr ein, weil die maximale Besucherzahl erreicht ist.',
    definition:
      'Eine Kapazitätsschließung (auch Ausverkauf oder Kapazitätsobergrenze) tritt ein, wenn ein Freizeitpark die höchste zulässige oder betrieblich sichere Besucherzahl erreicht hat und vorübergehend keine Tagestickets mehr verkauft oder niemanden mehr einlässt. Parks steuern das über Eintrittstickets mit Zeitfenster, laufende Besucherzählung und zeitweise geschlossene Eingänge. Je nach Park können an solchen Tagen auch Jahreskarteninhaber abgewiesen werden. Andere Parks verhindern Überfüllung schon vorher mit Reservierungssystemen. Am häufigsten passiert das in den Spitzen der Schulferien, bei Sonderveranstaltungen und an Feiertagen. Ob ein Park voll ist, steht am Morgen des Besuchs meist in der Park-App oder in den sozialen Medien des Parks.',
    relatedTermIds: ['crowd-level', 'peak-day', 'school-holiday', 'season-pass'],
    alternateNames: ['Kapazitätsschließung', 'Park ausverkauft', 'Kapazitätsgrenze', 'Park voll'],
  },
  {
    id: 'zero-g-winder',
    name: 'Zero-G Winder',
    shortDefinition:
      'Ein Zero-G Roll mit Richtungswechsel. Der Zug verlässt die Inversion in eine andere Richtung, als er hineingefahren ist.',
    definition:
      'Der Zero-G Winder ist ein Zero-G Roll, bei dem die Strecke zugleich die Richtung wechselt. Beim klassischen Zero-G Roll fährt der Zug in derselben Richtung aus, in der er eingefahren ist. Beim Winder biegt die Strecke während der Drehung ab, und der Zug kommt in einer deutlich anderen Richtung heraus. Die Inversion mit ihrer Schwerelosigkeit ist damit zugleich die Kurve in den nächsten Streckenabschnitt.\n\nZero-G Winder findet man vor allem auf neueren Bahnen von Herstellern wie Intamin und B&M. Bekannte Beispiele sind Kondaa in Walibi Belgium und VelociCoaster in Universal’s Islands of Adventure.',
    relatedTermIds: ['airtime', 'intamin', 'inversion', 'zero-g-roll'],
    aliases: ['Zero-G-Winder'],
    alternateNames: ['Zero G Winder', 'Winder'],
  },
  {
    id: 'banana-roll',
    name: 'Banana Roll',
    shortDefinition:
      'Ein langgezogenes Element mit zwei Inversionen, die durch einen geschwungenen Bogen verbunden sind. Von oben sieht es aus wie eine Banane.',
    definition:
      'Beim Banana Roll liegen die zwei Überschläge weiter auseinander als beim Cobra Roll und sind durch einen geschwungenen Bogen verbunden, statt eng und symmetrisch aufeinanderzufolgen. Von oben folgt die Strecke durch beide Inversionen einem sanften Bogen in Form einer Banane. Die beiden Inversionen verteilen sich so über einen längeren Streckenabschnitt und gehen fließender ineinander über.\n\nDen ersten Banana Roll baute Gerstlauer 2011 für Takabisha in Fuji-Q Highland, Japan. S&S Worldwide entwickelte später eine eigene Variante mit zwei Inversionen für Steel Curtain in Kennywood. Weil das Element seitlich viel Platz braucht, steht es meist in größeren, bodennah gebauten Anlagen, in denen die Strecke weit ausschwingen kann.',
    relatedTermIds: ['cobra-roll', 'gerstlauer', 'inversion', 's-and-s-worldwide'],
  },
  {
    id: 'inclined-loop',
    name: 'Geneigter Looping',
    shortDefinition:
      'Ein Looping, der aus der Senkrechten gekippt ist. Der Zug fährt schräg ein und schräg wieder aus.',
    definition:
      'Ein geneigter Looping (englisch: Inclined Loop oder Tilted Loop) ist ein klassischer Looping, der zur Seite gekippt ist, meist um 45 bis 80 Grad gegenüber der Fahrtrichtung. Der Zug fährt schräg ein und schräg wieder aus, der Looping sieht dadurch schief aus und fährt sich anders als ein aufrechter.\n\nBei der Einfahrt wirken mehr seitliche Kräfte als im klassischen Looping, und die Ausfahrt unten kommt aus einer anderen Richtung, als man erwartet. Von außen ist ein geneigter Looping sofort als ungewöhnlich zu erkennen. Geneigte Loopings haben verschiedene B&M- und Intamin-Coaster, oft im mittleren oder letzten Teil der Strecke.',
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
      'Verschlungene Loops (englisch: Interlocking Loops) sind zwei senkrechte Loopings, deren Ebenen sich schneiden, meist fast im rechten Winkel. Aus manchen Blickwinkeln scheint der eine Looping durch den anderen hindurchzulaufen, wie bei zwei Kettengliedern oder einer riesigen Acht. Die beiden Loopings so zu verschachteln, dass sich die Schienen nicht berühren, ist aufwendig. Von weitem sind sie dafür gut zu sehen.\n\nMan findet verschlungene Loops am häufigsten auf B&M-Inverted-Coastern und auf Sitzachterbahnen mit vielen Inversionen. Dragon Khan in PortAventura hat verschlungene Loops als Teil seiner acht Inversionen.',
    relatedTermIds: ['b-and-m', 'inversion', 'vertical-loop'],
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
      'Beim Stapling drückt das Personal einen Schoß- oder Schulterbügel, absichtlich oder aus übertriebener Vorsicht, so fest an den Fahrgast, dass er deutlich enger sitzt als für die Sicherheit nötig. Der Name kommt vom englischen „staple“ (heften): Man ist in den Sitz „geheftet“. Auf Airtime-Bahnen soll der Schoßbügel so locker sitzen, dass die Fahrgäste auf den Kuppen leicht vom Sitz abheben können. Wer „gestapled“ ist, bleibt die ganze Fahrt in den Sitz gepresst und hebt auch auf gut geformten Hügeln nicht ab.\n\nBesonders ärgerlich ist das auf Holzachterbahnen und Hybrid Coastern, auf denen es vor allem um Airtime geht. Manche Parks lassen die Bügel grundsätzlich lockerer, andere ziehen sie grundsätzlich fester an.',
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
      'Valleying (etwa „im Tal stecken bleiben“) tritt auf, wenn ein Zug unterwegs so viel Schwung verliert, dass er den nächsten Hügel oder das nächste Element nicht mehr schafft. Er bleibt im Tal zwischen zwei Hochpunkten stehen oder rollt dorthin zurück. Weil er dort nicht auf einer Bremsstrecke oder in der Station steht, lässt er sich mit der normalen Steuerung nicht bewegen. Meist muss das Wartungspersonal die Fahrgäste herausholen und den Zug von Hand oder mit einer Winde über den nächsten Hochpunkt bringen.\n\nIm normalen Betrieb ist Valleying selten, weil Bahnen mit reichlich Reserve an Geschwindigkeit geplant werden. Eher passiert es bei ungewöhnlicher Kälte (die Radlager laufen dann schwer), bei zu vielen Trimbremsen oder auf alter Strecke, deren Form sich verzogen hat.',
    relatedTermIds: ['brake-run', 'downtime', 'rollback', 'trim-brake'],
    alternateNames: ['Valleying', 'im Tal feststecken', 'stecken gebliebener Zug'],
  },
  {
    id: 'wild-mouse',
    name: 'Wilde Maus',
    shortDefinition:
      'Ein Achterbahntyp mit kleinen Einzelwagen und engen, kaum geneigten Spitzkehren am Rand erhöhter Plattformen.',
    definition:
      'Eine Wilde Maus (englisch: Wild Mouse) fährt mit kleinen Wagen für zwei bis vier Personen statt mit langen Zügen. Typisch sind enge, kaum geneigte Haarnadelkurven ganz am Rand der Strecke. Weil die Kurven, anders als bei anderen Achterbahnen, kaum geneigt sind, drückt es die Fahrgäste seitlich gegen die Wagenwand, und die Kurve kommt später, als man erwartet. Man hat den Eindruck, gleich von der Strecke zu rutschen.\n\nWilde Mäuse brauchen sehr wenig Platz, weil die Ebenen mit den Haarnadelkurven übereinander liegen und so viel Strecke auf eine kleine Fläche passt. Sie stehen in ganz Europa und weltweit, in Deutschland kennen viele Parkbesucher den Namen „Wilde Maus“. Hersteller sind unter anderem Mack Rides, Maurer und Gerstlauer.',
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
      'Ein Fourth-Dimension-Coaster (4D-Coaster) ist eine Achterbahn, bei der die Sitze auf schwenkbaren Armen links und rechts vom Wagen sitzen, statt fest am Zug montiert zu sein. Die Sitze drehen sich vorwärts oder rückwärts. Entweder gibt eine zusätzliche Steuerschiene neben der Strecke ihre Stellung an jeder Stelle vor, oder sie drehen sich frei, je nach Schwerkraft und Gewichtsverteilung der Fahrgäste. So schauen die Fahrgäste auf einer Abfahrt nach unten, stehen in einer Kurve kopfüber oder drehen sich in einer Inversion um mehrere Achsen zugleich.\n\nDas Konzept stammt von Arrow Dynamics und wurde später von S&S Worldwide weiterentwickelt. X2 in Six Flags Magic Mountain (Kalifornien) eröffnete 2002 als erster 4D-Coaster und ist der bekannteste. Eejanaika in Fuji-Q Highland, Japan, hält den Rekord für die meisten Inversionen einer Achterbahn, unter anderem weil die Drehungen der Sitze mitgezählt werden.',
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
      'Ein Out-and-Back ist einer der zwei grundlegenden Achterbahn-Layouttypen. Der Zug fährt von der Station aus ungefähr geradeaus weg, meist über eine Reihe von Airtime-Hügeln, wendet am Ende des Geländes und kommt parallel zur Hinfahrt zurück. Die beiden Abschnitte kreuzen sich kaum, der Grundriss ist lang und schmal.\n\nTypisch ist das Layout für klassische Holzachterbahnen. Die Geschwindigkeit aus der langen Hinfahrt reicht auf dem Rückweg für eine Folge immer niedrigerer Hügel, die der Zug immer schneller nimmt, mit viel Floater Airtime. Beispiele sind The Voyage in Holiday World und verschiedene Racer-Modelle. Auch Stahlachterbahnen haben manchmal ein Out-and-Back-Layout, aber seltener.',
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
      'Eine saisonale Attraktion ist eine Fahrt, Show oder ein anderes Angebot, das der Park nur in einem festen Teil des Jahres betreibt. Eislaufflächen, Rodelstrecken und Wintershows laufen typischerweise von November bis Februar, Wildwasserbahnen, Wasserattraktionen und Open-Air-Shows von Mai bis September. Manche saisonalen Angebote gehören zu einem bestimmten Event wie Halloween oder Weihnachten.\n\npark.fan erkennt saisonale Attraktionen und Shows automatisch an den bisherigen Betriebsdaten und blendet sie in der Parkübersicht und auf der Karte aus, solange sie außerhalb ihrer Saison sind. So bleibt die Ansicht übersichtlich, und es stehen dort nur die Attraktionen, die heute tatsächlich geöffnet sind. Auf jeder betroffenen Karte steht ein Saison-Badge (❄️ Winter, ☀️ Sommer oder 🍃 allgemein). Ist die Attraktion gerade nicht in Saison, ist das Badge abgeblendet. Über einen Schalter in den Tabs lassen sich die ausgeblendeten Einträge wieder anzeigen, etwa um einen Winterbesuch zu planen.',
    relatedTermIds: ['crowd-calendar', 'offseason', 'refurbishment'],
    alternateNames: ['Saisonfahrt', 'saisonale Show', 'Saisonangebot'],
  },
  {
    id: 'gravity-group',
    name: 'The Gravity Group',
    shortDefinition:
      'Ein US-amerikanisches Designbüro, das auf moderne Holzachterbahnen spezialisiert ist.',
    definition:
      'The Gravity Group ist ein amerikanisches Ingenieur- und Designbüro, das moderne Holzachterbahnen in aller Welt entwirft. Gegründet haben es frühere Mitarbeiter von Custom Coasters International (CCI). Typisch sind kompakte, heftige Layouts mit Elementen, die für Holzkonstruktionen ungewöhnlich sind. Oft fahren darauf „Timberliner“-Züge, die engere und stärker verdrehte Passagen schaffen als klassische Holzachterbahnzüge. Beispiele sind The Voyage in Holiday World und Wodan - Timburcoaster im Europa-Park.',
    relatedTermIds: ['hybrid-coaster', 'rmc', 'wooden-coaster'],
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
      'KMG (Kermis Machinebouw Gaasbeek) ist ein niederländisches Ingenieurbüro und einer der großen Hersteller von Flat Rides. Ursprünglich baute KMG für die Kirmes. Weil die Anlagen zuverlässig laufen und leicht zu warten sind, stehen sie inzwischen auch fest in Freizeitparks. Von KMG stammen der Afterburner (ein Frisbee-Modell) und der Freak Out. Die Anlagen sind schnell aufgebaut und laufen ruhig.',
    relatedTermIds: ['flat-ride', 'mondial', 'pendulum-ride'],
  },
  {
    id: 'oceaneering',
    name: 'Oceaneering',
    shortDefinition:
      'Ein Technikunternehmen, das Fahrsysteme und Bewegungsplattformen für Themenparks baut.',
    definition:
      'Oceaneering Entertainment Systems (OES), eine Abteilung von Oceaneering International, baut Attraktionstechnik. Aus dem Wissen der Firma über Unterwasserroboter entstanden die Fahrzeuge mit Bewegungsplattform, die bei The Amazing Adventures of Spider-Man in Universal Islands of Adventure fahren. OES baut auch schienenlose Fahrsysteme und aufwendige Animatronics.',
    relatedTermIds: ['dark-ride', 'motion-simulator', 'trackless-ride'],
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
    relatedTermIds: ['arrow-dynamics', 'flat-ride', 'hyper-coaster', 'steel-coaster'],
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
      'Ein Camelback (oder Camelback-Hügel) ist ein klassisches Achterbahnelement, ein großer, höckerförmiger Hügel. Über der Kuppe haben die Fahrgäste Floater Airtime und heben leicht aus dem Sitz ab. Hypercoaster haben fast immer Camelbacks, oft mehrere hintereinander.',
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
      'Ein Strata-Coaster ist eine Achterbahn, die eine Höhe von 400 Fuß (122 Meter) oder mehr erreicht. Den Begriff prägte Cedar Point zur Eröffnung von Top Thrill Dragster. Strata-Coaster sind sehr teuer und technisch aufwendig, bis heute wurde nur eine Handvoll gebaut, darunter Kingda Ka in Six Flags Great Adventure.',
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
      'Dynamic Attractions ist ein kanadisches Unternehmen, das technisch aufwendige Fahrgeschäfte entwickelt und baut. Bekannt ist es vor allem für sein „Robotic Arm“-System (bei Harry Potter and the Forbidden Journey), bei dem ein KUKA-Roboterarm auf einer Schiene fährt und die Sitze bewegt. Dynamic Attractions baut außerdem Flying Theater, Dark-Ride-Fahrzeuge und aufwendige Achterbahnsysteme wie den SFX Coaster.',
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
      'Beim Shuttle Coaster fährt der Zug am Ende der Strecke dieselbe Strecke rückwärts wieder zurück. Diese Bahnen haben meist zwei Enden (Spikes), an denen der Zug die Richtung wechselt. Shuttle Coaster brauchen weniger Platz als Achterbahnen mit geschlossenem Rundkurs. Ein bekanntes Beispiel ist der Boomerang von Vekoma.',
    relatedTermIds: ['boomerang', 'launch-coaster', 'spike', 'steel-coaster'],
    aliases: ['Pendel-Achterbahn'],
  },
  {
    id: 'carousel',
    name: 'Karussell',
    shortDefinition:
      'Ein klassisches Fahrgeschäft mit einer rotierenden Plattform und oft auf- und absteigenden Figuren.',
    definition:
      'Das Karussell (oder Merry-Go-Round) ist eines der ältesten Fahrgeschäfte in Freizeitparks. Auf einer runden, drehenden Plattform stehen Sitze in Form von Tieren (meist Pferden), Kutschen oder anderen Figuren. Bei vielen Modellen bewegen sich die Figuren während der Drehung zusätzlich auf und ab. Karussells sind Familienattraktionen und oft kunstvoll im viktorianischen oder barocken Stil gestaltet.',
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
    aliases: ['Laufgeschäft', 'Maze', 'Spukhaus'],
  },
  {
    id: 'funhouse',
    name: 'Funhouse',
    shortDefinition:
      'Ein Laufgeschäft mit Hindernissen, optischen Täuschungen und beweglichen Bodenelementen.',
    definition:
      'Ein Funhouse ist ein Laufgeschäft, das Geschicklichkeit und Wahrnehmung der Besucher auf die Probe stellt. Typisch sind Laufbänder, sich drehende Tonnen, Zerrspiegel, Rutschen und vibrierende Böden. Funhouses kommen vom Jahrmarkt, stehen aber auch in vielen Freizeitparks als Familienattraktion, etwa die Villa Fiasko im Toverland.',
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
      'Ein Spike ist der Schienenabschnitt am Ende eines Shuttle Coasters. Dort fährt der Zug senkrecht oder sehr steil nach oben, bis er stehen bleibt und durch die Schwerkraft (oder einen Antrieb) die Richtung wechselt und die Strecke rückwärts fährt. Moderne Spikes können hunderte Meter hoch sein oder sogar über die Vertikale hinausgehen.',
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
      'Physische Effekte (Practical Effects) sind alle Spezialeffekte in einer Attraktion, die nicht auf einem Bildschirm laufen. Dazu gehören Animatronics, Feuer, Wasserfontänen, Wind, echte Explosionen oder sich bewegende Kulissenteile. Weil ein physischer Effekt tatsächlich im Raum steht, wirkt er oft glaubwürdiger als ein Bild auf einem Bildschirm.',
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
      'Bei einem In-Show Exit müssen Fahrgäste die Attraktion mitten in der Fahrt an einer Stelle verlassen, an der sonst niemand aussteigt. Das passiert fast nur bei technischen Defekten oder Sicherheitsabschaltungen (Evakuierung). Man sieht die Szenen und die Technik dann, oft bei eingeschaltetem Arbeitslicht, aus einem Blickwinkel, der im normalen Betrieb verborgen bleibt.',
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
      'Ein Beyond-Vertical Drop (überhängende Abfahrt) ist steiler als 90 Grad. Die Schiene krümmt sich unter sich selbst zurück, und die Fahrgäste werden kurz über die Senkrechte hinaus gekippt, sodass sie leicht rückwärts zur Konstruktion zeigen. Sie fallen dabei nahezu frei. Bekannt gemacht hat das Format Gerstlauers Euro-Fighter mit Abfahrten um 95–97°, B&M und andere haben Dive Coaster mit ähnlich überhängenden ersten Abfahrten gebaut. Bahnen wie Mumbo Jumbo und Takabisha hielten Rekorde für die steilste derartige Abfahrt.',
    relatedTermIds: ['dive-coaster', 'euro-fighter', 'first-drop', 'gerstlauer'],
    aliases: ['Beyond Vertical Drop', 'überüberhängende Abfahrt'],
  },
  {
    id: 'splashdown',
    name: 'Splashdown',
    shortDefinition:
      'Das Ende einer Abfahrt auf einer Wasserbahn oder Wasserachterbahn, bei dem das Boot in eine Wasserrinne eintaucht, abbremst und eine Welle aufwirft.',
    definition:
      'Ein Splashdown ist der Moment, in dem ein Boot oder Wagen am Fuß einer Abfahrt in eine flache Wasserrinne eintaucht. Das Wasser bremst das Fahrzeug und wird als hohe Gischtwand aufgeworfen. Bei Wasserachterbahnen und Wildwasserbahnen werden die Fahrgäste dort nass. Über Tiefe und Form der Rinne legen die Konstrukteure fest, wie nass, und auch, wie viel die Zuschauer auf Brücken daneben abbekommen.',
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
      'Ein Celestial Spin ist eine von Mack Rides patentierte Inversion auf zwei Schienen und das auffälligste Element von [Stardust Racers](/de/parks/north-america/united-states/orlando/universal-epic-universe/stardust-racers), der Duell-Launch-Achterbahn im [Universal Epic Universe](/de/parks/north-america/united-states/orlando/universal-epic-universe). Während die beiden Züge im Rennen über eine gemeinsame Kuppe fahren, drehen sich ihre Schienen umeinander. Der eine Zug rollt in einem Zero-G Roll nach oben, der andere im selben Moment in einem Barrel Roll nach unten, und die Wagen scheinen sich in der Luft umeinander zu winden.\n\nBeide Rollen sind auf den Airtime-Hügel abgestimmt, die Fahrgäste sind lange schwerelos, während der andere Zug nur wenige Meter entfernt vorbeidreht. In der Frontalansicht sieht man, wie sich die beiden Schienen umeinander winden. Im Follow-Modus verfolgt man das Duell, und in der Mitfahr-Ansicht kippt der eigene Horizont, während der andere Zug über einen hinwegzieht. Verwandte Begriffe sind Zero-G Roll, Inversion und Airtime-Hügel.',
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
      'Ein Swing Launch (auch Shuttle- oder Multi-Pass-Launch) beschleunigt den Zug, lässt ihn auf einem ansteigenden Streckenstück auslaufen, fängt ihn auf dem Rückweg wieder ein und wiederholt das zwei- bis dreimal, bis genug Energie für den kompletten Kurs da ist. Jeder Durchgang bringt Tempo, das die Motoren in einem Anlauf nicht schaffen würden. So erreicht ein Swing Launch auf einer deutlich kürzeren Launch-Strecke eine deutlich höhere Endgeschwindigkeit.\n\nDie Fahrgäste fahren dabei rückwärts durch einen Teil des Layouts, meist einen senkrechten Spike hinauf, bevor es wieder vorwärts geht. [Toutatis](/de/parks/europe/france/plailly/parc-asterix/toutatis) im Parc Astérix, [The Ride to Happiness](/de/parks/europe/belgium/de-panne/plopsaland-belgium/the-ride-to-happiness-by-tomorrowland) in Plopsaland und der [Schwur des Kärnan](/de/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) im Hansa-Park nutzen ihn. Premier Rides baut mit dem Modell Sky Rocket II eine ganze kompakte Achterbahn um diese Idee.',
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
      'Ein Vertikallift ersetzt die üblichen 30 bis 45 Grad Kettenanstieg durch einen Abschnitt, der im rechten Winkel zum Boden aufsteigt. Weil eine normale Kette samt Rücklaufsperre einen Zug an einer senkrechten Wand nicht zuverlässig hält, arbeiten diese Lifts mit Seil, Catch-Car oder einer Kette mit formschlüssigem Mitnehmer. Die Fahrgäste liegen während des Anstiegs auf dem Rücken und schauen direkt in den Himmel.\n\nTypisch ist der Vertikallift für Gerstlauers Euro-Fighter und Infinity Coaster, bei denen er direkt in eine überhängende Abfahrt übergeht. [Takabisha](/de/parks/asia/japan/fujikawaguchiko/fuji-q-highland/takabisha-steepest-roller-coaster) im Fuji-Q Highland steigt senkrecht auf und fällt dann mit 121 Grad ab, steiler als jede andere Stahlachterbahn. Der [Schwur des Kärnan](/de/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) im Hansa-Park nutzt einen 73 Meter hohen Vertikallift in einem geschlossenen Turm, sodass man im Dunkeln hinauffährt. Etwas anderes ist ein Aufzuglift, bei dem sich das Gleisstück mitsamt Zug hebt.',
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
      'Ein Mack-Rides-Element: Die Strecke krümmt sich über die Senkrechte hinaus in einen Überhang, und der Zug klettert rückwärts eine 105-Grad-Wand hinauf.',
    definition:
      'Der Scorpion Tail ist ein Launch-Spike, der über die Senkrechte hinausgeht. Die Strecke krümmt sich durch die Senkrechte hindurch bis auf rund 105 Grad, ein Überhang. Ein hineingeschossener Zug klettert kopfüber und leicht rückwärts hinauf, hängt am Scheitel und fällt denselben Weg zurück.\n\nMack Rides baute den ersten 2024 für [Voltron Nevera](/de/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) im [Europa-Park](/de/parks/europe/germany/rust/europa-park), wo er der steilste Launch-Abschnitt aller Achterbahnen weltweit ist. Die Hangtime entsteht hier ganz ohne Vorwärtsfahrt. Oben halten einen nur die Form der Strecke und der Restschwung des Zuges kopfüber. Der Name kommt von der Form, einem Skorpionschwanz, der sich nach oben und über sich selbst krümmt.',
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
      'Ein Treble Clef ist eine übereinandergelegte Kurve, die sich selbst kreuzt. Der Zug steigt in eine Schleife, kreuzt sein eigenes Gleis und verlässt die Figur durch ihre Mitte, ungefähr in der Form eines Violinschlüssels. Der Zug bleibt dabei durchgehend aufrecht, gehalten von starker Querneigung, eine Inversion ist es also nicht. Man schwenkt lange herum, mit Gleis sehr dicht über und unter sich.\n\nMaurer Rides baute das Element für [Hollywood Rip Ride Rockit](/de/parks/north-america/united-states/orlando/universal-studios-florida/hollywood-rip-ride-rockit) in den Universal Studios Florida, deren Layout musikalisch thematisiert ist und seine Figuren entsprechend benennt. Der Notenschlüssel folgt auf den nicht-invertierenden „Double Take“-Looping. Er blieb ein Einzelstück.',
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
      'Eine Indoor-Achterbahn fährt ihren gesamten Kurs in einem geschlossenen Showgebäude. Im Dunkeln sieht man keine Abfahrt und keine Kurve kommen, deshalb wirkt ein mäßiges Layout deutlich heftiger als dasselbe Gleis unter freiem Himmel. Außerdem lassen sich Licht, Projektion, Ton und Kulisse vollständig steuern, deshalb sind Mischformen aus Achterbahn und Dark Ride meist Indoor-Achterbahnen.\n\nDas Vorbild ist Space Mountain. [Disneyland](/de/parks/north-america/united-states/anaheim/disneyland-park/space-mountain) eröffnete seine Version 1977, und keine andere Indoor-Achterbahn wurde so oft nachgebaut. In Europa stehen etwa [Eurosat](/de/parks/europe/germany/rust/europa-park/eurosat-cancan-coaster) und [Euro-Mir](/de/parks/europe/germany/rust/europa-park/euro-mir) im Europa-Park, Eftelings [Vogel Rok](/de/parks/europe/netherlands/kaatsheuvel/efteling/vogel-rok) und Phantasialands [Crazy Bats](/de/parks/europe/germany/bruehl/phantasialand/crazy-bats), noch immer die längste Indoor-Achterbahn überhaupt.',
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
      'Der Infinity Coaster ist Gerstlauers aktuelle Plattform für Individualanlagen. Er behält, was den Euro-Fighter erfolgreich machte (überhängende Abfahrten, Vertikallifts und Layouts auf kleinster Fläche), hat aber statt der kantigen Vierer-Wagen längere, tiefer liegende Züge mit offenen Seiten und Bügeln statt Schulterbügeln. Er fährt spürbar ruhiger und kann mehr Airtime-Hügel haben, mit denen das ältere Modell schlecht zurechtkam.\n\nEs gibt kleine, kompakte Anlagen und Rekordhalter. [The Smiler](/de/parks/europe/united-kingdom/farley/alton-towers/the-smiler) in Alton Towers hält mit vierzehn Inversionen den Weltrekord, der [Schwur des Kärnan](/de/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) im Hansa-Park kombiniert einen 73-Meter-Vertikallift mit einem Swing Launch, und [Star Trek: Operation Enterprise](/de/parks/europe/germany/bottrop/movie-park-germany/star-trek-operation-enterprise) im Movie Park Germany fährt das Modell als Multi-Launch-Shuttle.',
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
      'Beim Aussichtsturm fährt eine verglaste oder offene Gondel an einer Mittelsäule nach oben, meist drehend, damit man von jedem Platz das ganze Panorama sieht, hält oben und senkt sich wieder. Technisch ist er ein naher Verwandter des Freifallturms, und die beiden werden oft verwechselt. Ein Aussichtsturm ist zum Hinausschauen gebaut, ein Freifallturm zum Herunterfallen.\n\nFür den Park ist er vor allem ein Orientierungspunkt, der von weitem zu sehen ist, und erst danach ein Fahrgeschäft. Im Europa-Park ist das seit 1979 der [Euro-Tower](/de/parks/europe/germany/rust/europa-park/euro-tower).',
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
      'Der QUICK Pass ist Phantasialands kostenpflichtiger Zugang an der Warteschlange vorbei. Anders als in den meisten Parks kauft man ihn pro Attraktion statt für den ganzen Tag, etwa für Taron, Black Mamba, Chiapas, Talocan oder Maus au Chocolat.\n\nGekauft wird er in der Park-App oder im Park selbst. Der Preis je Attraktion steht fest und schwankt nicht mit dem Andrang.\n\nAuch am QUICK-Pass-Eingang gibt es eine Warteschlange, sie ist nur deutlich kürzer.',
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
    aliases: ['Headliner-Attraktion', 'Hauptattraktion'],
    relatedTermIds: ['wait-time', 'crowd-level', 'rope-drop', 'virtual-queue', 'peak-day'],
  },
];

export default translations;
