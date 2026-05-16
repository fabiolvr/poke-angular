import { describe, expect, it } from 'vitest';
import type { EvolutionChainDto, PokemonDetailDto, PokemonSpeciesDto } from './pokeapi-detail.dto';
import { mapEvolutionChain, mapPokemonDetail, mapSpecies } from './pokeapi-detail.mapper';

const pikachuDto: PokemonDetailDto = {
  id: 25,
  name: 'pikachu',
  height: 4,
  weight: 60,
  base_experience: 112,
  types: [{ slot: 1, type: { name: 'electric', url: '' } }],
  abilities: [{ slot: 1, is_hidden: false, ability: { name: 'static', url: '' } }],
  stats: [{ base_stat: 35, effort: 0, stat: { name: 'hp', url: '' } }],
  sprites: {
    front_default: 'front.png',
    front_shiny: 'shiny.png',
    other: {
      'official-artwork': { front_default: 'artwork.png', front_shiny: 'artwork-shiny.png' },
    },
  },
  species: { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon-species/25/' },
};

const pikachuSpeciesDto: PokemonSpeciesDto = {
  id: 25,
  name: 'pikachu',
  names: [
    { language: { name: 'en', url: '' }, name: 'Pikachu' },
    { language: { name: 'ja', url: '' }, name: 'ピカチュウ' },
    { language: { name: 'pt-br', url: '' }, name: 'Pikachu' },
  ],
  genera: [
    { language: { name: 'en', url: '' }, genus: 'Mouse Pokémon' },
    { language: { name: 'pt-br', url: '' }, genus: 'Pokémon Camundongo' },
  ],
  flavor_text_entries: [
    {
      language: { name: 'en', url: '' },
      version: { name: 'red', url: '' },
      flavor_text:
        'When several of\fthese Pokémon\ngather, their\felectricity could\nbuild and cause\flightning storms.',
    },
  ],
  evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/10/' },
  evolves_from_species: { name: 'pichu', url: 'https://pokeapi.co/api/v2/pokemon-species/172/' },
  is_legendary: false,
  is_mythical: false,
};

describe('mapSpecies', () => {
  it('builds a localized-names map from PokéAPI language entries', () => {
    const species = mapSpecies(pikachuSpeciesDto);
    expect(species.localizedNames.get('en')).toBe('Pikachu');
    expect(species.localizedNames.get('ja')).toBe('ピカチュウ');
    expect(species.localizedNames.get('pt-br')).toBe('Pikachu');
  });

  it('strips form-feed and CR/LF characters from flavor text', () => {
    const species = mapSpecies(pikachuSpeciesDto);
    expect(species.flavorText).not.toContain('\f');
    expect(species.flavorText).not.toContain('\n');
    expect(species.flavorText).toContain('Pokémon gather');
  });

  it('extracts the evolution chain url and the previous species', () => {
    const species = mapSpecies(pikachuSpeciesDto);
    expect(species.evolutionChainUrl).toBe('https://pokeapi.co/api/v2/evolution-chain/10/');
    expect(species.evolvesFromSpecies).toBe('pichu');
  });

  it('preserves legendary/mythical flags', () => {
    const species = mapSpecies({
      ...pikachuSpeciesDto,
      is_legendary: true,
      is_mythical: true,
    });
    expect(species.isLegendary).toBe(true);
    expect(species.isMythical).toBe(true);
  });
});

describe('mapPokemonDetail', () => {
  it('combines pokemon + species into a PokemonDetail', () => {
    const detail = mapPokemonDetail(pikachuDto, pikachuSpeciesDto);
    expect(detail.id).toBe(25);
    expect(detail.name).toBe('pikachu');
    expect(detail.types).toEqual(['electric']);
    expect(detail.species.localizedNames.get('en')).toBe('Pikachu');
  });

  it('keeps the species sprite for shiny artwork when available', () => {
    const detail = mapPokemonDetail(pikachuDto, pikachuSpeciesDto);
    expect(detail.sprites.shiny).toBe('artwork-shiny.png');
  });
});

describe('mapEvolutionChain', () => {
  const eeveeChain: EvolutionChainDto = {
    id: 67,
    chain: {
      species: { name: 'eevee', url: 'https://pokeapi.co/api/v2/pokemon-species/133/' },
      evolves_to: [
        {
          species: { name: 'vaporeon', url: 'https://pokeapi.co/api/v2/pokemon-species/134/' },
          evolves_to: [],
        },
        {
          species: { name: 'jolteon', url: 'https://pokeapi.co/api/v2/pokemon-species/135/' },
          evolves_to: [],
        },
      ],
    },
  };

  it('walks the chain preserving id, name and branching structure', () => {
    const chain = mapEvolutionChain(eeveeChain);
    expect(chain.id).toBe(67);
    expect(chain.root.speciesName).toBe('eevee');
    expect(chain.root.speciesId).toBe(133);
    expect(chain.root.evolvesTo.map((n) => n.speciesName)).toEqual(['vaporeon', 'jolteon']);
    expect(chain.root.evolvesTo[0]?.speciesId).toBe(134);
  });
});
