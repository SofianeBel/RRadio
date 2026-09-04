# Localization (Bilingual French / English)

## Sub-features

- `lang-toggle`: Top-right header toggle pill `[ FR | EN ]` switching app language immediately.
- `settings-tab-i18n`: All settings tabs, section headers, options, and tooltips translated between FR and EN.
- `settings-display-lang`: Dedicated language selector row in AFFICHAGE / DISPLAY tab.
- `hud-i18n`: Radio Wheel HUD labels (RADIO / ON DEMAND, MUTE / UNMUTE, metadata subtitles) adapt dynamically.
- `ondemand-providers-i18n`: On-Demand cards, taglines, and breadcrumbs adapt dynamically.
- `settings-persistence`: Language preference saved to `localStorage` under `rradio_gta6_settings_v1.language`.

## How to get to it (user POV)

- Press `F10` (or `Alt+S`) to open the settings dialog.
- Click `EN` on the top-right header toggle pill or choose `English` under `AFFICHAGE` / `DISPLAY`.
- Press `F8` to inspect the Radio Wheel HUD in English.
- Press `F7` to inspect On-Demand mode in English.

## Driving it with Playwright harness

Preconditions:
- Dev server running at `http://127.0.0.1:5173`.
- `node scripts/verify-rradio.mjs doctor` reports `PASS`.

```bash
node scripts/verify-rradio.mjs drive localization
```

Observable results:
1. Opens settings dialog with `F10`. Asserts French tabs (`AUDIO`, `AFFICHAGE`, `COMMANDES`, `SERVICES STREAMING`, `FICHIERS PC`). Saves `artifacts/verify-rradio/localization/settings-fr.png`.
2. Clicks `EN` in the header. Asserts English tabs (`DISPLAY`, `CONTROLS`, `STREAMING SERVICES`, `PC FILES`). Asserts `localStorage` contains `"language":"en"`. Saves `artifacts/verify-rradio/localization/settings-en.png`.
3. Clicks `DISPLAY` tab. Asserts `SYSTEM LANGUAGE [English]`. Saves `artifacts/verify-rradio/localization/settings-display-en.png`.
4. Closes settings, opens HUD (`F8`) and On-Demand (`F7`). Asserts English breadcrumb and metadata. Saves `artifacts/verify-rradio/localization/wheel-ondemand-en.png`.
5. Switches back to French. Asserts French restored. Saves `artifacts/verify-rradio/localization/settings-fr-restored.png`.

## Gotchas

- Ensure default language remains `'fr'` so previous verification recipes continue to match their French text assertions out of the box.
- The top-right toggle pill contains `FR` and `EN` buttons with clear click targets; avoid ambiguous selectors.
