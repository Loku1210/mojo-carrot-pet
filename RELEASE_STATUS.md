# Mojo Carrot Pet 1.0.1 release status

| Target | Candidate evidence | Runtime evidence | Status boundary |
|---|---|---|---|
| macOS Apple Silicon | Source rebuild, positive-list input audit, payload scan, SHA256 | 隔离用户目录 GUI smoke：启动、拖动、菜单、缩放、透明度、隐藏 | 临时签名、未公证；托盘恢复未独立自动化取证 |
| macOS universal | Universal DMG rebuild, structure inspection, payload scan, SHA256 | Intel 真机未验收 | No Intel support claim without evidence |
| Windows x64 | Cross-build, PE/NSIS 结构验证, payload scan, SHA256 | Windows 真机未验收 | 未签名 |

## Exact release assets

- `Mojo.Carrot.Pet-1.0.1-arm64.dmg`
- `Mojo.Carrot.Pet-1.0.1-universal.dmg`
- `Mojo.Carrot.Pet.Setup.1.0.1.exe`
- `SHA256SUMS.txt`

The universal candidate does not replace the Apple Silicon asset and carries no Intel runtime claim until an Intel host completes installation and runtime checks.

## License and fan-work boundary

This is a 非官方粉丝作品. Code is MIT licensed; original character art, frames, icons, and bundled copy follow `ASSETS-LICENSE` and are non-commercial. The app is not affiliated with or endorsed by third-party rights holders. The two retained everyday fandom references do not grant or imply authorization.

## Verification commands

```bash
npm ci
npm run verify
npm run build:mac:arm64
npm run build:mac:universal
npm run build:win:x64
npm run dist:checksums
```

The reproducible evidence for this candidate is under `release-evidence/`.
