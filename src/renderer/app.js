const notchContainer = document.getElementById('notch-container');
const pillView = document.getElementById('pill-view');
const expandedView = document.getElementById('expanded-view');

const pillTextWrap = document.getElementById('pill-text-wrap');
const pillBrandText = document.getElementById('pill-brand-text');
const pillAudioMini = document.getElementById('pill-audio-mini');
const pillWeatherMini = document.getElementById('pill-weather-mini');
const pillWeatherVal = document.getElementById('pill-weather-val');
const pillProgressTrack = document.getElementById('pill-progress-track');
const pillProgressFill = document.getElementById('pill-progress-fill');
const pillMicDot = document.getElementById('pill-mic-dot');
const pillCamDot = document.getElementById('pill-cam-dot');
const pillDndIcon = document.getElementById('pill-dnd-icon');

const logoBox = document.getElementById('logo-box');
const logoImg = document.getElementById('logo-img');
const titleText = document.getElementById('title-text');
const statusLabel = document.getElementById('status-label');
const liveDot = document.getElementById('live-dot');
const liveSpotifyDot = document.getElementById('live-spotify-dot');
const liveYoutubeDot = document.getElementById('live-youtube-dot');
const pillGreenDot = document.getElementById('pill-green-dot');
const pillSpotifyIcon = document.getElementById('pill-spotify-icon');
const pillYoutubeIcon = document.getElementById('pill-youtube-icon');
const expMicDot = document.getElementById('exp-mic-dot');
const expCamDot = document.getElementById('exp-cam-dot');
const visualizer = document.getElementById('visualizer');
const mediaControlsGroup = document.getElementById('media-controls-group');
const quickAppsGroup = document.getElementById('quick-apps-group');
const spotifyBadge = document.getElementById('spotify-tag-badge');

const btnPrev = document.getElementById('btn-prev');
const btnPlayPause = document.getElementById('btn-playpause');
const btnNext = document.getElementById('btn-next');
const svgPlay = document.getElementById('svg-play');

const battVal = document.getElementById('batt-val');
const weatherText = document.getElementById('weather-text');

const volSlider = document.getElementById('vol-slider');
const volText = document.getElementById('vol-text');
const btnMute = document.getElementById('btn-mute');
const svgVol = document.getElementById('svg-vol');
const svgMute = document.getElementById('svg-mute');
const btnFocus = document.getElementById('btn-focus');
const svgFocusMoon = document.getElementById('svg-focus-moon');
const btnSettings = document.getElementById('btn-settings');
const btnCollapse = document.getElementById('btn-collapse');
const clockBadge = document.getElementById('clock-badge');

// Notification Toast elements
const toastBalloon = document.getElementById('toast-balloon');
const toastTitle = document.getElementById('toast-title');
const toastDesc = document.getElementById('toast-desc');

// Apple Feature elements
const airdropDropzone = document.getElementById('airdrop-dropzone');
const magsafePopup = document.getElementById('magsafe-popup');
const magsafePercent = document.getElementById('magsafe-percent');
const systemHudPopup = document.getElementById('system-hud-popup');
const hudIcon = document.getElementById('hud-icon');
const hudText = document.getElementById('hud-text');

// Quick Apps buttons
const appSpotify = document.getElementById('app-spotify');
const appDiscord = document.getElementById('app-discord');
const appBrowser = document.getElementById('app-browser');
const appExplorer = document.getElementById('app-explorer');

const airdropShelfView = document.getElementById('airdrop-shelf-view');
const airdropSlotsGrid = document.getElementById('airdrop-slots-grid');
const shelfCloseBtn = document.getElementById('shelf-close-btn');
const appAirdropShelf = document.getElementById('app-airdrop-shelf');
const appNotes = document.getElementById('app-notes');

// Quick Notes elements
const notesView = document.getElementById('notes-view');
const notesTextarea = document.getElementById('notes-textarea');
const notesCloseBtn = document.getElementById('notes-close-btn');

// Pill HUD Overlay elements
const pillHudOverlay = document.getElementById('pill-hud-overlay');
const pillHudIcon = document.getElementById('pill-hud-icon');
const pillHudTitle = document.getElementById('pill-hud-title');
const pillHudSub = document.getElementById('pill-hud-sub');

// Spotlight elements
const spotlightView = document.getElementById('spotlight-view');
const spotlightInput = document.getElementById('spotlight-input');
const spotlightCalcBadge = document.getElementById('spotlight-calc-badge');
const spotlightCalcVal = document.getElementById('spotlight-calc-val');
const spotlightCloseBtn = document.getElementById('spotlight-close-btn');

let isMuted = false;
let isPlayingTrack = false;
let toastTimeout = null;
let popupTimeout = null;
let pillHudTimeout = null;
let isAnimatingCollapse = false;
let isFocusActive = false;

