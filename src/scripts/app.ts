/**
 * app.ts — Main entry point
 *
 * Imports and wires all modules together, renders content, and initializes the app.
 */

import type { FsItem, WordItem, SentenceItem } from "../data/content.js";
import { ALPHABET, WORDS, SENTENCES, NUMBERS, VOKAL, WORD_CATEGORY_ORDER, WORD_CATEGORY_ICONS, SENTENCE_GROUP_ORDER, SENTENCE_GROUP_ICONS, ALPHABET_EXAMPLES } from "../data/content.js";

import { setupVoices, setupSpeed, refreshVoices, normalizeText, setupPitch, applyTonePreset, restoreTone, getTonePresets } from "./tts.js";
import { loadCustomCards, openCustomModal, closeCustomModal, saveCustomCard, deleteCustomCard } from "./custom.js";
import { renderQuizStart } from "./quiz.js";
import { renderOralMotorList, startOralMotorExercise, stopOralMotorExercise, rerenderActiveExercise } from "./oralMotor.js";
import { playPhaseCue, playCountdownTick, setAudioCuesEnabled, isAudioCuesEnabled, initAudioCues } from "./audioCues.js";
import { openCamera, closeCamera, toggleRecord, toggleMirrorFullscreen, openMirrorFullscreen, closeMirrorFullscreen } from "./camera.js";
import { resetProgress, updateProgress } from "./progress.js";
import {
  setupSettings,
  setupModeAndAccessibility,
  setMode,
  toggleContrast,
  updateLetterSpacing,
  updateLineHeight,
  setAffectedSide,
  showTab,
  toggleFsMode,
  cardTap,
  cardTapCustom,
  nextFs,
  prevFs,
  closeFullscreen,
  fsPlaySound,
  toggleBreath,
  toggleAutoplay,
  toggleLoop,
  setAutoplaySpeed,
  getAutoplaySpeed,
  setupSwipeAndKeyboard,
  playTTS,
  toggleSidebar,
  openSidebar,
  closeSidebar,
  navToTab,
  restoreSidebarState,
} from "./ui.js";

// ─── WINDOW AUGMENTATION ────────────────
declare global {
  interface Window {
    // Content data exposed globally
    __ALPHABET_EXAMPLES: Record<string, string>;
    __ALPHABET: FsItem[];
    __NUMBERS: FsItem[];
    __VOKAL: FsItem[];
    __WORDS: WordItem[];
    __SENTENCES: SentenceItem[];
    __WORD_CATEGORY_ORDER: string[];
    __WORD_CATEGORY_ICONS: Record<string, string>;
    __SENTENCE_GROUP_ORDER: string[];
    __SENTENCE_GROUP_ICONS: Record<string, string>;
    // Exposed functions
    setMode: typeof setMode;
    toggleContrast: typeof toggleContrast;
    updateLetterSpacing: typeof updateLetterSpacing;
    updateLineHeight: typeof updateLineHeight;
    setAffectedSide: typeof setAffectedSide;
    setAudioCuesEnabled: typeof setAudioCuesEnabled;
    isAudioCuesEnabled: typeof isAudioCuesEnabled;
    openCamera: typeof openCamera;
    closeCamera: typeof closeCamera;
    toggleMirrorFullscreen: typeof toggleMirrorFullscreen;
    openMirrorFullscreen: typeof openMirrorFullscreen;
    closeMirrorFullscreen: typeof closeMirrorFullscreen;
    showTab: typeof showTab;
    toggleFsMode: typeof toggleFsMode;
    cardTap: typeof cardTap;
    cardTapCustom: typeof cardTapCustom;
    nextFs: typeof nextFs;
    prevFs: typeof prevFs;
    closeFullscreen: typeof closeFullscreen;
    fsPlaySound: typeof fsPlaySound;
    toggleBreath: typeof toggleBreath;
    toggleAutoplay: typeof toggleAutoplay;
    toggleLoop: typeof toggleLoop;
    setAutoplaySpeed: typeof setAutoplaySpeed;
    getAutoplaySpeed: typeof getAutoplaySpeed;
    refreshVoices: typeof refreshVoices;
    toggleRecord: typeof toggleRecord;
    playTTS: typeof playTTS;
    toggleSidebar: typeof toggleSidebar;
    closeSidebar: typeof closeSidebar;
    navToTab: typeof navToTab;
    applyTonePreset: typeof applyTonePreset;
    getTonePresets: typeof getTonePresets;
    resetProgress: typeof resetProgress;
    openCustomModal: typeof openCustomModal;
    closeCustomModal: typeof closeCustomModal;
    saveCustomCard: typeof saveCustomCard;
    deleteCustomCard: typeof deleteCustomCard;
    renderQuizStart: typeof renderQuizStart;
    renderOralMotorList: typeof renderOralMotorList;
    startOralMotorExercise: typeof startOralMotorExercise;
    stopOralMotorExercise: typeof stopOralMotorExercise;
    rerenderActiveExercise: typeof rerenderActiveExercise;
    renderWordsGrid: () => void;
    renderSentencesList: () => void;
    setWordFilter: (cat: string) => void;
    setSentenceFilter: (group: string) => void;

    // Quiz functions (set by quiz.ts)
    startQuiz?: (mode: string, category?: string | null) => void;
    quizNextQuestion?: () => void;
    quizDontKnow?: () => void;
    quizCorrectAnswer?: () => void;
    quizRestart?: () => void;
    closeQuiz?: () => void;

    // Camera
    __cameraResetPosition?: () => void;
  }
}

