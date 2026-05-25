import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { appErrorOf, appErrorTranslationKey } from '@core/http';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { BrutalButton, BrutalCard } from '@shared/ui';
import { POKEMON_REPOSITORY } from '../data-access';
import { PokemonListGrid } from '../ui/pokemon-list-grid.component';
import { PokemonListSkeleton } from '../ui/pokemon-list.skeleton';
import { PokemonListPaginator } from '../ui/pokemon-list-paginator.component';
import {
  pageItemRange,
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
    PokemonListPaginator,
    PokemonListSkeleton,
    TranslocoDirective,
  ],
  template: `
    <main *transloco="let t" class="mx-auto flex max-w-6xl flex-col gap-8 p-4 sm:p-6">
      <p class="sr-only" role="status">{{ liveAnnouncement() }}</p>
      <header class="flex items-end justify-between gap-4">
        <h1 class="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {{ t('list.title') }}
        </h1>
      </header>

      @if (resource.isLoading()) {
        <app-pokemon-list-skeleton [showPaginatorPlaceholder]="lastKnownTotal() === 0" />
        @if (lastKnownTotal() > 0) {
          <app-pokemon-list-paginator
            [currentPage]="currentPage()"
            [totalPages]="displayTotalPages()"
            [totalItems]="lastKnownTotal()"
            [disabled]="true"
          />
        }
      } @else if (errorKey() !== null) {
        <app-brutal-card role="alert" aria-live="assertive" extraClass="space-y-4">
          <p class="font-display text-lg font-bold">{{ t(errorKey()!) }}</p>
          <app-brutal-button (pressed)="retry()">
            {{ t('common.retry') }}
          </app-brutal-button>
        </app-brutal-card>
        @if (lastKnownTotal() > 0) {
          <app-pokemon-list-paginator
            [currentPage]="currentPage()"
            [totalPages]="displayTotalPages()"
            [totalItems]="lastKnownTotal()"
            [disabled]="true"
          />
        }
      } @else if (isEmpty()) {
        <app-brutal-card role="status" aria-live="polite">
          <p>{{ t('list.empty') }}</p>
        </app-brutal-card>
      } @else {
        <section
          #resultsRegion
          tabindex="-1"
          class="focus:outline-none"
          [attr.aria-label]="t('list.title')"
        >
          <app-pokemon-list-grid [items]="items()" />
        </section>
        <app-pokemon-list-paginator
          [currentPage]="currentPage()"
          [totalPages]="totalPagesCount()"
          [totalItems]="total()"
        />
      }
    </main>
  `,
})
export default class PokemonListPage {
  private readonly repo = inject(POKEMON_REPOSITORY);
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);
  private readonly translocoService = inject(TranslocoService);

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

  protected readonly errorKey = computed(() => {
    const err = appErrorOf(this.resource.error());
    return err ? appErrorTranslationKey(err) : null;
  });

  protected readonly isEmpty = computed(() => {
    if (this.resource.isLoading()) return false;
    if (this.resource.error()) return false;
    return this.total() === 0;
  });

  protected readonly lastKnownTotal = signal(0);
  protected readonly displayTotalPages = computed(() => totalPages(this.lastKnownTotal()));
  protected readonly liveAnnouncement = signal('');

  protected readonly resultsRegion = viewChild<ElementRef<HTMLElement>>('resultsRegion');

  protected readonly pageSize = POKEMON_LIST_PAGE_SIZE;

  private hasNavigated = false;

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

    // Track last successfully loaded total so the paginator can stay visible
    // and meaningful during subsequent loading/error states.
    effect(() => {
      if (this.resource.error()) return;
      const t = this.total();
      if (t > 0) this.lastKnownTotal.set(t);
    });

    // After each successful page navigation (not the first load), scroll the
    // results region into view, move focus there, and announce the new page
    // context to screen readers.
    //
    // Tracks `resultsRegion()` so the effect re-runs when the section enters
    // the DOM (after Angular renders the @else branch) — this avoids the race
    // condition where the effect fired before viewChild was available.
    effect(() => {
      const isLoading = this.resource.isLoading();
      const hasError = !!this.resource.error();
      const page = this.currentPage();
      const el = this.resultsRegion()?.nativeElement;

      if (isLoading || hasError || !this.resource.value() || !el) return;

      if (!this.hasNavigated) {
        this.hasNavigated = true;
        return;
      }

      const win = this.doc.defaultView;
      const reducedMotion = win?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;

      el.focus({ preventScroll: true });
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });

      untracked(() => {
        const total = this.total();
        const totalPagesCount = this.totalPagesCount();
        const range = pageItemRange(page, POKEMON_LIST_PAGE_SIZE, total);
        this.liveAnnouncement.set(
          this.translocoService.translate('list.pageStatus', {
            page,
            totalPages: totalPagesCount,
            from: range.from,
            to: range.to,
            total,
          }),
        );
      });
    });
  }

  protected retry(): void {
    this.resource.reload();
  }
}
