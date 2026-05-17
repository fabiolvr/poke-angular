import { cn } from '@core/utils';

export type BrutalButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type BrutalButtonSize = 'sm' | 'md' | 'lg';

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

/**
 * Shared class string for any element that should look like a BrutalButton.
 * BrutalButton itself is hardcoded to a `<button>`; this helper exists so an
 * `<a routerLink>` (used by the listing pagination) can reuse the exact same
 * visual without forking the component into a polymorphic `as: 'a'|'button'`
 * variant.
 *
 * The disabled appearance is the caller's responsibility (apply
 * `opacity-50 pointer-events-none` for anchors that should look disabled, plus
 * `aria-disabled="true"` + `tabindex="-1"` for assistive tech).
 */
export const brutalButtonClasses = (
  variant: BrutalButtonVariant = 'primary',
  size: BrutalButtonSize = 'md',
  extra?: string,
): string =>
  cn(
    'brutal-surface brutal-interactive brutal-focusable',
    'inline-flex items-center justify-center font-display font-bold',
    'select-none whitespace-nowrap no-underline',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    extra,
  );
