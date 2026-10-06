### °F an jeder Temperatur, Mount-Gates über Stores, ein UI-Kit im Admin

#### Temperatur, Wind und Regen in der gewählten Einheit

Vier Stellen zeigten °C, auch wenn der Besucher °F gewählt hatte: die Temperatur im Heute-Panel der Parkseite samt „Gefühlt", die Wetter-Kachel am Parkeingang, das Wetter im Startseiten-Hero und das Aria-Label der Spalten im Stundenchart. Die ersten drei rendern jetzt `Temp` mit der neuen Option `withUnit` und zeigen „13 °C" oder „55 °F", gewählt per CSS wie überall sonst, ohne dass ein Render die Einheit liest. Das Aria-Label nennt beide Skalen („14 °C (57 °F)"), weil ein Attribut nicht per CSS umschaltet. Der Kalender-Tagesdialog schrieb Wind fest in km/h und Regen in mm; er rendert jetzt `Wind` und `Precip`.

#### Kein `setTimeout(…, 0)` mehr als Mount-Gate

Sprachbanner, Analytics-Opt-out, Theme-Schalter, Hero-Fallbackbild, Countdown-Uhr, Blog-Editor-Entwurf, das Hero-Foto im Admin und die Standortanzeige der Capture-Seite setzten ihren Client-Zustand per Timer oder Microtask in einem Effekt, was pro Mount einen zusätzlichen Paint kostet. Sie lesen ihn jetzt über `useSyncExternalStore` (`useMounted`, `useBrowserNow` oder einen eigenen Store über `localStorage` mit `storage`-Event). Sprachbanner und Blog-Sprachhinweis teilen sich dafür `useBrowserLocale`. Sichtbar wird das am Theme-Schalter im Telefonmenü: Im hellen Theme stand der Knopf beim Öffnen bisher erst links und glitt dann hinüber, jetzt steht er sofort richtig. Die Ausnahmen stehen in `docs/rules/a-mount-gate-reads-a-store-never-a-timer.md`.

#### Ein UI-Kit im Admin

`app/admin/_lib/ui.tsx` und `app/admin/_ui/primitives.tsx` waren zwei Kits für dieselben Aufgaben. Es gibt nur noch `_ui/primitives.tsx`: Abschnitte sind `Panel`, Kästen darin `Tile` und `StatTile`, Kennzahlen `Meta`, Pillen `Chip`. Die Formatter liegen in `_lib/format.ts`. Die Crowd-Pille im Admin nutzt die Farben der öffentlichen Seite, „moderate" ist also grün statt bernsteinfarben.
