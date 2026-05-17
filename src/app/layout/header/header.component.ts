import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, type IsActiveMatchOptions } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { ThemeToggle } from '../theme-toggle/theme-toggle.component';

/**
 * The shorthand `{ exact: true }` expands to `queryParams: 'exact'` internally
 * — meaning `/?page=2` stops matching `/`. The listing page deep-links pages
 * via `?page=N`, so we explicitly opt query params (and matrix/fragment) out
 * of the match while still pinning the path to root.
 */
const LIST_LINK_MATCH_OPTIONS: IsActiveMatchOptions = {
  paths: 'exact',
  queryParams: 'ignored',
  matrixParams: 'ignored',
  fragment: 'ignored',
};

/**
 * Brutalist app header.
 *
 * Layout: logo (left) | nav (Listagem/Busca) | theme + language (right).
 * The whole bar sits inside a brutal-surface bottom border so it sticks
 * to the page like a banner rather than floating.
 *
 * Nav items use routerLinkActive to flip into the primary variant when
 * their route is active, which doubles as a visible focus target.
 */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LanguageSwitcher, RouterLink, RouterLinkActive, ThemeToggle, TranslocoPipe],
  template: `
    <header class="brutal-stripes border-ink border-b-[var(--border-brutal-width)]">
      <div
        class="bg-bg/95 supports-[backdrop-filter]:bg-bg/80 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3 backdrop-blur"
      >
        <a
          routerLink="/"
          class="font-display text-ink text-2xl font-bold tracking-tight no-underline"
        >
          {{ 'app.title' | transloco }}
        </a>

        <nav [attr.aria-label]="'app.title' | transloco" class="flex items-center gap-2">
          <a
            routerLink="/"
            routerLinkActive="brutal-surface bg-primary text-ink"
            [routerLinkActiveOptions]="listLinkMatchOptions"
            class="font-display rounded-md px-3 py-1.5 text-sm font-bold no-underline"
          >
            {{ 'nav.list' | transloco }}
          </a>
          <a
            routerLink="/search"
            routerLinkActive="brutal-surface bg-primary text-ink"
            class="font-display rounded-md px-3 py-1.5 text-sm font-bold no-underline"
          >
            {{ 'nav.search' | transloco }}
          </a>
        </nav>

        <div class="flex items-center gap-2">
          <app-theme-toggle />
          <app-language-switcher />
        </div>
      </div>
    </header>
  `,
})
export class AppHeader {
  protected readonly listLinkMatchOptions = LIST_LINK_MATCH_OPTIONS;
}
