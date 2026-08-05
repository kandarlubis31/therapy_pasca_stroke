// src/scripts/ui.ts
import { speakText, TTS, stopAllSpeech } from "./tts.js";
import { openCamera, closeCamera } from "./camera.js";
import { addProgress, updateProgress } from "./progress.js";
import { getSyllables, getSpellingText } from "./syllable.js";
import { isSpeechSupported, startSpeechMatch } from "./speech.js";
import { loadAudioCuesSetting } from "./audioCues.js";
import { safeVibrate } from "./vibrate.js";

// ── Types ─────────────────────────────────
interface FsItem {
  id: string;
  text: string;
  isSentenceWord?: boolean;
  isWord?: boolean;
  isSyllable?: boolean;
  fullWord?: string;
  fullSentence?: string;
}

type TabType = "alphabet" | "number" | "vokal" | "word" | "sentence" | "custom";

interface ContentData {
  ALPHABET: FsItem[];
  NUMBERS: FsItem[];
  VOKAL: FsItem[];
}

// ── Window augmentations ──────────────────
declare global {
  interface Window {
    __ALPHABET: FsItem[];
    __NUMBERS: FsItem[];
    __VOKAL: FsItem[];
    __WORDS: FsItem[];
    __SENTENCES: FsItem[];
    __ALPHABET_EXAMPLES: Record<string, string>;
    __cameraResetPosition?: () => void;
    cardTapCustom?: (text: string, id: string) => void;
    deleteCustomCard?: (id: string, e: Event) => void;
    renderQuizStart?: () => void;
    announceToScreenReader?: (message: string) => void;
  }
}

/* ── SETTINGS POPUP ─────────────────────── */
export function setupSettings(): void {
  const btn = document.getElementById("btnSettings");
  const popup = document.getElementById("settingsPopup");
  if (!btn || !popup) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    popup.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target as Node) && e.target !== btn) {
      popup.classList.remove("open");
    }
  });
}

/* ── TEMA, AKSESIBILITAS & FONT ──────────── */
export function setupModeAndAccessibility(): void {
  const savedMode = localStorage.getItem("appMode") || "adult";
  setMode(savedMode);

  const savedContrast = localStorage.getItem("highContrast") === "true";
  if (savedContrast) toggleContrast(true);

  const ls = localStorage.getItem("lsVal") || "0";
  const lh = localStorage.getItem("lhVal") || "0";
  const fs = localStorage.getItem("fsVal") || "16";

  updateLetterSpacing(ls);
  updateLineHeight(lh);
  updateFontSize(fs);

  loadAffectedSide();
  loadAudioCuesSetting();

  if (localStorage.getItem('reduceMotion') === 'true') toggleReduceMotion();
  if (localStorage.getItem('dyslexicFont') === 'true') toggleDyslexicFont();

  const lsSlider = document.getElementById("letterSpacingSlider") as HTMLInputElement | null;
  const lhSlider = document.getElementById("lineHeightSlider") as HTMLInputElement | null;
  const fsSlider = document.getElementById("fontSizeSlider") as HTMLInputElement | null;

  if (lsSlider) lsSlider.value = ls;
  if (lhSlider) lhSlider.value = lh;
  if (fsSlider) fsSlider.value = fs;

  setupInitialTab();
}

export function setMode(mode: string): void {
  localStorage.setItem("appMode", mode);
  const html = document.documentElement;

  if (mode === "child") {
    html.classList.add("mode-child");
    html.classList.remove("mode-adult");
  } else {
    html.classList.remove("mode-child");
    html.classList.add("mode-adult");
  }

  document.querySelectorAll<HTMLElement>(".btn-mode, .sidebar-mode-btn")
    .forEach((btn) => {
      const isAdult = btn.id?.includes("Adult") || btn.id?.includes("sbModeAdult");
      const isTarget = mode === "adult" ? isAdult : !isAdult;
      btn.classList.toggle("active", isTarget);
    });
}

