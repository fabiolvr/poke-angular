import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, switchMap, type Observable } from 'rxjs';
import type { EvolutionChain, PokemonDetail } from '@core/domain';
import type { EvolutionChainDto, PokemonDetailDto, PokemonSpeciesDto } from './pokeapi-detail.dto';
import { mapEvolutionChain, mapPokemonDetail } from './pokeapi-detail.mapper';
import type { PokemonDetailRepository } from './pokemon-detail.repository';

/**
 * Network implementation of PokemonDetailRepository.
 *
 * `getDetail` is sequential by necessity — the species URL ships on the
 * pokemon DTO, so we cannot fan-out in parallel without guessing the URL.
 * The cacheInterceptor makes a return visit (e.g. clicking back from the
 * detail page and re-opening the same pokémon) a single render frame.
 *
 * `getEvolutionChain` is a single GET issued by the @defer'd evolution
 * component when scrolled into view.
 */
@Injectable({ providedIn: 'root' })
export class PokemonDetailHttpRepository implements PokemonDetailRepository {
  private readonly http = inject(HttpClient);

  getDetail(name: string): Observable<PokemonDetail> {
    return this.http
      .get<PokemonDetailDto>(`pokemon/${name}`)
      .pipe(
        switchMap((pokemon) =>
          this.http
            .get<PokemonSpeciesDto>(pokemon.species.url)
            .pipe(map((species) => mapPokemonDetail(pokemon, species))),
        ),
      );
  }

  getEvolutionChain(url: string): Observable<EvolutionChain> {
    return this.http.get<EvolutionChainDto>(url).pipe(map(mapEvolutionChain));
  }
}
