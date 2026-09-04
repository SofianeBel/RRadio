# Discord Rich Presence (RPC)

Discord Rich Presence displays real-time playback information on the user's Discord profile with music mode (`ActivityType::Listening`), official album covers, station badge icons, and a live progress bar.

## Sub-features

- `listening-status`: Sets the profile activity to `Listening to RRadio 🎧` instead of `Playing a game`.
- `album-art`: Shows the high-resolution (600x600) official cover of the currently playing track via Apple CDN.
- `progress-bar`: Renders an interactive time bar (`00:00 ━━━━●━━━━ 04:45`) that synchronizes and resets cleanly on every song transition.
- `non-blocking-worker`: Rust backend delegates IPC calls to an isolated OS worker thread (`discord-rpc-worker`) with an 8-second backoff circuit breaker.

## How to get to it (user POV)

- Open Settings (`F10` or `Alt + S`) and navigate to the `DISCORD RPC` tab.
- Inspect the live profile preview card showing real-time song title, station, and progress.
- Toggle Discord RPC on/off or configure custom Client ID and GitHub button visibility.

## Driving it with verify-rradio

Preconditions:
- Dev server active on `http://127.0.0.1:5173`.
- `node scripts/verify-rradio.mjs doctor` returns `PASS`.

- **Open Discord settings.** Press `F10` and click `DISCORD RPC`.
- **Verify preview.** The Discord profile card displays the live track cover, song title, artist, station badge, and buttons.
- **Verify proof.** Run `node scripts/verify-rradio.mjs drive discord-rpc`. The screenshot at `artifacts/verify-rradio/discord-rpc/discord-preview-card.png` captures the rendered preview card.

## Gotchas

- If the Discord desktop client is not running, the Rust background worker safely pauses connection attempts for 8 seconds without logging errors or blocking the UI.
- Timestamps must always be Unix seconds (not milliseconds), and both `start_timestamp` and `end_timestamp` must be provided to render the duration bar on Discord.
