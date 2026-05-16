import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { BrutalInput } from './brutal-input';

@Component({
  imports: [BrutalInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-brutal-input
      [(value)]="value"
      [label]="label()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
    />
  `,
})
class HostComponent {
  value = signal('');
  label = signal('Search Pokémon');
  hint = signal('');
  errorMessage = signal('');
}

const setup = () => {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const input = root.querySelector('input') as HTMLInputElement;
  const label = root.querySelector('label > span') as HTMLElement;
  return { fixture, host: fixture.componentInstance, root, input, label };
};

describe('BrutalInput', () => {
  it('renders a labelled input wired by id/for', () => {
    const { input, root } = setup();
    const label = root.querySelector('label');
    expect(label?.getAttribute('for')).toBe(input.id);
    expect(input.type).toBe('text');
  });

  it('writes back into the model on input events', () => {
    const { fixture, host, input } = setup();
    input.value = 'pika';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBe('pika');
  });

  it('exposes hint via aria-describedby when no error', () => {
    const { fixture, host, input } = setup();
    host.hint.set('Try "char" or "pika"');
    fixture.detectChanges();
    expect(input.getAttribute('aria-describedby')).toContain('-hint');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('surfaces error message only after blur (touched)', () => {
    const { fixture, host, input, root } = setup();
    host.errorMessage.set('Required');
    fixture.detectChanges();
    expect(root.querySelector('[aria-live="polite"]')).toBeNull();

    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    const errorEl = root.querySelector('[aria-live="polite"]');
    expect(errorEl?.textContent?.trim()).toBe('Required');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(errorEl?.id);
  });
});
