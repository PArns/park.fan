### Der Ticketmarkt ist ein Hinweis, kein Filter mehr

Ob ein Ticket in den USA oder in einem UK-Shop verkauft wird, entscheidet nicht mehr, was der
Reiseplaner anbietet: Kaufen darf man es in jedem Shop. Der Ticket-Schritt hängte an Tickets, die die
Betreiber nicht selbst in den USA verkaufen, „Außerhalb der USA verkauft“ an, die Zeile für lange
Reisen begann mit „Außerhalb der USA gibt es 14-Tage-Tickets“. Jetzt sagt ein Tag, wo es das Ticket
gibt, „UK-Shop“ oder „Internationaler Shop“ (`marketLabel` in `lib/trip-regions/plan-tickets.ts`,
`TicketMarketTag`), am Eintrag, am Combo Ticket und an jedem Kauf-Link, dessen Händler woanders
verkauft (`linkMarket`, am offiziellen Link der Markt des Produkts). Die API schlägt seitdem auch die
UK-Tickets selbst vor, wo sie besser zum Plan passen; die Kauf-Links zeigen dann „UK-Shop“ daneben.
Die regionseigenen Texte `market.intl` für Orlando, Kalifornien und Japan sind durch
`tripPlanner.tickets.market` in sechs Sprachen ersetzt. Im Admin heißen die Märkte „US-Shops“,
„UK-Shops“ und „Händler im Ausland“, und der Hinweis am Feld sagt nicht mehr, dass der Vorschlag nur
US-Produkte nimmt ([Trip planner](../features/orlando-planner.md#tickets)).