function showToast(title, text) {
  // Pill modunda adanın üstünü örten gereksiz bildirim popup'ı TAMAMEN KALDIRILDI
  const isPill = notchContainer.classList.contains('mode-pill');
  if (isPill) return;

  if (toastTimeout) clearTimeout(toastTimeout);
  if (toastTitle) toastTitle.textContent = title;
  if (toastDesc) toastDesc.textContent = text;
  if (toastBalloon) {
    toastBalloon.classList.add('show');
    toastTimeout = setTimeout(() => {
      toastBalloon.classList.remove('show');
    }, 3200);
  }
}

// Dynamic Island HUD Popup (MagSafe, CapsLock) - Volume HUD is DISABLED as requested
function triggerIslandPopup(type, data) {
  if (type === 'volume') return; // SES POPUP'I VE ANİMASYONU TAMAMEN DEVRE DIŞI
  if (popupTimeout) clearTimeout(popupTimeout);
  if (pillHudTimeout) clearTimeout(pillHudTimeout);

  const isPill = notchContainer.classList.contains('mode-pill');

  let iconSvg = '';
  let labelText = '';
  let duration = 2200;

  if (type === 'charger') {
    iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
    labelText = `Şarj: ${data.percent || 100}%`;
    duration = 3000;
  } else if (type === 'capslock') {
    iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/><rect x="4" y="19" width="16" height="2"/></svg>';
    labelText = data.state ? 'CAPS AÇIK' : 'CAPS KAPALI';
    duration = 2000;
  }

  // 1. Show inside compact pill if in pill mode
  if (pillHudOverlay && isPill) {
    pillHudIcon.innerHTML = iconSvg;
    if (pillHudTitle) pillHudTitle.textContent = labelText;
    if (pillHudSub) pillHudSub.style.display = 'none';
    pillHudOverlay.style.display = 'flex';
    pillHudTimeout = setTimeout(() => {
      pillHudOverlay.style.display = 'none';
    }, duration);
  }

  // 2. Show in expanded overlays
  if (type === 'charger') {
    magsafePercent.textContent = `${data.percent || 100}%`;
    magsafePopup.classList.add('show');
    popupTimeout = setTimeout(() => {
      magsafePopup.classList.remove('show');
    }, duration);
  } else {
    hudIcon.innerHTML = iconSvg;
    hudText.textContent = labelText;
    systemHudPopup.classList.add('show');
    popupTimeout = setTimeout(() => {
      systemHudPopup.classList.remove('show');
    }, duration);
  }
}

// Smooth exit animation before collapsing to pill
function collapseSmoothly() {
  if (isAnimatingCollapse) return;
  isAnimatingCollapse = true;
  expandedView.classList.add('collapsing-out');
  setTimeout(() => {
    expandedView.classList.remove('collapsing-out');
    window.momus.setMode('pill');
    isAnimatingCollapse = false;
  }, 220);
}

function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const icons = {
    pdf: '📄', doc: '📝', docx: '📝', txt: '📃',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️',
    mp3: '🎵', wav: '🎵', flac: '🎵', mp4: '🎬', avi: '🎬', mkv: '🎬',
    zip: '📦', rar: '📦', '7z': '📦',
    exe: '⚙️', msi: '⚙️',
  };
  return icons[ext] || '📎';
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function renderSlots() {
  if (!airdropSlotsGrid) return;
  const files = await window.momus.getDroppedFiles();
  airdropSlotsGrid.innerHTML = '';

  const TOTAL_SLOTS = 4;
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const file = (files && files[i]) ? files[i] : null;
    const slotCard = document.createElement('div');

    if (file) {
      const isImg = /\.(png|jpe?g|webp|ico|bmp)$/i.test(file.name);
      slotCard.className = 'slot-card filled-slot';
      slotCard.draggable = true;
      slotCard.innerHTML = `
        <button class="slot-trash-btn">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
        <span class="slot-file-icon">${getFileIcon(file.name)}</span>
        <span class="slot-file-name" title="${file.name}">${file.name}</span>
        <span class="slot-file-size">${formatFileSize(file.size)}</span>
        ${isImg ? `
          <div class="slot-convert-bar">
            <button class="convert-chip" data-format="png" title="PNG yap">PNG</button>
            <button class="convert-chip" data-format="jpg" title="JPG yap">JPG</button>
            <button class="convert-chip" data-format="ico" title="ICO yap">ICO</button>
          </div>
        ` : ''}
      `;

      // Native drag out to Windows Desktop or folders
      slotCard.addEventListener('dragstart', (e) => {
        e.preventDefault();
        window.momus.startDragOut(file.name);
      });

      // Quick Format Converter buttons
      if (isImg) {
        slotCard.querySelectorAll('.convert-chip').forEach(chip => {
          chip.addEventListener('click', async (e) => {
            e.stopPropagation();
            const fmt = chip.getAttribute('data-format');
            const orig = chip.textContent;
            chip.textContent = '...';
            try {
              const res = await window.momus.convertImageFormat(file.path, fmt);
              if (res && res.success) {
                chip.textContent = '✓';
                setTimeout(() => renderSlots(), 600);
              } else {
                chip.textContent = '!';
                setTimeout(() => { chip.textContent = orig; }, 1000);
              }
            } catch (err) {
              chip.textContent = '!';
              setTimeout(() => { chip.textContent = orig; }, 1000);
            }
          });
        });
      }

      // Trash button to remove file
      const trashBtn = slotCard.querySelector('.slot-trash-btn');
      trashBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await window.momus.removeDroppedFile(file.name);
        renderSlots();
      });
    } else {
      slotCard.className = 'slot-card empty-slot';
      slotCard.innerHTML = `
        <div class="slot-empty-icon">+</div>
        <span class="slot-empty-label">Slot ${i + 1} • Boş</span>
      `;
    }

    airdropSlotsGrid.appendChild(slotCard);
  }
}

