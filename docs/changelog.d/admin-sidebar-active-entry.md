### Admin-Sidebar markiert unter `/admin/ml/vergleich` nur noch den Modellvergleich

Die Sidebar prüfte den aktiven Eintrag mit eigenem `pathname.startsWith(item.href)`, und `/admin/ml/vergleich` beginnt auch mit `/admin/ml`: ML-Zentrale und Modellvergleich standen beide als aktiv da. Sie fragt jetzt `activeNavItem()` aus `app/admin/_app/nav.ts`, das Breadcrumb und Gruppenname schon benutzen, und dort gewinnt der längste Treffer. Damit greift in der Sidebar auch `covers`: Auf einer Fahrgeschäftsseite (`/admin/attractions/<id>`) ist jetzt Parks markiert, vorher war es kein Eintrag.
