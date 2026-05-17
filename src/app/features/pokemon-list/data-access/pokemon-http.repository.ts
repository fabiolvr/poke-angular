import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, of, switchMap, type Observable } from 'rxjs';
import type { Pokemon, PokemonPage } from '@core/domain';
import type { PokemonDto, PokemonListResponseDto } from './pokeapi.dto';
import { mapPokemon, mapPokemonPage } from './pokeapi.mapper';
import type { PokemonRepository } from './pokemon.repository';

/**
 * Network-backed PokemonRepository.
 *
 * `listCards` paginates through `/pokemon-species` (not `/pokemon`).
 * The species endpoint returns the ~1025 canonical species in order,
 * which all have official artwork and thumbnail sprites. The `/pokemon`
 * endpoint, by contrast, enumerates **every** form (Mega, Gigantamax,
 * regional, cosplay, etc.) past ID 10000 — most of those have null
 * `front_default` and would render as the missing-sprite fallback.
 *
 * Each species name is identical to its base pokémon name for canonical
 * entries (e.g. species "bulbasaur" ↔ `/pokemon/bulbasaur`), so the
 * fan-out below works unchanged. Alternate forms are still reachable
 * from `/search` and via evolution-chain links.
 *
 * `listCards` fans out: one GET for the species page, then one GET
 * /pokemon/{name} per entry for sprites + types. The cacheInterceptor
 * makes the fan-out cheap on repeated visits; the first visit pays N+1
 * requests (~21 for a page of 20).
 *
 * `getDetails` is a single GET — same endpoint the list fan-out hits,
 * so a card click on a pokémon you just scrolled past is a cache hit.
 */
@Injectable({ providedIn: 'root' })
export class PokemonHttpRepository implements PokemonRepository {
  private readonly http = inject(HttpClient);

  listCards(offset: number, limit: number): Observable<PokemonPage> {
    const params = new HttpParams().set('offset', offset).set('limit', limit);
    return this.http.get<PokemonListResponseDto>('pokemon-species', { params }).pipe(
      switchMap((list) => {
        if (list.results.length === 0) {
          return of(mapPokemonPage(list, [], offset, limit));
        }
        const detailRequests = list.results.map((ref) =>
          this.http.get<PokemonDto>(`pokemon/${ref.name}`),
        );
        return forkJoin(detailRequests).pipe(
          map((details) => mapPokemonPage(list, details, offset, limit)),
        );
      }),
    );
  }

  getDetails(name: string): Observable<Pokemon> {
    return this.http.get<PokemonDto>(`pokemon/${name}`).pipe(map(mapPokemon));
  }
}
