### Die Kapitel der Reise-Hubs sind immer offen

Auf den vier Hubs (Orlando, Südkalifornien, Japan, Paris) und ihren Monatsseiten klappte sich mit
einem Plan der Kalender in „Kalender für alle 16 Parks, Tag für Tag“ und die Resorts in eine Zeile
mit ihren Namen ein (`HubPlanFold` in `components/trip-regions/hub/hub-trip-state.tsx`). Jetzt sind
alle Kapitel in beiden Zuständen offen, ohne Knopf zum Ein- und Ausklappen: Mit einem Plan steht
„Deine Reise“ als Kapitel 01 oben, Kalender, Resorts, beste Reisezeit und Fragen folgen darunter wie
auf der Landingpage. Weil sich nach der Hydration nur noch Kapitel 01 ändert, verschiebt der Wechsel
in den Planzustand nichts darunter. Die Fragen behalten ihr Akkordeon pro Frage; ein Kapitel-Fold
lag um sie nie. `HubPlanFold`, die Zusammenfassung der Resorts und `tripHub.howItWorks.calendarFold`
in sechs Sprachen sind entfernt ([Orlando-Hub](../features/orlando-hub.md#two-states)).
