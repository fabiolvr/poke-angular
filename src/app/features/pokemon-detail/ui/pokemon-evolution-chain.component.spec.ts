import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { EvolutionChain } from '@core/domain';
import { provideTranslocoForTesting } from '@core/i18n';
import { ReplaySubject, type Observable } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { POKEMON_DETAIL_REPOSITORY, type PokemonDetailRepository } from '../data-access';
import { PokemonEvolutionChain } from './pokemon-evolution-chain.component';

const flushResource = async (fixture: { detectChanges(): void }): Promise<void> => {
  await Promise.resolve();
  TestBed.tick();
  fixture.detectChanges();
};

@Component({
  imports: [PokemonEvolutionChain],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-pokemon-evolution-chain [chainUrl]="url()" />`,
})
class HostComponent {
  url = signal('https://pokeapi.co/api/v2/evolution-chain/10/');
}

const setup = () => {
  const subjects = new Map<string, ReplaySubject<EvolutionChain>>();
  const stub: PokemonDetailRepository = {
    getDetail() {
      throw new Error('not used');
    },
    getEvolutionChain(url: string): Observable<EvolutionChain> {
      let s = subjects.get(url);
      if (!s) {
        s = new ReplaySubject<EvolutionChain>(1);
        subjects.set(url, s);
      }
      return s.asObservable();
    },
  };
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      provideTranslocoForTesting(),
      { provide: POKEMON_DETAIL_REPOSITORY, useValue: stub },
    ],
  });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return { fixture, root: fixture.nativeElement as HTMLElement, subjects };
};

describe('PokemonEvolutionChain', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'pt-BR' });
  });

  it('renders the loading state initially', () => {
    const { root } = setup();
    expect(root.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('shows the empty state when the chain has a single species', async () => {
    const { fixture, root, subjects } = setup();
    const subject = subjects.get('https://pokeapi.co/api/v2/evolution-chain/10/')!;
    subject.next({
      id: 10,
      root: { speciesId: 25, speciesName: 'pikachu', evolvesTo: [] },
    });
    await flushResource(fixture);

    expect(root.textContent).toContain('não evolui');
  });

  it('renders a clickable node per species when the chain has multiple links', async () => {
    const { fixture, root, subjects } = setup();
    const subject = subjects.get('https://pokeapi.co/api/v2/evolution-chain/10/')!;
    subject.next({
      id: 10,
      root: {
        speciesId: 172,
        speciesName: 'pichu',
        evolvesTo: [
          {
            speciesId: 25,
            speciesName: 'pikachu',
            evolvesTo: [{ speciesId: 26, speciesName: 'raichu', evolvesTo: [] }],
          },
        ],
      },
    });
    await flushResource(fixture);

    const links = Array.from(root.querySelectorAll('a'));
    expect(links).toHaveLength(3);
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/pokemon/pichu',
      '/pokemon/pikachu',
      '/pokemon/raichu',
    ]);
    expect(root.textContent).toContain('#0172');
    expect(root.textContent).toContain('#0025');
    expect(root.textContent).toContain('#0026');
  });
});
