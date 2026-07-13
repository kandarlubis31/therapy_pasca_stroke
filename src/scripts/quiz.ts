/**
 * quiz.ts — Mode Kuis ringan untuk menguji pemahaman
 */

import type { WordItem, SentenceItem } from "../data/content.js";
import { WORDS, SENTENCES, WORD_CATEGORY_ICONS, SENTENCE_GROUP_ICONS } from "../data/content.js";
import { speakText } from "./tts.js";
import { addProgress, updateProgress } from "./progress.js";

// ─── TYPES ──────────────────────────────
type QuizMode = "word" | "sentence";
type QuizItem = WordItem | SentenceItem;

interface QuizState {
  items: QuizItem[];
  index: number;
  correct: number;
  total: number;
  active: boolean;
  mode: QuizMode;
  category: string | null;
  answered: boolean;
}

const state: QuizState = {
  items: [],
  index: 0,
  correct: 0,
  total: 0,
  active: false,
  mode: "word",
  category: null,
  answered: false,
};

export function isQuizActive(): boolean {
  return state.active;
}

/* ── START QUIZ ─────────────────────────── */
export function startQuiz(mode: QuizMode, category: string | null = null): void {
  state.mode = mode;
  state.category = category;
  state.index = 0;
  state.correct = 0;
  state.answered = false;

  let pool: QuizItem[];
  if (mode === "word") {
    pool = category
      ? WORDS.filter(w => w.category === category)
      : [...WORDS];
  } else {
    pool = [...SENTENCES];
  }

  if (pool.length === 0) {
    alert("Belum ada data untuk kuis. Tambah kata/kalimat terlebih dahulu.");
    closeQuiz();
    return;
  }

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  state.items = pool.slice(0, Math.min(10, pool.length));
  state.total = state.items.length;
  state.active = true;

  renderQuizUI();
  showQuizQuestion();
}

/* ── RENDER QUIZ UI ─────────────────────── */
function renderQuizUI(): void {
  const container = document.getElementById("quizContainer");
  if (!container) return;

  const modeLabel = state.mode === "word" ? "Kata" : "Kalimat";
  const categoryLabel = state.category ? ` — ${state.category}` : "";

  container.innerHTML = `
    <div class="quiz-header">
      <div class="quiz-progress-text" id="quizProgress">
        Soal <span id="quizNum">${state.index + 1}</span> dari ${state.total}
      </div>
      <div class="quiz-score" id="quizScore">
        ✅ <span id="quizCorrectCount">${state.correct}</span>
      </div>
    </div>
    <div class="quiz-card" id="quizCard" onclick="window.quizNextQuestion()">
      <div class="quiz-card-inner">
        <div class="quiz-card-label" id="quizCardLabel">${modeLabel}${categoryLabel}</div>
        <div class="quiz-card-text" id="quizCardText"></div>
        <div class="quiz-card-hint" id="quizCardHint">Ketuk untuk dengar</div>
        <div class="quiz-card-spelling" id="quizCardSpelling"></div>
      </div>
      <div class="quiz-card-badge" id="quizCardBadge"></div>
    </div>
    <div class="quiz-actions" id="quizActions">
      <button class="quiz-btn quiz-btn-secondary" onclick="window.quizDontKnow()" id="quizBtnDontKnow">
        🤷 Tidak Tahu
      </button>
      <button class="quiz-btn quiz-btn-primary" onclick="window.quizCorrectAnswer()" id="quizBtnCorrect">
        ✅ Benar
      </button>
    </div>
    <div class="quiz-result" id="quizResult" style="display:none">
      <div class="quiz-result-emoji" id="quizResultEmoji">🎉</div>
      <div class="quiz-result-title" id="quizResultTitle">Selesai!</div>
      <div class="quiz-result-score" id="quizResultScore">0 / 0</div>
      <div class="quiz-result-message" id="quizResultMessage"></div>
      <button class="quiz-btn quiz-btn-primary quiz-result-btn" onclick="window.quizRestart()">🔄 Coba Lagi</button>
      <button class="quiz-btn quiz-btn-secondary quiz-result-btn" onclick="window.closeQuiz()">◀ Kembali</button>
    </div>
  `;

  // Expose functions on window
  (window as any).quizNextQuestion = quizNextQuestion;
  (window as any).quizDontKnow = quizDontKnow;
  (window as any).quizCorrectAnswer = quizCorrectAnswer;
  (window as any).quizRestart = quizRestart;
  (window as any).closeQuiz = closeQuiz;
}