export function toggleReduceMotion(): void {
  const html = document.documentElement;
  const isOn = !html.classList.contains('reduce-motion');
  html.classList.toggle('reduce-motion', isOn);
  localStorage.setItem('reduceMotion', String(isOn));
  const pill = document.getElementById('reduceMotionPill');
  if (pill) { pill.textContent = isOn ? 'ON' : 'OFF'; pill.classList.toggle('on', isOn); }
}

export function toggleDyslexicFont(): void {
  const html = document.documentElement;
  const isOn = !html.classList.contains('dyslexic-font');
  html.classList.toggle('dyslexic-font', isOn);
  localStorage.setItem('dyslexicFont', String(isOn));
  const pill = document.getElementById('dyslexicFontPill');
  if (pill) { pill.textContent = isOn ? 'ON' : 'OFF'; pill.classList.toggle('on', isOn); }
}

export function toggleContrast(forceState?: boolean): void {
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

export function updateLetterSpacing(val: string): void {
  document.documentElement.style.setProperty("--ls-extra", `${Number(val) * 0.05}em`);
  localStorage.setItem("lsVal", val);
  const label = document.getElementById("lsVal");
  if (label) label.textContent = val === "0" ? "Normal" : `+${val}`;
}

export function updateLineHeight(val: string): void {
  document.documentElement.style.setProperty("--lh-extra", `${Number(val) * 0.1}`);
  localStorage.setItem("lhVal", val);
  const label = document.getElementById("lhVal");
  if (label) label.textContent = val === "0" ? "Normal" : `+${val}`;
}

export function updateFontSize(val: string): void {
  document.documentElement.style.setProperty("--base-font-size", `${val}px`);
  localStorage.setItem("fsVal", val);
  const label = document.getElementById("fsVal");
  if (label) {
    if (val === "16") label.textContent = "Normal";
    else if (Number(val) < 16) label.textContent = "Kecil";
    else label.textContent = "Besar";
  }
}

/* ── AFFECTED SIDE (LATIHAN FISIK) ──────── */
export function getAffectedSide(): string {
  return localStorage.getItem("affectedSide") || "kanan";
}

export function setAffectedSide(side: string): void {
  localStorage.setItem("affectedSide", side);

  // Update toggle pills in settings
  document.querySelectorAll<HTMLElement>("#btnSideKanan, #btnSideKiri").forEach((btn) => {
    const isTarget = (side === "kanan" && btn.id === "btnSideKanan") ||
                     (side === "kiri" && btn.id === "btnSideKiri");
    btn.classList.toggle("active", isTarget);
  });

  // Re-render active exercise if one is in progress
  if (typeof (window as any).rerenderActiveExercise === "function") {
    (window as any).rerenderActiveExercise();
  }
}

export function loadAffectedSide(): void {
  const side = getAffectedSide();
  setAffectedSide(side); // syncs the UI pills
}

/* ── SIDEBAR ────────────────────────────── */
const SIDEBAR_STATE_KEY = "sidebarOpen";

export function restoreSidebarState(): void {
  if (window.innerWidth >= 768) return;
  if (localStorage.getItem(SIDEBAR_STATE_KEY) === "true") {
    openSidebar();
  }
}

export function toggleSidebar(): void {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  if (sidebar.classList.contains("open")) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

export function openSidebar(): void {
  safeVibrate(10);
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const hamburger = document.getElementById("btnHamburger");
  if (!sidebar) return;
  sidebar.classList.add("open");
  if (overlay) overlay.classList.add("open");
  if (hamburger) hamburger.classList.add("open");
  localStorage.setItem(SIDEBAR_STATE_KEY, "true");
  if (window.innerWidth < 768) {
    document.body.style.overflow = "hidden";
  }
}

export function closeSidebar(): void {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const hamburger = document.getElementById("btnHamburger");
  if (!sidebar) return;
  sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
  if (hamburger) hamburger.classList.remove("open");
  localStorage.setItem(SIDEBAR_STATE_KEY, "false");
  document.body.style.overflow = "";
}

export function navToTab(tabId: string): void {
  safeVibrate(20);
  closeSidebar();
  showTab(tabId);
}

/** Highlight sidebar item yang aktif */
function highlightSidebarItem(tabId: string): void {
  document.querySelectorAll<HTMLElement>(".sidebar-item").forEach((el) => {
    const isActive = el.dataset.tab === tabId;
    el.classList.toggle("active", isActive);
    if (isActive) {
      el.setAttribute("aria-current", "page");
    } else {
      el.removeAttribute("aria-current");
    }
  });
}

/* ── KEYBOARD: Escape to close sidebar ──── */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const sidebar = document.getElementById("sidebar");
    if (sidebar && sidebar.classList.contains("open") && window.innerWidth < 768) {
      closeSidebar();
    }
  }
});

