const { app, BrowserWindow, globalShortcut, ipcMain, screen, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile, exec } = require('child_process');
let autoUpdater;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (e) {
  autoUpdater = null;
}

let si;
try {
  si = require('systeminformation');
} catch (e) {
  si = null;
}

// Hardware & GPU stability switches
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu-cache');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disk-cache-size', '0');

let loudness;
try {
  loudness = require('loudness');
} catch (e) {
  loudness = null;
}

let notchWindow = null;
let settingsWindow = null;
let tray = null;

const iconPathPng = path.join(__dirname, '..', '..', 'assets', 'icon.png');
const iconPathIco = path.join(__dirname, '..', '..', 'assets', 'icon.ico');
const mediaControlExe = path.join(__dirname, 'MediaControl.exe');

// Stored AirDrop style dropped files
const dropDir = path.join(app.getPath('userData'), 'AirDrop');
if (!fs.existsSync(dropDir)) {
  try { fs.mkdirSync(dropDir, { recursive: true }); } catch (e) {}
}

// Stored Quick Note
const noteFile = path.join(app.getPath('userData'), 'quick-note.txt');

// Config file path
const configPath = path.join(app.getPath('userData'), 'config.json');

const defaultConfig = {
  width: 460,
  expandedHeight: 220,
  pillWidth: 190,
  pillHeight: 38,
  yOffset: 6,
  xOffset: 0,
  opacity: 98,
  borderRadius: 22,
  title: 'momus',
  statusText: 'Aktif',
  theme: 'dark',
  alwaysOnTop: true,
  state: 'pill',
  focusMode: false,
  searchEngine: 'google',
  autoLaunch: true
};

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { ...defaultConfig, ...data };
    }
  } catch (err) {}
  return { ...defaultConfig };
}

function saveConfig(cfg) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (err) {}
}

function applyAutoLaunch(enabled) {
  try {
    const isAuto = enabled !== false;
    if (app.isPackaged) {
      app.setLoginItemSettings({
        openAtLogin: isAuto,
        openAsHidden: false,
        path: process.execPath
      });
    } else {
      app.setLoginItemSettings({
        openAtLogin: isAuto
      });
    }
  } catch (err) {
    console.warn('[AutoLaunch] Error applying login item settings:', err);
  }
}

let userConfig = loadConfig();
let currentState = userConfig.state || 'expanded';
let focusModeActive = userConfig.focusMode || false;

// Media Control via MediaControl.exe
function triggerMedia(action) {
  if (fs.existsSync(mediaControlExe)) {
    execFile(mediaControlExe, [action], (err) => {
      if (err) console.error('Media command error:', err);
    });
  }
}

// Spotify album art & track duration cache
let cachedTrackMeta = null;
let lastSongKey = null;

async function fetchSpotifyTrackMeta(artist, title) {
  if (!artist || !title) return { coverArt: null, duration: 210 };
  const cleanTitle = title.replace(/\(feat\..*?\)/i, '').replace(/\[feat\..*?\]/i, '').trim();
  const key = `${artist}-${cleanTitle}`.toLowerCase();
  if (key === lastSongKey && cachedTrackMeta) return cachedTrackMeta;

  let coverArt = null;
  let duration = 210;

  // 1. Deezer API (Fastest and highest match rate for Turkish / International songs)
  try {
    const q = encodeURIComponent(`${artist} ${cleanTitle}`);
    const res = await fetch(`https://api.deezer.com/search?q=${q}&limit=3`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        if (data.data[0].album && data.data[0].album.cover_medium) {
          coverArt = data.data[0].album.cover_medium;
        }
        if (data.data[0].duration && data.data[0].duration > 30) {
          duration = data.data[0].duration;
        }
        if (coverArt) {
          lastSongKey = key;
          cachedTrackMeta = { coverArt, duration };
          return cachedTrackMeta;
        }
      }
    }
  } catch (e) {}

  // 2. iTunes API with TR Store fallback
  try {
    const q = encodeURIComponent(`${cleanTitle} ${artist}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=3&country=TR`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        if (data.results[0].artworkUrl100) {
          coverArt = data.results[0].artworkUrl100.replace('100x100bb', '300x300bb');
        }
        if (data.results[0].trackTimeMillis) {
          duration = Math.round(data.results[0].trackTimeMillis / 1000);
        }
      }
    }
  } catch (e) {}

  lastSongKey = key;
  cachedTrackMeta = { coverArt, duration };
  return cachedTrackMeta;
}

