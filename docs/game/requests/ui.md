# `ui` — requests

Each entry: what is missing, what the interface cannot draw without it, the exact change, and what
the HUD does instead in the meantime. Ordered by what it costs the player, not by how easy it is.

---

## 1. There is no way to ask the worker a question (core)

**The single biggest hole, and everything below is a symptom of it.**

Every sim module publishes a rich per-entity API and every one of them is unreachable from the
interface:

| Module   | API                                         | What it holds that the HUD cannot draw                                                                                    |
| -------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `rides`  | `RidesSimApi.list(): RideView[]`            | wait minutes, measured throughput, utilisation, satisfaction, riders and cycles today, downtime, `open`                   |
| `shops`  | `ShopsSimApi.list(): ShopView[]`, `stats()` | stock, stock capacity, queue and wait per shop, served today, takings today, `refusedToday`, `unanswered`                 |
| `guests` | `GuestsSimApi.inspect(slot): GuestRecord`   | one guest's needs, mood, cash, group, destination, errand — the record whose own docstring says "for the inspector panel" |

The protocol carries `command` one way and `event`/`frame`/`snapshot` the other. A command cannot
answer, and an event is a broadcast a module has to decide to send. So the HUD reads the frame
buffers and the forwarded events, and the `RideView`/`ShopView`/`GuestRecord` columns are simply
absent from the panels.

**Ask:** a request/response pair in `core/protocol.ts`, dispatched by `sim-runtime.ts` to a new
optional `SimHandle.query`.

```ts
// protocol.ts
export interface QueryMessage { type: 'query'; requestId: number; module: string; method: string; args?: unknown }
export interface QueryResultMessage { type: 'queryResult'; requestId: number; value: unknown; error?: string }

// types.ts — SimHandle
/** Answer a main-thread question. Read-only: a query may not mutate the world. */
query?(method: string, args: unknown): unknown;

// host.ts — GameHandle
query<T = unknown>(module: string, method: string, args?: unknown): Promise<T>;
```

`sim-runtime.ts` routes it exactly like `snapshot` does — `this.handles.get(msg.module)?.query?.(…)`
— and posts the result back. It is about forty lines and it unlocks every table in this list. The
read-only rule matters: a query that mutated would be a command that skipped the tick order and
the log, and determinism would go with it.

**Meanwhile:** `lib/game/ui/telemetry.ts` assembles the read model from `frame.stats`,
`frame.buffers` and the forwarded events. It is honest about what it cannot see — the ride
inspector carries a line saying the wait time is worked out in the simulation and not sent across.

**If a query is too much,** the cheaper half is a per-module opt-in projection: a `ui:watch`
command that turns on a `ride:views` / `shop:views` event once a second while a panel is open.
That costs bandwidth for as long as the panel is open and needs one small change in each sim
module rather than one in core.

---

## 2. Two commands write state that never comes back (`rides`, `shops`)

`rides:close` sets `r.closedByPlayer` inside the ride's runtime. `shops:price` and `shops:close`
write `entity.data` in the **worker's** copy of the world. None of the three emits anything, so the
main thread's `world.entities` — the read model the HUD draws from — never learns. Reload the page
and the HUD shows the manifest price for a shop the player set to €3.20 an hour ago.

**Ask, `shops/sim.ts`:** emit `entity:update` after writing the data bag. Core already forwards it
and `host.ts` already mirrors it into `world.entities`, so this is one line each:

```diff
   entity.data = { ...(entity.data ?? {}), price: Math.max(0, Math.round(p.price)) };
   dirty = true;
+  ctx.events.emit('entity:update', { entity, previous: entity });
   return true;
```

**Ask, `rides/sim.ts`:** put `closedByPlayer` in the `rides.state` stream, or emit
`ride:closed { id, closed }` from the `rides:close` handler.

**Meanwhile:** the runtime keeps an optimistic mirror (`UiRuntime.setRideShut`, `setShopPrice`,
`setShopClosed`) that survives until the page reloads and no longer.

---

## 3. `rides.motion` has one float free, and a wait time would fit in it (`rides`)

`MOTION_STRIDE` is 4 and the fourth slot is the queue length. A fifth float per ride is 4 bytes ×
the ride count per frame — under 200 bytes for a large park at 20 Hz — and it would put the number
a player actually reads (`waitFor(r)`, already computed every tick) in front of them without
needing request 1 at all.

```diff
-export const MOTION_STRIDE = 4;
+export const MOTION_STRIDE = 5;
...
   motion[i * MOTION_STRIDE + 3] = r.queue.length;
+  motion[i * MOTION_STRIDE + 4] = waitFor(r);
```

Same argument for `r.satisfaction` if a sixth is affordable. The ride list is the panel a player
lives in and the queue length alone does not tell them whether to open another machine.

**Meanwhile:** the list shows the queue length and the rated throughput, and says so.

---

## 4. `guests.anim` is the only thing the crowd panel has (`guests`)

The breakdown by behaviour (walking / queuing / riding / buying) is counted here by walking the
`guests.anim` byte buffer — up to a few thousand bytes, four times a second. It works and it is
cheap, but the sim computes the same histogram inside `stats()` and could publish four scalars
instead:

```ts
writer.stat('guests.queuing', …);
writer.stat('guests.riding', …);
writer.stat('guests.buying', …);
writer.stat('guests.leaving', …);
```

The needs breakdown (`GuestStats.needs`) has no path at all and is what a player would use to
decide which shop to build next; it belongs in request 1 or in four more scalars.

---

## 5. `persistence` is a scaffold and the HUD is standing in for it