// ── Expose content data for dynamic imports ──
window.__ALPHABET_EXAMPLES = ALPHABET_EXAMPLES;
window.__ALPHABET = ALPHABET;
window.__NUMBERS = NUMBERS;
window.__VOKAL = VOKAL;
window.__WORDS = WORDS;
window.__SENTENCES = SENTENCES;
window.__WORD_CATEGORY_ORDER = WORD_CATEGORY_ORDER;
window.__WORD_CATEGORY_ICONS = WORD_CATEGORY_ICONS;
window.__SENTENCE_GROUP_ORDER = SENTENCE_GROUP_ORDER;
window.__SENTENCE_GROUP_ICONS = SENTENCE_GROUP_ICONS;
// ── Expose all public functions on window for inline onclick handlers ──
window.setMode = setMode;
window.toggleContrast = toggleContrast;
window.updateLetterSpacing = updateLetterSpacing;
window.updateLineHeight = updateLineHeight;
window.setAffectedSide = setAffectedSide;
window.setAudioCuesEnabled = setAudioCuesEnabled;
window.isAudioCuesEnabled = isAudioCuesEnabled;
window.openCamera = openCamera;
window.closeCamera = closeCamera;
window.toggleMirrorFullscreen = toggleMirrorFullscreen;
window.openMirrorFullscreen = openMirrorFullscreen;
window.closeMirrorFullscreen = closeMirrorFullscreen;
window.showTab = showTab;
window.toggleFsMode = toggleFsMode;
window.cardTap = cardTap;
window.cardTapCustom = cardTapCustom;
window.nextFs = nextFs;
window.prevFs = prevFs;
window.closeFullscreen = closeFullscreen;
window.fsPlaySound = fsPlaySound;
window.toggleBreath = toggleBreath;
window.toggleAutoplay = toggleAutoplay;
window.toggleLoop = toggleLoop;
window.setAutoplaySpeed = setAutoplaySpeed;
window.getAutoplaySpeed = getAutoplaySpeed;
window.refreshVoices = refreshVoices;
window.toggleRecord = toggleRecord;
window.playTTS = playTTS;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.navToTab = navToTab;
window.applyTonePreset = applyTonePreset;
window.getTonePresets = getTonePresets;
window.resetProgress = resetProgress;
window.openCustomModal = openCustomModal;
window.closeCustomModal = closeCustomModal;
window.saveCustomCard = saveCustomCard;
window.deleteCustomCard = deleteCustomCard;
window.renderQuizStart = renderQuizStart;
window.renderOralMotorList = renderOralMotorList;
window.startOralMotorExercise = startOralMotorExercise;
window.stopOralMotorExercise = stopOralMotorExercise;
window.rerenderActiveExercise = rerenderActiveExercise;

// ── EXPOSE FOR RESET ──────────────────────
window.renderWordsGrid = renderWordsGrid;
window.renderSentencesList = renderSentencesList;

// ── WORD FILTER STATE ─────────────────────
let activeWordFilter: string | null = null;
window.setWordFilter = function(cat: string): void {
  activeWordFilter = (activeWordFilter === cat) ? null : cat;
  document.querySelectorAll<HTMLButtonElement>('.word-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === activeWordFilter);
  });
  renderWordsGrid();
};

// ── SENTENCE FILTER STATE ─────────────────
let activeSentenceFilter: string | null = null;
window.setSentenceFilter = function(group: string): void {
  activeSentenceFilter = (activeSentenceFilter === group) ? null : group;
  document.querySelectorAll<HTMLButtonElement>('.sentence-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.group === activeSentenceFilter);
  });
  renderSentencesList();
};

// ── INIT ─────────────────────────────────
window.addEventListener("load", initApp);

let voicesLoaded = false;

function initVoicesOnFirstTap(): void {
  if (voicesLoaded) return;
  voicesLoaded = true;

  if (window.speechSynthesis) window.speechSynthesis.cancel();
  setupVoices();

  if (window.speechSynthesis) {
    setTimeout(() => window.speechSynthesis.cancel(), 100);
    setTimeout(() => window.speechSynthesis.cancel(), 500);
  }

  document.removeEventListener("click", initVoicesOnFirstTap);
  document.removeEventListener("touchstart", initVoicesOnFirstTap);
  document.removeEventListener("keydown", initVoicesOnFirstTap);
}

