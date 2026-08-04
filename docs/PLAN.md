# 📋 PulihBicara — Improvement Plan

> **Audit basis:** ICIL v27 — 14+ fakultas
> **Target user:** Pasien pasca-stroke (mode Dewasa) + Anak belajar bicara (mode Anak)
> **Status:** ✅ **SELESAI** — 5 Agustus 2026

---

## ✅ Phase 1 — Cognitive Foundation (Kognisi + IA)

| ID | Item | Status |
|----|------|--------|
| K1 | Sidebar chunking 9→5 grup (collapsible accordion) | ✅ |
| K2 | Spaced repetition badge + getStaleWordCount() | ✅ |
| K3 | Emotional support: milestone 5/10/15 + idle encouragement 2 min | ✅ |
| IA1 | Page title + content-subtitle di semua tab | ✅ |

---

## ✅ Phase 2 — Accessibility & Inclusion

| ID | Item | Status |
|----|------|--------|
| DE1 | Neurodiversity: reduce-motion toggle + dyslexic font (Atkinson Hyperlegible) | ✅ |
| C1 | Speech Recognition STT (Web Speech API) — ucapkan & bandingkan | ✅ |
| M4 | Swipe prevention granular — tambah .om-filter-bar | ✅ |
| P4 | Bottom tab bar labels — deferred (sidebar accordion cukup) | ⏭️ |

---

## ✅ Phase 3 — UX Polish

| ID | Item | Status |
|----|------|--------|
| PG1 | Voice & tone — reword semua error/alert casual Indonesia | ✅ |
| N2 | Staggered card entrance — semua grid (vokal, huruf, angka, kata) | ✅ |
| D4 | Filter button transitions | ✅ |
| V2 | Card text line-height → 1.5 | ✅ |

---

## ✅ Phase 4 — Performance

| ID | Item | Status |
|----|------|--------|
| F2 | Dynamic import code splitting — Quiz & OralMotor lazy load | ✅ |
| F3 | Font size-adjust 105% | ✅ |

---

## ✅ Sebelumnya Sudah Dikerjakan

| ID | Item |
|----|------|
| A1 | Touch targets 44→48px |
| A2 | Focus trap semua modal |
| A3 | Return focus setelah modal close |
| A5 | prefers-contrast + forced-colors |
| M1 | Sidebar spacing tremor-friendly |
| M2 | Grid gap 12px mobile |
| M3 | Haptic feedback konsisten (20+ interaksi) |
| D1 | Body scroll lock modal |
| D2 | aria-busy filter state |
| D3 | Delete undo toast |
| P1 | Exercise filter bar |
| P2 | Live preview custom card |
| P3 | Chunked instruksi step-by-step |
| N1 | Desktop hover states |
| N3 | TTS speak pulse glow |
| S2 | CSP meta tag |
| F1 | Image width/height CLS |

---

> **Total:** 30+ improvements | **Build:** `astro build` — PASS ✅ | **5 Agustus 2026**
