import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { extractIdFromUrl } from '@core/pokeapi';
import { map, type Observable } from 'rxjs';
import type { PokemonIndexResponseDto } from './pokemon-index-list.dto';
import type { PokemonIndexRepository } from './pokemon-index.repository';
import type { PokemonRef } from './pokemon-ref';

const INDEX_LIMIT = 20000;

@Service()
export class PokemonIndexHttpRepository implements PokemonIndexRepository {
  private readonly http = inject(HttpClient);

  getIndex(): Observable<readonly PokemonRef[]> {
    // limit=20000 covers everything PokéAPI currently exposes
    // (~1300 species + form variants ≈ 1500). The cacheInterceptor keys
    // by full URL including query params, so the second call serves
    // instantly even if the user navigates away and back.
    const params = new HttpParams().set('limit', INDEX_LIMIT).set('offset', 0);
    return this.http
      .get<PokemonIndexResponseDto>('pokemon', { params })
      .pipe(
        map((response) =>
          response.results
            .map((entry) => ({ id: extractIdFromUrl(entry.url), name: entry.name }))
            .filter((ref) => Number.isFinite(ref.id)),
        ),
      );
  }
}
