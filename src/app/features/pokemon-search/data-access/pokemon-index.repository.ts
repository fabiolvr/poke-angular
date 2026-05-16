import { inject, InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import { PokemonIndexHttpRepository } from './pokemon-index-http.repository';
import type { PokemonRef } from './pokemon-ref';

/**
 * Search-only repository. Fetches a flat name+id index of every Pokémon
 * once per session; subsequent calls hit the HTTP cache. The /pokemon
 * list endpoint with a high limit (~20k) returns only `{name, url}`
 * pairs, so the payload stays ~120 kB even with every form included.
 */
export interface PokemonIndexRepository {
  getIndex(): Observable<readonly PokemonRef[]>;
}

export const POKEMON_INDEX_REPOSITORY = new InjectionToken<PokemonIndexRepository>(
  'PokemonIndexRepository',
  {
    providedIn: 'root',
    factory: () => inject(PokemonIndexHttpRepository),
  },
);
