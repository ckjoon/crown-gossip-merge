# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"크라운 & 가십: 마녀의 성" (Crown & Gossip) — a mobile-first, portrait-only merge game PWA with a Three.js 3D castle-decoration screen. All UI text, comments, and commit/changelog content are in Korean. Target device for layout tuning is a Galaxy S25 in portrait.

## Commands

There is no build step, package.json, bundler, or linter. It is plain static files using browser globals (no ES modules).

- Tests: pure game rules live in `progression.js` and are tested with Node's built-in runner: `node --test` (all) or `node --test tests/progression.test.js` (one file). `tests/helpers/load-global.js` loads `window.X` scripts into a Node `vm` context (`loadGlobalPlain` clones results so `deepStrictEqual` works across realms). DOM/UI behavior is verified manually in the browser.

- Run locally: serve the repo root with any static server, e.g. `python3 -m http.server 8000`, then open http://localhost:8000. The service worker and absolute paths (`/sw.js`, `/manifest.json`) need it served from the root.
- Deploy: the repo is linked to the Vercel project `kek-coding` (`.vercel/`). Deploy with `vercel` (preview) or `vercel --prod`. `vercel.json` only sets headers (no-cache for `sw.js`, manifest content type, security headers).
- `vendor/three.min.js` and `vendor/gsap.min.js` are vendored copies loaded as globals (`THREE`, `gsap`). Don't swap them for CDN or npm imports.

## Architecture

`index.html` loads scripts in this order, and each file depends on the globals defined before it:

1. `progression.js` → `window.GameProgression`: pure rules with no DOM (zone progress/unlock, order level caps, generator tier caps, boost cost, coin/gem prices, legacy star conversion). Other files call it; put new balance rules here so they can be unit-tested.
2. `db.js` → `window.GameDB`: persistence. It saves to IndexedDB (`CrownGossipMergeDB` / `player_progress`, key `main_save_v1`) and mirrors every save to localStorage (`crown_gossip_save_backup_v1`). On load it takes whichever copy is newer. `mergeWithDefaultState(state, record, CHAINS, TOTAL_CELLS)` validates the saved data field by field, grants energy for offline time, and drops board/bag items and orders that reference a chain no longer in `CHAINS`. It also handles backup export/import strings.
3. `sprites.js` → `window.GameSprites`: draws every item as an inline SVG string (`getItemSVG(chain, level, isGenerator)`, `getCrateSVG`, `getEventSVG`). Every chain × level is expected to have a unique design.
4. `interior3d.js` → `window.Interior3DEngine`: the Three.js + GSAP castle screen. `ROOM_THEMES` defines the 4 castle zones and their restorable "spots" (cost, styles, story cutscene dialogue). Its public API is the object returned at the bottom of the file (`init`, `switchTheme`, `exportRoomsState`/`importRoomsState`, etc.).
5. `game.js`: everything else. The single mutable `state` object, game data tables (`CHAINS` with generator `tiers`, `CROSS_RECIPES`, `CUSTOMERS`, `HOLIDAY_EVENTS`), the 7×8 main board, the 5×5 holiday event board, pointer-based drag/merge engines (`drag`, `evDrag`), orders/quests, XP/levels, modals, and `bindUIEvents()`. Entry point is `init()` on `DOMContentLoaded`.

Data flow: game actions mutate `state`, then call `renderAll()` (or a specific `render*UI()` function) and `triggerAutoSave()`. `triggerAutoSave()` builds the save payload by hand from `state` plus `Interior3DEngine.exportRoomsState()`.

### Invariants to keep when changing things

- **Adding a persisted field** requires three edits: the default in `state` (game.js), the payload in `triggerAutoSave()`, and a validated restore in `GameDB.mergeWithDefaultState` (db.js). Saves must stay backward compatible. Players' existing progress must never break, so don't rename existing keys. For example, room theme keys `alchemy`/`harbor`/`garden`/`banquet` are kept even though the zones were renamed.
- **Energy rules** (cap 100, +1 every 300s) are defined twice: in `db.js` (`NATURAL_ENERGY_CAP`, `ENERGY_REGEN_INTERVAL_SEC`) and in `game.js` (`NATURAL_ENERGY_CAP`, `ENERGY_REGEN_SEC`). Keep them in sync.
- **Adding a chain or level** means updating `CHAINS` in game.js and the matching SVG case in sprites.js.

### Releasing a version

Each release so far has bumped all of these together:
- `APP_VERSION` and a new entry at the top of `VERSION_HISTORY` in game.js. The changelog popup appears when the version differs from the saved `lastSeenVersion`. Move the `LATEST` badge to the new entry.
- The header comment at the top of game.js.
- `CACHE_NAME` in `sw.js` (e.g. `crown-gossip-pwa-v5` → `v6`). The SW is network-first, so this mainly clears old offline caches. If you add a new static file, add it to `ASSETS` there too.

Commit messages follow `feat(vX.Y.Z): ...` style.
