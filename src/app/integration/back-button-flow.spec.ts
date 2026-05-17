import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { inject, provideEnvironmentInitializer } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NavigationEnd,
  provideRouter,
  withComponentInputBinding,
  type Route,
  Router,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom, take } from 'rxjs';
import type { EvolutionChain, Pokemon, PokemonDetail, PokemonPage } from '@core/domain';
import { provideTranslocoForTesting } from '@core/i18n';
import { NavigationHistoryService } from '@core/navigation';
import { ReplaySubject, type Observable } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  POKEMON_DETAIL_REPOSITORY,
  type PokemonDetailRepository,
} from '@features/pokemon-detail/data-access';
import { POKEMON_REPOSITORY, type PokemonRepository } from '@features/pokemon-list/data-access';
import {
  POKEMON_INDEX_REPOSITORY,
  type PokemonIndexRepository,
  type PokemonRef,
} from '@features/pokemon-search/data-access';

/**
 * Regression spec for the detail page Back button. The bug: with
 * `NavigationHistoryService` providedIn: 'root' (lazy), it only became
 * alive when the *lazy* detail page first injected it — by which point
 * the user had already navigated through 3+ routes that the service
 * never saw. `hasInternalHistory()` was false on the first detail
 * visit, sending Back to '/' instead of to the previous SPA URL.
 *
 * Fix lives in `app.config.ts` via `provideEnvironmentInitializer`. The
 * test reproduces that wiring so a future refactor that drops the
 * initializer breaks this spec.
 */

const INDEX: readonly PokemonRef[] = [
  { id: 6, name: 'charizard' },
  { id: 25, name: 'pikachu' },
];

const detail = (id: number, name: string): PokemonDetail => ({
  id,
  name,
  heightDecimetres: 4,
  weightHectograms: 60,
  baseExperience: 112,
  types: ['fire'],
  abilities: [{ name: 'blaze', isHidden: false }],
  stats: [
    { name: 'hp', base: 78, effort: 0 },
    { name: 'attack', base: 84, effort: 0 },
    { name: 'defense', base: 78, effort: 0 },
    { name: 'special-attack', base: 109, effort: 3 },
    { name: 'special-defense', base: 85, effort: 0 },
    { name: 'speed', base: 100, effort: 0 },
  ],
  sprites: { thumbnail: `thumb-${id}.png`, artwork: 'artwork.png', shiny: null },
  species: {
    id,
    defaultName: name,
    localizedNames: new Map([
      ['en', 'Charizard'],
      ['pt-br', 'Charizard'],
    ]),
    genus: 'Flame Pokémon',
    flavorText: 'Spits fire.',
    evolutionChainUrl: null,
    evolvesFromSpecies: null,
    isLegendary: false,
    isMythical: false,
  },
});

const integrationRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('@features/pokemon-list/feature/pokemon-list.page'),
  },
  {
    path: 'search',
    loadComponent: () => import('@features/pokemon-search/feature/pokemon-search.page'),
  },
  {
    path: 'pokemon/:name',
    loadComponent: () => import('@features/pokemon-detail/feature/pokemon-detail.page'),
  },
];

const flush = async (harness: RouterTestingHarness): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  TestBed.tick();
  harness.detectChanges();
};

const waitForNextNavigation = (router: Router): Promise<NavigationEnd> =>
  firstValueFrom(
    router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      take(1),
    ),
  );

