import { Injectable, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { provideTransloco, type Translation, type TranslocoLoader } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { of, type Observable } from 'rxjs';
import { DEFAULT_LANG, SUPPORTED_LANGS } from './supported-langs';
import ptBR from '../../../../public/i18n/pt-BR.json';
import en from '../../../../public/i18n/en.json';

/**
 * Test Transloco loader backed by the *real* production translation files
 * (`public/i18n/*.json`), so specs render the exact strings users see and
 * there's no hand-maintained copy to drift out of sync. Skips HttpClient
 * entirely, so tests don't need HttpTestingController to flush translation
 * responses.
 */
const TRANSLATIONS: Record<string, Translation> = {
  'pt-BR': ptBR,
  en,
};

@Injectable({ providedIn: 'root' })
class InMemoryTranslocoLoader implements TranslocoLoader {
  getTranslation(lang: string): Observable<Translation> {
    return of(TRANSLATIONS[lang] ?? {});
  }
}

/**
 * Drop-in replacement for `provideTranslocoConfig()` in unit specs.
 * Skips HttpClient entirely, so tests don't need to flush translation
 * responses through HttpTestingController.
 */
export const provideTranslocoForTesting = (): EnvironmentProviders =>
  makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: [...SUPPORTED_LANGS],
        defaultLang: DEFAULT_LANG,
        fallbackLang: DEFAULT_LANG,
        reRenderOnLangChange: true,
        prodMode: true,
      },
      loader: InMemoryTranslocoLoader,
    }),
    provideTranslocoMessageformat(),
  ]);
