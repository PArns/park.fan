# Requests — `buildings`

What this module needs from core, the packs, `demo-park`, `tools` and `i18n`, with the exact change
where I can write it. Everything here has a workaround in place; nothing is blocking.

## 1. `demo-park`: the two reserved pads

`PADS` holds `pavilion` (`-8, -162`, 28 × 16 half-extents, height 7) and `entrance-hall`
(`-33, 178`, 11 × 19, street height) for this module, and I may not edit `lib/game/demo-park/`.
These are the two calls to make, in the world factory, after the pads are flattened.

_(filled in once the blueprints are measured — see §1 below when this file is final)_

## 2. `package.json`: the selftest

```json
"test:game-buildings": "node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/buildings/selftest.mjs",
```

and `test:game-buildings` appended to the `test:game` chain.

## 3. Open

_(grows as I go)_
