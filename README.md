# 🗣️ PulihBicara — Terapi Wicara Pasca Stroke

<div align="center">

**Aplikasi terapi wicara untuk pemulihan pasca-stroke & belajar bicara anak**

[![Astro](https://img.shields.io/badge/Astro-5.x-BC52EE)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://typescriptlang.org)
[![PWA](https://img.shields.io/badge/PWA-✅-5A0FC8)](https://web.dev/progressive-web-apps/)
[![ICIL Score](https://img.shields.io/badge/ICIL%20Audit-A--%20(88%25)-4A827B)](docs/icil-audit.md)

</div>

---

## 🎯 Target Pengguna

| 🧠 Pasca-Stroke | 👶 Anak Belajar Bicara |
|---|---|
| Mode **Dewasa** — teal calming | Mode **Anak** — pink playful |
| Touch target 48px+ (tremor-friendly) | Font Nunito, kartu lucu |
| Latihan artikulasi + napas + fisik | Vokal, huruf, kata dasar |
| Speech recognition (ucapkan & bandingkan) | TTS playback |

---

## ✨ Fitur Utama

### 🗣️ Latihan Bicara
- **Vokal A-I-U-E-O** — ilustrasi posisi mulut
- **Huruf A-Z** — dengan contoh kata
- **Angka 0-9**
- **Kosa Kata** — 11 kategori (Keluarga, Makanan, Tubuh, dll.)
- **Kalimat** — 7 grup (Salam, Kebutuhan Dasar, Tanya Jawab, dll.)
- **Kartu Kustom** — tambah kata/foto sendiri + live preview
- **Fullscreen Mode** — swipe navigasi, autoplay, loop
- **Speech Recognition** 🎤 — ucapkan kata, app bandingkan

### 💪 Latihan Fisik
- **Otot Mulut** — 8 latihan (bibir, lidah, rahang, pipi)
- **Tangan** — 5 latihan (bahu, lengan, jari, pergelangan)
- **Kaki** — 4 latihan (lutut, pergelangan, jinjit)
- **Keseimbangan** — 1 latihan
- Timer terstruktur + audio cues + chunked instruksi step-by-step
- Filter per grup latihan

### 🫁 Latihan Napas
- Guided breathing (tarik → tahan → hembuskan)
- Timer 4-4-4 detik

### 🧠 Kuis Interaktif
- Mode: Tebak Huruf, Tebak Kata

### 🎯 Tracking & Motivasi
- Progress harian (target 20 latihan)
- Milestone toast di 5, 10, 15
- Reward modal di 20
- Spaced repetition badge
- Idle encouragement
- 🤳 Cermin kamera (draggable + fullscreen mirror)

---

## ♿ Aksesibilitas

| Fitur | Status |
|-------|--------|
| Touch targets ≥48px | ✅ |
| Focus trap semua modal | ✅ |
| Skip link + ARIA announcer | ✅ |
| Font scaling + letter spacing + line height | ✅ |
| Kontras tinggi + dark mode | ✅ |
| Reduce motion toggle | ✅ |
| Dyslexic font (Atkinson Hyperlegible) | ✅ |
| prefers-contrast + forced-colors | ✅ |
| Screen reader support | ✅ |
| Haptic feedback di 20+ interaksi | ✅ |

---

## 📱 PWA Offline-First

- Installable di Android/iOS
- Service worker caching
- Offline banner + screen reader announce
- Safe area insets

---

## 🛠️ Tech Stack

- **Framework:** [Astro 5.x](https://astro.build)
- **Language:** TypeScript
- **Styling:** CSS Custom Properties (design system)
- **APIs:** Web Speech (TTS + STT), MediaDevices (kamera), Vibration
- **Storage:** localStorage (client-only, no backend)

---

## 🚀 Instalasi

```bash
git clone https://github.com/kandarlubis31/therapy_pasca_stroke.git
cd therapy_pasca_stroke
npm install
npm run dev     # → http://localhost:4321
npm run build   # → dist/
```

---

## 📂 Struktur Project

```
src/
├── components/     # Navbar, Stats, Tabs (Astro)
├── layouts/        # Layout.astro (PWA + CSP + offline detection)
├── pages/          # index.astro
├── scripts/        # TypeScript modules
│   ├── app.ts          # Entry point + rendering
│   ├── ui.ts           # Tabs, fullscreen, autoplay, sidebar
│   ├── progress.ts     # Tracking, milestone, reward, idle, spaced rep
│   ├── tts.ts          # Text-to-Speech engine
│   ├── speech.ts       # Speech Recognition (STT)
│   ├── quiz.ts         # Interactive quiz
│   ├── oralMotor.ts    # Physical exercise timer
│   ├── custom.ts       # Custom cards CRUD + undo toast
│   ├── camera.ts       # Kamera mirror + recorder
│   ├── audioCues.ts    # Phase audio cues
│   └── syllable.ts     # Suku kata helper
├── data/           # Content (kata, kalimat, latihan)
├── styles/         # global.css (design system)
public/
├── sw.js           # Service Worker
└── manifest.json   # PWA manifest
docs/
├── icil-audit.md       # ICIL multi-faculty audit
├── PLAN.md             # Improvement plan (✅ complete)
└── tracking-progress.md # Progress system docs
```

---

## 📊 Skor ICIL Audit

| Fakultas | Score |
|----------|-------|
| Aksesibilitas | A- (88%) |
| Mobile UX | A- (87%) |
| UX Psychology | A (90%) |
| Animasi | A- (88%) |
| Design Patterns | A- (87%) |
| Performance | A- (88%) |
| Conversational UI | A- (88%) |
| Warna & Tipografi | A (92%) |
| Security | A- (90%) |
| Kognisi | A (90%) |
| **Overall** | **A- (88%)** |

> [Lihat audit lengkap →](docs/icil-audit.md)

---

## 📝 Lisensi

MIT © 2026 [Kandar Lubis](https://github.com/kandarlubis31)
