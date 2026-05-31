import { TestBed } from '@angular/core/testing';
import { LanguageService, provideTranslocoForTesting } from '@core/i18n';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageSwitcher } from './language-switcher';

const findButtons = (root: HTMLElement): HTMLButtonElement[] =>
  Array.from(root.querySelectorAll('button'));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('lang');
    // Force a deterministic initial language: pt-BR. Without this the spec
    // depends on whatever jsdom (or a previous test) left on navigator.language.
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'pt-BR' });
    TestBed.configureTestingModule({
      providers: [provideTranslocoForTesting()],
    });
  });

  it('renders one button per supported language and marks the active one', () => {
    const fixture = TestBed.createComponent(LanguageSwitcher);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const buttons = findButtons(root);
    expect(buttons).toHaveLength(2);
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['PT', 'EN']);

    const active = root.querySelector('[aria-pressed="true"]');
    expect(active?.textContent?.trim()).toBe('PT'); // default
  });

  it('switches the active language when pressed', () => {
    const fixture = TestBed.createComponent(LanguageSwitcher);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const service = TestBed.inject(LanguageService);

    const enButton = findButtons(root).find((b) => b.textContent?.trim() === 'EN');
    enButton?.click();
    fixture.detectChanges();
    TestBed.tick();

    expect(service.current()).toBe('en');
    const active = root.querySelector('[aria-pressed="true"]');
    expect(active?.textContent?.trim()).toBe('EN');
  });
});
