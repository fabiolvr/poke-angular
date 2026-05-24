import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { appErrorOf, appErrorTranslationKey } from '@core/http';
import { TranslocoDirective } from '@jsverse/transloco';
import { brutalButtonClasses, BrutalButton, BrutalCard } from '@shared/ui';
import { POKEMON_REPOSITORY } from '../data-access';
import { PokemonListGrid } from '../ui/pokemon-list-grid.component';
import { PokemonListSkeleton } from '../ui/pokemon-list.skeleton';
import {
  pageToOffset,
  parsePageParam,
  POKEMON_LIST_PAGE_SIZE,
  totalPages,
} from '../util/page-param';

/**
 * Smart listing page at `/`.
 *
 * State machine via rxResource:
 *   - `params: () => ({ offset })` reacts to the URL `?page=` query param.
 *     `withComponentInputBinding()` is provided at app root, so the
 *     `page = input<string>('1')` signal here updates whenever the URL
 *     changes — that propagates through `currentPage()` → `offset()` →
 *     resource.
 *   - `stream` returns `repo.listCards(offset, 20)`. The cacheInterceptor
 *     dedupes repeat visits; the errorInterceptor normalises failures
 *     into AppError, which surfaces as `resource.error()`.
 *
 * Fan-out partial failure: `forkJoin` inside `listCards` fails-fast if any
 * detail request errors. The retry button reloads the resource; the 19
 * already-successful detail responses are cache hits, so only the failed
 * one re-hits the network.
 *
 * Out-of-range `?page=` (e.g. `?page=99999`) is detected post-fetch and
 * clamped to the last real page via `router.navigate(replaceUrl: true)`
 * so the broken deep link does not pollute history.
 */
@Component({
  selector: 'app-pokemon-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BrutalButton,
    BrutalCard,
    PokemonListGrid,
    PokemonListSkeleton,
    RouterLink,
    TranslocoDirective,
  ],
  template: `
    <main *transloco="let t" class="mx-auto flex max-w-6xl flex-col gap-8 p-4 sm:p-6">
      <header class="flex items-end justify-between gap-4">
        <h1 class="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {{ t('list.title') }}
        </h1>
      </header>

      @switch (true) {
        @case (resource.isLoading()) {
          <app-pokemon-list-skeleton />
        }
        @case (errorKey() !== null) {
          <app-brutal-card role="alert" aria-live="assertive" extraClass="space-y-4">
            <p class="font-display text-lg font-bold">{{ t(errorKey()!) }}</p>
            <app-brutal-button (pressed)="retry()">
              {{ t('common.retry') }}
            </app-brutal-button>
          </app-brutal-card>
        }
        @case (isEmpty()) {
          <app-brutal-card role="status" aria-live="polite">
            <p>{{ t('list.empty') }}</p>
          </app-brutal-card>
        }
        @default {
          <app-pokemon-list-grid [items]="items()" />
          <nav
            [attr.aria-label]="t('list.paginationLabel')"
            class="flex flex-col items-center justify-between gap-3 sm:flex-row"
          >
            <a
              [routerLink]="['./']"
              [queryParams]="{ page: prevPage() }"
              queryParamsHandling="merge"
              [class]="prevLinkClasses()"
              [attr.aria-disabled]="!hasPrev() ? 'true' : null"
              [attr.tabindex]="!hasPrev() ? -1 : null"
            >
              {{ t('list.prev') }}
            </a>
            <span aria-live="polite" class="font-mono text-sm">
              {{ t('list.pageOf', { page: currentPage(), total: totalPagesCount() }) }}
            </span>
            <a
              [routerLink]="['./']"
              [queryParams]="{ page: nextPage() }"
              queryParamsHandling="merge"
              [class]="nextLinkClasses()"
              [attr.aria-disabled]="!hasNext() ? 'true' : null"
              [attr.tabindex]="!hasNext() ? -1 : null"
            >
              {{ t('list.next') }}
            </a>
          </nav>
        }
      }
    </main>
  `,
})
export default class PokemonListPage {
  private readonly repo = inject(POKEMON_REPOSITORY);
  private readonly router = inject(Router);

  readonly page = input<string>('1');

  protected readonly currentPage = computed(() => parsePageParam(this.page()));
  protected readonly offset = computed(() => pageToOffset(this.currentPage()));

  protected readonly resource = rxResource({
    params: () => ({ offset: this.offset() }),
    stream: ({ params }) => this.repo.listCards(params.offset, POKEMON_LIST_PAGE_SIZE),
  });

  protected readonly items = computed(() => this.resource.value()?.items ?? []);
  protected readonly total = computed(() => this.resource.value()?.total ?? 0);
  protected readonly totalPagesCount = computed(() => totalPages(this.total()));

  protected readonly hasNext = computed(() => this.resource.value()?.hasNext ?? false);
  protected readonly hasPrev = computed(() => this.currentPage() > 1);

  protected readonly prevPage = computed(() => Math.max(this.currentPage() - 1, 1));
  protected readonly nextPage = computed(() =>
    Math.min(this.currentPage() + 1, this.totalPagesCount()),
  );

  protected readonly errorKey = computed(() => {
    const err = appErrorOf(this.resource.error());
    return err ? appErrorTranslationKey(err) : null;
  });

  protected readonly isEmpty = computed(() => {
    if (this.resource.isLoading()) return false;
    if (this.resource.error()) return false;
    return this.total() === 0;
  });

  protected readonly prevLinkClasses = computed(() =>
    brutalButtonClasses('ghost', 'md', this.hasPrev() ? '' : 'pointer-events-none opacity-50'),
  );

  protected readonly nextLinkClasses = computed(() =>
    brutalButtonClasses('primary', 'md', this.hasNext() ? '' : 'pointer-events-none opacity-50'),
  );

  constructor() {
    // Clamp out-of-range deep links (e.g. /?page=99999 when total < that
    // page). Runs after a successful response: if total > 0 but the page
    // came back empty AND we're not on page 1, redirect to the last real
    // page with replaceUrl so history stays clean.
    effect(() => {
      if (this.resource.isLoading() || this.resource.error()) return;
      const value = this.resource.value();
      if (!value) return;
      if (value.total > 0 && value.items.length === 0 && this.currentPage() > 1) {
        const last = totalPages(value.total);
        void this.router.navigate(['./'], {
          queryParams: { page: last },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });
  }

  protected retry(): void {
    this.resource.reload();
  }
}
