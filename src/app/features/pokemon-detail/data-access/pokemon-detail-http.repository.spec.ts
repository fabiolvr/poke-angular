import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { EvolutionChain, PokemonDetail } from '@core/domain';
import { baseUrlInterceptor, POKE_API_BASE_URL } from '@core/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { EvolutionChainDto, PokemonDetailDto, PokemonSpeciesDto } from './pokeapi-detail.dto';
import { PokemonDetailHttpRepository } from './pokemon-detail-http.repository';

const makePokemonDto = (): PokemonDetailDto => ({
  id: 25,
  name: 'pikachu',
  height: 4,
  weight: 60,
  base_experience: 112,
  types: [{ slot: 1, type: { name: 'electric', url: '' } }],
  abilities: [],
  stats: [],
  sprites: { front_default: 'front.png', front_shiny: null },
  species: { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon-species/25/' },
});

const makeSpeciesDto = (): PokemonSpeciesDto => ({
  id: 25,
  name: 'pikachu',
  names: [{ language: { name: 'en', url: '' }, name: 'Pikachu' }],
  genera: [{ language: { name: 'en', url: '' }, genus: 'Mouse Pokémon' }],
  flavor_text_entries: [],
  evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/10/' },
  evolves_from_species: null,
  is_legendary: false,
  is_mythical: false,
});

const capture = <T>(): { value: T | null } => ({ value: null });

describe('PokemonDetailHttpRepository', () => {
  let repo: PokemonDetailHttpRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([baseUrlInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    repo = TestBed.inject(PokemonDetailHttpRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getDetail', () => {
    it('fetches pokemon then species and emits the combined detail', () => {
      const captured = capture<PokemonDetail>();
      repo.getDetail('pikachu').subscribe((d) => (captured.value = d));

      const pokemonReq = httpMock.expectOne(`${POKE_API_BASE_URL}pokemon/pikachu`);
      pokemonReq.flush(makePokemonDto());

      const speciesReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon-species/25/');
      speciesReq.flush(makeSpeciesDto());

      expect(captured.value?.id).toBe(25);
      expect(captured.value?.types).toEqual(['electric']);
      expect(captured.value?.species.localizedNames.get('en')).toBe('Pikachu');
    });

    it('propagates the error from the pokemon request without firing species', () => {
      const error = capture<unknown>();
      repo.getDetail('missingno').subscribe({ error: (e: unknown) => (error.value = e) });

      httpMock
        .expectOne(`${POKE_API_BASE_URL}pokemon/missingno`)
        .flush({ error: 'not found' }, { status: 404, statusText: 'Not Found' });

      httpMock.verify(); // no species request fired
      expect(error.value).not.toBeNull();
    });
  });

  describe('getEvolutionChain', () => {
    it('issues a single GET against the supplied url', () => {
      const captured = capture<EvolutionChain>();
      const url = 'https://pokeapi.co/api/v2/evolution-chain/10/';
      repo.getEvolutionChain(url).subscribe((c) => (captured.value = c));

      const req = httpMock.expectOne(url);
      const dto: EvolutionChainDto = {
        id: 10,
        chain: {
          species: { name: 'pichu', url: 'https://pokeapi.co/api/v2/pokemon-species/172/' },
          evolves_to: [
            {
              species: { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon-species/25/' },
              evolves_to: [],
            },
          ],
        },
      };
      req.flush(dto);

      expect(captured.value?.id).toBe(10);
      expect(captured.value?.root.speciesName).toBe('pichu');
      expect(captured.value?.root.evolvesTo[0]?.speciesName).toBe('pikachu');
    });
  });
});
