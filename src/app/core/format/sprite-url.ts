/**
 * Local placeholder shown when a sprite is missing or fails to load.
 * Served from `public/img/missing-sprite.svg`.
 */
export const FALLBACK_SPRITE = 'img/missing-sprite.svg';

/**
 * Official-artwork sprite URL for a Pokémon, addressed directly on the
 * PokeAPI/sprites GitHub mirror so callers get a thumbnail from just an
 * id (no extra API call). Falls back to the local placeholder for
 * non-finite / non-positive ids.
 *
 * This is a *view* helper (URL building from a known id) — distinct from
 * the data-access `mapSprites`, which maps a PokéAPI sprites DTO into the
 * domain model.
 */
export const pokemonArtworkUrl = (id: number): string => {
  if (!Number.isFinite(id) || id <= 0) return FALLBACK_SPRITE;
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
};
