# three.js animations (REQUIREMENT)

Every three.js animation (the glossary coaster player, the homepage hero, any future 3-D scene) is
built **research-first** and **verified from every camera perspective** before it ships.

1. **Research the real-world reference first, then implement.** Before modelling a real figure (a
   coaster element, a ride, a building), look up what it actually looks like: reference photos and
   POVs, the manufacturer, the named element. Encode the correct geometry, not an approximation from
   memory, and name a non-obvious reference in a code comment (the celestial spin is a Mack
   dual-track element).
2. **Look at it from every camera it exposes** (the coaster player: Front, Follow and Onboard),
   across the whole timeline (entry → element → exit), in both day and night themes. A figure that
   looks right head-on but self-intersects, leans or clips in another view is not done.
3. **A green build is not enough.** `tsc`, lint and build passing is necessary, not sufficient.
4. **What the frames must show**: the track does not pass through itself in a way that reads as wrong
   (a loop's entry and exit cross over and under with a small depth offset), a figure is centred in
   the front view unless offset on purpose, and the train sits on the rails with no z-fighting.

## Check

`node scripts/render-coaster-elements.mjs [element …]` drives the real scene module in Chromium via
Playwright and writes one contact sheet per element and theme (`OUT/<element>-<theme>.png`, a 3 × 5
grid: one row per camera, one column per timeline position; `OUT` and `SAMPLES` are environment
variables). The coaster engine is `lib/three/coaster/` (`kit.ts`, `elements.ts`, `scene.ts`).
