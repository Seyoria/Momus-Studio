// Tab Switching
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = {
  notch: document.getElementById('tab-content-notch'),
  sound: document.getElementById('tab-content-sound'),
  appearance: document.getElementById('tab-content-appearance'),
  shortcuts: document.getElementById('tab-content-shortcuts'),
  spotlight: document.getElementById('tab-content-spotlight'),
  notifications: document.getElementById('tab-content-notifications')
};
const tabHeading = document.getElementById('tab-heading');
const tabSub = document.getElementById('tab-sub');

const tabTitles = {
  notch: { h: 'Çentik & Pil Ayarları', s: 'Momus Dynamic Island ve çentik ayarları anlık senkronize edilir' },
  sound: { h: 'Ses & Medya Kontrolleri', s: 'Spotify şarkı takibi, oynatma/geçiş kontrolleri ve ses yönetimi' },
  appearance: { h: 'Arayüz & Stil Tercihleri', s: 'Opaklık, yuvarlaklık ve genel görünüm ayarları' },
  shortcuts: { h: 'Klavye Kısayolları & Kontroller', s: 'Momus Island için global tuş kombinasyonları rehberi ve hızlı eylemler' },
  spotlight: { h: 'Spotlight Hızlı Arama Çubuğu', s: 'Alt+Space komut merkezi, canlı matematik hesaplama ve akıllı web yönlendirme' },
  notifications: { h: 'Akıllı Bildirimler & Pil HUD', s: 'Caps Lock ve MagSafe durumlarının hap ve geniş çentikte gösterimi' }
};

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const tabName = item.getAttribute('data-tab');
    navItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    Object.keys(tabPanes).forEach(k => {
      if (tabPanes[k]) {
        if (k === tabName) {
          tabPanes[k].style.display = 'grid';
          tabPanes[k].classList.add('active');
        } else {
          tabPanes[k].style.display = 'none';
          tabPanes[k].classList.remove('active');
        }
      }
    });

    if (tabTitles[tabName]) {
      tabHeading.textContent = tabTitles[tabName].h;
      tabSub.textContent = tabTitles[tabName].s;
    }
  });
});

// Color Palette Dots Interaction
const paletteDots = document.querySelectorAll('.color-palette-dot');
paletteDots.forEach(dot => {
  dot.addEventListener('click', () => {
    paletteDots.forEach(d => d.style.border = 'none');
    dot.style.border = '2px solid #fff';
  });
});

// Shortcut Action Buttons in Settings
const btnTestHide = document.getElementById('btn-test-hide');
const btnTestSpotlight = document.getElementById('btn-test-spotlight');

if (btnTestHide) {
  btnTestHide.addEventListener('click', () => {
    window.momus.toggleHideNotch();
  });
}

if (btnTestSpotlight) {
  btnTestSpotlight.addEventListener('click', () => {
    window.momus.setMode('spotlight');
  });
}

// Mode Controls
const modePillBtn = document.getElementById('mode-pill-btn');
const modeExpandedBtn = document.getElementById('mode-expanded-btn');
const btnToggleNotch = document.getElementById('btn-toggle-notch');
const btnResetAll = document.getElementById('btn-reset-all');

const cfgWidth = document.getElementById('cfg-width');
const cfgHeight = document.getElementById('cfg-height');
const cfgY = document.getElementById('cfg-y');
const cfgX = document.getElementById('cfg-x');
const cfgPillW = document.getElementById('cfg-pill-w');
const cfgPillH = document.getElementById('cfg-pill-h');
const cfgTitle = document.getElementById('cfg-title');
const cfgStatus = document.getElementById('cfg-status');
const cfgRadius = document.getElementById('cfg-radius');
const cfgOpacity = document.getElementById('cfg-opacity');

const valWidth = document.getElementById('val-width');
const valHeight = document.getElementById('val-height');
const valY = document.getElementById('val-y');
const valX = document.getElementById('val-x');
const valPillW = document.getElementById('val-pill-w');
const valPillH = document.getElementById('val-pill-h');
const valRadius = document.getElementById('val-radius');
const valOpacity = document.getElementById('val-opacity');
const simNotch = document.getElementById('sim-notch');

// Sound & Media tab elements
const dashCoverArt = document.getElementById('dash-cover-art');
const dashNpTitle = document.getElementById('dash-np-title');
const dashNpArtist = document.getElementById('dash-np-artist');
const dashBtnPrev = document.getElementById('dash-btn-prev');
const dashBtnPlay = document.getElementById('dash-btn-play');
const dashBtnNext = document.getElementById('dash-btn-next');
const dashVolSlider = document.getElementById('dash-vol-slider');
const dashVolLabel = document.getElementById('dash-vol-label');

let currentMode = 'expanded';

