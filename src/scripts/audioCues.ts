/**
 * audioCues.ts — Audio cues for guided exercise transitions
 *
 * Generates short beep sounds using the Web Audio API so patients can follow
 * exercise rhythms without constantly looking at the screen.
 *
 * Cue types:
 * - hold: medium-high beep (660Hz, 120ms) — signals "start holding"
 * - rest: lower beep (330Hz, 80ms) — signals "rest now"
 * - done: three ascending beeps (C5→E5→G5) — celebration
 * - countdownTick: soft short tick (440Hz, 40ms) — last 3 seconds
 * - countdownLast: higher tick (880Hz, 50ms) — final second
 */

const STORAGE_KEY = "audioCuesEnabled";

let audioCtx: AudioContext | null = null;
let enabled = localStorage.getItem(STORAGE_KEY) !== "false"; // default: ON

/** Lazy-init AudioContext (must happen after user gesture) */
function getCtx(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (mobile browsers)
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** Play a single beep tone */
function beep(
  frequency: number,
  durationMs: number,
  volume: number = 0.15,
  type: OscillatorType = "sine",
): void {
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Quick fade-in/out to avoid clicks
    const now = ctx.currentTime;
    const dur = durationMs / 1000;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.005);
    gain.gain.setValueAtTime(volume, now + dur - 0.01);
    gain.gain.linearRampToValueAtTime(0, now + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + dur + 0.01);
  } catch {
    // Silently fail — audio cues are non-critical
  }
}

/** Play a sequence of beeps with gaps */
function beepSequence(
  tones: Array<{ freq: number; dur: number }>,
  gapMs: number = 80,
  volume: number = 0.15,
): void {
  const ctx = getCtx();
  if (!ctx) return;

  let offset = ctx.currentTime;
  tones.forEach(({ freq, dur }) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, offset);

      const durSec = dur / 1000;
      gain.gain.setValueAtTime(0, offset);
      gain.gain.linearRampToValueAtTime(volume, offset + 0.005);
      gain.gain.setValueAtTime(volume, offset + durSec - 0.01);
      gain.gain.linearRampToValueAtTime(0, offset + durSec);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(offset);
      osc.stop(offset + durSec + 0.01);
    } catch {
      // Silently fail
    }
    offset += (dur + gapMs) / 1000;
  });
}

/* ── PUBLIC API ────────────────────────── */

/** Play the appropriate cue for a phase transition */
export function playPhaseCue(phase: "hold" | "rest" | "done"): void {
  if (!enabled) return;

  switch (phase) {
    case "hold":
      // Medium-high beep: "get ready to hold"
      beep(660, 120, 0.18, "sine");
      break;
    case "rest":
      // Lower, shorter beep: "rest now"
      beep(330, 80, 0.12, "sine");
      break;
    case "done":
      // Three ascending celebration beeps: C5 → E5 → G5
      beepSequence(
        [
          { freq: 523, dur: 100 },
          { freq: 659, dur: 100 },
          { freq: 784, dur: 150 },
        ],
        80,
        0.18,
      );
      break;
  }
}

/** Play countdown ticks for the last 3 seconds */
export function playCountdownTick(secondsLeft: number): void {
  if (!enabled) return;
  if (secondsLeft <= 0) return; // Don't tick at zero — phase cue handles the transition

  if (secondsLeft === 1) {
    // Final tick: higher pitch
    beep(880, 50, 0.2, "triangle");
  } else if (secondsLeft <= 3) {
    // Soft tick for seconds 2-3
    beep(440, 40, 0.1, "triangle");
  }
}

/* ── SETTINGS TOGGLE ───────────────────── */

export function isAudioCuesEnabled(): boolean {
  return enabled;
}

export function setAudioCuesEnabled(on: boolean): void {
  enabled = on;
  localStorage.setItem(STORAGE_KEY, String(on));

  // Update toggle pill
  const pill = document.getElementById("audioCuesPill");
  if (pill) {
    pill.textContent = on ? "ON" : "OFF";
    pill.classList.toggle("on", on);
  }

  // Lazy-init AudioContext when turning on (needs user gesture)
  if (on) {
    try {
      if (!audioCtx || audioCtx.state === "closed") {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    } catch {
      // Silently fail
    }
  }
}

export function loadAudioCuesSetting(): void {
  const saved = localStorage.getItem(STORAGE_KEY);
  enabled = saved !== "false"; // default ON

  const pill = document.getElementById("audioCuesPill");
  if (pill) {
    pill.textContent = enabled ? "ON" : "OFF";
    pill.classList.toggle("on", enabled);
  }
}

/**
 * Warm up AudioContext on first user interaction.
 * Call this once early (e.g., from app.ts init or first click handler).
 */
export function initAudioCues(): void {
  loadAudioCuesSetting();

  // Pre-warm AudioContext on first user interaction
  const warmUp = (): void => {
    if (!enabled) return;
    getCtx(); // lazy-inits and resumes
    document.removeEventListener("click", warmUp);
    document.removeEventListener("touchstart", warmUp);
    document.removeEventListener("keydown", warmUp);
  };

  document.addEventListener("click", warmUp, { once: true });
  document.addEventListener("touchstart", warmUp, { once: true });
  document.addEventListener("keydown", warmUp, { once: true });
}
