## Learned User Preferences

- Prefers technical discussions and explanations in French, with concise, practical summaries of architecture and progress.
- Always verify visual changes with real screenshots or captures; never assume UI fidelity without validating against reference captures.
- The overlay must start muted on launch, remain completely transparent to mouse clicks (`WS_EX_TRANSPARENT`) when hidden so it never interrupts game focus or desktop clicking, and only accept input when summoned via hotkeys.
- The station selector must be a smooth horizontal sliding carousel (not a visible wrapping loop), with the active station highlighted by a beige/white border and slight scale enlargement, and no stray accent lines or side bars.
- "Mute / Unmute" and "Radio / On-Demand" labels and buttons must be prominently sized, horizontally centered, placed close to the selector, and match the active station name text color. The "Off" state is handled by Mute rather than an empty radio station slot.
- Settings and secondary dialogs must use true glassmorphism with backdrop blur and reflection of underlying windows, using a multi-stop rotating gradient (beige, purple, ocean light blue, peach) rather than a solid or generic dark overlay.
- Controller/gamepad support must never monopolize input focus or lock out keyboard and mouse navigation.
- Discord Rich Presence should use the "Listening" activity type with music notes rather than a game controller icon, displaying album art for the main track, station logos for the badge, and a real-time progress bar resetting on every track transition.
- Prioritize self-contained, plug-and-play solutions over manual local file setup (e.g. streaming audio directly from reliable CDNs and automated OAuth PKCE loopback servers).
- Validate native packaging, window overlays, and tray lifecycle early before implementing and polishing complex downstream features.
- Verification workflows must include compiling the native standalone release executable and verifying live process execution, not just frontend web bundles or headless browser checks.

## Learned Workspace Facts

- The project is built with Tauri v2 (`src-tauri`), Rust 2021 edition backend (`rradio_lib`), React 19 frontend (`src/App.tsx`), TypeScript, Tailwind CSS, Vite, and Bun.
- Rust backend configures the Tauri window with Win32 extended styles `WS_EX_LAYERED`, `WS_EX_TRANSPARENT`, `WS_EX_TOOLWINDOW`, `WS_EX_NOACTIVATE`, and DWM margins (`-1`) to achieve borderless transparency without taskbar disruption.
- Click-through behavior is toggled via Tauri IPC command `set_click_through(enable: bool)`: enabled when overlay is hidden to pass clicks to games, disabled when menus open to receive mouse input.
- System-wide hotkeys are managed in a dedicated Win32 `RegisterHotKey` thread (`F8`/`Alt+V` for wheel, `F9`/`Alt+M` for mute, `F10`/`Alt+S` for settings, `F7`/`Alt+O` for On-Demand) and `rdev` for push-to-show keys (`Alt+Q`/`Alt+A`).
- The application integrates into the Windows system tray with a left-click toggle and right-click context menu (`Show/Hide`, `Mute`, `Settings`, `Quit`).
- The radio audio engine emulates 8 GTA Vice City stations (`flash_fm`, `wave_103`, `v_rock`, `emotion_983`, `fever_105`, `wildstyle`, `espantoso`, `kchat`) streaming 139 live tracks from Archive.org with continuous epoch-based live positioning.
- Tuning static between radio stations is synthesized procedurally via Web Audio API (`AudioContext` bandpass filtered white noise at 1400 Hz for 200ms) without static audio sample files.
- On-Demand audio supports 3-level drill-down navigation (Streaming Service -> Playlists/Mixes -> Track Queue) with smooth physical slide animations.
- Google OAuth 2.0 PKCE authentication runs via a local Rust loopback server in `src-tauri/src/oauth.rs` listening on a dynamic port to capture authorization codes for YouTube Music.
- Discord Rich Presence socket communication (`\\.\pipe\discord-ipc-0`) runs in an isolated background thread (`discord-rpc-worker`) over a bounded Rust `sync_channel` with an 8-second backoff recovery loop to prevent UI or hotkey freezing.
- Canonical architecture, project history, and handover details are documented in `takeOver/PROJECT_RECAP.md`.
- Tauri embeds frontend assets from `dist/` directly into the native Windows executable (`src-tauri/target/release/rradio.exe`, ~23.6 MB) at compile time; updating frontend code requires recompiling the Rust binary for standalone execution.
