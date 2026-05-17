import { type Route, type Routes } from '@angular/router';

const listingRoute: Route = {
  path: '',
  pathMatch: 'full',
  loadComponent: () => import('@features/pokemon-list/feature/pokemon-list.page'),
  title: 'Pokédex',
};

const searchRoute: Route = {
  path: 'search',
  loadComponent: () => import('@features/pokemon-search/feature/pokemon-search.page'),
  title: 'Search',
};

const detailRoute: Route = {
  path: 'pokemon/:name',
  loadComponent: () => import('@features/pokemon-detail/feature/pokemon-detail.page'),
};

/**
 * Production route table. Drops the dev-only `/__styleguide` route so
 * the styleguide chunk never reaches the production bundle (no static
 * import statement here for the bundler to follow). Swapped in via
 * angular.json `fileReplacements` on the production configuration.
 */
export const routes: Routes = [listingRoute, searchRoute, detailRoute];
