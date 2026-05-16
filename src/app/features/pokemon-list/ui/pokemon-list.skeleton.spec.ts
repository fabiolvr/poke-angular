import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTranslocoForTesting } from '@core/i18n';
import { beforeEach, describe, expect, it } from 'vitest';
import { PokemonListSkeleton } from './pokemon-list.skeleton';

describe('PokemonListSkeleton', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'pt-BR' });
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslocoForTesting()],
    });
  });

  it('renders 20 placeholder items by default', () => {
    const fixture = TestBed.createComponent(PokemonListSkeleton);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('li')).toHaveLength(20);
  });

  it('exposes a polite live region for screen readers', () => {
    const fixture = TestBed.createComponent(PokemonListSkeleton);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const list = root.querySelector('ul');
    expect(list?.getAttribute('role')).toBe('status');
    expect(list?.getAttribute('aria-live')).toBe('polite');
    expect(list?.getAttribute('aria-label')).toBe('Carregando');
  });

  it('honours a custom count input', () => {
    const fixture = TestBed.createComponent(PokemonListSkeleton);
    fixture.componentRef.setInput('count', 6);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('li')).toHaveLength(6);
  });
});
