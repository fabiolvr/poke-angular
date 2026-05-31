import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cn } from '@core/utils';

export type BrutalSkeletonShape = 'block' | 'text' | 'circle';

const SHAPE_CLASSES: Record<BrutalSkeletonShape, string> = {
  block: 'rounded-[var(--radius-brutal)]',
  text: 'rounded-[var(--radius-brutal-sm)] h-4',
  circle: 'rounded-full aspect-square',
};

@Component({
  selector: 'app-brutal-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- eslint-disable-next-line @angular-eslint/template/no-inline-styles -->
    <span
      [class]="classes()"
      [style.width]="width()"
      [style.height]="height()"
      role="status"
      aria-busy="true"
      [attr.aria-label]="ariaLabel() || null"
    ></span>
  `,
})
export class BrutalSkeleton {
  readonly shape = input<BrutalSkeletonShape>('block');
  /** Any CSS length (`100%`, `120px`, `auto`...). */
  readonly width = input<string>('100%');
  /** Any CSS length. Defaults differ per shape (text=1lh, others=auto). */
  readonly height = input<string | null>(null);
  /**
   * Empty by default: skeletons are decorative, so the surrounding
   * `role="status"` region announces loading. Set a (translated) label only
   * for a standalone skeleton that isn't already inside a labelled region.
   */
  readonly ariaLabel = input<string>('');
  readonly extraClass = input<string>('');

  protected readonly classes = computed(() =>
    cn(
      'brutal-pulse block border-[var(--border-brutal-width)] border-ink bg-surface-muted',
      SHAPE_CLASSES[this.shape()],
      this.extraClass(),
    ),
  );
}
