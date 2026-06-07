/**
 * The six combat stats every Pokémon has. PokéAPI uses kebab-case for the
 * "special" pair (`special-attack`, `special-defense`) — we keep that shape
 * so mappers don't have to invent translations.
 */
export const POKEMON_STAT_NAMES = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const;

export type PokemonStatName = (typeof POKEMON_STAT_NAMES)[number];

const POKEMON_STAT_SET: ReadonlySet<string> = new Set(POKEMON_STAT_NAMES);

export const isPokemonStatName = (value: unknown): value is PokemonStatName =>
  typeof value === 'string' && POKEMON_STAT_SET.has(value);

export interface PokemonStat {
  readonly name: PokemonStatName;
  readonly base: number;
  readonly effort: number;
}

/**
 * The in-game cap for a single base stat before EVs/IVs. PokéAPI ships
 * `base_stat` values in [0, MAX_BASE_STAT]; views render bar widths as a
 * percentage of this cap.
 */
export const MAX_BASE_STAT = 255;
