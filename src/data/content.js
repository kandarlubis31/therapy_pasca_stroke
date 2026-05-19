// src/data/content.js

export const WORDS = [
    // Keluarga
    { id: 'w_k1', text: 'Ibu',          category: 'Keluarga' },
    { id: 'w_k2', text: 'Ayah',         category: 'Keluarga' },
    { id: 'w_k3', text: 'Kakak',        category: 'Keluarga' },
    { id: 'w_k4', text: 'Adik',         category: 'Keluarga' },
    { id: 'w_k5', text: 'Suami',        category: 'Keluarga' },
    { id: 'w_k6', text: 'Istri',        category: 'Keluarga' },
    { id: 'w_k7', text: 'Anak',         category: 'Keluarga' },
    // Medis
    { id: 'w_m1', text: 'Dokter',       category: 'Medis' },
    { id: 'w_m2', text: 'Perawat',      category: 'Medis' },
    { id: 'w_m3', text: 'Obat',         category: 'Medis' },
    { id: 'w_m4', text: 'Rumah Sakit',  category: 'Medis' },
    // Tubuh
    { id: 'w_t1', text: 'Kepala',       category: 'Tubuh' },
    { id: 'w_t2', text: 'Tangan',       category: 'Tubuh' },
    { id: 'w_t3', text: 'Kaki',         category: 'Tubuh' },
    { id: 'w_t4', text: 'Mata',         category: 'Tubuh' },
    { id: 'w_t5', text: 'Mulut',        category: 'Tubuh' },
    { id: 'w_t6', text: 'Telinga',      category: 'Tubuh' },
    { id: 'w_t7', text: 'Hidung',       category: 'Tubuh' },
    // Makanan
    { id: 'w_f1', text: 'Nasi',         category: 'Makanan' },
    { id: 'w_f2', text: 'Roti',         category: 'Makanan' },
    { id: 'w_f3', text: 'Susu',         category: 'Makanan' },
    { id: 'w_f4', text: 'Air',          category: 'Makanan' },
    { id: 'w_f5', text: 'Apel',         category: 'Makanan' },
    { id: 'w_f6', text: 'Pisang',       category: 'Makanan' },
    { id: 'w_f7', text: 'Sayur',        category: 'Makanan' },
    { id: 'w_f8', text: 'Bubur',        category: 'Makanan' },
    // Tempat
    { id: 'w_p1', text: 'Kamar',        category: 'Tempat' },
    { id: 'w_p2', text: 'Kamar Mandi',  category: 'Tempat' },
    { id: 'w_p3', text: 'Dapur',        category: 'Tempat' },
    { id: 'w_p4', text: 'Rumah',        category: 'Tempat' },
    // Tindakan
    { id: 'w_a1', text: 'Duduk',        category: 'Tindakan' },
    { id: 'w_a2', text: 'Berdiri',      category: 'Tindakan' },
    { id: 'w_a3', text: 'Jalan',        category: 'Tindakan' },
    { id: 'w_a4', text: 'Tidur',        category: 'Tindakan' },
    { id: 'w_a5', text: 'Bangun',       category: 'Tindakan' },
    { id: 'w_a6', text: 'Makan',        category: 'Tindakan' },
    { id: 'w_a7', text: 'Minum',        category: 'Tindakan' },
    { id: 'w_a8', text: 'Tolong',       category: 'Tindakan' },
    // Benda
    { id: 'w_b1', text: 'Kursi',        category: 'Benda' },
    { id: 'w_b2', text: 'Meja',         category: 'Benda' },
    { id: 'w_b3', text: 'Telepon',      category: 'Benda' },
    { id: 'w_b4', text: 'Buku',         category: 'Benda' },
    { id: 'w_b5', text: 'Bantal',       category: 'Benda' },
];

export const SENTENCES = [
    // Salam
    { id: 's_1',  text: 'Selamat pagi.',               group: 'Salam' },
    { id: 's_2',  text: 'Selamat siang.',               group: 'Salam' },
    { id: 's_3',  text: 'Selamat malam.',               group: 'Salam' },
    { id: 's_4',  text: 'Halo, nama saya...',           group: 'Salam' },
    // Kebutuhan Dasar
    { id: 's_5',  text: 'Saya lapar.',                  group: 'Kebutuhan Dasar' },
    { id: 's_6',  text: 'Saya haus.',                   group: 'Kebutuhan Dasar' },
    { id: 's_7',  text: 'Saya mengantuk.',              group: 'Kebutuhan Dasar' },
    { id: 's_8',  text: 'Saya lelah.',                  group: 'Kebutuhan Dasar' },
    { id: 's_9',  text: 'Saya ingin ke kamar mandi.',  group: 'Kebutuhan Dasar' },
    { id: 's_10', text: 'Tolong bantu saya.',           group: 'Kebutuhan Dasar' },
    // Kesehatan
    { id: 's_11', text: 'Saya merasa sakit.',           group: 'Kesehatan' },
    { id: 's_12', text: 'Kepala saya pusing.',          group: 'Kesehatan' },
    { id: 's_13', text: 'Saya butuh obat.',             group: 'Kesehatan' },
    { id: 's_14', text: 'Tolong panggil dokter.',       group: 'Kesehatan' },
    // Komunikasi
    { id: 's_15', text: 'Terima kasih.',                group: 'Komunikasi' },
    { id: 's_16', text: 'Sama-sama.',                   group: 'Komunikasi' },
    { id: 's_17', text: 'Maaf.',                        group: 'Komunikasi' },
    { id: 's_18', text: 'Tidak apa-apa.',               group: 'Komunikasi' },
    { id: 's_19', text: 'Saya mengerti.',               group: 'Komunikasi' },
    { id: 's_20', text: 'Bisa diulang?',                group: 'Komunikasi' },
];

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    .split('')
    .map(l => ({ id: `a_${l}`, text: l }));

export const NUMBERS = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]
    .map(n => ({ id: `n_${n}`, text: String(n) }));

export const VOKAL = [
    { id: 'v_a', text: 'A' },
    { id: 'v_i', text: 'I' },
    { id: 'v_u', text: 'U' },
    { id: 'v_e', text: 'E' },
    { id: 'v_o', text: 'O' }
];