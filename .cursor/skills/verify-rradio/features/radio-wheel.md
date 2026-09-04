# Radio Wheel HUD

The Radio Wheel HUD provides a horizontal selection carousel inspired by GTA 6, allowing players to select from the 8 official GTA Vice City radio stations with instant audio playback and simulated FM broadcast.

## Sub-features

- `wheel-toggle`: Opens or closes the HUD carousel overlay with hotkey `F8` or `Alt + V`.
- `station-select`: Navigates between stations with arrow keys, mouse click, or gamepad.
- `active-highlight`: Prominently highlights the currently playing station with enlarged scale and badge border.
- `live-audio`: Streams live audio with intro DJ lines, songs, and simulated station static during transitions.

## How to get to it (user POV)

- Press `F8` or `Alt + V` on keyboard anywhere (global hotkey).
- Left-click the RRadio system tray icon near the Windows clock.
- Hold `Alt + Q` (or `Alt + A`) for temporary push-to-show overlay.

## Driving it with verify-rradio

Preconditions:
- Dev server active on `http://127.0.0.1:5173`.
- `node scripts/verify-rradio.mjs doctor` returns `PASS`.

- **Open wheel.** Press `F8` (`page.keyboard.press('F8')`). `h1.gta-hud-title` becomes visible with the current station name (e.g. `FLASH FM`).
- **Select station.** Press `ArrowRight`. The title text changes to the next station (e.g. `WAVE 103`); the drive asserts before/after differ, so a stuck carousel fails loudly.
- **Verify proof.** Run `node scripts/verify-rradio.mjs drive radio-wheel` from the repo root. The artifacts `artifacts/verify-rradio/radio-wheel/radio-wheel.png` and `radio-wheel-switched.png` capture the open carousel and the switched station.

## Gotchas

- Headless Chromium has no audible output; the drive asserts DOM state (station title, live track line `.gta-hud-text`), not sound. Autoplay policy never blocks these assertions.
- The overlay starts unmuted by default (`muteOnStartup: false` in `src/types/settings.ts`). If a live session is silent, press `F9` before concluding audio is broken.
- Ensure only one instance of `rradio.exe` is running when testing native hotkeys.
