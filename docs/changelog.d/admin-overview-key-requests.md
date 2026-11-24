### Admin: offene API-Key-Anfragen stehen in der Übersicht

Wer auf dem Entwickler-Dashboard einen Key beantragt, landete bisher nur auf `/admin/api-keys`, und
dort musste man nachsehen. Jetzt steht eine offene Anfrage auf der Übersicht unter „Wartet auf dich“:
eine Karte „2 API-Key-Anfragen warten“ mit den Projektnamen, der Zeit der ältesten Anfrage und
„Entscheiden“, das zu `/admin/api-keys` führt. Der Eintrag API-Keys in der Seitenleiste zeigt die
Anzahl. Die Karte entsteht in `deriveAdminHealth` (`lib/admin/health.ts`) wie die der offenen
Einsendungen, gelesen nur für den Owner, weil nur er die Anfragen sehen darf. Übersicht und
API-Keys-Seite teilen sich die Abfrage (`useKeyRequests`, jetzt in `app/admin/_lib/use-key-requests.ts`),
daher verschwindet eine entschiedene Anfrage auch aus der Übersicht.
