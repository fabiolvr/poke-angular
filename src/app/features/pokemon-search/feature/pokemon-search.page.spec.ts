import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslocoForTesting } from '@core/i18n';
import { ReplaySubject, type Observable } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  POKEMON_INDEX_REPOSITORY,
  type PokemonIndexRepository,
  type PokemonRef,
} from '../data-access';
import PokemonSearchPage from './pokemon-search.page';

const INDEX: readonly PokemonRef[] = [
  { id: 1, name: 'bulbasaur' },
  { id: 4, name: 'charmander' },
  { id: 7, name: 'squirtle' },
  { id: 25, name: 'pikachu' },
  { id: 133, name: 'eevee' },
];

const setup = () => {
  const indexSubject = new ReplaySubject<readonly PokemonRef[]>(1);
  const stub: PokemonIndexRepository = {
    getIndex(): Observable<readonly PokemonRef[]> {
      return indexSubject.asObservable();
    },
  };

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([{ path: '', children: [] }]),
      provideTranslocoForTesting(),
      { provide: POKEMON_INDEX_REPOSITORY, useValue: stub },
    ],
  });

  const fixture = TestBed.createComponent(PokemonSearchPage);
  const ref: ComponentRef<PokemonSearchPage> = fixture.componentRef;
  fixture.detectChanges();
  return { fixture, ref, root: fixture.nativeElement as HTMLElement, indexSubject };
};

const flush = async (fixture: ReturnType<typeof setup>['fixture']): Promise<void> => {
  await Promise.resolve();
  TestBed.tick();
  fixture.detectChanges();
};

const type = async (
  fixture: ReturnType<typeof setup>['fixture'],
  root: HTMLElement,
  value: string,
): Promise<void> => {
  const input = root.querySelector('input') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  // Walk past the 300ms debounceTime with real timers. Vitest's fake
  // timers don't propagate through the toObservable → debounceTime →
  // toSignal bridge reliably under Angular 21 + zoneless, so we eat
  // the ~350ms wall-time cost per typing assertion.
  await new Promise((resolve) => setTimeout(resolve, 350));
  await flush(fixture);
};

describe('PokemonSearchPage', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'pt-BR' });
  });

  it('renders the loading state while the index is fetching', () => {
    const { root } = setup();
    expect(root.textContent).toContain('Preparando índice');
  });

  it('shows the typeToStart hint once the index resolves and the input is empty', async () => {
    const { fixture, root, indexSubject } = setup();
    indexSubject.next(INDEX);
    await flush(fixture);
    expect(root.textContent).toContain('Comece a digitar');
  });

  it('filters results by case-insensitive substring after the debounce', async () => {
    const { fixture, root, indexSubject } = setup();
    indexSubject.next(INDEX);
    await flush(fixture);

    await type(fixture, root, 'PIK');

    const items = Array.from(root.querySelectorAll('li'));
    expect(items).toHaveLength(1);
    expect(items[0]?.textContent).toContain('pikachu');
    expect(items[0]?.textContent).toContain('#0025');
  });

  it('shows the empty state for queries with no matches', async () => {
    const { fixture, root, indexSubject } = setup();
    indexSubject.next(INDEX);
    await flush(fixture);

    await type(fixture, root, 'zzzz');

    expect(root.textContent).toContain('Nada para');
    expect(root.querySelector('ul[role="listbox"]')).toBeNull();
  });

  it('navigates to /pokemon/<name> when Enter fires with a focused result', async () => {
    const { fixture, root, indexSubject } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    indexSubject.next(INDEX);
    await flush(fixture);

    await type(fixture, root, 'pika');

    // Cursor lands on the only match after ArrowDown.
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(navigate).toHaveBeenCalledWith(['/pokemon', 'pikachu']);
  });

  it('Escape clears the query and focused cursor', async () => {
    const { fixture, root, indexSubject } = setup();
    indexSubject.next(INDEX);
    await flush(fixture);
    await type(fixture, root, 'pika');
    expect((root.querySelector('input') as HTMLInputElement).value).toBe('pika');

    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect((root.querySelector('input') as HTMLInputElement).value).toBe('');
  });

  it('seeds the input from ?q= and shows matching results once the index resolves', async () => {
    const { fixture, ref, root, indexSubject } = setup();
    ref.setInput('q', 'pika');
    fixture.detectChanges();
    indexSubject.next(INDEX);
    // Walk past the debounce so results() sees 'pika'.
    await new Promise((resolve) => setTimeout(resolve, 350));
    await flush(fixture);

    expect((root.querySelector('input') as HTMLInputElement).value).toBe('pika');
    const items = Array.from(root.querySelectorAll('li'));
    expect(items).toHaveLength(1);
    expect(items[0]?.textContent).toContain('pikachu');
  });

  it('writes the debounced query back to ?q= via router.navigate(replaceUrl)', async () => {
    const { fixture, root, indexSubject } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    indexSubject.next(INDEX);
    await flush(fixture);

    await type(fixture, root, 'pika');

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { q: 'pika' },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      }),
    );
  });

  it('removes ?q= from the URL when the user clears the query', async () => {
    const { fixture, ref, root, indexSubject } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    ref.setInput('q', 'pika');
    fixture.detectChanges();
    indexSubject.next(INDEX);
    await new Promise((resolve) => setTimeout(resolve, 350));
    await flush(fixture);
    navigate.mockClear();

    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 350));
    await flush(fixture);

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { q: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      }),
    );
  });
});
