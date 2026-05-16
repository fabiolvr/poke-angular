import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { PokemonStat } from '@core/domain';
import { provideTranslocoForTesting } from '@core/i18n';
import { beforeEach, describe, expect, it } from 'vitest';
import { PokemonStatsPanel } from './pokemon-stats-panel.component';

const pikachuStats: readonly PokemonStat[] = [
  { name: 'hp', base: 35, effort: 0 },
  { name: 'attack', base: 55, effort: 0 },
  { name: 'defense', base: 40, effort: 0 },
  { name: 'special-attack', base: 50, effort: 0 },
  { name: 'special-defense', base: 50, effort: 0 },
  { name: 'speed', base: 90, effort: 2 },
];

@Component({
  imports: [PokemonStatsPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-pokemon-stats-panel [stats]="stats()" />`,
})
class HostComponent {
  stats = signal<readonly PokemonStat[]>(pikachuStats);
}

const setup = (stats: readonly PokemonStat[]) => {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslocoForTesting()],
  });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.stats.set(stats);
  fixture.detectChanges();
  return { fixture, root: fixture.nativeElement as HTMLElement };
};

describe('PokemonStatsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'pt-BR' });
  });

  it('renders one stat bar per canonical stat, in canonical order', () => {
    const { root } = setup(pikachuStats);
    const bars = root.querySelectorAll('app-pokemon-stat-bar');
    expect(bars).toHaveLength(6);
  });

  it('renders the sum of base stats as the total', () => {
    const { root } = setup(pikachuStats);
    expect(root.textContent).toContain('320'); // 35+55+40+50+50+90
  });

  it('renders 0 for stats not present in the input', () => {
    const { root } = setup([{ name: 'hp', base: 100, effort: 0 }]);
    const bars = root.querySelectorAll('app-pokemon-stat-bar');
    expect(bars).toHaveLength(6);
    expect(root.textContent).toContain('100');
  });
});
