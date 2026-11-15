### Parkys Angebot auf den Reise-Hubs öffnet den Chat und läuft nicht mehr über die ganze Breite

In Kapitel 01 der vier Reise-Hubs stand unter den vier Schritten Parkys Zeile mit zwei Knöpfen:
blau „Reise planen“, das den Planer von Hand startete, und daneben umrandet „Lieber im Chat“. Der
blaue Knopf in Parkys Kasten führte also gerade nicht zu Parky. Jetzt hat der Kasten einen Knopf,
„Mit Parky planen“ (`tripHub.howItWorks.chat`, in allen sechs Sprachen), der das Interview startet
und Parky öffnet. Den Planer starten weiter die Knöpfe im Kopf und im Band unten; „Reise planen“
steht damit zweimal auf der Seite statt dreimal.

Der Kasten lief über die ganze Inhaltsbreite, mit der Zeile in einer 56rem breiten Mitte, und las
sich auf einem breiten Bildschirm wie ein leeres Band. Jetzt endet die Karte selbst bei 56rem
(`ParkyInterviewStart`). `action` ist weg, weil nur der Hub es nutzte; wo die Zeile die Schritte
schon nennt, lässt `showSteps={false}` die nummerierten Fragen weg. Ist Parky für den Besucher aus,
zeichnet der Hub hier nichts mehr.
