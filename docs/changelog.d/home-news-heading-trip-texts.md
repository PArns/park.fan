### Startseite: das News-Board ohne eigene Überschrift, der Reiseplaner mit Texten, die etwas sagen

Über dem News-Board standen „Freizeitpark-News und Guides“ und ein Lead, darunter auf dem Board
noch einmal „News“ und „Beliebteste Guides“. Die Überschrift ist weg, die beiden Gruppen-Labels
des Boards (`BoardGroup` in `components/home/news-board.tsx`) sind jetzt die `<h2>` der Station.
`HomeStop` nimmt dafür bei `stacked` eine Station ohne `heading`. Für die Suche hing nichts daran:
In den 90 Tagen bis zum 22. November fand Google die Startseite mit keiner Suche, in der „News“
oder „Guides“ vorkam, gesucht wird nach „wartezeiten“, „auslastung“ und „prognose“. Die Station
ist bei 1440 px 165 px niedriger (978 auf 813 px), auf dem Handy 198 px (1.098 auf 900 px). Die Keys
`homeStory.reading.title` und `.lead` sind in allen sechs Sprachen entfernt.

Der Reiseplaner darunter hieß „Reise planen“ mit „Welcher Park an welchem Tag“ darunter, und unter
jeder der vier Kacheln stand der Lead des Hubs, viermal nach dem Muster „Ein Kalender für … und ein
Planer für …“. Jetzt hat die Station eigene Texte (`homeStory.trips`): „Freizeitpark-Urlaub
planen“ und „Ein Andrang-Kalender für alle Parks der Region und ein Planer, der sie passend zu
Tickets und Hotel auf deine Tage legt“. Unter jeder Kachel stehen nur noch die Parks der Region in
einer Zeile, aus dem neuen `tripRegions.<slug>.home.teaser` („Disney, Universal, SeaWorld,
LEGOLAND und Busch Gardens, Wasserparks inklusive“). Der Teaser liegt nicht unter `hub`, weil er
nicht unter der Überschrift des Hubs steht, und nicht unter `nav`, das auf den Regionsseiten in den
Browser geht. `pnpm test:trip-regions` verlangt ihn für jede Live-Region. Bei 1440 px passen Titel,
Lead und Teaser in allen sechs Sprachen auf eine, zwei und zwei Zeilen; vorher liefen drei der vier
Teaser über drei Zeilen. Die Station ist dort 587 statt 575 px hoch, auf dem Handy 1.274 statt
1.226 px, weil Titel und Lead dort mehr Zeilen brauchen. Beide Stationen zusammen sind bei 1440 px
153 px niedriger, auf dem Handy 150 px.