// Spotify Info Poller with UTF-8 encoding
function getSpotifyTrackInfo() {
  return new Promise((resolve) => {
    const psCmd = `powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Process -Name Spotify -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -ne '' -and $_.MainWindowTitle -ne 'Spotify' -and $_.MainWindowTitle -ne 'Spotify Free' -and $_.MainWindowTitle -ne 'Spotify Premium' } | Select-Object -First 1 -ExpandProperty MainWindowTitle"`;
    exec(psCmd, { encoding: 'utf8' }, async (error, stdout) => {
      if (!error && stdout && stdout.trim()) {
        const titleStr = stdout.trim();
        const parts = titleStr.split(' - ');
        let artist = 'Spotify';
        let title = titleStr;
        if (parts.length >= 2) {
          artist = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        }

        const meta = await fetchSpotifyTrackMeta(artist, title);

        resolve({
          artist,
          title,
          isPlaying: true,
          coverArt: meta.coverArt,
          duration: meta.duration
        });
        return;
      }
      resolve({ artist: null, title: null, isPlaying: false, coverArt: null, duration: 210 });
    });
  });
}

// YouTube Info Poller (detects active YouTube tab/video in any browser)
function getYouTubeInfo() {
  return new Promise((resolve) => {
    const psCmd = `powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Process | Where-Object { $_.MainWindowTitle -match '(?i)youtube' } | Select-Object -First 1 -ExpandProperty MainWindowTitle"`;
    exec(psCmd, { encoding: 'utf8' }, (error, stdout) => {
      if (!error && stdout && stdout.trim()) {
        const fullTitle = stdout.trim();
        let clean = fullTitle.replace(/ - (Google Chrome|Microsoft Edge|Brave|Firefox|Opera|Vivaldi).*$/i, '').replace(/ - YouTube$/i, '').trim();
        if (!clean || clean.toLowerCase() === 'youtube') clean = 'YouTube';
        resolve({ active: true, title: clean });
      } else {
        resolve({ active: false, title: '' });
      }
    });
  });
}

// Live Weather Info Fetcher
let cachedWeather = null;
let lastWeatherFetch = 0;

async function getWeatherInfo() {
  const now = Date.now();
  if (cachedWeather && now - lastWeatherFetch < 600000) {
    return cachedWeather;
  }
  try {
    const res = await fetch('https://wttr.in/?format=j1', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const d = await res.json();
      const cur = d.current_condition[0];
      const city = d.nearest_area[0].areaName[0].value;
      const desc = cur.weatherDesc[0].value;
      const temp = cur.temp_C;
      cachedWeather = { temp, desc, city };
      lastWeatherFetch = now;
      return cachedWeather;
    }
  } catch (e) {}
  return cachedWeather || { temp: '22', desc: 'Güneşli', city: '' };
}

// System Hardware Info (Battery & Charging event)
let previousChargingState = null;

async function getSystemMetrics() {
  if (!si) {
    return { battery: 100, isCharging: false, hasBattery: false, cpu: 0, ram: 0 };
  }
  try {
    const [batt, load, mem] = await Promise.all([
      si.battery().catch(() => ({})),
      si.currentLoad().catch(() => ({})),
      si.mem().catch(() => ({}))
    ]);
    const isCharging = batt.isCharging || false;
    const percent = Math.round(batt.percent || 100);

    // Detect Charging plugged in event -> Trigger MagSafe popup
    if (previousChargingState !== null && previousChargingState === false && isCharging === true) {
      triggerPopup('charger', { percent });
    }
    previousChargingState = isCharging;

    const cpuUsage = Math.round(load.currentLoad || 0);
    const ramUsage = mem.total ? Math.round(((mem.active || (mem.total - mem.available)) / mem.total) * 100) : 0;

    return {
      battery: percent,
      isCharging,
      hasBattery: batt.hasBattery || false,
      cpu: cpuUsage,
      ram: ramUsage
    };
  } catch (e) {
    return { battery: 100, isCharging: false, hasBattery: false, cpu: 0, ram: 0 };
  }
}

