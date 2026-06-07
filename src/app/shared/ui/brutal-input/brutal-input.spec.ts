import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField, minLength } from '@angular/forms/signals';
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

/** Host for Signal Forms bound path. */
@Component({
  imports: [BrutalInput, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-brutal-input [formField]="errorForm" label="Test" />`,
})
class FormHostComponent {
  val = signal('');
  errorForm = form(this.val, (path) => {
    minLength(path, 2, { message: 'Min 2 chars' });
  });
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

  it('surfaces Signal Forms validation errors after blur', () => {
    const fixture = TestBed.createComponent(FormHostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('input') as HTMLInputElement;

    // type 1 char — fails minLength(2)
    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    // error not visible until blur
    expect(root.querySelector('[aria-live="polite"]')).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBeNull();

    // blur marks touched → error should appear
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    const errorEl = root.querySelector('[aria-live="polite"]');
    expect(errorEl?.textContent?.trim()).toBe('Min 2 chars');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
