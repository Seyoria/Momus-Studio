const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('momus', {
  // File Path helper for Electron 28+ Drag-and-Drop
  getPathForFile: (file) => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file);
      }
    } catch (e) {}
    return file.path || '';
  },

  // Config
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (cfg) => ipcRenderer.invoke('update-config', cfg),
  resetConfig: () => ipcRenderer.invoke('reset-config'),

  // Modes
  setMode: (mode) => ipcRenderer.invoke('set-mode', mode),
  toggleMode: () => ipcRenderer.invoke('toggle-mode'),
  toggleFocusMode: () => ipcRenderer.invoke('toggle-focus-mode'),

  // Media & Spotify
  mediaControl: (act) => ipcRenderer.invoke('media-control', act),
  getSpotifyInfo: () => ipcRenderer.invoke('get-spotify-info'),

  // Weather & Hardware & Privacy
  getWeatherInfo: () => ipcRenderer.invoke('get-weather-info'),
  getSystemMetrics: () => ipcRenderer.invoke('get-system-metrics'),
  getPrivacyStatus: () => ipcRenderer.invoke('get-privacy-status'),

  // Shortcuts & Notifications & AirDrop
  launchApp: (target) => ipcRenderer.invoke('launch-app', target),
  fileDropped: (info) => ipcRenderer.invoke('file-dropped', info),
  openAirDropFolder: () => ipcRenderer.invoke('open-airdrop-folder'),
  getDroppedFiles: () => ipcRenderer.invoke('get-dropped-files'),
  removeDroppedFile: (name) => ipcRenderer.invoke('remove-dropped-file', name),
  startDragOut: (name) => ipcRenderer.invoke('start-drag-out', name),
  sendTestNotification: (payload) => ipcRenderer.invoke('send-test-notification', payload),
  triggerTestCharger: () => ipcRenderer.invoke('trigger-test-charger'),

  // Quick Notes
  getQuickNote: () => ipcRenderer.invoke('get-quick-note'),
  saveQuickNote: (txt) => ipcRenderer.invoke('save-quick-note', txt),

  // Sound
  getVolume: () => ipcRenderer.invoke('get-volume'),
  setVolume: (v) => ipcRenderer.invoke('set-volume', v),
  getMute: () => ipcRenderer.invoke('get-mute'),
  toggleMute: () => ipcRenderer.invoke('toggle-mute'),

  // Window & System
  openSettings: () => ipcRenderer.invoke('open-settings'),
  toggleHideNotch: () => ipcRenderer.invoke('toggle-hide-notch'),
  performSpotlightSearch: (q) => ipcRenderer.invoke('perform-spotlight-search', q),
  getInstalledBrowsers: () => ipcRenderer.invoke('get-installed-browsers'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),

  // Listeners
  onNotchMode: (cb) => ipcRenderer.on('notch-mode', (_, data) => cb(data)),
  onConfigUpdated: (cb) => ipcRenderer.on('config-updated', (_, data) => cb(data)),
  onSpotifyUpdate: (cb) => ipcRenderer.on('spotify-update', (_, data) => cb(data)),
  onYouTubeUpdate: (cb) => ipcRenderer.on('youtube-update', (_, data) => cb(data)),
  onSystemUpdate: (cb) => ipcRenderer.on('system-update', (_, data) => cb(data)),
  onShowToast: (cb) => ipcRenderer.on('show-toast', (_, data) => cb(data)),
  onIslandPopup: (cb) => ipcRenderer.on('island-popup', (_, data) => cb(data)),
  onFocusModeChange: (cb) => ipcRenderer.on('focus-mode-change', (_, data) => cb(data)),
  onBrandFadeCollapse: (cb) => ipcRenderer.on('brand-fade-collapse', () => cb()),
  onNotchDisappear: (cb) => ipcRenderer.on('notch-disappear', () => cb()),
  onNotchAppear: (cb) => ipcRenderer.on('notch-appear', () => cb())
});
