import {
  isPokemonStatName,
  isPokemonTypeName,
  type PokemonAbility,
  type PokemonStat,
  type PokemonTypeName,
} from '@core/domain';

/**
 * Minimal structural shapes the slot mappers read from a PokéAPI `/pokemon`
 * payload. Each feature keeps its own full DTO (so features stay
 * independently deletable); these shapes only describe the slices the
 * shared mappers touch, and feature DTOs are structurally compatible.
 */
interface NameRef {
  readonly name: string;
}
export interface TypeSlot {
  readonly slot: number;
  readonly type: NameRef;
}
export interface StatSlot {
  readonly base_stat: number;
  readonly effort: number;
  readonly stat: NameRef;
}
export interface AbilitySlot {
  readonly ability: NameRef;
  readonly is_hidden: boolean;
  readonly slot: number;
}

/** Types in slot order, dropping any name PokéAPI adds that we don't model. */
export const mapTypes = (slots: readonly TypeSlot[]): readonly PokemonTypeName[] =>
  slots
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((slot) => slot.type.name)
    .filter(isPokemonTypeName);

/** Stats, dropping any unknown stat name rather than inventing a slot. */
export const mapStats = (slots: readonly StatSlot[]): readonly PokemonStat[] =>
  slots
    .map((slot): PokemonStat | null => {
      if (!isPokemonStatName(slot.stat.name)) return null;
      return { name: slot.stat.name, base: slot.base_stat, effort: slot.effort };
    })
    .filter((stat): stat is PokemonStat => stat !== null);

/** Abilities in slot order, preserving the hidden flag. */
export const mapAbilities = (slots: readonly AbilitySlot[]): readonly PokemonAbility[] =>
  slots
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((slot) => ({ name: slot.ability.name, isHidden: slot.is_hidden }));
