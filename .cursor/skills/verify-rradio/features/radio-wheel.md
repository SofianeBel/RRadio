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

- **Open wheel.** Press `F8`. The HUD carousel animates into view across the screen with station logos.
- **Select station.** Press `ArrowRight`. The carousel shifts smoothly to the next station (e.g. from Flash FM to Wave 103), playing a 200ms FM static burst and updating the track title.
- **Verify proof.** Run `node scripts/verify-rradio.mjs drive radio-wheel`. The artifacts `artifacts/verify-rradio/radio-wheel/radio-wheel.png` and `radio-wheel-switched.png` capture the open carousel and station transition.

## Gotchas

- Audio playback requires user interaction or autoplay permissions in headless browsers; mock/silent audio ensures no hang during headless testing.
- The overlay starts muted on fresh startup (`muteOnStartup: false` in user settings, but starts with volume initialized properly). Press `F9` if mute is active.
- Ensure only one instance of `rradio.exe` is running when testing native hotkeys.
