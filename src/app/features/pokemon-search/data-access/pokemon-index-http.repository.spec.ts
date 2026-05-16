import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { baseUrlInterceptor, POKE_API_BASE_URL } from '@core/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PokemonIndexHttpRepository } from './pokemon-index-http.repository';
import type { PokemonRef } from './pokemon-ref';

describe('PokemonIndexHttpRepository', () => {
  let repo: PokemonIndexHttpRepository;
  let httpMock: HttpTestingController;
  const captured: { value: readonly PokemonRef[] | null } = { value: null };

  beforeEach(() => {
    captured.value = null;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([baseUrlInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    repo = TestBed.inject(PokemonIndexHttpRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches /pokemon with limit=20000 and maps the response to refs', () => {
    repo.getIndex().subscribe((refs) => (captured.value = refs));

    const req = httpMock.expectOne(`${POKE_API_BASE_URL}pokemon?limit=20000&offset=0`);
    expect(req.request.method).toBe('GET');
    req.flush({
      count: 3,
      next: null,
      previous: null,
      results: [
        { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
        { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
        { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
      ],
    });

    expect(captured.value).toEqual([
      { id: 1, name: 'bulbasaur' },
      { id: 2, name: 'ivysaur' },
      { id: 25, name: 'pikachu' },
    ]);
  });

  it('drops entries with malformed urls rather than emitting NaN ids', () => {
    repo.getIndex().subscribe((refs) => (captured.value = refs));

    httpMock.expectOne(`${POKE_API_BASE_URL}pokemon?limit=20000&offset=0`).flush({
      count: 2,
      next: null,
      previous: null,
      results: [
        { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
        { name: 'broken', url: 'totally-not-a-url' },
      ],
    });

    expect(captured.value).toEqual([{ id: 1, name: 'bulbasaur' }]);
  });
});
