# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"크라운 & 가십: 마녀의 성" (Crown & Gossip) — a mobile-first, portrait-only merge game shipped as a web PWA on Vercel. A PixiJS merge board feeds a Three.js 3D castle-decoration screen. All UI text, comments, and commit/changelog content are in Korean. Target device for layout tuning is a Galaxy S25 in portrait (412×915).

## Commands

- `npm run dev`: Vite dev server on port 5173. The service worker is not registered in dev.
- `npm test`: Vitest unit tests (`tests/unit`). To run one file: `npx vitest run tests/unit/board.test.ts`.
- `npm run check`: svelte-check plus TypeScript.
- `npm run build`, then `npm run preview`: production build into `dist/`, previewed on port 4173.
- `npm run test:e2e`: Playwright E2E (`tests/e2e`) at a 412×915 viewport. It builds and serves preview automatically. It needs `npx playwright install chromium` once.
- Deploy: Vercel project `kek-coding`. Pushing `main` triggers a production deploy (`vercel.json` uses the Vite framework and outputs `dist`).
- Debug hooks: in dev, or with `?e2e` in the URL, `window.__game` is the core store, and `__board()` / `__castle()` return the live Pixi board and Three.js castle views.

## Architecture

There are three layers. `src/core` never imports `window`, `document`, pixi.js, svelte, three, or gsap.

- **`src/core`**: pure game logic.
  - `types.ts`: `GameState` and the other shared types.
  - `rules/`: data and balance.
    - `progression.ts`: zone unlock (takes `playerLv`), order caps, generator tier caps and `spawnRange`, boost, prices, holiday rewards.
    - `levels.ts` (v3.5): XP curve `xpToNext`, XP sources, level-up rewards, sell price and order coins, and the unlock table.
      - Unlocks: zone entry levels and bag size `bagSize(lv)`. Levels never hand out new generators (v3.8).
      - New chains come from finishing a zone (`CHAIN_UNLOCK_ZONE`: candle ← alchemy, silk ← harbor). `castle.renovate` grants the ★1 generator with a `chainUnlocked` event, and RewardDirector plays the `CHAIN_GIFT` handover after the zone showcase. `unlockedChains(state)` also counts a chain the player already owns, so pre-v3.8 saves keep their orders.
      - Generator absorption (v3.8): when an evolution leaves no ★1 generator of that chain on board or bag, `absorbOrphans` (board.ts) removes that chain's Lv.1 items (active, cobweb, bag) for Lv.1 sell coins (no XP) and cracks crates next to absorbed cobwebs.
      - Generator cap (v3.9): one ★3 per chain (`GEN_UNITS_MAX` 4 parts; ★1=1, ★2=2, ★3=4). `pickPartChain` skips full chains for level-up and restore parts (restore parts only every 4th chapter + zone completion). On load `trimSurplusGenerators` keeps one ★3 per chain and refunds the rest (`SURPLUS_PART_COINS`), then `fitOrdersToGenerators` (orders.ts) raises order reqs below the chain's lowest spawnable level; it also runs on every generator evolve (`ordersAdjusted` event).
      - Codex discovery (v3.9): `codexSeen` (persisted) = highest item level seen per chain; `store.dispatch` calls `sweepCodex` after each non-transient action. Generator tiers seen = highest owned tier (derived). The codex shows unseen stages as silhouettes/???.
      - Energy (v3.10, benchmarked to Gossip Harbor; monetization is not a balance goal yet): regen 1 per `ENERGY_REGEN_SEC` 120s up to 100, level-up +20, drops in progression.ts (`ORDER_ENERGY_CHANCE`, `mergeBonusChance`, `MERGE_BONUS_ENERGY_SHARE`).
      - Restore costs come from `SPOT_COIN_COST` by chapter (`getSpotCoinCost(chapter)`), a smooth ~9%/chapter ramp; `balance.test.ts` checks the per-chapter energy curve stays smooth.
      - Item lineage (v3.11): `itemLineage` (codex.ts) gives source (generator/byproduct/drop/recipe), per-level how (spawn/boost/merge/below by owned tier) and open-order demand; `ItemInfo.svelte` (modal `itemInfo`, opened by the inspector 📜) renders it. Generators: first tap only selects, tapping the selected generator spawns (BoardCanvas). Collectible (energy/coin) merges never drop bonus shards.
      - A zone with any restored spot stays open regardless of level, for save compatibility.
    - `chains.ts`, `customers.ts`, `holidays.ts`, `rooms.ts` (spots, dialogues, `ambienceByProgress`), `characters.ts`, `versionHistory.ts`.
  - `actions/*.ts`: every state change is an `Action<P> = (draft, ctx, payload) => GameEvent[]`. Groups are `board`, `orders`, `progress`, `castle`, and `holiday`.
  - `store.ts`: `dispatch(action, payload, {transient?})` runs the action on a `structuredClone`, swaps in the new state, then notifies `subscribe` (Svelte store contract), `onCommit`, and `onEvent`.
  - `ctx.ts`: injects time and RNG, so tests are deterministic.
  - `economy.ts`: `grant`/`spend` is the single gateway for coins, gems, and energy. Replace it with a server adapter later for payments.
