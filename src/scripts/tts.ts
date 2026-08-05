/**
 * tts.ts — Text-to-Speech engine (improved)
 *
 * Features:
 * - Speech queue with interrupt / chain modes
 * - Chunked speaking for long texts (no more Chrome 15s bug)
 * - Word-boundary visual sync (audioVis bars react per word)
 * - Pre-warm on first user interaction (no more first-speech delay)
 * - onerror recovery with retry fallback
 * - isSpeaking() / stopAll() / cancel() exposed
 * - Voice quality scoring (Google Cloud > Premium > Enhanced > local)
 */

// ─── TYPES ──────────────────────────────
export interface VoiceInfo {
  name: string;
  voiceURI: string;
  lang: string;
  localService: boolean;
  default: boolean;
  quality: number; // 0 = low, 1 = enhanced, 2 = premium, 3 = cloud/google
}

export interface TonePreset {
  label: string;
  icon: string;
  pitch: number;
  rate: number;
}

export type SpeechCancelToken = { cancelled: boolean };

export interface SpeechOptions {
  lang?: string;
  callback?: () => void;
  rawMode?: boolean;
  /** If true, cancel current speech before speaking. Default: true */
  interrupt?: boolean;
  /** Cancel token for external cancellation */
  cancelToken?: SpeechCancelToken;
}

// ─── STATE ──────────────────────────────
export let ttsRate = 0.85;
export let ttsPitch: number = parseFloat(localStorage.getItem("ttsPitch") ?? "1.0");
export let voices: VoiceInfo[] = [];
export let selectedVoiceURI: string = localStorage.getItem("ttsVoice") || "";
let isPreWarmed = false;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentCancelToken: SpeechCancelToken | null = null;
let speakingActive = false;

/* ── TONE PRESETS ────────────────────────── */
const TONE_PRESETS: Record<string, TonePreset> = {
  standar: { label: "Standar", icon: "🎯", pitch: 1.0, rate: 0.85 },
  lembut:  { label: "Lembut",  icon: "🫂", pitch: 0.7, rate: 0.65 },
  ceria:   { label: "Ceria",   icon: "☀️", pitch: 1.4, rate: 1.0 },
  tegas:   { label: "Tegas",   icon: "💪", pitch: 0.8, rate: 0.75 },
  anak:    { label: "Anak",    icon: "🧒", pitch: 1.6, rate: 0.9 },
};

export function getTonePresets(): Record<string, TonePreset> {
  return TONE_PRESETS;
}

export function applyTonePreset(key: string): void {
  const preset = TONE_PRESETS[key];
  if (!preset) return;
  ttsPitch = preset.pitch;
  ttsRate = preset.rate;
  localStorage.setItem("ttsPitch", String(ttsPitch));
  localStorage.setItem("ttsSlow", String(ttsRate < 0.7));
  localStorage.setItem("ttsTone", key);
  updateToneUI(key);
}

function updateToneUI(activeKey: string): void {
  document.querySelectorAll<HTMLButtonElement>(".tone-preset-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tone === activeKey);
  });
  const pitchSlider = document.getElementById("pitchSlider") as HTMLInputElement | null;
  if (pitchSlider) pitchSlider.value = String(ttsPitch);
  const speedBtn = document.getElementById("speedToggle");
  if (speedBtn) speedBtn.textContent = ttsRate < 0.7 ? "Kecepatan: Lambat" : "Kecepatan: Normal";
  const speedLabel = document.getElementById("speedVal");
  if (speedLabel) speedLabel.textContent = ttsRate < 0.7 ? "Lambat" : "Normal";
  const pitchLabel = document.getElementById("pitchVal");
  if (pitchLabel) pitchLabel.textContent = ttsPitch < 0.85 ? "Rendah" : ttsPitch > 1.2 ? "Tinggi" : "Normal";
}

// ─── VOICE QUALITY SCORING ──────────────
function scoreVoiceQuality(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  let score = 0;
  // Cloud/non-local voices are best
  if (!v.localService) score += 3;
  // Google voices are high quality
  if (n.includes("google")) score += 2;
  // Premium/enhanced voices
  if (n.includes("premium") || n.includes("enhanced")) score += 1;
  // Wavenet voices (Google Cloud)
  if (n.includes("wavenet")) score += 1;
  return score;
}