/* ── TABS ───────────────────────────────── */
const LAST_TAB_KEY = "lastActiveTab";

export function showTab(tabId: string, save = true): void {
  highlightSidebarItem(tabId);
  document.querySelectorAll<HTMLElement>(".tab-content").forEach((el) => {
    el.classList.remove("active");
    el.style.display = "none";
  });
  document.querySelectorAll<HTMLElement>(".tab-item").forEach((btn) => btn.classList.remove("active"));

  const target = document.getElementById(tabId);
  if (target) {
    target.style.display = "block";
    target.classList.add("active");
  }

  document.querySelector<HTMLElement>(`[data-tab="${tabId}"]`)?.classList.add("active");

  if (save) {
    localStorage.setItem(LAST_TAB_KEY, tabId);
  }

  if (tabId !== "vokalTab") {
    closeCamera();
  }

  // Stop autoplay when switching away from fullscreen
  if (isAutoplay) toggleAutoplay();

  if (tabId !== "breathTab" && isBreathing) {
    toggleBreath();
  }

  if (tabId !== "oralMotorTab" && typeof (window as any).stopOralMotorExercise === 'function') {
    (window as any).stopOralMotorExercise();
  }

  if (tabId === "quizTab") {
    if (typeof window.renderQuizStart === 'function') {
      window.renderQuizStart();
    } else {
      import("./quiz.js").then(m => {
        window.renderQuizStart = m.renderQuizStart;
        m.renderQuizStart();
      });
    }
  }

  if (tabId === "oralMotorTab") {
    if (typeof window.renderOralMotorList === 'function') {
      window.renderOralMotorList();
    } else {
      import("./oralMotor.js").then(m => {
        window.renderOralMotorList = m.renderOralMotorList;
        window.startOralMotorExercise = m.startOralMotorExercise;
        window.stopOralMotorExercise = m.stopOralMotorExercise;
        window.rerenderActiveExercise = m.rerenderActiveExercise;
        window.setExerciseFilter = m.setExerciseFilter;
        m.renderOralMotorList();
      });
    }
  }
}

export function setupInitialTab(): void {
  const savedTab = localStorage.getItem(LAST_TAB_KEY) || "vokalTab";
  showTab(savedTab, false);
}

/* ── FULLSCREEN ─────────────────────────── */
let fsMode = false;
let fsCurrentText = "";
let fsCurrentId = "";
let fsIndex = 0;
let fsList: FsItem[] = [];

export function isFsMode(): boolean { return fsMode; }

export function toggleFsMode(): void {
  safeVibrate(10);
  fsMode = !fsMode;
  document.querySelectorAll<HTMLElement>(".btn-fs-toggle").forEach((btn) => {
    btn.classList.toggle("active", fsMode);
    const label = btn.querySelector<HTMLElement>(".btn-fs-label");
    if (label) label.textContent = fsMode ? "Mode Aktif" : "Mode Penuh";
  });
}

