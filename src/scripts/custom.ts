/**
 * custom.ts — Custom cards CRUD (Create, Read, Delete)
 *
 * Note: Images are stored as base64 Data URLs in localStorage.
 * For production, consider using IndexedDB to avoid size limits (~5MB).
 *
 * Validation & Compression:
 * - Hard reject files > 10 MB
 * - Auto-resize via canvas if > 1 MB or storage is filling up
 * - Resize target: max 600px, JPEG quality 0.7 (~50-150 KB per card)
 * - Total cap: 4 MB for all custom cards
 */

import { safeVibrate } from "./vibrate.js";

interface CustomCard {
  id: string;
  text: string;
  image: string | null;
}

let customCards: CustomCard[] = [];

// ── Storage limits ─────────────────────
const MAX_FILE_BYTES = 10 * 1024 * 1024;     // Hard reject: 10 MB file
const MAX_STORAGE_BYTES = 4 * 1024 * 1024;    // 4 MB total for customCards JSON
const AUTO_RESIZE_THRESHOLD = 800 * 1024;      // Auto-resize if file > 800 KB
const STORAGE_WARN_THRESHOLD = 3.5 * 1024 * 1024; // Auto-resize if storage > 3.5 MB
const RESIZE_MAX_DIM = 600;                    // Max width/height after resize
const RESIZE_QUALITY = 0.7;                    // JPEG compression quality

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function getCustomCardsSize(): number {
  try {
    return new Blob([localStorage.getItem("customCards") || "[]"]).size;
  } catch {
    return 0;
  }
}