// ─── TTS ENGINE ──────────────────────────
export const TTS = {
  synth: window.speechSynthesis,

  /** Check if speech is currently active */
  get isSpeaking(): boolean {
    return speakingActive;
  },

    /**
   * Speak text with full control over queue behavior.
   * - interrupt=true (default): cancels current speech then speaks
   * - interrupt=false: waits for current speech to finish then speaks
   */
  speak(text: string, lang: string = "id-ID", callback?: () => void, interrupt: boolean = true, cancelToken?: SpeechCancelToken): void {
    if (!text || text.trim().length === 0) {
      if (callback) callback();
      return;
    }

    // Pre-warm if not done yet
    if (!isPreWarmed) preWarm();

    if (interrupt) {
      this.stopAll();
    } else if (this.synth.speaking || this.synth.pending) {
      // Queue mode: wait for current to finish (max 30s timeout)
      const startedAt = Date.now();
      const checkAndSpeak = (): void => {
        if (cancelToken?.cancelled) return;
        if (Date.now() - startedAt > 30000) {
          // Timeout — force speak anyway
          TTS.synth.cancel();
          setTimeout(() => doSpeak(text, lang, callback, cancelToken), 50);
          return;
        }
        if (this.synth.speaking || this.synth.pending) {
          setTimeout(checkAndSpeak, 80);
          return;
        }
        doSpeak(text, lang, callback, cancelToken);
      };
      setTimeout(checkAndSpeak, 80);
      return;
    }

    doSpeak(text, lang, callback, cancelToken);
  },

  /** Stop all speech immediately and clean up */
  stopAll(): void {
    try {
      this.synth.cancel();
    } catch { /* ignore */ }
    speakingActive = false;
    currentUtterance = null;
    if (currentCancelToken) {
      currentCancelToken.cancelled = true;
      currentCancelToken = null;
    }
    hideAudioVis();
  },

  /** Cancel current + future utterances */
  cancel(): void {
    this.stopAll();
  },
};

// ─── TEXT SPLITTER ──────────────────────
/** Pecah teks panjang menjadi chunk per kalimat/frasa (maks ~12 kata per chunk). */
function splitIntoChunks(text: string): string[] {
  // Split by sentence-ending punctuation
  const raw = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];

  for (const part of raw) {
    const words = part.split(/\s+/).filter(Boolean);
    if (words.length <= 12) {
      if (part.trim()) chunks.push(part.trim());
    } else {
      // Further split by comma / semicolon
      const subs = part.split(/(?<=[,;])\s+/);
      for (const sub of subs) {
        const sw = sub.split(/\s+/).filter(Boolean);
        if (sw.length <= 10) {
          if (sub.trim()) chunks.push(sub.trim());
        } else {
          // Hard split every ~8 words
          for (let i = 0; i < sw.length; i += 8) {
            const c = sw.slice(i, i + 8).join(' ');
            if (c) chunks.push(c);
          }
        }
      }
    }
  }

  return chunks.length > 0 ? chunks : [text];
}

// ─── CORE SPEECH LOGIC ──────────────────
function doSpeak(
  text: string,
  lang: string,
  callback?: () => void,
  cancelToken?: SpeechCancelToken,
): void {
  // Race condition guard: flush any lingering synth state
  try {
    if (TTS.synth.speaking || TTS.synth.pending) TTS.synth.cancel();
  } catch { /* ignore */ }

  const totalWords = text.split(/\s+/).filter(Boolean).length;

  setTimeout(() => {
    if (cancelToken?.cancelled) return;

    // Long text → use chunked speaking to avoid Chrome 15s timeout
    if (totalWords > 8) {
      speakChunked(text, lang, callback, cancelToken);
      return;
    }

    // Short text → single utterance
    speakSingle(text, lang, callback, cancelToken, 0, totalWords);
  }, 50);
}

/**
 * Speak a single utterance.
 *
 * @param skipFinishCleanup — If true, onend/onerror won't call finish() or
 *   hideAudioVis. Used by speakChunked for intermediate chunks so audioVis stays
 *   active and speakChunked manages its own lifecycle.
 */
