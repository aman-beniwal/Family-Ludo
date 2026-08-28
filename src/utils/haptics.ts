/**
 * Best-effort haptic feedback. The Vibration API is unsupported on iOS Safari
 * and installed iPad PWAs, so this is a graceful no-op there and only fires on
 * platforms that support it (e.g. Android). It never throws (plan KTD6 / R14).
 */
export function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore: haptics are a non-essential enhancement.
  }
}
