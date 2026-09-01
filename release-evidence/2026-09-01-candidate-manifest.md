# Mojo Carrot Pet 1.0.1 candidate manifest

Built from commit `05f2bf9` plus this evidence update on 2026-09-01.

| Asset | Size | SHA256 | Verification boundary |
|---|---:|---|---|
| `Mojo.Carrot.Pet-1.0.1-arm64.dmg` | 124,933,484 bytes | `4ec81244a2960f6889684d859f60932a57c9a5bd4cb0123805b21d4dba265b79` | macOS Apple Silicon GUI smoke; ad-hoc signature; not notarized |
| `Mojo.Carrot.Pet-1.0.1-universal.dmg` | 221,917,311 bytes | `4dd1b159780da2dffbcf523393ec379ceae9497fd98c5a8b6674d995239fc9f1` | Universal structure built; Intel runtime not tested; ad-hoc signature; not notarized |
| `Mojo.Carrot.Pet.Setup.1.0.1.exe` | 106,689,519 bytes | `d1676a4157b42748982c058dbd5d099a52ac4c757ab10b8912262652685493e3` | NSIS installer and x64 PE structure inspected; Windows runtime not tested; unsigned |

## Gates

- `npm run verify`: 6 tests passed; 7 renderer files and 57 PNG assets matched the reviewed positive list.
- Source safety scan: 0 blocking, 0 warning, 0 error.
- Packaged payload safety scan: 0 blocking, 0 warning, 0 error. Seventeen informational findings are upstream Chromium license attribution contacts or `COPYING.ipadic` separators, narrowly allowlisted only for `win-unpacked/LICENSES.chromium.html`.
- `codesign`: arm64 app reports `Signature=adhoc`, `TeamIdentifier=not set`.
- Windows inspection: installer is a 32-bit NSIS self-extractor that installs an x86-64 Electron executable.

Generated installers remain local in ignored `dist/`; this file records evidence and does not publish a release.
