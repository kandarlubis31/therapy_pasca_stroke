/**
 * oralMotor.ts — Guided exercise timer (oro-motor + limb rehabilitation)
 *
 * Supports both oro-motor exercises (bibir, lidah, rahang, pipi) and
 * limb exercises (tangan, kaki, keseimbangan) for post-stroke recovery.
 */

import { ORO_MOTOR_EXERCISES, LIMB_EXERCISES, EXERCISE_GROUPS, EXERCISE_ICONS, EXERCISE_SUB_ICONS } from "../data/content.js";
import { addProgress, updateProgress, safeJSONParse } from "./progress.js";
import { playPhaseCue, playCountdownTick } from "./audioCues.js";
import { safeVibrate } from "./vibrate.js";

type ExerciseState = {
  exerciseId: string | null;
  repCurrent: number;
  repTotal: number;
  phase: "ready" | "hold" | "rest" | "done";
  timerSeconds: number;
  intervalId: ReturnType<typeof setInterval> | null;
}

const state: ExerciseState = {
  exerciseId: null,
  repCurrent: 0,
  repTotal: 0,
  phase: "ready",
  timerSeconds: 0,
  intervalId: null,
};

// ── Combined exercise lookup ──────────────
const ALL_EXERCISES = [...ORO_MOTOR_EXERCISES, ...LIMB_EXERCISES];

function findExercise(exId: string) {
  return ALL_EXERCISES.find(e => e.id === exId);
}

function chunkInstruction(text: string): string {
  const parts = text.split(/\. (?=[A-Z])|, (?=[A-Za-z])|lalu /);
  if (parts.length <= 1) return text;
  return parts.map((p, i) => `<span class="om-step"><span class="om-step-num">${i + 1}.</span> ${p.trim().replace(/\.$/, '')}.</span>`).join('');
}

function getExerciseIcon(ex: typeof ALL_EXERCISES[number]): string {
  if ('muscle' in ex) return EXERCISE_SUB_ICONS[ex.muscle] || '💪';
  return EXERCISE_SUB_ICONS[ex.area] || '💪';
}

/** Derive motion animation class from exercise name/area */
function getExerciseMotion(ex: typeof ALL_EXERCISES[number]): string {
  const name = ex.name.toLowerCase();
  if (name.includes('angkat') || name.includes('jinjit') || name.includes('ke atas')) return 'om-motion-up-down';
  if (name.includes('rentangkan') || name.includes('geser') || name.includes('putar badan') || name.includes('ke samping')) return 'om-motion-side';
  if (name.includes('kepal') || name.includes('kembungkan') || name.includes('monyong') || name.includes('letupan') || name.includes('rapatkan')) return 'om-motion-in-out';
  if (name.includes('dorong') || name.includes('raih') || name.includes('julurkan') || name.includes('luruskan') || name.includes('ke depan')) return 'om-motion-forward';
  if (name.includes('putar pergelangan')) return 'om-motion-rotate';
  if (name.includes('buka tutup') || name.includes('mulut')) return 'om-motion-mouth';
  if (name.includes('tiup')) return 'om-motion-breathe';
  return '';
}

/* ── START GUIDED EXERCISE ────────────── */
export function startOralMotorExercise(exId: string): void {
  safeVibrate(15);

  // Guard: don't restart the same running exercise (prevents timer leak)
  const isRunning = state.exerciseId !== null && state.phase !== "done";
  if (isRunning && state.exerciseId === exId) return;

  const exercise = findExercise(exId);
  if (!exercise) return;

  stopTimer();
  state.exerciseId = exId;
  state.repCurrent = 1;
  state.repTotal = exercise.reps;
  state.phase = "ready";

  renderExerciseUI(exercise);
  scheduleNextPhase(exercise);
}

/* ── STOP ──────────────────────────────── */
export function stopOralMotorExercise(): void {
  safeVibrate(10);
  stopTimer();
  state.exerciseId = null;
  const el = document.getElementById("oralMotorActive");
  if (el) el.innerHTML = "";
}

/* ── RE-RENDER CURRENT EXERCISE (side change) ─ */
export function rerenderActiveExercise(): void {
  if (!state.exerciseId) return;
  const exercise = findExercise(state.exerciseId);
  if (exercise) renderExerciseUI(exercise);
}

