# 🔍 ICIL Audit — PulihBicara (Full Code Audit)

> **Tanggal audit:** 6 Agustus 2026 | **Auditor:** Buffy (AI Agent)
> **Target user:** Pasien pasca-stroke 🧠 + Anak belajar bicara 👶
> **Tech stack:** Astro 6 + TypeScript + Web Speech API + localStorage

---

## 📊 Ringkasan Skor

| Fakultas ICIL | Skor | Status |
|---------------|------|--------|
| ♿ Aksesibilitas | **A (90%)** | ✅ Baik |
| 📱 Mobile UX | **A (90%)** | ✅ Baik |
| 🧠 UX Psychology | **A (92%)** | ✅ Baik |
| ✨ Animasi | **A- (88%)** | ✅ Baik |
| 🧩 Design Patterns | **A (90%)** | ✅ Baik |
| ⚡ Performance | **A (90%)** | ✅ Baik |
| 🔐 Security | **A- (90%)** | ✅ Baik |
| 🎨 Warna & Tipografi | **A (92%)** | ✅ Baik |
| 🧠 Kognisi | **A (92%)** | ✅ Baik |
| 📐 IA | **A- (88%)** | ✅ Baik |
| 🐛 Bug Severity | **A (93%)** | ✅ Minor only |
| 🧹 Code Quality | **A (90%)** | ✅ Bersih |

**Overall: A (91%)** — Solid, 3 fix dari sesi sebelumnya.

---

## ✅ Fixed This Session (6 Agustus 2026)

| # | Bug | Severity | Fix |
|---|-----|----------|-----|
| 1 | TTS error "interrupted" + keep-alive pause/resume | 🔴 | Chunked speaking: split kalimat >8 kata jadi chunk kecil, speak sequential |
| 2 | Cancel token gap + zombie chunk chains + 50ms race | 🔴 | Internal cancelToken, clearTimeout pendingSpeakTimer, onerror putus rantai |
| 3 | Double-finish di last chunk speakChunked | 🟡 | Ganti `finish(callback)` → `if (callback) callback()` |
| 4 | Timer leak queue-mode polling | 🟡 | `pendingQueueTimer` + `clearTimeout` di `stopAll()` |
| 5 | `navigator.vibrate` tanpa guard user-gesture (26 calls) | 🟢 | Utility `safeVibrate()` di `vibrate.ts` + try-catch |
| 6 | Tidak ada validasi ukuran gambar custom card | 🟡 | `resizeImage()` canvas compression + storage cap 4MB + progress bar |
| 7 | Timer leak oralMotor spam tombol | 🟡 | Guard di `startOralMotorExercise` + disable tombol saat hold/rest |

---

## 🐛 Bug Tersisa

### 🟡 MEDIUM — Font `Nunito` dan `Comic Neue` tidak diload untuk mode anak

**File:** `src/styles/global.css`
**Severity:** 🟡 Medium — Fallback ke `Plus Jakarta Sans` di mode anak

**Detail:** Di mode `html.mode-child`, CSS mendeklarasikan:
```css
--font-main: 'Nunito', 'Comic Neue', 'Plus Jakarta Sans', sans-serif;
```
Tapi tidak ada `@font-face` atau `<link>` Google Fonts. Font selalu jatuh ke `Plus Jakarta Sans`.

**Fix:** Tambahkan link Google Fonts di `Layout.astro`.

---

## ⚠️ Code Smells & Improvement Opportunities

### 1. Progress tracking tidak punya daily reset otomatis
Progress disimpan di localStorage tanpa timestamp. Tidak ada mekanisme reset harian otomatis.

**Rekomendasi:** Simpan tanggal di `progress` data dan auto-reset saat tanggal berbeda.

### 2. Speech recognition tidak punya timeout
`startSpeechMatch()` tidak memiliki timeout manual. Browser akan timeout sendiri (~10-15 detik).

**Rekomendasi:** Tambahkan `setTimeout` 10 detik untuk `stopListening()`.

### 3. AudioCues — AudioContext dibuat multiple kali
`getCtx()` selalu membuat AudioContext baru jika null, dan `initAudioCues()` dipanggil saat toggle.

**Rekomendasi:** Reuse AudioContext, hanya resume/suspend.

### 4. Spaced repetition hanya untuk kata
`getStaleWordCount()` hanya mengecek `wordProgress`. Kalimat tidak punya fitur ini.

