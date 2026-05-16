import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';

/**
 * Loads translation JSONs served as static assets from /i18n/{lang}.json.
 * Because the baseUrlInterceptor only rewrites relative paths and leaves
 * leading-slash URLs alone, the path stays local to the SPA.
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`/i18n/${lang}.json`);
  }
}
