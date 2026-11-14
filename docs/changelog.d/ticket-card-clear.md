### Die Ticket-Karte des Reiseplaners zeigt ein Ticket pro Resort statt einer Textwand

„Tickets für diesen Plan“ war ein Satz, darunter die Zeile zu den 14-Tage-Tickets aus UK-Shops und
„Details zu den Tickets“, auf dem Telefon ein Sheet, am Desktop zwei Spalten mit Sätzen in der
340 px breiten linken Spalte. Bei Orlando, 15. bis 30. November mit Disney-Hotel, standen dort
bis zu vier Kauflinks und der Preis-Hinweis je Resort, die 14-Tage-Tickets mit noch einmal zehn
Links, und was man kauft, für welche Tage und warum, stand über die Sätze beider Spalten verteilt.

Jetzt ist die Karte die Tickets, ohne Klappe davor, im Ergebnis wie unter „Noch nicht“ im
Assistenten (`PlanTicketsCard`): oben ein kurzer Satz („Universal 5 Tage, dann Disney 6 Tage.“),
dann je Resort ein Ticket (`SuggestionTicket`) mit dem Produkt in Klartext („5-Tage-Ticket“, bei
Tagestickets „4 × 1-Day Passport“), den Parktagen als Chips mit Datum, der Gültigkeit als Balken
mit einem Feld pro Tag („Gültig 16.–22. Nov. · 5 von 7 Tagen“, `ticketWindowDays`) und dem Hopper
in einer Zeile: „Park Hopper lohnt sich“ mit „Magic Kingdom an 2 Abenden“ und „Mit Park Hopper
planen“ in einem getönten Kasten, die Abende als Mond auf ihren Chips (`hopperHighlights`), oder
„Park-to-Park bringt hier nichts“. Fensterregel, Hogwarts Express, Zusatztage und Promotion stehen
hinter „Wie das Ticket gilt“. Die Kauflinks sind Knöpfe, die Länder-Shops eines Händlers in einer
Reihe („Attraction Tickets“: „Deutschland (€)“, „Niederlande (€)“, `ticketLinkGroups`), der Shop
des eigenen Landes zuerst und getönt (`isVisitorStore`); der Preis-Hinweis steht einmal. Die
14-Tage-Tickets sind eine gestrichelte Zeile „Alternative“ unter den Tickets, mit „Damit planen“
und ihren Shops hinter einer Klappe. Zwei Spalten gibt es nur, wo die Karte breit genug ist
(`@xl`, der Assistent am Desktop).

`trip_ticket_details_opened` zählt jetzt „Wie das Ticket gilt“ mit dem Resort statt `surface`, die
Knöpfe heißen „Mit/Ohne Park Hopper planen“, und `ticket_link_clicked` zählt die Stelle unter den
Knöpfen, wie sie gezeichnet sind. `pnpm test:orlando-plan` prüft die neuen Helfer, `pnpm
check:planner --orlando` die Karte auf dem Telefon: ein Ticket pro Resort mit Kauflinks, 44 px hoch
und ohne Querscrollen ([Reiseplaner, Tickets](../features/orlando-planner.md#tickets)).
