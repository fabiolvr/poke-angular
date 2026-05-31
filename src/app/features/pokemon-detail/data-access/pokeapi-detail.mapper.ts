import {
  type EvolutionChain,
  type EvolutionNode,
  type Pokemon,
  type PokemonDetail,
  type PokemonSpecies,
} from '@core/domain';
import { extractIdFromUrl, mapAbilities, mapSprites, mapStats, mapTypes } from '@core/pokeapi';
import type {
  EvolutionChainDto,
  EvolutionLinkDto,
  PokemonDetailDto,
  PokemonSpeciesDto,
} from './pokeapi-detail.dto';

const mapPokemon = (dto: PokemonDetailDto): Pokemon => ({
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

/**
 * Builds a `lang → flavor_text` map preserving the first entry per language
 * (older game versions tend to show up first in PokéAPI's payload, which
 * matches the original `candidates[0]` semantics). Strips the form-feed and
 * line-break characters PokéAPI keeps for legacy GameBoy line wrapping.
 */
const buildFlavorTextMap = (
  entries: PokemonSpeciesDto['flavor_text_entries'],
): ReadonlyMap<string, string> => {
  const out = new Map<string, string>();
  for (const entry of entries) {
    if (out.has(entry.language.name)) continue;
    const cleaned = entry.flavor_text.replace(/[\f\n\r]+/g, ' ').trim();
    if (cleaned) out.set(entry.language.name, cleaned);
  }
  return out;
};

const buildGeneraMap = (entries: PokemonSpeciesDto['genera']): ReadonlyMap<string, string> => {
  const out = new Map<string, string>();
  for (const entry of entries) {
    if (entry.genus) out.set(entry.language.name, entry.genus);
  }
  return out;
};

export const mapSpecies = (dto: PokemonSpeciesDto): PokemonSpecies => {
  const localizedNames = new Map<string, string>();
  for (const entry of dto.names) {
    localizedNames.set(entry.language.name, entry.name);
  }
  return {
    id: dto.id,
    defaultName: dto.name,
    localizedNames,
    localizedGenera: buildGeneraMap(dto.genera),
    localizedFlavorTexts: buildFlavorTextMap(dto.flavor_text_entries),
    evolutionChainUrl: dto.evolution_chain?.url ?? null,
    evolvesFromSpecies: dto.evolves_from_species?.name ?? null,
    isLegendary: dto.is_legendary,
    isMythical: dto.is_mythical,
  };
};

export const mapPokemonDetail = (
  pokemon: PokemonDetailDto,
  species: PokemonSpeciesDto,
): PokemonDetail => ({
  ...mapPokemon(pokemon),
  species: mapSpecies(species),
});

const mapEvolutionNode = (link: EvolutionLinkDto): EvolutionNode => ({
  speciesId: extractIdFromUrl(link.species.url),
  speciesName: link.species.name,
  evolvesTo: link.evolves_to.map(mapEvolutionNode),
});

export const mapEvolutionChain = (dto: EvolutionChainDto): EvolutionChain => ({
  id: dto.id,
  root: mapEvolutionNode(dto.chain),
});
