import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Service, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import {
  DEFAULT_LANG,
  isSupportedLang,
  SUPPORTED_LANGS,
  type SupportedLang,
} from './supported-langs';

const STORAGE_KEY = 'poke-angular:lang';

/**
 * Owns the user's locale: detection on first paint, persistence across
 * reloads, and a signal-based API that other services (formatters, the
 * language switcher) can react to.
 *
 * Initial selection priority:
 *   1. Stored choice in localStorage (explicit user pick)
 *   2. navigator.language matched against SUPPORTED_LANGS
 *   3. DEFAULT_LANG
 */
@Service()
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);

  readonly current = signal<SupportedLang>(this.detectInitial());
  readonly available = computed(() => SUPPORTED_LANGS);

  constructor() {
    // Push the initial choice into Transloco synchronously so the first
    // render uses the right bundle. The effect below keeps them in sync
    // whenever the signal changes.
    this.transloco.setActiveLang(this.current());
    this.document.documentElement.setAttribute('lang', this.current());

    effect(() => {
      const lang = this.current();
      this.transloco.setActiveLang(lang);
      this.document.documentElement.setAttribute('lang', lang);
      this.persist(lang);
    });
  }

  setLanguage(lang: SupportedLang): void {
    this.current.set(lang);
  }

  private detectInitial(): SupportedLang {
    const stored = this.safeRead();
    if (isSupportedLang(stored)) return stored;

    const navLang = this.document.defaultView?.navigator.language ?? '';
    // Match exact (pt-BR) first, then prefix (pt → pt-BR).
    if (isSupportedLang(navLang)) return navLang;
    const prefix = navLang.split('-')[0];
    const fromPrefix = SUPPORTED_LANGS.find((l) => l.startsWith(`${prefix}-`) || l === prefix);
    return fromPrefix ?? DEFAULT_LANG;
  }

  private safeRead(): string | null {
    try {
      return this.document.defaultView?.localStorage.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  private persist(lang: SupportedLang): void {
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* localStorage unavailable — non-fatal. */
    }
  }
}
