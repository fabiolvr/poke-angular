import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { BrutalCard } from './brutal-card';

@Component({
  imports: [BrutalCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-brutal-card [interactive]="interactive()" [padding]="padding()" [role]="role()">
      <h2>Title</h2>
    </app-brutal-card>
  `,
})
class HostComponent {
  interactive = signal(false);
  padding = signal<'none' | 'sm' | 'md' | 'lg'>('md');
  role = signal<string | null>(null);
}

const setup = () => {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return {
    fixture,
    host: fixture.componentInstance,
    fixtureEl: fixture.nativeElement as HTMLElement,
  };
};

describe('BrutalCard', () => {
  it('renders projected content with the brutal-surface class', () => {
    const { fixtureEl } = setup();
    const card = fixtureEl.querySelector('app-brutal-card > div');
    expect(card?.className).toContain('brutal-surface');
    expect(card?.querySelector('h2')?.textContent).toBe('Title');
  });

  it('does not add interactive classes by default', () => {
    const { fixtureEl } = setup();
    const card = fixtureEl.querySelector('app-brutal-card > div');
    expect(card?.className).not.toContain('brutal-interactive');
  });

  it('opts into interactive classes when interactive=true', () => {
    const { fixture, host, fixtureEl } = setup();
    host.interactive.set(true);
    fixture.detectChanges();
    const card = fixtureEl.querySelector('app-brutal-card > div');
    expect(card?.className).toContain('brutal-interactive');
    expect(card?.className).toContain('cursor-pointer');
  });

  it('maps padding tokens to spacing utilities', () => {
    const { fixture, host, fixtureEl } = setup();
    host.padding.set('lg');
    fixture.detectChanges();
    const card = fixtureEl.querySelector('app-brutal-card > div');
    expect(card?.className).toContain('p-7');
  });

  it('forwards an explicit ARIA role', () => {
    const { fixture, host, fixtureEl } = setup();
    host.role.set('article');
    fixture.detectChanges();
    const card = fixtureEl.querySelector('app-brutal-card > div');
    expect(card?.getAttribute('role')).toBe('article');
  });
});
