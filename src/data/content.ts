// src/data/content.ts

// ─── SHARED INTERFACES ──────────────────

export interface FsItem {
  id: string;
  text: string;
  category?: string;
  group?: string;
}

export interface WordItem {
  id: string;
  text: string;
  category: string;
}

export interface SentenceItem {
  id: string;
  text: string;
  group: string;
}

export interface AlphabetExampleItem {
  id: string;
  text: string;
  example?: string;
}

export interface OroMotorExercise {
  id: string;
  name: string;
  muscle: string;
  instruction: string;
  holdSec: number;
  reps: number;
}

export interface LimbExercise {
  id: string;
  name: string;
  area: string;
  instruction: string;
  holdSec: number;
  reps: number;
  /** Which side to use: 'kanan' = right (affected), 'kiri' = left (affected), 'keduanya' = both */
  side: 'kanan' | 'kiri' | 'keduanya';
  /** Optional hint about using healthy limb to assist the weak one */
  assistedHint?: string;
}

// ─── WORD CATEGORIES ────────────────────
// Urutan kategori: yang paling sering dipakai dulu
export const WORD_CATEGORY_ORDER: string[] = [
  'Keluarga', 'Tindakan', 'Kebutuhan', 'Makanan', 'Tubuh', 'Tempat', 'Benda', 'Medis'
];

export const WORD_CATEGORY_ICONS: Record<string, string> = {
  'Keluarga': '👨‍👩‍👧‍👦',
  'Tindakan': '🏃',
  'Kebutuhan': '💡',
  'Makanan': '🍽️',
  'Tubuh': '🦴',
  'Tempat': '🏠',
  'Benda': '📦',
  'Medis': '🏥',
};

