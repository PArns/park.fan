# The critic gauntlet

Every module is graded before it counts as built. A grade that is not comparable between two
critics is not a grade, so the rubric is here and not in a prompt: one file, six axes, the same
weights for every module, and a pass mark that a module either clears or does not.

**Pass = 8.5 weighted, zero console errors, and the budget met.** Up to four rounds. A module that
fails four rounds is not quietly downgraded — it is recorded as failed in `STATUS.json` with the
last round's scores, and the reason it failed is what the next builder reads first.

## The prime rule

**A critic may not grade anything it has not looked at.** Not the source, not the report the
builder wrote, not the module's own claims — the PNGs the harness produced, opened and looked at,
at every time of day and every camera the module offers. A grade justified by reading code is
void. Where the frame contradicts the report, the frame wins and the contradiction goes in the
critique, because a report that is wrong about its own screenshots is a finding about the module.

The second half of the same rule: **every number in a critique comes from a file the harness
wrote**, and the critique names which. "Feels heavy" is not a finding; "1,340 draw calls at the
`overview` camera against a 1,200 budget for the whole game, of which this module is one of
twenty-four" is.

## The six axes

| #   | Axis                           | Weight | What a 10 looks like                                                                                                                                                              | What a 3 looks like                                                                                                                                                       |
| --- | ------------------------------ | -----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **The frame**                  |   30 % | It reads as a photograph of a place. Materials have a surface, light has a direction, shapes have silhouettes that survive being squinted at. It is as good at 22:00 as at 12:00. | Untextured primitives in primary colours. One flat light. A frame that only works at noon.                                                                                |
| 2   | **Fidelity to the real thing** |   20 % | The reference was researched and the geometry carries it: a vertical loop is teardrop-shaped, a queue rail turns where a queue rail turns, a path is cambered and drains.         | A plausible-looking invention that anyone who has been to a park would not recognise.                                                                                     |
| 3   | **Extensibility**              |   20 % | A new coaster type / shop / theme / need is one manifest entry and no code. The module registers what it owns and never switches on a content id.                                 | A `switch` over hard-coded ids, or a catalogue that lives in TypeScript. **This axis alone can fail the module**: below 5 here, the module fails whatever the total says. |
| 4   | **Budget and behaviour**       |   15 % | Draw calls and triangles are a named, defensible share of the whole-game budget. Sim tick inside 6 ms. No leak across three dispose/reboot cycles.                                | Numbers reported without a share, or a mesh per object where instancing was available.                                                                                    |
| 5   | **Determinism and state**      |   10 % | Seeded streams only, save → load → save byte-identical, nothing derived from wall-clock time. Owned state is written by exactly one side.                                         | `Math.random` behind an abstraction, or state written from both the worker and main.                                                                                      |
| 6   | **Honesty of the report**      |    5 % | The report's "what is weak" section names things the critic was going to find, with numbers. Failed rounds are in it.                                                             | A report that claims a frame the screenshots do not show.                                                                                                                 |

Score each axis 0–10 to one decimal, multiply by the weight, and state the weighted total. Never
round a total up to the pass mark. **Never inflate a score to be encouraging** — an inflated score
costs the next round, because it removes the only reason anyone would look again.

## Hard gates, independent of the total

A module fails regardless of its weighted score if any of these is true.

- **Any console error or hydration warning** in `report.json`. Not "a harmless one". Zero.
- **Extensibility below 5** (axis 3). A module that cannot take a new manifest entry is not
  finished, however good the frame is.
- **It touched something that is not its own.** `lib/game/<module>/`, plus its own report and
  request files. Core, another module, the content packs, and everything outside `lib/game/` go
  through the integrator. `git diff --name-only` answers this in one command.
- **A deep-import violation** — `from '@babylonjs/core'` anywhere. 956 KB gz against 271.
- **Anything at module scope touching `window` / `document` / `navigator`.** The engine may not
  reach the server graph.
- **`pnpm test:game` red**, `npx tsc --noEmit` dirty, or `npx eslint lib/game/<module>` dirty.

## What the critic writes

Into `docs/game/critiques/<module>-round<N>.md`:

1. The six axis scores with one sentence each, and the weighted total.
2. Every hard gate, ticked or failed, with the command that answered it.
3. The frames it looked at, by filename, and one line per frame on what was actually in it.
4. A ranked list of what to fix, most valuable first, each with the number that justifies it.
5. Pass or fail, stated plainly.

And into `docs/game/STATUS.json` under `modules.<id>`: the round number, the six scores, the
total, pass/fail, and the commit the grade was taken at. A score with no commit beside it is a
score about a tree nobody can get back to.

## The final gate

Once every module passes, four more run over the whole game and are graded the same way.

- **Whole-game critic** — the demo park at four times of day from every camera. Does it read as
  one place built by one hand, or as twenty-four modules in a field?
- **Frontend critic** — the route as part of park.fan: no regression outside `/game` (the bundle
  numbers answer this), the design system reused rather than re-implemented, the chrome honest at
  390 px.
- **Blind A/B** — the frame against reference photography of real parks, with the labels removed
  from both. The question is not "is it as good", it is "which of these two is the game".
- **UX gate** — build a coaster, place a shop, open the park, run a day, save and reload, from a
  cold start, with no instructions. Every step that needed a guess is a finding.
