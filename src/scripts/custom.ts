/**
 * custom.ts — Custom cards CRUD (Create, Read, Delete)
 *
 * Note: Images are stored as base64 Data URLs in localStorage.
 * For production, consider using IndexedDB to avoid size limits (~5MB).
 */

interface CustomCard {
  id: string;
  text: string;
  image: string | null;
}

let customCards: CustomCard[] = [];

/* ── LOAD ────────────────────────────── */
export function loadCustomCards(): void {
  try {
    customCards = JSON.parse(localStorage.getItem("customCards") || "[]") as CustomCard[];
  } catch (_e) {
    customCards = [];
  }
  renderCustomCards();
}

/* ── MODAL ────────────────────────────── */
let customModalTrigger: HTMLElement | null = null;

export function openCustomModal(): void {
  if ("vibrate" in navigator) navigator.vibrate(10);
  customModalTrigger = document.activeElement as HTMLElement | null;
  document.getElementById("customModal")?.classList.add("open");
  document.body.style.overflow = "hidden";
  // Focus the first input & reset preview
  setTimeout(() => {
    document.getElementById("customWordInput")?.focus();
    updateCustomPreview();
  }, 100);
}

export function closeCustomModal(): void {
  if ("vibrate" in navigator) navigator.vibrate(10);
  document.getElementById("customModal")?.classList.remove("open");
  document.body.style.overflow = "";
  const input = document.getElementById("customWordInput") as HTMLInputElement | null;
  const file = document.getElementById("customImageInput") as HTMLInputElement | null;
  if (input) input.value = "";
  if (file) file.value = "";
  // Restore focus
  if (customModalTrigger && typeof customModalTrigger.focus === "function") {
    customModalTrigger.focus();
    customModalTrigger = null;
  }
}

/* ── FOCUS TRAP + ESCAPE: custom modal ───── */
document.addEventListener("keydown", (e) => {
  const modal = document.getElementById("customModal");
  if (!modal?.classList.contains("open")) return;

  // Escape → close
  if (e.key === "Escape") {
    closeCustomModal();
    return;
  }

  // Tab → trap focus
  if (e.key === "Tab") {
    const focusable = modal.querySelectorAll<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
});

/* ── SAVE ─────────────────────────────── */
export function saveCustomCard(): void {
  if ("vibrate" in navigator) navigator.vibrate(15);
  const input = document.getElementById("customWordInput") as HTMLInputElement | null;
  const fileInput = document.getElementById("customImageInput") as HTMLInputElement | null;
  if (!input || !input.value.trim()) {
    alert("Tulis dulu kata yang ingin ditambahkan ya ✏️");
    return;
  }

  const word = sanitizeText(input.value.trim());
  const id = "c_" + Date.now();

  if (fileInput?.files?.[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      customCards.push({ id, text: word, image: e.target!.result as string });
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
let lastDeletedCard: CustomCard | null = null;
let undoTimer: ReturnType<typeof setTimeout> | null = null;

export function deleteCustomCard(id: string, e: Event): void {
  if ("vibrate" in navigator) navigator.vibrate(20);
  e.stopPropagation();

  const card = customCards.find(c => c.id === id);
  if (!card) return;

  // Save for undo
  lastDeletedCard = card;
  customCards = customCards.filter((c) => c.id !== id);
  localStorage.setItem("customCards", JSON.stringify(customCards));
  renderCustomCards();

  // Show undo toast
  showUndoToast(card.text);
}

function showUndoToast(cardName: string): void {
  // Remove any existing toast
  const existing = document.querySelector('.undo-toast');
  if (existing) existing.remove();
  if (undoTimer) clearTimeout(undoTimer);

  const toast = document.createElement('div');
  toast.className = 'undo-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <span class="undo-toast-text">"${escapeHtml(cardName)}" dihapus</span>
    <button class="undo-toast-btn" id="undoDeleteBtn">↩ Batal</button>
  `;
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => toast.classList.add('show'));

  toast.querySelector('#undoDeleteBtn')?.addEventListener('click', () => {
    if (lastDeletedCard) {
      customCards.push(lastDeletedCard);
      localStorage.setItem("customCards", JSON.stringify(customCards));
      lastDeletedCard = null;
      renderCustomCards();
    }
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
    if (undoTimer) clearTimeout(undoTimer);
  });

  // Auto-dismiss after 5s
  undoTimer = setTimeout(() => {
    lastDeletedCard = null;
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/* ── RENDER ───────────────────────────── */
function renderCustomCards(): void {
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
            ${c.image ? `<img src="${c.image}" alt="${escapeHtml(c.text)}" loading="lazy" decoding="async">` : `<div style="height:70px; display:flex; align-items:center; justify-content:center; background:var(--primary-light); width:100%; border-radius:var(--radius-sm); color:var(--primary-teal); font-size:2rem;">📝</div>`}
            <span class="custom-card-text">${escapeHtml(c.text)}</span>
        </div>
    `,
    )
    .join("");
}

/* ── HELPERS ──────────────────────────── */
function sanitizeText(str: string): string {
  return str.replace(/[<>&"']/g, '');
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function updateCustomPreview(): void {
  const input = document.getElementById("customWordInput") as HTMLInputElement | null;
  const preview = document.getElementById("customPreview");
  if (!preview) return;
  const text = input?.value?.trim() || '';
  if (!text) {
    preview.innerHTML = '<span class="custom-preview-hint">Pratinjau kartu akan muncul di sini</span>';
  } else {
    preview.innerHTML = `<div class="custom-card custom-card-preview">
      <div style="height:70px;display:flex;align-items:center;justify-content:center;background:var(--primary-light);width:100%;border-radius:var(--radius-sm);color:var(--primary-teal);font-size:2rem;">📝</div>
      <span class="custom-card-text">${escapeHtml(text)}</span>
    </div>`;
  }
}

// Expose for inline oninput in Tabs.astro
(window as any).updateCustomPreview = updateCustomPreview;