if (shelfCloseBtn) {
  shelfCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.momus.setMode('pill');
  });
}

// AirDrop Drag and Drop onto Notch
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy';
  }
  if (airdropDropzone) airdropDropzone.classList.add('active');
});

document.addEventListener('dragleave', (e) => {
  if (e.relatedTarget === null && airdropDropzone) {
    airdropDropzone.classList.remove('active');
  }
});

document.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (airdropDropzone) airdropDropzone.classList.remove('active');

  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let fullPath = '';
      if (window.momus && window.momus.getPathForFile) {
        fullPath = window.momus.getPathForFile(file);
      }
      if (!fullPath && file.path) {
        fullPath = file.path;
      }
      await window.momus.fileDropped({ name: file.name, path: fullPath });
    }
    window.momus.setMode('airdrop');
    renderSlots();
    showToast('AirDrop Başarılı', `${files.length} dosya yuvaya eklendi.`);
  }
});

// App Launch Listeners
if (appSpotify) appSpotify.addEventListener('click', (e) => { e.stopPropagation(); window.momus.launchApp('spotify'); });
if (appDiscord) appDiscord.addEventListener('click', (e) => { e.stopPropagation(); window.momus.launchApp('discord'); });
if (appBrowser) appBrowser.addEventListener('click', (e) => { e.stopPropagation(); window.momus.launchApp('browser'); });
if (appExplorer) appExplorer.addEventListener('click', (e) => { e.stopPropagation(); window.momus.launchApp('explorer'); });
if (appAirdropShelf) appAirdropShelf.addEventListener('click', (e) => { e.stopPropagation(); window.momus.setMode('airdrop'); });
if (appNotes) appNotes.addEventListener('click', async (e) => {
  e.stopPropagation();
  window.momus.setMode('notes');
  if (notesTextarea) {
    const saved = await window.momus.getQuickNote();
    notesTextarea.value = saved || '';
    setTimeout(() => notesTextarea.focus(), 100);
  }
});

if (notesCloseBtn) {
  notesCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.momus.setMode('pill');
  });
}

if (notesTextarea) {
  let noteDebounce = null;
  notesTextarea.addEventListener('input', (e) => {
    if (noteDebounce) clearTimeout(noteDebounce);
    noteDebounce = setTimeout(() => {
      window.momus.saveQuickNote(e.target.value);
    }, 400);
  });
}

// Apple Focus / DND Mode
btnFocus.addEventListener('click', async (e) => {
  e.stopPropagation();
  isFocusActive = await window.momus.toggleFocusMode();
  updateFocusUI(isFocusActive);
});

function updateFocusUI(active) {
  isFocusActive = active;
  if (active) {
    btnFocus.classList.add('active-focus');
    svgFocusMoon.style.fill = '#a855f7';
    if (pillDndIcon) pillDndIcon.style.display = 'flex';
  } else {
    btnFocus.classList.remove('active-focus');
    svgFocusMoon.style.fill = 'none';
    if (pillDndIcon) pillDndIcon.style.display = 'none';
  }
}

function updateClock() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (clockBadge) clockBadge.textContent = `${hh}:${mm}`;
}