export const WORDS: WordItem[] = [
  // Keluarga (paling sering dipakai)
  { id: 'w_k1', text: 'Ibu',          category: 'Keluarga' },
  { id: 'w_k2', text: 'Ayah',         category: 'Keluarga' },
  { id: 'w_k3', text: 'Kakak',        category: 'Keluarga' },
  { id: 'w_k4', text: 'Adik',         category: 'Keluarga' },
  { id: 'w_k5', text: 'Suami',        category: 'Keluarga' },
  { id: 'w_k6', text: 'Istri',        category: 'Keluarga' },
  { id: 'w_k7', text: 'Anak',         category: 'Keluarga' },
  { id: 'w_k8', text: 'Nenek',        category: 'Keluarga' },
  { id: 'w_k9', text: 'Kakek',        category: 'Keluarga' },
  { id: 'w_k10', text: 'Paman',       category: 'Keluarga' },
  { id: 'w_k11', text: 'Bibi',        category: 'Keluarga' },
  // Tindakan (komunikasi sehari-hari)
  { id: 'w_a1', text: 'Duduk',        category: 'Tindakan' },
  { id: 'w_a2', text: 'Berdiri',      category: 'Tindakan' },
  { id: 'w_a3', text: 'Jalan',        category: 'Tindakan' },
  { id: 'w_a4', text: 'Tidur',        category: 'Tindakan' },
  { id: 'w_a5', text: 'Bangun',       category: 'Tindakan' },
  { id: 'w_a6', text: 'Makan',        category: 'Tindakan' },
  { id: 'w_a7', text: 'Minum',        category: 'Tindakan' },
  { id: 'w_a8', text: 'Tolong',       category: 'Tindakan' },
  { id: 'w_a9', text: 'Buka',         category: 'Tindakan' },
  { id: 'w_a10', text: 'Tutup',       category: 'Tindakan' },
  { id: 'w_a11', text: 'Dengar',      category: 'Tindakan' },
  { id: 'w_a12', text: 'Lihat',       category: 'Tindakan' },
  // Kebutuhan (penting untuk komunikasi darurat)
  { id: 'w_n1', text: 'Lapar',        category: 'Kebutuhan' },
  { id: 'w_n2', text: 'Haus',         category: 'Kebutuhan' },
  { id: 'w_n3', text: 'Sakit',        category: 'Kebutuhan' },
  { id: 'w_n4', text: 'Lelah',        category: 'Kebutuhan' },
  { id: 'w_n5', text: 'Mandi',        category: 'Kebutuhan' },
  { id: 'w_n6', text: 'Dingin',       category: 'Kebutuhan' },
  { id: 'w_n7', text: 'Panas',        category: 'Kebutuhan' },
  // Makanan
  { id: 'w_f1', text: 'Nasi',         category: 'Makanan' },
  { id: 'w_f2', text: 'Roti',         category: 'Makanan' },
  { id: 'w_f3', text: 'Susu',         category: 'Makanan' },
  { id: 'w_f4', text: 'Air',          category: 'Makanan' },
  { id: 'w_f5', text: 'Apel',         category: 'Makanan' },
  { id: 'w_f6', text: 'Pisang',       category: 'Makanan' },
  { id: 'w_f7', text: 'Sayur',        category: 'Makanan' },
  { id: 'w_f8', text: 'Bubur',        category: 'Makanan' },
  { id: 'w_f9', text: 'Telur',        category: 'Makanan' },
  { id: 'w_f10', text: 'Ikan',        category: 'Makanan' },
  { id: 'w_f11', text: 'Daging',      category: 'Makanan' },
  { id: 'w_f12', text: 'Teh',         category: 'Makanan' },
  // Tubuh
  { id: 'w_t1', text: 'Kepala',       category: 'Tubuh' },
  { id: 'w_t2', text: 'Tangan',       category: 'Tubuh' },
  { id: 'w_t3', text: 'Kaki',         category: 'Tubuh' },
  { id: 'w_t4', text: 'Mata',         category: 'Tubuh' },
  { id: 'w_t5', text: 'Mulut',        category: 'Tubuh' },
  { id: 'w_t6', text: 'Telinga',      category: 'Tubuh' },
  { id: 'w_t7', text: 'Hidung',       category: 'Tubuh' },
  { id: 'w_t8', text: 'Lidah',        category: 'Tubuh' },
  { id: 'w_t9', text: 'Gigi',         category: 'Tubuh' },
  // Tempat
  { id: 'w_p1', text: 'Kamar',        category: 'Tempat' },
  { id: 'w_p2', text: 'Kamar Mandi',  category: 'Tempat' },
  { id: 'w_p3', text: 'Dapur',        category: 'Tempat' },
  { id: 'w_p4', text: 'Rumah',        category: 'Tempat' },
  { id: 'w_p5', text: 'Teras',        category: 'Tempat' },
  { id: 'w_p6', text: 'Halaman',      category: 'Tempat' },
  // Benda
  { id: 'w_b1', text: 'Kursi',        category: 'Benda' },
  { id: 'w_b2', text: 'Meja',         category: 'Benda' },
  { id: 'w_b3', text: 'Telepon',      category: 'Benda' },
  { id: 'w_b4', text: 'Buku',         category: 'Benda' },
  { id: 'w_b5', text: 'Bantal',       category: 'Benda' },
  { id: 'w_b6', text: 'Selimut',      category: 'Benda' },
  { id: 'w_b7', text: 'Piring',       category: 'Benda' },
  { id: 'w_b8', text: 'Gelas',        category: 'Benda' },
  { id: 'w_b9', text: 'Sendok',       category: 'Benda' },
  // Medis
  { id: 'w_m1', text: 'Dokter',       category: 'Medis' },
  { id: 'w_m2', text: 'Perawat',      category: 'Medis' },
  { id: 'w_m3', text: 'Obat',         category: 'Medis' },
  { id: 'w_m4', text: 'Rumah Sakit',  category: 'Medis' },
  { id: 'w_m5', text: 'Terapi',       category: 'Medis' },
  { id: 'w_m6', text: 'Farmasi',      category: 'Medis' },
];

export const SENTENCE_GROUP_ORDER: string[] = [
  'Salam', 'Kebutuhan Dasar', 'Kesehatan', 'Komunikasi'
];

export const SENTENCE_GROUP_ICONS: Record<string, string> = {
  'Salam': '👋',
  'Kebutuhan Dasar': '💧',
  'Kesehatan': '🩺',
  'Komunikasi': '🗣️',
};

