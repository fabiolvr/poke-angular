import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'poke-angular:theme';

/**
 * ThemeService owns the user's color-scheme preference.
 *
 * Three levels of intent, in order of precedence:
 * 1. Explicit user choice (light or dark) — persisted in localStorage and
 *    written to `<html data-theme>`, which beats every other rule.
 * 2. `system` preference — no attribute is written; the @media block in
 *    tokens.css picks up `prefers-color-scheme`.
 * 3. Light default from @theme (first paint, before this service runs).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly preference = signal<ThemePreference>(this.loadInitialPreference());
  readonly resolved = computed<ResolvedTheme>(() => {
    const pref = this.preference();
    if (pref === 'system') return this.systemPrefersDark() ? 'dark' : 'light';
    return pref;
  });

  constructor() {
    effect(() => {
      const pref = this.preference();
      this.applyPreference(pref);
      this.persistPreference(pref);
    });
  }

  setPreference(pref: ThemePreference): void {
    this.preference.set(pref);
  }

  toggle(): void {
    this.preference.set(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  private loadInitialPreference(): ThemePreference {
    const stored = this.safeRead();
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'system';
  }

  private safeRead(): string | null {
    try {
      return this.document.defaultView?.localStorage.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  private persistPreference(pref: ThemePreference): void {
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      /* localStorage unavailable (e.g. privacy mode) — non-fatal. */
    }
  }

  private applyPreference(pref: ThemePreference): void {
    const root = this.document.documentElement;
    if (pref === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', pref);
    }
  }

  private systemPrefersDark(): boolean {
    return this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;
  }
}
