### minimatch 11 statt 10 schließt eine DoS-Lücke in den Lint-Werkzeugen

`pnpm-workspace.yaml` hebt `minimatch@10` per Override auf `^11.0.8`. Ein Glob-Muster kann in
minimatch bis 11.0.0 über die Vervielfachung seiner `globparts` sehr viel Rechenzeit kosten
([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), moderat, Dependabot
#94). Die 10er-Linie bekommt keinen Fix, und typescript-eslint verlangt auch in 8.72.2 noch `^10`,
deshalb ein Override statt eines Updates. Gezogen wird minimatch nur von ESLint und
typescript-eslint; typescript-estree ruft `minimatch(path, pattern, { dot: true })` auf, und das
bietet 11 unverändert. `pnpm audit` meldet danach keine Lücke mehr, `pnpm lint` läuft ohne Fehler.
