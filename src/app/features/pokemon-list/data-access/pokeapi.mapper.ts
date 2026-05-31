import {
  isPokemonStatName,
  isPokemonTypeName,
  type Pokemon,
  type PokemonPage,
  type PokemonSprites,
  type PokemonStat,
  type PokemonSummary,
  type PokemonTypeName,
} from '@core/domain';
import { extractIdFromUrl } from '@core/pokeapi';
import type {
  PokemonDto,
  PokemonListResponseDto,
  PokemonNameRefDto,
  PokemonSpritesDto,
} from './pokeapi.dto';

/**
 * PokéAPI keeps separate sprite paths with very different coverage. We
 * cascade through them so alternate forms (Mega/Gigantamax/Alolan/etc.)
 * that lack the legacy in-game `front_default` still render — Pokémon
 * HOME renders cover almost every variant.
 *
 * - thumbnail (card-sized): front_default → home → official-artwork
 * - artwork (detail hero):  official-artwork → home → front_default
 * - shiny (toggle):         official-artwork.shiny → home.shiny → front_shiny
 *
 * If every path is null (truly sprite-less fan-added entries), the card
 * falls back to `/img/missing-sprite.svg` via PokemonCard.
 */
const mapSprites = (dto: PokemonSpritesDto): PokemonSprites => {
  const home = dto.other?.home?.front_default ?? null;
  const artwork = dto.other?.['official-artwork']?.front_default ?? null;
  const officialShiny = dto.other?.['official-artwork']?.front_shiny ?? null;
  const homeShiny = dto.other?.home?.front_shiny ?? null;
  return {
    thumbnail: dto.front_default ?? home ?? artwork,
    artwork: artwork ?? home ?? dto.front_default,
    shiny: officialShiny ?? homeShiny ?? dto.front_shiny,
  };
};

const mapTypes = (slots: PokemonDto['types']): readonly PokemonTypeName[] =>
  slots
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((slot) => slot.type.name)
    .filter(isPokemonTypeName);

const mapStats = (slots: PokemonDto['stats']): readonly PokemonStat[] =>
  slots
    .map((slot): PokemonStat | null => {
      if (!isPokemonStatName(slot.stat.name)) return null;
      return { name: slot.stat.name, base: slot.base_stat, effort: slot.effort };
    })
    .filter((stat): stat is PokemonStat => stat !== null);

const mapAbilities = (slots: PokemonDto['abilities']): Pokemon['abilities'] =>
  slots
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((slot) => ({ name: slot.ability.name, isHidden: slot.is_hidden }));

export const mapPokemon = (dto: PokemonDto): Pokemon => ({
  id: dto.id,
  name: dto.name,
  heightDecimetres: dto.height,
  weightHectograms: dto.weight,
  baseExperience: dto.base_experience,
  types: mapTypes(dto.types),
  abilities: mapAbilities(dto.abilities),
  stats: mapStats(dto.stats),
  sprites: mapSprites(dto.sprites),
});

export const mapPokemonSummary = (dto: PokemonDto): PokemonSummary => ({
  id: dto.id,
  name: dto.name,
  types: mapTypes(dto.types),
  sprites: mapSprites(dto.sprites),
});

/**
 * Combines a paginated list response with the hydrated detail responses for
 * each entry into a PokemonPage. PokéAPI's list endpoint returns only
 * `{ name, url }` pairs — the repository fans out to /pokemon/{name} so the
 * mapper receives both halves and can produce ready-to-render cards.
 */
export const mapPokemonPage = (
  list: PokemonListResponseDto,
  details: readonly PokemonDto[],
  offset: number,
  limit: number,
): PokemonPage => ({
  items: details.map(mapPokemonSummary),
  total: list.count,
  offset,
  limit,
  hasNext: list.next !== null,
  hasPrev: list.previous !== null,
});

/** Useful for repositories that need just the name index (used by search). */
export const mapNameRefs = (
  list: PokemonListResponseDto,
): readonly { id: number; name: string }[] =>
  list.results
    .map((entry: PokemonNameRefDto) => ({
      id: extractIdFromUrl(entry.url),
      name: entry.name,
    }))
    .filter((ref) => Number.isFinite(ref.id));