async function init() {
  const cfg = await window.momus.getConfig();
  populate(cfg);
  updateModeUI(cfg.currentMode || 'expanded');

  try {
    const vol = await window.momus.getVolume();
    if (dashVolSlider) dashVolSlider.value = vol;
    if (dashVolLabel) dashVolLabel.textContent = `${vol}%`;
  } catch (e) {}

  try {
    const sp = await window.momus.getSpotifyInfo();
    updateSpotifyDashboard(sp);
  } catch (e) {}

  try {
    const browsers = await window.momus.getInstalledBrowsers();
    renderDetectedBrowsers(browsers);
  } catch (e) {}
}

function renderDetectedBrowsers(browsers) {
  const container = document.getElementById('detected-browsers-list');
  if (!container || !browsers) return;
  container.innerHTML = '';
  browsers.forEach(b => {
    const badge = document.createElement('div');
    badge.style.cssText = 'padding: 5px 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 99px; font-size: 11px; color: #fff; display: flex; align-items: center; gap: 6px;';
    badge.innerHTML = `<span style="width: 6px; height: 6px; border-radius: 50%; background: #22c55e;"></span><span>${b.name}</span>`;
    container.appendChild(badge);
  });
}

function updateModeUI(mode) {
  currentMode = mode;
  if (mode === 'pill') {
    modePillBtn.classList.add('active');
    modeExpandedBtn.classList.remove('active');
    if (simNotch) {
      simNotch.style.width = '140px';
      simNotch.style.height = '34px';
      simNotch.style.borderRadius = '99px';
    }
  } else {
    modeExpandedBtn.classList.add('active');
    modePillBtn.classList.remove('active');
    if (simNotch) {
      simNotch.style.width = '240px';
      simNotch.style.height = '50px';
      simNotch.style.borderRadius = '14px';
    }
  }
}

function populate(cfg) {
  if (!cfg) return;
  cfgWidth.value = cfg.width;
  valWidth.textContent = `${cfg.width}px`;

  cfgHeight.value = cfg.expandedHeight;
  valHeight.textContent = `${cfg.expandedHeight}px`;

  cfgY.value = cfg.yOffset;
  valY.textContent = `${cfg.yOffset}px`;

  cfgX.value = cfg.xOffset;
  valX.textContent = `${cfg.xOffset}px`;

  cfgPillW.value = cfg.pillWidth;
  valPillW.textContent = `${cfg.pillWidth}px`;

  cfgPillH.value = cfg.pillHeight;
  valPillH.textContent = `${cfg.pillHeight}px`;

  cfgTitle.value = cfg.title;
  cfgStatus.value = cfg.statusText;

  if (cfgRadius) {
    cfgRadius.value = cfg.borderRadius;
    valRadius.textContent = `${cfg.borderRadius}px`;
  }
  if (cfgOpacity) {
    cfgOpacity.value = cfg.opacity;
    valOpacity.textContent = `${cfg.opacity}%`;
  }

  // Active search engine button
  const currentEngine = cfg.searchEngine || 'google';
  document.querySelectorAll('.engine-btn').forEach(btn => {
    if (btn.getAttribute('data-engine') === currentEngine) {
      btn.classList.add('active');
      btn.style.borderColor = 'var(--purple-main)';
      btn.style.background = 'rgba(168, 85, 247, 0.15)';
    } else {
      btn.classList.remove('active');
      btn.style.borderColor = '';
      btn.style.background = '';
    }
  });
}

// Engine button click listeners
document.querySelectorAll('.engine-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const engine = btn.getAttribute('data-engine');
    document.querySelectorAll('.engine-btn').forEach(b => {
      b.classList.remove('active');
      b.style.borderColor = '';
      b.style.background = '';
    });
    btn.classList.add('active');
    btn.style.borderColor = 'var(--purple-main)';
    btn.style.background = 'rgba(168, 85, 247, 0.15)';
    window.momus.updateConfig({ searchEngine: engine });
  });
});

function sendConfigUpdate() {
  const update = {
    width: Number(cfgWidth.value),
    expandedHeight: Number(cfgHeight.value),
    yOffset: Number(cfgY.value),
    xOffset: Number(cfgX.value),
    pillWidth: Number(cfgPillW.value),
    pillHeight: Number(cfgPillH.value),
    title: cfgTitle.value,
    statusText: cfgStatus.value,
    borderRadius: cfgRadius ? Number(cfgRadius.value) : 22,
    opacity: cfgOpacity ? Number(cfgOpacity.value) : 98
  };

  valWidth.textContent = `${update.width}px`;
  valHeight.textContent = `${update.expandedHeight}px`;
  valY.textContent = `${update.yOffset}px`;
  valX.textContent = `${update.xOffset}px`;
  valPillW.textContent = `${update.pillWidth}px`;
  valPillH.textContent = `${update.pillHeight}px`;
  if (valRadius) valRadius.textContent = `${update.borderRadius}px`;
  if (valOpacity) valOpacity.textContent = `${update.opacity}%`;

  window.momus.updateConfig(update);
}