// CapsLock state poller
let capsLockInitialized = false;
let previousCapsLock = false;
function checkCapsLock() {
  exec('powershell -NoProfile -Command "[System.Console]::CapsLock"', { encoding: 'utf8' }, (err, stdout) => {
    if (!err && stdout) {
      const isCaps = stdout.trim() === 'True';
      if (!capsLockInitialized) {
        previousCapsLock = isCaps;
        capsLockInitialized = true;
        return;
      }
      if (isCaps !== previousCapsLock) {
        previousCapsLock = isCaps;
        triggerPopup('capslock', { state: isCaps });
      }
    }
  });
}

// Microphone & Webcam Privacy Indicator Check
function getPrivacyStatus() {
  return new Promise((resolve) => {
    const psCmd = `powershell -NoProfile -Command "
$micActive = (Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone\\*' -ErrorAction SilentlyContinue | Where-Object { $_.LastUsedTimeStop -eq 0 -and $_.LastUsedTimeStart -gt 0 }).Count -gt 0;
$camActive = (Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam\\*' -ErrorAction SilentlyContinue | Where-Object { $_.LastUsedTimeStop -eq 0 -and $_.LastUsedTimeStart -gt 0 }).Count -gt 0;
Write-Output ($micActive.ToString() + ';' + $camActive.ToString())
"`;
    exec(psCmd, (error, stdout) => {
      if (!error && stdout && stdout.trim()) {
        const parts = stdout.trim().split(';');
        resolve({
          mic: parts[0] === 'True',
          camera: parts[1] === 'True'
        });
        return;
      }
      resolve({ mic: false, camera: false });
    });
  });
}

function getWindowBounds(state = currentState) {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;

  let targetW, targetH;
  if (state === 'pill') {
    targetW = userConfig.pillWidth || 160;
    targetH = userConfig.pillHeight || 38;
  } else if (state === 'spotlight') {
    targetW = 560;
    targetH = 68;
  } else if (state === 'airdrop') {
    targetW = Math.max(480, userConfig.width || 460);
    targetH = Math.max(220, userConfig.expandedHeight || 220);
  } else if (state === 'notes') {
    targetW = Math.max(460, userConfig.width || 460);
    targetH = 240;
  } else if (state === 'hidden') {
    targetW = userConfig.pillWidth || 160;
    targetH = userConfig.pillHeight || 38;
  } else {
    targetW = userConfig.width || 460;
    targetH = Math.max(220, userConfig.expandedHeight || 220);
  }

  const x = Math.round((screenWidth - targetW) / 2) + (userConfig.xOffset || 0);
  const y = Math.max(0, userConfig.yOffset || 0);

  return { x, y, width: targetW, height: targetH };
}

function createNotchWindow() {
  const bounds = getWindowBounds(currentState);

  notchWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    hasShadow: false,
    focusable: true,
    icon: fs.existsSync(iconPathPng) ? iconPathPng : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  notchWindow.setAlwaysOnTop(true, 'screen-saver');
  notchWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  notchWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  notchWindow.once('ready-to-show', () => {
    notchWindow.show();
    notchWindow.focus();
    notchWindow.webContents.send('notch-mode', {
      mode: currentState,
      config: userConfig
    });
  });

  notchWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      setNotchMode('pill');
    }
  });

  // Click outside (blur) closes expanded notch back to compact pill
  notchWindow.on('blur', () => {
    if (currentState === 'expanded') {
      setNotchMode('pill');
    }
  });

  screen.on('display-metrics-changed', () => {
    if (notchWindow && !notchWindow.isDestroyed()) {
      const newBounds = getWindowBounds(currentState);
      notchWindow.setBounds(newBounds);
    }
  });
}