/* ── TIMER LOGIC ───────────────────────── */
function stopTimer(): void {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

function scheduleNextPhase(exercise: typeof ALL_EXERCISES[number]): void {
  stopTimer();

  if (state.phase === "ready" || state.phase === "rest") {
    state.phase = "hold";
    state.timerSeconds = exercise.holdSec > 0 ? exercise.holdSec : 3;
    playPhaseCue("hold");
    renderExerciseUI(exercise);
    startCountdown(exercise);
  } else if (state.phase === "hold") {
    if (state.repCurrent >= state.repTotal) {
      state.phase = "done";
      stopTimer();
      playPhaseCue("done");
      addProgress("oralMotor", exercise.id);
      updateProgress();
      renderExerciseUI(exercise);
    } else {
      state.repCurrent++;
      state.phase = "rest";
      state.timerSeconds = 2;
      playPhaseCue("rest");
      renderExerciseUI(exercise);
      startCountdown(exercise);
    }
  }
}

function startCountdown(exercise: typeof ALL_EXERCISES[number]): void {
  state.intervalId = setInterval(() => {
    state.timerSeconds--;
    // Play countdown ticks for last 3 seconds of hold phase
    if (state.phase === "hold") {
      playCountdownTick(state.timerSeconds);
    }
    renderExerciseUI(exercise);
    if (state.timerSeconds <= 0) {
      scheduleNextPhase(exercise);
    }
  }, 1000);
}

/* ── RENDER ACTIVE EXERCISE CARD ────────── */
function renderExerciseUI(exercise: typeof ALL_EXERCISES[number]): void {
  const el = document.getElementById("oralMotorActive");
  if (!el) return;

  const phaseLabel: Record<string, string> = {
    ready: "Siap...",
    hold: "Tahan...",
    rest: "Istirahat...",
    done: "Selesai! 🎉",
  };

  const isDone = state.phase === "done";
  const isHoldOrRest = state.phase === "hold" || state.phase === "rest";
  const icon = getExerciseIcon(exercise);
  const motionClass = getExerciseMotion(exercise);

  // Side hint for limb exercises — uses user's affectedSide setting
  let sideHint = "";
  let assistedHint = "";
  if ('side' in exercise) {
    if (exercise.side === 'keduanya') {
      sideHint = "Gunakan kedua sisi.";
    } else {
      const affectedSide = localStorage.getItem('affectedSide') || 'kanan';
      const sideLabel = affectedSide === 'kanan' ? 'KANAN' : 'KIRI';
      sideHint = `Gunakan tangan/kaki ${sideLabel} (yang lemah).`;
    }
    // Assisted hint for limb exercises that support it
    if (exercise.assistedHint) {
      assistedHint = exercise.assistedHint;
    }
  }

  el.innerHTML = `
    <div class="om-active-card">
      <button class="om-active-close" onclick="window.stopOralMotorExercise()" aria-label="Tutup latihan">✕</button>
      ${motionClass ? `
      <div class="om-motion-area ${motionClass}">
        <span class="om-motion-icon">${icon}</span>
        ${motionClass === 'om-motion-up-down' ? '<span class="om-motion-arrow">↑</span>' : ''}
        ${motionClass === 'om-motion-side' ? '<span class="om-motion-arrow">←</span><span class="om-motion-arrow">→</span>' : ''}
        ${motionClass === 'om-motion-forward' ? '<span class="om-motion-arrow">→</span>' : ''}
      </div>
      ` : `<div class="om-active-icon">${icon}</div>`}
      <h3 class="om-active-name">${exercise.name}</h3>
      <p class="om-active-instruction">${chunkInstruction(exercise.instruction)}</p>
      ${sideHint ? `<p class="om-active-side">${sideHint}</p>` : ''}
      ${assistedHint ? `<p class="om-active-assist">${assistedHint}</p>` : ''}
      <p class="om-active-safety">⚠️ Lakukan semampunya. Hentikan jika terasa nyeri.</p>
      <div class="om-active-timer ${state.phase === 'hold' ? 'om-phase-hold' : ''} ${isDone ? 'om-phase-done' : ''}">
        ${isDone
          ? '<span class="om-timer-done">Selesai!</span>'
          : `<span class="om-timer-label">${phaseLabel[state.phase] || ""}</span>
             <span class="om-timer-count">${state.timerSeconds}</span>`
        }
      </div>
      <div class="om-active-reps">
        <span class="om-rep-label">Pengulangan</span>
        <span class="om-rep-count">${state.repCurrent} / ${state.repTotal}</span>
      </div>
      <div class="om-active-progress">
        <div class="om-progress-bar">
          <div class="om-progress-fill" style="width:${(state.repCurrent / state.repTotal) * 100}%"></div>
        </div>
      </div>
      ${isDone
        ? `<button class="om-btn om-btn-primary" onclick="window.startOralMotorExercise('${exercise.id}')">🔄 Ulangi</button>`
        : isHoldOrRest
          ? `<button class="om-btn om-btn-primary" disabled style="opacity:0.5;cursor:not-allowed;pointer-events:none">⏳ ${state.phase === 'hold' ? 'Tahan...' : 'Istirahat...'}</button>`
          : `<button class="om-btn om-btn-primary" onclick="window.startOralMotorExercise('${exercise.id}')">▶ Mulai</button>`
      }
      <button class="om-btn om-btn-secondary" onclick="window.openMirrorFullscreen()">🪞 Cermin Latihan</button>
    </div>
  `;

  if (window.announceToScreenReader) {
    if (isDone) {
      window.announceToScreenReader(`Latihan ${exercise.name} selesai.`);
    } else {
      window.announceToScreenReader(`${phaseLabel[state.phase]} ${state.timerSeconds} detik. Ulangan ${state.repCurrent} dari ${state.repTotal}.`);
    }
  }
}

/* ── EXERCISE FILTER STATE ──────────────── */
let activeExerciseFilter: string | null = null;

// Expose for onclick
export function setExerciseFilter(group: string): void {
  safeVibrate(15);
  activeExerciseFilter = (activeExerciseFilter === group) ? null : group;
  document.querySelectorAll<HTMLButtonElement>('.om-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.group === activeExerciseFilter);
  });
  renderOralMotorList();
}

