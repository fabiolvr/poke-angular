import { describe, expect, it } from 'vitest';
import type { PokemonDto, PokemonListResponseDto } from './pokeapi.dto';
import {
  extractIdFromUrl,
  mapNameRefs,
  mapPokemon,
  mapPokemonPage,
  mapPokemonSummary,
} from './pokeapi.mapper';

const pikachuDto: PokemonDto = {
  id: 25,
  name: 'pikachu',
  height: 4,
  weight: 60,
  base_experience: 112,
  types: [{ slot: 1, type: { name: 'electric', url: 'https://pokeapi.co/api/v2/type/13/' } }],
  abilities: [
    {
      slot: 1,
      is_hidden: false,
      ability: { name: 'static', url: 'https://pokeapi.co/api/v2/ability/9/' },
    },
    {
      slot: 3,
      is_hidden: true,
      ability: { name: 'lightning-rod', url: 'https://pokeapi.co/api/v2/ability/31/' },
    },
  ],
  stats: [
    { base_stat: 35, effort: 0, stat: { name: 'hp', url: '' } },
    { base_stat: 55, effort: 0, stat: { name: 'attack', url: '' } },
    { base_stat: 40, effort: 0, stat: { name: 'defense', url: '' } },
    { base_stat: 50, effort: 0, stat: { name: 'special-attack', url: '' } },
    { base_stat: 50, effort: 0, stat: { name: 'special-defense', url: '' } },
    { base_stat: 90, effort: 2, stat: { name: 'speed', url: '' } },
  ],
  sprites: {
    front_default: 'https://sprites/pikachu.png',
    front_shiny: 'https://sprites/pikachu-shiny.png',
    other: {
      'official-artwork': { front_default: 'https://sprites/pikachu-artwork.png' },
    },
  },
};

describe('extractIdFromUrl', () => {
  it('reads the last segment as the dex number', () => {
    expect(extractIdFromUrl('https://pokeapi.co/api/v2/pokemon/25/')).toBe(25);
  });

  it('handles URLs without a trailing slash', () => {
    expect(extractIdFromUrl('/pokemon-species/151')).toBe(151);
  });

  it('returns NaN for malformed input rather than throwing', () => {
    expect(Number.isNaN(extractIdFromUrl('not-a-url'))).toBe(true);
    expect(Number.isNaN(extractIdFromUrl(''))).toBe(true);
  });
});

describe('mapPokemon', () => {
  it('preserves id, name, raw measurements and base experience', () => {
    const p = mapPokemon(pikachuDto);
    expect(p.id).toBe(25);
    expect(p.name).toBe('pikachu');
    expect(p.heightDecimetres).toBe(4);
    expect(p.weightHectograms).toBe(60);
    expect(p.baseExperience).toBe(112);
  });

  it('orders types by slot and filters out unknown type names', () => {
    const dto: PokemonDto = {
      ...pikachuDto,
      types: [
        { slot: 2, type: { name: 'water', url: '' } },
        { slot: 1, type: { name: 'fire', url: '' } },
        { slot: 3, type: { name: 'totally-bogus', url: '' } },
      ],
    };
    expect(mapPokemon(dto).types).toEqual(['fire', 'water']);
  });

  it('maps stats keeping the kebab-case names', () => {
    const stats = mapPokemon(pikachuDto).stats;
    expect(stats.map((s) => s.name)).toEqual([
      'hp',
      'attack',
      'defense',
      'special-attack',
      'special-defense',
      'speed',
    ]);
    expect(stats.find((s) => s.name === 'speed')?.effort).toBe(2);
  });

  it('orders abilities by slot and preserves the hidden flag', () => {
    const abilities = mapPokemon(pikachuDto).abilities;
    expect(abilities).toEqual([
      { name: 'static', isHidden: false },
      { name: 'lightning-rod', isHidden: true },
    ]);
  });

  it('uses the official artwork when present and falls back to front_default', () => {
    expect(mapPokemon(pikachuDto).sprites.artwork).toBe('https://sprites/pikachu-artwork.png');

    const noArtwork: PokemonDto = {
      ...pikachuDto,
      sprites: { front_default: 'fallback.png', front_shiny: null },
    };
    expect(mapPokemon(noArtwork).sprites.artwork).toBe('fallback.png');
  });

  it('cascades thumbnail through front_default → home → official-artwork for forms', () => {
    // Mega/alternate form: legacy front_default is null but Pokémon HOME
    // has a rendering. The cascade should pick it up so the card doesn't
    // render the missing-sprite placeholder.
    const megaForm: PokemonDto = {
      ...pikachuDto,
      sprites: {
        front_default: null,
        front_shiny: null,
        other: {
          home: { front_default: 'home/charizard-mega-x.png' },
          'official-artwork': { front_default: 'artwork/charizard-mega-x.png' },
        },
      },
    };
    expect(mapPokemon(megaForm).sprites.thumbnail).toBe('home/charizard-mega-x.png');
  });

  it('keeps thumbnail null when every cascade slot is absent', () => {
    const orphan: PokemonDto = {
      ...pikachuDto,
      sprites: { front_default: null, front_shiny: null },
    };
    expect(mapPokemon(orphan).sprites.thumbnail).toBeNull();
  });
});

describe('mapPokemonSummary', () => {
  it('is the card-sized projection of mapPokemon', () => {
    const summary = mapPokemonSummary(pikachuDto);
    expect(summary).toEqual({
      id: 25,
      name: 'pikachu',
      types: ['electric'],
      sprites: {
        thumbnail: 'https://sprites/pikachu.png',
        artwork: 'https://sprites/pikachu-artwork.png',
        shiny: 'https://sprites/pikachu-shiny.png',
      },
    });
  });
});

describe('mapPokemonPage', () => {
  const listDto: PokemonListResponseDto = {
    count: 1010,
    next: 'https://pokeapi.co/api/v2/pokemon?offset=20&limit=20',
    previous: null,
    results: [{ name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' }],
  };

  it('combines list metadata with hydrated detail summaries', () => {
    const page = mapPokemonPage(listDto, [pikachuDto], 0, 20);
    expect(page.total).toBe(1010);
    expect(page.offset).toBe(0);
    expect(page.limit).toBe(20);
    expect(page.hasNext).toBe(true);
    expect(page.hasPrev).toBe(false);
    expect(page.items[0]?.name).toBe('pikachu');
  });

  it('reflects pagination booleans from list.next / list.previous', () => {
    const last = mapPokemonPage(
      { count: 1010, next: null, previous: 'https://prev', results: [] },
      [],
      1000,
      20,
    );
    expect(last.hasNext).toBe(false);
    expect(last.hasPrev).toBe(true);
  });
});

describe('mapNameRefs', () => {
  it('returns id+name refs and discards entries with invalid urls', () => {
    const refs = mapNameRefs({
      count: 3,
      next: null,
      previous: null,
      results: [
        { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
        { name: 'broken', url: 'not-a-url' },
        { name: 'mew', url: 'https://pokeapi.co/api/v2/pokemon/151' },
      ],
    });
    expect(refs).toEqual([
      { id: 1, name: 'bulbasaur' },
      { id: 151, name: 'mew' },
    ]);
  });
});
