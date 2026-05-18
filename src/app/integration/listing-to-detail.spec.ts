import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding, type Route, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type {
  EvolutionChain,
  Pokemon,
  PokemonDetail,
  PokemonPage,
  PokemonSummary,
} from '@core/domain';
import { provideTranslocoForTesting } from '@core/i18n';
import { ReplaySubject, type Observable } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  POKEMON_DETAIL_REPOSITORY,
  type PokemonDetailRepository,
} from '@features/pokemon-detail/data-access';
import { POKEMON_REPOSITORY, type PokemonRepository } from '@features/pokemon-list/data-access';

/**
 * Integration spec covering the only navigation flow the plan calls out
 * explicitly: listing → detail. Exercises the real routes table (listing
 * at `/`, detail at `/pokemon/:name`), real router with component input
 * binding, real Transloco config, and stubbed repositories driven by
 * `ReplaySubject`s so the test can sequence the loading→success
 * transitions of both resources.
 */

const summary = (id: number, name: string): PokemonSummary => ({
  id,
  name,
  types: ['electric'],
  sprites: { thumbnail: `thumb-${id}.png`, artwork: null, shiny: null },
});

const page = (items: PokemonSummary[], total = 1010): PokemonPage => ({
  items,
  total,
  offset: 0,
  limit: 20,
  hasNext: items.length === 20 && total > items.length,
  hasPrev: false,
});

const detail = (id: number, name: string): PokemonDetail => ({
  id,
  name,
  heightDecimetres: 4,
  weightHectograms: 60,
  baseExperience: 112,
  types: ['electric'],
  abilities: [{ name: 'static', isHidden: false }],
  stats: [
    { name: 'hp', base: 35, effort: 0 },
    { name: 'attack', base: 55, effort: 0 },
    { name: 'defense', base: 40, effort: 0 },
    { name: 'special-attack', base: 50, effort: 0 },
    { name: 'special-defense', base: 50, effort: 0 },
    { name: 'speed', base: 90, effort: 2 },
  ],
  sprites: { thumbnail: `thumb-${id}.png`, artwork: 'artwork.png', shiny: null },
  species: {
    id,
    defaultName: name,
    localizedNames: new Map([
      ['en', 'Pikachu'],
      ['pt-br', 'Pikachu'],
    ]),
    localizedGenera: new Map([
      ['en', 'Mouse Pokémon'],
      ['pt-br', 'Mouse Pokémon'],
    ]),
    localizedFlavorTexts: new Map([
      ['en', 'A cute electric mouse.'],
      ['pt-br', 'A cute electric mouse.'],
    ]),
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
    path: 'pokemon/:name',
    loadComponent: () => import('@features/pokemon-detail/feature/pokemon-detail.page'),
  },
];

const flush = async (harness: RouterTestingHarness): Promise<void> => {
  // rxResource → microtask → effect queue → re-render. Repeat a couple of
  // times to cover both resources (list and detail) settling in sequence.
  await Promise.resolve();
  await Promise.resolve();
  TestBed.tick();
  harness.detectChanges();
};

describe('listing → detail integration', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'pt-BR' });
  });

  it('renders a card on /, follows the link to /pokemon/:name, and renders the detail', async () => {
    const listSubject = new ReplaySubject<PokemonPage>(1);
    const detailSubject = new ReplaySubject<PokemonDetail>(1);

    const listStub: PokemonRepository = {
      listCards(_offset: number, _limit: number): Observable<PokemonPage> {
        return listSubject.asObservable();
      },
      getDetails(_name: string): Observable<Pokemon> {
        throw new Error('getDetails not used in this flow');
      },
    };
    const detailStub: PokemonDetailRepository = {
      getDetail(_name: string): Observable<PokemonDetail> {
        return detailSubject.asObservable();
      },
      getEvolutionChain(): Observable<EvolutionChain> {
        throw new Error('evolution chain not exercised — chainUrl is null');
      },
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(integrationRoutes, withComponentInputBinding()),
        provideTranslocoForTesting(),
        { provide: POKEMON_REPOSITORY, useValue: listStub },
        { provide: POKEMON_DETAIL_REPOSITORY, useValue: detailStub },
      ],
    });

    const harness = await RouterTestingHarness.create('/');

    // Listing has mounted; settle the rxResource with one card.
    listSubject.next(page([summary(25, 'pikachu')]));
    await flush(harness);

    const listingRoot = harness.routeNativeElement!;
    expect(listingRoot.querySelector('app-pokemon-list-grid')).not.toBeNull();
    const anchor = listingRoot.querySelector<HTMLAnchorElement>('a[href="/pokemon/pikachu"]');
    expect(anchor).not.toBeNull();

    // Navigate via the Router so we exercise the real route activation
    // path that the anchor's `routerLink` would trigger.
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/pokemon/pikachu');
    await flush(harness);

    // Detail page mounted in the same outlet; settle its resource.
    detailSubject.next(detail(25, 'pikachu'));
    await flush(harness);

    const detailRoot = harness.routeNativeElement!;
    expect(detailRoot.tagName.toLowerCase()).toBe('app-pokemon-detail-page');
    expect(detailRoot.querySelector('h1')?.textContent?.trim()).toBe('Pikachu');
    expect(detailRoot.textContent).toContain('#0025');
    expect(detailRoot.textContent).toContain('Mouse Pokémon');
  });
});
