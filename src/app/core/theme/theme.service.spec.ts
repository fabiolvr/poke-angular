import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from './theme.service';

const STORAGE_KEY = 'poke-angular:theme';

// jsdom does not implement window.matchMedia, so we install a stub the
// service can call into. Configurable=true lets each test override it.
const mockMatchMedia = (matches: boolean): void => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) =>
      ({
        matches,
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

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    mockMatchMedia(false);
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to system preference when storage is empty', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(service.preference()).toBe('system');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('reads explicit dark preference from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const service = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(service.preference()).toBe('dark');
    expect(service.resolved()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('resolves system + prefers-dark to dark', () => {
    mockMatchMedia(true);
    const service = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(service.preference()).toBe('system');
    expect(service.resolved()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('setPreference persists and applies the attribute', () => {
    const service = TestBed.inject(ThemeService);
    service.setPreference('light');
    TestBed.tick();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggle flips between light and dark from the resolved value', () => {
    const service = TestBed.inject(ThemeService);
    service.setPreference('light');
    TestBed.tick();
    service.toggle();
    TestBed.tick();
    expect(service.resolved()).toBe('dark');
    service.toggle();
    TestBed.tick();
    expect(service.resolved()).toBe('light');
  });
});
