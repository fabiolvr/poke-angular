import { isDevMode } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { DEFAULT_LANG, SUPPORTED_LANGS } from './supported-langs';
import { TranslocoHttpLoader } from './transloco.loader';

/**
 * Single source of truth for Transloco wiring. Imported by app.config.ts so
 * the runtime detection (navigator.language → localStorage persistence) in
 * LanguageService can pick up exactly the same `availableLangs` list.
 */
export const provideTranslocoConfig = () =>
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
  });
