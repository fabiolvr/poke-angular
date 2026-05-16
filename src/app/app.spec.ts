import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslocoForTesting } from '@core/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';

const stubMatchMedia = (): void => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) =>
      ({
        matches: false,
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

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'pt-BR' });
    stubMatchMedia();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslocoForTesting(),
      ],
    }).compileComponents();
  });

  it('mounts the AppShell wrapping the router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-app-shell')).not.toBeNull();
    expect(root.querySelector('router-outlet')).not.toBeNull();
    expect(root.querySelector('app-header')).not.toBeNull();
    expect(root.querySelector('app-footer')).not.toBeNull();
  });

  it('exposes a skip-link as the first focusable element', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const skip = (fixture.nativeElement as HTMLElement).querySelector('a.skip-link');
    expect(skip?.getAttribute('href')).toBe('#main');
  });
});
