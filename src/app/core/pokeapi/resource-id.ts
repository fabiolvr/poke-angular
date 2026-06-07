/**
 * Extracts the trailing numeric id from a PokéAPI resource URL.
 *
 *   https://pokeapi.co/api/v2/pokemon/25/   → 25
 *   /pokemon-species/25                     → 25
 *
 * Returns NaN for malformed or non-numeric URLs so callers can treat
 * invalid refs as absent entries (filter with `Number.isFinite`) rather
 * than crashing the page.
 */
const ID_PATTERN = /\/(\d+)\/?$/;

export const extractIdFromUrl = (url: string): number => {
  const match = ID_PATTERN.exec(url);
  return match?.[1] ? Number(match[1]) : Number.NaN;
};
