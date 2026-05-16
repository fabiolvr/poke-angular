/**
 * Canonical list of the 18 Pokémon types and their mapped design tokens.
 *
 * The CSS variables themselves live in `src/styles/tokens.css` under @theme
 * (e.g. `--color-type-fire`). This file mirrors those names as TS values so
 * features can look up classes/vars without hardcoding strings. If you add a
 * type here, add it there too — the type checker enforces exhaustiveness.
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

/** CSS custom-property name (e.g. for inline `style` bindings). */
export const pokemonTypeVar = (type: PokemonTypeName): string => `var(--color-type-${type})`;

/** Tailwind background utility class (e.g. `bg-type-fire`). */
export const pokemonTypeBgClass = (type: PokemonTypeName): string => `bg-type-${type}`;

/** Tailwind text utility class (e.g. `text-type-fire`). */
export const pokemonTypeTextClass = (type: PokemonTypeName): string => `text-type-${type}`;

/**
 * Contrast guidance: a few type colors (electric, ice, fairy, normal) are too
 * light for white text — flag them so badges render ink-colored labels.
 */
const LIGHT_TYPE_BACKGROUNDS = new Set<PokemonTypeName>([
  'electric',
  'ice',
  'fairy',
  'ground',
  'normal',
]);

export const pokemonTypeNeedsDarkLabel = (type: PokemonTypeName): boolean =>
  LIGHT_TYPE_BACKGROUNDS.has(type);
