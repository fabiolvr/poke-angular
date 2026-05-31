import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { IMAGE_LOADER, type ImageLoaderConfig } from '@angular/common';
import {
  type ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { baseUrlInterceptor, cacheInterceptor, errorInterceptor } from '@core/http';
import { provideTranslocoConfig } from '@core/i18n';
import { NavigationHistoryService } from '@core/navigation';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Explicitly declare zoneless change detection. Angular 21 defaults to
    // it (there's no zone.js), but declaring it documents the choice and
    // guards against a future default change.
    provideZonelessChangeDetection(),
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
    // Eagerly instantiate NavigationHistoryService so it subscribes to
    // Router events from the very first NavigationEnd. Without this, the
    // service is only created when PokemonDetailPage (lazy) injects it,
    // by which point the user's path through /, /search, /search?q=foo,
    // /pokemon/:name has already happened and been missed — the detail
    // page's back button then mistakes the journey for a deep link and
    // sends the user to '/' instead of back to /search?q=foo.
    provideEnvironmentInitializer(() => {
      inject(NavigationHistoryService);
    }),
    // Pass-through image loader. PokéAPI sprites live on
    // raw.githubusercontent.com and have no resize endpoint, so we return
    // the src unchanged — but providing a loader silences the dev warning
    // NgOptimizedImage emits for cross-origin URLs without one.
    { provide: IMAGE_LOADER, useValue: (config: ImageLoaderConfig) => config.src },
  ],
};
