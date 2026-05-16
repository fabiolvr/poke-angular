import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LanguageService, SUPPORTED_LANGS, type SupportedLang } from '@core/i18n';
import { BrutalButton } from '@shared/ui';

/**
 * Header widget that lets users switch the UI language. Stateful (consumes
 * LanguageService) — lives in layout/ rather than shared/ui because it ties
 * the app shell to the language store.
 *
 * Renders one BrutalButton per supported language, primary variant for the
 * active one, ghost for the rest. Uses native button semantics + aria-pressed
 * for assistive tech.
 */
@Component({
  selector: 'app-language-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BrutalButton],
  template: `
    <div role="group" [attr.aria-label]="ariaLabel()" class="inline-flex gap-2">
      @for (lang of languages; track lang) {
        <app-brutal-button
          size="sm"
          [variant]="lang === current() ? 'primary' : 'ghost'"
          (pressed)="select(lang)"
        >
          <span [attr.aria-pressed]="lang === current()">{{ labelFor(lang) }}</span>
        </app-brutal-button>
      }
    </div>
  `,
})
export class LanguageSwitcher {
  private readonly languageService = inject(LanguageService);

  protected readonly languages = SUPPORTED_LANGS;
  protected readonly current = this.languageService.current;
  protected readonly ariaLabel = computed(() =>
    this.current() === 'pt-BR' ? 'Selecionar idioma' : 'Select language',
  );

  protected select(lang: SupportedLang): void {
    this.languageService.setLanguage(lang);
  }

  protected labelFor(lang: SupportedLang): string {
    switch (lang) {
      case 'pt-BR':
        return 'PT';
      case 'en':
        return 'EN';
    }
  }
}
