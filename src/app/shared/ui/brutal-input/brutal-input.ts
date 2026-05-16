import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
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
        [attr.aria-invalid]="errorMessage() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        [autocomplete]="autocomplete()"
        [class]="inputClasses()"
        (input)="onInput($event)"
        (blur)="touched.set(true)"
      />
      @if (errorMessage() && touched()) {
        <span [id]="errorId" class="text-accent text-sm font-bold" aria-live="polite">
          {{ errorMessage() }}
        </span>
      } @else if (hint()) {
        <span [id]="hintId" class="text-ink-soft text-sm">{{ hint() }}</span>
      }
    </label>
  `,
})
export class BrutalInput {
  protected readonly inputId = `brutal-input-${++nextId}`;
  protected readonly errorId = `${this.inputId}-error`;
  protected readonly hintId = `${this.inputId}-hint`;

  readonly value = model<string>('');

  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly errorMessage = input<string>('');
  readonly type = input<BrutalInputType>('text');
  readonly size = input<BrutalInputSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly autocomplete = input<string>('off');
  readonly extraClass = input<string>('');

  protected readonly touched = signal(false);

  protected readonly describedBy = computed(() => {
    if (this.errorMessage() && this.touched()) return this.errorId;
    if (this.hint()) return this.hintId;
    return null;
  });

  protected readonly inputClasses = computed(() =>
    cn(
      'brutal-surface brutal-focusable w-full font-sans',
      'bg-surface text-ink placeholder:text-ink-mute',
      'transition-shadow duration-100',
      'focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[var(--shadow-brutal-sm)]',
      SIZE_CLASSES[this.size()],
      this.errorMessage() && this.touched() && 'border-accent',
      this.extraClass(),
    ),
  );

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
  }
}
