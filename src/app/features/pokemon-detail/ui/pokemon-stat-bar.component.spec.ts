import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { PokemonStatName } from '@core/domain';
import { provideTranslocoForTesting } from '@core/i18n';
import { beforeEach, describe, expect, it } from 'vitest';
import { PokemonStatBar } from './pokemon-stat-bar.component';

@Component({
  imports: [PokemonStatBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-pokemon-stat-bar [stat]="stat()" [value]="value()" />`,
})
class HostComponent {
  stat = signal<PokemonStatName>('hp');
  value = signal(45);
}

const setup = () => {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslocoForTesting()],
  });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
};

describe('PokemonStatBar', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'pt-BR' });
  });

  it('renders the localized stat name and base value', () => {
    const { root } = setup();
    expect(root.textContent).toContain('HP');
    expect(root.textContent).toContain('45');
  });

  it('exposes a meter role with aria-valuenow', () => {
    const { root } = setup();
    const meter = root.querySelector('[role="meter"]');
    expect(meter?.getAttribute('aria-valuenow')).toBe('45');
    expect(meter?.getAttribute('aria-valuemin')).toBe('0');
    expect(meter?.getAttribute('aria-valuemax')).toBe('255');
  });

  it('renders a bar fill whose width reflects value / 255', () => {
    const { fixture, host, root } = setup();
    host.value.set(255);
    fixture.detectChanges();
    const fill = root.querySelector('.bar-fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('flips the colour bucket between low/mid/high stats', () => {
    const { fixture, host, root } = setup();
    const fill = (): HTMLElement => root.querySelector('.bar-fill') as HTMLElement;

    host.value.set(40);
    fixture.detectChanges();
    expect(fill().style.backgroundColor).toContain('var(--color-accent)');

    host.value.set(120);
    fixture.detectChanges();
    expect(fill().style.backgroundColor).toContain('var(--color-warning)');

    host.value.set(200);
    fixture.detectChanges();
    expect(fill().style.backgroundColor).toContain('var(--color-success)');
  });
});
