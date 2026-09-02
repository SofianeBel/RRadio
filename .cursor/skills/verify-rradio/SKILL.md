---
name: verify-rradio
description: Drive and verify the RRadio GTA 6 overlay (radio wheel, 8 Vice City stations, audio playback, glassmorphism settings dialog, On-Demand streaming, Discord RPC) via automated headless browser and native checks.
---

# Verify RRadio

Drive the real RRadio overlay application to prove UI, audio, navigation, and settings behavior without manual clicking.

## Surface

- **Primary surface**: Windows Desktop Transparent Overlay (`rradio.exe` built with Tauri v2 + Win32 + React 19).
- **Automation surface**: Local Vite dev server (`http://localhost:5173`), rendering the exact production React DOM with keyboard/mouse hotkey handlers, Web Audio API, and mock/fallback Tauri IPC.
- **Evidence format**: Full-viewport HD screenshots (`1920x1080`), element state assertions, and audio state checks saved under `artifacts/verify-rradio/<feature>/`.

## Launch

### 1. Dev Server (UI & Browser Driving)
Start the local server if not already running:
```bash
# In project root:
bun run dev
# Or with npm / npx:
npx vite --port 5173
```
Ready signal: HTTP `200` response on `http://localhost:5173/`.

### 2. Native Binary (Full Win32 Overlay & Global Hotkeys)
```bash
# Compile debug binary:
cargo build --manifest-path src-tauri/Cargo.toml
# Run binary:
src-tauri/target/debug/rradio.exe
```
Ready signal: `rradio.exe` appearing in `tasklist`.

## Doctor

Run the pre-flight doctor check to ensure the instance is ready to drive:
```bash
node scripts/verify-rradio.mjs doctor
```
Checks performed:
- HTTP port `5173` answering.
- Native binary presence (`src-tauri/target/debug/rradio.exe`).
- Audio manifest integrity (`src/data/radioManifest.json` with 139 tracks).

## Drive

Automate interactions through the verification CLI helper:
```bash
# Verify HUD Radio Wheel (F8 toggle, station switching, active highlight):
node scripts/verify-rradio.mjs drive radio-wheel

# Verify Glassmorphism Settings Dialog (F10 toggle, tab switching, sliders):
node scripts/verify-rradio.mjs drive settings-dialog

# Verify On-Demand 3-Level Drill-Down (F7 mode toggle, providers, playlists):
node scripts/verify-rradio.mjs drive ondemand-drilldown

# Verify Discord Rich Presence preview card & settings:
node scripts/verify-rradio.mjs drive discord-rpc
```

### Keyboard Shortcuts Reference

| Shortcut | Action | Observable Result |
| :--- | :--- | :--- |
| **`F8`** or **`Alt + V`** | Toggle Radio Wheel HUD | HUD carousel expands/collapses with active station highlighted |
| **`F9`** or **`Alt + M`** | Toggle Mute | Audio cuts off/resumes; Mute status updates on screen |
| **`F10`** or **`Alt + S`** | Toggle Settings Dialog | Glassmorphism modal opens with rotating gradient |
| **`F7`** or **`Alt + O`** | Toggle Radio / On-Demand | Switches mode between live FM stations and YouTube Music streaming |
| **`ArrowRight` / `ArrowLeft`** | Select Station / Track | Active card shifts smoothly; audio channel switches |
| **`Escape`** | Close Open Dialogs | Returns to clean game screen or default HUD |

## Evidence

Artifacts are automatically saved in `artifacts/verify-rradio/<feature>/`:
- `artifacts/verify-rradio/radio-wheel/radio-wheel.png`
- `artifacts/verify-rradio/radio-wheel/radio-wheel-switched.png`
- `artifacts/verify-rradio/settings-dialog/settings-audio.png`
- `artifacts/verify-rradio/settings-dialog/settings-discord.png`
- `artifacts/verify-rradio/ondemand-drilldown/ondemand-providers.png`
- `artifacts/verify-rradio/discord-rpc/discord-preview-card.png`

Proof standards:
1. Every proof artifact must be captured from the rendered interface with identity visible.
2. Never delete `artifacts/verify-rradio/` during cleanup.

## Cleanup

- **Close headless verification browser**: Handled automatically by `node scripts/verify-rradio.mjs`.
- **Stop native instance if launched for tests**:
  ```bash
  taskkill /F /IM rradio.exe
  ```
- **Stop dev server if started specifically for verification**: Terminate the PID identified by `netstat -ano | findstr :5173`.

## Helpers

- `scripts/verify-rradio.mjs`: Unified Node.js / Playwright verification runner for automated doctor and feature driving.
- `takeOver/PROJECT_RECAP.md`: Full project architecture and technical specifications.
