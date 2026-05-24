import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { BrutalCard, BrutalSkeleton } from '@shared/ui';

/**
 * Loading placeholder matching the real PokemonListGrid layout so the
 * page doesn't shift when data arrives. role="status" + aria-live="polite"
 * fulfills the listing's "announce loading" a11y requirement without
 * interrupting the user.
 */
@Component({
  selector: 'app-pokemon-list-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BrutalCard, BrutalSkeleton, TranslocoPipe],
  template: `
    <ul
      role="status"
      aria-live="polite"
      [attr.aria-label]="'common.loading' | transloco"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      @for (placeholder of placeholders(); track placeholder) {
        <li>
          <app-brutal-card padding="sm" extraClass="flex h-full flex-col gap-3">
            <app-brutal-skeleton shape="block" width="60px" height="24px" />
            <div class="flex items-center justify-center py-2">
              <app-brutal-skeleton shape="circle" width="96px" />
            </div>
            <app-brutal-skeleton shape="text" width="70%" />
            <div class="flex gap-1.5">
              <app-brutal-skeleton shape="text" width="60px" />
              <app-brutal-skeleton shape="text" width="60px" />
            </div>
          </app-brutal-card>
        </li>
      }
    </ul>
    @if (showPaginatorPlaceholder()) {
      <div
        class="border-ink bg-surface h-14 rounded-[var(--radius-brutal)] border-[var(--border-brutal-width)] opacity-60"
        role="presentation"
        aria-hidden="true"
      ></div>
    }
  `,
})
export class PokemonListSkeleton {
  readonly count = input(20);
  readonly showPaginatorPlaceholder = input(true);

  protected readonly placeholders = computed(() =>
    Array.from({ length: this.count() }, (_, i) => i),
  );
}