export const SENTENCES: SentenceItem[] = [
  // Salam
  { id: 's_1',  text: 'Selamat pagi.',               group: 'Salam' },
  { id: 's_2',  text: 'Selamat siang.',               group: 'Salam' },
  { id: 's_3',  text: 'Selamat malam.',               group: 'Salam' },
  { id: 's_4',  text: 'Halo, nama saya...',           group: 'Salam' },
  { id: 's_21', text: 'Selamat sore.',                 group: 'Salam' },
  { id: 's_22', text: 'Apa kabar?',                    group: 'Salam' },
  { id: 's_23', text: 'Senang bertemu Anda.',          group: 'Salam' },
  // Kebutuhan Dasar
  { id: 's_5',  text: 'Saya lapar.',                  group: 'Kebutuhan Dasar' },
  { id: 's_6',  text: 'Saya haus.',                   group: 'Kebutuhan Dasar' },
  { id: 's_7',  text: 'Saya mengantuk.',              group: 'Kebutuhan Dasar' },
  { id: 's_8',  text: 'Saya lelah.',                  group: 'Kebutuhan Dasar' },
  { id: 's_9',  text: 'Saya ingin ke kamar mandi.',  group: 'Kebutuhan Dasar' },
  { id: 's_10', text: 'Tolong bantu saya.',           group: 'Kebutuhan Dasar' },
  { id: 's_24', text: 'Tolong ambilkan air.',          group: 'Kebutuhan Dasar' },
  { id: 's_25', text: 'Saya mau duduk.',               group: 'Kebutuhan Dasar' },
  // Kesehatan
  { id: 's_11', text: 'Saya merasa sakit.',           group: 'Kesehatan' },
  { id: 's_12', text: 'Kepala saya pusing.',          group: 'Kesehatan' },
  { id: 's_13', text: 'Saya butuh obat.',             group: 'Kesehatan' },
  { id: 's_14', text: 'Tolong panggil dokter.',       group: 'Kesehatan' },
  { id: 's_26', text: 'Saya demam.',                   group: 'Kesehatan' },
  { id: 's_27', text: 'Tolong perban ini.',            group: 'Kesehatan' },
  { id: 's_28', text: 'Saya susah bicara.',            group: 'Kesehatan' },
  // Komunikasi
  { id: 's_15', text: 'Terima kasih.',                group: 'Komunikasi' },
  { id: 's_16', text: 'Sama-sama.',                   group: 'Komunikasi' },
  { id: 's_17', text: 'Maaf.',                        group: 'Komunikasi' },
  { id: 's_18', text: 'Tidak apa-apa.',               group: 'Komunikasi' },
  { id: 's_19', text: 'Saya mengerti.',               group: 'Komunikasi' },
  { id: 's_20', text: 'Bisa diulang?',                group: 'Komunikasi' },
  { id: 's_29', text: 'Saya mau coba lagi.',           group: 'Komunikasi' },
  { id: 's_30', text: 'Tolong bicara pelan-pelan.',    group: 'Komunikasi' },
];

export const ALPHABET_EXAMPLES: Record<string, string> = {
  'A': 'Api',
  'B': 'Bintang',
  'C': 'Cincin',
  'D': 'Dada',
  'E': 'Enam',
  'F': 'Foto',
  'G': 'Gigi',
  'H': 'Hujan',
  'I': 'Ikan',
  'J': 'Jari',
  'K': 'Kucing',
  'L': 'Lampu',
  'M': 'Mobil',
  'N': 'Nyanyi',
  'O': 'Orang',
  'P': 'Pohon',
  'R': 'Roda',
  'S': 'Sepatu',
  'T': 'Terbang',
  'U': 'Ular',
  'V': 'Vitamin',
  'W': 'Warna',
  'Y': 'Yakin',
};

export const ALPHABET: FsItem[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  .split('')
  .map(l => ({ id: `a_${l}`, text: l }));

export const NUMBERS: FsItem[] = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]
  .map(n => ({ id: `n_${n}`, text: String(n) }));

