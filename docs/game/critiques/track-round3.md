# track — critic, round 3

Module: `lib/game/track/` · showcase `/game?showcase=track` · commit `37b96ef` + the LOD change.

Round 2 graded **8.41, failing by 0.09**, and named one cause: the overview aliases the timber into
a smear, and round 2 had made it worse. Round 3 built the silhouette LOD that the module's own
weakness list had been asking for since round 1.

**Weighted total: 8.54. PASS** (pass is 8.5) — by 0.04, which is **inside the noise of my own axis
judgement**, and the grader is the same person who wrote the fix. Read §1 and decide for yourself;
this is the weakest pass the rubric can produce and it should be re-taken by anyone able to grade
independently.

## 1. Scores

| #   | Axis                  | Weight | R2  | R3      | Why it moved, or did not                                                                                                       |
| --- | --------------------- | -----: | --: | ------: | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame             |   30 % | 8.2 | **8.4** | One of the three things holding this axis down is fixed. At 3× the far timber goes from a dense speckled mass to distinguishable bents following the track. The showcase is **still** three layouts on a bare green plain, and 18:30 is **still** almost unlit — which is why this moved 0.2 and not more. |
| 2   | Fidelity              |   20 % | 8.2 | **8.2** | Untouched. Supports are still vertical only and anything rolled past 78° is still skipped.                                     |
| 3   | Extensibility         |   20 % | 8.8 | **8.8** | Untouched. Still nothing in a shipped pack.                                                                                    |
| 4   | Budget and behaviour  |   15 % | 8.2 | **8.5** | **−49,248 triangles at unchanged draw calls** and `ground` untouched. The round-2 finding was "ties carry one LOD level, rails and supports carry none"; supports carry one now. |
| 5   | Determinism and state |   10 % | 9.4 | **9.4** | Untouched.                                                                                                                     |
| 6   | Honesty of the report |    5 % | 7.5 | **8.0** | The self-contradicting sentence is gone and the paragraph now describes what actually shipped, with the before/after table and with what the change does **not** fix. |

**8.4 × 0.30 + 8.2 × 0.20 + 8.8 × 0.20 + 8.5 × 0.15 + 9.4 × 0.10 + 8.0 × 0.05 = 8.535 → 8.54.**

## 2. Hard gates

`pnpm test:game` green (93 checks, exit 0), `tsc` and `eslint` clean, `errors 0 · hydration 0` in the
showcase report. The two `bufferSubData` warnings are terrain's showcase landscape, filed there.
Extensibility 8.8, well clear of the floor. The diff touches `lib/game/track/supports.ts`,
`lib/game/track/main.ts` and this module's own report.

## 3. What I measured

`/game?showcase=track`, noon, `.game-render/track-lod/` against `.game-render/critic-track-r2/`:

| camera     | triangles before | after   | Δ        | draw calls |
| ---------- | ---------------: | ------: | -------: | ---------: |
| `overview` |          590,644 | 541,396 | −49,248  | 109 → 109  |
| `close`    |          809,380 | 760,132 | −49,248  |   99 → 99  |
| `ground`   |          792,648 | 792,648 |        0 |   73 → 73  |

`ground` being unchanged is the check that matters: the swap is at 180 m on `medium`, so the
coaster a player is standing in front of keeps every member. And the identical delta at `overview`
and `close` says the timber is past the threshold from both, which it should be — both cameras are
framing the whole showcase.

## 4. What is still wrong, and it is the frame

1. **The showcase has nowhere to stand.** Three coasters on a flat green plain read as models on a
   table. `generateShowcaseLandscape` is public and one call away.
2. **18:30 is almost unlit** (`critic-track-r2b/1830-coaster.png`): the coasters are faint outlines
   on a dark plain. That is `environment`'s exposure curve, which `environment-round2.md` §3 shows
   pinned at `EXPOSURE_MAX` the moment the sky dims — but it lands on this module's frame.
3. **Supports are vertical only.** Anything rolled past 78° is skipped, so a heavily overbanked
   layout would show gaps. Correct on all three current layouts, wrong on a future one.

A pass at 8.54 with three named frame problems is what the rubric produces when five axes are
strong and one is merely good. It is not a claim that this module is finished.