async function init() {
  if (notchContainer) {
    notchContainer.classList.add('notch-launch-drop');
    setTimeout(() => {
      notchContainer.classList.remove('notch-launch-drop');
    }, 950);
  }
  updateClock();
  setInterval(updateClock, 1000);

  const cfg = await window.momus.getConfig();
  applyConfig(cfg);
  setMode(cfg.currentMode || 'expanded');
  updateFocusUI(cfg.focusMode || false);

  try {
    const vol = await window.momus.getVolume();
    const muted = await window.momus.getMute();
    volSlider.value = vol;
    volText.textContent = `${vol}%`;
    isMuted = muted;
    updateMuteIcons(muted);
  } catch (err) {}

  try {
    const sp = await window.momus.getSpotifyInfo();
    handleSpotifyData(sp);
  } catch (err) {}

  try {
    const weather = await window.momus.getWeatherInfo();
    handleWeatherData(weather);
  } catch (err) {}

  try {
    const metrics = await window.momus.getSystemMetrics();
    const privacy = await window.momus.getPrivacyStatus();
    handleSystemData({ metrics, privacy });
  } catch (err) {}

  renderSlots();
}

// Dynamic Color Extractor from Spotify Cover Art
let lastExtractedCover = null;

function extractDominantColor(imgUrl) {
  if (!imgUrl) {
    resetThemeColor();
    return;
  }
  if (imgUrl === lastExtractedCover) return;
  lastExtractedCover = imgUrl;

  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    try {
      const canvas = document.getElementById('color-extractor-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 64, 64);
      ctx.drawImage(img, 0, 0, 64, 64);
      const imgData = ctx.getImageData(0, 0, 64, 64).data;

      let bestR = 168, bestG = 85, bestB = 247;
      let maxScore = -1;

      for (let i = 0; i < imgData.length; i += 16) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const a = imgData[i + 3];
        if (a < 128) continue;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const brightness = (r + g + b) / 3;

        // Skip dull or too dark/light colors
        if (brightness < 45 || brightness > 225 || saturation < 0.25) continue;

        const score = saturation * 2 + (brightness / 255);
        if (score > maxScore) {
          maxScore = score;
          bestR = r;
          bestG = g;
          bestB = b;
        }
      }

      applyDynamicColor(bestR, bestG, bestB);
    } catch (e) {
      resetThemeColor();
    }
  };
  img.onerror = () => resetThemeColor();
  img.src = imgUrl;
}

function applyDynamicColor(r, g, b) {
  const color = `rgb(${r}, ${g}, ${b})`;
  const glow = `rgba(${r}, ${g}, ${b}, 0.45)`;
  document.documentElement.style.setProperty('--purple-main', color);
  document.documentElement.style.setProperty('--purple-glow', glow);
}

function resetThemeColor() {
  lastExtractedCover = null;
  document.documentElement.style.setProperty('--purple-main', '#a855f7');
  document.documentElement.style.setProperty('--purple-glow', 'rgba(168, 85, 247, 0.4)');
}

function setMode(mode) {
  const wasPill = notchContainer.classList.contains('mode-pill');
  notchContainer.classList.remove('mode-pill', 'mode-expanded', 'mode-spotlight', 'mode-airdrop', 'mode-notes', 'mode-hidden');
  notchContainer.classList.remove('stealth-out', 'stealth-in');

  if (mode === 'pill') {
    notchContainer.classList.add('mode-pill');
  } else if (mode === 'spotlight') {
    notchContainer.classList.add('mode-spotlight');
    if (spotlightInput) {
      spotlightInput.value = '';
      if (spotlightCalcBadge) spotlightCalcBadge.style.display = 'none';
      setTimeout(() => spotlightInput.focus(), 80);
    }
  } else if (mode === 'airdrop') {
    notchContainer.classList.add('mode-airdrop');
    renderSlots();
  } else if (mode === 'notes') {
    notchContainer.classList.add('mode-notes');
  } else if (mode === 'hidden') {
    notchContainer.classList.add('mode-hidden');
  } else {
    notchContainer.classList.add('mode-expanded');
    renderSlots();
  }
}

function applyConfig(cfg) {
  if (!cfg) return;
  if (!isPlayingTrack) {
    if (cfg.title && titleText) titleText.textContent = cfg.title;
    if (statusLabel) statusLabel.textContent = 'Sistem Aktif';
  }
}

function updateMuteIcons(muted) {
  if (muted) {
    svgVol.style.display = 'none';
    svgMute.style.display = 'block';
  } else {
    svgVol.style.display = 'block';
    svgMute.style.display = 'none';
  }
}

function handleWeatherData(weather) {
  if (weather && weather.temp) {
    if (weatherText) weatherText.textContent = `${weather.temp}°C`;
    if (pillWeatherVal) pillWeatherVal.textContent = `${weather.temp}°`;
  }
}

// Smooth music progress bar in pill mode — synced with song changes
let currentProgressSec = 0;
let simulatedDuration = 210;
let progressInterval = null;
let lastTrackedSongKey = null;

