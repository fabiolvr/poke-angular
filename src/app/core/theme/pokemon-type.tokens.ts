/**
 * Visual tokens for the 18 Pokémon types.
 *
 * The type name list itself is owned by the domain (`@core/domain`) — this
 * file only deals with the design-system mapping (background utility, text
 * utility, contrast guidance, CSS variable).
 *
 * The CSS variables themselves live in `src/styles/tokens.css` under @theme
 * and are safelisted in `src/styles.css` via @source inline so the runtime
 * type-name lookup keeps generating real utilities.
 */
import type { PokemonTypeName } from '@core/domain';

/** CSS custom-property name (e.g. for inline `style` bindings). */
export const pokemonTypeVar = (type: PokemonTypeName): string => `var(--color-type-${type})`;

/** Tailwind background utility class (e.g. `bg-type-fire`). */
export const pokemonTypeBgClass = (type: PokemonTypeName): string => `bg-type-${type}`;

/** Tailwind text utility class (e.g. `text-type-fire`). */
export const pokemonTypeTextClass = (type: PokemonTypeName): string => `text-type-${type}`;

/**
 * Contrast guidance: a few type colors (electric, ice, fairy, normal, ground)
 * are too light for white text — flag them so badges render ink-coloured labels.
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
