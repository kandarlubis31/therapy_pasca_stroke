/**
 * speech.ts — Speech Recognition (STT) for pronunciation practice
 *
 * Uses Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 * Supported in Chrome & Edge. Falls back gracefully in other browsers.
 */

let recognition: SpeechRecognition | null = null;
let isListening = false;
let currentTarget = '';
let onResultCallback: ((match: boolean, spoken: string) => void) | null = null;

type SpeechRecognition = typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition;

function getRecognition(): SpeechRecognition | null {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  return new SR();
}

/** Check if speech recognition is available */
export function isSpeechSupported(): boolean {
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/** Start listening for user speech, compare against target word */
export function startSpeechMatch(target: string, lang: string, onResult: (match: boolean, spoken: string) => void): void {
  if (isListening) stopListening();

  const rec = getRecognition();
  if (!rec) {
    onResult(false, 'Browser tidak mendukung pengenalan suara');
    return;
  }

  recognition = rec;
  currentTarget = normalizeForCompare(target);
  onResultCallback = onResult;
  isListening = true;

  rec.lang = lang;
  rec.continuous = false;
  rec.interimResults = false;

  rec.onresult = (event: SpeechRecognitionEvent) => {
    const spoken = event.results[0][0].transcript;
    const spokenNorm = normalizeForCompare(spoken);
    const match = spokenNorm === currentTarget ||
      similarityScore(spokenNorm, currentTarget) > 0.75;
    onResultCallback?.(match, spoken);
    stopListening();
  };

  rec.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === 'no-speech') {
      onResultCallback?.(false, '(tidak terdengar)');
    } else if (event.error === 'aborted') {
      // User cancelled, ignore
    } else {
      onResultCallback?.(false, `Error: ${event.error}`);
    }
    stopListening();
  };

  rec.onend = () => {
    isListening = false;
  };

  rec.start();
}

/** Stop listening */
export function stopListening(): void {
  if (recognition) {
    recognition.abort();
    recognition = null;
  }
  isListening = false;
}

/** Check if currently listening */
export function isSpeechListening(): boolean {
  return isListening;
}

/* ── Helpers ────────────────────────────── */
function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarityScore(a: string, b: string): number {
  if (a === b) return 1;
  const aWords = a.split(' ');
  const bWords = b.split(' ');
  let matches = 0;
  for (const aw of aWords) {
    if (bWords.includes(aw)) matches++;
  }
  return matches / Math.max(aWords.length, bWords.length);
}
