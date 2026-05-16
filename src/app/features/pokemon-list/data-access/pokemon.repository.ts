import { inject, InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Pokemon, PokemonPage } from '@core/domain';
import { PokemonHttpRepository } from './pokemon-http.repository';

/**
 * Boundary between the listing feature and the wire. Everything above this
 * line speaks domain models; everything below speaks PokéAPI DTOs.
 *
 * Tests substitute the implementation by overriding POKEMON_REPOSITORY; the
 * smart components and resources never need to know whether they are
 * talking to the network, the cache or an in-memory fake.
 */
export interface PokemonRepository {
  /**
   * Returns a fully-hydrated page of summary cards (name + sprites + types).
   * Implementations are responsible for the fan-out PokéAPI requires
   * (list endpoint → per-pokemon detail endpoint).
   */
  listCards(offset: number, limit: number): Observable<PokemonPage>;

  /** Loads the full domain model for a single Pokémon by canonical name. */
  getDetails(name: string): Observable<Pokemon>;
}

export const POKEMON_REPOSITORY = new InjectionToken<PokemonRepository>('PokemonRepository', {
  providedIn: 'root',
  factory: () => inject(PokemonHttpRepository),
});
