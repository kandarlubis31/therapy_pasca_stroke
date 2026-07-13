/**
 * syllable.ts — Pemenggalan suku kata Bahasa Indonesia
 *
 * Aturan standard Bahasa Indonesia:
 * 1. Vokal bisa berdiri sendiri: a-yam, i-bu
 * 2. Konsonan + Vokal (KV) jadi satu suku: ma-kan, lu-pa
 * 3. VK (vokal + konsonan di akhir): in-dah, an-dal
 * 4. Konsonan rangkap (ng, ny, sy, kh, dh, gh, th) milik suku berikutnya: ta-ngan, la-ngit
 * 5. 2 konsonan berbeda: pisah di tengah: ban-tal, pin-dah
 * 6. 3+ konsonan: 1 konsonan pertama milik suku sebelumnya: Ing-gris, In-dra
 * 7. Diftong (ai, au, oi, ei) dianggap satu vokal: sau-da-ra, au-la
 */

const VOWELS = new Set(["a", "i", "u", "e", "o"]);
const DOUBLE_CONS = new Set(["ng", "ny", "sy", "kh", "dh", "gh", "th"]);

function isVowel(c: string): boolean {
  return VOWELS.has(c);
}

function isDoubleCons(w: string, i: number): boolean {
  if (i + 1 >= w.length) return false;
  return DOUBLE_CONS.has(w[i] + w[i + 1]);
}

/**
 * Pemenggalan suku kata untuk kata Bahasa Indonesia.
 */
function splitSyllables(word: string): string[] {
  if (!word || word.length === 0) return [];

  const w = word.toLowerCase().trim();
  if (w.length <= 2) return [w];

  const result: string[] = [];
  let i = 0;

  while (i < w.length) {
    let vowelPos = -1;
    for (let j = i; j < w.length; j++) {
      if (isVowel(w[j])) {
        vowelPos = j;
        break;
      }
    }

    if (vowelPos === -1) {
      result.push(w.slice(i));
      break;
    }

    const postVowel = vowelPos + 1;

    if (postVowel >= w.length) {
      result.push(w.slice(i));
      break;
    }

    if (isVowel(w[postVowel])) {
      result.push(w.slice(i, vowelPos + 1));
      i = vowelPos + 1;
      continue;
    }

    let nextVowelPos = -1;
    for (let j = postVowel; j < w.length; j++) {
      if (isVowel(w[j])) {
        nextVowelPos = j;
        break;
      }
    }

    if (nextVowelPos === -1) {
      result.push(w.slice(i));
      break;
    }

    const consCount = nextVowelPos - postVowel;

    if (consCount === 1) {
      result.push(w.slice(i, vowelPos + 1));
      i = vowelPos + 1;
    } else if (consCount === 2) {
      const pair = w.slice(postVowel, nextVowelPos);

      if (DOUBLE_CONS.has(pair)) {
        result.push(w.slice(i, vowelPos + 1));
        i = vowelPos + 1;
      } else {
        result.push(w.slice(i, postVowel + 1));
        i = postVowel + 1;
      }
    } else {
      const firstTwo = w.slice(postVowel, postVowel + 2);
      if (DOUBLE_CONS.has(firstTwo)) {
        result.push(w.slice(i, postVowel + 2));
        i = postVowel + 2;
      } else {
        result.push(w.slice(i, postVowel + 1));
        i = postVowel + 1;
      }
    }
  }

  if (result.length <= 1 && w.length > 2) {
    return basicFallback(w);
  }

  return result.filter(s => s.length > 0);
}

function basicFallback(word: string): string[] {
  const w = word.toLowerCase();
  const result: string[] = [];
  let buf = "";

  for (let i = 0; i < w.length; i++) {
    buf += w[i];
    if (isVowel(w[i]) && i + 1 < w.length) {
      const next = w[i + 1];
      if (!isVowel(next)) {
        if (i + 2 < w.length && isDoubleCons(w, i + 1)) {
          buf += w[i + 1] + w[i + 2];
          i += 2;
        } else if (!isVowel(next)) {
          if (i + 2 < w.length && isVowel(w[i + 2])) {
            result.push(buf + next);
            buf = "";
            i += 1;
          } else {
            buf += next;
            i += 1;
          }
        }
      }
    }
  }

  if (buf) result.push(buf);
  return result.length > 1 ? result : [word.toLowerCase()];
}

/**
 * Ambil daftar suku kata dari sebuah kata
 */
export function getSyllables(word: string): string[] {
  if (!word || word.length === 0) return [];

  const main = splitSyllables(word);

  if (main.length > 0 && main.length <= word.length) {
    return main;
  }

  return [word.toLowerCase()];
}

/**
 * Buat teks spelling: "makan" → "ma-kan", "tangan" → "ta-ngan"
 */
export function getSpellingText(word: string): string {
  const syllables = getSyllables(word);
  return syllables.join("-");
}