### 5. Tidak ada error boundary untuk dynamic imports
`quiz.js` dan `oralMotor.js` di-load via dynamic `import()`. Jika gagal load, tidak ada fallback UI.

### 6. ALPHABET_EXAMPLES missing Q, X, Z
Record hanya 23 entri — Q, X, Z tidak punya contoh kata.

---

## ✅ Yang Sudah Baik

| Area | Detail |
|------|--------|
| **Aksesibilitas** | Focus trap semua modal, skip-to-content, aria labels, live region, 48px touch targets |
| **Mobile UX** | Sidebar drawer mobile-first, safe-area-inset, swipe, haptic feedback (26 interaksi) |
| **Performance** | Dynamic import code splitting, font-display: swap, skeleton loading, chunked TTS |
| **Design System** | CSS custom properties lengkap, dark mode, high contrast, reduce-motion, dyslexic font, 3 mode |
| **Offline** | Service Worker, offline banner, semua data di localStorage |
| **Security** | CSP meta tag, sanitize input, escape HTML, no eval() |
| **UX Writing** | Bahasa Indonesia casual & suportif, chunked instruction, milestone & idle toast |
| **TTS Engine** | Chunked speaking anti-15s-bug, cancel token, timer cleanup, voice quality scoring, tone presets |
| **Custom Cards** | CRUD lengkap, undo delete, canvas resize, storage cap + progress bar, toast feedback |
| **IA** | Sidebar 4 grup accordion, tab memory, filter bar per kategori |

---

## 📋 Prioritas Fix Tersisa

| # | Item | Severity | Estimasi |
|---|------|----------|----------|
| 1 | Load Nunito + Comic Neue font | 🟡 Medium | 10 menit |
| 2 | Daily progress reset otomatis | 🟡 Medium | 30 menit |
| 3 | Error boundary dynamic imports | 🟢 Low | 15 menit |
| 4 | Tambah Q, X, Z di ALPHABET_EXAMPLES | 🟢 Low | 5 menit |
| 5 | Speech recognition timeout | 🟢 Low | 10 menit |
| 6 | Generalize spaced repetition | 🟢 Low | 20 menit |

---

## 📐 Arsitektur File (Updated)

```
src/
├── scripts/
│   ├── app.ts          → Entry point, wiring, content rendering
│   ├── tts.ts          → TTS engine (chunked speaking, cancel token, voices)
│   ├── ui.ts           → UI interactions (tabs, fullscreen, cards, settings, sidebar)
│   ├── progress.ts     → Progress tracking, milestones, rewards, idle encouragement
│   ├── quiz.ts         → Quiz mode (word/sentence quiz)
│   ├── oralMotor.ts    → Guided exercise timer (oro-motor + limb, timer guard)
│   ├── custom.ts       → Custom cards CRUD (resizeImage, storage cap, undo)
│   ├── speech.ts       → Speech recognition (STT) via Web Speech API
│   ├── audioCues.ts    → Audio beeps via Web Audio API
│   ├── camera.ts       → Camera mirror + audio recorder
│   ├── syllable.ts     → Pemenggalan suku kata Bahasa Indonesia
│   └── vibrate.ts      → 🆕 safeVibrate() wrapper dgn try-catch
├── data/
│   └── content.ts      → All static data (ALPHABET, WORDS, SENTENCES, EXERCISES)
├── components/
│   ├── Navbar.astro    → Navigation bar + sidebar drawer + settings popup
│   ├── Stats.astro     → Bottom stats bar with progress
│   └── Tabs.astro      → All tab content + fullscreen overlay + modals + storage info
├── layouts/
│   └── Layout.astro    → HTML shell, meta tags, CSP, fonts, offline detection, SW
├── pages/
│   └── index.astro     → Main page
└── styles/
    └── global.css      → Complete design system (~1200 lines)
```

---

## 📈 Build & Deploy

| Metric | Value |
|--------|-------|
| Build time | ~6 detik |
| Build output | 1 page (static) |
| Dependencies | Astro 6.3.3 only |
| Node version | >=22.12.0 |

---

> **Audit selesai.** 7 bug fixed sesi ini. 6 rekomendasi tersisa.
> **Rekomendasi utama:** Load Nunito font, daily progress reset, error boundary dynamic imports.
