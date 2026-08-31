const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, shell } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow = null;
let tray = null;
let userSettings = null;

const DEFAULT_SETTINGS = {
  scale: 0.75,
  opacity: 1,
  alwaysOnTop: true,
  edgeHideEnabled: true,
  windowPosition: null
};

function getUserConfigDir() {
  return path.join(app.getPath('userData'), 'mojo-carrot-pet');
}

function getSettingsPath() {
  return path.join(getUserConfigDir(), 'settings.json');
}

function getMessagesPath() {
  return path.join(getUserConfigDir(), 'messages.json');
}

function ensureUserConfigDir() {
  fs.mkdirSync(getUserConfigDir(), { recursive: true });
}

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  ensureUserConfigDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function sanitizeSettings(settings) {
  const merged = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  const position = merged.windowPosition;

  return {
    scale: clampNumber(merged.scale, 0.4, 1.5, DEFAULT_SETTINGS.scale),
    opacity: clampNumber(merged.opacity, 0.2, 1, DEFAULT_SETTINGS.opacity),
    alwaysOnTop: Boolean(merged.alwaysOnTop),
    edgeHideEnabled: Boolean(merged.edgeHideEnabled),
    windowPosition: isFinitePosition(position) ? {
      x: Math.round(position.x),
      y: Math.round(position.y)
    } : null
  };
}

function clampNumber(value, min, max, fallback) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, numberValue));
}

function isFinitePosition(position) {
  return Boolean(position)
    && Number.isFinite(Number(position.x))
    && Number.isFinite(Number(position.y));
}

function loadSettings() {
  userSettings = sanitizeSettings(readJsonFile(getSettingsPath(), DEFAULT_SETTINGS));
  writeJsonFile(getSettingsPath(), userSettings);
}

function saveSettings(partialSettings) {
  userSettings = sanitizeSettings({ ...userSettings, ...(partialSettings || {}) });
  writeJsonFile(getSettingsPath(), userSettings);
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(userSettings.alwaysOnTop);
  }
  return userSettings;
}

function saveWindowPosition() {
  if (!mainWindow || !userSettings) return;
  const [x, y] = mainWindow.getPosition();
  saveSettings({ windowPosition: { x, y } });
}

// Default position: bottom-right of screen
function getDefaultPosition() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  return {
    x: screenW - 380,
    y: screenH - 360
  };
}

function getInitialPosition() {
  if (userSettings && isFinitePosition(userSettings.windowPosition)) {
    const display = screen.getDisplayNearestPoint(userSettings.windowPosition);
    const { x, y, width, height } = display.workArea;
    const savedX = Math.round(userSettings.windowPosition.x);
    const savedY = Math.round(userSettings.windowPosition.y);

    if (
      savedX >= x - 200 &&
      savedY >= y - 200 &&
      savedX <= x + width &&
      savedY <= y + height
    ) {
      return { x: savedX, y: savedY };
    }
  }
  return getDefaultPosition();
}