- **`src/services`**: side effects.
  - `save/repository.ts`: IndexedDB `CrownGossipMergeDB`/`player_progress`/`main_save_v1` plus localStorage `crown_gossip_save_backup_v1`. It loads whichever copy is newer. Records are `schemaVersion: 4`.
  - `save/restore.ts`: `restoreState(record, now, ctx)` validates every field and restores offline energy. It also returns `granted` (level-unlocked generator chains handed out on load) so `main.ts` can announce them.
  - `save/migrations.ts`: v2 records (schema ≤3) get a one-time cleanup and return a `MigrationReport`.
  - `save/autosave.ts`: batches saves over 300ms, saves immediately for gems, restores, zone completion, and purchases, and skips transient commits.
  - Also: `save/backup.ts` (v2-compatible backup codes), `audio.ts`, `haptics.ts`.
- **`src/views`**: rendering only. Views read state and play events. They never decide rules.
  - `ui/`: Svelte 5. `App.svelte`, `components/` (HUD), `modals/`, `castle/` (castle screen, pins, style picker, reward overlay).
    - `ui.svelte.ts` holds UI-only state that is not saved. It also has `act()`, which dispatches an action and turns `rejected` events into toasts. `toast()` dedupes identical live text and clamps the box inside the screen.
    - First-session coach (v3.7): `coach.ts` `coachStep(state)` picks the next step (serve/castle/merge/spawn/stuck) until chapter 1 is restored. It is derived from state, never saved. `Coach.svelte` draws the bar above the bottom panel (not a modal; clicks pass through), and the pointed order card / 🏰 button / story button get `.coach-pulse`.
    - CSS is the v2 stylesheet (`styles/legacy.css`, class names kept) plus `styles/v3.css`.
  - `board/`: Pixi board. `BoardView.ts` handles cells, tiles, input, slide tweens, and particles. `nudge(cells)` wiggles tiles via `pivot` only (never position) and stops on any board input. `BoardCanvas` nudges `findMergePair` (core/actions/board.ts) after 5s idle or a `boardFull` reject, and the coach's cells after 1.5s. `visuals.ts` maps state to `CellVisual`. `BoardCanvas.svelte` wires the main 7×8 or holiday 5×5 board.
  - `fx/`: `FxLayer` is a full-screen click-through Pixi canvas for flights between the board and the HTML UI. `juice.ts` maps events to effects.
  - `castle/`: `CastleView.ts` (Three.js), `furniture.ts` (procedural structures, recipe → meshes), `ambience.ts` (room mood 0–5), `layout.ts` (spot furniture types; positions come from modules), `toon.ts` (toon materials + outlines), `scenes.ts` (room lights).
    - Lego rooms: `modules.ts` is pure data and math (no three). Each zone has an entrance hall plus one module per spot (`ZONE_MODULES`, 1 cell = 5 units). `moduleStates` returns built/ruin/ghost from `rooms[].done`. `moduleEdges` gives walls, doors, and curbs: walls go only on the far sides (-x/-z), facing the camera. `frameZone` (projected footprint center + width-fit zoom, 0.75–1.45) sets the camera home and zoom; `panClampModules` keeps panning on built/ruin modules (or near home); wall-hung spot previews temporarily render their ruin module as built (`shownModuleStates`).
    - `roomBuilder.ts` draws modules (per-zone wall style, ornaments with `glowBase`) and plays the build animation inside `playRestore`.
    - `floorplan.ts` draws the castle map: a courtyard plus 4 zone wings made of module blocks.
    - `ZONE_PROPS` coordinates are local to module `step`.
    - Characters (v3.6): `characters3d.ts` defines `CHARACTER_LOOKS` and `CharacterLibrary`, which loads `/models/characters/*.glb` plus the shared `anims.glb`.
      - Each character has a KayKit CC0 body type, a clothing hue (skin is preserved), visible parts, and procedural accessories. Nero and Pip are procedural animals.
      - `actor.ts` (`CharacterActor`, `walkTargets`, `zoneGuests`) walks up to 3 characters per room.
      - Rebuild the assets with `node tools/prepare-characters.mjs <KayKit gltf dir>`.
      - Portraits are baked from the same models by `node tools/bake-portraits.mjs` (dev server running) into `public/portraits` and `art/portraitManifest.ts`. Re-bake after changing looks.
    - `castle/models/`: CC0 glTF models in `public/models` (credits in `public/models/CREDITS.md`). `manifest.ts` lists them, `recipes.ts` places them per spot (`SPOT_RECIPES`, 3 style variants), before-restore clutter (`CLUTTER`), and zone props that appear as more spots are restored (`ZONE_PROPS`). `library.ts` loads them per zone and clones synchronously; until loaded, spots fall back to procedural furniture.
    - To change the model set, edit `PICK` in `tools/prepare-models.mjs`, rerun it against the downloaded packs (macOS `sips` + Pillow), and update `manifest.ts`. `recipes.test.ts` checks every referenced model exists.
  - `reward/RewardDirector.ts`: sequences a restore: 3D drop, ribbon, reaction, cutscene, then (on zone complete) the showcase, a gem flight, and the next-zone reveal. Input stays locked throughout.
  - `art/`: `sprites.ts` (SVG item art) and `textures.ts` (SVG → Pixi texture cache keyed by `item:chain:lv`, `gen:chain:lv`, `crate`, `event:lv`, `eventGen`).
