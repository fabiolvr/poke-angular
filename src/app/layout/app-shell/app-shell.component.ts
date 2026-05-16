import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { brutalButtonClasses } from '@shared/ui';
import { AppFooter } from '../footer/footer.component';
import { AppHeader } from '../header/header.component';

/**
 * App shell. The router-outlet renders inside `<main id="main">` so the
 * skip-link at the top of the body can land focus there. The body
 * lays out vertically with `min-h-dvh + flex-col` so the footer
 * sticks to the bottom of short pages.
 */
@Component({
  selector: 'app-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppFooter, AppHeader, RouterOutlet, TranslocoPipe],
  template: `
    <a [class]="skipLinkClasses" href="#main">
      {{ 'app.skipToContent' | transloco }}
    </a>
    <div class="flex min-h-dvh flex-col">
      <app-header />
      <main id="main" tabindex="-1" class="flex-1 focus:outline-none">
        <router-outlet />
      </main>
      <app-footer />
    </div>
  `,
})
export class AppShell {
  protected readonly skipLinkClasses = `skip-link ${brutalButtonClasses('primary', 'sm')}`;
}