function createWindow() {
  const { x, y } = getInitialPosition();

  mainWindow = new BrowserWindow({
    width: 350,
    height: 350,
    x,
    y,
    transparent: true,
    frame: false,
    alwaysOnTop: userSettings.alwaysOnTop,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    closable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Make visible on all workspaces (macOS Spaces)
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // macOS: hide dock icon
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Prevent window from being closed by Cmd+W, hide instead
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const trayIconPath = path.join(__dirname, 'assets', 'frames', 'idle', '00.png');
  let trayIcon = nativeImage.createFromPath(trayIconPath);
  trayIcon = trayIcon.resize({ width: 18, height: 18 });
  trayIcon.setTemplateImage(true);

  tray = new Tray(trayIcon);
  tray.setToolTip('卜卜 · Mojo Carrot Pet 🥕');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🥕 显示卜卜',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: '👻 隐藏卜卜',
      click: () => {
        mainWindow.hide();
      }
    },
    {
      label: '⚙️ 自定义反应/对话',
      click: () => {
        openUserMessagesFile();
      }
    },
    {
      label: '🔄 重新加载配置',
      click: () => {
        if (mainWindow) {
          mainWindow.reload();
        }
      }
    },
    { type: 'separator' },
    {
      label: '📍 重置位置',
      click: () => {
        const { x, y } = getDefaultPosition();
        mainWindow.setPosition(x, y, true);
        saveSettings({ windowPosition: { x, y } });
        mainWindow.show();
      }
    },
    {
      label: '🔝 窗口置顶',
      type: 'checkbox',
      checked: userSettings.alwaysOnTop,
      click: (menuItem) => {
        saveSettings({ alwaysOnTop: menuItem.checked });
      }
    },
    { type: 'separator' },
    {
      label: '❌ 退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function openUserMessagesFile() {
  ensureUserMessagesFile();
  shell.openPath(getMessagesPath());
}

function ensureUserMessagesFile(defaultMessages = null) {
  ensureUserConfigDir();
  if (!fs.existsSync(getMessagesPath())) {
    writeJsonFile(getMessagesPath(), defaultMessages || {
      hover: [],
      click: [],
      multiClick: [],
      drag: [],
      daydream: [],
      typing: [],
      sleep: [],
      wakeup: [],
      wander: []
    });
  }
}

// ─── IPC Handlers ──────────────────────────────────────────

// Move window by delta (for wandering, edge pull, etc.)
ipcMain.on('move-window', (event, deltaX, deltaY) => {
  if (!mainWindow) return;
  const [x, y] = mainWindow.getPosition();
  const safeDeltaX = clampNumber(deltaX, -2000, 2000, 0);
  const safeDeltaY = clampNumber(deltaY, -2000, 2000, 0);
  mainWindow.setPosition(x + Math.round(safeDeltaX), y + Math.round(safeDeltaY));
});

// ─── Native Drag System (works across all monitors) ────────
let dragInterval = null;
let dragLastCursor = null;
let dragWindowPos = null;  // Our own position tracker, immune to macOS clamping

ipcMain.on('drag-start', () => {
  if (!mainWindow) return;
  dragLastCursor = screen.getCursorScreenPoint();
  const [x, y] = mainWindow.getPosition();
  dragWindowPos = { x, y };

  // Poll OS-level cursor position at 60fps
  if (dragInterval) clearInterval(dragInterval);
  dragInterval = setInterval(() => {
    if (!mainWindow || !dragLastCursor) return;
    const cursor = screen.getCursorScreenPoint();
    const dx = cursor.x - dragLastCursor.x;
    const dy = cursor.y - dragLastCursor.y;
    dragLastCursor = cursor;

    if (dx !== 0 || dy !== 0) {
      dragWindowPos.x += dx;
      dragWindowPos.y += dy;

      const newX = Math.round(dragWindowPos.x);
      const newY = Math.round(dragWindowPos.y);

      // Use setBounds to force position — bypasses macOS clamping
      const [w, h] = mainWindow.getSize();
      mainWindow.setBounds({ x: newX, y: newY, width: w, height: h });

      // Notify renderer of drag direction for animation
      mainWindow.webContents.send('drag-move', dx, dy);
    }
  }, 16); // ~60fps
});

ipcMain.on('drag-end', () => {
  if (dragInterval) {
    clearInterval(dragInterval);
    dragInterval = null;
  }
  dragLastCursor = null;
  dragWindowPos = null;
  saveWindowPosition();
});

// Get current window position
ipcMain.handle('get-window-position', () => {
  if (!mainWindow) return { x: 0, y: 0 };
  const [x, y] = mainWindow.getPosition();
  return { x, y };
});

// Get screen size for wander/edge bounds (Support Multi-Monitor)
ipcMain.handle('get-screen-size', () => {
  if (!mainWindow) {
    const { width, height } = screen.getPrimaryDisplay().workArea;
    return { x: 0, y: 0, width, height };
  }
  const display = screen.getDisplayMatching(mainWindow.getBounds());
  return {
    x: display.workArea.x,
    y: display.workArea.y,
    width: display.workArea.width,
    height: display.workArea.height
  };
});

// Reset position
ipcMain.on('reset-position', () => {
  const { x, y } = getDefaultPosition();
  mainWindow.setPosition(x, y, true);
  saveSettings({ windowPosition: { x, y } });
});

// Resize window (for scale changes)
ipcMain.on('resize-window', (event, width, height) => {
  if (!mainWindow) return;
  const safeWidth = clampNumber(width, 250, 900, 420);
  const safeHeight = clampNumber(height, 250, 900, 420);
  mainWindow.setSize(Math.round(safeWidth), Math.round(safeHeight));
});

// Hide window (from context menu)
ipcMain.on('hide-window', () => {
  if (mainWindow) mainWindow.hide();
});

// Set ignore mouse events (for click-through on transparent areas)
ipcMain.on('set-ignore-mouse', (event, ignore, options) => {
  if (!mainWindow) return;
  mainWindow.setIgnoreMouseEvents(ignore, options || {});
});

ipcMain.handle('load-settings', () => userSettings);

ipcMain.handle('save-settings', (event, partialSettings) => saveSettings(partialSettings));

ipcMain.handle('load-user-messages', () => {
  ensureUserMessagesFile();
  return readJsonFile(getMessagesPath(), {});
});

ipcMain.handle('save-default-messages', (event, defaultMessages) => {
  ensureUserMessagesFile(defaultMessages);
  return { path: getMessagesPath() };
});

ipcMain.handle('open-user-config', () => {
  ensureUserMessagesFile();
  shell.showItemInFolder(getMessagesPath());
  return { path: getMessagesPath(), folder: getUserConfigDir() };
});

ipcMain.on('set-always-on-top', (event, alwaysOnTop) => {
  saveSettings({ alwaysOnTop: Boolean(alwaysOnTop) });
});

// ─── App Lifecycle ─────────────────────────────────────────

app.whenReady().then(() => {
  loadSettings();
  createWindow();
  createTray();

  // Notify renderer when window loses focus (to close menu)
  mainWindow.on('blur', () => {
    mainWindow.webContents.send('window-blur');
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow.show();
  }
});
