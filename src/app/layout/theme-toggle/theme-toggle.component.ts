import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from '@core/theme';
import { TranslocoPipe } from '@jsverse/transloco';
import { brutalButtonClasses } from '@shared/ui';

/**
 * Simple two-state toggle between light and dark. Sits in the header
 * alongside the LanguageSwitcher. Doesn't expose a third "system"
 * option here — that lives in the styleguide / settings; the header
 * stays single-tap.
 *
 * Renders the icon for the *target* state (sun when we'd switch to
 * light, moon when we'd switch to dark) and pairs it with an
 * aria-label so screen readers announce the action, not the symbol.
 */
@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    <button
      type="button"
      [class]="buttonClasses"
      [attr.aria-label]="ariaLabelKey() | transloco"
      [attr.aria-pressed]="isDark()"
      (click)="toggle()"
    >
      <span aria-hidden="true">{{ isDark() ? '☀' : '☾' }}</span>
    </button>
  `,
})
export class ThemeToggle {
  private readonly theme = inject(ThemeService);

  protected readonly isDark = computed(() => this.theme.resolved() === 'dark');
  protected readonly ariaLabelKey = computed(() =>
    this.isDark() ? 'theme.toggleToLight' : 'theme.toggleToDark',
  );

  protected readonly buttonClasses = brutalButtonClasses('ghost', 'sm', 'min-w-[2.5rem]');

  protected toggle(): void {
    this.theme.toggle();
  }
}
