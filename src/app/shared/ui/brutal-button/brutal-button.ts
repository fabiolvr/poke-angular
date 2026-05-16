import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  brutalButtonClasses,
  type BrutalButtonSize,
  type BrutalButtonVariant,
} from './brutal-button-classes';

export type { BrutalButtonSize, BrutalButtonVariant } from './brutal-button-classes';
export type BrutalButtonType = 'button' | 'submit' | 'reset';

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
    brutalButtonClasses(this.variant(), this.size(), this.extraClass()),
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
