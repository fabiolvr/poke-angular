import { isDevMode } from '@angular/core';
import { type Route, type Routes } from '@angular/router';

const listingRoute: Route = {
  path: '',
  pathMatch: 'full',
  loadComponent: () => import('@features/pokemon-list/feature/pokemon-list.page'),
  title: 'Pokédex',
};

const detailRoute: Route = {
  path: 'pokemon/:name',
  loadComponent: () => import('@features/pokemon-detail/feature/pokemon-detail.page'),
};

const styleguideRoute: Route = {
  path: '__styleguide',
  loadComponent: () => import('@features/styleguide/styleguide.page'),
  title: 'Styleguide',
};

export const routes: Routes = [
  listingRoute,
  detailRoute,
  // Dev-only kitchen-sink for the brutalist design system. isDevMode()
  // is folded away at build time, so the chunk is unreachable in prod.
  ...(isDevMode() ? [styleguideRoute] : []),
];
