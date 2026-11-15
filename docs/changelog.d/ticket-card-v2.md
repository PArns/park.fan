### Die Ticket-Karte empfiehlt zuerst, was man kauft, und passt in eine Spalte

In 2.22.1 lief „Tickets für diesen Plan“ in der 340-px-Spalte für Orlando 14.–30. November auf
1716 px: je Resort fünf Tages-Chips, Gültigkeitsbalken, Hopper-Urteil, Regeln und sechs
Kaufknöpfe untereinander, die 14-Tage-Tickets als gestrichelte Zeile ganz unten. Was man kaufen
soll und wo, ging darin unter. Jetzt steht oben die Empfehlung, und die Karte misst für 15.–30.
November 879 px (Universal 5 Tage, dann Disney 6 Tage, die 14-Tage-Tickets eingeschlossen).

- **Empfehlung** (`TicketPick` in `components/trip-regions/planner/plan-tickets-card.tsx`): zwei
  Pakete zum Vergleichen nach Parktagen. „Passend zu diesem Plan · 11 Parktage“ nennt die Tickets
  mit dem Hopper, wo die API ihn empfiehlt („Disney 6 Tage + Park Hopper“), „14-Tage-Tickets
  aus UK-Shops · 28 Parktage“ die Alternative der langen Reise mit dem, was der Katalog über sie
  sagt (`ticketFacts`: „14 Parktage in 18 Tagen · Park Hopper inklusive“), dem Combo-Satz und
  „Damit planen“. Je Paket steht der Händler einmal, je Ticket ein Knopf mit dem Resort; die
  offiziellen Shops stehen in einer leisen Zeile darunter und sind nie versteckt. Preise kennt
  der Katalog nicht, also behauptet die Karte weder „ab“ noch eine Ersparnis.
- **Welcher Link kauft** (`primaryTicketLink`, `officialTicketLink` in
  `lib/trip-regions/plan-tickets.ts`): ein gesponserter Händler zuerst, sonst der erste, der nicht
  der Betreiber ist, jeweils der Shop des eigenen Landes zuerst. Steht ein gesponserter Link in der
  Empfehlung, trägt ihr Kopf „Anzeige“ mit der Provisions-Erklärung, und der Link sagt
  „Partnerlink“; heute ist im Katalog keiner markiert, also zeigt die Karte keins von beiden.
- **Je Ticket eine Zeile** (`SuggestionRow`): „Universal Orlando · 5-Tage-Ticket“ und „16.–22.
  Nov. · 5 von 7 Tagen“, aufgeklappt die Chips, der Balken, das Hopper-Urteil mit „Mit Park-to-Park
  planen“, „Wie das Ticket gilt“ und alle Shops (`trip_ticket_details_opened` beim Öffnen).
- Kaufknöpfe zeichnen `BuyLink` und `BuyLabel`, in der Empfehlung wie in der Shop-Liste, mit
  derselben Zählung (`ticket_link_clicked`). Der Satz unter dem Titel und die neuen Überschriften
  enden ohne Punkt. Dieselbe Karte steht im Tickets-Schritt des Assistenten.

Geprüft mit `pnpm test:orlando-plan` (231, neu: `ticketFacts`, `primaryTicketLink`);
`scripts/check-planner-orlando.mjs` liest die Empfehlung und die aufklappbaren Zeilen.
Beschreibung: [Orlando-Planer](../features/orlando-planner.md).
