import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { type PokemonTypeName } from '@core/domain';
import { pokemonTypeBgClass, pokemonTypeNeedsDarkLabel } from '@core/theme';
import { cn } from '@core/utils';

export type BrutalBadgeVariant = 'neutral' | 'primary' | 'secondary' | 'accent' | 'pokemon-type';
export type BrutalBadgeSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<BrutalBadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const NEUTRAL_VARIANT_CLASSES: Record<Exclude<BrutalBadgeVariant, 'pokemon-type'>, string> = {
  neutral: 'bg-surface text-ink',
  primary: 'bg-primary text-ink-static',
  secondary: 'bg-secondary text-white',
  accent: 'bg-accent text-white',
};

@Component({
  selector: 'app-brutal-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="classes()">
      <ng-content />
    </span>
  `,
})
export class BrutalBadge {
  readonly variant = input<BrutalBadgeVariant>('neutral');
  readonly size = input<BrutalBadgeSize>('md');
  /**
   * When variant is `pokemon-type`, supply the type name to drive the color.
   * The badge picks ink-on-color or white-on-color automatically based on
   * each type's contrast profile.
   */
  readonly pokemonType = input<PokemonTypeName | null>(null);
  readonly extraClass = input<string>('');

  protected readonly classes = computed(() => {
    const variant = this.variant();
    const type = this.pokemonType();

    const variantClasses =
      variant === 'pokemon-type' && type
        ? cn(
            pokemonTypeBgClass(type),
            pokemonTypeNeedsDarkLabel(type) ? 'text-ink-static' : 'text-white',
          )
        : NEUTRAL_VARIANT_CLASSES[variant === 'pokemon-type' ? 'neutral' : variant];

    return cn(
      'brutal-surface inline-flex items-center justify-center font-display font-bold',
      'tracking-wide uppercase',
      SIZE_CLASSES[this.size()],
      variantClasses,
      this.extraClass(),
    );
  });
}
