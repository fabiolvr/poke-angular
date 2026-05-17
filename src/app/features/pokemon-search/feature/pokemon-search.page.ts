import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { appErrorOf, appErrorTranslationKey } from '@core/http';
import { TranslocoDirective } from '@jsverse/transloco';
import { debounceTime } from 'rxjs';
import { BrutalButton, BrutalCard, BrutalInput } from '@shared/ui';
import { POKEMON_INDEX_REPOSITORY, type PokemonRef } from '../data-access';
import { HighlightedText } from '../ui/highlighted-text.component';

const MAX_RESULTS = 50;
const DEBOUNCE_MS = 300;
const FALLBACK_SPRITE = '/img/missing-sprite.svg';

const formatDex = (id: number): string => `#${id.toString().padStart(4, '0')}`;

/**
 * Search page at `/search`.
 *
 * The PokéAPI has no full-text endpoint, so we work client-side: fetch
 * a single ~120 kB index (name + id for every Pokémon) once per
 * session and filter it in memory. The cacheInterceptor makes revisits
 * a single render frame.
 *
 * The `query` signal is the immediate input value (used to drive the
 * <input>); `debouncedQuery` lags behind by 300ms and is what the
 * filter actually reads — typing fast doesn't shred React-style.
 *
 * Keyboard navigation follows the WAI-ARIA listbox pattern lite:
 *   ↑/↓ move `focusedIndex` through the results, looping;
 *   Enter opens the focused result;
 *   Esc clears the query and unfocuses everything.
 * aria-activedescendant on the input + a matching id on each <li>
 * tells screen readers what's selected without yanking real DOM focus.
 */
@Component({
  selector: 'app-pokemon-search-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BrutalButton, BrutalCard, BrutalInput, HighlightedText, RouterLink, TranslocoDirective],
  host: {
    '(keydown)': 'onKey($event)',
  },
  template: `
    <main *transloco="let t" class="mx-auto max-w-3xl space-y-4 p-6">
      <header class="space-y-1">
        <h1 class="font-display text-3xl font-bold tracking-tight">{{ t('search.title') }}</h1>
        <p class="text-ink-soft text-sm">{{ t('search.hint') }}</p>
      </header>

      <div class="flex items-end gap-3">
        <div class="flex-1">
          <app-brutal-input
            [(value)]="query"
            [label]="t('search.title')"
            [placeholder]="t('search.placeholder')"
            type="search"
          />
        </div>
        @if (query()) {
          <app-brutal-button variant="ghost" size="sm" (pressed)="clear()">
            {{ t('search.clear') }}
          </app-brutal-button>
        }
      </div>

      @switch (true) {
        @case (indexResource.isLoading()) {
          <app-brutal-card padding="md" role="status" aria-live="polite">
            <p>{{ t('search.loadingIndex') }}</p>
          </app-brutal-card>
        }
        @case (indexError() !== null) {
          <app-brutal-card padding="md" role="alert" aria-live="assertive">
            <p>{{ t(indexError()!) }}</p>
          </app-brutal-card>
        }
        @case (debouncedQuery().length === 0) {
          <app-brutal-card padding="md" role="status">
            <p>{{ t('search.typeToStart') }}</p>
          </app-brutal-card>
        }
        @case (results().length === 0) {
          <app-brutal-card padding="md" role="status" aria-live="polite">
            <p>{{ t('search.empty', { query: debouncedQuery() }) }}</p>
          </app-brutal-card>
        }
        @default {
          <div class="sr-only" role="status" aria-live="polite">
            {{ t('search.resultCount', { count: results().length }) }}
          </div>
          @if (totalMatches() > MAX_RESULTS) {
            <p class="text-ink-soft text-sm">
              {{ t('search.showingFirst', { shown: results().length, total: totalMatches() }) }}
            </p>
          }
          <ul
            role="listbox"
            [attr.aria-label]="t('search.resultsLabel')"
            class="flex flex-col gap-2"
          >
            @for (result of results(); track result.id; let index = $index) {
              <li
                [id]="optionId(index)"
                role="option"
                [attr.aria-selected]="index === focusedIndex()"
              >
                <a
                  [routerLink]="['/pokemon', result.name]"
                  [class]="resultLinkClasses(index)"
                  (mouseenter)="focusedIndex.set(index)"
                  (focus)="focusedIndex.set(index)"
                >
                  <img
                    [src]="spriteUrl(result.id)"
                    [alt]="result.name"
                    width="48"
                    height="48"
                    loading="lazy"
                    class="size-12 shrink-0"
                    (error)="onSpriteError($event)"
                  />
                  <span class="font-mono text-xs">{{ formatDex(result.id) }}</span>
                  <span class="font-display text-base font-bold capitalize">
                    <app-highlighted-text [text]="result.name" [query]="debouncedQuery()" />
                  </span>
                </a>
              </li>
            }
          </ul>
        }
      }
    </main>
  `,
})
export default class PokemonSearchPage {
  private readonly indexRepo = inject(POKEMON_INDEX_REPOSITORY);
  private readonly router = inject(Router);

