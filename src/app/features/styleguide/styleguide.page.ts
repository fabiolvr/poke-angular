import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LanguageService } from '@core/i18n';
import { formatHeight, formatPokedexNumber, formatWeight } from '@core/format';
import { POKEMON_TYPES, ThemeService, type ThemePreference } from '@core/theme';
import { TranslocoDirective } from '@jsverse/transloco';
import { LanguageSwitcher } from '@layout/index';
import { BrutalBadge, BrutalButton, BrutalCard, BrutalInput, BrutalSkeleton } from '@shared/ui';

/**
 * Internal kitchen-sink page. Lives in features/ so it follows the same
 * conventions as real features and can be deleted as a unit. The route is
 * dev-gated in app.routes.ts (isDevMode), so production builds never expose it.
 */
@Component({
  selector: 'app-styleguide-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BrutalBadge,
    BrutalButton,
    BrutalCard,
    BrutalInput,
    BrutalSkeleton,
    LanguageSwitcher,
    TranslocoDirective,
  ],
  template: `
    <main *transloco="let t" class="mx-auto max-w-5xl space-y-12 p-8">
      <header class="space-y-2">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="font-display text-4xl font-bold tracking-tight">
              {{ t('app.title') }} — Styleguide
            </h1>
            <p class="text-ink-soft max-w-2xl">
              Kitchen-sink for the design-system primitives. This page is only available in
              development.
            </p>
          </div>
          <app-language-switcher />
        </div>
      </header>

      <section aria-labelledby="theme-section" class="space-y-3">
        <h2 id="theme-section" class="font-display text-2xl font-bold">{{ t('theme.label') }}</h2>
        <p class="text-ink-soft">
          Current: <strong>{{ t('theme.' + theme.resolved()) }}</strong>
        </p>
        <div class="flex flex-wrap gap-3">
          @for (option of themeOptions; track option.value) {
            <app-brutal-button
              [variant]="theme.preference() === option.value ? 'primary' : 'ghost'"
              size="sm"
              (pressed)="theme.setPreference(option.value)"
            >
              {{ t('theme.' + option.value) }}
            </app-brutal-button>
          }
        </div>
      </section>

      <section aria-labelledby="i18n-section" class="space-y-3">
        <h2 id="i18n-section" class="font-display text-2xl font-bold">i18n + formatters</h2>
        <p class="text-ink-soft">
          Active lang: <strong>{{ lang.current() }}</strong>
        </p>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <app-brutal-card padding="sm">
            <p class="text-ink-soft text-xs uppercase">Pokédex number</p>
            <p class="font-mono text-2xl font-bold">{{ samplePokedex() }}</p>
          </app-brutal-card>
          <app-brutal-card padding="sm">
            <p class="text-ink-soft text-xs uppercase">Height (4 dm)</p>
            <p class="font-mono text-2xl font-bold">{{ sampleHeight() }}</p>
          </app-brutal-card>
          <app-brutal-card padding="sm">
            <p class="text-ink-soft text-xs uppercase">Weight (60 hg)</p>
            <p class="font-mono text-2xl font-bold">{{ sampleWeight() }}</p>
          </app-brutal-card>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <app-brutal-card padding="sm">
            <p class="text-ink-soft text-xs uppercase">errors.network</p>
            <p>{{ t('errors.network') }}</p>
          </app-brutal-card>
          <app-brutal-card padding="sm">
            <p class="text-ink-soft text-xs uppercase">errors.rateLimit</p>
            <p>{{ t('errors.rateLimit') }}</p>
          </app-brutal-card>
        </div>
      </section>

      <section aria-labelledby="buttons-section" class="space-y-4">
        <h2 id="buttons-section" class="font-display text-2xl font-bold">Buttons</h2>
        <div class="flex flex-wrap items-center gap-4">
          <app-brutal-button variant="primary">Primary</app-brutal-button>
          <app-brutal-button variant="secondary">Secondary</app-brutal-button>
          <app-brutal-button variant="danger">Danger</app-brutal-button>
          <app-brutal-button variant="ghost">Ghost</app-brutal-button>
          <app-brutal-button disabled>Disabled</app-brutal-button>
          <app-brutal-button loading>{{ t('common.loading') }}</app-brutal-button>
        </div>
        <div class="flex flex-wrap items-center gap-4">
          <app-brutal-button size="sm">Small</app-brutal-button>
          <app-brutal-button size="md">Medium</app-brutal-button>
          <app-brutal-button size="lg">Large</app-brutal-button>
        </div>
      </section>

      <section aria-labelledby="cards-section" class="space-y-4">
        <h2 id="cards-section" class="font-display text-2xl font-bold">Cards</h2>
        <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
          <app-brutal-card>
            <h3 class="font-display text-lg font-bold">Static</h3>
            <p class="text-ink-soft mt-2">Plain container with brutal border and shadow.</p>
          </app-brutal-card>
          <app-brutal-card interactive role="button">
            <h3 class="font-display text-lg font-bold">Interactive</h3>
            <p class="text-ink-soft mt-2">Sinks on hover, presses flush on click.</p>
          </app-brutal-card>
          <app-brutal-card padding="sm">
            <h3 class="font-display text-lg font-bold">Tight</h3>
            <p class="text-ink-soft mt-2">Smaller padding for dense lists.</p>
          </app-brutal-card>
        </div>
      </section>

      <section aria-labelledby="inputs-section" class="space-y-4">
        <h2 id="inputs-section" class="font-display text-2xl font-bold">Inputs</h2>
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <app-brutal-input
            [(value)]="search"
            [label]="t('common.search')"
            placeholder="pika"
            hint="Case-insensitive partial match."
          />
          <app-brutal-input
            [(value)]="errorVal"
            label="With error"
            placeholder="Type and blur"
            errorMessage="At least 2 characters required."
            required
          />
        </div>
        @if (search()) {
          <p class="text-ink-soft text-sm">
            Search value: <code>{{ search() }}</code>
          </p>
        }
      </section>

      <section aria-labelledby="badges-section" class="space-y-4">
        <h2 id="badges-section" class="font-display text-2xl font-bold">Badges</h2>
        <div class="flex flex-wrap gap-3">
          <app-brutal-badge>Neutral</app-brutal-badge>
          <app-brutal-badge variant="primary">#0001</app-brutal-badge>
          <app-brutal-badge variant="secondary">New</app-brutal-badge>
          <app-brutal-badge variant="accent">Legendary</app-brutal-badge>
        </div>
        <div class="flex flex-wrap gap-2">
          @for (type of pokemonTypes; track type) {
            <app-brutal-badge variant="pokemon-type" [pokemonType]="type">
              {{ type }}
            </app-brutal-badge>
          }
        </div>
      </section>

      <section aria-labelledby="skeleton-section" class="space-y-4">
        <h2 id="skeleton-section" class="font-display text-2xl font-bold">Skeletons</h2>
        <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
          <app-brutal-card>
            <app-brutal-skeleton shape="circle" width="64px" />
            <app-brutal-skeleton shape="text" extraClass="mt-4" width="70%" />
            <app-brutal-skeleton shape="text" extraClass="mt-2" width="50%" />
          </app-brutal-card>
          <app-brutal-card>
            <app-brutal-skeleton shape="block" height="120px" />
          </app-brutal-card>
          <app-brutal-card>
            <app-brutal-skeleton shape="text" width="80%" />
            <app-brutal-skeleton shape="text" extraClass="mt-2" width="60%" />
            <app-brutal-skeleton shape="text" extraClass="mt-2" width="90%" />
          </app-brutal-card>
        </div>
      </section>
    </main>
  `,
})
export default class StyleguidePage {
  protected readonly theme = inject(ThemeService);
  protected readonly lang = inject(LanguageService);
  protected readonly pokemonTypes = POKEMON_TYPES;
  protected readonly search = signal('');
  protected readonly errorVal = signal('');
  protected readonly themeOptions: { value: ThemePreference }[] = [
    { value: 'system' },
    { value: 'light' },
    { value: 'dark' },
  ];

  protected readonly samplePokedex = computed(() => formatPokedexNumber(25));
  protected readonly sampleHeight = computed(() => formatHeight(4, this.lang.current()));
  protected readonly sampleWeight = computed(() => formatWeight(60, this.lang.current()));
}
