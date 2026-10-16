### Build: ein Prerender-Worker pro Kern, und Tag-Archive ohne Index werden nicht mehr gebaut

Vercel baut auf 2 Kernen, und Next startet per Default einen Worker weniger als Kerne: „Generating
static pages using 1 worker (3692/3692) in 5.9min“, 356 von 464 s bis `Build Completed`.
`experimental.cpus` steht in `next.config.ts` jetzt auf `availableParallelism()`. Außerdem baut
`/[locale]/blog/tag/[tag]` nur noch die 163 indexierbaren Tag-Archive (`isIndexableTag`); die
übrigen 720 sind `noindex`, stehen in keiner Sitemap und rendern beim ersten Aufruf, danach aus dem
Cache. Lokal auf 2 Kernen gemessen: Static Generation 6,1 → 3,4 min, `pnpm build` 408 → 247 s,
3.692 → 2.972 Seiten, Speicherspitze 3,7 GB. Messreihe in `docs/optimization/decisions.md`.
