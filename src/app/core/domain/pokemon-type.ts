/**
 * The 18 canonical Pokémon types. Source of truth for both the domain
 * (`Pokemon.types`) and the theme layer (which maps each name to a CSS
 * variable and a contrast-aware label colour).
 *
 * Order follows the canonical Pokédex grouping (normal → fairy) so the
 * styleguide and the type filter UIs render them deterministically.
 */
export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

export type PokemonTypeName = (typeof POKEMON_TYPES)[number];

const POKEMON_TYPE_SET: ReadonlySet<string> = new Set(POKEMON_TYPES);

export const isPokemonTypeName = (value: unknown): value is PokemonTypeName =>
  typeof value === 'string' && POKEMON_TYPE_SET.has(value);
