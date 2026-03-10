/**
 * platform.ts - Utility for OS and platform detection.
 */

export function isMac(): boolean {
  if (typeof window === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Returns the keyboard modifier symbol or label based on OS.
 * For Mac: ⌘ (Command)
 * For others: Ctrl
 * For mobile: empty string
 */
export function getModifierKey(): string {
  if (isMobile()) return '';
  return isMac() ? '⌘' : 'Ctrl';
}

export function getShortcutHint(key: string): string {
  const mod = getModifierKey();
  if (!mod) return '';
  return ` (${mod}${key})`;
}
