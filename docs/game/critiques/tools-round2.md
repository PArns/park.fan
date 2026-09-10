# tools — critic, round 2

Module: `lib/game/tools/` (4,755 lines, 14 files) · the build bar in every `/game` frame · commit
**`c3d669b`**.

**Weighted total: 8.26. FAIL by 0.24** (pass is 8.5). One hard gate failed, and it is the ownership
gate rather than anything in the code.

Independent grade. Round 1's 8.29 was taken at `c12856c` by the integrator and is marked STALE in
`STATUS.json`; four commits touching this folder have landed since (`2f6744b`, `b961728`, `e3a25ae`,
`73b9c4e`) plus `c3d669b`. I re-measured every number round 1 quoted rather than carrying it
forward, and two of them moved a long way.

## 1. Scores

| #   | Axis                  | Weight |   Score | One sentence                                                                                                                                                                                          |
| --- | --------------------- | -----: | ------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame             |   30 % | **7.9** | Four tabs now show real, distinct, legible pictures of the thing you are about to place — and the bar that holds them eats **55.6 %** of a 720 px viewport, clips a price in every 1280 frame, and the four newest tiles are a hairline scribble at **1.8 % ink**. |
| 2   | Fidelity              |   20 % | **7.8** | `footprintOffset`/`footprintDip` are a real, measured fix and the placed machine stands on the ground — but the ghost they corrected is a 61.5 × 392 × 46 m slab in a 512 m park, and move is still click-arm-click. |
| 3   | Extensibility         |   20 % | **8.7** | The absolute rule holds (my grep finds no content id outside `selftest.mjs`) and unplaceable items went 22/55 → **7/70**, all honest routes; the guard written to enforce that rule catches **2 of 7** probes and misses a whole shipped pack. |
| 4   | Budget and behaviour  |   15 % | **8.5** | `c3d669b` correctly retracts three of its own cost claims against a baseline — and the quantity it retracted onto (`workMs`) starts its clock *after* `sources.build()`, i.e. after the only part where a 392 m circuit differs from a bench. |
| 5   | Determinism and state |   10 % | **8.8** | Suite green at 96 checks, money exact to the cent through a real placement, save untouched by history — but the selftest for this round's headline formula re-implements it instead of importing it. |
| 6   | Honesty of the report |    5 % | **8.6** | A public retraction with a baseline and an OPEN issue the module found and did not fix, against a `reports/tools.md` that is four commits out of date and contradicts itself inside one file. |

**7.9 × 0.30 + 7.8 × 0.20 + 8.7 × 0.20 + 8.5 × 0.15 + 8.8 × 0.10 + 8.6 × 0.05**
**= 2.370 + 1.560 + 1.740 + 1.275 + 0.880 + 0.430 = 8.255 → 8.26.**

## 2. Hard gates

| Gate                                     | Verdict     | What answered it                                                                                                                                                                       |
| ---------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zero console errors / hydration warnings | **pass**    | `errors: []`, `hydration: []` in `.game-render/regrade/report.json`, `bar-base/report.json`, `bar-coaster/report.json`. Two `WebGL: INVALID_VALUE: bufferSubData: buffer overflow` **warnings** in all three, identically, including the pre-change baseline. Not errors, not hydration; recorded below, not gated. |
| Extensibility ≥ 5                        | **pass**    | 8.7.                                                                                                                                                                                    |
| Touched only its own                     | **FAILED**  | `git show --stat --name-only e3a25ae` → `lib/game/content/packs/core-classic/pack.json`, `lib/game/demo-park/plan.ts`, `lib/game/track/selftest.mjs`, `scripts/test-game-lint.mjs`. Four files, +122/−0. **None is declared in `docs/game/requests/tools.md`** — `grep -n "pack.json\|plan.ts\|track/selftest\|test-game-lint" docs/game/requests/tools.md` returns one unrelated line. See §4.6. |
| No `@babylonjs/core` barrel import       | **pass**    | `deep import check: 0` in `scratchpad/gates.txt`.                                                                                                                                        |
| No module-scope `window`/`document`/`navigator` | **pass** | One hit in the whole folder — `lib/game/tools/thumbs.ts:704`, `document.createElement('canvas')`, inside `toDataUrl()`'s body.                                                            |
| `pnpm test:game` green, `tsc` clean, `eslint` clean | **pass** | `suite exit=0`; `✓ tools selftest: 96 checks clean` (was 88), `✓ game lint: 265 files clean`; `tsc (exit 0)`; `eslint lib/game` 0 errors, 3 warnings, all of them in `guests/crowd.ts` and `rides/selftest.mjs`, none in `tools`. `git status` clean. |

