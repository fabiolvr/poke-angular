import { Location, NgOptimizedImage } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { appErrorTranslationKey, type AppError } from '@core/http';
import { LanguageService } from '@core/i18n';
import { formatHeight, formatPokedexNumber, formatWeight } from '@core/format';
import { NavigationHistoryService } from '@core/navigation';
import { TranslocoDirective } from '@jsverse/transloco';
import { BrutalBadge, BrutalButton, BrutalCard } from '@shared/ui';
import { POKEMON_DETAIL_REPOSITORY } from '../data-access';
import { PokemonDetailSkeleton } from '../ui/pokemon-detail.skeleton';
import { PokemonEvolutionChain } from '../ui/pokemon-evolution-chain.component';
import { PokemonStatsPanel } from '../ui/pokemon-stats-panel.component';

const FALLBACK_SPRITE = '/img/missing-sprite.svg';

const LANG_LOOKUP_FALLBACKS: Record<string, readonly string[]> = {
  'pt-BR': ['pt-br', 'pt-BR', 'pt', 'en'],
  en: ['en'],
};

/**
 * Smart page at `/pokemon/:name`.
 *
 * - `name = input.required<string>()` is bound from the route param via
 *   `withComponentInputBinding()`; the rxResource reacts to it.
 * - Repository loads pokemon + species in one observable; the
 *   cacheInterceptor makes back-and-forth navigation cheap.
 * - `shiny` is a local signal — toggle resets per visit, no persistence.
 * - Evolution chain renders behind `@defer (on viewport)` so the
 *   secondary GET only fires when the user scrolls down to it.
 * - On mount we focus the H1 (`tabindex=-1`) so keyboard / screen-reader
 *   users land at the heading rather than at the back button.
 * - Back button consults NavigationHistoryService: if the user came from
 *   within the SPA, `Location.back()`; if they deep-linked here, route
 *   to `/`.
 */
@Component({
  selector: 'app-pokemon-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BrutalBadge,
    BrutalButton,
    BrutalCard,
    NgOptimizedImage,
    PokemonDetailSkeleton,
    PokemonEvolutionChain,
    PokemonStatsPanel,
    TranslocoDirective,
  ],
  template: `
    <main *transloco="let t" class="mx-auto flex max-w-4xl flex-col gap-8 p-6">
      <app-brutal-button variant="ghost" size="sm" (pressed)="back()">
        ← {{ t('detail.back') }}
      </app-brutal-button>

      @switch (true) {
        @case (resource.isLoading()) {
          <app-pokemon-detail-skeleton />
        }
        @case (errorKey() !== null) {
          <app-brutal-card role="alert" aria-live="assertive" extraClass="space-y-3">
            <p class="font-display font-bold">{{ t(errorKey()!) }}</p>
            <app-brutal-button (pressed)="retry()">
              {{ t('common.retry') }}
            </app-brutal-button>
          </app-brutal-card>
        }
        @default {
          @if (detail(); as d) {
            <article class="flex flex-col gap-6">
              <app-brutal-card padding="lg" extraClass="grid gap-6 md:grid-cols-[260px_1fr]">
                <div class="flex flex-col items-center gap-3">
                  <img
                    [ngSrc]="spriteSrc()"
                    [alt]="localizedName()"
                    width="240"
                    height="240"
                    priority
                    class="size-60"
                  />
                  @if (d.sprites.shiny) {
                    <app-brutal-button variant="secondary" size="sm" (pressed)="toggleShiny()">
                      {{ shiny() ? t('detail.normalToggle') : t('detail.shinyToggle') }}
                    </app-brutal-button>
                  }
                </div>

                <div class="space-y-3">
                  <div class="flex items-center gap-3">
                    <app-brutal-badge variant="primary">
                      <span class="font-mono">{{ dexNumber() }}</span>
                    </app-brutal-badge>
                    @if (d.species.isLegendary || d.species.isMythical) {
                      <app-brutal-badge variant="accent" size="sm">
                        {{ d.species.isMythical ? 'mythical' : 'legendary' }}
                      </app-brutal-badge>
                    }
                  </div>
                  <h1
                    #titleEl
                    tabindex="-1"
                    class="font-display text-4xl font-bold capitalize focus:outline-none"
                  >
                    {{ localizedName() }}
                  </h1>
                  @if (d.species.genus) {
                    <p class="text-ink-soft">{{ d.species.genus }}</p>
                  }
                  <div class="flex flex-wrap gap-2" [attr.aria-label]="t('detail.types')">
                    @for (type of d.types; track type) {
                      <app-brutal-badge variant="pokemon-type" [pokemonType]="type">
                        {{ type }}
                      </app-brutal-badge>
                    }
                  </div>
                  <dl class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt class="text-ink-soft uppercase">{{ t('detail.height') }}</dt>
                      <dd class="font-mono font-bold">{{ formattedHeight() }}</dd>
                    </div>
                    <div>
                      <dt class="text-ink-soft uppercase">{{ t('detail.weight') }}</dt>
                      <dd class="font-mono font-bold">{{ formattedWeight() }}</dd>
                    </div>
                  </dl>
                  <section aria-labelledby="abilities-heading">
                    <h2 id="abilities-heading" class="text-ink-soft text-xs uppercase">
                      {{ t('detail.abilities') }}
                    </h2>
                    <ul class="flex flex-wrap gap-2 pt-1">
                      @for (ability of d.abilities; track ability.name) {
                        <li>
                          <app-brutal-badge size="sm" variant="neutral">
                            <span class="capitalize">{{ ability.name }}</span>
                            @if (ability.isHidden) {
                              <span class="text-ink-mute ms-1">
                                {{ t('detail.hiddenAbility') }}
                              </span>
                            }
                          </app-brutal-badge>
                        </li>
                      }
                    </ul>
                  </section>
                </div>
              </app-brutal-card>

              @if (d.species.flavorText) {
                <app-brutal-card padding="md" aria-labelledby="flavor-heading">
                  <h2 id="flavor-heading" class="text-ink-soft text-xs uppercase">
                    {{ t('detail.flavorText') }}
                  </h2>
                  <p class="mt-1">{{ d.species.flavorText }}</p>
                </app-brutal-card>
              }

              <app-brutal-card padding="md">
                <app-pokemon-stats-panel [stats]="d.stats" />
              </app-brutal-card>

              @if (d.species.evolutionChainUrl) {
                @defer (on viewport) {
                  <app-brutal-card padding="md">
                    <app-pokemon-evolution-chain [chainUrl]="d.species.evolutionChainUrl" />
                  </app-brutal-card>
                } @placeholder {
                  <app-brutal-card padding="md">
                    <h2 class="font-display text-xl font-bold">
                      {{ t('detail.evolutionChain') }}
                    </h2>
                  </app-brutal-card>
                } @loading (minimum 100ms) {
                  <app-brutal-card padding="md">
                    <h2 class="font-display text-xl font-bold">
                      {{ t('detail.evolutionChain') }}
                    </h2>
                  </app-brutal-card>
                }
              }
            </article>
          }
        }
      }
    </main>
  `,
})
export default class PokemonDetailPage {
  private readonly repo = inject(POKEMON_DETAIL_REPOSITORY);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly history = inject(NavigationHistoryService);
  protected readonly lang = inject(LanguageService);