/* ── RENDER EXERCISE FILTER BAR ─────────── */
function renderExerciseFilterBar(): string {
  const ordered = EXERCISE_GROUPS.filter(g => {
    if (g === "Otot Mulut") return ORO_MOTOR_EXERCISES.length > 0;
    return LIMB_EXERCISES.some(e => e.area === g);
  });

  if (ordered.length <= 1) return '';

  return `<div class="om-filter-bar">
    <button class="om-filter-btn ${activeExerciseFilter === null ? 'active' : ''}" data-group="" onclick="window.setExerciseFilter('')">
      <span class="om-filter-icon">📋</span>
      <span class="om-filter-label">Semua</span>
    </button>
    ${ordered.map(g => {
      const icon = EXERCISE_ICONS[g] || '💪';
      return `<button class="om-filter-btn ${activeExerciseFilter === g ? 'active' : ''}" data-group="${g}" onclick="window.setExerciseFilter('${g}')">
        <span class="om-filter-icon">${icon}</span>
        <span class="om-filter-label">${g}</span>
      </button>`;
    }).join('')}
  </div>`;
}

/* ── RENDER EXERCISE LIST ──────────────── */
export function renderOralMotorList(): void {
  const container = document.getElementById("oralMotorList");
  if (!container) return;

  // Group ALL exercises by their group/area
  const groups: Record<string, typeof ALL_EXERCISES> = {};

  // Oro-motor exercises → "Otot Mulut"
  ORO_MOTOR_EXERCISES.forEach(e => {
    const area = "Otot Mulut";
    if (!groups[area]) groups[area] = [];
    groups[area].push(e);
  });

  // Limb exercises → their area (Tangan/Kaki/Keseimbangan)
  LIMB_EXERCISES.forEach(e => {
    if (!groups[e.area]) groups[e.area] = [];
    groups[e.area].push(e);
  });

  const ordered = EXERCISE_GROUPS.filter(g => groups[g] && (!activeExerciseFilter || activeExerciseFilter === g));
  const omProgress = safeJSONParse<Record<string, number>>(localStorage.getItem('oralMotorProgress'), {});

  container.innerHTML = renderExerciseFilterBar() + ordered
    .map((groupLabel: string) => {
      const exercises = groups[groupLabel];
      const groupIcon = EXERCISE_ICONS[groupLabel] || '💪';

      return `
        <div class="om-group">
          <div class="om-group-header">
            <span class="om-group-icon">${groupIcon}</span>
            <span class="om-group-label">${groupLabel}</span>
            <span class="om-group-count">${exercises.length} latihan</span>
          </div>
          <div class="om-exercise-grid">
            ${exercises.map(ex => {
              const done = omProgress[ex.id] || 0;
              const exIcon = getExerciseIcon(ex);
              const isActive = state.exerciseId === ex.id && state.phase !== "done";
              return `
              <button class="card om-card ${done > 0 ? 'done' : ''} ${isActive ? 'om-card-active' : ''}"
                ${isActive ? 'disabled' : `onclick="window.startOralMotorExercise('${ex.id}')"`}
                aria-label="${isActive ? 'Latihan sedang berjalan' : `Mulai latihan ${ex.name}${done > 0 ? `, sudah ${done}x` : ''}`}">
                <span class="om-card-icon">${exIcon}</span>
                <span class="om-card-name">${ex.name}</span>
                <span class="om-card-info">${ex.holdSec > 0 ? `Tahan ${ex.holdSec}s` : 'Gerakan'} · ${ex.reps}x${done > 0 ? ` · ✅ ${done}x` : ''}${isActive ? ' · ⏳ berjalan' : ''}</span>
              </button>
            `}).join('')}
          </div>
        </div>
      `;
    })
    .join('');

  // Update tab description based on filter
  const subtitle = document.getElementById("oralMotorSubtitle");
  if (subtitle) {
    if (activeExerciseFilter) {
      subtitle.textContent = `Menampilkan grup: ${activeExerciseFilter}`;
    } else {
      subtitle.textContent = "Latihan otot mulut, tangan, kaki, dan keseimbangan";
    }
  }
}


