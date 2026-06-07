import { inject, Service, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Tracks how many internal route changes have happened in this tab.
 *
 * The detail page's "back" button uses this to decide between
 * `Location.back()` (when the user navigated here from another route in
 * the app) and `router.navigate(['/'])` (when they landed directly on a
 * deep link and `history.back()` would leave the SPA). Knowing this
 * upfront avoids relying on `document.referrer` (cross-origin) or
 * `history.length` (unreliable across SPA bootstraps).
 */
@Service()
export class NavigationHistoryService {
  private readonly router = inject(Router);

  /** Total NavigationEnd events observed since the service was created. */
  readonly navigationCount = signal(0);

  /** True once the user has navigated past the bootstrap URL. */
  readonly hasInternalHistory = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.navigationCount.update((n) => n + 1);
        if (this.navigationCount() > 1) {
          this.hasInternalHistory.set(true);
        }
      });
  }
}
