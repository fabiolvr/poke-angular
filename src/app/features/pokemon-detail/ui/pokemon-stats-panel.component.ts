import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { POKEMON_STAT_NAMES, type PokemonStat, type PokemonStatName } from '@core/domain';
import { TranslocoPipe } from '@jsverse/transloco';
import { PokemonStatBar } from './pokemon-stat-bar.component';

/**
 * Renders the six canonical stat bars in canonical order, plus the
 * familiar "Total" row underneath. Missing stats render as zero rather
 * than being omitted, so the layout stays stable across pokémon.
 */
@Component({
  selector: 'app-pokemon-stats-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PokemonStatBar, TranslocoPipe],
  template: `
    <section aria-labelledby="stats-heading" class="space-y-3">
      <h2 id="stats-heading" class="font-display text-xl font-bold">
        {{ 'detail.stats' | transloco }}
      </h2>
      <div class="flex flex-col gap-2">
        @for (stat of orderedStats; track stat.name) {
          <app-pokemon-stat-bar [stat]="stat.name" [value]="stat.base" />
        }
        <div class="grid grid-cols-[7rem_auto_3rem] items-center gap-3 pt-2">
          <span class="font-display text-sm font-bold uppercase">
            {{ 'detail.statTotal' | transloco }}
          </span>
          <span></span>
          <span class="text-right font-mono text-sm font-bold">{{ total() }}</span>
        </div>
      </div>
    </section>
  `,
})
export class PokemonStatsPanel {
  readonly stats = input.required<readonly PokemonStat[]>();

  protected get orderedStats(): readonly { name: PokemonStatName; base: number }[] {
    const lookup = new Map<PokemonStatName, number>();
    for (const stat of this.stats()) lookup.set(stat.name, stat.base);
    return POKEMON_STAT_NAMES.map((name) => ({ name, base: lookup.get(name) ?? 0 }));
  }

  protected readonly total = computed(() => this.stats().reduce((sum, stat) => sum + stat.base, 0));
}
