/**
 * Species-level data the detail page needs in addition to the per-form
 * `Pokemon` model: localized names, the genus ("Mouse Pokémon"), a short
 * flavor blurb, and the references that drive the evolution chain.
 *
 * Every "localized*" map keys by PokéAPI language code (e.g. "en", "ja-Hrkt",
 * "pt", "pt-br"). The UI selects an entry via `LanguageService.current()`
 * with a small fallback chain; callers should never assume a particular
 * key is present. PokéAPI's pt-br coverage is partial: most Gen 1-6 species
 * only ship en/ja/de/fr/es/it, so a fallback to en is unavoidable.
 */
export interface PokemonSpecies {
  readonly id: number;
  readonly defaultName: string;
  readonly localizedNames: ReadonlyMap<string, string>;
  readonly localizedGenera: ReadonlyMap<string, string>;
  readonly localizedFlavorTexts: ReadonlyMap<string, string>;
  readonly evolutionChainUrl: string | null;
  readonly evolvesFromSpecies: string | null;
  readonly isLegendary: boolean;
  readonly isMythical: boolean;
}
