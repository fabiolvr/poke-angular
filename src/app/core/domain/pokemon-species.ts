/**
 * Species-level data the detail page needs in addition to the per-form
 * `Pokemon` model: localized names, the genus ("Mouse Pokémon"), a short
 * flavor blurb, and the references that drive the evolution chain.
 *
 * `localizedNames` keys are PokéAPI language codes (e.g. "en", "ja-Hrkt",
 * "pt", "pt-br"). The UI selects an entry via `LanguageService.current()`
 * with a small fallback chain; callers should never assume a particular
 * key is present.
 */
export interface PokemonSpecies {
  readonly id: number;
  readonly defaultName: string;
  readonly localizedNames: ReadonlyMap<string, string>;
  readonly genus: string | null;
  readonly flavorText: string | null;
  readonly evolutionChainUrl: string | null;
  readonly evolvesFromSpecies: string | null;
  readonly isLegendary: boolean;
  readonly isMythical: boolean;
}