- `src/main.ts` wires everything together. `src/sw.ts` is the Workbox injectManifest service worker, built to `/sw.js`.

### Invariants

- **Rules live in core.** Add or change gameplay as an action plus a unit test, written test-first. Views call `act(action, payload)`. Effects react to `GameEvent`s and must not mutate state.
- **Save compatibility:** never rename save keys or the DB/store names.
  - A new persisted field goes in three places: the `GameState` type and `createInitialState`, the field-by-field restore in `restore.ts`, and a v4 round-trip test.
  - The v2 cleanup in `migrations.ts` runs only for `schemaVersion < 4`.
- **Currency:** never change coins, gems, or energy except through `economy.grant`/`spend`.
  - Gems are premium. They come only from holiday missions (capped at 10 per event), zone completion (💎50), level-ups (💎3), and the migration.
  - The holiday event gives no energy.
- **Story order:** zones unlock in `ZONE_ORDER`. Spots are restored in `rooms.ts` order (chapter N). `castle.renovate` re-checks the next chapter and the coin cost at confirm time.
- **Rendering sync:** `BoardView.render()` always reconciles against the latest state. Effects use temporary copies, or nodes picked up after the next frame (`afterRender`). Pixi apps must be destroyed with `texture/textureSource/context: false`, because textures are shared across canvases.
- **three r186 lighting** is physically based. `legacyLightCompensate` multiplies v2-era intensities by π.

## Releasing

1. Add an entry at the top of `VERSION_HISTORY` in `src/core/rules/versionHistory.ts`, bump `APP_VERSION`, and move the `LATEST` badge. The changelog pops up once when `lastSeenVersion` differs.
2. Bump `version` in `package.json`.
3. Run `npm test && npm run check && npm run test:e2e`. `tests/unit/balance.test.ts` runs a bot (`tests/unit/sim.ts`) through the whole game using real actions. If you change economy numbers (costs, XP, rewards), re-check its energy and level ranges.
4. Merge to `main` and push. Vercel builds it, and the service worker precache updates automatically. No manual cache-name bump is needed. Models under `/models/` are not precached; the SW caches them on first view (`MODEL_CACHE` in `src/sw.ts`). If you change model files at the same path, bump `MODEL_CACHE` (older model caches are deleted on activate).

Commit messages follow `feat(vX.Y.Z): ...` in Korean.
