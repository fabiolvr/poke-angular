import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { cn } from '@core/utils';

export type BrutalCardPadding = 'none' | 'sm' | 'md' | 'lg';

const PADDING_CLASSES: Record<BrutalCardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

@Component({
  selector: 'app-brutal-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="classes()" [attr.role]="role()">
      <ng-content />
    </div>
  `,
})
export class BrutalCard {
  /**
   * When true, the card responds to hover/press the way buttons do —
   * shadow shrinks and the surface settles into it. Use this when the
   * entire card is clickable (wrap in <a> or <button> outside the card).
   */
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly padding = input<BrutalCardPadding>('md');
  readonly extraClass = input<string>('');

  /**
   * Optional ARIA role override. Cards are containers — they typically
   * don't need a role, but `article` / `region` are useful in lists.
   */
  readonly role = input<string | null>(null);

  protected readonly classes = computed(() =>
    cn(
      'brutal-surface block',
      this.interactive() && 'brutal-interactive brutal-focusable cursor-pointer',
      PADDING_CLASSES[this.padding()],
      this.extraClass(),
    ),
  );
}
