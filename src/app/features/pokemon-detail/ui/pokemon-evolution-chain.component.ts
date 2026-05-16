import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { flattenEvolutionChain, type EvolutionNode } from '@core/domain';
import { appErrorTranslationKey, type AppError } from '@core/http';
import { TranslocoPipe } from '@jsverse/transloco';
import { BrutalCard, BrutalSkeleton } from '@shared/ui';
import { POKEMON_DETAIL_REPOSITORY } from '../data-access';

/**
 * Self-contained evolution chain. Owns its own rxResource so the parent
 * detail page can drop it behind `@defer (on viewport)` without
 * coordinating fetches. Renders the chain flattened depth-first — Eevee
 * shows as eevee → vaporeon, jolteon, flareon, etc. all at the same
 * level. Each node links back into /pokemon/{name}.
 */
@Component({
  selector: 'app-pokemon-evolution-chain',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BrutalCard, BrutalSkeleton, RouterLink, TranslocoPipe],
  template: `
    <section aria-labelledby="evolution-heading" class="space-y-3">
      <h2 id="evolution-heading" class="font-display text-xl font-bold">
        {{ 'detail.evolutionChain' | transloco }}
      </h2>

      @if (resource.isLoading()) {
        <div class="flex flex-wrap items-center gap-3" aria-busy="true">
          <app-brutal-skeleton shape="block" width="120px" height="64px" />
          <app-brutal-skeleton shape="block" width="120px" height="64px" />
          <app-brutal-skeleton shape="block" width="120px" height="64px" />
        </div>
      } @else if (errorKey() !== null) {
        <app-brutal-card role="alert" aria-live="polite" padding="sm">
          <p>{{ errorKey()! | transloco }}</p>
        </app-brutal-card>
      } @else if (nodes().length <= 1) {
        <app-brutal-card padding="sm">
          <p>{{ 'detail.evolutionChainEmpty' | transloco }}</p>
        </app-brutal-card>
      } @else {
        <ol class="flex flex-wrap items-center gap-3">
          @for (node of nodes(); track node.speciesId; let last = $last) {
            <li class="flex items-center gap-3">
              <a
                [routerLink]="['/pokemon', node.speciesName]"
                class="brutal-surface brutal-interactive brutal-focusable inline-flex flex-col items-center gap-1 px-4 py-2"
              >
                <span class="font-mono text-xs">#{{ padded(node.speciesId) }}</span>
                <span class="font-display text-sm font-bold capitalize">{{
                  node.speciesName
                }}</span>
              </a>
              @if (!last) {
                <span aria-hidden="true" class="font-display text-xl font-bold">→</span>
              }
            </li>
          }
        </ol>
      }
    </section>
  `,
})
export class PokemonEvolutionChain {
  readonly chainUrl = input.required<string>();

  private readonly repo = inject(POKEMON_DETAIL_REPOSITORY);

  protected readonly resource = rxResource({
    params: () => ({ url: this.chainUrl() }),
    stream: ({ params }) => this.repo.getEvolutionChain(params.url),
  });

  protected readonly nodes = computed<readonly EvolutionNode[]>(() => {
    const chain = this.resource.value();
    return chain ? flattenEvolutionChain(chain) : [];
  });

  protected readonly errorKey = computed(() => {
    const err = this.resource.error() as AppError | undefined;
    return err ? appErrorTranslationKey(err) : null;
  });

  protected padded(id: number): string {
    return id.toString().padStart(4, '0');
  }
}
