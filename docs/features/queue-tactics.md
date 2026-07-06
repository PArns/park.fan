# Queue Tactics (dev prototype)

A **TFT-style auto battler** built as an in-queue time-killer: something to play on your
phone while standing in a ride queue. Lives at **`/dev/tactics`** (noindex, not linked from
the site). Fully local — no server, no accounts; 1 player vs a rule-abiding AI.

---

## Queue-first design decisions

| Queue reality                  | Design answer                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| You get interrupted constantly | **No planning timer** — combat starts only when you tap **Fight**                        |
| The queue suddenly moves       | **Auto-save to localStorage** after every action; reopening resumes the match            |
| One hand, small screen         | Portrait-first camera, tap-to-select → tap-to-place (drag also works), bottom-sheet shop |
| Battery matters in a park      | Rendering pauses when the tab is hidden; pixel-ratio capped on mobile                    |
| Spotty park Wi-Fi              | Simulation runs 100% client-side                                                         |

## Game rules (TFT-style, park-themed)

- 7×8 hex board (4 rows per player), 9 bench slots, shop with 5 cards.
- Economy: base income 5, interest (max 5), win/loss streaks, reroll 2g, XP 4g,
  level = unit cap (researched TFT reference values, scaled to a 16-unit roster).
- 16 units across 5 cost tiers; 3 copies merge to a higher star (×1.8 stats per star).
- Traits are **theme-park lands**: Pirate Cove, Royal Castle, Robo World, Ghost Manor,
  Wildlife Trail + classes Guardian/Duelist/Ranger/Mystic/Support.
- Counters are **emergent** (armor vs AD, MR vs ability power, range vs mobility) — no
  hardcoded rock-paper-scissors table. All numbers live in `lib/tactics/core/data.ts`.
- Rounds 1–2 are PvE minion waves, then it's you vs the AI until one side runs out of HP.

## Architecture

```
lib/tactics/core/      pure deterministic sim — NO three.js/React/Date/random
  rng.ts               seeded mulberry32 (economy only)
  hex.ts               odd-r hex math; halves are 180°-point-symmetric
  data.ts              ALL balance numbers (units, traits, minions)
  economy.ts shop.ts   TFT-style odds/pools/interest
  board.ts game.ts     commands, star-up merges, round flow, PvE
  combat.ts            RNG-FREE fixed-timestep battle → replay event list
  ai.ts                opponent AI (plays through the same rule-checked commands)
lib/tactics/controller.ts  client glue: state store, scene sync, localStorage saves
lib/three/tactics/     renderer: park-plaza arena, procedural low-poly units,
                       replay player, day/night themes, camera presets
components/tactics/    HUD (shop sheet, trait tracker, unit panel, banners)
app/dev/tactics/       fullscreen dev route (noindex)
```

**Combat is deliberately RNG-free** — "chance" effects are deterministic counters. A mirror
match on the point-symmetric board is an **exact draw**, which the gate tests assert. Every
tick runs decide → collect (effects buffered) → resolve (canonical, mirror-invariant
order), so there is no first-mover advantage and replays never diverge. This also keeps a
future multiplayer host-authoritative or lockstep without desync risk.

The whole fight is simulated synchronously up-front (< 10 ms) and returned as a **replay
event list** the renderer plays back like a demo file (1×/2×/skip).

## Testing / verification

- **`pnpm test:tactics`** — sim gates: determinism, mirror-match-is-exact-draw, combat
  termination (sudden death), emergent-counter checks, reproducible AI-vs-AI full matches,
  no systemic side advantage. Run after ANY change to `data.ts` or `combat.ts`.
- **`pnpm verify:tactics`** — headless render harness (Playwright + SwiftShader) per
  convention #12: screenshots planning/battle × default/top/side cameras × day/night +
  portrait-phone set into `screenshots/tactics/` for visual review.

## Known limitations / next steps

- No items, no augments, no carousel; 16-unit roster (one full trait web).
- Single AI opponent (not an 8-player lobby).
- On desktop landscape the bench sits close behind the shop sheet.
- Multiplayer: the deterministic core is ready for host-authoritative play via a dumb
  message broker (planning commands are the only input) — not built yet.