function speakSingle(
  text: string,
  lang: string,
  callback: (() => void) | undefined,
  cancelToken: SpeechCancelToken | undefined,
  wordOffset: number,
  totalWords: number,
  skipFinishCleanup: boolean = false,
): void {
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  utt.volume = 0.85;
  utt.rate = ttsRate;
  utt.pitch = ttsPitch;

  if (selectedVoiceURI) {
    const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === selectedVoiceURI);
    if (voice) utt.voice = voice;
  }

  currentUtterance = utt;
  currentCancelToken = cancelToken ?? null;
  speakingActive = true;
  showAudioVis();

  // ── onboundary: word-level visual sync ──
  let wordCount = wordOffset;
  utt.onboundary = (e) => {
    if (cancelToken?.cancelled) { TTS.stopAll(); return; }
    if (e.name === "word") {
      wordCount++;
      pulseAudioVis(wordCount, totalWords);
    }
  };

  // ── onerror ──
  utt.onerror = (e) => {
    if (cancelToken?.cancelled) return;
    if (e.error === "interrupted") {
      if (!TTS.synth.speaking) {
        if (skipFinishCleanup) { if (callback) callback(); }
        else finish(callback, cancelToken);
      }
      return;
    }
    console.warn("[TTS] utterance error:", e.error, e.message || "");
    if (text.length > 0) {
      setTimeout(() => {
        if (cancelToken?.cancelled) return;
        if (!skipFinishCleanup) finish(undefined, cancelToken);
        speakSingle(text, lang, callback, cancelToken, wordOffset, totalWords, skipFinishCleanup);
      }, 300);
    } else {
      if (skipFinishCleanup) { if (callback) callback(); }
      else finish(callback, cancelToken);
    }
  };

  // ── onend ──
  utt.onend = () => {
    if (skipFinishCleanup) {
      // Chunked mode: just fire callback, keep audioVis & speakingActive alive
      if (callback) callback();
    } else {
      finish(callback, cancelToken);
    }
  };

  try {
    TTS.synth.speak(utt);
  } catch {
    if (skipFinishCleanup) { if (callback) callback(); }
    else finish(callback, cancelToken);
  }
}

/** Speak long text by splitting into chunks and speaking sequentially. */
function speakChunked(
  text: string,
  lang: string,
  callback?: () => void,
  cancelToken?: SpeechCancelToken,
): void {
  const chunks = splitIntoChunks(text);
  if (chunks.length <= 1) {
    // Fallback: single utterance
    speakSingle(text, lang, callback, cancelToken, 0, text.split(/\s+/).filter(Boolean).length);
    return;
  }

  currentCancelToken = cancelToken ?? null;
  speakingActive = true;
  showAudioVis();

  const totalWords = text.split(/\s+/).filter(Boolean).length;
  let chunkIndex = 0;
  let wordOffset = 0;

  function speakNext(): void {
    if (cancelToken?.cancelled) {
      finish(callback, cancelToken);
      return;
    }

    if (chunkIndex >= chunks.length) {
      finish(callback, cancelToken);
      return;
    }

    const chunkText = chunks[chunkIndex];
    const chunkWords = chunkText.split(/\s+/).filter(Boolean).length;
    const currentOffset = wordOffset;
    const isLastChunk = chunkIndex === chunks.length - 1;

    // Intermediate chunks: skip finish() so audioVis & speakingActive stay alive.
    // Final chunk: goes through normal finish() for full cleanup.
    speakSingle(
      chunkText,
      lang,
      () => {
        if (cancelToken?.cancelled) return;
        chunkIndex++;
        wordOffset += chunkWords;
        if (isLastChunk) {
          finish(callback, cancelToken);
        } else {
          // Natural pause between chunks (shorter for comma splits)
          const delay = chunkText.endsWith(',') || chunkText.endsWith(';') ? 100 : 200;
          setTimeout(speakNext, delay);
        }
      },
      cancelToken,
      currentOffset,
      totalWords,
      !isLastChunk, // skipFinishCleanup for non-final chunks
    );
  }

  speakNext();
}

function finish(callback?: () => void, cancelToken?: SpeechCancelToken, wasCancelled: boolean = false): void {
  speakingActive = false;
  currentUtterance = null;
  hideAudioVis();
  if (wasCancelled && cancelToken) cancelToken.cancelled = true;
  if (callback) callback();
}

// ─── AUDIO VISUALIZER ───────────────────
function showAudioVis(): void {
  const vis = document.getElementById("audioVis");
  if (vis) {
    vis.classList.add("active");
    // Reset all bars
    vis.querySelectorAll("span").forEach(b => {
      (b as HTMLElement).style.transform = "scaleY(0.4)";
    });
  }
}

function hideAudioVis(): void {
  const vis = document.getElementById("audioVis");
  if (vis) vis.classList.remove("active");
}

function pulseAudioVis(wordIndex: number, totalWords: number): void {
  const vis = document.getElementById("audioVis");
  if (!vis) return;
  const bars = vis.querySelectorAll("span");
  if (bars.length === 0) return;
  // Map word progress to a bar index
  const pct = totalWords > 1 ? wordIndex / totalWords : 0.5;
  const barIdx = Math.min(bars.length - 1, Math.floor(pct * bars.length));
  bars.forEach((b, i) => {
    (b as HTMLElement).style.transform = i <= barIdx ? "scaleY(1)" : "scaleY(0.4)";
  });
}

