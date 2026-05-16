/**
 * Wire shape for /pokemon?limit=N&offset=0. Private to data-access.
 */
export interface PokemonIndexResponseDto {
  readonly count: number;
  readonly next: string | null;
  readonly previous: string | null;
  readonly results: readonly { readonly name: string; readonly url: string }[];
}
