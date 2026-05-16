import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from '@core/theme';
import { provideTranslocoForTesting } from '@core/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './theme-toggle.component';

const stubMatchMedia = (prefersDark: boolean): void => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) =>
      ({
        matches: prefersDark,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
      }) as unknown as MediaQueryList,
  });
};

const setup = () => {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslocoForTesting()],
  });
  const fixture = TestBed.createComponent(ThemeToggle);
  fixture.detectChanges();
  return {
    fixture,
    button: (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement,
    theme: TestBed.inject(ThemeService),
  };
};

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    stubMatchMedia(false);
  });

  it('renders a button labelled with the target theme', () => {
    const { button } = setup();
    expect(button.getAttribute('aria-label')).toBe('Mudar para tema escuro');
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('toggles the resolved theme and flips its label on press', () => {
    const { fixture, button, theme } = setup();
    button.click();
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();

    expect(theme.resolved()).toBe('dark');
    expect(button.getAttribute('aria-label')).toBe('Mudar para tema claro');
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });
});
