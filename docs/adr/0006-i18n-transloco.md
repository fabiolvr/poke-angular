# ADR-0006: i18n via Transloco com troca de idioma em runtime

- **Status**: Accepted
- **Data**: 2026-05-16
- **Decisores**: Tech Lead

## Contexto

Requisito não-negociável do plano: o usuário precisa **trocar idioma
em runtime** (PT-BR ↔ EN), sem rebuild. Isso elimina a abordagem
build-per-locale do `@angular/localize` clássico. Idiomas iniciais:
`pt-BR` (default) e `en`, com estrutura preparada para adicionar
mais sem refator.

Há **duas fontes** de texto:

1. **UI da aplicação** (labels, botões, headers, mensagens de erro)
   — sob nosso controle, em JSON.
2. **Nomes de Pokémon, genus e flavor text** — vêm da PokéAPI, que
   já expõe `names[]` com entradas por código de idioma
   (`en`, `ja`, `pt-br`, etc.).

Antipadrões proibidos pelo plano: strings hardcoded em
templates/TypeScript, ternários `lang === 'pt'`, tradução manual de
nomes próprios.

## Decisão

### Biblioteca: `@jsverse/transloco` v8

Configurada via `provideTranslocoConfig()` em `core/i18n/`:

- `availableLangs: ['pt-BR', 'en']`, `defaultLang: 'pt-BR'`,
  `fallbackLang: 'pt-BR'`.
- `reRenderOnLangChange: true` — templates reagem ao toggle sem reload.
- Loader HTTP custom (`TranslocoHttpLoader`) carrega
  `/i18n/{lang}.json` (servido como asset estático em `public/i18n/`).
- Para testes, `provideTranslocoForTesting()` injeta um loader
  in-memory com as chaves usadas; specs renderizam strings
  determinísticas sem flushar HTTP.

### `LanguageService` (core)

Owns o signal `current` (`SupportedLang`). Detecção inicial em três
camadas:

1. `localStorage['poke-angular:lang']` (escolha explícita).
2. `navigator.language` exato → prefixo (`pt-PT` → `pt-BR`).
3. Default `pt-BR`.

Um `effect()` mantém `TranslocoService.activeLang`,
`<html lang>` e `localStorage` em sincronia.

### Nomes de Pokémon

Em vez de traduzir manualmente, o `pokemon-detail` consome
`species.names[]` via mapper, indexando por idioma:
`localizedNames.get(langCode)`. Cadeia de fallback do detail:
`pt-BR → pt-br → pt → en → defaultName`. Nomes não traduzidos pela
PokéAPI caem graciosamente no `pokemon.name` original.

### Labels de tipo / stat

A PokéAPI **não** traduz consistentemente nomes de tipos e stats
para pt-BR. Esses ficam em `detail.stat.*` e nas chaves do
styleguide/badges, sob nosso controle.

### Plurals

Por enquanto `countOne` / `countOther` são chaves separadas
selecionadas pelo chamador. ICU plural via
`@jsverse/transloco-messageformat` é PENDENCIA (até a Fase 4 ter
sido construída sem precisar; documentado).

### Formatação de números e unidades

Via `Intl.NumberFormat` em `@core/format` — `formatHeight`,
`formatWeight`, `formatPokedexNumber`. Cache por locale.

## Alternativas Consideradas

- **`@angular/localize` build-per-locale** — descartado: o requisito
  pede troca em runtime, e build-per-locale exige reload entre
  idiomas + pipeline de build mais pesado.
- **`ngx-translate`** — viável, mas comunidade menos ativa do que
  Transloco; menos integração native com signals.
- **Solução in-house** — descartado: pluralização, interpolação e
  hot-reload de bundles são caros de reimplementar.
- **`@angular/localize` runtime ($localize tag templates)** —
  descartado: ainda exige rebuild para introduzir uma nova chave;
  Transloco edita o JSON e pronto.

## Consequências

### Positivas

- Troca de idioma é instantânea; nenhum reload.
- Adicionar um terceiro idioma é: novo JSON em `public/i18n/`,
  adicionar a `SUPPORTED_LANGS`, e a UI ganha automaticamente o
  novo botão no `LanguageSwitcher`.
- Specs não dependem do loader HTTP (`provideTranslocoForTesting`).

### Negativas / Trade-offs

- O bundle ganha ~57 kB para o runtime do Transloco. Aceitável.
- Plurals via chaves separadas é menos elegante que ICU; coberto
  em PENDENCIAS.
- A primeira navegação para uma rota custa um GET extra para o
  JSON do idioma (cacheado depois pelo `cacheInterceptor`).

### Neutras / Implicações futuras

- Lazy scope por feature ainda é possível (Transloco suporta
  `*transloco="let t; scope: 'list'"`), mas dado o tamanho dos
  JSONs atuais (~1 kB cada), não foi adotado. Migrar é trivial.

## Referências

- `src/app/core/i18n/transloco.config.ts`
- `src/app/core/i18n/transloco.loader.ts`
- `src/app/core/i18n/transloco.testing.ts`
- `src/app/core/i18n/language.service.ts`
- `public/i18n/pt-BR.json` / `public/i18n/en.json`
- `src/app/features/pokemon-detail/data-access/pokeapi-detail.mapper.ts` (pickFlavorText / pickGenus)
