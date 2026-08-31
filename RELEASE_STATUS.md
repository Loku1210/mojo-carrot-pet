# Mojo Carrot Pet 1.0.1 release status

| Target | Candidate evidence | Runtime evidence | Status boundary |
|---|---|---|---|
| macOS Apple Silicon | Source rebuild, positive-list input audit, payload scan, SHA256 | macOS GUI smoke | 未签名、未公证 |
| macOS Intel / universal | Build attempt and structure inspection recorded in this release batch | Intel 真机未验收 | No support claim without evidence |
| Windows x64 | Cross-build, PE/NSIS 结构验证, payload scan, SHA256 | Windows 真机未验收 | 未签名 |

## Exact release assets

- `Mojo.Carrot.Pet-1.0.1-arm64.dmg`
- `Mojo.Carrot.Pet.Setup.1.0.1.exe`
- `SHA256SUMS.txt`

Any universal candidate uses `Mojo.Carrot.Pet-1.0.1-universal.dmg` and must not replace the Apple Silicon asset until its own checks pass.

## License and fan-work boundary

This is a 非官方粉丝作品. Code is MIT licensed; original character art, frames, icons, and bundled copy follow `ASSETS-LICENSE` and are non-commercial. The app is not affiliated with or endorsed by third-party rights holders. The two retained everyday fandom references do not grant or imply authorization.

## Verification commands

```bash
npm ci
npm run verify
npm run build:mac:arm64
npm run build:win:x64
npm run dist:checksums
```
