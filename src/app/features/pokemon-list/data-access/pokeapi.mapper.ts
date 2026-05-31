import { type Pokemon, type PokemonPage, type PokemonSummary } from '@core/domain';
import { extractIdFromUrl, mapAbilities, mapSprites, mapStats, mapTypes } from '@core/pokeapi';
import type { PokemonDto, PokemonListResponseDto, PokemonNameRefDto } from './pokeapi.dto';

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
