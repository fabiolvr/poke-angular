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
 * Desktop (≥ sm): single row — logo | nav (Listagem/Busca) | theme + language.
 * Mobile (< sm):  two rows — logo + theme/language on row 1; nav centered on row 2.
 * The 3-col grid reflows via col-start/row-start so DOM order (and therefore
 * tab order: logo → nav → controls) stays stable across breakpoints, and the
 * theme/language children are instanced once instead of duplicated.
 *
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
        class="bg-bg/95 supports-[backdrop-filter]:bg-bg/80 mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-6 px-4 py-2.5 backdrop-blur sm:gap-y-2 sm:px-6 sm:py-3"
      >
        <a
          routerLink="/"
          class="font-display text-ink col-start-1 row-start-1 inline-flex items-center gap-2 text-xl font-bold tracking-tight no-underline sm:text-2xl"
        >
          <img src="poke_ball_icon.svg" alt="" width="32" height="32" class="size-7 sm:size-8" />
          {{ 'app.title' | transloco }}
        </a>

        <nav
          [attr.aria-label]="'app.title' | transloco"
          class="col-span-3 col-start-1 row-start-2 flex items-center justify-center gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1"
        >
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

        <div class="col-start-3 row-start-1 flex items-center justify-end gap-2">
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
