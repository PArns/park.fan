### Jeder Kauf-Link nennt seinen Länder-Shop und dessen Währung

Attraction Tickets verkauft dasselbe Ticket in einem britischen, irischen, niederländischen,
deutschen und US-Shop, jeweils zu eigenen Preisen. Im Reiseplaner hießen alle diese Links nur
„Attraction Tickets“, sodass niemand sah, welcher Shop dahinter steckt. Die API liefert jetzt an jedem
solchen Link `store` (`{ country, currency }`), und der Link heißt „Attraction Tickets · UK (£)“,
„· Irland (€)“, „· Niederlande (€)“, „· Deutschland (€)“ oder „· USA ($)“ (`ticketStoreName` in
`lib/trip-regions/plan-tickets.ts`: Kurzname des Landes und Währungssymbol aus `Intl`, in allen sechs
Sprachen ohne neue Texte pro Land). Der Shop aus dem Land des Besuchers steht vorn (`visitorCountry`,
`orderTicketLinks`), danach die für seine Sprache; der offizielle Link behält seinen Namen, und ein
Länder-Shop braucht keinen „UK-Shop“-Tag mehr (`linkMarket`). Unter zwei oder mehr Links sagt eine
Zeile, dass die Preise je nach Land des Shops verschieden sind und sich der Vergleich lohnt
(`tripPlanner.tickets.links.compare`). Im Admin hat jeder Link ein Feld „Länder-Shop“ mit Land und
Währung, das beim Speichern erhalten bleibt
([Trip planner](../features/orlando-planner.md#tickets)).