function startProgressSimulation() {
  // Build a unique key for the current song to detect changes
  const songKey = currentSpotifyState
    ? `${currentSpotifyState.artist || ''}-${currentSpotifyState.title || ''}`
    : null;

  // If the song changed, reset the counter
  if (songKey && songKey !== lastTrackedSongKey) {
    lastTrackedSongKey = songKey;
    currentProgressSec = 0;
    simulatedDuration = 210; // ~3.5 min average
  }

  // Don't recreate the interval if one is already ticking
  if (progressInterval) return;

  if (pillProgressTrack) pillProgressTrack.style.display = 'block';
  progressInterval = setInterval(() => {
    if (!isPlayingTrack) {
      clearInterval(progressInterval);
      progressInterval = null;
      if (pillProgressTrack) pillProgressTrack.style.display = 'none';
      if (pillProgressFill) pillProgressFill.style.width = '0%';
      return;
    }
    currentProgressSec += 1;
    if (currentProgressSec >= simulatedDuration) {
      currentProgressSec = simulatedDuration;
      // Track may have ended or switched, check Spotify immediately
      if (window.momus && window.momus.getSpotifyInfo) {
        window.momus.getSpotifyInfo().then(sp => {
          if (sp) handleSpotifyData(sp);
        }).catch(() => {});
      }
    }
    const pct = Math.min(100, Math.round((currentProgressSec / simulatedDuration) * 100));
    if (pillProgressFill) pillProgressFill.style.width = `${pct}%`;
  }, 1000);
}

function stopProgressSimulation() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  if (pillProgressTrack) pillProgressTrack.style.display = 'none';
  if (pillProgressFill) pillProgressFill.style.width = '0%';
  lastTrackedSongKey = null;
  currentProgressSec = 0;
}

let currentSpotifyState = null;
let currentYouTubeState = { active: false, title: '' };
let isSpotifyExiting = false;

function updatePillText(text) {
  if (!pillBrandText) return;
  pillBrandText.textContent = text;
  pillBrandText.title = text;
  pillBrandText.classList.remove('marquee-scroll');
  pillBrandText.style.transform = '';
  pillBrandText.style.transition = '';
}

function updateStatusUI() {
  if (isSpotifyExiting) return;
  const isSpotify = currentSpotifyState && currentSpotifyState.isPlaying && currentSpotifyState.title;
  const isYouTube = currentYouTubeState && currentYouTubeState.active;

  if (isSpotify) {
    if (pillGreenDot) pillGreenDot.style.display = 'none';
    if (pillSpotifyIcon) pillSpotifyIcon.style.display = 'flex';
    if (pillYoutubeIcon) pillYoutubeIcon.style.display = 'none';

    if (liveDot) liveDot.style.display = 'none';
    if (liveSpotifyDot) liveSpotifyDot.style.display = 'flex';
    if (liveYoutubeDot) liveYoutubeDot.style.display = 'none';

    if (statusLabel) statusLabel.textContent = currentSpotifyState.artist || 'Spotify';
    if (titleText) titleText.textContent = currentSpotifyState.title;
    if (spotifyBadge) spotifyBadge.style.display = 'inline-block';

    updatePillText(currentSpotifyState.title || 'momus', true);
  } else if (isYouTube) {
    // YouTube sekmesine girildiginde: cevrimici muhabbeti YouTube logosuna donusur!
    if (pillGreenDot) pillGreenDot.style.display = 'none';
    if (pillSpotifyIcon) pillSpotifyIcon.style.display = 'none';
    if (pillYoutubeIcon) pillYoutubeIcon.style.display = 'flex';

    if (liveDot) liveDot.style.display = 'none';
    if (liveSpotifyDot) liveSpotifyDot.style.display = 'none';
    if (liveYoutubeDot) liveYoutubeDot.style.display = 'flex';

    if (statusLabel) statusLabel.textContent = currentYouTubeState.title || 'YouTube Açık';
    if (titleText) titleText.textContent = 'momus';
    if (spotifyBadge) spotifyBadge.style.display = 'none';

    updatePillText(currentYouTubeState.title ? currentYouTubeState.title.slice(0, 30) : 'YouTube', true);
  } else {
    if (pillGreenDot) pillGreenDot.style.display = 'block';
    if (pillSpotifyIcon) pillSpotifyIcon.style.display = 'none';
    if (pillYoutubeIcon) pillYoutubeIcon.style.display = 'none';

    if (liveDot) {
      liveDot.style.display = 'inline-block';
      liveDot.style.background = '#22c55e';
      liveDot.style.boxShadow = '0 0 5px rgba(34, 197, 94, 0.6)';
    }
    if (liveSpotifyDot) liveSpotifyDot.style.display = 'none';
    if (liveYoutubeDot) liveYoutubeDot.style.display = 'none';

    if (statusLabel) statusLabel.textContent = 'Sistem Aktif';
    if (titleText) titleText.textContent = 'momus';
    if (spotifyBadge) spotifyBadge.style.display = 'none';

    updatePillText('momus', false);
  }
}

