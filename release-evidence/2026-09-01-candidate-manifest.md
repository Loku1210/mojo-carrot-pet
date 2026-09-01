# Mojo Carrot Pet 1.0.1 candidate manifest

Rebuilt on 2026-09-01 from local branch state based on `98aeb20`, with Loku's original reviewed dialogue set restored and locked by a repository fixture.

| Asset | Size | SHA256 | Verification boundary |
|---|---:|---|---|
| `Mojo.Carrot.Pet-1.0.1-arm64.dmg` | 124,933,757 bytes | `abdb38519000e2dd97289022dd67229167b3439b86b500b9f06d77e7337bfeba` | Apple Silicon package rebuilt; packaged dialogue inspected; ad-hoc signature; not notarized |
| `Mojo.Carrot.Pet-1.0.1-universal.dmg` | 221,917,484 bytes | `0b815a468f7e1b000f0e93bac548ece35534320fb7d4e800c3ca99ef54e0b842` | Universal package rebuilt; packaged dialogue inspected; Intel runtime not tested; ad-hoc signature; not notarized |
| `Mojo.Carrot.Pet.Setup.1.0.1.exe` | 106,689,670 bytes | `cc6bc45ba0c9d52d01bccb228874f5104a699007fc9898c22ca4fd0911621494` | NSIS package rebuilt; packaged dialogue inspected; Windows runtime not tested; unsigned |

## Gates

- `npm run verify`: 7 tests passed; the restored dialogue exactly matches `test/fixtures/loku-messages.json`; 7 renderer files and 57 PNG assets matched the reviewed positive list.
- Source safety scan: 0 blocking, 0 warning, 0 error.
- Packaged payload safety scan: 0 blocking, 0 warning, 0 error. Seventeen informational findings are upstream Chromium license attribution contacts or `COPYING.ipadic` separators, narrowly allowlisted only for `win-unpacked/LICENSES.chromium.html`.
- `codesign`: arm64 app reports `Signature=adhoc`, `TeamIdentifier=not set`.
- Windows inspection: installer is a 32-bit NSIS self-extractor that installs an x86-64 Electron executable.

Generated installers remain local in ignored `dist/`; this file records evidence and does not publish a release.
