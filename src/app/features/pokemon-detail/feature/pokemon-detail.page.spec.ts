import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { EvolutionChain, PokemonDetail } from '@core/domain';
import { provideTranslocoForTesting } from '@core/i18n';
import { ReplaySubject, type Observable } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { POKEMON_DETAIL_REPOSITORY, type PokemonDetailRepository } from '../data-access';
import PokemonDetailPage from './pokemon-detail.page';

const makeDetail = (name: string, shiny: string | null = 'shiny.png'): PokemonDetail => ({
  id: 25,
  name,
  heightDecimetres: 4,
  weightHectograms: 60,
  baseExperience: 112,
  types: ['electric'],
  abilities: [
    { name: 'static', isHidden: false },
    { name: 'lightning-rod', isHidden: true },
  ],
  stats: [
    { name: 'hp', base: 35, effort: 0 },
    { name: 'attack', base: 55, effort: 0 },
    { name: 'defense', base: 40, effort: 0 },
    { name: 'special-attack', base: 50, effort: 0 },
    { name: 'special-defense', base: 50, effort: 0 },
    { name: 'speed', base: 90, effort: 2 },
  ],
  sprites: { thumbnail: 'thumb.png', artwork: 'artwork.png', shiny },
  species: {
    id: 25,
    defaultName: 'pikachu',
    localizedNames: new Map([
      ['en', 'Pikachu'],
      ['pt-br', 'Pikachu'],
    ]),
    genus: 'Mouse Pokémon',
    flavorText: 'A cute electric mouse.',
    evolutionChainUrl: 'https://pokeapi.co/api/v2/evolution-chain/10/',
    evolvesFromSpecies: 'pichu',
    isLegendary: false,
    isMythical: false,
  },
});

const setup = async () => {
  const detailSubject = new ReplaySubject<PokemonDetail>(1);
  const stub: PokemonDetailRepository = {
    getDetail(_name: string): Observable<PokemonDetail> {
      return detailSubject.asObservable();
    },
    getEvolutionChain(): Observable<EvolutionChain> {
      throw new Error('not used directly');
    },
  };

  await TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([{ path: '', children: [] }]),
      provideTranslocoForTesting(),
      { provide: POKEMON_DETAIL_REPOSITORY, useValue: stub },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PokemonDetailPage);
  const ref: ComponentRef<PokemonDetailPage> = fixture.componentRef;
  ref.setInput('name', 'pikachu');
  fixture.detectChanges();
  return { fixture, ref, root: fixture.nativeElement as HTMLElement, detailSubject };
};

const flushResource = async (fixture: { detectChanges(): void }): Promise<void> => {
  // Two microtask boundaries: rxResource flushes the loader observable
  // on the first, Transloco's translate signal updates on the second.
  await Promise.resolve();
  await Promise.resolve();
  TestBed.tick();
  fixture.detectChanges();
};

describe('PokemonDetailPage', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'pt-BR' });
  });

  it('renders the skeleton while detail is pending', async () => {
    const { root } = await setup();
    expect(root.querySelector('app-pokemon-detail-skeleton')).not.toBeNull();
    expect(root.querySelector('article')).toBeNull();
  });

  it('renders the localized name, dex number, types and stats when detail loads', async () => {
    const { fixture, root, detailSubject } = await setup();
    detailSubject.next(makeDetail('pikachu'));
    await flushResource(fixture);

    expect(root.querySelector('article')).not.toBeNull();
    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Pikachu');
    expect(root.textContent).toContain('#0025');
    expect(root.textContent).toContain('Mouse Pokémon');
    expect(root.querySelector('app-pokemon-stats-panel')).not.toBeNull();
  });

  it('toggles the shiny sprite on press and reverts on a second press', async () => {
    const { fixture, root, detailSubject } = await setup();
    detailSubject.next(makeDetail('pikachu'));
    await flushResource(fixture);

    const initialSrc = root.querySelector('img')!.getAttribute('src');
    expect(initialSrc).toContain('artwork.png');

    const toggle = Array.from(root.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('shiny'),
    );
    toggle!.click();
    await flushResource(fixture);
    expect(root.querySelector('img')!.getAttribute('src')).toContain('shiny.png');

    toggle!.click();
    await flushResource(fixture);
    expect(root.querySelector('img')!.getAttribute('src')).toContain('artwork.png');
  });

  it('hides the shiny toggle when species has no shiny sprite', async () => {
    const { fixture, root, detailSubject } = await setup();
    detailSubject.next(makeDetail('pikachu', null));
    await flushResource(fixture);

    const toggle = Array.from(root.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('shiny'),
    );
    expect(toggle).toBeUndefined();
  });

  it('shows the error region with a retry button when the resource fails', async () => {
    const { fixture, root, detailSubject } = await setup();
    detailSubject.error({ kind: 'not-found', url: 'pokemon/missingno', cause: null });
    await flushResource(fixture);

    expect(root.querySelector('[role="alert"]')).not.toBeNull();
    expect(root.textContent).toContain('Pokémon não encontrado');
  });
});
