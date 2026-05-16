import { HttpResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { HttpCacheStore } from './http-cache.store';

/**
 * Cache successful GET responses by full URL (including query string).
 *
 * Cache-control headers from PokéAPI are ignored — its data is stable for
 * our session lifetime and we own the SPA cache policy here, not the server.
 * Non-GET requests pass straight through. Errors are never stored.
 */
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);

  const store = inject(HttpCacheStore);
  const url = req.urlWithParams;

  const hit = store.get(url);
  if (hit) return of(hit);

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        store.set(url, event);
      }
    }),
  );
};
