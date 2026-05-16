import { isDevMode } from '@angular/core';
import { type Route, type Routes } from '@angular/router';

const styleguideRoute: Route = {
  path: '__styleguide',
  loadComponent: () => import('@features/styleguide/styleguide.page'),
  title: 'Styleguide',
};

export const routes: Routes = [
  // Dev-only kitchen-sink for the brutalist design system. isDevMode()
  // is folded away at build time, so the chunk is unreachable in prod.
  ...(isDevMode() ? [styleguideRoute] : []),
];
