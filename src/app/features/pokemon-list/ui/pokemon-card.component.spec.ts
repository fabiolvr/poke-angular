import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { PokemonSummary } from '@core/domain';
import { provideTranslocoForTesting } from '@core/i18n';
import { beforeEach, describe, expect, it } from 'vitest';
import { PokemonCard } from './pokemon-card.component';

const pikachu: PokemonSummary = {
  id: 25,
  name: 'pikachu',
  types: ['electric'],
  sprites: {
    thumbnail: 'https://sprites/pikachu.png',
    artwork: 'https://sprites/pikachu-artwork.png',
    shiny: null,
  },
};

@Component({
  imports: [PokemonCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-pokemon-card [pokemon]="pokemon()" [priorityImage]="priority()" />`,
})
class HostComponent {
  pokemon = signal<PokemonSummary>(pikachu);
  priority = signal(false);
}

const setup = () => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      provideTranslocoForTesting(),
    ],
  });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
};

describe('PokemonCard', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'pt-BR' });
  });

  it('renders the pokémon name, formatted dex number and type badge', () => {
    const { root } = setup();
    expect(root.querySelector('h3')?.textContent?.trim()).toBe('pikachu');
    expect(root.textContent).toContain('#0025');
    const badges = Array.from(root.querySelectorAll('app-brutal-badge'));
    expect(badges.length).toBeGreaterThan(0);
    expect(root.textContent?.toLowerCase()).toContain('electric');
  });

  it('wraps the card in an anchor that points to /pokemon/{name}', () => {
    const { root } = setup();
    const anchor = root.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/pokemon/pikachu');
  });

  it('falls back to /img/missing-sprite.svg when thumbnail is null', () => {
    const { fixture, host, root } = setup();
    host.pokemon.set({ ...pikachu, sprites: { thumbnail: null, artwork: null, shiny: null } });
    fixture.detectChanges();
    const img = root.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/img/missing-sprite.svg');
  });

  it('exposes a localized aria-label combining name and number', () => {
    const { root } = setup();
    const anchor = root.querySelector('a');
    expect(anchor?.getAttribute('aria-label')).toBe('pikachu, #0025');
  });
});
