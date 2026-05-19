// src/scripts/app.js
import { ALPHABET, WORDS, SENTENCES, NUMBERS, VOKAL } from "../data/content.js";

let ttsRate = 0.85;
let voices = [];
let selectedVoiceURI = localStorage.getItem("ttsVoice") || "";

const TTS = {
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

window.addEventListener("load", initApp);

function initApp() {
  setupSpeed();
  setupVoices();
  setupSettings();
  setupModeAndAccessibility();
  renderContent();
  loadCustomCards();
  updateProgress();
}

/* ── SETTINGS POPUP ─────────────────────── */
function setupSettings() {
  const btn = document.getElementById("btnSettings");
  const popup = document.getElementById("settingsPopup");
  if (!btn || !popup) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    popup.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target) && e.target !== btn) {
      popup.classList.remove("open");
    }
  });
}

/* ── TEMA & AKSESIBILITAS ────────────────── */
function setupModeAndAccessibility() {
  const savedMode = localStorage.getItem("appMode") || "adult";
  window.setMode(savedMode);

  const savedContrast = localStorage.getItem("highContrast") === "true";
  if (savedContrast) window.toggleContrast(true);

  const ls = localStorage.getItem("lsVal") || "0";
  const lh = localStorage.getItem("lhVal") || "0";
  window.updateLetterSpacing(ls);
  window.updateLineHeight(lh);

  const lsSlider = document.getElementById("letterSpacingSlider");
  const lhSlider = document.getElementById("lineHeightSlider");
  if (lsSlider) lsSlider.value = ls;
  if (lhSlider) lhSlider.value = lh;
}

window.setMode = function (mode) {
  localStorage.setItem("appMode", mode);
  const html = document.documentElement;
  const btnAdult = document.getElementById("btnModeAdult");
  const btnChild = document.getElementById("btnModeChild");

  if (mode === "child") {
    html.classList.add("mode-child");
    btnAdult?.classList.remove("active");
    btnChild?.classList.add("active");
  } else {
    html.classList.remove("mode-child");
    btnChild?.classList.remove("active");
    btnAdult?.classList.add("active");
  }
};

window.toggleContrast = function (forceState) {
  const html = document.documentElement;
  const isHigh =
    forceState !== undefined
      ? forceState
      : !html.classList.contains("high-contrast");

  html.classList.toggle("high-contrast", isHigh);
  localStorage.setItem("highContrast", String(isHigh));

  const pill = document.getElementById("contrastPill");
  if (pill) {
    pill.textContent = isHigh ? "ON" : "OFF";
    pill.classList.toggle("on", isHigh);
  }
};

window.updateLetterSpacing = function (val) {
  document.documentElement.style.setProperty("--ls-extra", `${val * 0.05}em`);
  localStorage.setItem("lsVal", val);
  const label = document.getElementById("lsVal");
  if (label) label.textContent = val == 0 ? "Normal" : `+${val}`;
};

window.updateLineHeight = function (val) {
  document.documentElement.style.setProperty("--lh-extra", `${val * 0.1}`);
  localStorage.setItem("lhVal", val);
  const label = document.getElementById("lhVal");
  if (label) label.textContent = val == 0 ? "Normal" : `+${val}`;
};

/* ── KAMERA (MIRROR) ────────────────────── */
let cameraStream = null;
window.openCamera = async function () {
  const overlay = document.getElementById("cameraOverlay");
  const video = document.getElementById("cameraVideo");
  if (!overlay || !video) return;

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });
    video.srcObject = cameraStream;
    overlay.classList.add("open");
  } catch (err) {
    alert("Gagal mengakses kamera. Cek izin browser.");
  }
};

window.closeCamera = function () {
  const overlay = document.getElementById("cameraOverlay");
  const video = document.getElementById("cameraVideo");
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  if (video) video.srcObject = null;
  if (overlay) overlay.classList.remove("open");
};

