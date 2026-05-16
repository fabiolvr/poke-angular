import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { BrutalButton } from './brutal-button';

@Component({
  imports: [BrutalButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-brutal-button
      [variant]="variant()"
      [size]="size()"
      [disabled]="disabled()"
      [loading]="loading()"
      (pressed)="onPressed($event)"
    >
      Click me
    </app-brutal-button>
  `,
})
class HostComponent {
  variant = signal<'primary' | 'secondary' | 'danger' | 'ghost'>('primary');
  size = signal<'sm' | 'md' | 'lg'>('md');
  disabled = signal(false);
  loading = signal(false);
  pressedCount = 0;
  onPressed(_event: MouseEvent): void {
    this.pressedCount += 1;
  }
}

const setup = () => {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const button = (fixture.nativeElement as HTMLElement).querySelector(
    'button',
  ) as HTMLButtonElement;
  return { fixture, host, button };
};

describe('BrutalButton', () => {
  it('renders projected content inside a real <button>', () => {
    const { button } = setup();
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toBe('Click me');
    expect(button.type).toBe('button');
  });

  it('emits pressed on click when enabled', () => {
    const { fixture, host, button } = setup();
    button.click();
    fixture.detectChanges();
    expect(host.pressedCount).toBe(1);
  });

  it('does not emit when disabled', () => {
    const { fixture, host, button } = setup();
    host.disabled.set(true);
    fixture.detectChanges();
    button.click();
    expect(host.pressedCount).toBe(0);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('marks the button as aria-busy while loading', () => {
    const { fixture, host, button } = setup();
    host.loading.set(true);
    fixture.detectChanges();
    expect(button.getAttribute('aria-busy')).toBe('true');
    button.click();
    expect(host.pressedCount).toBe(0);
  });

  it('applies size and variant classes via signal-driven inputs', () => {
    const { fixture, host, button } = setup();
    host.variant.set('danger');
    host.size.set('lg');
    fixture.detectChanges();
    expect(button.className).toContain('bg-accent');
    expect(button.className).toContain('px-6');
  });
});
