import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { BrutalCard } from '@shared/ui';
import { PokemonEvolutionChain } from './pokemon-evolution-chain.component';

/**
 * Wrapper around the evolution chain that owns the `@defer (on
 * viewport)` block. Extracted out of the smart page so the smart page's
 * template contains no `@defer` directly — Angular 21's TestBed
 * currently fails with "unresolved metadata" when `createComponent` is
 * called on a component whose template embeds `@defer` (the deferred
 * deps don't get re-resolved after `compileComponents()`).
 *
 * Keeping the `@defer` here lets the smart page's spec exercise the
 * full template, while this wrapper stays small enough that its own
 * spec coverage is provided indirectly via the existing
 * `pokemon-evolution-chain.component.spec`.
 */
@Component({
  selector: 'app-pokemon-evolution-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BrutalCard, PokemonEvolutionChain, TranslocoPipe],
  template: `
    @defer (on viewport) {
      <app-brutal-card padding="md">
        <app-pokemon-evolution-chain [chainUrl]="chainUrl()" />
      </app-brutal-card>
    } @placeholder {
      <app-brutal-card padding="md">
        <h2 class="font-display text-xl font-bold">
          {{ 'detail.evolutionChain' | transloco }}
        </h2>
      </app-brutal-card>
    } @loading (minimum 100ms) {
      <app-brutal-card padding="md">
        <h2 class="font-display text-xl font-bold">
          {{ 'detail.evolutionChain' | transloco }}
        </h2>
      </app-brutal-card>
    }
  `,
})
export class PokemonEvolutionSection {
  readonly chainUrl = input.required<string>();
}
