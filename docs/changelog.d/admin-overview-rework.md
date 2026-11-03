### Admin: eine Übersicht als Lagebild, eine Seitenleiste nach Aufgaben, ein Login ohne Sprung

`/admin` öffnet mit einem Lagebild statt einer Kennzahlenwand. Oben steht ein Satz zum schlimmsten
Problem („4 Dinge warten auf dich“) über dem Parkfoto, darunter die Schnellzugriffe. Es folgen eine
Karte pro Problem mit ihrer Schaltfläche, die Zahlen des Tages (Besucher jetzt und heute, Wartezeiten
pro Stunde, Server, Datenbank, Queues, Modelle, Einsendungen), eine Tabelle der Bereiche mit einem
Strich pro Prüfung und der Katalog. Alles Urteil kommt aus `deriveAdminHealth`
(`lib/admin/health.ts`, `pnpm test:admin-health`, 11 Fälle); `/admin/system` färbt mit denselben
Schwellen.

Die Seitenleiste ist neu sortiert: Kuratieren, Inhalte, Publikum, Betrieb, das Konto unten im
Kontomenü. Gruppen lassen sich einklappen, und System, Queues, ML-Zentrale, Datenqualität und
Einsendungen tragen ihren Zustand als Punkt oder Zahl. Die Seite liegt eingerückt unter einer
schlanken Topbar, und Admin, Login und Freigabeseite zeigen das echte park.fan-Lockup mit
„Admin“-Etikett (`AdminBrand`).

Der Login sprang zweimal, wenn Turnstile nachlud: erst um das 72 px hohe Widget, dann um die
verschwindende Zeile „Sicherheitsprüfung läuft.“. `TurnstileWidget` reserviert die Höhe jetzt
selbst, die Statuszeile bleibt in jedem Zustand eine Zeile. CLS auf dem Handy 0,095 → 0, am
Desktop 0,019 → 0, gemessen am Dev-Server mit Cloudflares Testschlüssel.
