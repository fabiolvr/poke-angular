import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LanguageService } from './language.service';
import { provideTranslocoConfig } from './transloco.config';

const STORAGE_KEY = 'poke-angular:lang';

const stubNavigatorLanguage = (value: string): void => {
  Object.defineProperty(navigator, 'language', {
    configurable: true,
    get: () => value,
  });
};

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('lang');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslocoConfig()],
    });
  });

  afterEach(() => {
    stubNavigatorLanguage('en-US');
  });

  it('falls back to the default language when storage and navigator are empty', () => {
    stubNavigatorLanguage('');
    const service = TestBed.inject(LanguageService);
    expect(service.current()).toBe('pt-BR');
  });

  it('matches navigator.language exactly when supported', () => {
    stubNavigatorLanguage('pt-BR');
    const service = TestBed.inject(LanguageService);
    expect(service.current()).toBe('pt-BR');
  });

  it('matches navigator.language by prefix (pt → pt-BR)', () => {
    stubNavigatorLanguage('pt-PT');
    const service = TestBed.inject(LanguageService);
    expect(service.current()).toBe('pt-BR');
  });

  it('matches English browser to en', () => {
    stubNavigatorLanguage('en-GB');
    const service = TestBed.inject(LanguageService);
    expect(service.current()).toBe('en');
  });

  it('prefers stored choice over navigator preference', () => {
    localStorage.setItem(STORAGE_KEY, 'en');
    stubNavigatorLanguage('pt-BR');
    const service = TestBed.inject(LanguageService);
    expect(service.current()).toBe('en');
  });

  it('setLanguage persists, mirrors to Transloco and updates <html lang>', () => {
    const service = TestBed.inject(LanguageService);
    const transloco = TestBed.inject(TranslocoService);

    service.setLanguage('en');
    TestBed.tick();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
    expect(transloco.getActiveLang()).toBe('en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });
});
