import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { PokemonStatName } from '@core/domain';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * Single horizontal stat bar. PokéAPI ships `base_stat` values in [0, 255]
 * (the in-game cap before EVs/IVs). We render the bar width as a
 * percentage of that cap; the global `prefers-reduced-motion` rule in
 * tokens.css clamps the transition for users who opt out.
 */
@Component({
  selector: 'app-pokemon-stat-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  styles: [
    `
      .bar-fill {
        transition: width 180ms cubic-bezier(0.2, 0, 0.2, 1);
      }
    `,
  ],
  template: `
    <div class="grid grid-cols-[7rem_auto_3rem] items-center gap-3">
      <span class="font-display text-sm font-bold">
        {{ 'detail.stat.' + stat() | transloco }}
      </span>
      <div
        class="brutal-surface relative h-6 overflow-hidden p-0"
        role="meter"
        aria-valuemin="0"
        aria-valuemax="255"
        [attr.aria-valuenow]="value()"
        [attr.aria-label]="'detail.stat.' + stat() | transloco"
      >
        <!-- eslint-disable-next-line @angular-eslint/template/no-inline-styles -->
        <div
          class="bar-fill h-full"
          [style.width.%]="percent()"
          [style.background-color]="color()"
        ></div>
      </div>
      <span class="text-right font-mono text-sm font-bold">{{ value() }}</span>
    </div>
  `,
})
export class PokemonStatBar {
  readonly stat = input.required<PokemonStatName>();
  readonly value = input.required<number>();

  protected readonly percent = computed(() => Math.min(100, (this.value() / 255) * 100));

  /**
   * Colour the bar by health-bar buckets: red for low stats, yellow for
   * mid, green for high — same convention used by the games themselves.
   */
  protected readonly color = computed(() => {
    const pct = this.percent();
    if (pct < 30) return 'var(--color-accent)';
    if (pct < 60) return 'var(--color-warning)';
    return 'var(--color-success)';
  });
}
