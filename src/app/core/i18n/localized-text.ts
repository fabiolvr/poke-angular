/**
 * App language → ordered PokéAPI language codes to try when reading a
 * localized field. pt-BR cascades pt-br → pt → en so a Pokémon with only
 * European-Portuguese or English text still renders something; en stays
 * strict. Unknown languages fall back to English.
 */
export const LANG_LOOKUP_FALLBACKS: Record<string, readonly string[]> = {
  'pt-BR': ['pt-br', 'pt-BR', 'pt', 'en'],
  en: ['en'],
};

/**
 * Picks the best available value from a `langCode → text` map for the
 * given app language, walking {@link LANG_LOOKUP_FALLBACKS} in order.
 * Returns `fallbackValue` (default `''`) when no candidate matches.
 */
export const pickLocalized = (
  map: ReadonlyMap<string, string>,
  lang: string,
  fallbackValue = '',
): string => {
  const codes = LANG_LOOKUP_FALLBACKS[lang] ?? ['en'];
  for (const code of codes) {
    const candidate = map.get(code);
    if (candidate) return candidate;
  }
  return fallbackValue;
};
