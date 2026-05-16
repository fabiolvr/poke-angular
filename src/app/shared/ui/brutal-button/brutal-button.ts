import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { cn } from '@core/utils';

export type BrutalButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type BrutalButtonSize = 'sm' | 'md' | 'lg';
export type BrutalButtonType = 'button' | 'submit' | 'reset';

const VARIANT_CLASSES: Record<BrutalButtonVariant, string> = {
  primary: 'bg-primary text-ink',
  secondary: 'bg-secondary text-white',
  danger: 'bg-accent text-white',
  ghost: 'bg-surface text-ink',
};

const SIZE_CLASSES: Record<BrutalButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2.5',
};

@Component({
  selector: 'app-brutal-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading() ? 'true' : null"
      [attr.aria-disabled]="disabled() ? 'true' : null"
      [class]="classes()"
      (click)="onClick($event)"
    >
      @if (loading()) {
        <span
          class="brutal-pulse inline-block size-3 rounded-full border-2 border-current"
          aria-hidden="true"
        ></span>
      }
      <ng-content />
    </button>
  `,
})
export class BrutalButton {
  readonly variant = input<BrutalButtonVariant>('primary');
  readonly size = input<BrutalButtonSize>('md');
  readonly type = input<BrutalButtonType>('button');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly extraClass = input<string>('');

  readonly pressed = output<MouseEvent>();

  protected readonly classes = computed(() =>
    cn(
      'brutal-surface brutal-interactive brutal-focusable',
      'inline-flex items-center justify-center font-display font-bold',
      'select-none whitespace-nowrap',
      VARIANT_CLASSES[this.variant()],
      SIZE_CLASSES[this.size()],
      this.extraClass(),
    ),
  );

  protected onClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
    }
    this.pressed.emit(event);
  }
}
