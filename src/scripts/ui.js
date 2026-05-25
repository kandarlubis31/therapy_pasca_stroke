// src/scripts/ui.js
import { speakText, TTS } from "./tts.js";
import { openCamera, closeCamera } from "./camera.js";
import { addProgress, updateProgress } from "./progress.js";

/* ── SETTINGS POPUP ─────────────────────── */
export function setupSettings() {
  const btn = document.getElementById("btnSettings");
  const popup = document.getElementById("settingsPopup");
  if (!btn || !popup) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    popup.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target) && e.target !== btn) {
      popup.classList.remove("open");
    }
  });
}

/* ── TEMA, AKSESIBILITAS & FONT ──────────── */
export function setupModeAndAccessibility() {
  const savedMode = localStorage.getItem("appMode") || "adult";
  setMode(savedMode);

  const savedContrast = localStorage.getItem("highContrast") === "true";
  if (savedContrast) toggleContrast(true);

  const ls = localStorage.getItem("lsVal") || "0";
  const lh = localStorage.getItem("lhVal") || "0";
  const fs = localStorage.getItem("fsVal") || "16"; // Ukuran font dasar
  
  updateLetterSpacing(ls);
  updateLineHeight(lh);
  updateFontSize(fs);

  const lsSlider = document.getElementById("letterSpacingSlider");
  const lhSlider = document.getElementById("lineHeightSlider");
  const fsSlider = document.getElementById("fontSizeSlider");
  
  if (lsSlider) lsSlider.value = ls;
  if (lhSlider) lhSlider.value = lh;
  if (fsSlider) fsSlider.value = fs;
}

export function setMode(mode) {
  localStorage.setItem("appMode", mode);
  const html = document.documentElement;
  const btnAdult = document.getElementById("btnModeAdult");
  const btnChild = document.getElementById("btnModeChild");

  if (mode === "child") {
    html.classList.add("mode-child");
    btnAdult?.classList.remove("active");
    btnChild?.classList.add("active");
  } else {
    html.classList.remove("mode-child");
    btnChild?.classList.remove("active");
    btnAdult?.classList.add("active");
  }
}

export function toggleContrast(forceState) {
  const html = document.documentElement;
  const isHigh = forceState !== undefined ? forceState : !html.classList.contains("high-contrast");
  html.classList.toggle("high-contrast", isHigh);
  localStorage.setItem("highContrast", String(isHigh));

  const pill = document.getElementById("contrastPill");
  if (pill) {
    pill.textContent = isHigh ? "ON" : "OFF";
    pill.classList.toggle("on", isHigh);
  }
}

export function updateLetterSpacing(val) {
  document.documentElement.style.setProperty("--ls-extra", `${val * 0.05}em`);
  localStorage.setItem("lsVal", val);
  const label = document.getElementById("lsVal");
  if (label) label.textContent = val == 0 ? "Normal" : `+${val}`;
}

export function updateLineHeight(val) {
  document.documentElement.style.setProperty("--lh-extra", `${val * 0.1}`);
  localStorage.setItem("lhVal", val);
  const label = document.getElementById("lhVal");
  if (label) label.textContent = val == 0 ? "Normal" : `+${val}`;
}

export function updateFontSize(val) {
  document.documentElement.style.setProperty("--base-font-size", `${val}px`);
  localStorage.setItem("fsVal", val);
  const label = document.getElementById("fsVal");
  if (label) {
     if(val == 16) label.textContent = "Normal";
     else if(val < 16) label.textContent = "Kecil";
     else label.textContent = "Besar";
  }
}

/* ── TABS ───────────────────────────────── */
export function showTab(tabId) {
  document.querySelectorAll(".tab-content").forEach((el) => {
      el.classList.remove("active");
      el.style.display = "none";
  });
  document.querySelectorAll(".tab-item").forEach((btn) => btn.classList.remove("active"));

  const target = document.getElementById(tabId);
  if(target) {
      target.style.display = "block";
      // Delay kecil untuk CSS transition
      setTimeout(() => target.classList.add("active"), 20);
  }
  
  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add("active");

  if (tabId === "vokalTab") {
    openCamera();
  } else {
    closeCamera();
  }

  if (tabId !== "breathTab" && isBreathing) {
    toggleBreath();
  }
}

