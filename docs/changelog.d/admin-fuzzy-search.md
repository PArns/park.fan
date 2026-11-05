### Das Admin sucht Parks und Fahrgeschäfte so tippfehlertolerant wie die Seite

Die `/`-Palette, die Parkliste, die Fahrgeschäfte eines Parks, die Weiterleitung aus der
404-Liste und der Tagesvergleich unter `/admin/ml/vergleich` suchten nur nach der getippten
Zeichenfolge, als `ILIKE` im Backend oder als Teilstring über die geladene Liste. „phantsialand“
fand dort nichts. Jetzt fragen sie zusätzlich die Suche der Seite (`/api/search`, also
`/v1/search`) und ordnen nach denselben Punkten wie die öffentliche Palette. Die eigenen
Admin-Abfragen bleiben daneben, weil sie den kuratierten Namen vor dem nächsten Index-Neubau, den
Slug und stillgelegte Fahrgeschäfte kennen. In der Palette öffnet eine eingefügte Park- oder
Fahrgeschäft-ID direkt den Editor, eine kopierte Adresse führt über `/admin/go`.

Die Rangfolge (`rankByMatch`, `lib/utils/search-ranking.ts`), die Abfrage (`useSiteSearch`) und das
Entprellen (`useDebouncedValue`) liegen jetzt an einer Stelle und werden von `useSearchResults`
und dem Admin geteilt (`useFuzzyHits`, `mergeSearchHits`, `withFuzzyMatches`). `SearchSelect`
bekommt dafür `fuzzy="park"` oder `fuzzy="attraction"`. `pnpm test:search-hits`.
