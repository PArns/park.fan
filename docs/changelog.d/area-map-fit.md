### Die Karte der Hotelgegenden nutzt ihren Platz, und die Knöpfe im Assistenten heben sich ab

Die Karte im Hotel-Schritt zeichnete jede Stadt in ein festes Feld von 320 × 160 Einheiten. Am
Desktop wurde daraus ein Kasten von 715 × 220 px, und weil Orlando von Norden nach Süden reicht,
standen alle Marken im mittleren Drittel. Die Kürzel der Parks lagen fest unter ihrem Dreieck, also
auf den Kreisen der Gegenden („US“ unter Kreis 2, „EP“ unter Kreis 1), und nichts sagte, was Dreieck
und Kreis bedeuten.

`layoutSchematicMap` (`lib/trip-regions/wizard-choices.ts`) legt die Karte jetzt in Pixeln für die
Breite an, die der Schritt hat (`useWidth`, aus dem Admin nach `lib/hooks/use-width.ts`
gezogen): Projektion mit dem Kosinus der Breite, eingepasst in den Rahmen aller Gegenden und Parks
mit 22 px Rand, 150 bis 300 px hoch und nur so breit, wie die Orte es brauchen. Orlando wird so
etwa 270 px breit und steht am Desktop neben den Karten, Tokio nutzt die ganze Breite. Jedes
Kürzel nimmt die erste von acht Stellen um sein Dreieck, die keine Marke und kein anderes Kürzel
berührt, sonst eine weiter außen mit einer Linie zurück; die Kreise weichen nie. Die gewählte Gegend
ist gefüllt, größer und umrandet, die anderen sind blass, und eine Legende („▲ Park, ① Gegend“) steht
unter der Karte. `pnpm test:wizard-choices` prüft für Orlando und Tokio bei 715 und 343 px, dass sich
nichts überdeckt.

In der Fußzeile des Assistenten waren „Zurück“ und „Überspringen“ blasser Text neben dem blauen
„Weiter“. „Zurück“ ist jetzt ein Knopf mit Rahmen (`outline`), „Überspringen“ steht in der
Textfarbe (`ghost`), beide mit mehr als 15 : 1 Kontrast in beiden Themen. Im Planstreifen waren
die Tage ohne Park dunkle Felder auf dunklem Grund; sie haben jetzt einen Rahmen in der gedämpften
Farbe und das Zeichen der Monatsansicht: Sonne für einen freien Tag, Bett für einen Ruhetag,
Flugzeug für An- und Abreise.