// ─── PRE-WARM ENGINE ────────────────────
function preWarm(): void {
  if (isPreWarmed) return;
  isPreWarmed = true;
  try {
    // Speak a zero-width space to wake up the speech engine
    const dummy = new SpeechSynthesisUtterance("\u200B");
    dummy.volume = 0;
    dummy.rate = 10; // Fastest possible
    TTS.synth.speak(dummy);
    // Cancel immediately — just needed to initialize the audio pipeline
    setTimeout(() => {
      try { TTS.synth.cancel(); } catch { /* ignore */ }
    }, 10);
  } catch {
    isPreWarmed = false;
  }
}

// ─── PUBLIC API ──────────────────────────
/** Check if speech synthesis is currently active */
export function isSpeaking(): boolean {
  return speakingActive;
}

/** Stop all speech and clean up */
export function stopAllSpeech(): void {
  TTS.stopAll();
}

/** Create a cancel token that can be used to cancel speech externally */
export function createCancelToken(): SpeechCancelToken {
  return { cancelled: false };
}

/* ── MAPPING PENGUCAPAN ALFABET ──────────── */
const ALPHABET_PRONUNCIATION: Record<string, string> = {
  "A": "a", "B": "be", "C": "ce", "D": "de", "E": "e",
  "F": "ef", "G": "ge", "H": "ha", "I": "i", "J": "je",
  "K": "ka", "L": "el", "M": "em", "N": "en", "O": "o",
  "P": "pe", "Q": "ki", "R": "er", "S": "es", "T": "te",
  "U": "u", "V": "ve", "W": "we", "X": "eks", "Y": "ye",
  "Z": "zet"
};

function isSingleLetter(text: string): boolean {
  return /^[A-Za-z]$/.test(text);
}

export function normalizeText(text: string): string {
  if (isSingleLetter(text)) {
    const upper = text.toUpperCase();
    return ALPHABET_PRONUNCIATION[upper] || text;
  }
  return text;
}

/**
 * Speak text with normalisasi huruf tunggal. Options:
 * - lang: "id-ID" default
 * - callback: called when speech ends
 * - rawMode: skip normalization (for vokal)
 * - interrupt: cancel previous before speaking (default true)
 * - cancelToken: external cancellation token
 */
export function speakText(
  text: string,
  lang: string = "id-ID",
  callback?: () => void,
  rawMode: boolean = false,
  interrupt: boolean = true,
  cancelToken?: SpeechCancelToken,
): void {
  const normalized = rawMode ? text : normalizeText(text);
  TTS.speak(normalized, lang, callback, interrupt, cancelToken);
}

/* ── VOICE SETUP ────────────────────────── */
function friendlyVoiceName(v: SpeechSynthesisVoice): string {
  const n = v.name;
  let label = n
    .replace(/\s*[-–]\s*Indonesian.*$/i, '')
    .replace(/\s*\(Indonesia\)\s*/i, '')
    .replace(/Indonesian\(Indonesia\)/i, '')
    .replace(/Bahasa\(Indonesia\)/i, '')
    .trim();
  
  let icon = "🎤";
  const low = n.toLowerCase();
  if (low.includes("female") || low.includes("wanita") || low.includes("perempuan")) icon = "♀️";
  else if (low.includes("male") || low.includes("pria") || low.includes("laki")) icon = "♂️";
  
  // Quality badges
  let quality = "";
  if (!v.localService) {
    if (n.toLowerCase().includes("wavenet")) quality = " ⭐⭐";
    else if (n.toLowerCase().includes("google")) quality = " ⭐";
    else quality = " ✦";
  } else if (n.toLowerCase().includes("premium") || n.toLowerCase().includes("enhanced")) {
    quality = " ◈";
  }
  
  return `${icon} ${label}${quality}`;
}

