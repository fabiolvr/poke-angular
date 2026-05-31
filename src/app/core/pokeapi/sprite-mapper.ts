import type { PokemonSprites } from '@core/domain';

/** Minimal structural shape of PokéAPI's nested `sprites` object. */
export interface SpritesDto {
  readonly front_default: string | null;
  readonly front_shiny: string | null;
  readonly other?: {
    readonly 'official-artwork'?: {
      readonly front_default: string | null;
      readonly front_shiny?: string | null;
    };
    readonly home?: {
      readonly front_default: string | null;
      readonly front_shiny?: string | null;
    };
  };
}

/**
 * Cascade through PokéAPI's sprite paths so Mega/Gigantamax/Alolan/etc.
 * variants render — `front_default` is frequently null on alternate forms,
 * but Pokémon HOME renders cover almost every variant.
 *
 * - thumbnail (card-sized): front_default → home → official-artwork
 * - artwork (detail hero):  official-artwork → home → front_default
 * - shiny (toggle):         official-artwork.shiny → home.shiny →
 *                           front_shiny → front_default
 *
 * The shiny fall-through ends at `front_default` so a sprite-less shiny
 * toggle still shows the regular artwork rather than the missing-sprite
 * placeholder.
 */
export const mapSprites = (dto: SpritesDto): PokemonSprites => {
  const home = dto.other?.home?.front_default ?? null;
  const artwork = dto.other?.['official-artwork']?.front_default ?? null;
  const officialShiny = dto.other?.['official-artwork']?.front_shiny ?? null;
  const homeShiny = dto.other?.home?.front_shiny ?? null;
  return {
    thumbnail: dto.front_default ?? home ?? artwork,
    artwork: artwork ?? home ?? dto.front_default,
    shiny: officialShiny ?? homeShiny ?? dto.front_shiny ?? dto.front_default,
  };
};
