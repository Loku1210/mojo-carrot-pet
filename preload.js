const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  // Move the window by a delta (for drag / wander)
  moveWindow: (deltaX, deltaY) => {
    ipcRenderer.send('move-window', deltaX, deltaY);
  },

  // Get the current window position
  getWindowPosition: () => {
    return ipcRenderer.invoke('get-window-position');
  },

  // Get screen dimensions for wander/edge bounds
  getScreenSize: () => {
    return ipcRenderer.invoke('get-screen-size');
  },

  // Reset window to default position
  resetPosition: () => {
    ipcRenderer.send('reset-position');
  },

  // Load and save persistent user settings
  loadSettings: () => {
    return ipcRenderer.invoke('load-settings');
  },
  saveSettings: (settings) => {
    return ipcRenderer.invoke('save-settings', settings);
  },

  // Resize window (for scale changes)
  resizeWindow: (width, height) => {
    ipcRenderer.send('resize-window', width, height);
  },

  setAlwaysOnTop: (alwaysOnTop) => {
    ipcRenderer.send('set-always-on-top', alwaysOnTop);
  },

  // Hide window (for context menu "hide" option)
  hideWindow: () => {
    ipcRenderer.send('hide-window');
  },

  // Set whether transparent areas should ignore mouse events
  setIgnoreMouse: (ignore, options) => {
    ipcRenderer.send('set-ignore-mouse', ignore, options);
  },

  // Native drag (main-process cursor tracking, works across all monitors)
  dragStart: () => {
    ipcRenderer.send('drag-start');
  },
  dragEnd: () => {
    ipcRenderer.send('drag-end');
  },
  onDragMove: (callback) => {
    ipcRenderer.on('drag-move', (event, dx, dy) => callback(dx, dy));
  },

  // Listen for window blur (to close context menu)
  onWindowBlur: (callback) => {
    ipcRenderer.on('window-blur', () => callback());
  },

  // User-editable message config lives in app userData, not packaged source.
  loadUserMessages: () => {
    return ipcRenderer.invoke('load-user-messages');
  },
  saveDefaultMessages: (messages) => {
    return ipcRenderer.invoke('save-default-messages', messages);
  },
  openUserConfig: () => {
    return ipcRenderer.invoke('open-user-config');
  }
});
