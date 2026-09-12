# News alerts

## Sub-features

- `news-feed`: official Rockstar Newswire titles, dates, and source icons.
- `news-theme`: GTA IV phone beeps and GTA VI whistle with distinct pop-ups.
- `news-controls`: saved enable/sound switches and an explicit preview.
- `news-native`: passive topmost window, unchanged foreground, eight-second expiry.

## How to get to it (user POV)

Open Settings with F10. Select DISPLAY / AFFICHAGE. Scroll to NEWS / ACTUS.
Use Preview / Aperçu to see and hear the current theme. New headlines appear
automatically after onboarding, then on checks every 15 minutes. Radio mute
silences automatic alerts. Preview is an explicit sound test. Select an article
in the list to open the official page in the default browser.

## Driving it with Playwright

Preconditions: follow the verification map's process ownership rules and run
`node scripts/verify-rradio.mjs doctor` first.

`node scripts/verify-news.mjs` checks the real Settings preview, both sound
patterns, mute switch, saved settings, expiry, narrow screens and reduced motion.
Browser-only news fetches report desktop availability; they do not fake a feed.

`node scripts/verify-news.mjs --native` attaches to an owned release executable
started with `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9225`
and a throwaway `WEBVIEW2_USER_DATA_FOLDER`. Never use the user's normal profile.
It checks the live feed and Win32 styles through `verify-news-window.ps1`.
Screenshots and assertion results go under `artifacts/verify-rradio/news/`.

## Gotchas

- The native test changes settings only in its throwaway profile.
- The native script disconnects CDP; stop the exact exe PID you started afterward.
- Newswire uses Rockstar's current persisted query. A source change reports an
  error and retries at the next check; no fallback content is fabricated.
- The first successful check alerts only the newest headline. Seen IDs persist
  across launches; the list shows up to 12 articles. The feed text is in English.
