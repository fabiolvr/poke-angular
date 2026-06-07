import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { cn } from '@core/utils';

export type BrutalInputType = 'text' | 'search' | 'email' | 'password' | 'number' | 'tel' | 'url';
export type BrutalInputSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<BrutalInputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
};

let nextId = 0;

@Component({
  selector: 'app-brutal-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="flex flex-col gap-1.5" [for]="inputId">
      @if (label()) {
        <span class="font-display text-sm font-bold tracking-wide">
          {{ label() }}
          @if (required()) {
            <span class="text-accent" aria-hidden="true">*</span>
          }
        </span>
      }
      <input
        [id]="inputId"
        [type]="type()"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [required]="required()"
        [attr.aria-invalid]="showError() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        [autocomplete]="autocomplete()"
        [class]="inputClasses()"
        (input)="onInput($event)"
        (blur)="touched.set(true)"
      />
      @if (showError()) {
        <span [id]="errorId" class="text-accent text-sm font-bold" aria-live="polite">
          {{ displayError() }}
        </span>
      } @else if (hint()) {
        <span [id]="hintId" class="text-ink-soft text-sm">{{ hint() }}</span>
      }
    </label>
  `,
})
export class BrutalInput implements FormValueControl<string> {
  protected readonly inputId = `brutal-input-${++nextId}`;
  protected readonly errorId = `${this.inputId}-error`;
  protected readonly hintId = `${this.inputId}-hint`;

  readonly value = model<string>('');

  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  /**
   * Manual error message for standalone use (without Signal Forms).
   * When a Signal Forms field is bound via `[formField]`, errors come
   * through the `errors` input instead; `errorMessage` is the fallback
   * for usage outside a form context.
   */
  readonly errorMessage = input<string>('');
  /** Populated by `FormField` when bound via `[formField]`. */
  readonly errors = input<readonly ValidationError.WithOptionalField[]>([]);
  readonly type = input<BrutalInputType>('text');
  readonly size = input<BrutalInputSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Cosmetic only: shows the required asterisk and sets the HTML
   * `required` attribute. The Signal Forms schema is the authoritative
   * source for validation; this input is independent of it.
   */
  readonly required = input(false, { transform: booleanAttribute });
  readonly autocomplete = input<string>('off');
  readonly extraClass = input<string>('');

  /**
   * Exposed as a `model` so `FormField` can read the touched state
   * (propagated back from the host's blur event). In standalone use,
   * behaves like a plain writable signal.
   */
  readonly touched = model(false);

  /**
   * Resolves the error message to display:
   *   1. First error with a `.message` from Signal Forms (`errors` input).
   *   2. Manual `errorMessage` input (standalone / non-form usage).
   *   3. `null` → no error.
   */
  protected readonly displayError = computed(
    () => (this.errors().find((e) => e.message)?.message ?? this.errorMessage()) || null,
  );
  protected readonly hasError = computed(() => this.displayError() !== null);
  /** Error is only shown after the field has been touched (blur). */
  protected readonly showError = computed(() => this.hasError() && this.touched());

  protected readonly describedBy = computed(() => {
    if (this.showError()) return this.errorId;
    if (this.hint()) return this.hintId;
    return null;
  });

  protected readonly inputClasses = computed(() =>
    cn(
      'brutal-surface brutal-focusable w-full font-sans',
      'bg-surface text-ink placeholder:text-ink-soft',
      'transition-shadow duration-100',
      'focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[var(--shadow-brutal-sm)]',
      SIZE_CLASSES[this.size()],
      this.showError() && 'border-accent',
      this.extraClass(),
    ),
  );

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
  }
}
