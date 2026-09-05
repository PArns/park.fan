# Art bible — park.fan Coaster

The look is **stylized realistic**: real materials, real light, real scale, with shapes simplified
one step past photography. Not toy-plastic, not photoreal. The reference is a well-lit architectural
model of a real park — clean silhouettes, honest materials, no cartoon outlines and no bloom-soup.

The identity is park.fan's, not a competitor's: **dark glassmorphism UI over a warm, saturated
world.** The contrast between the two is the point — the HUD is cool, near-black, translucent; the
park is warm, lit, alive. Nothing in the 3D view uses the UI's palette and nothing in the UI uses
the park's.

---

## 1. Never programmer art

The bar, stated so it can be failed:

- **Nothing untextured.** Every material has albedo, normal, roughness and (where it means
  something) AO. A `roughness: 1.0` flat grey mesh is a failed gate, not a placeholder.
- **Correct texel density.** ~256 px/m on hero surfaces, ~128 px/m on ground and large architecture,
  ~512 px/m on anything a first-person camera walks past. A visible resolution jump between two
  adjacent surfaces is a bug.
- **Contact grounding.** Nothing floats. Every prop gets contact shadow (SSAO + a cheap decal for
  the base) and sits on the terrain sample, not on `y = 0`.
- **Silhouette first.** If it does not read at 1/8 screen height in black, more texture will not
  save it.
- **Procedural where it is structure, kit where it is dressing.** Track, supports, paths, pools,
  water, buildings and terrain are **generated** — a kit asset can never match a spline. Props,
  foliage, vehicles, characters and materials come from CC0 kits.

---

## 2. Light

Light is the single biggest lever and gets the most attention.

- **One sun**, physically plausible: colour temperature and elevation from a real solar position
  model for the park's latitude and date. 6500 K at noon, 2000 K at horizon, intensity following
  the same curve.
- **IBL is not optional.** A prefiltered `.env` per time-of-day band (dawn / day / golden / dusk /
  night), cross-faded. Ambient light is *never* a flat `HemisphericLight` at 0.5 — that is what
  makes a scene read as an untextured mockup.
- **ACES tonemapping**, exposure animated with the sun, never clipping the sky to white.
- **Night is a different game.** The park at night is lit by *its own* light: ride marquees,
  path lanterns, shop signage, coaster flashers, pool underwater lights, fireworks. Emissive
  materials + bloom + a small number of real point lights with baked cookies. The ambient drops to a
  deep blue (not black), so silhouettes stay readable.
- **Golden hour is the hero shot.** Every screenshot the critics judge includes one.

## 3. Colour

| Role | Value | Where |
| --- | --- | --- |
| Park ground / grass | `#4E7A3C` → `#6E9A4A` (two-tone, noise-blended) | terrain |
| Path concrete | `#B9B2A6` | paths |
| Water (day) | absorption `#0E4B5A`, scatter `#7FD9D0` | pools |
| Water (neon-lagoon) | absorption `#2A0E5A`, scatter `#7F5BFF` | pools |
| `core-classic` accent | `#E8603C` (warm coral) | ride marquees, awnings |
| `neon-lagoon` accent | `#3CE8D2` / `#FF3C9A` | signage, emissives |
| Sky zenith noon | `#3C74C8` | environment |
| Night ambient | `#0B1A33` | environment |

The **HUD** uses the site's tokens verbatim — `--background`, `--card`, `--primary`,
`--muted-foreground`, the crowd/status ramps — over `HEAVY_GLASS`. Game-only additions
(`--game-accent`, `--game-danger`, `--game-valid`, `--game-invalid`) are declared with `@theme` in
`app/game/_game/ui/game-tokens.css` so they extend the same space.

**Validity colouring** is one pair used everywhere: `--game-valid` `oklch(0.72 0.16 152)` and
`--game-invalid` `oklch(0.62 0.21 25)`, always at 35 % over the ghost mesh plus a solid outline —
never a full-opacity red block, which reads as a bug rather than a rule.

## 4. Scale

Metres, +Y up, right-handed. Numbers a builder must not invent:

| Thing | Size |
| --- | --- |
| Guest | 1.72 m tall, 0.45 m shoulder |
| Path | 4 m default, 2/4/6/8 m allowed |
| Path railing | 1.05 m |
| Bench | 1.6 × 0.6 × 0.85 m |
| Lamp post | 4.2 m |
| Shop stall | 5 × 4 × 4.2 m |
| Coaster gauge | 1.6 m, rail Ø 140 mm |
| Station platform | 1.1 m above rail |
| Tree (mature) | 9–14 m |
| Pool depth | wading 0.4, shallow 0.9, swimming 1.6, diving 3.6 m |

Grid is free placement with optional **0.25 m / 15°** snapping. Terrain heightfield is 1 m cells,
bilinear-sampled; the sculpt brush works in metres, not cells.

## 5. Materials

Five families, each an atlas so instancing stays cheap: **metal** (track, supports, fences),
**concrete/stone** (paths, plazas, foundations), **timber** (buildings, decking, wooden coaster),
**fabric/plastic** (awnings, seats, signage), **organic** (terrain, foliage, water).

Roughness ranges that keep it out of the uncanny: painted steel 0.35–0.5, weathered steel 0.55–0.7,
wet concrete 0.25, dry concrete 0.75, timber 0.6, awning fabric 0.85, foliage 0.75 with a
translucency tint.

**Wear is what sells it.** Every large surface gets a low-frequency grunge mask driving roughness
and a little albedo darkening at concave edges. A perfectly clean park reads as a render, not a
place.

## 6. Water

The most-looked-at surface in a park sim, so it gets its own paragraph.

Depth-based absorption (Beer–Lambert against the depth buffer), screen-space refraction, a planar
reflection probe on high+, animated dual-normal detail, **shoreline foam** from the depth delta,
and **caustics** projected from a scrolling pair of Voronoi tiles onto the pool floor. Waves are a
sum of three Gerstner waves at ultra/high, a normal-map scroll below. Splash is the `effects`
module's, but the ring it leaves is written into the water's foam buffer, so a flume splash and the
water agree.

## 7. Crowds

2000+ guests is the budget, so guests are **thin instances with animation LOD**:

| LOD | Distance | What |
| --- | --- | --- |
| L0 | < 25 m | full skinned mesh, per-instance animation offset |
| L1 | 25–60 m | skinned, half rate, no fingers/face |
| L2 | 60–140 m | vertex-animated texture (baked walk/idle), one draw call for thousands |
| L3 | > 140 m | billboard imposter from 8 baked angles |

Variety without variants: 6 body meshes × a **per-instance palette** (skin, hair, top, bottom, shoe)
packed into an instance buffer. 2000 guests, 6 draw calls, no two look identical from 10 m.

## 8. Camera and composition

RTS default at 35–55° pitch. The critics' three zoom levels are: **park** (whole area in frame),
**area** (one themed land), **detail** (one ride, guest-height). Photo mode adds DOF and a 21:9
option. The default field of view is 55° — wider reads as a phone game, narrower as a diorama.

## 9. What is forbidden

- Any Frontier IP: names, logos, ride names, textures, icons, UI screenshots, extracted assets.
- Cartoon outlines, cel shading, flat-shaded low-poly-with-no-materials.
- Untextured primitives visible in any shipped screenshot.
- A UI colour in the world or a world colour in the UI.
- Bloom used to hide a lighting problem.
- Text baked into a texture in a way that cannot be localized.
