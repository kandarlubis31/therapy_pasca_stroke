/**
 * syllable.js — Pemenggalan suku kata Bahasa Indonesia
 *
 * Aturan:
 * 1. Vokal (V) bisa berdiri sendiri → a-yam, i-bu
 * 2. Konsonan+Vokal (KV) → ku-da, ma-kan
 * 3. Konsonan rangkap (ng, ny, sy, kh) milik suku berikutnya → ta-ngan
 * 4. 2 konsonan berbeda: split di tengah → ban-tal
 */

const VOWELS = new Set(["a", "i", "u", "e", "o"]);
const DOUBLE_CONS = new Set(["ng", "ny", "sy", "kh", "dh", "gh", "th"]);

function isVowel(c) {
  return VOWELS.has(c);
}

/**
 * Pemenggalan suku kata untuk kata Bahasa Indonesia:
 * - Cari posisi vokal
 * - Split sebelum konsonan yang diikuti vokal
 */
function splitSimple(word) {
  if (!word || word.length === 0) return [];
  
  const lower = word.toLowerCase().trim();
  if (lower.length <= 2) return [lower];
  
  const result = [];
  let start = 0;
  
  for (let i = 1; i < lower.length; i++) {
    // Jika huruf ini konsonan dan huruf sebelumnya vokal,
    // dan masih ada huruf setelahnya yang vokal → split
    if (i + 1 < lower.length) {
      const prev = lower[i - 1];
      const curr = lower[i];
      const next = lower[i + 1];
      
      if (isVowel(prev) && !isVowel(curr) && isVowel(next)) {
        // Simple split: KV-KV pattern
        result.push(lower.slice(start, i));
        start = i;
      }
      // Cek double consonant: ng, ny, sy, kh
      else if (i + 2 < lower.length && !isVowel(curr) && !isVowel(next)) {
        const pair = curr + next;
        const nnext = lower[i + 2];
        
        if (DOUBLE_CONS.has(pair) && isVowel(nnext)) {
          // ng/ny/sy/kh milik suku berikutnya
          result.push(lower.slice(start, i));
          start = i;
        } else if (!DOUBLE_CONS.has(pair) && isVowel(nnext)) {
          // 2 konsonan berbeda: split di tengah
          result.push(lower.slice(start, i + 1));
          start = i + 1;
        }
      }
    }
  }
  
  // Sisa kata
  if (start < lower.length) {
    result.push(lower.slice(start));
  }
  
  // Fallback kalo gagal split
  if (result.length <= 1) {
    // Coba split manual per vokal
    const manual = [];
    let s = 0;
    for (let j = 1; j < lower.length; j++) {
      if (isVowel(lower[j]) && !isVowel(lower[j - 1]) && j > s) {
        if (j - s > 0) {
          manual.push(lower.slice(s, j));
          s = j;
        }
      }
    }
    if (s < lower.length) manual.push(lower.slice(s));
    
    return manual.length > 1 ? manual : [lower];
  }
  
  return result;
}

/**
 * Ambil pemenggalan terbaik
 */
export function getSyllables(word) {
  const simple = splitSimple(word);
  if (simple.length > 1) return simple;
  
  // Fallback: split per karakter untuk kata pendek
  if (word.length <= 3) {
    const chars = [...word.toLowerCase()];
    const result = [];
    let buf = chars[0] || "";
    for (let i = 1; i < chars.length; i++) {
      if (isVowel(chars[i]) && !isVowel(chars[i - 1])) {
        if (buf.length > 0) result.push(buf);
        buf = chars[i];
      } else {
        buf += chars[i];
      }
    }
    if (buf) result.push(buf);
    return result.length > 1 ? result : [word.toLowerCase()];
  }
  
  return [word.toLowerCase()];
}

/**
 * Buat teks spelling: "ayam" → "a-yam", "ibu" → "i-bu"
 */
export function getSpellingText(word) {
  const syllables = getSyllables(word);
  return syllables.join("-");
}
