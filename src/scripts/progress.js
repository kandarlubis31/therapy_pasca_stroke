/**
 * progress.js — Progress tracking, stats bar, and reward system
 */

import { TTS } from "./tts.js";

/* ── PROGRESS & RESTART ─────────────────── */
export function getProgress() {
  return JSON.parse(
    localStorage.getItem("progress") || '{"a":0,"w":0,"s":0,"c":0}',
  );
}

export function addProgress(type) {
  const p = getProgress();
  const map = {
    alphabet: "a",
    number: "a",
    vokal: "a",
    word: "w",
    sentence: "s",
    custom: "c",
  };
  if (map[type]) {
    p[map[type]] = (p[map[type]] || 0) + 1;
    localStorage.setItem("progress", JSON.stringify(p));
  }
}

export function updateProgress() {
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

  checkReward();
}

export function resetProgress() {
  if (!confirm("Apakah Anda yakin ingin mengulang target latihan hari ini?"))
    return;
  localStorage.setItem("progress", '{"a":0,"w":0,"s":0,"c":0}');
  updateProgress();
  document
    .querySelectorAll(".card-check")
    .forEach((el) => el.classList.remove("show"));
}

/* ── REWARD SYSTEM (MOTIVASI) ────────────────── */
function checkReward() {
  const p = getProgress();
  const total = (p.a || 0) + (p.w || 0) + (p.s || 0) + (p.c || 0);

  const today = new Date().toDateString();
  const rewardGiven = localStorage.getItem("rewardDate");

  if (total >= 20 && rewardGiven !== today) {
    showRewardModal();
    localStorage.setItem("rewardDate", today);
  }
}

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
