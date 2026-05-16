/**
 * Card-less projection of a Pokémon used by the search index. Carries
 * just enough to render a result row and link into /pokemon/{name}.
 * Lives here so the search feature stays independently deletable from
 * the listing feature.
 */
export interface PokemonRef {
  readonly id: number;
  readonly name: string;
}
