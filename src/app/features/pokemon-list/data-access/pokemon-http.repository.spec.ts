import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Pokemon, PokemonPage } from '@core/domain';
import { baseUrlInterceptor, POKE_API_BASE_URL } from '@core/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PokemonDto, PokemonListResponseDto } from './pokeapi.dto';
import { PokemonHttpRepository } from './pokemon-http.repository';

const makeDto = (id: number, name: string): PokemonDto => ({
  id,
  name,
  height: 4,
  weight: 60,
  base_experience: 100,
  types: [{ slot: 1, type: { name: 'electric', url: '' } }],
  abilities: [],
  stats: [],
  sprites: { front_default: `sprite-${id}.png`, front_shiny: null },
});

describe('PokemonHttpRepository', () => {
  let repo: PokemonHttpRepository;
  let httpMock: HttpTestingController;

  const capture = <T>(): { value: T | null } => ({ value: null });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([baseUrlInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    repo = TestBed.inject(PokemonHttpRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('listCards', () => {
    it('fetches the page, fans out to /pokemon/{name}, and produces a PokemonPage', () => {
      const result = capture<PokemonPage>();
      repo.listCards(0, 2).subscribe((page) => {
        result.value = page;
      });

      const listReq = httpMock.expectOne(`${POKE_API_BASE_URL}pokemon?offset=0&limit=2`);
      expect(listReq.request.method).toBe('GET');
      const listResponse: PokemonListResponseDto = {
        count: 1010,
        next: 'https://next',
        previous: null,
        results: [
          { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
          { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
        ],
      };
      listReq.flush(listResponse);

      httpMock.expectOne(`${POKE_API_BASE_URL}pokemon/bulbasaur`).flush(makeDto(1, 'bulbasaur'));
      httpMock.expectOne(`${POKE_API_BASE_URL}pokemon/ivysaur`).flush(makeDto(2, 'ivysaur'));

      expect(result.value?.total).toBe(1010);
      expect(result.value?.items.map((i) => i.name)).toEqual(['bulbasaur', 'ivysaur']);
    });

    it('handles an empty page without making detail requests', () => {
      const result = capture<PokemonPage>();
      repo.listCards(2000, 20).subscribe((page) => (result.value = page));

      const listReq = httpMock.expectOne(`${POKE_API_BASE_URL}pokemon?offset=2000&limit=20`);
      listReq.flush({ count: 0, next: null, previous: null, results: [] });

      httpMock.verify(); // no further calls allowed
      expect(result.value?.items).toEqual([]);
      expect(result.value?.hasNext).toBe(false);
      expect(result.value?.hasPrev).toBe(false);
    });
  });

  describe('getDetails', () => {
    it('issues a single GET and maps the response to the domain', () => {
      const result = capture<Pokemon>();
      repo.getDetails('pikachu').subscribe((p) => (result.value = p));
      httpMock.expectOne(`${POKE_API_BASE_URL}pokemon/pikachu`).flush(makeDto(25, 'pikachu'));
      expect(result.value?.id).toBe(25);
      expect(result.value?.name).toBe('pikachu');
      expect(result.value?.types).toEqual(['electric']);
    });
  });
});
