import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import type { PokemonTypeName } from '@core/theme';
import { BrutalBadge, type BrutalBadgeVariant } from './brutal-badge';

@Component({
  imports: [BrutalBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-brutal-badge [variant]="variant()" [pokemonType]="pokemonType()">
      {{ label() }}
    </app-brutal-badge>
  `,
})
class HostComponent {
  variant = signal<BrutalBadgeVariant>('neutral');
  pokemonType = signal<PokemonTypeName | null>(null);
  label = signal('Label');
}

const setup = () => {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const span = (fixture.nativeElement as HTMLElement).querySelector('span') as HTMLElement;
  return { fixture, host: fixture.componentInstance, span };
};

describe('BrutalBadge', () => {
  it('renders projected content with neutral defaults', () => {
    const { span } = setup();
    expect(span.textContent?.trim()).toBe('Label');
    expect(span.className).toContain('brutal-surface');
    expect(span.className).toContain('bg-surface');
  });

  it('applies type background and white label on a dark type', () => {
    const { fixture, host, span } = setup();
    host.variant.set('pokemon-type');
    host.pokemonType.set('fire');
    fixture.detectChanges();
    expect(span.className).toContain('bg-type-fire');
    expect(span.className).toContain('text-white');
  });

  it('uses ink label on a light type background', () => {
    const { fixture, host, span } = setup();
    host.variant.set('pokemon-type');
    host.pokemonType.set('electric');
    fixture.detectChanges();
    expect(span.className).toContain('bg-type-electric');
    expect(span.className).toContain('text-ink');
  });

  it('falls back to neutral when pokemon-type variant has no type', () => {
    const { fixture, host, span } = setup();
    host.variant.set('pokemon-type');
    host.pokemonType.set(null);
    fixture.detectChanges();
    expect(span.className).toContain('bg-surface');
  });
});
