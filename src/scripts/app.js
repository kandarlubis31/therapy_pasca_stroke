/**
 * app.js — Main entry point
 *
 * Imports and wires all modules together, renders content, and initializes the app.
 */

import { ALPHABET, WORDS, SENTENCES, NUMBERS, VOKAL } from "../data/content.js";

import { setupVoices, setupSpeed, refreshVoices, normalizeText } from "./tts.js";
import { loadCustomCards, openCustomModal, closeCustomModal, saveCustomCard, deleteCustomCard } from "./custom.js";
import { openCamera, closeCamera, toggleRecord } from "./camera.js";
import { resetProgress, updateProgress } from "./progress.js";
import {
  setupSettings,
  setupModeAndAccessibility,
  setMode,
  toggleContrast,
  updateLetterSpacing,
  updateLineHeight,
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
} from "./ui.js";

// ── Expose content data for dynamic imports (used by ui.js fullscreen) ──
window.__ALPHABET = ALPHABET;
window.__NUMBERS = NUMBERS;
window.__VOKAL = VOKAL;

// ── Expose all public functions on window for inline onclick handlers ──
window.setMode = setMode;
window.toggleContrast = toggleContrast;
window.updateLetterSpacing = updateLetterSpacing;
window.updateLineHeight = updateLineHeight;
window.openCamera = openCamera;
window.closeCamera = closeCamera;
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
window.resetProgress = resetProgress;
window.openCustomModal = openCustomModal;
window.closeCustomModal = closeCustomModal;
window.saveCustomCard = saveCustomCard;
window.deleteCustomCard = deleteCustomCard;

// ── INIT ─────────────────────────────────
window.addEventListener("load", initApp);

function initApp() {
  setupSpeed();
  setupVoices();
  setupSettings();
  setupModeAndAccessibility();
  setupSwipeAndKeyboard();
  renderContent();
  loadCustomCards();
  updateProgress();
}

/* ── RENDER CONTENT ─────────────────────── */
function makeCard(id, text, type, inner) {
  return `<button class="card alpha-card" data-id="${id}" data-text="${text}" data-type="${type}"
        onclick="window.cardTap('${text}', '${id}', '${type}')">
        <span class="card-check" id="chk_${id}">\u2713</span>
        ${inner}
    </button>`;
}

function renderContent() {
  const alphaGrid = document.getElementById("alphabetGrid");
  const vokalGrid = document.getElementById("vokalGrid");
  const numGrid = document.getElementById("numbersGrid");
  const wordsGrid = document.getElementById("wordsGrid");
  const sentList = document.getElementById("sentencesList");

  if (vokalGrid) {
    vokalGrid.innerHTML = VOKAL.map((i) =>
      makeCard(
        i.id,
        i.text,
        "vokal",
        `<span class="alpha-main">${i.text}</span>`,
      ),
    ).join("");
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
  }

  if (numGrid) {
    numGrid.innerHTML = NUMBERS.map((i) =>
      makeCard(
        i.id,
        i.text,
        "number",
        `<span class="alpha-main">${i.text}</span>`,
      ),
    ).join("");
  }

  if (wordsGrid) {
    const groups = {};
    WORDS.forEach((w) => {
      if (!groups[w.category]) groups[w.category] = [];
      groups[w.category].push(w);
    });
    wordsGrid.innerHTML = Object.entries(groups)
      .map(
        ([cat, items]) =>
          `<div class="word-category-block">
                <div class="word-category-label">${cat}</div>
                <div class="grid-words">${items
                  .map(
                    (i) =>
                      `<button class="card word-card" data-id="${i.id}" onclick="window.playTTS('${i.text}', '${i.id}', 'word')">
                        <span class="card-check" id="chk_${i.id}">\u2713</span>
                        <span class="word-initial">${i.text.charAt(0)}</span>
                        <span class="word-text">${i.text}</span>
                    </button>`,
                  )
                  .join("")}</div>
            </div>`,
      )
      .join("");
  }

  if (sentList) {
    const sentGroups = {};
    SENTENCES.forEach((s) => {
      if (!sentGroups[s.group]) sentGroups[s.group] = [];
      sentGroups[s.group].push(s);
    });
    sentList.innerHTML = Object.entries(sentGroups)
      .map(
        ([grp, items]) =>
          `<div class="sent-group">
                <div class="sent-group-label">${grp}</div>
                ${items
                  .map(
                    (s) =>
                      `<div class="sentence-item" data-id="${s.id}">
                    <span class="sentence-text">${s.text}</span>
                    <button class="btn-play" onclick="window.playTTS('${s.text}', '${s.id}', 'sentence')">Dengarkan</button>
                </div>`,
                  )
                  .join("")}
            </div>`,
      )
      .join("");
  }
}
