# Mojo Carrot Pet

Mojo Carrot Pet 是一个非官方粉丝向桌面宠物 App。卜卜会停在桌面上，可以拖拽、点击、右键设置、隐藏到托盘，并在空闲时做一些小动作。

欢迎各位WMLS下载使用！！

小红书：@Loku🥕🍏

## 安全下载声明

请只从本项目的 GitHub Releases 下载安装包。

不要安装来自网盘、群文件、第三方网站、陌生链接或他人二次打包的安装包。桌面 App 安装包可以被篡改并植入恶意代码；如果来源不是本仓库的 GitHub Release，请不要运行。

每次正式发布都会附带 `SHA256SUMS.txt`。下载后可以用 SHA256 校验安装包是否和 GitHub Release 中发布的一致。

## 下载

直接下载：

- [macOS Apple Silicon 下载 DMG](https://github.com/Loku1210/mojo-carrot-pet/releases/download/v1.0.1/Mojo.Carrot.Pet-1.0.1-arm64.dmg)
- [Windows x64 下载 EXE](https://github.com/Loku1210/mojo-carrot-pet/releases/download/v1.0.1/Mojo.Carrot.Pet.Setup.1.0.1.exe)
- [下载 SHA256 校验文件](https://github.com/Loku1210/mojo-carrot-pet/releases/download/v1.0.1/SHA256SUMS.txt)

也可以从 [GitHub Releases 页面](https://github.com/Loku1210/mojo-carrot-pet/releases/tag/v1.0.1) 查看全部发布文件。

暂时不要把 Apple Silicon 版本用于 Intel Mac。Intel Mac 需要单独的 x64 或 universal macOS 包。

## 当前验证状态

- **macOS Apple Silicon**：本轮从当前源码重建，并执行 GUI smoke、载荷清单、签名状态和 SHA256 检查。
- **Intel Mac**：会尝试 x64/universal 构建；只有构建和结构检查成功时才列为候选，未完成 Intel 真机验收前不标记为完全支持。
- **Windows x64**：本轮只做交叉构建与安装包**结构验证**；**Windows 真机**安装和运行仍待外部验收。
- 当前候选**未签名、未公证**。macOS 的 ad-hoc 签名不等于 Developer ID 签名。

## 安装

### macOS

1. 下载 `Mojo.Carrot.Pet-1.0.1-arm64.dmg`。
2. 打开 DMG，把 App 拖入 Applications。
3. 如果 macOS 提示 App 来自未认证开发者，这是因为当前版本未做 Apple Developer ID 签名和 notarization。请只在确认文件来自本 GitHub Release 且 SHA256 校验一致后打开。

   如果打开时提示"已损坏"或"无法验证开发者",在**确认 SHA256 与本 Release 一致后**,
   任选其一绕过(本 App 未做 Apple 签名/公证):
   - 右键点击 App 图标 →「打开」→ 在弹窗再点「打开」;或
   - 终端执行:`xattr -cr "/Applications/Mojo Carrot Pet.app"` 后再打开。

### Windows

1. 下载 `Mojo.Carrot.Pet.Setup.1.0.1.exe`。
2. 双击安装。
3. 如果 Windows Defender SmartScreen 提示未知发布者，请先确认文件来自本 GitHub Release 且 SHA256 校验一致。

   若 SmartScreen 拦截,在**确认 SHA256 与本 Release 一致后**:
   点击弹窗的「更多信息 / More info」→「仍要运行 / Run anyway」。

## 使用

- 拖动卜卜可以移动位置。
- 右键卜卜可以打开设置菜单。
- 可以调整大小、透明度、窗口置顶和边缘自动隐藏。
- 隐藏后可以从系统托盘恢复。
- 托盘菜单中的“自定义反应/对话”会打开用户配置文件；修改后重新加载配置即可生效。

用户配置文件会保存在系统应用数据目录中，不会写入安装包内部。

## 校验 SHA256

macOS:

```bash
shasum -a 256 "Mojo.Carrot.Pet-1.0.1-arm64.dmg"
```

Windows PowerShell:

```powershell
Get-FileHash "Mojo.Carrot.Pet.Setup.1.0.1.exe" -Algorithm SHA256
```

把输出结果和 Release 中的 `SHA256SUMS.txt` 对比。完全一致再安装。

## 开发

```bash
npm install
npm start
```

构建：

```bash
npm run build:mac:arm64
npm run build:win:x64
npm run dist:checksums
npm run verify
```

## 非官方声明

本项目是非官方粉丝作品，仅用于个人娱乐和学习交流。项目与五月天、Stayreal、相信音乐及相关权利方没有从属、合作、授权或背书关系。

源码采用 MIT；原创角色帧、图标和应用文案按 `ASSETS-LICENSE` 的非商业条款提供。内置反应文案已收敛为原创桌宠短句，仅保留两个经复核的日常粉丝语境称呼；这不构成第三方授权。不得把项目或素材用于暗示合作、代言或商业推广。

如果项目中的文案、素材或表达方式涉及权利方不希望公开使用的内容，请通过 GitHub Issue 联系维护者处理。