// ─── ORO-MOTOR EXERCISES ───────────────
export const ORO_MOTOR_ICONS: Record<string, string> = {
  'Bibir': '👄',
  'Lidah': '👅',
  'Rahang': '🦷',
  'Pipi': '😊',
};

export const ORO_MOTOR_EXERCISES: OroMotorExercise[] = [
  // Bibir
  { id: 'om_1', name: 'Monyong & Senyum', muscle: 'Bibir',
    instruction: 'Bergantian antara bibir monyong (seperti mau cium) dan senyum lebar. Tahan masing-masing 3 detik.',
    holdSec: 3, reps: 10 },
  { id: 'om_2', name: 'Letupan Bibir', muscle: 'Bibir',
    instruction: 'Rapatkan bibir kuat-kuat, lalu buka dengan bunyi "pop". Ulangi seperti bunyi huruf P atau B.',
    holdSec: 2, reps: 10 },
  // Lidah
  { id: 'om_3', name: 'Julurkan Lidah', muscle: 'Lidah',
    instruction: 'Julurkan lidah lurus ke depan sejauh mungkin, tahan, lalu tarik kembali perlahan.',
    holdSec: 4, reps: 8 },
  { id: 'om_4', name: 'Lidah Ke Samping', muscle: 'Lidah',
    instruction: 'Gerakkan ujung lidah ke sudut kiri mulut, lalu ke kanan. Bergantian dengan perlahan.',
    holdSec: 3, reps: 10 },
  { id: 'om_5', name: 'Lidah Ke Atas', muscle: 'Lidah',
    instruction: 'Angkat ujung lidah menyentuh langit-langit mulut tepat di belakang gigi depan atas.',
    holdSec: 4, reps: 8 },
  // Rahang
  { id: 'om_6', name: 'Buka Tutup Mulut', muscle: 'Rahang',
    instruction: 'Buka mulut lebar perlahan (senyaman mungkin), tahan sebentar, lalu tutup perlahan. Jangan dipaksakan.',
    holdSec: 3, reps: 8 },
  // Pipi
  { id: 'om_7', name: 'Kembungkan Pipi', muscle: 'Pipi',
    instruction: 'Isi kedua pipi dengan udara, tahan, lalu keluarkan perlahan. Bisa juga bergantian kiri dan kanan.',
    holdSec: 5, reps: 6 },
  { id: 'om_8', name: 'Tiup Pelan', muscle: 'Pipi',
    instruction: 'Tarik napas dalam, lalu tiupkan udara perlahan melalui bibir yang sedikit terbuka seperti meniup lilin.',
    holdSec: 0, reps: 8 },
];

// ─── ALL EXERCISES (COMBINED) ──────────
// Unified exercise type for the guided timer system
export type AnyExercise = OroMotorExercise | LimbExercise;
export const EXERCISE_GROUPS = ['Otot Mulut', 'Tangan', 'Kaki', 'Keseimbangan'];
export const EXERCISE_ICONS: Record<string, string> = {
  'Otot Mulut': '😮',
  'Tangan': '🖐️',
  'Kaki': '🦵',
  'Keseimbangan': '🧘',
};
export const EXERCISE_SUB_ICONS: Record<string, string> = {
  ...ORO_MOTOR_ICONS,
  'Tangan': '🖐️',
  'Kaki': '🦵',
  'Keseimbangan': '🧘',
};

