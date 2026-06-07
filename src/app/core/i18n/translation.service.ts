import { HttpClient, type HttpErrorResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { catchError, finalize, map, of, shareReplay, type Observable } from 'rxjs';

/**
 * Lightweight machine-translation wrapper around the free MyMemory API
 * (https://mymemory.translated.net). Used to fill in flavor text in
 * pt-BR for Pokémon the PokéAPI never localizes.
 *
 * Constraints to respect:
 * - 5 000 chars/day per anonymous IP. We deduplicate identical requests,
 *   cache results for the session, and back off for 1 h if the API
 *   answers 429.
 * - Cross-origin — no auth required. baseUrlInterceptor leaves absolute
 *   URLs untouched, so the HTTP layer plays along.
 * - On any failure we resolve back to the source text so the UI never
 *   shows an empty description.
 *
 * The service is intentionally framework-light — no signals, just a
 * cold Observable so callers can `toSignal` / pipe as they wish.
 */

interface MyMemoryResponse {
  readonly responseStatus: number;
  readonly responseData?: {
    readonly translatedText?: string;
  };
}

const ENDPOINT = 'https://api.mymemory.translated.net/get';
const RATE_LIMIT_COOLDOWN_MS = 60 * 60 * 1_000;

@Service()
export class TranslationService {
  private readonly http = inject(HttpClient);

  /** key = `from|to|text` → final translated text (or original on failure) */
  private readonly cache = new Map<string, string>();
  /** key = same — in-flight observable (shared) */
  private readonly inFlight = new Map<string, Observable<string>>();
  private rateLimitedUntil = 0;

  translate(text: string, from: string, to: string): Observable<string> {
    if (!text) return of(text);
    if (Date.now() < this.rateLimitedUntil) return of(text);

    const key = `${from}|${to}|${text}`;
    const cached = this.cache.get(key);
    if (cached !== undefined) return of(cached);

    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const request$ = this.http
      .get<MyMemoryResponse>(ENDPOINT, {
        params: { q: text, langpair: `${from}|${to}` },
      })
      .pipe(
        map((response) => {
          const status = response.responseStatus;
          if (status === 429) {
            this.rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
            return text;
          }
          const translated = response.responseData?.translatedText?.trim();
          return translated && translated.length > 0 ? translated : text;
        }),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 429) {
            this.rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
          }
          return of(text);
        }),
        map((value) => {
          this.cache.set(key, value);
          return value;
        }),
        finalize(() => this.inFlight.delete(key)),
        shareReplay(1),
      );

    this.inFlight.set(key, request$);
    return request$;
  }
}