document.addEventListener("click", initVoicesOnFirstTap, { once: true });
document.addEventListener("touchstart", initVoicesOnFirstTap, { once: true });
document.addEventListener("keydown", initVoicesOnFirstTap, { once: true });

function initApp(): void {
  if (window.speechSynthesis) window.speechSynthesis.cancel();

  setupSpeed();
  setupPitch();
  setupSettings();
  setupModeAndAccessibility();
  restoreSidebarState();
  restoreTone();
  initAudioCues();
  setupSwipeAndKeyboard();
  renderContent();
  loadCustomCards();
  updateProgress();

  // Signal screen readers that loading is complete
  if (window.announceToScreenReader) {
    window.announceToScreenReader('Konten siap. Silakan mulai latihan.');
  }
}

/* ── RENDER CONTENT ─────────────────────── */
function makeCard(id: string, text: string, type: string, inner: string): string {
  return `<button class="card alpha-card" data-id="${id}" data-text="${text}" data-type="${type}"
        onclick="window.cardTap('${text}', '${id}', '${type}')" style="animation-delay:0s">
        <span class="card-check" id="chk_${id}">\u2713</span>
        ${inner}
    </button>`;
}

function renderContent(): void {
  const alphaGrid = document.getElementById("alphabetGrid");
  const vokalGrid = document.getElementById("vokalGrid");
  const numGrid = document.getElementById("numbersGrid");
  const wordsGrid = document.getElementById("wordsGrid");
  const sentList = document.getElementById("sentencesList");

  // Helper: clear stale skeleton a11y attributes from a grid container
  const clearSkeleton = (el: HTMLElement) => {
    el.removeAttribute('aria-busy');
    el.removeAttribute('aria-label');
  };

  if (vokalGrid) {
    vokalGrid.innerHTML = VOKAL.map((i) =>
      makeCard(i.id, i.text, "vokal", `<span class="alpha-main">${i.text}</span>`),
    ).join("");
    clearSkeleton(vokalGrid);
  }

  if (alphaGrid) {
    alphaGrid.innerHTML = ALPHABET.map((i) =>
      makeCard(
        i.id,
        i.text,
        "alphabet",
        `<span class="alpha-main">${i.text}</span><span class="alpha-sub">${i.text.toLowerCase()}</span>`,
      ),
    ).join("");
    clearSkeleton(alphaGrid);
  }

  if (numGrid) {
    numGrid.innerHTML = NUMBERS.map((i) =>
      makeCard(i.id, i.text, "number", `<span class="alpha-main">${i.text}</span>`),
    ).join("");
    clearSkeleton(numGrid);
  }

  if (wordsGrid) {
    renderWordsGrid();
    renderWordFilterBar();
    clearSkeleton(wordsGrid);
  }

  if (sentList) {
    renderSentencesList();
    renderSentenceFilterBar();
    clearSkeleton(sentList);
  }
}

/* ── WORDS FILTER & RENDER ──────────────── */
function renderWordFilterBar(): void {
  const filterBar = document.getElementById('wordFilterBar');
  if (!filterBar) return;

  const groups: Record<string, WordItem[]> = {};
  WORDS.forEach(w => {
    if (!groups[w.category]) groups[w.category] = [];
    groups[w.category].push(w);
  });

  const orderedCats = WORD_CATEGORY_ORDER.filter(c => groups[c]);

  filterBar.innerHTML = orderedCats.map(cat => {
    const icon = WORD_CATEGORY_ICONS[cat] || '📂';
    const count = groups[cat].length;
    return `<button class="word-filter-btn" data-cat="${cat}" onclick="window.setWordFilter('${cat}')">
      <span class="wf-icon">${icon}</span>
      <span class="wf-label">${cat}</span>
      <span class="wf-count">${count}</span>
    </button>`;
  }).join('');
}

