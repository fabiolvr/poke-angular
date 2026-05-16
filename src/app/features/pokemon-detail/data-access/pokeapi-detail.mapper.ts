import {
  isPokemonStatName,
  isPokemonTypeName,
  type EvolutionChain,
  type EvolutionNode,
  type Pokemon,
  type PokemonAbility,
  type PokemonDetail,
  type PokemonSpecies,
  type PokemonSprites,
  type PokemonStat,
  type PokemonTypeName,
} from '@core/domain';
import type {
  EvolutionChainDto,
  EvolutionLinkDto,
  PokemonDetailDto,
  PokemonSpeciesDto,
  PokemonSpritesDto,
} from './pokeapi-detail.dto';

const ID_PATTERN = /\/(\d+)\/?$/;
const extractIdFromUrl = (url: string): number => {
  const match = ID_PATTERN.exec(url);
  return match?.[1] ? Number(match[1]) : Number.NaN;
};

const mapSprites = (dto: PokemonSpritesDto): PokemonSprites => ({
  thumbnail: dto.front_default,
  artwork: dto.other?.['official-artwork']?.front_default ?? dto.front_default,
  shiny: dto.other?.['official-artwork']?.front_shiny ?? dto.front_shiny ?? dto.front_default,
});

const mapTypes = (slots: PokemonDetailDto['types']): readonly PokemonTypeName[] =>
  slots
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((slot) => slot.type.name)
    .filter(isPokemonTypeName);

const mapStats = (slots: PokemonDetailDto['stats']): readonly PokemonStat[] =>
  slots
    .map((slot): PokemonStat | null => {
      if (!isPokemonStatName(slot.stat.name)) return null;
      return { name: slot.stat.name, base: slot.base_stat, effort: slot.effort };
    })
    .filter((stat): stat is PokemonStat => stat !== null);

const mapAbilities = (slots: PokemonDetailDto['abilities']): readonly PokemonAbility[] =>
  slots
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((slot) => ({ name: slot.ability.name, isHidden: slot.is_hidden }));

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
 * Picks the first non-empty English (or default-game) flavor text from the
 * species' multi-language entries. Strips form-feed characters PokéAPI
 * embeds for legacy game-screen line wrapping.
 */
const pickFlavorText = (
  entries: PokemonSpeciesDto['flavor_text_entries'],
  languageCode: string,
): string | null => {
  const candidates = entries.filter((e) => e.language.name === languageCode);
  const first = candidates[0] ?? entries.find((e) => e.language.name === 'en') ?? entries[0];
  return first?.flavor_text.replace(/[\f\n\r]+/g, ' ').trim() ?? null;
};

const pickGenus = (entries: PokemonSpeciesDto['genera'], languageCode: string): string | null => {
  const match = entries.find((g) => g.language.name === languageCode);
  const fallback = entries.find((g) => g.language.name === 'en');
  return match?.genus ?? fallback?.genus ?? null;
};

export const mapSpecies = (dto: PokemonSpeciesDto): PokemonSpecies => {
  const localized = new Map<string, string>();
  for (const entry of dto.names) {
    localized.set(entry.language.name, entry.name);
  }
  return {
    id: dto.id,
    defaultName: dto.name,
    localizedNames: localized,
    genus: pickGenus(dto.genera, 'en'),
    flavorText: pickFlavorText(dto.flavor_text_entries, 'en'),
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
