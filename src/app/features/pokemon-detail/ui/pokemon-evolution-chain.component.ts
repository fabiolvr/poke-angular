import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { flattenEvolutionChain, type EvolutionNode } from '@core/domain';
import { appErrorTranslationKey, type AppError } from '@core/http';
import { TranslocoPipe } from '@jsverse/transloco';
import { BrutalCard, BrutalSkeleton } from '@shared/ui';
import { POKEMON_DETAIL_REPOSITORY } from '../data-access';

const FALLBACK_SPRITE = '/img/missing-sprite.svg';

/**
 * Self-contained evolution chain. Owns its own rxResource so the parent
 * detail page can drop it behind `@defer (on viewport)` without
 * coordinating fetches. Renders the chain flattened depth-first — Eevee
 * shows as eevee → vaporeon, jolteon, flareon, etc. all at the same
 * level. Each node links back into /pokemon/{name}.
 *
 * Sprites are addressed directly via the PokeAPI/sprites GitHub mirror
 * rather than fetched as part of the chain payload — evolution chains
 * only reference species ids (1-1025, all canonical), and the
 * official-artwork path is reliably populated for that range, so we
 * get thumbnails for free without N extra repository calls. Using the
 * official artwork (rather than the lower-res HOME render) keeps the
 * chain visually consistent with the detail page hero.
 *
 * Trade-off: each artwork PNG is ~100–200 kB at full resolution. Even
 * displayed at 80 px, the browser still downloads the full file. For
 * branched chains (Eevee, 8 nodes) the chain costs ~1 MB once;
 * subsequent navigation is cached by the browser.
 */
@Component({
  selector: 'app-pokemon-evolution-chain',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BrutalCard, BrutalSkeleton, NgOptimizedImage, RouterLink, TranslocoPipe],
  template: `
    <section aria-labelledby="evolution-heading" class="space-y-3">
      <h2 id="evolution-heading" class="font-display text-xl font-bold">
        {{ 'detail.evolutionChain' | transloco }}
      </h2>

      @if (resource.isLoading()) {
        <div class="flex flex-wrap items-center gap-3" aria-busy="true">
          <app-brutal-skeleton shape="block" width="140px" height="160px" />
          <app-brutal-skeleton shape="block" width="140px" height="160px" />
          <app-brutal-skeleton shape="block" width="140px" height="160px" />
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
                class="brutal-surface brutal-interactive brutal-focusable inline-flex flex-col items-center gap-1 px-3 py-2 no-underline"
              >
                <span class="font-mono text-xs">#{{ padded(node.speciesId) }}</span>
                <img
                  [ngSrc]="spriteUrl(node.speciesId)"
                  [alt]="node.speciesName"
                  width="80"
                  height="80"
                  class="size-20"
                />
                <span class="font-display text-sm font-bold capitalize">
                  {{ node.speciesName }}
                </span>
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

  protected spriteUrl(id: number): string {
    if (!Number.isFinite(id) || id <= 0) return FALLBACK_SPRITE;
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }
}
