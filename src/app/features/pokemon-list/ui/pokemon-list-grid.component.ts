import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { PokemonSummary } from '@core/domain';
import { PokemonCard } from './pokemon-card.component';

/**
 * Dumb responsive grid of PokemonCards. No state — receives the slice
 * already paginated by the smart page and decides only which cards get
 * NgOptimizedImage `priority` (the first 4, which sit above the fold on
 * the `lg` breakpoint where the grid is 4-up).
 *
 * Empty / loading / error states are owned by the smart page; this
 * component never renders without items.
 */
@Component({
  selector: 'app-pokemon-list-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PokemonCard],
  template: `
    <ul class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      @for (pokemon of items(); track pokemon.id; let index = $index) {
        <li>
          <app-pokemon-card [pokemon]="pokemon" [priorityImage]="index < 4" />
        </li>
      }
    </ul>
  `,
})
export class PokemonListGrid {
  readonly items = input.required<readonly PokemonSummary[]>();
}
