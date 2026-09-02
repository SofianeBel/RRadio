# On-Demand Drill-Down

The On-Demand mode enables streaming personalized music (YouTube Music, Spotify, Deezer, Apple Music) with a physical 3-level vertical elevator drill-down animation.

## Sub-features

- `mode-toggle`: Switches between live FM Radio stations and On-Demand streaming using `F7` or `Alt + O`.
- `drilldown-levels`: Traverses 3 distinct layers: Level 1 (Streaming Services) -> Level 2 (Playlists & Albums) -> Level 3 (Track Queue).
- `elevator-animation`: Animates covers moving smoothly up and down like an elevator without flicker or index displacement.
- `oauth-connection`: Integrates Google OAuth 2.0 PKCE with a local Rust loopback server for one-click YouTube Music login.

## How to get to it (user POV)

- Press `F7` or `Alt + O` on keyboard.
- In the open Radio Wheel HUD, click the `ON DEMAND` button.

## Driving it with verify-rradio

Preconditions:
- Dev server active on `http://127.0.0.1:5173`.
- `node scripts/verify-rradio.mjs doctor` returns `PASS`.

- **Open wheel and switch mode.** Press `F8` then `F7`. The carousel switches from radio logos to streaming provider cards (*YouTube Music*, *Spotify*, etc.).
- **Drill into provider.** Select a provider card. The provider cards slide upward like an elevator while playlist cards enter from the bottom.
- **Verify proof.** Run `node scripts/verify-rradio.mjs drive ondemand-drilldown`. The artifact `artifacts/verify-rradio/ondemand-drilldown/ondemand-providers.png` captures the rendered provider selection view.

## Gotchas

- Returning from deeper levels (Back button or `Escape`) reverses the elevator animation so playlist covers slide down and providers reappear from above.
- Full track playback in On-Demand requires YouTube IFrame background authorization or local mock tracks.