function handleSpotifyData(sp) {
  const prevState = currentSpotifyState;
  currentSpotifyState = sp;

  if (sp && sp.isPlaying && sp.title) {
    // Detect if transitioning FROM no-music → music
    const wasStopped = !prevState || !prevState.isPlaying;
    const songChanged = prevState && prevState.title !== sp.title;

    if (sp.duration && sp.duration > 30) {
      simulatedDuration = sp.duration;
    }

    isPlayingTrack = true;
    if (mediaControlsGroup) mediaControlsGroup.style.display = 'flex';
    if (visualizer) visualizer.style.display = 'flex';
    if (quickAppsGroup) quickAppsGroup.style.display = 'none';

    if (pillAudioMini) pillAudioMini.style.display = 'flex';
    if (pillWeatherMini) pillWeatherMini.style.display = 'none';

    if (sp.coverArt) {
      logoImg.onerror = () => {
        logoImg.src = '../../assets/icon.png';
      };
      // Crossfade album art on song change
      if (songChanged || wasStopped) {
        logoImg.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        logoImg.style.opacity = '0';
        logoImg.style.transform = 'scale(0.8) rotate(-4deg)';
        setTimeout(() => {
          logoImg.src = sp.coverArt;
          logoImg.style.opacity = '1';
          logoImg.style.transform = 'scale(1) rotate(0deg)';
        }, 180);
      } else {
        logoImg.src = sp.coverArt;
      }
      extractDominantColor(sp.coverArt);
    } else {
      logoImg.src = '../../assets/icon.png';
      resetThemeColor();
    }

    svgPlay.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

    // Fade in text on song change
    if ((songChanged || wasStopped) && titleText) {
      titleText.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      titleText.style.opacity = '0';
      titleText.style.transform = 'translateX(8px)';
      setTimeout(() => {
        titleText.style.opacity = '1';
        titleText.style.transform = 'translateX(0)';
      }, 150);
    }

    // Fade in pill brand text on song change, then clear inline transform so marquee can work
    if ((songChanged || wasStopped) && pillBrandText) {
      pillBrandText.classList.remove('marquee-scroll');
      pillBrandText.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      pillBrandText.style.opacity = '0';
      pillBrandText.style.transform = 'translateX(6px)';
      setTimeout(() => {
        pillBrandText.style.opacity = '1';
        pillBrandText.style.transform = '';
      }, 200);
    }

    startProgressSimulation();
    updateStatusUI();
  } else {
    // Transitioning from playing → stopped: fade out gracefully
    const wasPlaying = prevState && prevState.isPlaying;
    isPlayingTrack = false;
    resetThemeColor();
    svgPlay.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    stopProgressSimulation();

    if (wasPlaying) {
      isSpotifyExiting = true;

      // 1. Crossfade Logo/Album art
      if (logoImg) {
        logoImg.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        logoImg.style.opacity = '0';
        logoImg.style.transform = 'scale(0.85)';
        setTimeout(() => {
          logoImg.src = '../../assets/icon.png';
          logoImg.style.opacity = '1';
          logoImg.style.transform = 'scale(1)';
        }, 220);
      }

      // 2. Shrink Spotify icon in pill
      if (pillSpotifyIcon && pillSpotifyIcon.style.display !== 'none') {
        pillSpotifyIcon.classList.add('spotify-exit-shrink');
      }

      // 3. Smooth fade out media controls & audio bars
      if (mediaControlsGroup) {
        mediaControlsGroup.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        mediaControlsGroup.style.opacity = '0';
        mediaControlsGroup.style.transform = 'scale(0.92)';
      }
      if (visualizer) {
        visualizer.style.transition = 'opacity 0.25s ease';
        visualizer.style.opacity = '0';
      }
      if (pillAudioMini) {
        pillAudioMini.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        pillAudioMini.style.opacity = '0';
        pillAudioMini.style.transform = 'scale(0.8)';
      }

      // 4. Fade out texts
      if (titleText) {
        titleText.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        titleText.style.opacity = '0';
        titleText.style.transform = 'translateY(-3px)';
      }
      if (statusLabel) {
        statusLabel.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        statusLabel.style.opacity = '0';
        statusLabel.style.transform = 'translateY(-3px)';
      }
      if (pillBrandText) {
        pillBrandText.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        pillBrandText.style.opacity = '0';
        pillBrandText.style.transform = 'translateY(-3px)';
      }

      setTimeout(() => {
        isSpotifyExiting = false;
        if (pillSpotifyIcon) {
          pillSpotifyIcon.classList.remove('spotify-exit-shrink');
          pillSpotifyIcon.style.display = 'none';
        }

        updateStatusUI();

        if (pillGreenDot) {
          pillGreenDot.classList.add('bloom-in');
          setTimeout(() => pillGreenDot.classList.remove('bloom-in'), 500);
        }

        if (pillAudioMini) {
          pillAudioMini.style.display = 'none';
          pillAudioMini.style.opacity = '1';
          pillAudioMini.style.transform = 'none';
        }
        if (pillWeatherMini) {
          pillWeatherMini.style.display = 'flex';
          pillWeatherMini.style.opacity = '0';
          pillWeatherMini.style.transition = 'opacity 0.3s ease';
          setTimeout(() => { pillWeatherMini.style.opacity = '1'; }, 20);
        }

        if (mediaControlsGroup) {
          mediaControlsGroup.style.display = 'none';
          mediaControlsGroup.style.opacity = '1';
          mediaControlsGroup.style.transform = 'none';
        }
        if (visualizer) {
          visualizer.style.display = 'none';
          visualizer.style.opacity = '1';
        }
        if (quickAppsGroup) {
          quickAppsGroup.style.display = 'flex';
          quickAppsGroup.style.opacity = '0';
          quickAppsGroup.style.transform = 'translateY(4px)';
          quickAppsGroup.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
          setTimeout(() => {
            quickAppsGroup.style.opacity = '1';
            quickAppsGroup.style.transform = 'translateY(0)';
          }, 20);
        }

        if (titleText) {
          titleText.style.opacity = '1';
          titleText.style.transform = 'translateY(0)';
        }
        if (statusLabel) {
          statusLabel.style.opacity = '1';
          statusLabel.style.transform = 'translateY(0)';
        }
        if (pillBrandText) {
          pillBrandText.style.opacity = '1';
          pillBrandText.style.transform = '';
          pillBrandText.style.transition = '';
        }
      }, 260);

    } else {
      if (logoImg) logoImg.src = '../../assets/icon.png';
      if (mediaControlsGroup) mediaControlsGroup.style.display = 'none';
      if (visualizer) visualizer.style.display = 'none';
      if (quickAppsGroup) quickAppsGroup.style.display = 'flex';
      if (pillAudioMini) pillAudioMini.style.display = 'none';
      if (pillWeatherMini) pillWeatherMini.style.display = 'flex';
      updateStatusUI();
    }
  }
}

