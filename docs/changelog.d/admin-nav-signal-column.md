### Admin: Die Punkte und Zahlen der Seitenleiste stehen in einer Spalte

Ein Eintrag mit Untermenü (ML-Zentrale, Traffic, Parky) hielt rechts 32 px für seinen Pfeil frei, jeder andere 10 px, also stand sein Punkt 22 px weiter links als die übrigen. `SidebarLink` gibt jetzt jedem Eintrag außerhalb der eingeklappten Leiste dieselben 32 px (`pr-8`), Untereinträge eingeschlossen; die Option `trailingSpace` entfällt.