function showSizeToast(message: string, isError: boolean = false): void {
  // Remove any existing toast
  const existing = document.querySelector('.size-error-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'size-error-toast';
  if (!isError) toast.classList.add('size-info');
  toast.setAttribute('role', isError ? 'alert' : 'status');
  toast.innerHTML = `<span>${isError ? '⚠️' : '📸'} ${message}</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, isError ? 6000 : 3000);
}

/* ── IMAGE RESIZER ───────────────────── */
/**
 * Resize an image file to maxDim × maxDim via canvas.
 * Returns a JPEG data URL at the given quality (0-1).
 */
function resizeImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height / width) * maxDim);
          width = maxDim;
        } else {
          width = Math.round((width / height) * maxDim);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      // White background for transparent images
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for resize'));
    };

    img.src = url;
  });
}

/* ── LOAD ────────────────────────────── */
export function loadCustomCards(): void {
  try {
    customCards = JSON.parse(localStorage.getItem("customCards") || "[]") as CustomCard[];
  } catch (_e) {
    customCards = [];
  }
  renderCustomCards();
  updateStorageInfo();
}

/* ── MODAL ────────────────────────────── */
let customModalTrigger: HTMLElement | null = null;

export function openCustomModal(): void {
  safeVibrate(10);
  customModalTrigger = document.activeElement as HTMLElement | null;
  document.getElementById("customModal")?.classList.add("open");
  document.body.style.overflow = "hidden";
  setTimeout(() => {
    document.getElementById("customWordInput")?.focus();
    updateCustomPreview();
  }, 100);
}

export function closeCustomModal(): void {
  safeVibrate(10);
  document.getElementById("customModal")?.classList.remove("open");
  document.body.style.overflow = "";
  const input = document.getElementById("customWordInput") as HTMLInputElement | null;
  const file = document.getElementById("customImageInput") as HTMLInputElement | null;
  if (input) input.value = "";
  if (file) file.value = "";
  if (customModalTrigger && typeof customModalTrigger.focus === "function") {
    customModalTrigger.focus();
    customModalTrigger = null;
  }
}

/* ── FOCUS TRAP + ESCAPE: custom modal ───── */
document.addEventListener("keydown", (e) => {
  const modal = document.getElementById("customModal");
  if (!modal?.classList.contains("open")) return;

  if (e.key === "Escape") { closeCustomModal(); return; }

  if (e.key === "Tab") {
    const focusable = modal.querySelectorAll<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])'
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
});

/* ── SAVE ─────────────────────────────── */
export async function saveCustomCard(): Promise<void> {
  safeVibrate(15);
  const input = document.getElementById("customWordInput") as HTMLInputElement | null;
  const fileInput = document.getElementById("customImageInput") as HTMLInputElement | null;
  if (!input || !input.value.trim()) {
    alert("Tulis dulu kata yang ingin ditambahkan ya ✏️");
    return;
  }

  const word = sanitizeText(input.value.trim());
  const id = "c_" + Date.now();

  if (fileInput?.files?.[0]) {
    const file = fileInput.files[0];

    // ── Hard reject: > 10 MB ──
    if (file.size > MAX_FILE_BYTES) {
      showSizeToast(
        `Gambar terlalu besar (${formatBytes(file.size)}). Maksimal ${formatBytes(MAX_FILE_BYTES)}.`, true
      );
      return;
    }

    // ── Decide: raw or resize? ──
    const currentSize = getCustomCardsSize();
    const needsResize = file.size > AUTO_RESIZE_THRESHOLD || currentSize > STORAGE_WARN_THRESHOLD;

    if (needsResize) {
      // Show compressing toast while resizing
      showSizeToast(
        `Mengompresi gambar (${formatBytes(file.size)})...`, false
      );

      try {
        const dataUrl = await resizeImage(file, RESIZE_MAX_DIM, RESIZE_QUALITY);

        // ── Post-resize size check ──
        const estimatedTotal = currentSize + dataUrl.length;
        if (estimatedTotal > MAX_STORAGE_BYTES) {
          showSizeToast(
            `Penyimpanan hampir penuh (${formatBytes(currentSize)} dari ${formatBytes(MAX_STORAGE_BYTES)}). Hapus beberapa kartu dulu ya.`, true
          );
          return;
        }

        customCards.push({ id, text: word, image: dataUrl });
        localStorage.setItem("customCards", JSON.stringify(customCards));
        renderCustomCards();
        updateStorageInfo();
        closeCustomModal();

        // Show compressed size info
        const newSize = formatBytes(dataUrl.length);
        showSizeToast(`Gambar dikompresi ke ${newSize}.`, false);
      } catch {
        showSizeToast("Gagal mengompresi gambar. Coba pilih gambar lain.", true);
      }
    } else {
      // Small image + plenty of space → store as-is
      const reader = new FileReader();
      reader.onload = function (e) {
        const dataUrl = e.target!.result as string;
        if (dataUrl.length > MAX_STORAGE_BYTES) {
          showSizeToast("Gambar terlalu besar. Coba resize atau pilih gambar yang lebih kecil.", true);
          return;
        }
        customCards.push({ id, text: word, image: dataUrl });
        localStorage.setItem("customCards", JSON.stringify(customCards));
        renderCustomCards();
        updateStorageInfo();
        closeCustomModal();
      };
      reader.onerror = function () {
        showSizeToast("Gagal membaca gambar. Coba lagi dengan gambar yang berbeda.", true);
      };
      reader.readAsDataURL(file);
    }
  } else {
    customCards.push({ id, text: word, image: null });
    localStorage.setItem("customCards", JSON.stringify(customCards));
    renderCustomCards();
    updateStorageInfo();
    closeCustomModal();
  }
}

/* ── DELETE ───────────────────────────── */
let lastDeletedCard: CustomCard | null = null;
let undoTimer: ReturnType<typeof setTimeout> | null = null;

export function deleteCustomCard(id: string, e: Event): void {
  safeVibrate(20);
  e.stopPropagation();

  const card = customCards.find(c => c.id === id);
  if (!card) return;

  lastDeletedCard = card;
  customCards = customCards.filter((c) => c.id !== id);
  localStorage.setItem("customCards", JSON.stringify(customCards));
  renderCustomCards();
  updateStorageInfo();

  showUndoToast(card.text);
}

function showUndoToast(cardName: string): void {
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
  requestAnimationFrame(() => toast.classList.add('show'));

  toast.querySelector('#undoDeleteBtn')?.addEventListener('click', () => {
    if (lastDeletedCard) {
      customCards.push(lastDeletedCard);
      localStorage.setItem("customCards", JSON.stringify(customCards));
      lastDeletedCard = null;
      renderCustomCards();
      updateStorageInfo();
    }
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
    if (undoTimer) clearTimeout(undoTimer);
  });

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

/* ── STORAGE INFO DISPLAY ─────────────── */
function updateStorageInfo(): void {
  const info = document.getElementById("customStorageInfo");
  if (!info) return;

  const size = getCustomCardsSize();
  const pct = Math.min(100, Math.round((size / MAX_STORAGE_BYTES) * 100));
  const count = customCards.length;

  if (count === 0) {
    info.style.display = "none";
    return;
  }

  info.style.display = "block";
  info.innerHTML = `
    <span class="storage-info-text">${count} kartu · ${formatBytes(size)} / ${formatBytes(MAX_STORAGE_BYTES)}</span>
    <div class="storage-info-bar">
      <div class="storage-info-fill ${pct > 80 ? 'storage-warn' : ''}" style="width:${pct}%"></div>
    </div>
  `;
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
