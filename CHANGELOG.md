# Changelog

## 1.0.1 - 2026-07-02

- Fixed transparent pet-window areas intercepting scroll and click input on underlying apps.
- Added pixel-level mouse hit testing so only visible pet pixels and the open context menu capture pointer events.

## 1.0.0 - 2026-06-30

- Added persistent settings for scale, opacity, always-on-top, edge hiding, and window position.
- Moved user-editable message configuration into the app user data folder.
- Added a restrictive renderer Content Security Policy.
- Upgraded Electron to `^43.0.0`; `npm audit` reports 0 vulnerabilities.
- Added public download safety guidance and checksum workflow.
