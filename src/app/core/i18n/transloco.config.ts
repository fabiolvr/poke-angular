import { isDevMode, type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { DEFAULT_LANG, SUPPORTED_LANGS } from './supported-langs';
import { TranslocoHttpLoader } from './transloco.loader';

/**
 * Single source of truth for Transloco wiring. Imported by app.config.ts so
 * the runtime detection (navigator.language → localStorage persistence) in
 * LanguageService can pick up exactly the same `availableLangs` list.
 *
 * Bundles the messageformat plugin so templates can use ICU plural syntax
 * (`{count, plural, one {…} other {…}}`) directly in JSON values.
 */
export const provideTranslocoConfig = (): EnvironmentProviders =>
  makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: [...SUPPORTED_LANGS],
        defaultLang: DEFAULT_LANG,
        fallbackLang: DEFAULT_LANG,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: {
          useFallbackTranslation: true,
          logMissingKey: isDevMode(),
        },
      },
      loader: TranslocoHttpLoader,
    }),
    provideTranslocoMessageformat(),
  ]);
