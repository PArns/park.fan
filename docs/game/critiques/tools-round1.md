# tools — critic, round 1

Module: `lib/game/tools/` (2,677 lines, 11 files) · showcase `/game?showcase=tools` · the build bar
in every `/game` frame since it landed · commit `c12856c`.

**Weighted total: 8.29. FAIL by 0.21** (pass is 8.5), no hard gate failed.

Graded by the integrator; not an independent grade, and none exists on this branch. The module's own
builder finished, which makes this the first grade in the project taken against a report its author
actually wrote.

## 1. Scores

| #   | Axis                  | Weight |   Score | One sentence                                                                                                                                                                                                            |
| --- | --------------------- | -----: | ------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame             |   30 % | **7.6** | The ghost is legible and says **why** it is refused in words ("That is in the water."), the bar reuses the design system — and the ghost is a footprint box, so you cannot see what you are placing until it is placed. |
| 2   | Fidelity              |   20 % | **7.4** | Ghost, validity, snapping, rotate-as-an-operation and undo are the right affordances; move is click-arm-click rather than a drag, and paths and coasters are listed and refused.                                        |
| 3   | Extensibility         |   20 % | **9.0** | 55 palette items in 6 groups derived entirely from the registry, **zero pack or item ids in the module's source**, and `registerKind` flips refused items to placeable with no code change.                             |
| 4   | Budget and behaviour  |   15 % | **9.0** | 5 meshes and 4 materials created once and scaled; the ghost costs **exactly +3 draw calls**; three dispose/reboot cycles leak nothing.                                                                                  |
| 5   | Determinism and state |   10 % | **9.2** | The history is main-thread only and reaches no save; placement charges and undo refunds **to the cent**, and the worker's own save goes 1,605 → 1,606 → 1,605 bytes with the right log tail.                            |
| 6   | Honesty of the report |    5 % | **9.2** | It records a frame that disagrees with its own JSON and says it could not explain it, and it records that the browser sweep it first used to justify a rule **measured nothing**.                                       |

**7.6 × 0.30 + 7.4 × 0.20 + 9.0 × 0.20 + 9.0 × 0.15 + 9.2 × 0.10 + 9.2 × 0.05 = 8.29.**

## 2. Hard gates

`pnpm test:game` green including this module's 88-check selftest; `tsc` and `eslint` clean;
`errors 0 · warnings 0 · hydration 0` in the park run; extensibility 9.0, well clear of the floor.
Outside its own folder the diff is `lib/game/ui/hud.tsx` (+8/−3) and 40 `tools.` keys in each i18n
locale — both granted in writing by the integrator because `ui` is an unowned placeholder, and both
declared in the module's requests file.

## 3. What I measured myself

`.game-render/_probe/tools-grade.mjs` against the running demo park:

    paletteItems 55 · paletteGroups 6 · unavailable 22 · meshes 5 · materials 4
    unclaimedPackKeys() []   drawCalls 207 (ghost not shown)

And the frames, opened: `tools-clickpath/04-ghost.png` (a green footprint on the paving with the
hint "Click to place Park bench. R turns it, Esc stops."), `05-placed.png` (a **bench on the path**,
cash 2,500,000 → 2,499,965, an undo counter appearing in the bar), and `tools-showcase/1200-close.png`
(a red refused ghost over the water with "That is in the water.", the snap toggle reading
"0.25 m · 15°", 14 undo entries).

The one claim I did not reproduce independently is the `registerKind` flip — my probe read the wrong
accessor and returned zero either way. It is asserted in the module's selftest, which is green, and I
am citing the selftest rather than my own measurement, which is the honest way round.

## 4. Findings

### 4.1 Two in five palette items cannot be placed

`unavailable: 22` of 55. Paths, coasters and flumes are routes rather than points and are correctly
refused; `ride` and `building` items are listed but unavailable because no module claims those
kinds yet. Both are honest, and the result is still a palette where 40 % of what a player sees is
greyed out on the first screen they open. The module made the right call — listing them says the
game intends to have them — but somebody should decide whether a first-time player should see them
at all, and the answer is probably a "coming soon" affordance rather than a disabled button.

### 4.2 The ghost is a box

It has a footprint pad, a volume and a facing chevron, and it is colour-coded with a reason in
words, which is more than most build tools give you. It is not the object. Placing a bench shows
you a box and then a bench. The owning modules already generate their geometry
(`scenery/geometry.ts`, `shops/build.ts`), so the fix is a `previewOf(item)` on the owner — which is
exactly what this module's requests file asks for as `footprintOf`, one step short.

### 4.3 The verification is the best in the project so far

Money to the cent through a place-and-undo, the worker's save measured in **bytes** either side, the
ghost's cost isolated to three draw calls, and a rule changed **after** measuring rather than before
(a tree's footprint became its trunk instead of its crown, and buildable ground over the demo park
went 35.0 % → 58.3 %). That is what the budget and determinism axes are for and it is why they are
the two highest scores here.

## 5. What round 2 should do

1. **A real preview.** `previewOf(item)` on the owning modules, so the ghost is the thing.
2. **Drag to move**, which is what every player will try first.
3. **Decide what to do with the 22 unavailable items** — a decision, not a bug.
4. **Somebody should use it with a hand.** As with `camera`, the click path is scripted and nobody
   has actually built a park with it.