/* ── FULLSCREEN ─────────────────────────── */
let fsMode = false;
let fsCurrentText = "";
let fsCurrentId = "";
let fsIndex = 0;
let fsList = [];

export function isFsMode() { return fsMode; }

export function toggleFsMode() {
  fsMode = !fsMode;
  document.querySelectorAll(".btn-fs-toggle").forEach((btn) => {
    btn.classList.toggle("active", fsMode);
    const label = btn.querySelector(".btn-fs-label");
    if (label) label.textContent = fsMode ? "Mode Aktif" : "Mode Penuh";
  });
}

export function cardTap(text, id, type) {
  if ("vibrate" in navigator) navigator.vibrate(50);
  if (fsMode) {
    let list;
    const content = __getContentData();
    if (type === "number") list = content.NUMBERS;
    else if (type === "alphabet") list = content.ALPHABET;
    else if (type === "vokal") list = content.VOKAL;
    else return;

    const idx = list.findIndex((i) => i.id === id);
    if (idx !== -1) openFs(list, idx);
  } else {
    playTTS(text, id, type);
  }
}

export function cardTapCustom(text, id) {
  const decodedText = decodeURIComponent(text);
  if ("vibrate" in navigator) navigator.vibrate(50);
  playTTS(decodedText, id, "custom");
}

function openFs(list, idx) {
  fsList = list;
  fsIndex = Math.max(0, Math.min(idx, list.length - 1));
  document.getElementById("fsOverlay")?.classList.add("show");
  renderFs();
  fsPlaySound();
}

function renderFs() {
  const item = fsList[fsIndex];
  if (!item) return;
  fsCurrentText = item.text;
  fsCurrentId = item.id;

  const charEl = document.getElementById("fsChar");
  const labelEl = document.getElementById("fsLabel");
  const counterEl = document.getElementById("fsCounter");
  const prevBtn = document.getElementById("fsPrevBtn");
  const nextBtn = document.getElementById("fsNextBtn");
  const mouthImg = document.getElementById("fsMouthImg");

  if (charEl) charEl.textContent = item.text;
  if (labelEl) labelEl.textContent = isNaN(Number(item.text)) ? "Huruf" : "Angka";
  if (counterEl) counterEl.textContent = `${fsIndex + 1} / ${fsList.length}`;
  if (prevBtn) prevBtn.disabled = fsIndex === 0;
  if (nextBtn) nextBtn.disabled = fsIndex === fsList.length - 1;

  if (mouthImg) {
    const vowels = ["A", "I", "U", "E", "O"];
    if (vowels.includes(item.text.toUpperCase())) {
      mouthImg.src = `/mouth/${item.text.toLowerCase()}.png`;
      mouthImg.classList.add("show");
    } else {
      mouthImg.classList.remove("show");
      mouthImg.src = "";
    }
  }
}

export function nextFs() {
  if (fsIndex < fsList.length - 1) {
    fsIndex++;
    renderFs();
    fsPlaySound();
  }
}

export function prevFs() {
  if (fsIndex > 0) {
    fsIndex--;
    renderFs();
    fsPlaySound();
  }
}

export function closeFullscreen() {
  document.getElementById("fsOverlay")?.classList.remove("show");
  if (TTS.synth.speaking) TTS.synth.cancel();
}

export function fsPlaySound() {
  speakText(fsList[fsIndex]?.text ?? fsCurrentText, "id-ID");
  addProgress("alphabet");
  updateProgress();
}

/* ── BREATHING ───────────────────────────── */
let breathInterval = null;
let isBreathing = false;

export function toggleBreath() {
  const btn = document.getElementById("btnBreath");
  const circle = document.getElementById("breathCircle");
  const text = document.getElementById("breathText");
  if (!btn || !circle || !text) return;

  isBreathing = !isBreathing;

  if (isBreathing) {
    btn.textContent = "Berhenti";
    btn.style.backgroundColor = "var(--primary-dark)";
    runBreathCycle(circle, text);
    breathInterval = setInterval(() => runBreathCycle(circle, text), 12000);
  } else {
    btn.textContent = "Mulai Latihan";
    btn.style.backgroundColor = "";
    if (breathInterval) clearInterval(breathInterval);
    resetBreath(circle, text);
  }
}