function handleYouTubeData(yt) {
  const prevYT = currentYouTubeState;
  currentYouTubeState = yt || { active: false, title: '' };

  const wasActive = prevYT && prevYT.active;
  const isNowActive = currentYouTubeState.active;

  if (wasActive && !isNowActive) {
    // Exiting YouTube!
    if (pillYoutubeIcon && pillYoutubeIcon.style.display !== 'none') {
      pillYoutubeIcon.classList.add('spotify-exit-shrink');
      setTimeout(() => {
        pillYoutubeIcon.classList.remove('spotify-exit-shrink');
        pillYoutubeIcon.style.display = 'none';
        updateStatusUI();
        if (pillGreenDot) {
          pillGreenDot.classList.add('bloom-in');
          setTimeout(() => pillGreenDot.classList.remove('bloom-in'), 500);
        }
      }, 250);
    } else {
      updateStatusUI();
    }
    return;
  }

  // YouTube just became active → fade in brand text and trigger notification
  if (isNowActive && !wasActive) {
    if (pillBrandText) {
      pillBrandText.classList.remove('marquee-scroll');
      pillBrandText.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      pillBrandText.style.opacity = '0';
      pillBrandText.style.transform = 'translateX(6px)';
      setTimeout(() => {
        pillBrandText.style.opacity = '1';
        pillBrandText.style.transform = '';
      }, 200);
    }
  }

  updateStatusUI();
}

function handleSystemData(data) {
  if (!data) return;
  const { metrics, privacy, weather } = data;

  if (weather) {
    handleWeatherData(weather);
  }

  if (metrics) {
    const valStr = metrics.hasBattery ? `${metrics.battery}%` : 'AC';
    if (battVal) battVal.textContent = valStr;
  }

  if (privacy) {
    const micDisplay = privacy.mic ? 'inline-block' : 'none';
    if (pillMicDot) pillMicDot.style.display = micDisplay;
    if (expMicDot) expMicDot.style.display = micDisplay;

    const camDisplay = privacy.camera ? 'inline-block' : 'none';
    if (pillCamDot) pillCamDot.style.display = camDisplay;
    if (expCamDot) expCamDot.style.display = camDisplay;
  }
}

