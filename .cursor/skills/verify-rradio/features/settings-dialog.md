# Settings Dialog

The Settings Dialog provides a glassmorphism modal with rotating background gradients (*Beige -> Purple -> Ocean Blue -> Peach*) to configure Audio, Overlay Display, Global Controls, Discord RPC, Streaming Services, and Local Music Files.

## Sub-features

- `settings-open`: Opens the modal over the game or desktop using `F10` or `Alt + S`.
- `tab-navigation`: Switches cleanly between 6 tabs (`AUDIO`, `AFFICHAGE`, `COMMANDES`, `DISCORD RPC`, `SERVICES STREAMING`, `FICHIERS PC`).
- `glassmorphism-render`: Renders multi-layer backdrop blur and reflection styling.
- `settings-persistence`: Saves all modified preferences into `localStorage` under `rradio_gta6_settings_v1`.

## How to get to it (user POV)

- Press `F10` or `Alt + S` on keyboard.
- Right-click the system tray icon and choose `Paramètres`.
- Click the gear icon inside the open Radio Wheel HUD.

## Driving it with verify-rradio

Preconditions:
- Dev server active on `http://127.0.0.1:5173`.
- `node scripts/verify-rradio.mjs doctor` returns `PASS`.

- **Open settings.** Press `F10`. The glassmorphism window appears centered on screen with `AUDIO` selected by default.
- **Switch tabs.** Click the `DISCORD RPC` tab. The active tab highlight slides smoothly, displaying the Discord RPC configuration toggles and live preview card.
- **Verify proof.** Run `node scripts/verify-rradio.mjs drive settings-dialog`. The screenshots in `artifacts/verify-rradio/settings-dialog/` prove both the initial audio view and the Discord RPC configuration tab.

## Gotchas

- When Settings is open, click-through (`WS_EX_TRANSPARENT`) is disabled natively so mouse interaction works inside the modal.
- Closing the dialog (`Escape` or close button) automatically re-enables click-through so game clicks pass through.
