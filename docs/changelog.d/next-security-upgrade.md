### Next.js 16.4.2 schließt drei Sicherheitslücken, und `pnpm build` läuft wieder

`next` und `eslint-config-next` stehen auf 16.4.2 statt 16.4.0. Next 16.4.0 bricht den Build mit
`SecurityFatalError` ab, weil drei Advisories alle Versionen bis 16.4.0 betreffen: Remote Code
Execution über die Image Optimization API bei SVG-Dateien
([GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw), kritisch), Remote Code
Execution in `use cache`-Funktionen, die typisierte Arrays zurückgeben
([GHSA-673q-mjm6-r5xr](https://github.com/advisories/GHSA-673q-mjm6-r5xr), kritisch), und Denial
of Service im App Router über Server Actions
([GHSA-p3m5-59mp-jv5r](https://github.com/advisories/GHSA-p3m5-59mp-jv5r), hoch). Im Lockfile
ändern sich nur die Next-Pakete. `pnpm build`, `pnpm lint` und `tsc --noEmit` laufen ohne Fehler.