function populateVoices(): boolean {
  const newVoices = TTS.synth.getVoices();
  if (!newVoices || newVoices.length === 0) return false;
  
  voices = newVoices.map(v => ({
    name: v.name,
    voiceURI: v.voiceURI,
    lang: v.lang,
    localService: v.localService,
    default: v.default,
    quality: scoreVoiceQuality(v),
  }));
  const select = document.getElementById("voiceSelect") as HTMLSelectElement | null;
  if (!select) return true;

  const idVoices = newVoices
    .filter((v) => v.lang.startsWith("id"))
    .sort((a, b) => {
      // Quality score first (descending)
      const qDiff = scoreVoiceQuality(b) - scoreVoiceQuality(a);
      if (qDiff !== 0) return qDiff;
      // Then local (non-local first)
      if (a.localService !== b.localService) return a.localService ? 1 : -1;
      // Then premium/enhanced
      const aP = a.name.toLowerCase().includes("premium") || a.name.toLowerCase().includes("enhanced");
      const bP = b.name.toLowerCase().includes("premium") || b.name.toLowerCase().includes("enhanced");
      if (aP !== bP) return aP ? -1 : 1;
      return 0;
    });

  select.innerHTML = idVoices.length
    ? idVoices
        .map(
          (v) =>
            `<option value="${v.voiceURI}" ${v.voiceURI === selectedVoiceURI ? "selected" : ""}>` +
            `${friendlyVoiceName(v)}</option>`,
        )
        .join("")
    : `<option value="" disabled>${newVoices.length ? "Tidak ada suara Indonesia" : "Memuat suara..."}</option>`;

  if (idVoices.length) {
    const stillExists = idVoices.some(v => v.voiceURI === selectedVoiceURI);
    if (!selectedVoiceURI || !stillExists) {
      selectedVoiceURI = idVoices[0].voiceURI;
      localStorage.setItem("ttsVoice", selectedVoiceURI);
    }
  }
  if (select.value !== selectedVoiceURI) {
    select.value = selectedVoiceURI;
  }

  // Show voice count in settings (only when voices are available)
  const hint = document.querySelector(".voice-hint") as HTMLElement | null;
  if (hint && idVoices.length > 0) {
    hint.textContent = `♀️ perempuan · ♂️ laki-laki · ⭐ Google Cloud · ◈ Premium · ${idVoices.length} suara Indonesia (${newVoices.length} total)`;
  }
  
  return true;
}

export function setupVoices(): void {
  let hasVoices = populateVoices();

  if ((window.speechSynthesis as any).onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = populateVoices;
  }

  if (!hasVoices) {
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      const ok = populateVoices();
      if (ok || attempts > 15) clearInterval(poll);
    }, 300);
  }

  document.getElementById("voiceSelect")?.addEventListener("change", (e) => {
    selectedVoiceURI = (e.target as HTMLSelectElement).value;
    localStorage.setItem("ttsVoice", selectedVoiceURI);
  });
}

/* ── REFRESH VOICE ─────────────────────── */
export function refreshVoices(): void {
  populateVoices();
  const select = document.getElementById("voiceSelect") as HTMLSelectElement | null;
  if (select) {
    if (selectedVoiceURI && select.querySelector(`option[value="${selectedVoiceURI}"]`)) {
      select.value = selectedVoiceURI;
    }
  }
}

/* ── PITCH & TONE ───────────────────────── */
export function setupPitch(): void {
  const slider = document.getElementById("pitchSlider") as HTMLInputElement | null;
  const label = document.getElementById("pitchVal");
  if (!slider) return;

  slider.value = String(ttsPitch);
  if (label) {
    label.textContent = ttsPitch < 0.85 ? "Rendah" : ttsPitch > 1.2 ? "Tinggi" : "Normal";
  }

  slider.addEventListener("input", () => {
    const val = parseFloat(slider.value);
    ttsPitch = val;
    localStorage.setItem("ttsPitch", String(val));
    document.querySelectorAll<HTMLButtonElement>(".tone-preset-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    if (label) {
      label.textContent = val < 0.85 ? "Rendah" : val > 1.2 ? "Tinggi" : "Normal";
    }
  });
}

/* ── RESTORE TONE ────────────────────────── */
export function restoreTone(): void {
  const savedTone = localStorage.getItem("ttsTone");
  if (savedTone && TONE_PRESETS[savedTone]) {
    applyTonePreset(savedTone);
  }
}

/* ── SPEED ──────────────────────────────── */
export function setupSpeed(): void {
  const btn = document.getElementById("speedToggle");
  if (!btn) return;
  const isSlow = localStorage.getItem("ttsSlow") === "true";
  applySpeed(isSlow);
  btn.addEventListener("click", () => {
    const newSlow = ttsRate >= 0.8;
    localStorage.setItem("ttsSlow", String(newSlow));
    applySpeed(newSlow);
  });
}

export function applySpeed(isSlow: boolean): void {
  ttsRate = isSlow ? 0.5 : 0.85;
  const btn = document.getElementById("speedToggle");
  if (btn) btn.textContent = isSlow ? "Kecepatan: Lambat" : "Kecepatan: Normal";
  const label = document.getElementById("speedVal");
  if (label) label.textContent = isSlow ? "Lambat" : "Normal";
}