/* ── VOICE SETUP ────────────────────────── */
function setupVoices() {
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
function setupSpeed() {
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

function applySpeed(isSlow) {
  ttsRate = isSlow ? 0.5 : 0.85;
  const btn = document.getElementById("speedToggle");
  if (btn) btn.textContent = isSlow ? "Kecepatan: Lambat" : "Kecepatan: Normal";
}

/* ── TABS ───────────────────────────────── */
window.showTab = function (tabId) {
  document
    .querySelectorAll(".tab-content")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".tab-item")
    .forEach((btn) => btn.classList.remove("active"));

  document.getElementById(tabId)?.classList.add("active");
  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add("active");

  if (tabId !== "breathTab" && isBreathing) {
    window.toggleBreath();
  }
};

/* ── KARTU KUSTOM ───────────────────────── */
let customCards = [];

function loadCustomCards() {
  try {
    customCards = JSON.parse(localStorage.getItem("customCards") || "[]");
  } catch (e) {
    customCards = [];
  }
  renderCustomCards();
}

window.openCustomModal = function () {
  document.getElementById("customModal")?.classList.add("open");
};

window.closeCustomModal = function () {
  document.getElementById("customModal")?.classList.remove("open");
  const input = document.getElementById("customWordInput");
  const file = document.getElementById("customImageInput");
  if (input) input.value = "";
  if (file) file.value = "";
};

window.saveCustomCard = function () {
  const input = document.getElementById("customWordInput");
  const fileInput = document.getElementById("customImageInput");
  if (!input || !input.value.trim())
    return alert("Masukkan kata terlebih dahulu");

  const word = input.value.trim();
  const id = "c_" + Date.now();

  if (fileInput && fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      customCards.push({ id, text: word, image: e.target.result });
      localStorage.setItem("customCards", JSON.stringify(customCards));
      renderCustomCards();
      window.closeCustomModal();
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    customCards.push({ id, text: word, image: null });
    localStorage.setItem("customCards", JSON.stringify(customCards));
    renderCustomCards();
    window.closeCustomModal();
  }
};

window.deleteCustomCard = function (id, e) {
  e.stopPropagation();
  if (!confirm("Hapus kartu ini?")) return;
  customCards = customCards.filter((c) => c.id !== id);
  localStorage.setItem("customCards", JSON.stringify(customCards));
  renderCustomCards();
};

function renderCustomCards() {
  const grid = document.getElementById("customGrid");
  const empty = document.getElementById("customEmpty");
  if (!grid) return;

  if (customCards.length === 0) {
    grid.innerHTML = "";
    if (empty) grid.appendChild(empty);
    if (empty) empty.style.display = "block";
    return;
  }

  grid.innerHTML = customCards
    .map(
      (c) => `
        <div class="custom-card" onclick="window.playTTS('${c.text}', '${c.id}', 'custom')">
            <button class="custom-card-del" onclick="window.deleteCustomCard('${c.id}', event)">✕</button>
            ${c.image ? `<img src="${c.image}" alt="${c.text}">` : `<div style="height:70px; display:flex; align-items:center; justify-content:center; background:var(--primary-light); width:100%; border-radius:var(--radius-sm); color:var(--primary-teal); font-size:2rem;">📝</div>`}
            <span class="custom-card-text">${c.text}</span>
        </div>
    `,
    )
    .join("");
}

/* ── RENDER CONTENT ─────────────────────── */
function makeCard(id, text, type, inner) {
  return `<button class="card alpha-card" data-id="${id}" data-text="${text}" data-type="${type}"
        onclick="window.cardTap('${text}', '${id}', '${type}')">
        <span class="card-check" id="chk_${id}">✓</span>
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
                        <span class="card-check" id="chk_${i.id}">✓</span>
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

/* ── TTS ────────────────────────────────── */
window.playTTS = function (text, id, type) {
  if ("vibrate" in navigator) navigator.vibrate(50);

  document
    .querySelectorAll(".playing")
    .forEach((el) => el.classList.remove("playing"));

  const card =
    document.querySelector(`[data-id="${id}"]`) ||
    document.querySelector(`.sentence-item[data-id="${id}"]`) ||
    document.querySelector(`.custom-card[data-id="${id}"]`);
  if (card) card.classList.add("playing");

  TTS.speak(text, "id-ID", () => {
    if (card) card.classList.remove("playing");
  });

  const chk = document.getElementById(`chk_${id}`);
  if (chk) {
    chk.classList.add("show");
    setTimeout(() => chk.classList.remove("show"), 1200);
  }

  addProgress(type);
  updateProgress();
};

/* ── FULLSCREEN ─────────────────────────── */
let fsMode = false;
let fsCurrentText = "";
let fsCurrentId = "";
let fsIndex = 0;
let fsList = [];

window.cardTap = function (text, id, type) {
  if ("vibrate" in navigator) navigator.vibrate(50);
  if (fsMode) {
    let list;
    if (type === "number") list = NUMBERS;
    else if (type === "alphabet") list = ALPHABET;
    else if (type === "vokal") list = VOKAL;
    else return;
    
    const idx = list.findIndex((i) => i.id === id);
    openFs(list, idx);
  } else {
    window.playTTS(text, id, type);
  }
};

window.toggleFsMode = function () {
  fsMode = !fsMode;
  document.querySelectorAll(".btn-fs-toggle").forEach((btn) => {
    btn.classList.toggle("active", fsMode);
    const label = btn.querySelector(".btn-fs-label");
    if (label) label.textContent = fsMode ? "Mode Aktif" : "Mode Penuh";
  });
};

function openFs(list, idx) {
  fsList = list;
  fsIndex = Math.max(0, Math.min(idx, list.length - 1));
  document.getElementById("fsOverlay")?.classList.add("show");
  renderFs();
  window.fsPlaySound();
}

function renderFs() {
  const item = fsList[fsIndex];
  if (!item) return;
  fsCurrentText = item.text;
  fsCurrentId = item.id;

  const charEl = document.getElementById("fsChar");
  const labelEl = document.getElementById("fsLabel");
  const counterEl = document.getElementById("fsCounter");
  const prevBtn = document.getElementById("fsPrevBtn");
  const nextBtn = document.getElementById("fsNextBtn");
  const mouthImg = document.getElementById("fsMouthImg");

  if (charEl) charEl.textContent = item.text;
  if (labelEl)
    labelEl.textContent = isNaN(Number(item.text)) ? "Huruf" : "Angka";
  if (counterEl) counterEl.textContent = `${fsIndex + 1} / ${fsList.length}`;
  if (prevBtn) prevBtn.disabled = fsIndex === 0;
  if (nextBtn) nextBtn.disabled = fsIndex === fsList.length - 1;

  if (mouthImg) {
    const vowels = ["A", "I", "U", "E", "O"];
    if (vowels.includes(item.text.toUpperCase())) {
      mouthImg.src = `/mouth/${item.text.toLowerCase()}.png`;
      mouthImg.classList.add("show");
    } else {
      mouthImg.classList.remove("show");
      mouthImg.src = "";
    }
  }
}

window.nextFs = function () {
  if (fsIndex < fsList.length - 1) {
    fsIndex++;
    renderFs();
    window.fsPlaySound();
  }
};

window.prevFs = function () {
  if (fsIndex > 0) {
    fsIndex--;
    renderFs();
    window.fsPlaySound();
  }
};

window.closeFullscreen = function () {
  document.getElementById("fsOverlay")?.classList.remove("show");
  if (TTS.synth.speaking) TTS.synth.cancel();
};

window.fsPlaySound = function () {
  TTS.speak(fsList[fsIndex]?.text ?? fsCurrentText, "id-ID");
  addProgress("alphabet");
  updateProgress();
};

/* ── PROGRESS & RESTART ─────────────────── */
function getProgress() {
  return JSON.parse(
    localStorage.getItem("progress") || '{"a":0,"w":0,"s":0,"c":0}',
  );
}

function addProgress(type) {
  const p = getProgress();
  const map = {
    alphabet: "a",
    number: "a",
    word: "w",
    sentence: "s",
    custom: "c",
  };
  if (map[type]) {
    p[map[type]] = (p[map[type]] || 0) + 1;
    localStorage.setItem("progress", JSON.stringify(p));
  }
}

let originalUpdateProgress;

function updateProgress() {
  const p = getProgress();
  const total = (p.a || 0) + (p.w || 0) + (p.s || 0) + (p.c || 0);

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  };

  set("statAlpha", p.a || 0);
  set("statWords", p.w || 0);
  set("statSent", p.s || 0);
  set("totalToday", total);

  const pct = Math.min(100, (total / 20) * 100);
  const bar = document.getElementById("progressBar");
  if (bar) bar.style.width = pct + "%";
  set("progressText", `${total} / 20 latihan`);

  if (originalUpdateProgress) {
    checkReward();
  }
}

originalUpdateProgress = updateProgress;

window.resetProgress = function () {
  if (!confirm("Apakah Anda yakin ingin mengulang target latihan hari ini?"))
    return;
  localStorage.setItem("progress", '{"a":0,"w":0,"s":0,"c":0}');
  updateProgress();
  document
    .querySelectorAll(".card-check")
    .forEach((el) => el.classList.remove("show"));
};

/* ── BREATHING ───────────────────────────── */
let breathInterval = null;
let isBreathing = false;

window.toggleBreath = function () {
  const btn = document.getElementById("btnBreath");
  const circle = document.getElementById("breathCircle");
  const text = document.getElementById("breathText");
  if (!btn || !circle || !text) return;

  isBreathing = !isBreathing;

  if (isBreathing) {
    btn.textContent = "Berhenti";
    btn.style.backgroundColor = "var(--primary-dark)";
    runBreathCycle(circle, text);
    breathInterval = setInterval(() => runBreathCycle(circle, text), 12000);
  } else {
    btn.textContent = "Mulai Latihan";
    btn.style.backgroundColor = "";
    if (breathInterval) clearInterval(breathInterval);
    resetBreath(circle, text);
  }
};

function runBreathCycle(circle, text) {
  text.textContent = "Tarik...";
  circle.style.transform = "scale(1.5)";
  circle.style.backgroundColor = "var(--primary-teal)";
  text.style.color = "white";

  setTimeout(() => {
    if (!isBreathing) return;
    text.textContent = "Tahan...";
  }, 4000);

  setTimeout(() => {
    if (!isBreathing) return;
    text.textContent = "Hembuskan...";
    circle.style.transform = "scale(1)";
    circle.style.backgroundColor = "var(--primary-light)";
    text.style.color = "var(--primary-teal)";
  }, 8000);
}

function resetBreath(circle, text) {
  text.textContent = "Siap";
  circle.style.transform = "scale(1)";
  circle.style.backgroundColor = "var(--primary-light)";
  text.style.color = "var(--primary-teal)";
}

/* ── SWIPE GESTURE & KEYBOARD NAV (FULLSCREEN) ── */
(() => {
  const overlay = document.getElementById("fsOverlay");
  if (!overlay) return;
  let startX = 0;
  overlay.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
    },
    { passive: true },
  );
  overlay.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 60) dx < 0 ? window.nextFs() : window.prevFs();
    },
    { passive: true },
  );
})();

document.addEventListener("keydown", (e) => {
  const overlay = document.getElementById("fsOverlay");
  if (!overlay?.classList.contains("show")) return;
  if (e.key === "ArrowRight") window.nextFs();
  else if (e.key === "ArrowLeft") window.prevFs();
  else if (e.key === "Escape") window.closeFullscreen();
  else if (e.key === " ") {
    e.preventDefault();
    window.fsPlaySound();
  }
});

/* ── AUTOPLAY FULLSCREEN ─────────────────────── */
let autoplayTimer = null;
let isAutoplay = false;

window.toggleAutoplay = function () {
  isAutoplay = !isAutoplay;
  const btn = document.getElementById("fsAutoplayBtn");
  if (btn) {
    btn.classList.toggle("active", isAutoplay);
    btn.textContent = isAutoplay ? "⏸" : "▶";
  }

  if (isAutoplay) {
    window.nextFs();
    autoplayTimer = setInterval(() => {
      if (fsIndex >= fsList.length - 1) {
        window.toggleAutoplay();
      } else {
        window.nextFs();
      }
    }, 4000);
  } else {
    clearInterval(autoplayTimer);
  }
};

const stopAutoplayIfActive = () => {
  if (isAutoplay) window.toggleAutoplay();
};
document
  .getElementById("fsPrevBtn")
  ?.addEventListener("click", stopAutoplayIfActive);
document
  .getElementById("fsNextBtn")
  ?.addEventListener("click", stopAutoplayIfActive);
document
  .getElementById("fsOverlay")
  ?.querySelector(".fs-close")
  ?.addEventListener("click", stopAutoplayIfActive);

/* ── SELF RECORDER (FULLSCREEN) ──────────────── */
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

window.toggleRecord = async function () {
  const btn = document.getElementById("fsRecordBtn");
  const playbackBar = document.getElementById("fsRecorderBar");
  const audioEl = document.getElementById("fsAudioPlayback");

  if (isRecording) {
    mediaRecorder.stop();
    btn.classList.remove("active");
    btn.textContent = "🎙️";
    isRecording = false;

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioEl) audioEl.src = audioUrl;
      if (playbackBar) playbackBar.style.display = "block";
      audioChunks = [];
    };
  } else {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      isRecording = true;

      btn.classList.add("active");
      btn.textContent = "⏹️";
      if (playbackBar) playbackBar.style.display = "none";

      mediaRecorder.ondataavailable = (e) => {
        audioChunks.push(e.data);
      };
    } catch (err) {
      alert(
        "Gagal merekam. Izinkan akses mikrofon di pengaturan browser Anda.",
      );
    }
  }
};

/* ── REWARD SYSTEM (MOTIVASI) ────────────────── */
const checkReward = () => {
  const p = getProgress();
  const total = (p.a || 0) + (p.w || 0) + (p.s || 0) + (p.c || 0);

  const today = new Date().toDateString();
  const rewardGiven = localStorage.getItem("rewardDate");

  if (total >= 20 && rewardGiven !== today) {
    showRewardModal();
    localStorage.setItem("rewardDate", today);
  }
};

function showRewardModal() {
  let overlay = document.querySelector(".reward-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "reward-overlay";
    overlay.innerHTML = `
            <div class="reward-modal">
                <div class="reward-emoji">🎉</div>
                <h3 class="reward-title">Hebat Sekali!</h3>
                <p class="reward-subtitle">Anda telah menyelesaikan 20 latihan hari ini. Tetap semangat dan lanjutkan pemulihan Anda.</p>
                <button class="btn-reward-close" onclick="this.closest('.reward-overlay').remove()">Terima Kasih</button>
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