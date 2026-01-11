/**
 * String utilities for REIS.
 * Enforces Margin of Safety (Via Negativa): Handle empty strings gracefully.
 */

/**
 * Capitalizes the first letter of a string.
 * "zkouška" -> "Zkouška"
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