export function cardTap(text: string, id: string, type: TabType): void {
  safeVibrate(40);
  if (fsMode) {
    let list: FsItem[] | undefined;
    const content = __getContentData();
    if (type === "number") list = content.NUMBERS;
    else if (type === "alphabet") list = content.ALPHABET;
    else if (type === "vokal") list = content.VOKAL;
    else if (type === "sentence") {
      const sentenceList = window.__SENTENCES || [];
      const item = sentenceList.find((i) => i.id === id);
      if (item) {
        const words = item.text.replace(/[.,!?;:]/g, '').split(/\s+/).filter(Boolean);
        openFs(words.map((w, i) => ({
          id: `${item.id}_w${i}`,
          text: w,
          fullSentence: item.text,
          isSentenceWord: true,
        })), 0);
        return;
      }
    }
    else if (type === "word") {
      const wordList = window.__WORDS || [];
      const clickedIdx = wordList.findIndex((i) => i.id === id);
      if (clickedIdx !== -1) {
        openFs(wordList.map((w) => ({
          id: w.id,
          text: w.text,
          isWord: true,
        })), clickedIdx);
        return;
      }
    }
    else return;

    if (!list) return;
    const idx = list.findIndex((i) => i.id === id);
    if (idx !== -1) openFs(list, idx);
  } else {
    playTTS(text, id, type);
  }
}

export function cardTapCustom(text: string, id: string): void {
  const decodedText = decodeURIComponent(text);
  safeVibrate(40);
  playTTS(decodedText, id, "custom");
}

/* ── SYLLABLE SPELLING HELPERS ──────────── */
export function fsSyllableSound(): void {
  const item = fsList[fsIndex];
  if (!item) return;
  if (item.isSyllable) {
    const fullWord = item.fullWord || fsCurrentText;
    const syllables = getSyllables(fullWord);
    const currentSyl = syllables[fsIndex];
    speakText(currentSyl, "id-ID");
  } else {
    speakText(fsList[fsIndex]?.text ?? fsCurrentText, "id-ID");
  }
  addProgress("word", fsCurrentId);
  updateProgress();
}

function openFs(list: FsItem[], idx: number): void {
  fsList = list;
  fsIndex = Math.max(0, Math.min(idx, list.length - 1));
  document.getElementById("fsOverlay")?.classList.add("show");
  renderFs();
  fsPlaySound();
}

