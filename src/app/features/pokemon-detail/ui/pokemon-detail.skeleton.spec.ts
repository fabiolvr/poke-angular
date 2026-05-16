import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTranslocoForTesting } from '@core/i18n';
import { beforeEach, describe, expect, it } from 'vitest';
import { PokemonDetailSkeleton } from './pokemon-detail.skeleton';

describe('PokemonDetailSkeleton', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'pt-BR' });
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslocoForTesting()],
    });
  });

  it('renders an accessible polite live region', () => {
    const fixture = TestBed.createComponent(PokemonDetailSkeleton);
    fixture.detectChanges();
    const region = (fixture.nativeElement as HTMLElement).querySelector(
      '[role="status"]',
    ) as HTMLElement;
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.getAttribute('aria-label')).toBe('Carregando');
  });

  it('renders 6 stat placeholders + sprite + name + type blocks', () => {
    const fixture = TestBed.createComponent(PokemonDetailSkeleton);
    fixture.detectChanges();
    const skeletons = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'app-brutal-skeleton',
    );
    // 1 sprite + 1 name + 1 subtitle + 2 type blocks + 6 stat rows = 11
    expect(skeletons.length).toBe(11);
  });
});