function createSettingsWindow() {
  if (settingsWindow) {
    if (settingsWindow.isMinimized()) settingsWindow.restore();
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;

  settingsWindow = new BrowserWindow({
    width: Math.min(1280, screenW - 60),
    height: Math.min(840, screenH - 60),
    minWidth: 900,
    minHeight: 600,
    x: Math.round((screenW - Math.min(1280, screenW - 60)) / 2),
    y: Math.round((screenH - Math.min(840, screenH - 60)) / 2),
    title: 'Momus Studio Dashboard',
    autoHideMenuBar: true,
    frame: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    backgroundColor: '#07070a',
    icon: fs.existsSync(iconPathPng) ? iconPathPng : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  settingsWindow.setMenu(null);

  settingsWindow.loadFile(path.join(__dirname, '..', 'settings', 'index.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

let lastVisibleState = 'pill';

function setNotchMode(newMode) {
  if (!notchWindow || notchWindow.isDestroyed()) return;

  if (newMode === 'hidden') {
    // Animate disappearance before hiding window
    notchWindow.webContents.send('notch-disappear');
    currentState = 'hidden';
    setTimeout(() => {
      if (notchWindow && !notchWindow.isDestroyed() && currentState === 'hidden') {
        notchWindow.hide();
      }
    }, 280);
    return;
  }

  // If restoring from hidden
  if (currentState === 'hidden') {
    notchWindow.show();
    notchWindow.webContents.send('notch-appear');
  }

  if (newMode !== 'spotlight') {
    lastVisibleState = newMode;
  }

  currentState = newMode;
  userConfig.state = newMode;
  saveConfig(userConfig);

  const bounds = getWindowBounds(newMode);
  notchWindow.setBounds(bounds);
  notchWindow.setAlwaysOnTop(true, 'screen-saver');
  notchWindow.show();
  notchWindow.focus();

  notchWindow.webContents.send('notch-mode', {
    mode: newMode,
    config: userConfig
  });

  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('notch-mode', {
      mode: newMode,
      config: userConfig
    });
  }
}

function toggleHideNotch() {
  if (currentState === 'hidden') {
    setNotchMode(lastVisibleState || 'pill');
  } else {
    lastVisibleState = currentState;
    setNotchMode('hidden');
  }
}

function applyConfigToNotch() {
  if (!notchWindow || notchWindow.isDestroyed()) return;
  const bounds = getWindowBounds(currentState);
  notchWindow.setBounds(bounds);
  notchWindow.webContents.send('config-updated', userConfig);
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('config-updated', userConfig);
  }
}

function createTray() {
  let trayImg;
  try {
    trayImg = nativeImage.createFromPath(iconPathPng).resize({ width: 16, height: 16 });
  } catch (e) {
    trayImg = nativeImage.createEmpty();
  }

  tray = new Tray(trayImg);
  tray.setToolTip('Momus Studio');

  const menu = Menu.buildFromTemplate([
    { label: 'Momus Panelini Ac', click: createSettingsWindow },
    {
      label: 'Guncellemeleri Denetle',
      click: () => {
        if (autoUpdater && app.isPackaged) {
          triggerNotification('Guncelleme Denetleniyor', 'GitHub Releases kontrol ediliyor...');
          autoUpdater.checkForUpdatesAndNotify().catch(() => {});
        } else {
          triggerNotification('Momus Studio', 'Geliştirici modu veya en güncel sürüm (v1.1.0) aktif.');
        }
      }
    },
    { type: 'separator' },
    { label: 'Spotlight Arama (Alt+Space)', click: () => setNotchMode(currentState === 'spotlight' ? 'pill' : 'spotlight') },
    { label: 'Centigi Gizle / Goster (Ctrl+Shift+M)', click: () => toggleHideNotch() },
    { type: 'separator' },
    { label: 'Pili Genislet (Alt+M)', click: () => setNotchMode('expanded') },
    { label: 'Pili Kucult', click: () => setNotchMode('pill') },
    {
      label: focusModeActive ? 'Odak Modu (DND): Acik' : 'Odak Modu (DND): Kapali',
      click: () => toggleFocusMode()
    },
    { type: 'separator' },
    {
      label: 'Cikis',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(menu);
  tray.on('click', () => {
    setNotchMode(currentState === 'pill' ? 'expanded' : 'pill');
  });
}

function toggleFocusMode() {
  focusModeActive = !focusModeActive;
  userConfig.focusMode = focusModeActive;
  saveConfig(userConfig);
  triggerNotification(
    focusModeActive ? 'Odak Modu Açık' : 'Odak Modu Kapalı',
    focusModeActive ? 'Bildirimler sessize alındı (DND)' : 'Tüm bildirimler aktif'
  );
  if (notchWindow && !notchWindow.isDestroyed()) {
    notchWindow.webContents.send('focus-mode-change', focusModeActive);
  }
  createTray();
}

// Trigger simulated toast notification on notch (checks DND)
function triggerNotification(title, text) {
  if (focusModeActive && title !== 'Odak Modu Açık' && title !== 'Odak Modu Kapalı') {
    return; // Don't show notifications during Focus / DND
  }
  if (notchWindow && !notchWindow.isDestroyed()) {
    notchWindow.webContents.send('show-toast', { title, text });
  }
}

// Trigger Dynamic Island popup (charger, capslock, volume)
function triggerPopup(type, data) {
  if (notchWindow && !notchWindow.isDestroyed()) {
    notchWindow.webContents.send('island-popup', { type, data });
  }
}

// IPC Handlers
ipcMain.handle('get-config', () => ({ ...userConfig, currentMode: currentState, focusMode: focusModeActive }));

ipcMain.handle('update-config', (_, newConfig) => {
  userConfig = { ...userConfig, ...newConfig };
  saveConfig(userConfig);
  applyConfigToNotch();
  return userConfig;
});

ipcMain.handle('reset-config', () => {
  userConfig = { ...defaultConfig };
  saveConfig(userConfig);
  applyAutoLaunch(userConfig.autoLaunch !== false);
  applyConfigToNotch();
  return userConfig;
});

ipcMain.handle('get-auto-launch', () => {
  try {
    const s = app.getLoginItemSettings();
    return s.openAtLogin;
  } catch (e) {
    return userConfig.autoLaunch !== false;
  }
});

ipcMain.handle('set-auto-launch', (_, enabled) => {
  userConfig.autoLaunch = !!enabled;
  saveConfig(userConfig);
  applyAutoLaunch(userConfig.autoLaunch);
  return userConfig.autoLaunch;
});

ipcMain.handle('set-mode', (_, mode) => {
  setNotchMode(mode);
});

ipcMain.handle('toggle-mode', () => {
  setNotchMode(currentState === 'pill' ? 'expanded' : 'pill');
});

ipcMain.handle('toggle-focus-mode', () => {
  toggleFocusMode();
  return focusModeActive;
});

ipcMain.handle('media-control', (_, action) => {
  triggerMedia(action);
  // Re-poll Spotify quickly so UI updates without waiting for the 2-second cycle
  setTimeout(async () => {
    try {
      const spInfo = await getSpotifyTrackInfo();
      if (notchWindow && !notchWindow.isDestroyed()) {
        notchWindow.webContents.send('spotify-update', spInfo);
      }
    } catch (e) {}
  }, 400);
  setTimeout(async () => {
    try {
      const spInfo = await getSpotifyTrackInfo();
      if (notchWindow && !notchWindow.isDestroyed()) {
        notchWindow.webContents.send('spotify-update', spInfo);
      }
    } catch (e) {}
  }, 1200);
});

ipcMain.handle('get-spotify-info', async () => {
  return await getSpotifyTrackInfo();
});

ipcMain.handle('get-weather-info', async () => {
  return await getWeatherInfo();
});

ipcMain.handle('get-system-metrics', async () => {
  return await getSystemMetrics();
});

ipcMain.handle('get-privacy-status', async () => {
  return await getPrivacyStatus();
});

ipcMain.handle('launch-app', (_, target) => {
  if (target === 'spotify') shell.openExternal('spotify:');
  else if (target === 'discord') shell.openExternal('discord:');
  else if (target === 'browser') shell.openExternal('https://google.com');
  else if (target === 'explorer') exec('explorer');
  else if (target === 'snip') exec('explorer ms-screenclip:');
});

ipcMain.handle('file-dropped', (_, { name, path: filePath }) => {
  try {
    if (!fs.existsSync(dropDir)) {
      fs.mkdirSync(dropDir, { recursive: true });
    }
    const cleanName = path.basename(name || filePath || 'dosya');
    const dest = path.join(dropDir, cleanName);
    if (filePath && fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, dest);
    } else {
      fs.writeFileSync(dest, `AirDrop File: ${cleanName}`);
    }
    return { success: true, fileName: cleanName, dest };
  } catch (e) {
    console.error('AirDrop error:', e);
    return { success: false };
  }
});

// Drag & Drop Instant Image Format Converter (.png, .jpg, .ico, .bmp, .gif)
ipcMain.handle('convert-image-format', async (_, { filePath, targetFormat }) => {
  if (!filePath || !fs.existsSync(filePath)) return { success: false, error: 'Dosya bulunamadı' };
  try {
    const parsed = path.parse(filePath);
    const ext = targetFormat.toLowerCase().replace('.', '');
    const outFileName = `${parsed.name}.${ext}`;
    const outPath = path.join(dropDir, outFileName);

    let formatNet = 'Png';
    if (ext === 'jpg' || ext === 'jpeg') formatNet = 'Jpeg';
    else if (ext === 'ico') formatNet = 'Icon';
    else if (ext === 'bmp') formatNet = 'Bmp';
    else if (ext === 'gif') formatNet = 'Gif';

    const safeIn = filePath.replace(/'/g, "''");
    const safeOut = outPath.replace(/'/g, "''");

    const psCmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.Drawing; $img = [System.Drawing.Bitmap]::FromFile('${safeIn}'); $img.Save('${safeOut}', [System.Drawing.Imaging.ImageFormat]::${formatNet}); $img.Dispose();"`;

    await new Promise((resolve, reject) => {
      exec(psCmd, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return { success: true, outPath, outFileName };
  } catch (e) {
    console.error('Convert format error:', e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('get-dropped-files', () => {
  try {
    const files = fs.readdirSync(dropDir).map(name => ({
      name,
      path: path.join(dropDir, name),
      size: fs.statSync(path.join(dropDir, name)).size
    }));
    return files;
  } catch (e) { return []; }
});

ipcMain.handle('remove-dropped-file', (_, fileName) => {
  try {
    const filePath = path.join(dropDir, fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return true;
  } catch (e) { return false; }
});

ipcMain.handle('start-drag-out', (_, fileName) => {
  const filePath = path.join(dropDir, fileName);
  if (fs.existsSync(filePath) && notchWindow && !notchWindow.isDestroyed()) {
    notchWindow.webContents.startDrag({
      file: filePath,
      icon: fs.existsSync(iconPathPng) ? nativeImage.createFromPath(iconPathPng).resize({ width: 32, height: 32 }) : nativeImage.createEmpty()
    });
  }
});

ipcMain.handle('get-quick-note', () => {
  try {
    if (fs.existsSync(noteFile)) {
      return fs.readFileSync(noteFile, 'utf8');
    }
  } catch (e) {}
  return '';
});

ipcMain.handle('save-quick-note', (_, content) => {
  try {
    fs.writeFileSync(noteFile, content || '', 'utf8');
    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('open-airdrop-folder', () => {
  shell.openPath(dropDir);
});

ipcMain.handle('send-test-notification', (_, { title, text }) => {
  triggerNotification(title, text);
});

ipcMain.handle('trigger-test-charger', () => {
  triggerPopup('charger', { percent: 100 });
});

ipcMain.handle('get-volume', async () => {
  if (!loudness) return 50;
  try {
    return await loudness.getVolume();
  } catch (e) {
    return 50;
  }
});

ipcMain.handle('set-volume', async (_, vol) => {
  if (!loudness) return false;
  try {
    await loudness.setVolume(Math.round(vol));
    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('get-mute', async () => {
  if (!loudness) return false;
  try {
    return await loudness.getMuted();
  } catch (e) {
    return false;
  }
});

ipcMain.handle('toggle-mute', async () => {
  if (!loudness) return false;
  try {
    const muted = await loudness.getMuted();
    await loudness.setMuted(!muted);
    return !muted;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('open-settings', () => {
  createSettingsWindow();
});

ipcMain.handle('toggle-hide-notch', () => {
  toggleHideNotch();
  return currentState;
});

ipcMain.handle('get-installed-browsers', () => {
  return new Promise((resolve) => {
    exec('reg query HKLM\\SOFTWARE\\Clients\\StartMenuInternet', (err, stdout) => {
      const found = [];
      if (!err && stdout) {
        const lines = stdout.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.includes('Google Chrome')) found.push({ id: 'chrome', name: 'Google Chrome', engine: 'google' });
          else if (trimmed.includes('Microsoft Edge')) found.push({ id: 'edge', name: 'Microsoft Edge', engine: 'bing' });
          else if (trimmed.includes('Firefox')) found.push({ id: 'firefox', name: 'Mozilla Firefox', engine: 'google' });
          else if (trimmed.includes('Brave')) found.push({ id: 'brave', name: 'Brave Browser', engine: 'brave' });
          else if (trimmed.includes('Opera')) found.push({ id: 'opera', name: 'Opera Browser', engine: 'google' });
          else if (trimmed.includes('Vivaldi')) found.push({ id: 'vivaldi', name: 'Vivaldi Browser', engine: 'duckduckgo' });
        }
      }
      if (found.length === 0) {
        found.push({ id: 'chrome', name: 'Google Chrome', engine: 'google' });
        found.push({ id: 'edge', name: 'Microsoft Edge', engine: 'bing' });
      }
      resolve(found);
    });
  });
});

ipcMain.handle('perform-spotlight-search', (_, query) => {
  if (!query || !query.trim()) return false;
  const q = query.trim();
  if (q.startsWith('http://') || q.startsWith('https://')) {
    shell.openExternal(q);
  } else if (q.includes('.') && !q.includes(' ') && !q.endsWith('.')) {
    shell.openExternal(`https://${q}`);
  } else {
    const engine = (userConfig.searchEngine || 'google').toLowerCase();
    let url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    if (engine === 'duckduckgo') {
      url = `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
    } else if (engine === 'bing') {
      url = `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
    } else if (engine === 'brave') {
      url = `https://search.brave.com/search?q=${encodeURIComponent(q)}`;
    } else if (engine === 'yandex') {
      url = `https://yandex.com.tr/search/?text=${encodeURIComponent(q)}`;
    }
    shell.openExternal(url);
  }
  setNotchMode('pill');
  return true;
});

// Auto-Updater setup for GitHub Releases
function setupAutoUpdater() {
  if (!autoUpdater) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Güncellemeler kontrol ediliyor...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Yeni sürüm bulundu:', info.version);
    triggerNotification('Yeni Sürüm Mevcut', `v${info.version} indiriliyor...`);
    if (notchWindow && !notchWindow.isDestroyed()) {
      notchWindow.webContents.send('update-available', info);
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdater] Uygulama güncel.');
  });

  autoUpdater.on('error', (err) => {
    console.warn('[AutoUpdater] Güncelleme uyarısı:', err ? err.message : err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`[AutoUpdater] İndirme: %${Math.round(progressObj.percent)}`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Güncelleme indirildi:', info.version);
    triggerNotification('Güncelleme Hazır', `v${info.version} indirildi. Yeniden başlatıldığında kurulacak.`);
    if (notchWindow && !notchWindow.isDestroyed()) {
      notchWindow.webContents.send('update-downloaded', info);
    }
  });

  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.warn('[AutoUpdater] İlk kontrol uyarısı:', err ? err.message : err);
      });
    }, 6000);
  }
}

ipcMain.handle('check-for-updates', async () => {
  if (!autoUpdater) return { status: 'error', message: 'AutoUpdater modülü yüklenemedi.' };
  if (!app.isPackaged) {
    return { status: 'dev-mode', message: 'Geliştirici modundasınız. Güncelleme denetimi GitHub Releases üzerinden derlenmiş (.exe) sürümde çalışır.' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { status: 'success', updateInfo: result ? result.updateInfo : null };
  } catch (err) {
    return { status: 'error', message: err ? err.message : 'Güncelleme denetlenemedi.' };
  }
});

ipcMain.handle('install-update', () => {
  if (autoUpdater) {
    autoUpdater.quitAndInstall();
  }
});

// Game / Fullscreen Detection (Auto-Hide Notch when a game is active)
const fullscreenDetectorExe = path.join(__dirname, 'FullscreenDetector.exe');
let gameModeAutoHidden = false;

function checkGameFullscreen() {
  if (!fs.existsSync(fullscreenDetectorExe)) return;
  execFile(fullscreenDetectorExe, (err, stdout) => {
    if (err) return;
    const res = stdout ? stdout.trim().toLowerCase() : '';
    if (res === 'game') {
      if (currentState !== 'hidden' && !gameModeAutoHidden) {
        gameModeAutoHidden = true;
        setNotchMode('hidden');
      }
    } else {
      if (gameModeAutoHidden) {
        gameModeAutoHidden = false;
        setNotchMode(lastVisibleState || 'pill');
      }
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  applyAutoLaunch(userConfig.autoLaunch !== false);
  createNotchWindow();
  createTray();
  createSettingsWindow();
  setupAutoUpdater();

  // Automatic Game Fullscreen Detection (every 1.5s)
  setInterval(checkGameFullscreen, 1500);

  try {
    globalShortcut.register('Alt+M', () => {
      if (currentState === 'expanded') {
        if (notchWindow && !notchWindow.isDestroyed()) {
          notchWindow.webContents.send('brand-fade-collapse');
        }
        setTimeout(() => setNotchMode('pill'), 300);
      } else {
        setNotchMode('expanded');
      }
    });
  } catch (e) {}

  // Ctrl+Shift+M: Completely Hide / Restore Notch
  try {
    globalShortcut.register('CommandOrControl+Shift+M', () => {
      toggleHideNotch();
    });
  } catch (e) {}

  // Alt+Space: Open / Close Spotlight Search
  try {
    globalShortcut.register('Alt+Space', () => {
      if (currentState === 'spotlight') {
        setNotchMode(lastVisibleState || 'pill');
      } else {
        setNotchMode('spotlight');
      }
    });
  } catch (e) {}

  try {
    globalShortcut.register('Escape', () => {
      if (currentState === 'expanded' || currentState === 'spotlight' || currentState === 'airdrop' || currentState === 'notes') {
        setNotchMode('pill');
      }
    });
  } catch (e) {}

  // Periodic Spotify Polling (every 2s)
  setInterval(async () => {
    const spInfo = await getSpotifyTrackInfo();
    if (notchWindow && !notchWindow.isDestroyed()) {
      notchWindow.webContents.send('spotify-update', spInfo);
    }
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('spotify-update', spInfo);
    }
  }, 2000);

  // Periodic YouTube Polling (every 2s)
  setInterval(async () => {
    const ytInfo = await getYouTubeInfo();
    if (notchWindow && !notchWindow.isDestroyed()) {
      notchWindow.webContents.send('youtube-update', ytInfo);
    }
  }, 2000);

  // Periodic Hardware & Privacy Polling (every 2.5s)
  setInterval(async () => {
    const [metrics, privacy, weather] = await Promise.all([
      getSystemMetrics(),
      getPrivacyStatus(),
      getWeatherInfo()
    ]);
    if (notchWindow && !notchWindow.isDestroyed()) {
      notchWindow.webContents.send('system-update', { metrics, privacy, weather });
    }
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('system-update', { metrics, privacy, weather });
    }
  }, 2500);

  // Check CapsLock every 1s
  setInterval(checkCapsLock, 1000);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});
