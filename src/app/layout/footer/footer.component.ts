import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * Minimal footer that credits PokéAPI. The plan calls for a "courtesy"
 * link — anything more than that would compete with the brutalist
 * banner above.
 */
@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    <footer
      class="border-ink mt-auto border-t-[var(--border-brutal-width)] py-4 text-center text-sm"
    >
      <p>
        {{ 'app.footerPoweredBy' | transloco }}
        <a
          href="https://pokeapi.co"
          rel="noopener external"
          target="_blank"
          class="font-display font-bold underline underline-offset-2"
        >
          {{ 'app.footerSourceLabel' | transloco }}
        </a>
      </p>
    </footer>
  `,
})
export class AppFooter {}