function runBreathCycle(circle, text) {
  text.textContent = "Tarik...";
  circle.style.transform = "scale(1.5)";
  circle.style.backgroundColor = "var(--primary-teal)";
  text.style.color = "white";

  setTimeout(() => {
    if (!isBreathing) return;
    text.textContent = "Tahan...";
  }, 4000);

  setTimeout(() => {
    if (!isBreathing) return;
    text.textContent = "Hembuskan...";
    circle.style.transform = "scale(1)";
    circle.style.backgroundColor = "var(--primary-light)";
    text.style.color = "var(--primary-teal)";
  }, 8000);
}

function resetBreath(circle, text) {
  text.textContent = "Siap";
  circle.style.transform = "scale(1)";
  circle.style.backgroundColor = "var(--primary-light)";
  text.style.color = "var(--primary-teal)";
}

/* ── AUTOPLAY FULLSCREEN ─────────────────────── */
let autoplayTimer = null;
let isAutoplay = false;

export function toggleAutoplay() {
  isAutoplay = !isAutoplay;
  const btn = document.getElementById("fsAutoplayBtn");
  if (btn) {
    btn.classList.toggle("active", isAutoplay);
    btn.textContent = isAutoplay ? "⏸" : "▶";
  }

  if (isAutoplay) {
    nextFs();
    autoplayTimer = setInterval(() => {
      if (fsIndex >= fsList.length - 1) {
        toggleAutoplay();
      } else {
        nextFs();
      }
    }, 4000);
  } else {
    clearInterval(autoplayTimer);
  }
}

/* ── PLAY TTS ────────────────────────────── */
export function playTTS(text, id, type) {
  if ("vibrate" in navigator) navigator.vibrate(50);

  document.querySelectorAll(".playing").forEach((el) => el.classList.remove("playing"));

  const card =
    document.querySelector(`[data-id="${id}"]`) ||
    document.querySelector(`.sentence-item[data-id="${id}"]`) ||
    document.querySelector(`.custom-card[data-id="${id}"]`);
  if (card) card.classList.add("playing");

  speakText(text, "id-ID", () => {
    if (card) card.classList.remove("playing");
  });

  const chk = document.getElementById(`chk_${id}`);
  if (chk) {
    chk.classList.add("show");
    setTimeout(() => chk.classList.remove("show"), 1200);
  }

  addProgress(type);
  updateProgress();
}

/* ── SWIPE & KEYBOARD NAV (FULLSCREEN) ── */
export function setupSwipeAndKeyboard() {
  const overlay = document.getElementById("fsOverlay");
  if (!overlay) return;
  let startX = 0;

  overlay.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  overlay.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 60) dx < 0 ? nextFs() : prevFs();
    }, { passive: true }
  );

  document.addEventListener("keydown", (e) => {
    const fsOverlay = document.getElementById("fsOverlay");
    if (!fsOverlay?.classList.contains("show")) return;
    if (e.key === "ArrowRight") nextFs();
    else if (e.key === "ArrowLeft") prevFs();
    else if (e.key === "Escape") closeFullscreen();
    else if (e.key === " ") {
      e.preventDefault();
      fsPlaySound();
    }
  });

  const stopAutoplayIfActive = () => { if (isAutoplay) toggleAutoplay(); };
  document.getElementById("fsPrevBtn")?.addEventListener("click", stopAutoplayIfActive);
  document.getElementById("fsNextBtn")?.addEventListener("click", stopAutoplayIfActive);
  document.querySelector("#fsOverlay .fs-close")?.addEventListener("click", stopAutoplayIfActive);
}

/* ── DATA HELPER ───────────────────────── */
function __getContentData() {
  return {
    ALPHABET: window.__ALPHABET || [],
    NUMBERS: window.__NUMBERS || [],
    VOKAL: window.__VOKAL || [],
  };
}