import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { IMAGE_LOADER, type ImageLoaderConfig } from '@angular/common';
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { baseUrlInterceptor, cacheInterceptor, errorInterceptor } from '@core/http';
import { provideTranslocoConfig } from '@core/i18n';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(
      withFetch(),
      // Order matters. baseUrl rewrites first so the cache key is stable;
      // cache short-circuits when possible; error normalises everything that
      // makes it back from the network into an AppError.
      withInterceptors([baseUrlInterceptor, cacheInterceptor, errorInterceptor]),
    ),
    provideTranslocoConfig(),
    // Pass-through image loader. PokéAPI sprites live on
    // raw.githubusercontent.com and have no resize endpoint, so we return
    // the src unchanged — but providing a loader silences the dev warning
    // NgOptimizedImage emits for cross-origin URLs without one.
    { provide: IMAGE_LOADER, useValue: (config: ImageLoaderConfig) => config.src },
  ],
};
