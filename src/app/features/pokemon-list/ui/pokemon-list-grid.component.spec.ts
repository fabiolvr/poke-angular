import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { PokemonSummary } from '@core/domain';
import { provideTranslocoForTesting } from '@core/i18n';
import { beforeEach, describe, expect, it } from 'vitest';
import { PokemonListGrid } from './pokemon-list-grid.component';

const makeSummary = (id: number, name: string): PokemonSummary => ({
  id,
  name,
  types: ['normal'],
  sprites: { thumbnail: `sprite-${id}.png`, artwork: null, shiny: null },
});

@Component({
  imports: [PokemonListGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-pokemon-list-grid [items]="items()" />`,
})
class HostComponent {
  items = signal<readonly PokemonSummary[]>([]);
}

const setup = (items: readonly PokemonSummary[]) => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      provideTranslocoForTesting(),
    ],
  });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.items.set(items);
  fixture.detectChanges();
  return { fixture, root: fixture.nativeElement as HTMLElement };
};

describe('PokemonListGrid', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'pt-BR' });
  });

  it('renders one app-pokemon-card per item', () => {
    const items = [makeSummary(1, 'bulbasaur'), makeSummary(2, 'ivysaur')];
    const { root } = setup(items);
    expect(root.querySelectorAll('app-pokemon-card')).toHaveLength(2);
  });

  it('marks the first 4 cards as priority for LCP', () => {
    const items = Array.from({ length: 6 }, (_, i) => makeSummary(i + 1, `mon-${i + 1}`));
    const { root } = setup(items);
    const imgs = Array.from(root.querySelectorAll('img'));
    expect(imgs).toHaveLength(6);
    // NgOptimizedImage propagates priority via fetchpriority="high" on
    // priority images and "auto" or no attribute on the rest.
    const priorityFlags = imgs.map((img) => img.getAttribute('fetchpriority') === 'high');
    expect(priorityFlags.slice(0, 4).every(Boolean)).toBe(true);
    expect(priorityFlags.slice(4).every((p) => !p)).toBe(true);
  });

  it('renders an empty list when items is empty', () => {
    const { root } = setup([]);
    expect(root.querySelectorAll('li')).toHaveLength(0);
  });
});
