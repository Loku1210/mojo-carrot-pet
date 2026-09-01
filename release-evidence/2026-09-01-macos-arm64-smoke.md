# macOS Apple Silicon smoke — 2026-09-01

The rebuilt app was launched from `dist/mac-arm64/Mojo Carrot Pet.app` with an isolated user-data directory at `/private/tmp/mojo-smoke-20260901`.

## Observed

- Loaded all 57 animation frames and initialized 9 animations.
- Initial state was idle with a 192×208 canvas at 75% scale and 100% opacity.
- Opened the context menu and observed the settings, hide, and tray-restore guidance.
- Changed scale to 65% and opacity to 80%; both values were persisted in the isolated settings file.
- Drag interaction entered and exited the dragging state and selected a directional running animation.
- Hide action changed the renderer visibility state to hidden without a crash.

## Boundary

The tray-menu restore and exit paths are present in the reviewed main-process contract, but the restore click was not independently captured by this automated smoke. No Intel Mac or Windows host was available, so those runtime claims remain intentionally unmade.
