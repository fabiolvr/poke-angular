/**
 * Wire shapes returned by PokéAPI v2 for the detail page. Private to
 * this feature's data-access boundary — features only see domain models.
 *
 * The base /pokemon DTO is identical to the one in pokemon-list's
 * data-access (we don't share to keep features independently
 * deletable). Only the species + evolution chain shapes are new.
 */

export interface PokemonNameRefDto {
  readonly name: string;
  readonly url: string;
}

export interface PokemonDetailDto {
  readonly id: number;
  readonly name: string;
  readonly height: number;
  readonly weight: number;
  readonly base_experience: number | null;
  readonly types: readonly PokemonTypeSlotDto[];
  readonly abilities: readonly PokemonAbilitySlotDto[];
  readonly stats: readonly PokemonStatSlotDto[];
  readonly sprites: PokemonSpritesDto;
  readonly species: PokemonNameRefDto;
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

export interface PokemonSpeciesDto {
  readonly id: number;
  readonly name: string;
  readonly names: readonly { readonly language: PokemonNameRefDto; readonly name: string }[];
  readonly genera: readonly { readonly language: PokemonNameRefDto; readonly genus: string }[];
  readonly flavor_text_entries: readonly {
    readonly flavor_text: string;
    readonly language: PokemonNameRefDto;
    readonly version: PokemonNameRefDto;
  }[];
  readonly evolution_chain: { readonly url: string } | null;
  readonly evolves_from_species: PokemonNameRefDto | null;
  readonly is_legendary: boolean;
  readonly is_mythical: boolean;
}

export interface EvolutionChainDto {
  readonly id: number;
  readonly chain: EvolutionLinkDto;
}

export interface EvolutionLinkDto {
  readonly species: PokemonNameRefDto;
  readonly evolves_to: readonly EvolutionLinkDto[];
}
