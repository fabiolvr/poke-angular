/**
 * Format a national-dex number with the iconic zero-padded prefix.
 *
 *   1     → "#0001"
 *   25    → "#0025"
 *   1010  → "#1010"
 *
 * Four-digit padding future-proofs against Gen 9+ (already past 1000).
 */
export const formatPokedexNumber = (n: number): string => `#${n.toString().padStart(4, '0')}`;
