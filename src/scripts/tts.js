/**
 * tts.js — Text-to-Speech engine, voice setup, and speed control
 */

export let ttsRate = 0.85;
export let voices = [];
export let selectedVoiceURI = localStorage.getItem("ttsVoice") || "";

export const TTS = {
  synth: window.speechSynthesis,
  speak(text, lang = "id-ID", callback) {
    if (this.synth.speaking || this.synth.pending) this.synth.cancel();
    setTimeout(() => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = lang;
      utt.rate = ttsRate;
      utt.pitch = 1.05;

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

/**
 * Speak text with haptic feedback and callback.
 * Low-level: does NOT update progress or card UI.
 */
export function speakText(text, lang = "id-ID", callback) {
  TTS.speak(text, lang, callback);
}

/* ── VOICE SETUP ────────────────────────── */
export function setupVoices() {
  const populate = () => {
    voices = TTS.synth.getVoices();
    const select = document.getElementById("voiceSelect");
    if (!select || voices.length === 0) return;

    const score = (v) => {
      let s = 0;
      const name = v.name.toLowerCase();
      if (name.includes("premium") || name.includes("enhanced")) s += 10;
      if (name.includes("google")) s += 5;
      if (!v.localService) s += 3;
      return s;
    };

    const idVoices = voices.filter((v) => v.lang.startsWith("id"));
    const otherVoices = voices.filter((v) => !v.lang.startsWith("id"));

    idVoices.sort((a, b) => score(b) - score(a));
    otherVoices.sort((a, b) => score(b) - score(a));

    const buildOptions = (list) =>
      list
        .map(
          (v) =>
            `<option value="${v.voiceURI}" ${v.voiceURI === selectedVoiceURI ? "selected" : ""}>` +
            `${v.name} (${v.lang})${!v.localService ? " ✦" : ""}</option>`,
        )
        .join("");

    select.innerHTML =
      (idVoices.length
        ? `<optgroup label="Bahasa Indonesia">${buildOptions(idVoices)}</optgroup>`
        : "") +
      (otherVoices.length
        ? `<optgroup label="Bahasa Lain">${buildOptions(otherVoices)}</optgroup>`
        : "");

    if (!selectedVoiceURI) {
      const best = idVoices[0] || otherVoices[0];
      if (best) {
        selectedVoiceURI = best.voiceURI;
        select.value = selectedVoiceURI;
        localStorage.setItem("ttsVoice", selectedVoiceURI);
      }
    }
  };

  populate();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populate;
  }

  document.getElementById("voiceSelect")?.addEventListener("change", (e) => {
    selectedVoiceURI = e.target.value;
    localStorage.setItem("ttsVoice", selectedVoiceURI);
    TTS.speak("Halo");
  });
}

/* ── SPEED ──────────────────────────────── */
export function setupSpeed() {
  const btn = document.getElementById("speedToggle");
  if (!btn) return;
  const isSlow = localStorage.getItem("ttsSlow") === "true";
  applySpeed(isSlow);
  btn.addEventListener("click", () => {
    const newSlow = ttsRate === 0.85;
    localStorage.setItem("ttsSlow", String(newSlow));
    applySpeed(newSlow);
  });
}

export function applySpeed(isSlow) {
  ttsRate = isSlow ? 0.5 : 0.85;
  const btn = document.getElementById("speedToggle");
  if (btn) btn.textContent = isSlow ? "Kecepatan: Lambat" : "Kecepatan: Normal";
}
