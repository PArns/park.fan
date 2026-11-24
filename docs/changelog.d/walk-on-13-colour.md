### Eine gemeldete 13 hat die Walk-on-Farbe

Efteling meldet für Danse Macabre 13 Minuten, das Walk-on-Signal, das sonst Disney benutzt. Die
Karte „Kurze Anstellzeiten in deiner Nähe" färbte den Balken trotzdem grün wie eine 15, während
Baron 1898 mit 5 Minuten daneben die Walk-on-Farbe bekam. `waitTimeCrowdTier`
(`lib/utils/crowd-level-styles.ts`) gibt für genau 13 (`WALK_ON_WAIT_MINUTES`) jetzt `very_low`
zurück. Das gilt überall, wo eine Wartezeit ihre Farbe von dort bekommt: Parkseite, Suche, Kompass,
Planer und Blog. 12 und 15 bleiben `low`; `pnpm test:typical-waits` prüft alle drei.
