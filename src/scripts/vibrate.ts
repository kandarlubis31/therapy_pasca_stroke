/**
 * vibrate.ts — Safe haptic feedback wrapper
 *
 * Chrome blocks navigator.vibrate() until the user has interacted with the
 * page (tapped/clicked). This wrapper silently catches the error instead of
 * spamming the console with "[Intervention] Blocked call to navigator.vibrate".
 *
 * Usage: safeVibrate(20)  or  safeVibrate([50, 50, 50])
 */

export function safeVibrate(pattern: number | number[]): void {
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Silently ignore — user hasn't interacted with the page yet
  }
}