// Media Controls (Skip / Play / Pause)
btnPrev.addEventListener('click', (e) => {
  e.stopPropagation();
  currentProgressSec = 0;
  lastTrackedSongKey = null;
  if (pillProgressFill) pillProgressFill.style.width = '0%';
  window.momus.mediaControl('prev');
});

btnPlayPause.addEventListener('click', (e) => {
  e.stopPropagation();
  window.momus.mediaControl('playpause');
});

btnNext.addEventListener('click', (e) => {
  e.stopPropagation();
  currentProgressSec = 0;
  lastTrackedSongKey = null;
  if (pillProgressFill) pillProgressFill.style.width = '0%';
  window.momus.mediaControl('next');
});

// Click pill -> expand
pillView.addEventListener('click', () => {
  window.momus.setMode('expanded');
});

// Click collapse button -> smooth collapse
btnCollapse.addEventListener('click', (e) => {
  e.stopPropagation();
  collapseSmoothly();
});

// Esc key -> smooth collapse
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    collapseSmoothly();
  }
});

// Volume
volSlider.addEventListener('input', async (e) => {
  const val = Number(e.target.value);
  volText.textContent = `${val}%`;
  await window.momus.setVolume(val);
});

// Mute
btnMute.addEventListener('click', async (e) => {
  e.stopPropagation();
  isMuted = await window.momus.toggleMute();
  updateMuteIcons(isMuted);
});

// Settings button
btnSettings.addEventListener('click', (e) => {
  e.stopPropagation();
  window.momus.openSettings();
});

// Listeners
window.momus.onNotchMode((data) => {
  setMode(data.mode);
  if (data.config) applyConfig(data.config);
});

window.momus.onConfigUpdated((cfg) => {
  applyConfig(cfg);
});

window.momus.onSpotifyUpdate((data) => {
  handleSpotifyData(data);
});

window.momus.onYouTubeUpdate((data) => {
  handleYouTubeData(data);
});

window.momus.onSystemUpdate((data) => {
  handleSystemData(data);
});

window.momus.onShowToast((data) => {
  showToast(data.title, data.text);
});

window.momus.onIslandPopup((data) => {
  triggerIslandPopup(data.type, data.data);
});

window.momus.onFocusModeChange((active) => {
  updateFocusUI(active);
});

window.momus.onBrandFadeCollapse(() => {
  if (titleText) {
    titleText.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    titleText.style.opacity = '0';
    titleText.style.transform = 'translateY(-4px)';
    setTimeout(() => {
      titleText.style.opacity = '1';
      titleText.style.transform = 'translateY(0)';
    }, 500);
  }
  if (pillBrandText) {
    pillBrandText.style.transition = 'opacity 0.3s ease';
    pillBrandText.style.opacity = '0';
    setTimeout(() => {
      pillBrandText.style.opacity = '1';
    }, 500);
  }
});

// Stealth mode (Ctrl+Shift+M) animations
window.momus.onNotchDisappear(() => {
  notchContainer.classList.add('stealth-out');
});

window.momus.onNotchAppear(() => {
  notchContainer.classList.remove('stealth-out');
  notchContainer.classList.add('stealth-in');
  setTimeout(() => notchContainer.classList.remove('stealth-in'), 360);
});

// Spotlight Math Evaluator & Search
function evaluateMath(expr) {
  try {
    const sanitized = expr.replace(/[^0-9+\-*/().%^ ]/g, '');
    if (!sanitized || !sanitized.trim()) return null;
    if (/^[\d\s+\-*/().%^]+$/.test(sanitized)) {
      const res = Function(`"use strict"; return (${sanitized})`)();
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        return Math.round(res * 1000) / 1000;
      }
    }
  } catch (e) {}
  return null;
}

if (spotlightInput) {
  spotlightInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    const result = evaluateMath(val);
    if (result !== null && /[+\-*/]/.test(val)) {
      spotlightCalcVal.textContent = result;
      spotlightCalcBadge.style.display = 'flex';
    } else {
      spotlightCalcBadge.style.display = 'none';
    }
  });

  spotlightInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const val = spotlightInput.value.trim();
      const calcResult = evaluateMath(val);
      if (calcResult !== null && /[+\-*/]/.test(val)) {
        navigator.clipboard.writeText(String(calcResult));
        showToast('Hesap Sonucu', `${val} = ${calcResult} (Panoya kopyalandı)`);
        window.momus.setMode('pill');
      } else if (val) {
        await window.momus.performSpotlightSearch(val);
      }
    } else if (e.key === 'Escape') {
      window.momus.setMode('pill');
    }
  });
}

if (spotlightCloseBtn) {
  spotlightCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.momus.setMode('pill');
  });
}

init();
