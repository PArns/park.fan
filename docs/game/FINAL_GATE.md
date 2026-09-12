# The final gate — the runbook

`CRITIC.md` names four gates in four sentences. This is the executable version: what to run, what
to look at, and what counts as a finding. It exists because the four bullets are a statement of
intent and somebody has to be able to pick them up and produce the same answer twice.

**Status: not due.** The gate runs once every module passes its own gauntlet. At the time of
writing thirteen modules are graded and two pass (`track` 8.54, `rides` 8.71), with `buildings`,
`pools` and `ui` being built, so what follows is a runbook and not a result.

## Before any of it: the clock

Two features in this project were working and unphotographable, and both cost a round. The gate
would have repeated the mistake, so it is written into the procedure rather than left to memory:

- **Every gate frame is taken with `--step`.** With none, the park has no guests,
  `environment.wetness` is 0 and three of the seven shops have not opened. `--step=9600` is 09:00
  → 17:00, which is a park in the afternoon.
- **Any frame that is about an effect takes `--particles=0.1 --particle-frames=14`.** Babylon ages
  a particle by the real frame delta; under SwiftShader that is longer than a raindrop lives.
- **Run `pnpm game:warm-audit` first** and read what moves. If something new appears in that list,
  the gate's shot list is out of date before it starts.
- **Run `pnpm game:day-budget` too, and read it before the frames.** It answers, without a browser,
  what the twenty-eight pictures cannot: what fraction of the crowd is walking, queuing, riding,
  buying or standing still at each hour, and how many things a visitor does in a day. A park can
  photograph beautifully and be 85 % statues — it was, and no frame said so, because a still picture
  of somebody standing and a still picture of somebody walking are the same picture.
- **fps is meaningless** (SwiftShader). Draw calls, triangles and tick times are real.

## 1. Whole-game critic

**Question:** does it read as one place built by one hand, or as twenty-four modules in a field?

Run, per time of day in `09:00, 12:00, 18:30, 22:00`, all seven presets:

    node scripts/game-shot.mjs --cam=overview,entrance,close,ground,coaster,pool,night \
      --tod=<t> --step=9600 --out=.game-render/gate-whole-<t>

Twenty-eight frames, every one opened and looked at. For each, write one sentence of what is
actually in it — not what should be. Then answer four questions in writing:

1. **Does the light agree with itself?** A shadow direction, a sky colour and a lamp that disagree
   are three modules, not one place.
2. **Does anything read as placeholder** at the distance the frame is taken from?
3. **Is any hour worse than the others**, and is it the same hour in every camera? (18:30 has been
   the weak hour all along, and the cause is `environment`'s exposure curve, not the module whose
   frame it spoils.)
4. **Is the park's own composition legible** — can a stranger tell where the entrance is, where the
   crowd goes, and what the park is for?

**Findings are per module.** A gate that produces one score and no owner produces nothing.

## 2. Frontend critic

**Question:** is `/game` a part of park.fan or a lodger in it?

    pnpm game:bundle              # against a baseline build of main, both halves rebuilt
    pnpm build && pnpm start      # then measure the routes that must not regress
    pnpm measure:cls --late       # the CLS harness, on a production build at localhost

- **No route outside `/game` may regress.** `game:bundle` answers three questions: is Babylon in the
  build at all, is it in a **shared** chunk, and how big is the shared bundle. Its first version
  measured the same tree twice and printed two identical numbers that read as a proof — pass
  `--next=` and `--baseline-build`.
- **The design system is reused, not re-implemented.** `grep` the game folder for a second button, a
  second card, a second colour scale. `lib/game/tools/build-bar.tsx` is the reference for doing it
  right (`components/ui/*` over the existing HUD glass).
- **The chrome is honest at 390 px.** The game's own UI is not exempt from the header rules in
  `CLAUDE.md`: a control may not be under 44 px on a phone without cancelling it at its own call
  site and saying why.
- **`app/game` is a non-localized top-level route** and belongs in `proxy.ts`'s exclusion list.

## 3. Blind A/B

**Question:** which of these two is the game?

Take six gate frames — `ground` and `close` at 12:00 and 22:00, plus `entrance` at 18:30 and one
weather frame — and pair each with a reference photograph of a real park at a comparable framing.
Strip every label, HUD and watermark from both (`--out` a clean run with the HUD hidden, or crop it
off). Present the twelve unlabelled images in a shuffled order and ask, per pair, **which is the
photograph**.

The result is not a score. It is a list of the tells: the specific thing in each frame that gave it
away. Those tells are the findings, and each belongs to a module.

Do not run this against a rendered image from another game. The question is fidelity to the real
thing, which is what axis 2 grades everywhere else in this rubric.

## 4. UX gate

**Question:** can somebody play it without being told how?

From a cold start at `/game`, with no instructions, in one sitting:

1. Place a shop.
2. Place scenery and a path.
3. Build a coaster.
4. Open the park and run a day.
5. Save, reload the page, and confirm the park came back.

**Every step that needed a guess is a finding**, and so is every step that could not be done at all.
Record the guess, not the conclusion: "I did not know that Escape cancels" is a finding;
"the tool UX is unclear" is not.

Run it twice — once by a person and once as a scripted click path (`lib/game/tools`' own probes are
the pattern) — because the script proves the path exists and the person proves it is findable.

## What a pass looks like

All four produce written findings with owners. The gate passes when every finding is either fixed
or recorded in `STATUS.json` with a number against it and a reason for not fixing it. There is no
weighted total here: the module gauntlet is where scores live, and a second scoring system over the
same work would only disagree with the first.
