/**
 * Wire shapes returned by PokéAPI v2. These types are private to the
 * data-access boundary — features only see the domain models from
 * @core/domain.
 *
 * We model only the fields we read. If the API ships a field we ignore,
 * TypeScript won't complain because we don't access it; if a field we DO
 * read goes missing at runtime, the mapper defaults gracefully (see
 * pokeapi.mapper.ts). The shape is intentionally `readonly` and shallow.
 */

export interface PokemonListResponseDto {
  readonly count: number;
  readonly next: string | null;
  readonly previous: string | null;
  readonly results: readonly PokemonNameRefDto[];
}

export interface PokemonNameRefDto {
  readonly name: string;
  readonly url: string;
}

export interface PokemonDto {
  readonly id: number;
  readonly name: string;
  readonly height: number;
  readonly weight: number;
  readonly base_experience: number | null;
  readonly types: readonly PokemonTypeSlotDto[];
  readonly abilities: readonly PokemonAbilitySlotDto[];
  readonly stats: readonly PokemonStatSlotDto[];
  readonly sprites: PokemonSpritesDto;
}

export interface PokemonTypeSlotDto {
  readonly slot: number;
  readonly type: PokemonNameRefDto;
}

export interface PokemonAbilitySlotDto {
  readonly ability: PokemonNameRefDto;
  readonly is_hidden: boolean;
  readonly slot: number;
}

export interface PokemonStatSlotDto {
  readonly base_stat: number;
  readonly effort: number;
  readonly stat: PokemonNameRefDto;
}

export interface PokemonSpritesDto {
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
