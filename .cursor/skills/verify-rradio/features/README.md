# RRadio Verification Map

This directory is the maintained source for verifying the user-facing behavior of RRadio (GTA 6 Radio Overlay for PC). Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch RRadio dev server at `http://127.0.0.1:5173` from the repo root (`bun run dev`, HTTP `200` ready) and record its PID.
- Run `node scripts/verify-rradio.mjs doctor` and require `PASS`.
- Viewport for visual evidence must be at least `1920x1080`.
- Only one native `rradio.exe` instance at a time: global hotkeys collide. Never drive an overlay session the user is using.
- If port `5173` answers from a process this run did not start, drive only non-mutating checks and never shut it down. Playwright input goes to the driven page only, never OS-wide.

## Driving Conventions

- Start every recipe from the baseline state.
- Prefer keyboard shortcuts (`F8`, `F10`, `F7`, `F9`) and visible text labels over raw pixel coordinates.
- Run automated verification through `node scripts/verify-rradio.mjs drive <feature>` from the repo root.
- Capture both initial state and post-interaction state for every feature verified.
- Evidence artifacts are saved under `artifacts/verify-rradio/<feature>/`. Do not delete them during cleanup.
- Record the feature ID and entry point used with every artifact. Report an unreachable path with the attempted command and unmet precondition; never report a skipped entry point as verified through a different path.

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
- [Localization](./localization.md) covers bilingual French/English switching, header toggle, settings translation, HUD integration, and persistence.
