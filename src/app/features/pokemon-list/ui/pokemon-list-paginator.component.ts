import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { brutalButtonClasses } from '@shared/ui';
import { buildPageItems, pageItemRange, POKEMON_LIST_PAGE_SIZE } from '../util/page-param';

@Component({
  selector: 'app-pokemon-list-paginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoDirective],
  template: `
    <nav
      *transloco="let t"
      [attr.aria-label]="t('list.paginationLabel')"
      [attr.aria-busy]="disabled() ? 'true' : null"
    >
      <div class="flex flex-col items-center gap-4">
        <ul class="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5" role="list">
          <li class="hidden sm:block">
            <a
              routerLink="./"
              [queryParams]="{ page: 1 }"
              queryParamsHandling="merge"
              [class]="firstIsDisabled() ? navBtnDisabledClass : navBtnClass"
              [attr.aria-label]="t('list.firstPage')"
              [attr.aria-disabled]="firstIsDisabled() ? 'true' : null"
              [attr.tabindex]="firstIsDisabled() ? -1 : null"
              >«</a
            >
          </li>
          <li>
            <a
              routerLink="./"
              [queryParams]="{ page: prevPage() }"
              queryParamsHandling="merge"
              [class]="firstIsDisabled() ? navBtnDisabledClass : navBtnClass"
              [attr.aria-label]="t('list.prev')"
              [attr.aria-disabled]="firstIsDisabled() ? 'true' : null"
              [attr.tabindex]="firstIsDisabled() ? -1 : null"
              >‹</a
            >
          </li>
          @for (item of pageItems(); track $index) {
            <li>
              @if (item === 'ellipsis') {
                <span
                  class="inline-flex min-h-10 min-w-7 items-center justify-center font-mono text-sm select-none sm:min-h-11 sm:min-w-8"
                  aria-hidden="true"
                  >…</span
                >
              } @else {
                <a
                  routerLink="./"
                  [queryParams]="{ page: item }"
                  queryParamsHandling="merge"
                  [class]="
                    item === currentPage()
                      ? disabled()
                        ? activePageDisabledClass
                        : activePageClass
                      : disabled()
                        ? inactivePageDisabledClass
                        : inactivePageClass
                  "
                  [attr.aria-current]="item === currentPage() ? 'page' : null"
                  [attr.aria-label]="
                    item === currentPage()
                      ? t('list.currentPage', { page: item })
                      : t('list.goToPage', { page: item })
                  "
                  [attr.aria-disabled]="disabled() ? 'true' : null"
                  [attr.tabindex]="disabled() ? -1 : null"
                  >{{ item }}</a
                >
              }
            </li>
          }
          <li>
            <a
              routerLink="./"
              [queryParams]="{ page: nextPage() }"
              queryParamsHandling="merge"
              [class]="lastIsDisabled() ? navBtnDisabledClass : navBtnClass"
              [attr.aria-label]="t('list.next')"
              [attr.aria-disabled]="lastIsDisabled() ? 'true' : null"
              [attr.tabindex]="lastIsDisabled() ? -1 : null"
              >›</a
            >
          </li>
          <li class="hidden sm:block">
            <a
              routerLink="./"
              [queryParams]="{ page: totalPages() }"
              queryParamsHandling="merge"
              [class]="lastIsDisabled() ? navBtnDisabledClass : navBtnClass"
              [attr.aria-label]="t('list.lastPage')"
              [attr.aria-disabled]="lastIsDisabled() ? 'true' : null"
              [attr.tabindex]="lastIsDisabled() ? -1 : null"
              >»</a
            >
          </li>
        </ul>
        <p class="font-mono text-sm">
          {{ t('list.range', rangeParams()) }}
        </p>
      </div>
    </nav>
  `,
})
export class PokemonListPaginator {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly pageSize = input<number>(POKEMON_LIST_PAGE_SIZE);
  readonly disabled = input<boolean>(false);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc = inject(DOCUMENT);

  private readonly isSmallScreen = signal(false);

  protected readonly windowSize = computed(() => (this.isSmallScreen() ? 0 : 2));
  protected readonly pageItems = computed(() =>
    buildPageItems(this.currentPage(), this.totalPages(), this.windowSize()),
  );
  protected readonly rangeParams = computed(() => {
    const { from, to } = pageItemRange(this.currentPage(), this.pageSize(), this.totalItems());
    return { from, to, total: this.totalItems() };
  });
  protected readonly hasPrev = computed(() => this.currentPage() > 1);
  protected readonly hasNext = computed(() => this.currentPage() < this.totalPages());
  protected readonly firstIsDisabled = computed(() => this.disabled() || !this.hasPrev());
  protected readonly lastIsDisabled = computed(() => this.disabled() || !this.hasNext());
  protected readonly prevPage = computed(() => Math.max(1, this.currentPage() - 1));
  protected readonly nextPage = computed(() => Math.min(this.totalPages(), this.currentPage() + 1));

  // Precomputed class strings — pure, not signals
  protected readonly activePageClass = brutalButtonClasses(
    'primary',
    'sm',
    'min-w-10 min-h-10 sm:min-w-11 sm:min-h-11',
  );
  protected readonly inactivePageClass = brutalButtonClasses(
    'ghost',
    'sm',
    'min-w-10 min-h-10 sm:min-w-11 sm:min-h-11',
  );
  protected readonly activePageDisabledClass = brutalButtonClasses(
    'primary',
    'sm',
    'min-w-10 min-h-10 sm:min-w-11 sm:min-h-11 pointer-events-none opacity-50',
  );
  protected readonly inactivePageDisabledClass = brutalButtonClasses(
    'ghost',
    'sm',
    'min-w-10 min-h-10 sm:min-w-11 sm:min-h-11 pointer-events-none opacity-50',
  );
  protected readonly navBtnClass = brutalButtonClasses(
    'ghost',
    'sm',
    'min-w-10 min-h-10 sm:min-w-11 sm:min-h-11',
  );
  protected readonly navBtnDisabledClass = brutalButtonClasses(
    'ghost',
    'sm',
    'min-w-10 min-h-10 sm:min-w-11 sm:min-h-11 pointer-events-none opacity-50',
  );

  constructor() {
    const win = isPlatformBrowser(this.platformId) ? this.doc.defaultView : null;
    const mq = win?.matchMedia?.('(max-width: 639px)');
    if (mq) {
      this.isSmallScreen.set(mq.matches);
      mq.addEventListener('change', (e) => this.isSmallScreen.set(e.matches));
    }
  }
}