`handle.save()` and `handle.load(json)` work today. Nothing keeps a save. The saves panel exports
a file, copies the JSON and keeps **one** slot in `localStorage` under
`parkfan-coaster:quicksave`.

**Ask:** the IndexedDB slot list DECISIONS #10 describes — database `parkfan-coaster`, store
`saves`, `{ id, name, day, savedAt, world }` — behind an api the HUD can render:

```ts
interface PersistenceMainApi {
  list(): Promise<SaveSlot[]>;
  save(name: string): Promise<SaveSlot>;
  load(id: string): Promise<void>;
  remove(id: string): Promise<void>;
  exportJson(): Promise<string>;
  importJson(json: string): Promise<void>;
}
```

`ui` will drop its `localStorage` slot the day that lands and register the panel body against this
api instead; the panel chrome, the buttons and the strings already exist.

---

## 6. Nothing computes a park rating (`management`)

`DayLedger` has `income`, `expenses`, `guests` and `rating`, and `core/module.ts` pushes a row of
zeros on every day rollover. So the HUD has no rating and no daily ledger, and it draws neither
rather than drawing zeros. There is a slot waiting for it in the top bar and the registration is
three lines from `management`'s own `main()`:

```ts
ctx.module<UiMainApi>('ui')?.registerStat({
  id: 'rating',
  label: t('hud.rating'), // the key already exists
  order: 25,
  value: (s) => ({ text: String(ratingNow()), tone: ratingNow() >= 700 ? 'good' : 'warn' }),
});
```

A finance panel wants the same treatment: `registerPanel({ id: 'finance', … })` and it appears in
the rail with no edit to `ui`.

---

## 7. `pnpm test:game-ui` (integrator, `package.json`)

`lib/game/ui/selftest.mjs` exists and covers the pure half — the registry's ordering and
replacement, the formatters, the queue-pressure curve and the telemetry collector against a
synthetic frame. It is not wired into `pnpm test:game` because `package.json` is not mine.

```diff
-    "test:game": "pnpm test:game-save-roundtrip && … && pnpm test:game-rides && pnpm test:game-soak",
+    "test:game": "pnpm test:game-save-roundtrip && … && pnpm test:game-rides && pnpm test:game-ui && pnpm test:game-soak",
+    "test:game-ui": "node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/ui/selftest.mjs",
```

Run it directly meanwhile:
`node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/ui/selftest.mjs`

---

## 8. `notice.sim:timeout` fires on a slow boot, not on a dead simulation (core)

The host gives the worker eight seconds to answer `ready`, warns when it has not, and then
**ignores the answer when it arrives late**:

```ts
case 'ready': {
  if (!readyResolved) { readyResolved = true; finishBoot('ready'); }
  break;                                    // ← a late ready falls through and does nothing
}
```

So a boot slower than its own deadline leaves the park running behind "The simulation did not
start. The park is shown, but guests and rides are paused." for the rest of the session, and
`phase` stuck at `reduced`. It is not hypothetical or harness-only: on this container a cold boot
is 20–30 s against an 8 s deadline, and `.game-render/ui-bright/1200-close.png` has that sentence
eight hundred pixels from a panel reporting 1,441 guests, 4 of 4 rides running and 356 rides taken
today. A notice that lies is worse than no notice.

**Ask, `core/host.ts`:**

```diff
       case 'ready': {
         if (msg.failed.length) { … }
         if (!readyResolved) {
           readyResolved = true;
           finishBoot('ready');
+        } else if (store.get().phase === 'reduced') {
+          // The worker was late, not dead. Withdraw the warning and promote the phase, or the
+          // park runs for the rest of the session behind a notice saying it is not running.
+          store.set({ phase: 'ready' });
+          for (const n of store.get().notices) if (n.key === 'sim') store.dismiss(n.id);
         }
         break;
       }
```

**Meanwhile:** the HUD retracts it. `RETRACTED_WHEN_LIVE` in `hud.tsx` dismisses any notice whose
text is `sim:timeout` the moment the telemetry reports a frame has arrived. The entry stays in the
messages panel, so nothing is hidden — it just stops claiming to be true. It cannot fix `phase`,
because that is core's field and writing another module's state from the HUD is the thing this
whole file exists to avoid.

---

## 9. Two smaller things in `core`

**`applyEnvironment` can throw on a pipeline whose image processing did not build.**
`renderer.ts:226` guards `if (pipeline)` and then writes `pipeline.imageProcessing.exposure`;
`imageProcessing` is null when the post-process failed to construct. Seen during this run:
`TypeError: Cannot set properties of null (setting 'exposure')` inside `boot`, which takes the
whole boot down — and then, because `finishBoot` names the `harness` const declared below it,
turns into `Cannot access 'harness' before initialization` and leaves `window.__parkfan_game`
undefined, so the screenshot harness dies with `Cannot read properties of undefined (reading
'metrics')` rather than reporting anything. `?.` on both, and a `try/catch` around the first
`applyEnv`, would turn a hard boot failure into a frame with no tone mapping.

**`GameStore.notify` keeps the last six notices and nothing keeps the rest.** The HUD mirrors them
into its own history (`UiRuntime.ingestNotices`) so the messages panel has something to show, which
makes the store's list a _live stack_ rather than a log. Worth a line in `store.ts`, since the next
reader of that `slice(-6)` will otherwise go looking for where the history went.

---

## 10. Strings other modules may now ask for

`ui` owns `lib/game/i18n` (DECISIONS #24). The table is at 289 keys across `en` and `de`. Ask here
for a key rather than shipping English into a German HUD; a panel title passed to `registerPanel`
is a plain string, so a module can ship before its key lands and swap to `t(key)` after.
