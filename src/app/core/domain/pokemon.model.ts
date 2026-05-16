import type { PokemonSpecies } from './pokemon-species';
import type { PokemonStat } from './pokemon-stat';
import type { PokemonTypeName } from './pokemon-type';

/**
 * Sprites surfaced by the UI. PokéAPI returns dozens of variants
 * (game-specific, female, etc.); we only carry what the cards and detail
 * page actually render. Mapper picks a sensible fallback when a variant is
 * absent (e.g. for newer Pokémon without an official artwork yet).
 */
export interface PokemonSprites {
  readonly thumbnail: string | null;
  readonly artwork: string | null;
  readonly shiny: string | null;
}

/**
 * Lightweight projection used by the listing and search results. Carries
 * exactly what a card needs to render — name, dex number, types, and the
 * two sprites — so feature code never reaches into the wire DTOs.
 */
export interface PokemonSummary {
  readonly id: number;
  readonly name: string;
  readonly types: readonly PokemonTypeName[];
  readonly sprites: PokemonSprites;
}

export interface PokemonPage {
  readonly items: readonly PokemonSummary[];
  readonly total: number;
  readonly offset: number;
  readonly limit: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
}

/**
 * Full Pokémon model used by the detail feature. Kept lean: only the fields
 * we actually render. Additional fields (moves, evolution chain, encounters)
 * will be added when their respective sections are built, not preemptively.
 */
export interface Pokemon {
  readonly id: number;
  readonly name: string;
  readonly heightDecimetres: number;
  readonly weightHectograms: number;
  readonly baseExperience: number | null;
  readonly types: readonly PokemonTypeName[];
  readonly abilities: readonly PokemonAbility[];
  readonly stats: readonly PokemonStat[];
  readonly sprites: PokemonSprites;
}

export interface PokemonAbility {
  readonly name: string;
  readonly isHidden: boolean;
}

/**
 * Full detail-page payload. Combines the form-level `Pokemon` (sprites,
 * stats, abilities, types) with the species-level data needed for the
 * detail header and evolution section.
 */
export interface PokemonDetail extends Pokemon {
  readonly species: PokemonSpecies;
}