function renderWordsGrid(): void {
  const wordsGrid = document.getElementById('wordsGrid');
  if (!wordsGrid) return;

  const groups: Record<string, WordItem[]> = {};
  WORDS.forEach(w => {
    if (!groups[w.category]) groups[w.category] = [];
    groups[w.category].push(w);
  });

  const orderedCats = WORD_CATEGORY_ORDER.filter(c => groups[c]);
  const catsToShow = activeWordFilter ? [activeWordFilter] : orderedCats;

  const progress: Record<string, number> = JSON.parse(localStorage.getItem('wordProgress') || '{}');
  const totalByCat: Record<string, number> = {};
  const doneByCat: Record<string, number> = {};
  WORDS.forEach(w => {
    totalByCat[w.category] = (totalByCat[w.category] || 0) + 1;
    if (progress[w.id]) doneByCat[w.category] = (doneByCat[w.category] || 0) + 1;
  });

  wordsGrid.innerHTML = catsToShow
    .filter(cat => groups[cat])
    .map(cat => {
      const icon = WORD_CATEGORY_ICONS[cat] || '📂';
      const items = groups[cat];
      const done = doneByCat[cat] || 0;
      const total = totalByCat[cat] || 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      let cardIdx = 0;
      return `<div class="word-category-block">
        <div class="word-category-header">
          <div class="word-category-label">
            <span class="wcl-icon">${icon}</span>
            <span class="wcl-text">${cat}</span>
            <span class="wcl-count">${done}/${total}</span>
          </div>
          <div class="word-category-progress">
            <div class="wcp-bar"><div class="wcp-fill" style="width:${pct}%"></div></div>
          </div>
        </div>
        <div class="grid-words">${items
          .map(i => {
            const isDone = progress[i.id];
            const delay = cardIdx++ * 0.04;
            return `<button class="card word-card ${isDone ? 'done' : ''}" data-id="${i.id}" onclick="window.cardTap('${i.text}', '${i.id}', 'word')">
              <span class="card-check" id="chk_${i.id}">\u2713</span>
              <span class="word-initial">${i.text.charAt(0)}</span>
              <span class="word-text">${i.text}</span>
            </button>`;
          })
          .join('')}
        </div>
      </div>`;
    })
    .join('');
}

/* ── SENTENCES FILTER BAR ───────────────── */
function renderSentenceFilterBar(): void {
  const filterBar = document.getElementById('sentenceFilterBar');
  if (!filterBar) return;

  const groups: Record<string, SentenceItem[]> = {};
  SENTENCES.forEach(s => {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  });

  const orderedGroups = SENTENCE_GROUP_ORDER.filter(g => groups[g]);

  filterBar.innerHTML = orderedGroups.map(g => {
    const icon = SENTENCE_GROUP_ICONS[g] || '💬';
    const count = groups[g].length;
    return `<button class="sentence-filter-btn ${activeSentenceFilter === g ? 'active' : ''}" data-group="${g}" onclick="window.setSentenceFilter('${g}')">
      <span class="sf-icon">${icon}</span>
      <span class="sf-label">${g}</span>
      <span class="sf-count">${count}</span>
    </button>`;
  }).join('');
}

/* ── SENTENCES RENDER ───────────────────── */
function renderSentencesList(): void {
  const sentList = document.getElementById('sentencesList');
  if (!sentList) return;

  const groups: Record<string, SentenceItem[]> = {};
  SENTENCES.forEach(s => {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  });

  const orderedGroups = SENTENCE_GROUP_ORDER.filter(g => groups[g]);
  const groupsToShow = activeSentenceFilter ? [activeSentenceFilter] : orderedGroups;

  const sentProgress: Record<string, number> = JSON.parse(localStorage.getItem('sentenceProgress') || '{}');

  const totalByGroup: Record<string, number> = {};
  const doneByGroup: Record<string, number> = {};
  SENTENCES.forEach(s => {
    totalByGroup[s.group] = (totalByGroup[s.group] || 0) + 1;
    if (sentProgress[s.id]) doneByGroup[s.group] = (doneByGroup[s.group] || 0) + 1;
  });

  sentList.innerHTML = groupsToShow
    .filter(g => groups[g])
    .map(g => {
      const icon = SENTENCE_GROUP_ICONS[g] || '💬';
      const items = groups[g];
      const done = doneByGroup[g] || 0;
      const total = totalByGroup[g] || 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      return `<div class="sent-group">
        <div class="sent-group-header">
          <div class="sent-group-label">
            <span class="sgl-icon">${icon}</span>
            <span class="sgl-text">${g}</span>
            <span class="sgl-count">${done}/${total}</span>
          </div>
          <div class="sent-group-progress">
            <div class="sgp-bar"><div class="sgp-fill" style="width:${pct}%"></div></div>
          </div>
        </div>
        ${items.map((s, si) => {
          const isDone = sentProgress[s.id];
          const escapedText = s.text.replace(/'/g, "\\'");
          return `<div class="sentence-item ${isDone ? 'done' : ''}" data-id="${s.id}"
            onclick="window.cardTap('${escapedText}', '${s.id}', 'sentence')">
            <span class="card-check" id="chk_${s.id}">\u2713</span>
            <div class="sentence-item-main">
              <span class="sentence-icon">${icon}</span>
              <span class="sentence-text">${s.text}</span>
            </div>
            <button class="btn-play" onclick="event.stopPropagation(); window.cardTap('${escapedText}', '${s.id}', 'sentence')">\u25B6 Dengarkan</button>
          </div>`;
        }).join('')}
      </div>`;
    })
    .join('');
}
