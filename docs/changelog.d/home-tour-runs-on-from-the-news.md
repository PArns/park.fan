### Startseite: Favoriten unter den News, Tour und Parky ohne Haarlinien

Zwischen dem News-Board und der ersten Tour-Station („Live-Wartezeiten") standen eine Haarlinie und das Polster beider Stationen: 129 px auf dem Handy, 193 px ab 640 px. Die erste Station der Tour zeichnet keine Linie mehr und kein eigenes Polster oben (`ShotStop flushTop`, `components/home/home-stop.tsx`), der Abstand ist nur noch das Polster unter den News: 64 px auf dem Handy, 96 px ab 640 px. Das Handy der ersten Station steht auf dem Desktop damit 140 statt 237 px unter dem Board.

Auch die Linie zwischen der Prognose-Station und Parky ist weg. `ShotStop` zeichnet keine `divider` mehr; Tour und Parky laufen als eine Strecke durch, getrennt nur durch Luft wie die Tour-Stationen untereinander. Diese Luft ist auf dem Handy halbiert (`py-8 sm:py-24` statt `py-16 sm:py-24`): zwischen zwei Phone-Stationen stehen dort 64 statt 128 px, so viel wie zwischen News und Tour. Ab 640 px bleibt alles bei 192 px.

Parkys Lead (`homeStory.parky.lead`) endet in allen sechs Sprachen nach dem Airtime-Satz; der Nachsatz zu den Live-Daten ist gestrichen.

Wer Favoriten hat, findet sie jetzt direkt unter den News statt nach Parky über der Nähe-Station. Die Favoriten-Station steht im Quelltext hinter `HomeReading` und schließt ohne Linie an (`HomeStop flushTop`), der Abstand zu News und Tour ist je 64 px auf dem Handy und 96 px ab 640 px. Ohne Favoriten bleibt sie ausgeblendet (`html:not([data-has-favorites]) .home-favorites`), die Regel `order: -1` ist weg.
