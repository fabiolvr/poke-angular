import { defineConfig } from 'vitest/config';

/**
 * Picked up by `@angular/build:unit-test` when `runnerConfig: true` is
 * set in angular.json. The builder still controls bootstrap (jsdom +
 * Angular's testing harness); we only contribute coverage shape here.
 *
 * Thresholds enforce the project plan's "80% in data-access + domain"
 * target. Coverage runs only when explicitly requested (`npm run
 * test:coverage`); the default `npm test` skips the gate so day-to-day
 * iteration stays fast.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: [
        'src/app/core/domain/**/*.ts',
        'src/app/core/http/**/*.ts',
        'src/app/core/format/**/*.ts',
        'src/app/core/pokeapi/**/*.ts',
        'src/app/features/**/data-access/**/*.ts',
      ],
      exclude: ['**/*.spec.ts', '**/index.ts', '**/*.dto.ts'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
