import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Pokemon, PokemonPage, PokemonSummary } from '@core/domain';
import { provideTranslocoForTesting } from '@core/i18n';
import { ReplaySubject, type Observable } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { POKEMON_REPOSITORY, type PokemonRepository } from '../data-access';
import PokemonListPage from './pokemon-list.page';

const summary = (id: number, name: string): PokemonSummary => ({
  id,
  name,
  types: ['normal'],
  sprites: { thumbnail: `sprite-${id}.png`, artwork: null, shiny: null },
});

const page = (
  items: PokemonSummary[],
  total: number,
  opts: Partial<PokemonPage> = {},
): PokemonPage => ({
  items,
  total,
  offset: opts.offset ?? 0,
  limit: opts.limit ?? 20,
  hasNext: opts.hasNext ?? (items.length === 20 && total > items.length),
  hasPrev: opts.hasPrev ?? (opts.offset ?? 0) > 0,
});

const makeStub = () => {
  const calls: { offset: number; subject: ReplaySubject<PokemonPage> }[] = [];
  const stub: PokemonRepository = {
    listCards(offset: number, _limit: number): Observable<PokemonPage> {
      const subject = new ReplaySubject<PokemonPage>(1);
      calls.push({ offset, subject });
      return subject.asObservable();
    },
    getDetails(_name: string): Observable<Pokemon> {
      throw new Error('getDetails not expected in this test');
    },
  };
  return { stub, calls };
};

const setup = () => {
  const { stub, calls } = makeStub();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([{ path: '', children: [] }]),
      provideTranslocoForTesting(),
      { provide: POKEMON_REPOSITORY, useValue: stub },
    ],
  });
  const fixture = TestBed.createComponent(PokemonListPage);
  const ref: ComponentRef<PokemonListPage> = fixture.componentRef;
  fixture.detectChanges();
  return { fixture, ref, root: fixture.nativeElement as HTMLElement, calls };
};

const flushResource = async (fixture: ReturnType<typeof setup>['fixture']): Promise<void> => {
  // rxResource updates its value signal via a microtask after the loader
  // observable emits. Yield to the microtask queue (Promise.resolve), run
  // the effect queue (TestBed.tick), then re-render.
  await Promise.resolve();
  TestBed.tick();
  fixture.detectChanges();
};

const flushEffects = (fixture: ReturnType<typeof setup>['fixture']): void => {
  // Synchronous flush for re-subscriptions (retry, params change) that
  // happen without an awaited microtask boundary.
  TestBed.tick();
  fixture.detectChanges();
};

describe('PokemonListPage', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'pt-BR' });
  });

  it('renders the skeleton while the first page is loading', () => {
    const { root, calls } = setup();
    expect(calls).toHaveLength(1);
    expect(calls[0]?.offset).toBe(0);
    expect(root.querySelector('app-pokemon-list-skeleton')).not.toBeNull();
    expect(root.querySelector('app-pokemon-list-grid')).toBeNull();
  });

  it('shows the grid + pagination once the resource resolves', async () => {
    const { fixture, root, calls } = setup();
    calls[0]!.subject.next(page([summary(1, 'bulbasaur')], 1010));
    await flushResource(fixture);

    expect(root.querySelector('app-pokemon-list-skeleton')).toBeNull();
    expect(root.querySelector('app-pokemon-list-grid')).not.toBeNull();
    expect(root.querySelector('nav[aria-label]')).not.toBeNull();
    expect(root.textContent).toContain('1');
    expect(root.textContent).toContain('51');
  });

  it('shows the error region with a retry button when the resource fails', async () => {
    const { fixture, root, calls } = setup();
    calls[0]!.subject.error({ kind: 'network', message: '', cause: null });
    await flushResource(fixture);

    const alert = root.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.querySelector('app-brutal-button')).not.toBeNull();
  });

  it('reloads the resource when retry is pressed', async () => {
    const { fixture, root, calls } = setup();
    calls[0]!.subject.error({ kind: 'network', message: '', cause: null });
    await flushResource(fixture);

    const retryBtn = root.querySelector('[role="alert"] button') as HTMLButtonElement;
    retryBtn.click();
    flushEffects(fixture);

    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls[calls.length - 1]?.offset).toBe(0);
  });

  it('refetches with offset=20 when the page input flips to 2', async () => {
    const { fixture, ref, calls } = setup();
    calls[0]!.subject.next(page([summary(1, 'bulbasaur')], 1010));
    await flushResource(fixture);

    ref.setInput('page', '2');
    flushEffects(fixture);

    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls[calls.length - 1]?.offset).toBe(20);
  });

  it('treats an empty total as the empty state, not skeleton', async () => {
    const { fixture, root, calls } = setup();
    calls[0]!.subject.next(page([], 0));
    await flushResource(fixture);

    expect(root.querySelector('[role="status"]')).not.toBeNull();
    expect(root.querySelector('app-pokemon-list-grid')).toBeNull();
  });
});