/* ── SHOW QUESTION ──────────────────────── */
function showQuizQuestion(): void {
  if (state.index >= state.total) {
    showQuizResult();
    return;
  }

  const item = state.items[state.index];
  if (!item) return;

  state.answered = false;

  const textEl = document.getElementById("quizCardText");
  const labelEl = document.getElementById("quizCardLabel");
  const hintEl = document.getElementById("quizCardHint");
  const spellingEl = document.getElementById("quizCardSpelling");
  const badgeEl = document.getElementById("quizCardBadge");
  const numEl = document.getElementById("quizNum");
  const actionEl = document.getElementById("quizActions");
  const resultEl = document.getElementById("quizResult");
  const btnDontKnow = document.getElementById("quizBtnDontKnow") as HTMLButtonElement | null;
  const btnCorrect = document.getElementById("quizBtnCorrect") as HTMLButtonElement | null;
  const cardEl = document.getElementById("quizCard");

  if (numEl) numEl.textContent = String(state.index + 1);
  if (actionEl) actionEl.style.display = "flex";
  if (resultEl) resultEl.style.display = "none";
  if (cardEl) {
    cardEl.classList.remove("quiz-correct", "quiz-wrong");
  }
  if (btnDontKnow) btnDontKnow.disabled = false;
  if (btnCorrect) btnCorrect.disabled = false;

  if (textEl) textEl.textContent = item.text;
  if (hintEl) {
    hintEl.textContent = "Ketuk untuk dengar";
    hintEl.style.display = "block";
  }
  if (spellingEl) spellingEl.style.display = "none";
  if (badgeEl) badgeEl.textContent = "";

  // Category/group label
  if (labelEl) {
    if (state.mode === "word") {
      const wordItem = item as WordItem;
      const icon = WORD_CATEGORY_ICONS[wordItem.category] || "📂";
      labelEl.textContent = `${icon} ${wordItem.category}`;
    } else {
      const sentItem = item as SentenceItem;
      const icon = SENTENCE_GROUP_ICONS[sentItem.group] || "💬";
      labelEl.textContent = `${icon} ${sentItem.group}`;
    }
  }

  // Auto-play TTS
  setTimeout(() => {
    speakText(item.text, "id-ID");
  }, 300);

  addProgress(state.mode, item.id);
  updateProgress();
}

/* ── NEXT QUESTION (tap card) ───────────── */
function quizNextQuestion(): void {
  if (state.answered) {
    state.index++;
    showQuizQuestion();
    return;
  }

  const item = state.items[state.index];
  if (item) {
    speakText(item.text, "id-ID");
  }
}

/* ── DON'T KNOW ─────────────────────────── */
function quizDontKnow(): void {
  if (state.answered) return;
  state.answered = true;

  const item = state.items[state.index];
  const badgeEl = document.getElementById("quizCardBadge");
  const cardEl = document.getElementById("quizCard");
  const btnDontKnow = document.getElementById("quizBtnDontKnow") as HTMLButtonElement | null;
  const btnCorrect = document.getElementById("quizBtnCorrect") as HTMLButtonElement | null;

  if (btnDontKnow) btnDontKnow.disabled = true;
  if (btnCorrect) btnCorrect.disabled = true;

  showSpelling(item);

  if (cardEl) {
    cardEl.classList.add("quiz-wrong");
    setTimeout(() => cardEl.classList.remove("quiz-wrong"), 600);
  }

  if (badgeEl) badgeEl.textContent = "🤷";

  setTimeout(() => {
    state.index++;
    showQuizQuestion();
  }, 2500);
}

/* ── CORRECT ─────────────────────────────── */
function quizCorrectAnswer(): void {
  if (state.answered) return;
  state.answered = true;
  state.correct++;

  const item = state.items[state.index];
  const cardEl = document.getElementById("quizCard");
  const badgeEl = document.getElementById("quizCardBadge");
  const scoreEl = document.getElementById("quizCorrectCount");
  const btnDontKnow = document.getElementById("quizBtnDontKnow") as HTMLButtonElement | null;
  const btnCorrect = document.getElementById("quizBtnCorrect") as HTMLButtonElement | null;

  if (btnDontKnow) btnDontKnow.disabled = true;
  if (btnCorrect) btnCorrect.disabled = true;
  if (scoreEl) scoreEl.textContent = String(state.correct);

  if (cardEl) {
    cardEl.classList.add("quiz-correct");
    setTimeout(() => cardEl.classList.remove("quiz-correct"), 600);
  }

  if (badgeEl) badgeEl.textContent = "✅";

  showSpelling(item);

  setTimeout(() => {
    state.index++;
    showQuizQuestion();
  }, 1500);
}