[cfgWidth, cfgHeight, cfgY, cfgX, cfgPillW, cfgPillH, cfgRadius, cfgOpacity].forEach(slider => {
  if (slider) slider.addEventListener('input', sendConfigUpdate);
});

[cfgTitle, cfgStatus].forEach(inp => {
  if (inp) inp.addEventListener('input', sendConfigUpdate);
});

modePillBtn.addEventListener('click', () => {
  window.momus.setMode('pill');
  updateModeUI('pill');
});

modeExpandedBtn.addEventListener('click', () => {
  window.momus.setMode('expanded');
  updateModeUI('expanded');
});

btnToggleNotch.addEventListener('click', () => {
  window.momus.toggleMode();
});

btnResetAll.addEventListener('click', async () => {
  const def = await window.momus.resetConfig();
  populate(def);
});

// Media tab actions
if (dashBtnPrev) dashBtnPrev.addEventListener('click', () => window.momus.mediaControl('prev'));
if (dashBtnPlay) dashBtnPlay.addEventListener('click', () => window.momus.mediaControl('playpause'));
if (dashBtnNext) dashBtnNext.addEventListener('click', () => window.momus.mediaControl('next'));

if (dashVolSlider) {
  dashVolSlider.addEventListener('input', async (e) => {
    const v = Number(e.target.value);
    dashVolLabel.textContent = `${v}%`;
    await window.momus.setVolume(v);
  });
}

// Notification & HUD Test buttons
const btnTestNotif = document.getElementById('btn-test-notif');
const btnTestMagsafe = document.getElementById('btn-test-magsafe');

if (btnTestNotif) {
  btnTestNotif.addEventListener('click', () => {
    window.momus.sendTestNotification({
      title: 'Yeni Bir Mesajın Var',
      text: 'Momus Dynamic Island: Mesaj başarıyla iletildi.'
    });
  });
}

if (btnTestMagsafe) {
  btnTestMagsafe.addEventListener('click', () => {
    window.momus.triggerTestCharger();
  });
}

const btnCheckUpdate = document.getElementById('btn-check-update');
const updateStatusText = document.getElementById('update-status-text');
const sidebarUpdateBtn = document.getElementById('sidebar-update-btn');
const sidebarUpdateText = document.getElementById('sidebar-update-text');

async function triggerUpdateCheck() {
  if (updateStatusText) updateStatusText.textContent = 'Güncellemeler denetleniyor...';
  if (sidebarUpdateText) sidebarUpdateText.textContent = 'Denetleniyor...';
  try {
    const res = await window.momus.checkForUpdates();
    if (res.status === 'dev-mode') {
      if (updateStatusText) updateStatusText.textContent = res.message;
      if (sidebarUpdateText) sidebarUpdateText.textContent = 'Geliştirici Modu';
    } else if (res.status === 'success') {
      if (res.updateInfo && res.updateInfo.version) {
        const msg = `Yeni sürüm bulundu: v${res.updateInfo.version}! İndiriliyor...`;
        if (updateStatusText) updateStatusText.textContent = msg;
        if (sidebarUpdateText) sidebarUpdateText.textContent = `v${res.updateInfo.version} İndiriliyor!`;
      } else {
        if (updateStatusText) updateStatusText.textContent = 'En güncel sürümü kullanıyorsunuz (v1.0.0).';
        if (sidebarUpdateText) sidebarUpdateText.textContent = 'v1.0.0 (En Güncel)';
      }
    } else {
      if (updateStatusText) updateStatusText.textContent = res.message || 'Denetim tamamlandı.';
      if (sidebarUpdateText) sidebarUpdateText.textContent = 'Denetim Tamam';
    }
  } catch (e) {
    if (updateStatusText) updateStatusText.textContent = 'Güncelleme kontrolü yapılamadı.';
    if (sidebarUpdateText) sidebarUpdateText.textContent = 'Bağlantı Hatası';
  }
}

if (btnCheckUpdate) {
  btnCheckUpdate.addEventListener('click', triggerUpdateCheck);
}
if (sidebarUpdateBtn) {
  sidebarUpdateBtn.addEventListener('click', triggerUpdateCheck);
}

function updateSpotifyDashboard(sp) {
  if (sp && sp.isPlaying && sp.title) {
    dashNpTitle.textContent = sp.title;
    dashNpArtist.textContent = sp.artist || 'Spotify';
    if (sp.coverArt && dashCoverArt) {
      dashCoverArt.src = sp.coverArt;
    } else if (dashCoverArt) {
      dashCoverArt.src = '../../assets/icon.png';
    }
  } else {
    dashNpTitle.textContent = 'Spotify bekleniyor...';
    dashNpArtist.textContent = 'Sarki actiginizda otomatik baglanacak';
    if (dashCoverArt) dashCoverArt.src = '../../assets/icon.png';
  }
}

window.momus.onNotchMode((data) => {
  updateModeUI(data.mode);
});

init();
