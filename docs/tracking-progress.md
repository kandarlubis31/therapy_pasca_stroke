# 📊 Dokumentasi Tracking Progress — PulihBicara

> **Versi:** 1.1.0 | **Terakhir diperbarui:** 6 Agustus 2026
> **File inti:** `src/scripts/progress.ts`, `src/scripts/tts.ts`, `src/scripts/custom.ts`, `src/scripts/vibrate.ts`

---

## Daftar Isi

1. [Ikhtisar Arsitektur](#1-ikhtisar-arsitektur)
2. [Struktur Data Progress](#2-struktur-data-progress)
3. [Alur Tracking](#3-alur-tracking)
4. [Komponen UI Progress](#4-komponen-ui-progress)
5. [LocalStorage Keys Lengkap](#5-localstorage-keys-lengkap)
6. [Sistem Reward & Milestone](#6-sistem-reward--milestone)
7. [Spaced Repetition](#7-spaced-repetition)
8. [Idle Encouragement](#8-idle-encouragement)
9. [Speech Recognition (STT)](#9-speech-recognition-stt)
10. [Reset Progress](#10-reset-progress)
11. [Tracking Per-Kategori](#11-tracking-per-kategori)
12. [Cara Menambah Fitur Tracking Baru](#12-cara-menambah-fitur-tracking-baru)

---

## 1. Ikhtisar Arsitektur

PulihBicara menggunakan **localStorage-based progress tracking** tanpa backend. Semua data disimpan di sisi klien.

```
┌─────────────────────────────────────────────────┐
│                   app.ts (initApp)               │
│  updateProgress() + setupIdleEncouragement()    │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│                progress.ts (inti)                │
│  • addProgress()           → tulis localStorage │
│  • updateProgress()        → render Stats bar   │
│  • checkMilestones()       → toast 5/10/15      │
│  • checkReward()           → modal reward (20+) │
│  • getStaleWordCount()     → spaced repetition  │
│  • setupIdleEncouragement() → idle toast 2 min  │
└──────────────┬──────────────────────────────────┘
               │
     ┌─────────┼──────────┬──────────┬───────────┐
     ▼         ▼          ▼          ▼           ▼
  ui.ts     quiz.ts   oralMotor.ts custom.ts  speech.ts
 (cardTap) (correct/  (exercise   (cardTap    (STT match)
           dontKnow)  done)       Custom)
```

---

## 2. Struktur Data Progress

### 2.1 Progress Harian (`progress`)

```typescript
interface ProgressData {
  a: number;  // Alphabet + Angka + Vokal
  w: number;  // Kata (Words)
  s: number;  // Kalimat (Sentences)
  c: number;  // Kartu Kustom
  o: number;  // Latihan Fisik
}
```

**Target harian:** 20 interaksi → memicu **reward modal**.

### 2.2 Detail Per-Item

| Key | Tipe | Struktur | Digunakan untuk |
|-----|------|----------|-----------------|
| `wordProgress` | `{id: timestamp}` | `{"w_k1": 1736...}` | Done checkmark + spaced rep |
| `sentenceProgress` | `{id: timestamp}` | `{"s_1": 1736...}` | Done checkmark |
| `oralMotorProgress` | `{id: count}` | `{"om_1": 3}` | Counter latihan |

### 2.3 Milestone Tracking

| Key | Struktur | Contoh |
|-----|----------|--------|
| `milestonesSeen` | `{date: [milestone]}` | `{"Aug 5 2026":["5","10"]}` |

---

## 3. Alur Tracking

### addProgress(type, id?)
```
→ Baca progress → Tambah counter → Simpan detail (jika ada id) → localStorage
```

### updateProgress()
```
→ Total 5 counter → Update Stats bar DOM → Update progress bar
→ checkMilestones(total) → toast di 5/10/15
→ checkReward() → modal di 20
```

---

## 4. Komponen UI Progress

### 4.1 Stats Bar (sticky bottom)
```
🔤 3 │ 📖 5 │ 💬 2 │ 💪 2 │ ⭐ 1 │ 🎯 13
████████████░░░░░░░░░░░░  13 / 20 latihan  [↻ Reset]
```

### 4.2 Progress Per-Kategori
- **Kata:** Progress bar per kategori + "done/total"
- **Kalimat:** Progress bar per grup
- **Fisik:** Counter "✅ Nx"

### 4.3 Stale Review Badge
```
💡 3 kata perlu diulang
```
Muncul di subtitle tab Kata saat ada kata >3 hari belum dilatih.

---

## 5. LocalStorage Keys Lengkap

### Progress & Tracking

| Key | Tipe | Default | Deskripsi |
|-----|------|---------|-----------|
| `progress` | JSON | `{a:0,w:0,s:0,c:0,o:0}` | Counter harian |
| `wordProgress` | JSON | `{}` | `{wordId: timestamp}` |
| `sentenceProgress` | JSON | `{}` | `{sentId: timestamp}` |
| `oralMotorProgress` | JSON | `{}` | `{exId: count}` |
| `rewardDate` | string | — | Tanggal reward terakhir |
| `milestonesSeen` | JSON | `{}` | `{date: [5,10,15]}` |

### Preferensi & State

| Key | Tipe | Default |
|-----|------|---------|
| `appMode` | string | `"adult"` |
| `affectedSide` | string | `"kanan"` |
| `highContrast` | string | `"false"` |
| `reduceMotion` | string | `"false"` |
| `dyslexicFont` | string | `"false"` |
| `lastActiveTab` | string | `"vokalTab"` |
| `sidebarOpen` | string | — |
| `ttsVoice` / `ttsPitch` / `ttsTone` | string | — |
| `autoplaySpeed` | string | `"3"` |
| `audioCuesEnabled` | string | `"true"` |
| `fsVal` / `lsVal` / `lhVal` | string | `"16"`/`"0"`/`"0"` |
| `customCards` | JSON | `"[]"` |

---

## 6. Sistem Reward & Milestone

| Total | Aksi |
|-------|------|
| 5 | Toast: "Lima latihan! Awal yang bagus 🌱" |
| 10 | Toast: "Sepuluh latihan! Kamu hebat ⭐" |
| 15 | Toast: "Lima belas! Tinggal sedikit 🎯" |
| 20 | Modal: "Hebat Sekali! 🎉" (visual only, tanpa TTS) |

Semua milestone **sekali per hari**.

---

## 7. Spaced Repetition

**ICIL ref:** `kognisi/04` — Ebbinghaus forgetting curve

- `wordProgress` menyimpan timestamp setiap kata dilatih
- `getStaleWordCount()`: hitung kata >3 hari belum dilatih
- Badge `💡 N kata perlu diulang` muncul di tab Kata
- Dipanggil dari `updateProgress()` setiap kali progress berubah

---

## 8. Idle Encouragement

**ICIL ref:** `kognisi/07` — emotional design

- `setupIdleEncouragement()`: timer 2 menit
- Reset setiap klik/touch/scroll/keydown
- Toast: "Tidak apa-apa istirahat dulu ya 🌸"
- Auto-hilang setelah 5 detik

---

## 9. Speech Recognition (STT)

**File:** `src/scripts/speech.ts`

- Web Speech API (`SpeechRecognition`)
- Tombol 🎤 "Ucapkan" di fullscreen mode
- Bandingkan ucapan user dengan kata target
- Feedback visual: hijau ✅ / kuning 🔄 / oranye ⚠️
- Fallback: deteksi browser tidak support

---

## 10. Reset Progress

Tombol `↻ Reset` di Stats bar → modal konfirmasi dengan detail stat.

Yang direset: `progress`, `wordProgress`, `sentenceProgress`, `oralMotorProgress`, `milestonesSeen`.

---

## 11. Tracking Per-Kategori

| Kategori | Key | Struktur | Visual |
|----------|-----|----------|--------|
| Huruf/Angka/Vokal | `progress.a` | counter | Stats pill |
| Kata | `progress.w` + `wordProgress` | counter + `{id: ts}` | ✓ + progress bar + stale badge |
| Kalimat | `progress.s` + `sentenceProgress` | counter + `{id: ts}` | ✓ + progress bar |
| Kustom | `progress.c` | counter | Stats pill |
| Fisik | `progress.o` + `oralMotorProgress` | counter + `{id: count}` | ✅ Nx |

---

## 12. Cara Menambah Fitur Tracking Baru

1. Tambah key di `ProgressData`
2. Daftarkan di `TYPE_MAP`
3. Panggil `addProgress()` di handler
4. Update Stats bar HTML + `updateProgress()`
5. Update default localStorage di reset

---

> **Dibuat untuk:** PulihBicara — Terapi Wicara Pasca Stroke
> **Dibuat oleh:** Buffy (AI Agent) — 5 Agustus 2026
> **Diperbarui:** 6 Agustus 2026 — TTS chunked, vibrate guard, custom card validation & resize
