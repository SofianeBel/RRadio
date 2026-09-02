# RRadio Verification Map

This directory is the maintained source for verifying the user-facing behavior of RRadio (GTA 6 Radio Overlay for PC). Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline Preconditions

- Launch RRadio dev server at `http://127.0.0.1:5173`.
- Run `node scripts/verify-rradio.mjs doctor` and ensure it reports `PASS`.
- Viewport size for visual evidence must be at least `1920x1080`.
- Only one native `rradio.exe` instance can run at a time to prevent Windows hotkey collision.

## Driving Conventions

- Start every recipe from the baseline state.
- Prefer keyboard shortcuts (`F8`, `F10`, `F7`, `F9`) and visible ARIA / text labels over raw pixel coordinates.
- Run automated verification through `node scripts/verify-rradio.mjs drive <feature>`.
- Capture both initial state and post-interaction state for every feature verified.
- Evidence artifacts are saved under `artifacts/verify-rradio/<feature>/`. Do not delete them during cleanup.

## Feature Entry Contract

Each feature file uses exactly four H2 sections in this order:

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with <harness>` starts with `Preconditions:` and pairs each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

## Features

- [Radio Wheel HUD](./radio-wheel.md) covers opening the wheel (`F8`), selecting stations, active station highlighting, and audio playback.
- [Settings Dialog](./settings-dialog.md) covers opening the settings (`F10`), tab navigation, glassmorphism visuals, and persistence.
- [On-Demand Drill-Down](./ondemand-drilldown.md) covers switching to On-Demand (`F7`), 3-level navigation (Services, Playlists, Tracks), and slide animations.
- [Discord Rich Presence](./discord-rpc.md) covers Discord status configuration, album covers, station badges, and live progress bar.