  /**
   * `?q=` query param wired in via `withComponentInputBinding()`. Reading
   * it as an input keeps deep links and back navigation working: a back
   * from /pokemon/:name lands here with the original query restored.
   *
   * `withComponentInputBinding()` passes `undefined` when the param is
   * absent (it does not honour the `input()` default), so the linkedSignal
   * below coerces back to `''`.
   */
  readonly q = input<string | undefined>(undefined);

  /**
   * Writable signal seeded from `q()` so user typing edits it freely
   * while URL changes (deep link, browser back) reseed the input.
   */
  protected readonly query = linkedSignal<string>(() => this.q() ?? '');
  protected readonly focusedIndex = signal(-1);

  protected readonly indexResource = rxResource<readonly PokemonRef[], void>({
    stream: () => this.indexRepo.getIndex(),
  });

  protected readonly indexError = computed(() => {
    const err = appErrorOf(this.indexResource.error());
    return err ? appErrorTranslationKey(err) : null;
  });

  protected readonly debouncedQuery = toSignal(
    toObservable(this.query).pipe(debounceTime(DEBOUNCE_MS)),
    { initialValue: '' },
  );

  protected readonly results = computed<readonly PokemonRef[]>(() => {
    const q = this.debouncedQuery().trim().toLowerCase();
    if (!q) return [];
    const index = this.indexResource.value() ?? [];
    const matches: PokemonRef[] = [];
    for (const ref of index) {
      if (ref.name.toLowerCase().includes(q)) {
        matches.push(ref);
        if (matches.length >= MAX_RESULTS) break;
      }
    }
    return matches;
  });

  protected readonly totalMatches = computed(() => {
    const q = this.debouncedQuery().trim().toLowerCase();
    if (!q) return 0;
    const index = this.indexResource.value() ?? [];
    let count = 0;
    for (const ref of index) {
      if (ref.name.toLowerCase().includes(q)) count += 1;
    }
    return count;
  });

  protected readonly MAX_RESULTS = MAX_RESULTS;
  protected readonly formatDex = formatDex;

  protected optionId(index: number): string {
    return `search-option-${index}`;
  }

  protected resultLinkClasses(index: number): string {
    const base = 'brutal-surface brutal-focusable flex items-center gap-3 px-4 py-3 no-underline';
    return index === this.focusedIndex() ? `${base} bg-primary text-ink-static` : base;
  }

  /**
   * Sprite URL derived directly from the pokémon id (same path the
   * evolution chain and detail hero use). Plain <img> + native
   * `loading="lazy"` lets the browser skip rows off-screen; the
   * `onSpriteError` handler swaps to the local placeholder for the
   * rare form ids that don't have artwork uploaded yet (fan-added
   * Mega/Gigantamax stubs past id 10300+).
   */
  protected spriteUrl(id: number): string {
    if (!Number.isFinite(id) || id <= 0) return FALLBACK_SPRITE;
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }

  protected onSpriteError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (img && !img.src.endsWith(FALLBACK_SPRITE)) {
      img.src = FALLBACK_SPRITE;
    }
  }

  constructor() {
    // Reset the keyboard cursor whenever the result set shape changes so
    // a stale focusedIndex doesn't point past the new list's end.
    effect(() => {
      const count = this.results().length;
      const current = this.focusedIndex();
      if (current >= count) this.focusedIndex.set(count === 0 ? -1 : count - 1);
    });

    // Mirror the debounced query back into `?q=`. `untracked` on `q()`
    // keeps the effect from depending on its own write (which would
    // re-fire on every navigate). `replaceUrl: true` avoids polluting
    // the back-history with one entry per debounced keystroke.
    //
    // `debouncedQuery` seeds with `''` (toSignal initialValue) and only
    // catches up to `q()` after `debounceTime(300)` ticks. Skipping the
    // first effect run prevents a transient empty value from wiping out
    // `?q=` when the user lands here via deep link or browser back.
    let initialized = false;
    effect(() => {
      const next = this.debouncedQuery();
      if (!initialized) {
        initialized = true;
        return;
      }
      const current = untracked(this.q) ?? '';
      if (next === current) return;
      void this.router.navigate([], {
        queryParams: { q: next || null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  protected clear(): void {
    this.query.set('');
    this.focusedIndex.set(-1);
  }

  protected onKey(event: KeyboardEvent): void {
    const count = this.results().length;
    if (count === 0 && event.key !== 'Escape') return;
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        this.focusedIndex.update((i) => (i + 1 >= count ? 0 : i + 1));
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        this.focusedIndex.update((i) => (i <= 0 ? count - 1 : i - 1));
        break;
      }
      case 'Enter': {
        const i = this.focusedIndex();
        const target = this.results()[i];
        if (target) {
          event.preventDefault();
          void this.router.navigate(['/pokemon', target.name]);
        }
        break;
      }
      case 'Escape': {
        event.preventDefault();
        this.clear();
        break;
      }
      default:
        break;
    }
  }
}
