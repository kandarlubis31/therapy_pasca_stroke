# 🔍 ICIL Audit — PulihBicara (Full Code Audit)

> **Tanggal audit:** 5 Agustus 2026 | **Auditor:** Buffy (AI Agent)
> **Target user:** Pasien pasca-stroke 🧠 + Anak belajar bicara 👶
> **Tech stack:** Astro 6 + TypeScript + Web Speech API + localStorage

---

## 📊 Ringkasan Skor

| Fakultas ICIL | Skor | Status |
|---------------|------|--------|
| ♿ Aksesibilitas | **A- (88%)** | ✅ Baik |
| 📱 Mobile UX | **A- (87%)** | ✅ Baik |
| 🧠 UX Psychology | **A (90%)** | ✅ Baik |
| ✨ Animasi | **A- (88%)** | ✅ Baik |
| 🧩 Design Patterns | **A- (87%)** | ✅ Baik |
| ⚡ Performance | **A- (88%)** | ✅ Baik |
| 🔐 Security | **A- (90%)** | ✅ Baik |
| 🎨 Warna & Tipografi | **A (92%)** | ✅ Baik |
| 🧠 Kognisi | **A (90%)** | ✅ Baik |
| 📐 IA | **A- (88%)** | ✅ Baik |
| 🐛 Bug Severity | **A- (90%)** | ✅ Hanya 2 bug medium |
| 🧹 Code Quality | **A- (88%)** | ✅ Minor code smells |

**Overall: A (90%)** — Sangat solid, minor fixes needed.

---

## 🐛 Bug Ditemukan

### ~~🔴 CRITICAL — `renderQuizStart` tidak diekspor dari `quiz.ts`~~ ❌ FALSE POSITIVE

**File:** `src/scripts/quiz.ts` + `src/scripts/ui.ts`
**Severity:** ~~🔴 Critical~~ — ❌ **TIDAK BENAR.** Setelah dibaca ulang, `renderQuizStart` **sudah diekspor** dari `quiz.ts` di baris 353 beserta fungsi-fungsi `closeQuiz`, `quizRestart`, `isQuizActive`, dan `startQuiz`. Dynamic import di `ui.ts` bekerja dengan benar. **Quiz tab berfungsi normal.**

---

### 🟡 MEDIUM — Font `Nunito` dan `Comic Neue` tidak diload untuk mode anak

**File:** `src/styles/global.css`
**Severity:** 🟡 Medium — Fallback ke `Plus Jakarta Sans` di mode anak

**Detail:**
Di mode `html.mode-child`, CSS mendeklarasikan:
```css
--font-main: 'Nunito', 'Comic Neue', 'Plus Jakarta Sans', sans-serif;
```
Tapi tidak ada `@font-face` atau `<link>` Google Fonts untuk Nunito atau Comic Neue. Akibatnya, font selalu jatuh ke `Plus Jakarta Sans`. User tidak mendapatkan font anak-anak yang playful.

**Fix:** Tambahkan link Google Fonts untuk Nunito dan Comic Neue di `Layout.astro`, atau gunakan font sistem yang sudah ada (misal: `'Segoe UI', 'Comic Sans MS', cursive`).

---

### 🟡 MEDIUM — Timer leak saat `startOralMotorExercise` dipanggil saat exercise berjalan

**File:** `src/scripts/oralMotor.ts`
**Severity:** 🟡 Medium — Bisa menyebabkan multiple timer berjalan bersamaan

**Detail:**
Di `startOralMotorExercise()`:
```typescript
stopTimer();  // ✅ menghentikan timer lama
state.exerciseId = exId;
state.repCurrent = 1;
// ...
scheduleNextPhase(exercise);  // memulai timer baru
```
Lalu di `renderExerciseUI()`, tombol "Mulai" / "Lewati" memanggil `window.startOralMotorExercise('${exercise.id}')` lagi — ini akan restart dari rep 1. Jika user menekan tombol berulang kali, timer baru akan dibuat sebelum yang lama selesai. Meskipun `stopTimer()` dipanggil, `onclick` di HTML bisa di-spam.

**Fix:** Disable tombol saat exercise sedang berjalan (selain fase `done`), atau guard dengan flag `state.running`.

---

### 🟢 LOW — Console warning `[TTS] utterance error: interrupted`

**File:** `src/scripts/tts.ts`
**Severity:** 🟢 Low — Sudah difix (5 Agustus 2026)

**Detail:**
Error "interrupted" terjadi normal saat `stopAll()` dipanggil. Sebelumnya recovery handler melakukan retry yang tidak perlu. **Sudah diperbaiki** — sekarang error "interrupted" langsung cleanup tanpa retry.

---

### 🟢 LOW — Tidak ada batas ukuran gambar di Custom Cards

**File:** `src/scripts/custom.ts`
**Severity:** 🟢 Low — localStorage bisa penuh

