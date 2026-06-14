/**
 * tts.js — Text-to-Speech engine, voice setup, and speed control
 */

export let ttsRate = 0.85;
export let ttsPitch = parseFloat(localStorage.getItem("ttsPitch")) || 1.0;
export let voices = [];
export let selectedVoiceURI = localStorage.getItem("ttsVoice") || "";

/* ── TONE PRESETS ────────────────────────── */
const TONE_PRESETS = {
  standar: { label: "Standar", icon: "🎯", pitch: 1.0, rate: 0.85 },
  lembut:  { label: "Lembut",  icon: "🫂", pitch: 0.7, rate: 0.65 },
  ceria:   { label: "Ceria",   icon: "☀️", pitch: 1.4, rate: 1.0 },
  tegas:   { label: "Tegas",   icon: "💪", pitch: 0.8, rate: 0.75 },
  anak:    { label: "Anak",    icon: "🧒", pitch: 1.6, rate: 0.9 },
};

export function getTonePresets() {
  return TONE_PRESETS;
}

export function applyTonePreset(key) {
  const preset = TONE_PRESETS[key];
  if (!preset) return;
  ttsPitch = preset.pitch;
  ttsRate = preset.rate;
  localStorage.setItem("ttsPitch", String(ttsPitch));
  localStorage.setItem("ttsSlow", String(ttsRate < 0.7));
  localStorage.setItem("ttsTone", key);
  // Update UI
  updateToneUI(key);
  TTS.speak("Halo, saya siap");
}

function updateToneUI(activeKey) {
  // Highlight active preset
  document.querySelectorAll(".tone-preset-btn").forEach((btn) => {
    const isActive = btn.dataset.tone === activeKey;
    btn.classList.toggle("active", isActive);
  });
  // Sync pitch slider
  const pitchSlider = document.getElementById("pitchSlider");
  if (pitchSlider) {
    pitchSlider.value = String(ttsPitch);
  }
  // Sync speed button & label
  const speedBtn = document.getElementById("speedToggle");
  if (speedBtn) {
    speedBtn.textContent = ttsRate < 0.7 ? "Kecepatan: Lambat" : "Kecepatan: Normal";
  }
  const speedLabel = document.getElementById("speedVal");
  if (speedLabel) {
    speedLabel.textContent = ttsRate < 0.7 ? "Lambat" : "Normal";
  }
  // Sync pitch label
  const pitchLabel = document.getElementById("pitchVal");
  if (pitchLabel) {
    pitchLabel.textContent = ttsPitch < 0.85 ? "Rendah" : ttsPitch > 1.2 ? "Tinggi" : "Normal";
  }
}

export const TTS = {
  synth: window.speechSynthesis,
  speak(text, lang = "id-ID", callback) {
    if (this.synth.speaking || this.synth.pending) this.synth.cancel();
    setTimeout(() => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = lang;
      utt.volume = 0.85; // Volume nyaman, gak perlu setel system volume
      utt.rate = ttsRate;
      utt.pitch = ttsPitch;

      if (selectedVoiceURI) {
        const voice = voices.find((v) => v.voiceURI === selectedVoiceURI);
        if (voice) utt.voice = voice;
      }

      const vis = document.getElementById("audioVis");
      if (vis) vis.classList.add("active");

      utt.onend = () => {
        if (vis) vis.classList.remove("active");
        if (callback) callback();
      };

      this.synth.speak(utt);
    }, 80);
  },
};

/* ── MAPPING PENGUCAPAN ALFABET ──────────── */
// Ejaan huruf tunggal sesuai Bahasa Indonesia baku (EYD).
// Tanpa aksen/diakritik agar kompatibel dengan semua engine TTS.
// Suara Bahasa Indonesia (id-ID) sudah mengenali ejaan ini.
const ALPHABET_PRONUNCIATION = {
  "A": "A",   "B": "Be",  "C": "Ce",  "D": "De",  "E": "E",
  "F": "Ef",  "G": "Ge",  "H": "Ha",  "I": "I",   "J": "Je",
  "K": "Ka",  "L": "El",  "M": "Em",  "N": "En",  "O": "O",
  "P": "Pe",  "Q": "Ki",  "R": "Er",  "S": "Es",  "T": "Te",
  "U": "U",   "V": "Fe",  "W": "We",  "X": "Eks", "Y": "Ye",
  "Z": "Zet"
};

function isSingleLetter(text) {
  return /^[A-Za-z]$/.test(text);
}

export function normalizeText(text) {
  if (isSingleLetter(text)) {
    const upper = text.toUpperCase();
    return ALPHABET_PRONUNCIATION[upper] || text;
  }
  return text;
}

/**
 * Speak text — normalisasi huruf tunggal dulu
 */
export function speakText(text, lang = "id-ID", callback) {
  const normalized = normalizeText(text);
  TTS.speak(normalized, lang, callback);
}

/* ── VOICE SETUP ────────────────────────── */
/**
 * Ubah nama voice jadi label sederhana + ikon
 * Contoh: "Microsoft Toni - Indonesian (Indonesia)" → "Toni (Microsoft) ♂"
 */
