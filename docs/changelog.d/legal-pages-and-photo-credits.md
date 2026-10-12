### Impressum und Datenschutzerklärung neu, Fotos von Dritten tragen überall ihren Credit

Impressum nach § 5 DDG und § 18 Abs. 2 MStV statt TMG; Prognosen heißen dort Schätzungen. Die
Datenschutzerklärung (DE neu, EN übersetzt) beschreibt, was die Seite tut: api.park.fan selbst
gehostet ohne IP-Logs, die drei eigenen Cookies, Push, Tagesplan-Kopie, Foto-Einsendungen mit
Turnstile, CARTO-Kacheln statt OSM, Umami als US-Auftragsverarbeiter. Userback und die
Kontaktformular-Vorlage sind raus.

Suno- und Instagram-Embeds laden erst nach dem Tippen (`BlogSunoEmbed`, `BlogInstagramEmbed`), wie
YouTube. Der Footer nennt die Datenquellen, Queue-Times mit „Powered by Queue-Times.com".

`PhotoCredit` liest den Credit aus `lib/media/manifest-attribution.ts` (generiert, nur die 7 Fotos,
die einen brauchen) und steht damit auf Karten, Park- und Ride-Hintergründen, Hub-Heroes, Menükacheln
und `DialogHero`. `OWN_PHOTO_AUTHORS` in `lib/media/credit.ts` ist die eine Liste der eigenen Namen.
`pnpm generate:media` bricht bei einer `cc-by*`-Lizenz ab
([keine Creative-Commons-Fotos](../rules/no-creative-commons-photos.md)).