function renderFs(): void {
  const item = fsList[fsIndex];
  if (!item) return;
  fsCurrentText = item.text;
  fsCurrentId = item.id;

  const charEl = document.getElementById("fsChar");
  const labelEl = document.getElementById("fsLabel");
  const counterEl = document.getElementById("fsCounter");
  const prevBtn = document.getElementById("fsPrevBtn") as HTMLButtonElement | null;
  const nextBtn = document.getElementById("fsNextBtn") as HTMLButtonElement | null;
  const mouthImg = document.getElementById("fsMouthImg") as HTMLImageElement | null;
  const spellingEl = document.getElementById("fsSpelling");
  const spellingInfo = document.getElementById("fsSpellingInfo");

  function setModeClass(mode: string): void {
    if (!spellingEl) return;
    spellingEl.classList.remove('fs-spelling-word', 'fs-spelling-sent');
    if (mode === 'word') spellingEl.classList.add('fs-spelling-word');
    if (mode === 'sentence') spellingEl.classList.add('fs-spelling-sent');
  }

  if (item.isSentenceWord) {
    const fullSentence = item.fullSentence || fsCurrentText;
    const words = fullSentence.replace(/[.,!?;:]/g, '').split(/\s+/).filter(Boolean);
    const wordIndex = words.indexOf(item.text);
    const currentWord = item.text;
    const spellingText = getSpellingText(currentWord);

    if (charEl) {
      charEl.textContent = currentWord;
      charEl.style.display = "block";
    }

    if (spellingEl) {
      spellingEl.innerHTML = words
        .map((w, i) => `<span class="spelling-block ${i === wordIndex ? "active" : ""}"
          data-index="${i}">${w}</span>`)
        .join("");
      spellingEl.style.display = "flex";
      setModeClass('sentence');
    }

    if (labelEl) labelEl.textContent = `Kata ${wordIndex + 1} dari ${words.length}`;
    if (spellingInfo) {
      spellingInfo.textContent = `${currentWord} → ${spellingText}`;
      spellingInfo.style.display = "block";
    }
    if (mouthImg) mouthImg.classList.remove("show");
  } else if (item.isSyllable && item.fullWord) {
    const syllables = getSyllables(item.fullWord);

    if (spellingEl) {
      spellingEl.innerHTML = syllables
        .map((s, i) => `<span class="spelling-block ${i === fsIndex ? "active" : ""}" 
          data-index="${i}">${s}</span>`)
        .join("");
      spellingEl.style.display = "flex";
      setModeClass('word');
    }

    if (charEl) charEl.style.display = "none";
    if (labelEl) labelEl.textContent = `${item.fullWord} — suku kata ${fsIndex + 1} dari ${syllables.length}`;
    if (spellingInfo) {
      spellingInfo.textContent = `${item.fullWord} → ${getSpellingText(item.fullWord)}`;
      spellingInfo.style.display = "block";
    }
    if (mouthImg) mouthImg.classList.remove("show");
  } else if (item.isWord) {
    const word = item.text;
    const syllables = getSyllables(word);
    const spellingText = getSpellingText(word);
    const wordNum = fsIndex + 1;
    const wordTotal = fsList.length;

    if (charEl) {
      charEl.textContent = word;
      charEl.style.display = "block";
    }

    if (spellingEl) {
      spellingEl.innerHTML = syllables
        .map((s) => `<span class="spelling-block">${s}</span>`)
        .join("");
      spellingEl.style.display = "flex";
      setModeClass('word');
    }

    if (labelEl) labelEl.textContent = `Kata ${wordNum} dari ${wordTotal}`;

    if (spellingInfo) {
      spellingInfo.textContent = `${word} → ${spellingText}`;
      spellingInfo.style.display = "block";
    }
    if (mouthImg) mouthImg.classList.remove("show");
  } else {
    if (charEl) {
      charEl.textContent = item.text;
      charEl.style.display = "block";
    }
    if (spellingEl) {
      spellingEl.style.display = "none";
      setModeClass('');
    }
    if (spellingInfo) spellingInfo.style.display = "none";

    if (labelEl) {
      labelEl.textContent = isNaN(Number(item.text)) ? "Huruf" : "Angka";
    }

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

  if (counterEl) counterEl.textContent = `${fsIndex + 1} / ${fsList.length}`;
  if (prevBtn) prevBtn.disabled = fsIndex === 0;
  if (nextBtn) nextBtn.disabled = fsIndex === fsList.length - 1;
}

export function nextFs(): void {
  safeVibrate(10);
  if (fsIndex < fsList.length - 1) {
    fsIndex++;
    renderFs();
    fsPlaySound();
  }
}

export function prevFs(): void {
  safeVibrate(10);
  if (fsIndex > 0) {
    fsIndex--;
    renderFs();
    fsPlaySound();
  }
}

export function closeFullscreen(): void {
  safeVibrate(10);
  // Stop autoplay if running
  if (isAutoplay) toggleAutoplay();
  document.getElementById("fsOverlay")?.classList.remove("show");
  stopAllSpeech();
  if (syllableAnimTimer) {
    clearTimeout(syllableAnimTimer);
    syllableAnimTimer = null;
  }
}

/* ── SYLLABLE-BY-SYLLABLE ANIMATION ─── */
let syllableAnimTimer: ReturnType<typeof setTimeout> | null = null;

function animateSyllablesSequentially(syllables: string[], fullWord: string, callback?: () => void): void {
  if (syllableAnimTimer) {
    clearTimeout(syllableAnimTimer);
    syllableAnimTimer = null;
  }

  const blocks = document.querySelectorAll<HTMLElement>('#fsSpelling .spelling-block');
  if (blocks.length === 0) {
    speakText(fullWord, 'id-ID', callback);
    return;
  }

  blocks.forEach(b => {
    b.classList.remove('active', 'done');
  });

  const totalAnimDelay = 300;

  setTimeout(() => {
    speakText(fullWord, 'id-ID', () => {
      let sylIdx = 0;
      function speakNextSyllable(): void {
        if (sylIdx >= syllables.length) {
          blocks.forEach(b => {
            b.classList.remove('active');
            b.classList.add('done');
            b.style.background = 'var(--primary-light)';
            b.style.color = 'var(--primary-teal)';
            b.style.boxShadow = 'none';
          });
          setTimeout(() => {
            const spelling = syllables.join(' - ');
            speakText(spelling, 'id-ID', callback);
          }, 400);
          return;
        }

        blocks.forEach(b => b.classList.remove('active'));
        if (blocks[sylIdx]) {
          blocks[sylIdx].classList.add('active');
        }

        speakText(syllables[sylIdx], 'id-ID', () => {
          sylIdx++;
          const delay = sylIdx < syllables.length ? 350 : 100;
          syllableAnimTimer = setTimeout(speakNextSyllable, delay);
        });
      }

      setTimeout(speakNextSyllable, 350);
    });
  }, totalAnimDelay);
}

export function fsPlaySound(): void {
  const item = fsList[fsIndex];
  if (!item) {
    speakText(fsCurrentText, "id-ID");
  } else if (item.isSyllable && item.fullWord) {
    fsSyllableSound();
  } else if (item.isWord) {
    const syllables = getSyllables(item.text);
    if (syllables.length > 1) {
      animateSyllablesSequentially(syllables, item.text);
    } else {
      speakText(item.text, "id-ID");
    }
  } else if (item.isSentenceWord) {
    const word = item.text || fsCurrentText;
    const syllables = getSyllables(word);
    if (syllables.length > 1) {
      animateSyllablesSequentially(syllables, word, () => {
        if (item.fullSentence) {
          setTimeout(() => {
            speakText(item.fullSentence!, "id-ID");
          }, 500);
        }
      });
    } else {
      speakText(word, "id-ID", () => {
        if (item.fullSentence) {
          setTimeout(() => {
            speakText(item.fullSentence!, "id-ID");
          }, 500);
        }
      });
    }
  } else {
    const isVowel = window.__VOKAL?.some(v => v.id === item.id);
    const isAlphabet = !isVowel && item.id?.startsWith('a_');
    if (isAlphabet) {
      const examples = window.__ALPHABET_EXAMPLES || {};
      const upper = item.text.toUpperCase();
      const example = examples[upper];
      if (example) {
        speakText(`${upper} untuk ${example}`, "id-ID");
      } else {
        speakText(item.text, "id-ID");
      }
    } else {
      speakText(item.text, "id-ID", undefined, !!isVowel);
    }
  }
  addProgress("word", fsCurrentId);
  updateProgress();
}

/* ── BREATHING ───────────────────────────── */
let breathInterval: ReturnType<typeof setInterval> | null = null;
let isBreathing = false;

export function toggleBreath(): void {
  safeVibrate(30);
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

function runBreathCycle(circle: HTMLElement, text: HTMLElement): void {
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

function resetBreath(circle: HTMLElement, text: HTMLElement): void {
  text.textContent = "Siap";
  circle.style.transform = "scale(1)";
  circle.style.backgroundColor = "var(--primary-light)";
  text.style.color = "var(--primary-teal)";
}

/* ── AUTOPLAY FULLSCREEN ─────────────────────── */
let autoplayTimer: ReturnType<typeof setInterval> | null = null;
let isAutoplay = false;
let isLoop = false;
const AUTOPLAY_SPEED_KEY = "autoplaySpeed";

export function getAutoplaySpeed(): number {
  return parseInt(localStorage.getItem(AUTOPLAY_SPEED_KEY) || "3");
}

export function setAutoplaySpeed(val: number): void {
  localStorage.setItem(AUTOPLAY_SPEED_KEY, String(val));
  const label = document.getElementById("fsSpeedVal");
  if (label) label.textContent = val + "s";
  if (isAutoplay) {
    if (autoplayTimer) clearInterval(autoplayTimer);
    startAutoplayTimer();
  }
}

function startAutoplayTimer(): void {
  const speed = getAutoplaySpeed() * 1000;
  autoplayTimer = setInterval(() => {
    if (fsIndex >= fsList.length - 1) {
      if (isLoop) {
        fsIndex = -1;
        nextFs();
      } else {
        toggleAutoplay();
      }
    } else {
      nextFs();
    }
  }, speed);
}

export function toggleAutoplay(): void {
  safeVibrate(15);
  isAutoplay = !isAutoplay;
  const btn = document.getElementById("fsAutoplayBtn");
  if (btn) {
    btn.classList.toggle("active", isAutoplay);
    btn.textContent = isAutoplay ? "⏸" : "▶";
  }

  if (isAutoplay) {
    nextFs();
    startAutoplayTimer();
  } else {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }
}

export function fsSpeechPractice(): void {
  if (!isSpeechSupported()) {
    const fb = document.getElementById('fsSpeechFeedback');
    if (fb) { fb.style.display = 'block'; fb.textContent = '⚠️ Browser kamu belum mendukung latihan ucapan. Coba pakai Chrome ya.'; fb.className = 'fs-speech-feedback fs-fb-warn'; }
    return;
  }
  const btn = document.getElementById('fsSpeechBtn');
  const fb = document.getElementById('fsSpeechFeedback');
  if (fb) { fb.style.display = 'block'; fb.textContent = '🎙️ Dengarkan... ucapkan kata yang muncul'; fb.className = 'fs-speech-feedback fs-fb-listen'; }
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Dengar...'; }

  startSpeechMatch(fsCurrentText, 'id-ID', (match, spoken) => {
    if (btn) { btn.disabled = false; btn.textContent = '🎤 Ucapkan'; }
    if (fb) {
      if (match) {
        fb.textContent = `✅ Bagus! "${spoken}" — tepat sekali!`;
        fb.className = 'fs-speech-feedback fs-fb-success';
      } else {
        fb.textContent = `🔄 "${spoken}" — coba lagi ya, ucapkan "${fsCurrentText}"`;
        fb.className = 'fs-speech-feedback fs-fb-retry';
      }
    }
    if (match) safeVibrate([50, 50, 50]);
  });
}

export function toggleLoop(): void {
  safeVibrate(10);
  isLoop = !isLoop;
  const btn = document.getElementById("fsLoopBtn");
  if (btn) {
    btn.classList.toggle("active-loop", isLoop);
  }
}

/* ── PLAY TTS ────────────────────────────── */
let chkTimer: ReturnType<typeof setTimeout> | null = null;

export function playTTS(text: string, id: string, type: TabType | "custom"): void {
  safeVibrate(30);

  document.querySelectorAll<HTMLElement>(".playing").forEach((el) => el.classList.remove("playing"));

  const card =
    document.querySelector(`[data-id="${id}"]`) ||
    document.querySelector(`.sentence-item[data-id="${id}"]`) ||
    document.querySelector(`.custom-card[data-id="${id}"]`);
  if (card) {
    card.classList.add("playing");
  }

  const rawMode = type === "vokal";

  let speakThis = text;
  if (type === "alphabet") {
    const examples = window.__ALPHABET_EXAMPLES || {};
    const upperText = text.toUpperCase();
    const example = examples[upperText];
    if (example) {
      speakThis = `${upperText} untuk ${example}`;
    }
  }

  speakText(speakThis, "id-ID", () => {
    if (card) card.classList.remove("playing");
  }, rawMode);

  if (chkTimer) {
    clearTimeout(chkTimer);
    chkTimer = null;
  }

  const chk = document.getElementById(`chk_${id}`) as HTMLElement | null;
  if (chk) {
    chk.classList.add('show');
    chkTimer = setTimeout(() => {
      chk.classList.remove('show');
      chkTimer = null;
    }, 1500);
  }

  addProgress(type, id);
  updateProgress();
}

/* ── SWIPE & KEYBOARD NAV (FULLSCREEN) ── */
export function setupSwipeAndKeyboard(): void {
  const overlay = document.getElementById("fsOverlay");
  if (!overlay) return;
  let startX = 0;

  overlay.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  overlay.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 60) dx < 0 ? nextFs() : prevFs();
  }, { passive: true });

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
function __getContentData(): ContentData {
  return {
    ALPHABET: window.__ALPHABET || [],
    NUMBERS: window.__NUMBERS || [],
    VOKAL: window.__VOKAL || [],
  };
}
