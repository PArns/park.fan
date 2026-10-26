### Production-Deploys warten in GitHub Actions, bis `main` zehn Minuten ruhig ist

Ein Push auf `main` startet keinen Vercel-Build mehr (`vercel.json`, `git.deploymentEnabled.main: false`). `.github/workflows/deploy-production.yml` wartet `DEPLOY_DEBOUNCE_MINUTES` (10) und ruft dann einen Vercel Deploy Hook auf. Jeder weitere Push bricht das Warten des vorigen Laufs ab, also werden Merges mehrerer Sessions kurz hintereinander zu einem Build. Am 25.10. (17:43 und 18:07) und am 26.10. (08:13 und 08:19) waren das jeweils zwei volle Builds. `[deploy now]` im Commit oder ein manueller Start des Workflows deployt sofort.

Gewartet wird in GitHub Actions statt im Ignored Build Step, weil Vercel jede Minute im Build-Container mit beiden Kernen abrechnet, Warten eingeschlossen. Zehn Minuten Warten wären 20 CPU-Minuten pro Build gewesen, doppelt so viel wie ein ganzer Build. Build CPU Minutes waren vom 19. bis 26.10. mit 17 Stunden und $3,58 der größte Posten der Rechnung. Der `[skip deploy]`-Poll in `scripts/vercel-ignore-build.sh` zahlte denselben Preis und ist entfernt, `pnpm test:ignore-build` ist entsprechend angepasst.

Vor dem Merge brauchen Vercel einen Deploy Hook für `main` und GitHub das Secret `VERCEL_DEPLOY_HOOK_PRODUCTION` (`docs/development/deploys.md`).
