---
name: verify-rradio
description: Drive and verify the RRadio GTA 6 overlay (Tauri v2 + React 19 transparent desktop overlay, radio wheel, On-Demand streaming, glassmorphism settings, Discord RPC) through the real UI in a browser harness with screenshots and state assertions.
---

# Verify RRadio

Drive the real RRadio app the way a user does and prove behavior with evidence.
Primary surface is a Windows transparent overlay (`rradio.exe`, Tauri v2 + Win32 +
React 19); the automation surface is the exact production React DOM served by the
local Vite dev server, driven with Playwright keyboards and clicks. Native-only
behavior (click-through styles, global hotkeys, tray, Discord IPC) is covered by
live-process checks, not by the browser.

## Launch

### 1. Dev server (UI and browser driving)

From the repo root:

```bash
bun run dev
```

Ready signal: HTTP `200` on `http://127.0.0.1:5173/`.
Record the server PID you started (e.g. `echo $!`, job object, or process manager
handle). You need that PID for cleanup. Run Node scripts from the repo root so
`node_modules` resolves.

### 2. Native binary (only for Win32-only behavior)

```bash
cargo build --manifest-path src-tauri/Cargo.toml
./src-tauri/target/debug/rradio.exe
```

Rebuild first: frontend assets compile into the exe, so a stale binary proves
nothing about current `src/`. Kill stale instances by the PID you recorded before
starting a new one. Ready signal: the PID you launched appears in `tasklist` and
responds to `F8`.

Teardown for both is under `Cleanup`. Never leave a process you started running.

## Doctor

Run first whenever anything looks off. Read-only, changes nothing:

```bash
node scripts/verify-rradio.mjs doctor
```

It checks the dev server port answering, the native debug binary presence, and
the audio manifest (`src/data/radioManifest.json`, 139 tracks). Require `PASS`
before driving. If the port is up but the server was not started by this run, do
not claim the instance: drive only non-mutating checks and never shut it down.

## Isolate

- One native `rradio.exe` at a time. Global hotkeys (`F8`/`F9`/`F10`/`F7`) collide
  across instances.
- One owner per dev-server port. If `5173` answers from a process this run did not
  start, refuse to drive mutating flows on it; start nothing second on the port.
- Playwright keyboard and mouse go to the driven page only; they do not trigger the
  user's live overlay global hotkeys. Never synthesize OS-wide key events at a
  user's live session.
- Each drive uses a throwaway browser context, so `localStorage` seeding inside the
  drive never touches the user's profile. Never drive an overlay the user is using.

## Drive

All drives render the real DOM, press the real keys (`F8`/`F7`/`F9`/`F10`/arrows,
handled on `window keydown` in `src/App.tsx`), assert resulting state, and only
then screenshot. A drive that only screenshots without asserting proves nothing;
every recipe below fails loudly (non-zero exit) when the expected state is absent.

```bash
# Radio wheel: F8 opens carousel, ArrowRight switches station, active highlight moves
node scripts/verify-rradio.mjs drive radio-wheel

# Settings dialog: F10 opens glassmorphism modal, DISCORD RPC tab renders
node scripts/verify-rradio.mjs drive settings-dialog

# On-Demand drill-down: F8 then F7 shows streaming providers (fixture-seeded, no login)
node scripts/verify-rradio.mjs drive ondemand-drilldown

# Discord RPC: settings DISCORD RPC tab shows live preview card
node scripts/verify-rradio.mjs drive discord-rpc
```

Stable handles used by the harness (from this repo, not examples): tab buttons
with text `AUDIO`, `AFFICHAGE`, `COMMANDES`, `DISCORD RPC`, `SERVICES STREAMING`,
`FICHIERS PC` (`src/components/SettingsDialog.tsx`); station names `FLASH FM`,
`WAVE 103` (`src/data/stations.ts`); settings key `rradio_gta6_settings_v1`
(`src/utils/settingsStore.ts`). Prefer these over coordinates and tab order.

Login-gated Google/YouTube flows are reproduced without credentials: intercept
`**/youtube/v3/playlistItems**` and `**/youtube/v3/videos` with Playwright
`context.route` fixture JSON and inject settings into `localStorage`
(`rradio_gta6_settings_v1`) before reload. Curated mixes
(`YTM_CURATED_MIXES` in `src/services/youtubeMusic.ts`) play without login and
are the default On-Demand drive path. One-off probe scripts use `*.tmp.mjs`
names under `scripts/` and are deleted after the run.

## Evidence

Every proof lands under `artifacts/verify-rradio/<feature>/` and survives cleanup:

- `radio-wheel/radio-wheel.png` plus `radio-wheel-switched.png`
- `settings-dialog/settings-audio.png` plus `settings-discord.png`
- `ondemand-drilldown/ondemand-providers.png`
- `discord-rpc/discord-preview-card.png`

Proof standards:

1. Exercise the real user path (keys and clicks on the rendered UI), never internal
   setters or test-only endpoints.
2. Capture the action and the resulting state, not just the final screen: before and
   after screenshots plus the state assertion the drive checked.
3. Verify side effects alongside what is visible: settings writes read back from
   `localStorage`, playback state read from the audio element (`currentRadioTrack`
   is the single source of truth, `src/audio/radioPlayer.ts`).
4. Mocks only where a production boundary already isolates the external system
   (YouTube API fixtures above). Live radio streams and cover art are real network.
5. Name the feature ID and entry point with every artifact; report an unreachable
   path with the attempted command and unmet precondition instead of substituting
   a different path.

## Cleanup

- The helper closes its own browser on every path, including failures.
- Stop only the PIDs this run started (server, native exe). By PID or job handle,
  never by process name: no `taskkill /IM rradio.exe`, no port-based kills of
  processes you do not own.
- Delete `scripts/*.tmp.mjs` probe scripts after the run.
- Never delete `artifacts/verify-rradio/`. After cleanup, confirm the evidence
  still exists at the named location; a cleanup that eats the proof fails the run.
- Run this cleanup after every failed iteration too, so broken attempts do not
  strand processes or ports.

## Helpers

- `scripts/verify-rradio.mjs` — unified Playwright runner. `doctor` is the
  read-only preflight; `drive <feature>` drives one mapped feature, asserts state,
  and writes evidence. No arguments to reverse-engineer.
- `takeOver/PROJECT_RECAP.md` — architecture, hotkey map, and subsystem handover
  for grounding new recipes.
- `.cursor/skills/verify-rradio/features/` — the maintained feature map. Read the
  index before driving; drive the matching file as the recipe.