  readonly name = input.required<string>();

  protected readonly resource = rxResource({
    params: () => ({ name: this.name() }),
    stream: ({ params }) => this.repo.getDetail(params.name),
  });

  protected readonly detail = computed(() => this.resource.value() ?? null);

  protected readonly errorKey = computed(() => {
    const err = this.resource.error() as AppError | undefined;
    return err ? appErrorTranslationKey(err) : null;
  });

  protected readonly shiny = signal(false);

  protected readonly dexNumber = computed(() => {
    const d = this.detail();
    return d ? formatPokedexNumber(d.id) : '';
  });

  protected readonly localizedName = computed(() => {
    const d = this.detail();
    if (!d) return '';
    const langCodes = LANG_LOOKUP_FALLBACKS[this.lang.current()] ?? ['en'];
    for (const code of langCodes) {
      const candidate = d.species.localizedNames.get(code);
      if (candidate) return candidate;
    }
    return d.species.defaultName || d.name;
  });

  protected readonly spriteSrc = computed(() => {
    const d = this.detail();
    if (!d) return FALLBACK_SPRITE;
    const url = this.shiny() ? d.sprites.shiny : d.sprites.artwork;
    return url ?? d.sprites.thumbnail ?? FALLBACK_SPRITE;
  });

  protected readonly formattedHeight = computed(() => {
    const d = this.detail();
    return d ? formatHeight(d.heightDecimetres, this.lang.current()) : '';
  });

  protected readonly formattedWeight = computed(() => {
    const d = this.detail();
    return d ? formatWeight(d.weightHectograms, this.lang.current()) : '';
  });

  private readonly titleEl = viewChild<ElementRef<HTMLElement>>('titleEl');

  constructor() {
    afterNextRender(() => {
      this.titleEl()?.nativeElement.focus();
    });
  }

  protected toggleShiny(): void {
    this.shiny.update((s) => !s);
  }

  protected retry(): void {
    this.resource.reload();
  }

  protected back(): void {
    if (this.history.hasInternalHistory()) {
      this.location.back();
    } else {
      void this.router.navigate(['/']);
    }
  }
}
