import { Location, NgOptimizedImage } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  input,
  type Signal,
  signal,
  viewChild,
  type WritableSignal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { appErrorOf, appErrorTranslationKey } from '@core/http';
import { LanguageService, pickLocalized, TranslationService } from '@core/i18n';
import { FALLBACK_SPRITE, formatHeight, formatPokedexNumber, formatWeight } from '@core/format';
import { NavigationHistoryService } from '@core/navigation';
import { TranslocoDirective } from '@jsverse/transloco';
import { BrutalBadge, BrutalButton, BrutalCard, BrutalSkeleton } from '@shared/ui';
import { POKEMON_DETAIL_REPOSITORY } from '../data-access';
import { PokemonDetailSkeleton } from '../ui/pokemon-detail.skeleton';
import { PokemonEvolutionSection } from '../ui/pokemon-evolution-section.component';
import { PokemonStatsPanel } from '../ui/pokemon-stats-panel.component';

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
    BrutalSkeleton,
    NgOptimizedImage,
    PokemonDetailSkeleton,
    PokemonEvolutionSection,
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
                  @if (genusTranslating()) {
                    <app-brutal-skeleton
                      class="block"
                      shape="text"
                      width="14ch"
                      ariaLabel="Carregando"
                    />
                  } @else if (displayedGenus()) {
                    <p class="text-ink-soft">{{ displayedGenus() }}</p>
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
                              <span class="text-ink-soft ms-1">
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

              @if (displayedFlavorText() || flavorTranslating()) {
                <app-brutal-card padding="md" aria-labelledby="flavor-heading">
                  <h2 id="flavor-heading" class="text-ink-soft text-xs uppercase">
                    {{ t('detail.flavorText') }}
                  </h2>
                  @if (flavorTranslating()) {
                    <div class="mt-1 flex flex-col gap-2" aria-live="polite">
                      <app-brutal-skeleton shape="text" width="100%" ariaLabel="Carregando" />
                      <app-brutal-skeleton shape="text" width="78%" ariaLabel="" />
                    </div>
                  } @else {
                    <p class="mt-1">{{ displayedFlavorText() }}</p>
                  }
                </app-brutal-card>
              }

              <app-brutal-card padding="md">
                <app-pokemon-stats-panel [stats]="d.stats" />
              </app-brutal-card>

              @if (d.species.evolutionChainUrl) {
                <app-pokemon-evolution-section [chainUrl]="d.species.evolutionChainUrl" />
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
  private readonly translator = inject(TranslationService);
  protected readonly lang = inject(LanguageService);

  readonly name = input.required<string>();

  protected readonly resource = rxResource({
    params: () => ({ name: this.name() }),
    stream: ({ params }) => this.repo.getDetail(params.name),
  });

  protected readonly detail = computed(() => {
    // `resource.value()` throws when the loader observable errored. Reading
    // `error()` first makes this computed safe for arbitrary callers (the
    // template gates on the error case separately).
    if (this.resource.error()) return null;
    return this.resource.value() ?? null;
  });

  protected readonly errorKey = computed(() => {
    const err = appErrorOf(this.resource.error());
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
    return pickLocalized(
      d.species.localizedNames,
      this.lang.current(),
      d.species.defaultName || d.name,
    );
  });

  protected readonly localizedGenus = computed(() => {
    const d = this.detail();
    return d ? pickLocalized(d.species.localizedGenera, this.lang.current()) : '';
  });

  protected readonly localizedFlavorText = computed(() => {
    const d = this.detail();
    return d ? pickLocalized(d.species.localizedFlavorTexts, this.lang.current()) : '';
  });

  /**
   * Machine-translated fallbacks (MyMemory) populated on demand when the
   * user is in pt-BR and the PokéAPI payload only has English. Empty
   * string means "no translation yet / not needed".
   */
  protected readonly machineTranslatedFlavor = signal<string>('');
  protected readonly machineTranslatedGenus = signal<string>('');

  /**
   * True while a machine translation is in flight. Synchronous cache hits
   * never flip these to true visibly — the observable emits inside the
   * effect run and Angular batches the set(true)/set(false) pair.
   */
  protected readonly flavorTranslating = signal<boolean>(false);
  protected readonly genusTranslating = signal<boolean>(false);

  /**
   * True when the user wants pt-BR but PokéAPI doesn't have a native
   * pt/pt-br entry for the given map — i.e. the rendered text would
   * otherwise be English even though the app is in Portuguese.
   */
  private needsMachineTranslation(map: ReadonlyMap<string, string>): boolean {
    if (this.lang.current() !== 'pt-BR') return false;
    return !map.has('pt-br') && !map.has('pt');
  }

  /**
   * Shows the machine-translated text when the user is in pt-BR and the
   * payload only has English, otherwise the native localized value.
   * Falls back to native if the machine translation isn't ready yet.
   */
  private displayWithMachineFallback(
    native: string,
    source: ReadonlyMap<string, string> | undefined,
    machineTranslation: Signal<string>,
  ): string {
    if (!native || !source || !this.needsMachineTranslation(source)) return native;
    return machineTranslation() || native;
  }

  protected readonly displayedFlavorText = computed(() =>
    this.displayWithMachineFallback(
      this.localizedFlavorText(),
      this.detail()?.species.localizedFlavorTexts,
      this.machineTranslatedFlavor,
    ),
  );

  protected readonly displayedGenus = computed(() =>
    this.displayWithMachineFallback(
      this.localizedGenus(),
      this.detail()?.species.localizedGenera,
      this.machineTranslatedGenus,
    ),
  );

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

    // Machine-translate flavor + genus on demand when the user picks
    // pt-BR and the PokéAPI payload has no native pt/pt-br entry.
    // Resets the cached translation when the detail changes (new Pokémon)
    // or when the user flips back to English.
    effect(() => {
      const d = this.detail();
      if (!d || this.lang.current() !== 'pt-BR') {
        this.machineTranslatedFlavor.set('');
        this.machineTranslatedGenus.set('');
        this.flavorTranslating.set(false);
        this.genusTranslating.set(false);
        return;
      }
      this.translateField(
        d.species.localizedFlavorTexts,
        this.machineTranslatedFlavor,
        this.flavorTranslating,
      );
      this.translateField(
        d.species.localizedGenera,
        this.machineTranslatedGenus,
        this.genusTranslating,
      );
    });
  }

  /**
   * Machine-translates the English entry of `source` into pt-BR and writes
   * it to `target`, toggling `loading` around the request. Clears both when
   * no machine translation is needed. The observable emits synchronously on
   * a cache hit, so the set(true)/set(false) pair batches inside the effect.
   */
  private translateField(
    source: ReadonlyMap<string, string>,
    target: WritableSignal<string>,
    loading: WritableSignal<boolean>,
  ): void {
    const english = source.get('en');
    if (english && this.needsMachineTranslation(source)) {
      loading.set(true);
      this.translator.translate(english, 'en', 'pt-br').subscribe({
        next: (translated) => {
          target.set(translated);
          loading.set(false);
        },
        error: () => loading.set(false),
      });
    } else {
      target.set('');
      loading.set(false);
    }
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