// ─── LIMB EXERCISES (Anggota Tubuh) ────
export const LIMB_EXERCISES: LimbExercise[] = [
  // Tangan (fokus hemiparesis kanan — tangan kanan lemah karena otak kiri stroke)
  { id: 'lb_1', name: 'Angkat Bahu', area: 'Tangan',
    instruction: 'Duduk tegak. Angkat kedua bahu ke atas menuju telinga, tahan, lalu turunkan perlahan. Bisa dibantu tangan sehat.',
    holdSec: 3, reps: 10, side: 'keduanya' },
  { id: 'lb_2', name: 'Rentangkan Tangan', area: 'Tangan',
    instruction: 'Tangan di samping badan. Perlahan angkat lengan yang lemah ke samping sejauh mungkin. Bisa dibantu tangan sehat.',
    holdSec: 3, reps: 8, side: 'kanan',
    assistedHint: '🤝 Gunakan tangan sehat untuk bantu angkat lengan yang lemah.' },
  { id: 'lb_3', name: 'Kepal & Buka', area: 'Tangan',
    instruction: 'Kepalkan tangan yang lemah kuat-kuat, tahan, lalu buka jari lebar-lebar. Kalau susah, bisa dibantu tangan sehat.',
    holdSec: 3, reps: 12, side: 'kanan',
    assistedHint: '🤝 Gunakan tangan sehat untuk bantu kepal & buka jari yang lemah.' },
  { id: 'lb_4', name: 'Dorong Ke Depan', area: 'Tangan',
    instruction: 'Kaitkan kedua tangan di depan dada, dorong lurus ke depan sejauh mungkin, tahan, lalu tarik kembali.',
    holdSec: 4, reps: 8, side: 'keduanya' },
  { id: 'lb_5', name: 'Putar Pergelangan', area: 'Tangan',
    instruction: 'Putar pergelangan tangan yang lemah searah jarum jam 5x, lalu berlawanan 5x. Lakukan perlahan.',
    holdSec: 0, reps: 10, side: 'kanan',
    assistedHint: '🤝 Pegang pergelangan yang lemah dengan tangan sehat, lalu bantu putar.' },
  // Kaki
  { id: 'lb_6', name: 'Angkat Lutut', area: 'Kaki',
    instruction: 'Duduk di kursi. Angkat lutut kaki yang lemah perlahan setinggi mungkin, tahan, lalu turunkan.',
    holdSec: 3, reps: 8, side: 'kanan',
    assistedHint: '🤝 Gunakan kedua tangan di bawah paha untuk bantu angkat kaki yang lemah.' },
  { id: 'lb_7', name: 'Luruskan Kaki', area: 'Kaki',
    instruction: 'Duduk dengan punggung tegak. Luruskan kaki yang lemah ke depan sejajar lantai, tahan, turunkan perlahan.',
    holdSec: 4, reps: 8, side: 'kanan',
    assistedHint: '🤝 Tangan sehat bisa menopang di bawah betis untuk bantu luruskan kaki.' },
  { id: 'lb_8', name: 'Putar Pergelangan Kaki', area: 'Kaki',
    instruction: 'Putar pergelangan kaki yang lemah: 10x searah jarum jam, 10x berlawanan. Jaga tumit tetap di lantai.',
    holdSec: 0, reps: 10, side: 'kanan',
    assistedHint: '🤝 Silangkan kaki yang lemah ke lutut sehat, lalu tangan bantu putar pergelangan.' },
  { id: 'lb_9', name: 'Jinjit Duduk', area: 'Kaki',
    instruction: 'Kedua telapak kaki rata di lantai. Angkat tumit setinggi mungkin (jinjit), tahan, turunkan.',
    holdSec: 3, reps: 10, side: 'keduanya' },
  // Keseimbangan
  { id: 'lb_10', name: 'Geser Berat Badan', area: 'Keseimbangan',
    instruction: 'Duduk tegak tanpa bersandar. Geser berat badan ke kanan perlahan, tahan, kembali ke tengah, lalu ke kiri.',
    holdSec: 3, reps: 10, side: 'keduanya' },
  { id: 'lb_11', name: 'Raih Ke Depan', area: 'Keseimbangan',
    instruction: 'Kaitkan kedua tangan di depan dada. Raih ke depan sejauh mungkin tanpa jatuh, tahan, kembali.',
    holdSec: 5, reps: 8, side: 'keduanya' },
  { id: 'lb_12', name: 'Putar Badan', area: 'Keseimbangan',
    instruction: 'Duduk tegak, tangan di paha. Putar badan ke kanan perlahan, tahan, kembali, lalu ke kiri.',
    holdSec: 3, reps: 8, side: 'keduanya' },
];

export const VOKAL: FsItem[] = [
  { id: 'v_a', text: 'A' },
  { id: 'v_i', text: 'I' },
  { id: 'v_u', text: 'U' },
  { id: 'v_e', text: 'E' },
  { id: 'v_o', text: 'O' }
];