function friendlyVoiceName(v) {
  const n = v.name;
  let label = n
    // Bersihkan info bahasa/kualitas dari nama
    .replace(/\s*[-–]\s*Indonesian.*$/i, '')
    .replace(/\s*\(Indonesia\)\s*/i, '')
    .replace(/Indonesian\(Indonesia\)/i, '')
    .replace(/Bahasa\(Indonesia\)/i, '')
    .trim();
  
  // Ikon gender / tipe suara
  let icon = "🎤";
  const low = n.toLowerCase();
  if (low.includes("female") || low.includes("wanita") || low.includes("perempuan")) icon = "♀️";
  else if (low.includes("male") || low.includes("pria") || low.includes("laki")) icon = "♂️";
  
  // Kualitas cloud
  const cloud = !v.localService ? " ✦" : "";
  
  return `${icon} ${label}${cloud}`;
}

function populateVoices() {
  const newVoices = TTS.synth.getVoices();
  if (!newVoices || newVoices.length === 0) return false;
  
  voices = newVoices;
  const select = document.getElementById("voiceSelect");
  if (!select) return true;

  // Ambil & urutkan hanya suara Bahasa Indonesia
  const idVoices = voices
    .filter((v) => v.lang.startsWith("id"))
    .sort((a, b) => {
      // Cloud (non-local) lebih bagus → prioritaskan
      if (a.localService !== b.localService) return a.localService ? 1 : -1;
      // Premium/enhanced lebih bagus
      const aP = a.name.toLowerCase().includes("premium") || a.name.toLowerCase().includes("enhanced");
      const bP = b.name.toLowerCase().includes("premium") || b.name.toLowerCase().includes("enhanced");
      if (aP !== bP) return aP ? -1 : 1;
      // Google voices populer
      const aG = a.name.toLowerCase().includes("google");
      const bG = b.name.toLowerCase().includes("google");
      if (aG !== bG) return aG ? -1 : 1;
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
    : `<option value="" disabled>${voices.length ? "Tidak ada suara Indonesia" : "Memuat suara..."}</option>`;

  // Validasi: jika suara tersimpan tidak ada di daftar Indonesia, reset ke default
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
  
  return true;
}

export function setupVoices() {
  // Coba langsung
  let hasVoices = populateVoices();

  // Mobile Chrome kadang telat -> polling + onvoiceschanged
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoices;
  }

  // Fallback: polling setiap 300ms sampai voices tersedia (max 5s)
  if (!hasVoices) {
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      const ok = populateVoices();
      if (ok || attempts > 15) clearInterval(poll);
    }, 300);
  }

  document.getElementById("voiceSelect")?.addEventListener("change", (e) => {
    selectedVoiceURI = e.target.value;
    localStorage.setItem("ttsVoice", selectedVoiceURI);
    TTS.speak("Halo");
  });
}

/* ── REFRESH VOICE ─────────────────────── */
export function refreshVoices() {
  populateVoices();
  const select = document.getElementById("voiceSelect");
  if (select) {
    if (selectedVoiceURI && select.querySelector(`option[value="${selectedVoiceURI}"]`)) {
      select.value = selectedVoiceURI;
    }
  }
}

/* ── PITCH & TONE ───────────────────────── */
export function setupPitch() {
  const slider = document.getElementById("pitchSlider");
  const label = document.getElementById("pitchVal");
  if (!slider) return;

  // Load saved pitch
  slider.value = String(ttsPitch);
  if (label) {
    label.textContent = ttsPitch < 0.85 ? "Rendah" : ttsPitch > 1.2 ? "Tinggi" : "Normal";
  }

  slider.addEventListener("input", () => {
    const val = parseFloat(slider.value);
    ttsPitch = val;
    localStorage.setItem("ttsPitch", String(val));
    // Clear tone preset selection (user customized)
    document.querySelectorAll(".tone-preset-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    if (label) {
      label.textContent = val < 0.85 ? "Rendah" : val > 1.2 ? "Tinggi" : "Normal";
    }
    // Preview
    TTS.speak("Halo");
  });
}

/* ── RESTORE TONE ────────────────────────── */
export function restoreTone() {
  const savedTone = localStorage.getItem("ttsTone");
  if (savedTone && TONE_PRESETS[savedTone]) {
    applyTonePreset(savedTone);
  }
}

/* ── SPEED ──────────────────────────────── */
export function setupSpeed() {
  const btn = document.getElementById("speedToggle");
  if (!btn) return;
  const isSlow = localStorage.getItem("ttsSlow") === "true";
  applySpeed(isSlow);
  btn.addEventListener("click", () => {
    const newSlow = ttsRate >= 0.8;
    localStorage.setItem("ttsSlow", String(newSlow));
    applySpeed(newSlow);
    TTS.speak("Halo");
  });
}

export function applySpeed(isSlow) {
  ttsRate = isSlow ? 0.5 : 0.85;
  const btn = document.getElementById("speedToggle");
  if (btn) btn.textContent = isSlow ? "Kecepatan: Lambat" : "Kecepatan: Normal";
  const label = document.getElementById("speedVal");
  if (label) label.textContent = isSlow ? "Lambat" : "Normal";
}