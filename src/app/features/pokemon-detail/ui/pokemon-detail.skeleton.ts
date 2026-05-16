import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { BrutalCard, BrutalSkeleton } from '@shared/ui';

/**
 * Loading placeholder for the detail page. Mirrors the real layout — a
 * hero section with artwork + name + types, a small grid of stats, and
 * stand-ins for the heavier sections so the page doesn't shift when data
 * arrives. role="status" + aria-live announces the loading state to
 * screen readers without interrupting.
 */
@Component({
  selector: 'app-pokemon-detail-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BrutalCard, BrutalSkeleton, TranslocoPipe],
  template: `
    <section
      role="status"
      aria-live="polite"
      [attr.aria-label]="'common.loading' | transloco"
      class="space-y-6"
    >
      <app-brutal-card padding="lg" extraClass="grid gap-6 md:grid-cols-[260px_1fr]">
        <app-brutal-skeleton shape="block" width="240px" height="240px" />
        <div class="flex flex-col gap-3">
          <app-brutal-skeleton shape="text" width="40%" height="32px" />
          <app-brutal-skeleton shape="text" width="60%" />
          <div class="flex gap-2">
            <app-brutal-skeleton shape="block" width="72px" height="28px" />
            <app-brutal-skeleton shape="block" width="72px" height="28px" />
          </div>
        </div>
      </app-brutal-card>

      <app-brutal-card padding="md" extraClass="space-y-2">
        @for (i of statRows; track i) {
          <app-brutal-skeleton shape="block" width="100%" height="24px" />
        }
      </app-brutal-card>
    </section>
  `,
})
export class PokemonDetailSkeleton {
  protected readonly statRows = [0, 1, 2, 3, 4, 5];
}
