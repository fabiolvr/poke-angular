import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { PokemonSummary } from '@core/domain';
import { formatPokedexNumber } from '@core/format';
import { TranslocoPipe } from '@jsverse/transloco';
import { BrutalBadge, BrutalCard } from '@shared/ui';

const FALLBACK_SPRITE = 'img/missing-sprite.svg';

/**
 * Card-sized presentation of a Pokémon. Stateless — receives a
 * `PokemonSummary` and renders the artwork, dex number, name, and type
 * badges. The whole card is an anchor that routes to /pokemon/{name}; the
 * inner BrutalCard provides the brutalist visual.
 */
@Component({
  selector: 'app-pokemon-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BrutalBadge, BrutalCard, NgOptimizedImage, RouterLink, TranslocoPipe],
  template: `
    <a
      [routerLink]="['/pokemon', pokemon().name]"
      [attr.aria-label]="
        'list.cardAriaLabel' | transloco: { name: pokemon().name, number: dexNumber() }
      "
      class="block focus:outline-none"
    >
      <app-brutal-card interactive padding="sm" extraClass="flex h-full flex-col gap-3">
        <div class="flex items-center justify-between gap-2">
          <app-brutal-badge variant="primary" size="sm">
            <span class="font-mono">{{ dexNumber() }}</span>
          </app-brutal-badge>
        </div>

        <div class="flex items-center justify-center py-2">
          <img
            [ngSrc]="spriteSrc()"
            [alt]="pokemon().name"
            width="96"
            height="96"
            [priority]="priorityImage()"
            class="size-24"
          />
        </div>

        <h3 class="font-display text-lg font-bold capitalize">
          {{ pokemon().name }}
        </h3>

        <div class="flex flex-wrap gap-1.5">
          @for (type of pokemon().types; track type) {
            <app-brutal-badge variant="pokemon-type" [pokemonType]="type" size="sm">
              {{ type }}
            </app-brutal-badge>
          }
        </div>
      </app-brutal-card>
    </a>
  `,
})
export class PokemonCard {
  readonly pokemon = input.required<PokemonSummary>();
  readonly priorityImage = input(false);

  protected readonly dexNumber = computed(() => formatPokedexNumber(this.pokemon().id));
  protected readonly spriteSrc = computed(
    () => this.pokemon().sprites.thumbnail ?? FALLBACK_SPRITE,
  );
}
