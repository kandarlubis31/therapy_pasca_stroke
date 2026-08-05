import { safeVibrate } from "./vibrate.js";

/**
 * progress.ts — Progress tracking, stats bar, reward system, milestones, and spaced repetition
 */

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

const MILESTONES = [5, 10, 15];
const MILESTONE_KEY = "milestonesSeen";

/* ── PROGRESS & RESTART ─────────────────── */
export function getProgress(): ProgressData {
  try {
    return JSON.parse(
      localStorage.getItem("progress") || '{"a":0,"w":0,"s":0,"c":0,"o":0}',
    );
  } catch {
    return { a: 0, w: 0, s: 0, c: 0, o: 0 };
  }
}

export function safeJSONParse<T>(raw: string | null, fallback: T): T {
  try {
    return JSON.parse(raw || (typeof fallback === 'string' ? fallback : JSON.stringify(fallback)));
  } catch {
    return fallback;
  }
}

export function addProgress(type: string, id?: string): void {
  const p = getProgress();
  const key = TYPE_MAP[type];
  if (key) {
    p[key] = (p[key] || 0) + 1;
    localStorage.setItem("progress", JSON.stringify(p));
  }

  if (type === "word" && id) {
    const wordProgress = safeJSONParse<Record<string, number>>(localStorage.getItem("wordProgress"), {});
    wordProgress[id] = Date.now();
    localStorage.setItem("wordProgress", JSON.stringify(wordProgress));
  }

  if (type === "sentence" && id) {
    const sentProgress = safeJSONParse<Record<string, number>>(localStorage.getItem("sentenceProgress"), {});
    sentProgress[id] = Date.now();
    localStorage.setItem("sentenceProgress", JSON.stringify(sentProgress));
  }

  if (type === "oralMotor" && id) {
    const omProgress = safeJSONParse<Record<string, number>>(localStorage.getItem("oralMotorProgress"), {});
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
  set("statCustom", p.c || 0);
  set("totalToday", total);

  const pct = Math.min(100, (total / 20) * 100);
  const bar = document.getElementById("progressBar");
  if (bar) {
    bar.style.width = pct + "%";
    bar.setAttribute("aria-valuenow", String(Math.min(total, 20)));
  }
  set("progressText", `${total} / 20 latihan`);

  checkMilestones(total);
  checkReward();
  if (typeof (window as any).updateStaleBadge === 'function') (window as any).updateStaleBadge();
}

export function resetProgress(): void {
  safeVibrate(15);
  showResetConfirmModal(() => {
    localStorage.setItem("progress", '{"a":0,"w":0,"s":0,"c":0,"o":0}');
    localStorage.removeItem("wordProgress");
    localStorage.removeItem("sentenceProgress");
    localStorage.removeItem("oralMotorProgress");
    localStorage.removeItem(MILESTONE_KEY);
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

/* ── SPACED REPETITION HELPER ─────────────── */
export function getStaleWordCount(): number {
  const wp = safeJSONParse<Record<string, number>>(localStorage.getItem("wordProgress"), {});
  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  let count = 0;
  for (const ts of Object.values(wp)) {
    if (now - ts > threeDays) count++;
  }
  return count;
}

/* ── MILESTONE ENCOURAGEMENT ───────────────── */
function checkMilestones(total: number): void {
  const today = new Date().toDateString();
  const seen = safeJSONParse<Record<string, string[]>>(localStorage.getItem(MILESTONE_KEY), {});

  for (const m of MILESTONES) {
    if (total >= m && (!seen[today] || !seen[today].includes(String(m)))) {
      // Show milestone toast
      showMilestoneToast(m);
      // Mark as seen
      if (!seen[today]) seen[today] = [];
      seen[today].push(String(m));
      localStorage.setItem(MILESTONE_KEY, JSON.stringify(seen));
      break; // Only show one milestone at a time
    }
  }
}

function showMilestoneToast(count: number): void {
  const messages: Record<number, string> = {
    5: "Lima latihan! Awal yang bagus hari ini 🌱",
    10: "Sepuluh latihan! Kamu hebat, teruskan! ⭐",
    15: "Lima belas! Tinggal sedikit lagi mencapai target 🎯",
  };
  const msg = messages[count] || `Kamu sudah ${count} latihan!`;

  const existing = document.querySelector('.milestone-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'milestone-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `<span>${msg}</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/* ── RESET CONFIRMATION MODAL ────────────── */
function showResetConfirmModal(onConfirm: () => void): void {
  const existing = document.querySelector<HTMLDivElement>(".confirm-overlay");
  if (existing) existing.remove();

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
  overlay.classList.add("show");

  const cancelBtn = overlay.querySelector<HTMLButtonElement>("#confirmCancelBtn");
  const resetBtn = overlay.querySelector<HTMLButtonElement>("#confirmResetBtn");

  setTimeout(() => cancelBtn?.focus(), 50);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  cancelBtn?.addEventListener("click", closeModal);
  resetBtn?.addEventListener("click", () => {
    closeModal();
    onConfirm();
  });

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", onKey);
      return;
    }
    if (e.key === "Tab") {
      const focusable = overlay.querySelectorAll<HTMLElement>(
        'button, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  };
  document.addEventListener("keydown", onKey);

  function closeModal(): void {
    overlay.classList.remove("show");
    overlay.remove();
    document.removeEventListener("keydown", onKey);
    document.body.style.overflow = prevOverflow;
    if (triggerEl && typeof triggerEl.focus === "function") { triggerEl.focus(); }
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
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  
  const existing = document.querySelector<HTMLDivElement>(".reward-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.className = "reward-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Selamat! Anda mencapai 20 latihan hari ini");
  overlay.innerHTML = `
    <div class="reward-modal">
      <div class="reward-emoji">🎉</div>
      <h3 class="reward-title">Hebat Sekali!</h3>
      <p class="reward-subtitle">Kamu sudah menyelesaikan 20 latihan hari ini. Luar biasa! Tetap semangat ya 🌟</p>
      <button class="btn-reward-close" id="btnRewardClose">Terima Kasih</button>
    </div>
  `;
  document.body.appendChild(overlay);

  setTimeout(() => overlay.classList.add("show"), 100);

  const closeBtn = overlay.querySelector<HTMLButtonElement>("#btnRewardClose");
  setTimeout(() => closeBtn?.focus(), 150);

  function closeReward(): void {
    overlay.classList.remove("show");
    overlay.remove();
    document.body.style.overflow = prevOverflow;
    document.removeEventListener("keydown", rewardKeyHandler);
  }

  closeBtn?.addEventListener("click", closeReward);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeReward();
  });

  function rewardKeyHandler(e: KeyboardEvent): void {
    if (e.key === "Escape") { closeReward(); return; }
    if (e.key === "Tab") { e.preventDefault(); closeBtn?.focus(); }
  }
  document.addEventListener("keydown", rewardKeyHandler);

}

/* ── IDLE ENCOURAGEMENT ────────────────────── */
export function setupIdleEncouragement(): void {
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  const IDLE_MS = 120000; // 2 minutes

  function resetTimer(): void {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(showIdleToast, IDLE_MS);
  }

  function showIdleToast(): void {
    const existing = document.querySelector('.idle-toast');
    if (existing) return;
    const toast = document.createElement('div');
    toast.className = 'idle-toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = '<span>Tidak apa-apa istirahat dulu ya 🌸</span><button class="idle-toast-close" onclick="this.parentElement.remove()">✕</button>';
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 5000);
  }

  ['click', 'touchstart', 'keydown', 'scroll'].forEach(evt => {
    document.addEventListener(evt, resetTimer, { passive: true });
  });
  resetTimer();
}
