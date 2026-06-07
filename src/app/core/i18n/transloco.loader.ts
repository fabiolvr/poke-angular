import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';

/**
 * Loads translation JSONs served as static assets from {baseHref}i18n/{lang}.json.
 *
 * Reads the base path straight from the `<base href>` element via
 * `document.baseURI` so the loader follows whatever the build sets: `/` in
 * dev, `/poke-angular/` after `ng build --base-href "/poke-angular/"` for
 * GH Pages. We resolve to a path-only string (no protocol/host) so the
 * leading-slash convention used by the rest of the HTTP layer holds.
 *
 * The baseUrlInterceptor leaves leading-slash paths alone (treats them as
 * local SPA assets), so the i18n requests reach the static file server
 * instead of being prefixed with the PokéAPI base.
 */
@Service()
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);
  private readonly basePath = new URL(inject(DOCUMENT).baseURI).pathname;

  getTranslation(lang: string) {
    return this.http.get<Translation>(`${this.basePath}i18n/${lang}.json`);
  }
}
