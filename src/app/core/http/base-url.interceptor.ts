import type { HttpInterceptorFn } from '@angular/common/http';

export const POKE_API_BASE_URL = 'https://pokeapi.co/api/v2/';

/**
 * Prepends the PokéAPI base URL to relative requests.
 *
 * Convention:
 *   `pokemon/25`        — relative, routed through PokéAPI
 *   `/i18n/pt-BR.json`  — leading slash, local path (translation bundles)
 *   `https://…`         — absolute, untouched
 *
 * Anything starting with `/` is treated as a local SPA-served asset and left
 * alone so the i18n loader, future static assets, and arbitrary local fetches
 * keep working without context tokens.
 */
export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (/^https?:\/\//i.test(req.url)) return next(req);
  if (req.url.startsWith('/')) return next(req);
  return next(req.clone({ url: POKE_API_BASE_URL + req.url }));
};