## 3. The frames I opened, by filename

At `c3d669b`'s tree unless marked.

- **`.game-render/bar-base/1300-scenery-bar.png`** — 10 of 21 scenery items with real renders: a Victorian lamp post, a wooden bench, a litter bin, a stone planter, a tiered fountain, an entrance arch, a flag, an iron fence, a box hedge, an oak. Each on the same sky/grass stage with a contact shadow, name, price and footprint. This is the single biggest visible change since round 1. The **box hedge is drawn larger than the oak** beside it, and the captions say 2 × 0.8 m and 2.52 × 2.52 m.
- **`.game-render/bar-base/1300-scenery.png`** (1440 × 900) — the whole screen. The tray + belt + toolbar run y 437→885, 448 px of 900. A third row of cards is sliced by the tab belt with no fade and no scrollbar. Two pairs of circular-arrow buttons (rotate, undo) sit in one nine-control row, all four greyed at rest.
- **`.game-render/bar-base/1300-shop-bar.png`** — 10 shops. Ice cream, Lemonade, Information and Smoothie bar are visually the same white kiosk with a green canopy; the report already measured that difference at 160 of 65,536 pixels and says so.
- **`.game-render/bar-base/1300-ride-bar.png`** — 5 rides, one row, bar 280.6 px. Carousel, ferris wheel, chair swing, top spin, wave swinger, all distinct and all placeable. Round 1's "ride items are listed but unavailable" is gone.
- **`.game-render/bar-base/1300-building-bar.png`** — the six tiles whose ink boxes are byte-for-byte 90 × 151 (brick wall, plaster wall, arched window, double door, concrete wall, panorama window) are **not** the same picture: the arch, the door leaf and the brick/plaster/concrete surfaces read at tile size. The identical ink box is a wall being a wall. Looking is what settled that; the JSON alone said "suspect".
- **`.game-render/bar-coaster/1300-coaster-bar.png`** — 8 tiles. Four layouts drawn as a hairline dotted outline of the track plan over a soft dark ellipse two to three times its size, half of which sits *above* the horizon; four types greyed with "needs the track tool" and a pictogram. Nordwind and Alte Mühle are not distinguishable as shapes at this size.
- **`.game-render/bar-coaster/tiles/coaster/core_classic_nordwind.png`** — the raw 320 × 160 harvest. A 1-px black scribble. I counted the alpha myself: **902 pixels above α 8 out of 51,200 = 1.8 % coverage** (alte-muehle 2.4 %, kleiner-kreisel 2.0 %, kleiner-wirbel 2.7 %).
- **`.game-render/regrade/0900-entrance.png`**, **`1300-close.png`**, **`1830-overview.png`**, **`2230-ground.png`** — the standard harness at four times of day. In all four the active tab pill overpaints the card above it and **"€1,200" is sliced through the middle**; the three prices beside it are intact. `1830-overview.png` is a park compressed into the top 300 px with the Park panel taking another 288 px of width.
- **`.game-render/place/build-plot-hud.png`** (07:40, so the offset/dip code but **before** `73b9c4e`'s coaster tiles — the four layouts are still pictograms here, correctly for that tree). Cash reads **€1,317,000** against a start of €2,500,000: exactly Kleiner Wirbel's manifest cost of 118,300,000 cents, to the cent.
- **`.game-render/place/build-plot-near.png`** — the player-placed Kleiner Wirbel, whole, on the surface, footings visible, nothing buried. This is `footprintDip` working, photographed.
- **`.game-render/place/build-plot.png`** — the same machine from above. Its station canopy stands in open grass and **no path reaches it**, which is the OPEN issue the module filed against itself. The frame agrees with the module.
- **`.game-render/tools-r2-phone/1300-shop.png`** and **`1300-shop-bar.png`** (2026-09-09, one day stale; the two later commits touched coaster tiles and STATUS only). At 390 × 844 the build bar is **not on screen at all** — the Park panel covers it — although `report.json` records the bar at 373.5 px and 12 of 12 tiles drawn into 104 × 52 px wells. The "bar" crop the harness took is a crop of the Park panel.

**No frame at this commit shows a ghost.** Round 1 had three (`tools-ghosts/`, dated 2026-09-06, i.e. before `footprintOffset` existed). The two fields this round is built on are evidenced only by numbers, in `.game-render/place/log.txt`: `pos [148.6,12,-91.5]` against `box [176.6,-68.3]` — a delta of exactly the declared `footprintOffset: [28.0, 23.2]` — and the same click reporting `y 8` at 07:33 and `y 12` at 07:39, which is the declared `footprintDip: 3.99` arriving. That is good evidence. It is not a picture, and under the prime rule the thing the round is named after is ungraded by photograph.

## 4. Findings, ranked by what they are worth

### 4.1 The bar takes 55.6 % of the screen and there is no way to shut it

Measured on the pixels, not estimated: in `.game-render/regrade/1830-overview.png` the tray's blue
header band begins at **y = 306** and the toolbar's lower edge is at **y = 706** — 400 px of 720,
**55.6 %**. At 1440 × 900 it is 448 of 900 = 49.8 % (`bar-base/report.json`, `bar.h`). At 390 × 844
it is 373.5 of 844 = 44.3 % (`tools-r2-phone/report.json`).

The bar covers the **near** ground, which is the ground you place things on. In `1830-overview.png`
the entire park is a 300 px strip and everything a pointer could reach is behind the tray. The
module's own report ranks this fourth in "what is weak" and names the answer ("a collapse control on
the tray's header ... not in the agreed spec and so is not in this round"). It is the single most
valuable thing left, it costs one chevron, and it is the difference between a build tool and a
catalogue with a park behind it.

### 4.2 The ghost is still a box, and the module now owns the machinery that would fix it

`ghost.ts`'s docblock says a real preview "cannot be done honestly today: every module in this game
draws its content as thin instances of a batch built at boot, so there is no 'one bench' to clone."

`thumb-sources.ts`, added in the same round, does exactly that: `createSources().build(studio, item)`
returns real standalone meshes for `scenery`, `shop`, `ride`, `building` and `coaster`, built from
the owning modules' own geometry functions, one instance, on demand. Fifty-nine of them were built
in the run that produced `bar-base/report.json`. The claim in `ghost.ts` was true in round 1 and was
not revisited when the file that refutes it landed.

Two real obstacles remain and neither is the one written down: the meshes are built into the
**studio's** scene, and a per-pointer-move build is not free. Both are engineering, not
impossibility, and `previewOf()`/request §7 is still the clean seam. What is not defensible is the
docblock.

### 4.3 The four coaster tiles are 1.8 % ink, and the shadow is bigger than the coaster

`core_classic_nordwind.png`: alpha bbox 224 × 110, **902 pixels above α 8 in 51,200 — 1.8 %**. The
other three are 2.0 %, 2.4 % and 2.7 %. Every other tile in the bar is a shaded, coloured solid;
these four are a 1-px dotted wireframe, and at the 182 × 91 well they are drawn in
(`bar-coaster/report.json`) they are a smudge. The contact ellipse composited behind them is two to
three times the ink's extent and darker than it, and half of it is painted into the sky above the
horizon line.

`STATUS.json`'s closedIssue for this says "ink filling 29.7–56.7 % of the frame". That figure is the
**bounding box**, which for a scribble says nothing about whether you can see it — the same 224 × 110
box would score identically if the tile were empty except for four corner dots. The measurement that
matters is coverage, and nobody took it. The claim "**4 of 4 layouts drawn, 4 of 4 distinct**" is
true of the SHAs and false of what a person can tell apart: I opened the tile pair at 4× and could
not name which of Nordwind and Alte Mühle I was looking at.

The plan is the right thing to draw — the closedIssue's reasoning about "392 m of out-and-back
against a 112 m twister" is correct. It needs to be drawn as a coaster: a thicker line, a colour,
the station and lift marked, and no ellipse.

### 4.4 The guard named after the module's absolute rule catches two of seven probes

The rule is "no pack id **and no item id** anywhere in `lib/game/tools/`". The rule **holds** —
`grep -rn "core-classic\|neon-lagoon\|parkfan-architecture" lib/game/tools/ --include=*.ts
--include=*.tsx | grep -v selftest` is empty.

The guard added in `e3a25ae` is `/['"`](core-classic|neon-lagoon)(:[\w-]+)?['"`]/`. I ran it against
seven evasions:

    CAUGHT   if (item.key === 'core-classic:oak')
    CAUGHT   if (item.pack === 'core-classic')
    MISSED   if (item.id === 'oak')
    MISSED   if (item.id === 'nordwind')
    MISSED   if (item.key === 'parkfan-architecture:rotunda')
    MISSED   if (item.pack === 'parkfan-architecture')
    MISSED   const k = pack + ':' + 'oak';

Two things follow. A bare **item** id — half the rule by name, and the form you would actually type
inside a helper that has already split the key — is not covered at all. And `parkfan-architecture`
is not a hypothetical third pack: it is registered by `lib/game/buildings/pack.ts`, and **11 of the
21 building tiles I looked at in `1300-building-bar.png` come from it**. The guard names two of the
three packs the game ships.

A pattern built from `BUNDLED_PACKS` plus every registered module pack, and a second rule matching
any string literal that equals a known item id, would close both. The guard was proved by sabotage,
which is the right way; it was sabotaged with the two cases it already caught.

### 4.5 `workMs` starts its clock after the geometry is built

`c3d669b` is a good commit: it retracts three cost claims and it is right about all three.
`slowestMs` is **10,628.1 ms on all four `bar-base` tabs** — scenery, shop, ride and building
alike, three of which predate the change — so it is the studio's first-item boot. And I confirmed
from the source that the four coaster failures cost nothing: `renderOne` has
`if (!build) return null;` **before** `const t0 = performance.now()`, so a source that declines
never enters `workMs`, `slowestMs` or `waitMs`.

The same line is the problem. `await sources.build(...)` is where a bench becomes one `toMesh` call
and where a coaster becomes 392 m of rails, spine, ties, supports, footings and a station — and it
is outside the clock, for every tile. So the comparison the retraction rests on,
`(16,171−10,046)/3 = 2,042 ms` against scenery's `(50,756−10,628)/20 = 2,006 ms`, "i.e. the same",
is arithmetic over a quantity that omits precisely the term in which the two would differ. The
conclusion may well be right. The measurement cannot show it.

One residue nobody has explained: opening the tray costs **+12 draw calls and +7,168 triangles**
(475 → 487, 666,662 → 673,830), identically in `bar-base/report.json` and `bar-coaster/report.json`,
after the queue has drained (`pending: 0, queued: false`). The tiles are DOM images. Round 1's
census claim was "+3 draw calls for the ghost" and "5 meshes, 4 materials, fixed"; `ToolsStats`
still carries the docstring "Babylon objects this module owns" over the number 5, and the module now
owns a second Scene and a render target as well. `thumbnailStats()` reports those separately, so this
is a stale docstring and an unexplained twelve, not a hidden cost.

### 4.6 The ownership gate, and why it is a process failure rather than a code one

`e3a25ae` writes into `lib/game/content/packs/core-classic/pack.json` (the content packs, named by
hand in CRITIC.md's gate), `lib/game/demo-park/plan.ts` and `lib/game/track/selftest.mjs` (two other
modules) and `scripts/test-game-lint.mjs` (outside `lib/game/`). Round 1's critique cleared a smaller
overreach — `ui/hud.tsx` +8/−3 and 40 i18n keys — on exactly two grounds: "granted in writing by the
integrator" and "declared in the module's requests file". Neither is true of these four.

The changes themselves are right and none of them is hidden: the manifest fields are the only place
`footprintOffset` can live, the demo park had **zero** legal positions for the smallest bundled
layout before `build-plot`, the track selftest is where the offset can be measured against a built
spline, and the lint guard was asked for by the module's own rule. All four are described at length
in `STATUS.json`'s closedIssues. The remedy is three paragraphs in `docs/game/requests/tools.md`, not
a revert. But the gate is written down and the diff answers it, so it is recorded as failed.

### 4.7 The selftest for this round's formula is a copy of the formula

`lib/game/tools/selftest.mjs` pins `footprintOffset`'s turn at four yaws with a **local**
`const centre = (off, x, z, yaw) => …` rather than importing `rectCentre` from `main.ts`. The two
are identical today, arithmetic for arithmetic. They are also independent: change `rectCentre`'s sign
convention and the four checks stay green. This repo has a name for the pattern and a rule about it —
`attractionIsOutOfSeason()`'s "handgeschriebener Zwilling, also ändert man beide Hälften oder keine".
Nothing here says so, and this is the one formula in the module that has already shipped wrong once.

Related, smaller: nothing validates `footprintDip ≤ height`. The docblock's guarantee that the box is
right as drawn holds because the four bundled layouts declare a height spanning the whole profile
(`kleiner-wirbel` −3.99…15.00, declared 19). A pack that declares an above-origin height gets a ghost
shorter than its machine, silently — which is this field's own failure mode, spelled backwards.

### 4.8 Unplaceable items: 22 of 55 became 7 of 70, and every one is honest

Re-measured from the three manifests rather than repeated: 59 entries in the two JSON packs plus 11
in `buildings/pack.ts` = **70**, matching the bar's own "70 IN THE PACKS YOU HAVE LOADED" and the tab
badges (21 + 12 + 8 + 5 + 21 + 3). Exactly **7 are unavailable** — the four `rides`-category coasters
and the three flume slides, all `route` items, all carrying "needs the track tool" on the tile. Zero
are unavailable for "no module claims this kind", which was the whole of round 1's complaint.

**40.0 % → 10.0 %**, and round 1's finding 4.1 is answered. No credit is owed for a decision that was
never taken, because the palette answered it by getting the kinds claimed instead.

### 4.9 The tile strip does not know what time it is

Mean luminance of the two visible tile rows across the four times of day: **117.9 / 118.1 / 117.8 /
117.3** (a 0.3 % spread), against a world above the bar that goes **79.0 at 13:00 to 29.1 at 22:30**
(`regrade/1300-ground.png`, `2230-ground.png`, same crop boxes). At 22:30 the brightest object in the
frame is a grid of daylight postcards, **4.0×** the park behind it.

`thumb-sources.ts` argues the case for a fixed studio light in its own docblock, and the argument is
right: "the palette would change under a player who did nothing but wait." The trade it did not price
is the aggregate. A dimming overlay on the tray keyed to the sun costs one CSS variable and does not
touch a single cached picture.

### 4.10 Two visible layout defects at 1280 × 720

The **active** tab pill is taller than its siblings and overpaints the card above it: "€1,200" for
Entrance arch is sliced through the middle in `0900-entrance.png`, `1300-close.png`,
`1830-overview.png` and `2230-ground.png` — every 720 px frame in the standard harness — while €25,
€9, €18 and €40 in the same row are intact. And the compass badge and the toolbar's left corner
collide at that width; at 1440 they do not.

### 4.11 What the module got unambiguously right

The offset/dip work is the best kind of bug report in this repo: a bug that no test could see (green
build, zero console errors, "the size was pinned from day one and the position was never checked"),
found by clicking, measured in track samples (600 of 2001 underground, then 621 of 2001, then 0 of
601 over all 95 legal clicks), fixed generically with no item id, and pinned on the `track` side
against a built spline. The retraction in `c3d669b` is rarer still. And the OPEN issue the module
filed against itself — a player-built coaster whose station is 28.2 m from the nearest path against a
14 m service radius, going through green — is visible in `build-plot.png` and is a finding I would
otherwise have made.

## 5. What round 3 should do, most valuable first

1. **A collapse control on the tray header.** 400 px of 720 (`regrade/1830-overview.png`), no way to
   dismiss it. Everything else in this list is smaller than this.
2. **Draw the coaster tiles as coasters.** 1.8 % ink coverage over 51,200 pixels
   (`bar-coaster/tiles/coaster/core_classic_nordwind.png`), an unreadable pair at 4×, and a contact
   ellipse three times the object painted into the sky. Weight the line, colour the rails, mark the
   station, drop the ellipse — and measure coverage, not the bounding box.
3. **Point the studio at the ghost.** `thumb-sources.build()` already produces one standalone mesh
   per item for 5 of 6 kinds; `ghost.ts`'s docblock says that is impossible. Whichever way it is
   resolved, one of the two files is currently wrong.
4. **Close the guard's holes.** It catches 2 of 7 probes and misses `parkfan-architecture`, which
   supplies 11 of the 21 tiles in `1300-building-bar.png`. Build the pattern from the registered
   packs, and add a second rule for bare item ids.
5. **Fix the tab pill overlap.** "€1,200" is cut in half in all four standard 720 px frames.
6. **Write the four out-of-folder paths into `requests/tools.md`.** `pack.json`, `demo-park/plan.ts`,
   `track/selftest.mjs`, `test-game-lint.mjs`. This is the failed gate, and it is a paragraph of
   writing.
7. **Import `rectCentre` into the selftest** instead of re-deriving it, and assert
   `footprintDip ≤ height` where the manifest is read.
8. **Move the clock in `pump()` above `sources.build()`**, or report the two halves separately. Until
   then no cost figure in this module distinguishes a bench from a 392 m circuit.
9. **Dim the tray with the sun.** 117.4 against 29.1 at 22:30.
10. **Drag to move**, still. Round 1 asked for it; nothing moved.
11. **Somebody should still use it with a hand.** Round 1 said so. `place/log.txt` is a Jacobian
    solved from three pointer probes — better than a scripted click, and still not a person.

## 6. Verdict

**FAIL** — 8.26 weighted against a pass mark of 8.5, and the ownership gate failed as written. The
module is substantially better than the 8.29 it was given at `c12856c`: the palette went from 40 %
greyed to 10 %, four tabs gained real pictures of the real geometry, and a bug that made the build
tool lie about where it was building was found, measured and closed. What holds it under is that the
redesign bought those tiles with half the screen, the newest tiles are the least legible thing in the
bar, and the ghost — the thing round 1 failed it on — is unchanged and unphotographed.