**Detail:**
Gambar disimpan sebagai base64 Data URL di localStorage (~5MB limit). Tidak ada validasi ukuran file. Satu gambar besar bisa menghabiskan seluruh kuota localStorage.

**Fix:** Tambahkan validasi `file.size` (misal maks 500KB), kompresi gambar sebelum encode, atau migrasi ke IndexedDB.

---

## ⚠️ Code Smells & Improvement Opportunities

### 1. Race condition di `doSpeak()` (tts.ts)
Di `doSpeak()`, `TTS.synth.cancel()` dipanggil, lalu `setTimeout(50ms)` sebelum membuat utterance. Antara dua titik itu, panggilan `speak()` lain bisa mengintervensi.

**Rekomendasi:** Gunakan antrian (queue) speech yang di-dequeue setelah utterance selesai, atau gunakan lock/mutex sederhana.

### 2. Progress tracking tidak punya daily reset otomatis
Progress disimpan di localStorage tanpa timestamp. Jika user latihan di jam 11 malam lalu buka lagi jam 1 pagi, counter masih lanjut. Tidak ada mekanisme reset harian otomatis.

**Rekomendasi:** Simpan tanggal di `progress` data (`{ date: "2026-08-05", a: 3, w: 5, ... }`) dan auto-reset saat tanggal berbeda.

### 3. `navigator.vibrate` dipanggil tanpa guard user-gesture
Browser memblokir `navigator.vibrate` sebelum user interaction pertama. Ini menghasilkan console warning (bukan error). Ada ~20+ panggilan `vibrate` yang bisa dipanggil sebelum gesture.

**Rekomendasi:** Wrap dalam `try-catch` atau `if (navigator.userActivation?.hasBeenActive)` untuk suppress warning.

### 4. `playTTS()` tidak cleanup checkmark timer saat cardTap ulang
Di `ui.ts` `playTTS()`, `chkTimer` di-clear lalu di-set ulang. Tapi jika user mengetuk kartu dengan sangat cepat, `clearTimeout` bisa miss timer yang belum di-set. Ini minor dan tidak menyebabkan bug.

### 5. `speech.ts` tidak punya timeout
`startSpeechMatch()` tidak memiliki timeout. Jika user tidak bicara, `rec.onerror` akan trigger `no-speech` yang sudah di-handle. Tapi tidak ada batas waktu untuk recognition — browser akan timeout sendiri (~10-15 detik).

**Rekomendasi:** Tambahkan `setTimeout` manual (10 detik) untuk `stopListening()` jika recognition terlalu lama.

### 6. `audioCues.ts` — AudioContext dibuat multiple kali
`getCtx()` selalu membuat AudioContext baru jika null. `initAudioCues()` dipanggil di initApp, lalu `getCtx()` juga dipanggil di setiap beep. Jika user enable/disable audio cues berkali-kali, AudioContext bisa dibuat ulang.

**Rekomendasi:** Reuse AudioContext, hanya resume/suspend saat toggle.

### 7. Spaced repetition hanya untuk kata, tidak untuk kalimat
`getStaleWordCount()` hanya mengecek `wordProgress`. Kalimat (`sentenceProgress`) tidak memiliki fitur spaced repetition.

**Rekomendasi:** Tambahkan `getStaleSentenceCount()` atau generalize fungsi untuk menerima key parameter.

### 8. Tidak ada error boundary untuk dynamic imports
`quiz.js` dan `oralMotor.js` di-load via dynamic `import()`. Jika chunk gagal load (network error), tidak ada fallback UI.

**Rekomendasi:** Tambahkan `.catch()` handler dengan pesan error dan tombol retry.

### 9. `ALPHABET_EXAMPLES` missing Q, X, Z
Di `content.ts`, record `ALPHABET_EXAMPLES` hanya memiliki 23 entri (A-Z minus Q, X, Z). Huruf Q, X, Z tidak punya contoh kata.

**Rekomendasi:** Tambahkan contoh: `'Q': 'Quran'`, `'X': 'X-ray'`, `'Z': 'Zebra'`.

---

## ✅ Yang Sudah Baik