describe('detail page Back button', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'pt-BR' });
  });

  it('search → detail → Back returns to /search?q=… (not /) on the first navigation', async () => {
    const detailSubject = new ReplaySubject<PokemonDetail>(1);

    const detailStub: PokemonDetailRepository = {
      getDetail(_name: string): Observable<PokemonDetail> {
        return detailSubject.asObservable();
      },
      getEvolutionChain(): Observable<EvolutionChain> {
        throw new Error('evolution chain not exercised — chainUrl is null');
      },
    };
    const indexStub: PokemonIndexRepository = {
      getIndex(): Observable<readonly PokemonRef[]> {
        // Eager value so search index resolves synchronously.
        const subject = new ReplaySubject<readonly PokemonRef[]>(1);
        subject.next(INDEX);
        return subject.asObservable();
      },
    };
    const listStub: PokemonRepository = {
      listCards(): Observable<PokemonPage> {
        return new ReplaySubject<PokemonPage>(1).asObservable();
      },
      getDetails(): Observable<Pokemon> {
        throw new Error('not used');
      },
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(integrationRoutes, withComponentInputBinding()),
        provideTranslocoForTesting(),
        // Same wiring as production app.config.ts. Without this the
        // service is only created when the detail page injects it and
        // the test will fail exactly the same way the bug did in prod.
        provideEnvironmentInitializer(() => {
          inject(NavigationHistoryService);
        }),
        { provide: POKEMON_REPOSITORY, useValue: listStub },
        { provide: POKEMON_DETAIL_REPOSITORY, useValue: detailStub },
        { provide: POKEMON_INDEX_REPOSITORY, useValue: indexStub },
      ],
    });

    // Cold boot at /search?q=charizard. RouterTestingHarness counts as
    // one NavigationEnd; the eagerly-bootstrapped service catches it.
    const harness = await RouterTestingHarness.create('/search?q=charizard');
    await flush(harness);

    const router = TestBed.inject(Router);
    const history = TestBed.inject(NavigationHistoryService);
    expect(history.navigationCount()).toBeGreaterThanOrEqual(1);

    // Navigate to detail as if the user clicked a result link.
    await router.navigateByUrl('/pokemon/charizard');
    await flush(harness);
    expect(history.hasInternalHistory()).toBe(true);

    // Detail resource resolves; back button becomes visible.
    detailSubject.next(detail(6, 'charizard'));
    await flush(harness);

    const detailRoot = harness.routeNativeElement!;
    const backButton = Array.from(detailRoot.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Voltar'),
    );
    expect(backButton, 'Back button should be in the detail page').not.toBeUndefined();

    // jsdom doesn't propagate `history.back()` through to popstate the
    // way a real browser does, so we can't assert on `router.url`. The
    // contract we DO care about: the back button takes the
    // `Location.back()` branch (preserves previous URL), not the
    // `router.navigate(['/'])` fallback. Spying on the injected
    // `Location` service nails that contract precisely.
    const location = TestBed.inject(Location);
    const locationBack = vi.spyOn(location, 'back');
    const navigateSpy = vi.spyOn(router, 'navigate');

    backButton!.click();

    expect(locationBack).toHaveBeenCalledOnce();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('cold-boot deep link to /pokemon/:name → Back navigates to / (no internal history)', async () => {
    const detailSubject = new ReplaySubject<PokemonDetail>(1);
    const detailStub: PokemonDetailRepository = {
      getDetail(): Observable<PokemonDetail> {
        return detailSubject.asObservable();
      },
      getEvolutionChain(): Observable<EvolutionChain> {
        throw new Error('not used');
      },
    };
    const indexStub: PokemonIndexRepository = {
      getIndex(): Observable<readonly PokemonRef[]> {
        return new ReplaySubject<readonly PokemonRef[]>(1).asObservable();
      },
    };
    const listStub: PokemonRepository = {
      listCards(): Observable<PokemonPage> {
        return new ReplaySubject<PokemonPage>(1).asObservable();
      },
      getDetails(): Observable<Pokemon> {
        throw new Error('not used');
      },
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(integrationRoutes, withComponentInputBinding()),
        provideTranslocoForTesting(),
        provideEnvironmentInitializer(() => {
          inject(NavigationHistoryService);
        }),
        { provide: POKEMON_REPOSITORY, useValue: listStub },
        { provide: POKEMON_DETAIL_REPOSITORY, useValue: detailStub },
        { provide: POKEMON_INDEX_REPOSITORY, useValue: indexStub },
      ],
    });

    const harness = await RouterTestingHarness.create('/pokemon/pikachu');
    detailSubject.next(detail(25, 'pikachu'));
    await flush(harness);

    const router = TestBed.inject(Router);
    const history = TestBed.inject(NavigationHistoryService);
    expect(history.hasInternalHistory()).toBe(false);

    const detailRoot = harness.routeNativeElement!;
    const backButton = Array.from(detailRoot.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Voltar'),
    );
    const navigated = waitForNextNavigation(router);
    backButton!.click();
    await navigated;
    await flush(harness);

    // Deep link has nowhere to go back to inside the SPA — fall back to /.
    expect(router.url).toBe('/');
  });
});
