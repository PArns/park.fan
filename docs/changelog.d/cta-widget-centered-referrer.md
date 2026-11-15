### Der CTA-Kasten im Beitrag steht mittig und gibt park.fan als Herkunft weiter

`BlogCtaWidget` (`components/blog/blog-cta-widget.tsx`) zog sich bisher über die ganze Textbreite,
Text links, Button rechts. Jetzt ist der Kasten nur so breit wie sein Inhalt, höchstens `max-w-xl`,
steht mittig im Text, Satz und Button untereinander und zentriert. Auf dem Handy bricht die
Beschriftung im Button um, statt den Button auf volle Breite zu ziehen.

Der Link öffnet weiter in einem neuen Tab, trägt aber nur noch `rel="noopener"` statt
`noopener noreferrer`. Mit der `Referrer-Policy: origin-when-cross-origin` aus `next.config.ts`
sieht die Zielseite damit `https://park.fan` als Herkunft, ohne den Pfad. Die übrigen externen
Links im Beitrag bleiben bei `noreferrer`. Anlass ist der Quick-Pass-Shop des Phantasialand, den
die News `phantasialand-quick-pass-online` und der Guide `phantasialand-tipps` mit einem CTA samt
`utm_source=park.fan` verlinken.