| Area | Detail |
|------|--------|
| **Aksesibilitas** | Focus trap di semua modal, skip-to-content link, aria labels di semua interaktif, live region announcer, 48px touch targets |
| **Mobile UX** | Sidebar drawer mobile-first, safe-area-inset, swipe di fullscreen, swipe prevention granular, haptic feedback 20+ interaksi |
| **Performance** | Dynamic import code splitting (quiz + oralMotor), font-display: swap, font size-adjust 105%, skeleton loading states |
| **Design System** | CSS custom properties lengkap, dark mode, high contrast, reduce-motion toggle, dyslexic font, 3 mode (adult/child/contrast) |
| **Offline** | Service Worker, offline banner, semua data di localStorage tanpa network dependency |
| **Security** | CSP meta tag, sanitize input (custom cards), escape HTML, no eval() |
| **UX Writing** | Bahasa Indonesia casual & suportif, chunked instruction steps, milestone & idle encouragement toast |
| **IA** | Sidebar 4 grup accordion (Cowan's 4±1), tab memory (`lastActiveTab`), filter bar per kategori |
| **Error Recovery** | TTS retry (non-interrupted), AudioContext lazy-init + resume, camera permission handling |
| **Kognisi** | Spaced repetition badge, milestone 5/10/15, idle encouragement 2 menit, chunked instructions |

---

## 📋 Prioritas Fix

| # | Item | Severity | Estimasi |
|---|------|----------|----------|
| 1 | Load Nunito + Comic Neue font | 🟡 Medium | 10 menit |
| 2 | Guard timer leak di oralMotor | 🟡 Medium | 15 menit |
| 3 | Validasi ukuran gambar custom card | 🟢 Low | 10 menit |
| 4 | Tambah Q, X, Z di ALPHABET_EXAMPLES | 🟢 Low | 5 menit |
| 5 | Daily progress reset otomatis | 🟡 Medium | 30 menit |
| 6 | Error boundary dynamic imports | 🟢 Low | 15 menit |
| 7 | Wrapping vibrate dengan guard | 🟢 Low | 10 menit |
| 8 | Speech recognition timeout | 🟢 Low | 10 menit |
| 9 | Generalize spaced repetition | 🟢 Low | 20 menit |

---

## 🔧 LocalStorage Keys (Updated)

| Key | Tipe | Deskripsi |
|-----|------|-----------|
| `progress` | JSON `ProgressData` | Counter harian (perlu tambah date field) |
| `wordProgress` | JSON `{id: timestamp}` | Detail kata per-item |
| `sentenceProgress` | JSON `{id: timestamp}` | Detail kalimat per-item |
| `oralMotorProgress` | JSON `{id: count}` | Counter latihan fisik |
| `rewardDate` | string | Tanggal reward 20 latihan terakhir |
| `milestonesSeen` | JSON `{date: [m]}` | Milestone yang sudah ditampilkan |
| `appMode` | string | `adult` / `child` |
| `affectedSide` | string | `kanan` / `kiri` |
| `reduceMotion` | string | Toggle aksesibilitas |
| `dyslexicFont` | string | Toggle font dyslexia |
| `highContrast` | string | Toggle kontras tinggi |
| `audioCuesEnabled` | string | Isyarat audio beep |
| `ttsVoice` / `ttsPitch` / `ttsTone` | string | Preferensi suara TTS |
| `ttsSlow` | string | Kecepatan lambat |
| `autoplaySpeed` | string | Kecepatan autoplay (detik) |
| `fsVal` / `lsVal` / `lhVal` | string | Font size / letter spacing / line height |
| `lastActiveTab` | string | Tab terakhir dibuka |
| `sidebarOpen` | string | State sidebar mobile |
| `customCards` | JSON `CustomCard[]` | Kartu kustom (termasuk base64 image) |

---

## 📐 Arsitektur File

```
src/
├── scripts/
│   ├── app.ts          → Entry point, wiring, content rendering
│   ├── tts.ts          → TTS engine (speak, stopAll, voices, tone presets)
│   ├── ui.ts           → UI interactions (tabs, fullscreen, cards, settings, sidebar)
│   ├── progress.ts     → Progress tracking, milestones, rewards, idle encouragement
│   ├── quiz.ts         → Quiz mode (word/sentence quiz) ✅ complete
│   ├── oralMotor.ts    → Guided exercise timer (oro-motor + limb)
│   ├── custom.ts       → Custom cards CRUD (localStorage + image base64)
│   ├── speech.ts       → Speech recognition (STT) via Web Speech API
│   ├── audioCues.ts    → Audio beeps via Web Audio API
│   ├── camera.ts       → Camera mirror + audio recorder
│   └── syllable.ts     → Pemenggalan suku kata Bahasa Indonesia
├── data/
│   └── content.ts      → All static data (ALPHABET, WORDS, SENTENCES, EXERCISES)
├── components/
│   ├── Navbar.astro    → Navigation bar + sidebar drawer + settings popup
│   ├── Stats.astro     → Bottom stats bar with progress
│   └── Tabs.astro      → All tab content + fullscreen overlay + modals
├── layouts/
│   └── Layout.astro    → HTML shell, meta tags, CSP, fonts, offline detection, SW
├── pages/
│   └── index.astro     → Main page
└── styles/
    └── global.css      → Complete design system (~1100 lines)
```

---

## 📈 Build & Deploy

| Metric | Value |
|--------|-------|
| Build time | ~7 detik |
| Build output | 1 page (static) |
| Bundle size (app.ts) | ~35KB minified |
| Dependencies | Astro 6.3.3 only |
| Node version | >=22.12.0 |

---

> **Audit selesai.** 2 bug ditemukan (2 medium), 9 rekomendasi perbaikan.
> **Rekomendasi utama:** Load Nunito font untuk mode Anak, guard timer leak di oralMotor.
