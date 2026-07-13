/**
 * progress.ts — Progress tracking, stats bar, and reward system
 */

import { TTS } from "./tts.js";

// ─── TYPES ──────────────────────────────
export interface ProgressData {
  a: number;
  w: number;
  s: number;
  c: number;
  o: number;
}

export type ProgressType = "alphabet" | "number" | "vokal" | "word" | "sentence" | "custom" | "oralMotor";

const TYPE_MAP: Record<string, keyof ProgressData> = {
  alphabet: "a",
  number: "a",
  vokal: "a",
  word: "w",
  sentence: "s",
  custom: "c",
  oralMotor: "o",
};

/* ── PROGRESS & RESTART ─────────────────── */
export function getProgress(): ProgressData {
  return JSON.parse(
    localStorage.getItem("progress") || '{"a":0,"w":0,"s":0,"c":0,"o":0}',
  );
}

export function addProgress(type: string, id?: string): void {
  const p = getProgress();
  const key = TYPE_MAP[type];
  if (key) {
    p[key] = (p[key] || 0) + 1;
    localStorage.setItem("progress", JSON.stringify(p));
  }

  if (type === "word" && id) {
    const wordProgress = JSON.parse(localStorage.getItem("wordProgress") || "{}");
    wordProgress[id] = Date.now();
    localStorage.setItem("wordProgress", JSON.stringify(wordProgress));
  }

  if (type === "sentence" && id) {
    const sentProgress = JSON.parse(localStorage.getItem("sentenceProgress") || "{}");
    sentProgress[id] = Date.now();
    localStorage.setItem("sentenceProgress", JSON.stringify(sentProgress));
  }

  if (type === "oralMotor" && id) {
    const omProgress = JSON.parse(localStorage.getItem("oralMotorProgress") || "{}");
    omProgress[id] = (omProgress[id] || 0) + 1;
    localStorage.setItem("oralMotorProgress", JSON.stringify(omProgress));
  }
}

export function updateProgress(): void {
  const p = getProgress();
  const total = (p.a || 0) + (p.w || 0) + (p.s || 0) + (p.c || 0) + (p.o || 0);

  const set = (id: string, val: string | number): void => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  };

  set("statAlpha", p.a || 0);
  set("statWords", p.w || 0);
  set("statSent", p.s || 0);
  set("statOralMotor", p.o || 0);
  set("totalToday", total);

  const pct = Math.min(100, (total / 20) * 100);
  const bar = document.getElementById("progressBar");
  if (bar) {
    bar.style.width = pct + "%";
    bar.setAttribute("aria-valuenow", String(Math.min(total, 20)));
  }
  set("progressText", `${total} / 20 latihan`);

  checkReward();
}

export function resetProgress(): void {
  showResetConfirmModal(() => {
    localStorage.setItem("progress", '{"a":0,"w":0,"s":0,"c":0,"o":0}');
    localStorage.removeItem("wordProgress");
    localStorage.removeItem("sentenceProgress");
    localStorage.removeItem("oralMotorProgress");
    updateProgress();
    document
      .querySelectorAll(".card-check")
      .forEach((el) => el.classList.remove("show"));
    if (typeof (window as any).renderWordsGrid === "function") {
      (window as any).renderWordsGrid();
    }
    if (typeof (window as any).renderSentencesList === "function") {
      (window as any).renderSentencesList();
    }
  });
}

/* ── RESET CONFIRMATION MODAL ────────────── */
function showResetConfirmModal(onConfirm: () => void): void {
  // Remove any existing confirm modal
  const existing = document.querySelector<HTMLDivElement>(".confirm-overlay");
  if (existing) existing.remove();

  // Store trigger to restore focus, lock body scroll
  const triggerEl = document.activeElement as HTMLElement | null;
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const p = getProgress();
  const total = (p.a || 0) + (p.w || 0) + (p.s || 0) + (p.c || 0) + (p.o || 0);
  const alpha = p.a || 0;
  const words = p.w || 0;
  const sent = p.s || 0;
  const fisik = p.o || 0;

  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "confirmTitle");
  overlay.setAttribute("aria-describedby", "confirmDesc");
  overlay.innerHTML = `
    <div class="confirm-modal">
      <div class="confirm-icon">⚠️</div>
      <h3 class="confirm-title" id="confirmTitle">Reset Progress Hari Ini?</h3>
      <p class="confirm-desc" id="confirmDesc">Semua hitungan latihan akan kembali ke 0 dan tidak bisa dikembalikan.</p>
      <div class="confirm-stats">
        <div class="confirm-stat"><span>🔤 Huruf</span><span>${alpha}</span></div>
        <div class="confirm-stat"><span>📖 Kata</span><span>${words}</span></div>
        <div class="confirm-stat"><span>💬 Kalimat</span><span>${sent}</span></div>
        <div class="confirm-stat"><span>💪 Fisik</span><span>${fisik}</span></div>
        <div class="confirm-stat highlight"><span>🎯 Total</span><span>${total}</span></div>
      </div>
      <div class="confirm-actions">
        <button class="confirm-btn confirm-btn-cancel" id="confirmCancelBtn">Batal</button>
        <button class="confirm-btn confirm-btn-danger" id="confirmResetBtn">Ya, Reset</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  // Show immediately (no animation delay)
  overlay.classList.add("show");

  // Focus the cancel button by default (safer option)
  const cancelBtn = overlay.querySelector<HTMLButtonElement>("#confirmCancelBtn");
  const resetBtn = overlay.querySelector<HTMLButtonElement>("#confirmResetBtn");

  setTimeout(() => cancelBtn?.focus(), 50);

  // Click overlay background to cancel
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  // Button handlers
  cancelBtn?.addEventListener("click", closeModal);
  resetBtn?.addEventListener("click", () => {
    closeModal();
    onConfirm();
  });

  // Keyboard: Escape = cancel
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);

  function closeModal(): void {
    overlay.classList.remove("show");
    overlay.remove();
    document.removeEventListener("keydown", onKey);
    // Restore scroll
    document.body.style.overflow = prevOverflow;
    // Restore focus to the trigger button
    if (triggerEl && typeof triggerEl.focus === "function") {
      triggerEl.focus();
    }
  }
}

/* ── REWARD SYSTEM (MOTIVASI) ────────────────── */
function checkReward(): void {
  const p = getProgress();
  const total = (p.a || 0) + (p.w || 0) + (p.s || 0) + (p.c || 0) + (p.o || 0);

  const today = new Date().toDateString();
  const rewardGiven = localStorage.getItem("rewardDate");

  if (total >= 20 && rewardGiven !== today) {
    showRewardModal();
    localStorage.setItem("rewardDate", today);
  }
}

function showRewardModal(): void {
  let overlay = document.querySelector<HTMLDivElement>(".reward-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "reward-overlay";
    overlay.innerHTML = `
      <div class="reward-modal">
        <div class="reward-emoji">🎉</div>
        <h3 class="reward-title">Hebat Sekali!</h3>
        <p class="reward-subtitle">Anda telah menyelesaikan 20 latihan hari ini. Tetap semangat dan lanjutkan pemulihan Anda.</p>
        <button class="btn-reward-close" onclick="this.closest('.reward-overlay')?.remove()">Terima Kasih</button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  setTimeout(() => overlay.classList.add("show"), 100);

  TTS.speak(
    "Luar biasa! Anda telah menyelesaikan dua puluh latihan hari ini. Tetap semangat!",
    "id-ID",
  );
}
