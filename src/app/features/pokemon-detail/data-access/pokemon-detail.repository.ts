import { inject, InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { EvolutionChain, PokemonDetail } from '@core/domain';
import { PokemonDetailHttpRepository } from './pokemon-detail-http.repository';

/**
 * Boundary for the detail page. Hides the PokéAPI two-request dance
 * (/pokemon + /pokemon-species) and the third optional evolution chain
 * call behind two domain operations.
 *
 * Tests override the token; smart components never see HttpClient.
 */
export interface PokemonDetailRepository {
  /**
   * Loads pokemon + species in parallel and returns the combined domain
   * model. Localized names live on `result.species.localizedNames`.
   */
  getDetail(name: string): Observable<PokemonDetail>;

  /**
   * Loads an evolution chain by its full PokéAPI URL (the species DTO
   * exposes it). Issued lazily by the @defer'd evolution component so
   * the chain only loads when scrolled into view.
   */
  getEvolutionChain(url: string): Observable<EvolutionChain>;
}

export const POKEMON_DETAIL_REPOSITORY = new InjectionToken<PokemonDetailRepository>(
  'PokemonDetailRepository',
  {
    providedIn: 'root',
    factory: () => inject(PokemonDetailHttpRepository),
  },
);
