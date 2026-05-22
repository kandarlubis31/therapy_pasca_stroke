/**
 * custom.js — Custom cards CRUD (Create, Read, Delete)
 *
 * Note: Images are stored as base64 Data URLs in localStorage.
 * For production, consider using IndexedDB to avoid size limits (~5MB).
 */

let customCards = [];

/* ── LOAD ────────────────────────────── */
export function loadCustomCards() {
  try {
    customCards = JSON.parse(localStorage.getItem("customCards") || "[]");
  } catch (e) {
    customCards = [];
  }
  renderCustomCards();
}

/* ── MODAL ────────────────────────────── */
export function openCustomModal() {
  document.getElementById("customModal")?.classList.add("open");
}

export function closeCustomModal() {
  document.getElementById("customModal")?.classList.remove("open");
  const input = document.getElementById("customWordInput");
  const file = document.getElementById("customImageInput");
  if (input) input.value = "";
  if (file) file.value = "";
}

/* ── SAVE ─────────────────────────────── */
export function saveCustomCard() {
  const input = document.getElementById("customWordInput");
  const fileInput = document.getElementById("customImageInput");
  if (!input || !input.value.trim())
    return alert("Masukkan kata terlebih dahulu");

  // Sanitize input to prevent XSS
  const word = sanitizeText(input.value.trim());
  const id = "c_" + Date.now();

  if (fileInput && fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      customCards.push({ id, text: word, image: e.target.result });
      localStorage.setItem("customCards", JSON.stringify(customCards));
      renderCustomCards();
      closeCustomModal();
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    customCards.push({ id, text: word, image: null });
    localStorage.setItem("customCards", JSON.stringify(customCards));
    renderCustomCards();
    closeCustomModal();
  }
}

/* ── DELETE ───────────────────────────── */
export function deleteCustomCard(id, e) {
  e.stopPropagation();
  if (!confirm("Hapus kartu ini?")) return;
  customCards = customCards.filter((c) => c.id !== id);
  localStorage.setItem("customCards", JSON.stringify(customCards));
  renderCustomCards();
}

/* ── RENDER ───────────────────────────── */
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
        <div class="custom-card" data-id="${c.id}" onclick="window.cardTapCustom('${encodeURIComponent(c.text)}', '${c.id}')">
            <button class="custom-card-del" onclick="window.deleteCustomCard('${c.id}', event)">✕</button>
            ${c.image ? `<img src="${c.image}" alt="${escapeHtml(c.text)}">` : `<div style="height:70px; display:flex; align-items:center; justify-content:center; background:var(--primary-light); width:100%; border-radius:var(--radius-sm); color:var(--primary-teal); font-size:2rem;">📝</div>`}
            <span class="custom-card-text">${escapeHtml(c.text)}</span>
        </div>
    `,
    )
    .join("");
}

/* ── HELPERS ──────────────────────────── */
function sanitizeText(str) {
  return str.replace(/[<>&"']/g, '');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
