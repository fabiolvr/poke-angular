import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { PokemonIndexResponseDto } from './pokemon-index-list.dto';
import type { PokemonIndexRepository } from './pokemon-index.repository';
import type { PokemonRef } from './pokemon-ref';

const INDEX_LIMIT = 20000;
const ID_PATTERN = /\/(\d+)\/?$/;

const extractId = (url: string): number => {
  const match = ID_PATTERN.exec(url);
  return match?.[1] ? Number(match[1]) : Number.NaN;
};

@Injectable({ providedIn: 'root' })
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
            .map((entry) => ({ id: extractId(entry.url), name: entry.name }))
            .filter((ref) => Number.isFinite(ref.id)),
        ),
      );
  }
}
