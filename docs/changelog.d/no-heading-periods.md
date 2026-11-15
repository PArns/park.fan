### Überschriften und die Zeile darunter enden ohne Punkt

Unter der H1 des Orlando-Hubs stand „Ein Kalender für alle 16 Parks rund um Orlando und ein Planer
für deine Reisetage.“, und so endeten Unterzeilen auf der ganzen Seite. Jetzt enden Titel,
Unterzeilen, Leads, Taglines und die Einzeiler unter einem Kartentitel ohne Punkt, in allen sechs
Sprachen: 123 Schlüssel in `messages/*.json`, also 738 Strings. Gefunden über die Komponenten, die
sie zeichnen (`ChapterHeading`- und `SectionHeading`-`hint`, `LandingHero`-`tagline`,
`DialogHero`, `PushDialogHero`, `SheetDescription`, `LandingNextSteps`, `HubBanner`,
`WizardOptionCard`, `WizardToggle`), nicht über die Schlüsselnamen: 97 Schlüssel verlieren nur den
Punkt, 26 sind umformuliert, meist zwei Sätze zu einem (die acht Resort-Karten der Hubs, die
Schritte unter „So plant der Reiseplaner deine Reise“, die Schritt-Karten des Tagesplaners). 32
Zeilen aus mehreren Sätzen und fünf, die der Code aus Sätzen zusammensetzt, behalten ihre Punkte,
ebenso Fließtext, FAQ-Antworten, Meta-Beschreibungen, Hinweise und Fehler. Im Niederländischen und Französischen fiel dabei aus `parks.kidsPage.lead` der Satz „Diese
Seite zeigt …“, den die anderen vier Sprachen nie hatten.

Die Regel steht in [§4.3](../writing/4-typography.md#43-headings), und `check:prose` schlägt fehl,
wenn ein Schlüssel `title`, `heading`, `headline`, `subtitle`, `subline`, `tagline`, `kicker`,
`eyebrow` oder `lead` aus einem Satz besteht und auf einen Punkt endet; drei Schlüssel, die kein
Kopf sind, stehen mit Grund in `HEADING_STOP_ALLOWED`.