/* ── SHOW SPELLING ──────────────────────── */
function showSpelling(item: QuizItem): void {
  const text = item.text;
  const hintEl = document.getElementById("quizCardHint");
  const spellingEl = document.getElementById("quizCardSpelling");

  if (hintEl) hintEl.style.display = "none";

  if (spellingEl) {
    if (state.mode === "word") {
      import("./syllable.js").then(mod => {
        const syllables: string[] = mod.getSyllables(text);
        spellingEl.innerHTML = syllables
          .map(s => `<span class="quiz-syl">${s}</span>`)
          .join("-");
        spellingEl.style.display = "block";
      });
    } else {
      spellingEl.textContent = text;
      spellingEl.style.display = "block";
    }
  }
}

/* ── SHOW RESULT ─────────────────────────── */
function showQuizResult(): void {
  state.active = false;

  const actionEl = document.getElementById("quizActions");
  const resultEl = document.getElementById("quizResult");
  const cardEl = document.getElementById("quizCard");

  if (actionEl) actionEl.style.display = "none";
  if (resultEl) resultEl.style.display = "flex";
  if (cardEl) {
    cardEl.classList.remove("quiz-correct", "quiz-wrong");
  }

  const pct = state.total > 0 ? Math.round((state.correct / state.total) * 100) : 0;
  const emojiEl = document.getElementById("quizResultEmoji");
  const titleEl = document.getElementById("quizResultTitle");
  const scoreEl = document.getElementById("quizResultScore");
  const msgEl = document.getElementById("quizResultMessage");

  if (emojiEl) {
    if (pct >= 80) emojiEl.textContent = "🌟";
    else if (pct >= 60) emojiEl.textContent = "👍";
    else if (pct >= 40) emojiEl.textContent = "💪";
    else emojiEl.textContent = "🤗";
  }

  if (titleEl) {
    if (pct >= 80) titleEl.textContent = "Luar Biasa!";
    else if (pct >= 60) titleEl.textContent = "Bagus!";
    else if (pct >= 40) titleEl.textContent = "Terus Berlatih!";
    else titleEl.textContent = "Ayo Coba Lagi!";
  }

  if (scoreEl) scoreEl.textContent = `${state.correct} / ${state.total}`;

  if (msgEl) {
    if (pct >= 80) msgEl.textContent = "Anda menguasai materi ini dengan baik!";
    else if (pct >= 60) msgEl.textContent = "Pertahankan semangat belajar Anda!";
    else if (pct >= 40) msgEl.textContent = "Sedikit lagi, yuk coba sekali lagi!";
    else msgEl.textContent = "Tidak apa-apa, latihan membuat sempurna!";
  }

  setTimeout(() => {
    speakText(`Skor Anda ${state.correct} dari ${state.total}. ${titleEl?.textContent || ""}`, "id-ID");
  }, 500);
}

/* ── RESTART ─────────────────────────────── */
export function quizRestart(): void {
  startQuiz(state.mode, state.category);
}

/* ── CLOSE QUIZ ──────────────────────────── */
export function closeQuiz(): void {
  state.active = false;
  const container = document.getElementById("quizContainer");
  if (container) container.innerHTML = "";
  renderQuizStart();
}

/* ── QUIZ START UI ───────────────────────── */
export function renderQuizStart(): void {
  const container = document.getElementById("quizContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="quiz-start">
      <div class="quiz-start-icon">🧠</div>
      <h3 class="quiz-start-title">Latihan Kuis</h3>
      <p class="quiz-start-desc">Uji pemahaman Anda dengan kuis interaktif. Dengarkan kata/kalimat, lalu nilai diri sendiri.</p>
      <div class="quiz-start-options">
        <button class="quiz-option-card" onclick="window.startQuiz('word')">
          <span class="qoc-icon">📖</span>
          <span class="qoc-title">Kuis Kata</span>
          <span class="qoc-desc">Kosa kata sehari-hari</span>
        </button>
        <button class="quiz-option-card" onclick="window.startQuiz('sentence')">
          <span class="qoc-icon">💬</span>
          <span class="qoc-title">Kuis Kalimat</span>
          <span class="qoc-desc">Kalimat kebutuhan sehari-hari</span>
        </button>
      </div>
    </div>
  `;

  (window as any).startQuiz = startQuiz;
}
