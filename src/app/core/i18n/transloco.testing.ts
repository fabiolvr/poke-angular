import { Injectable } from '@angular/core';
import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { provideTransloco, type Translation, type TranslocoLoader } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { of, type Observable } from 'rxjs';
import { DEFAULT_LANG, SUPPORTED_LANGS } from './supported-langs';

/**
 * Inline copy of every translation key consumed by templates anywhere in
 * the app. Mirrors public/i18n/pt-BR.json — kept here so unit specs render
 * deterministically without needing HttpTestingController to flush
 * translation responses.
 *
 * Update this whenever you add a new key the templates actually use. Keys
 * defined only in production JSON but never referenced in tests don't
 * need to live here.
 */
const PT_BR: Translation = {
  'app.title': 'Pokédex',
  'app.skipToContent': 'Pular para o conteúdo',
  'app.footerPoweredBy': 'Dados de',
  'app.footerSourceLabel': 'PokéAPI',
  'nav.list': 'Listagem',
  'nav.search': 'Busca',
  'language.label': 'Idioma',
  'language.pt-BR': 'Português',
  'language.en': 'Inglês',
  'theme.label': 'Tema',
  'theme.light': 'Claro',
  'theme.dark': 'Escuro',
  'theme.system': 'Sistema',
  'theme.toggleToDark': 'Mudar para tema escuro',
  'theme.toggleToLight': 'Mudar para tema claro',
  'common.retry': 'Tentar novamente',
  'common.back': 'Voltar',
  'common.loading': 'Carregando',
  'common.search': 'Buscar',
  'errors.network': 'Sem conexão com a PokéAPI.',
  'errors.notFound': 'Pokémon não encontrado.',
  'errors.rateLimit': 'Muitas requisições.',
  'errors.server': 'PokéAPI instável.',
  'errors.unknown': 'Algo deu errado.',
  'list.title': 'Pokédex',
  'list.empty': 'Nenhum Pokémon para mostrar.',
  'list.prev': 'Anterior',
  'list.next': 'Próxima',
  'list.pageOf': 'Página {{ page }} de {{ total }}',
  'list.paginationLabel': 'Paginação',
  'list.cardAriaLabel': '{{ name }}, {{ number }}',
  'list.count': '{count, plural, one {1 Pokémon} other {# Pokémons}}',
  'detail.back': 'Voltar',
  'detail.height': 'Altura',
  'detail.weight': 'Peso',
  'detail.baseExperience': 'Experiência base',
  'detail.types': 'Tipos',
  'detail.abilities': 'Habilidades',
  'detail.hiddenAbility': '(oculta)',
  'detail.stats': 'Status',
  'detail.statTotal': 'Total',
  'detail.shinyToggle': 'Mostrar shiny',
  'detail.normalToggle': 'Mostrar normal',
  'detail.evolutionChain': 'Linha evolutiva',
  'detail.evolutionChainEmpty': 'Este Pokémon não evolui.',
  'detail.flavorText': 'Descrição',
  'detail.stat.hp': 'HP',
  'detail.stat.attack': 'Ataque',
  'detail.stat.defense': 'Defesa',
  'detail.stat.special-attack': 'Atq. Esp.',
  'detail.stat.special-defense': 'Def. Esp.',
  'detail.stat.speed': 'Velocidade',
  'search.title': 'Buscar Pokémon',
  'search.placeholder': 'Digite um nome',
  'search.hint': 'Busca por nome.',
  'search.loadingIndex': 'Preparando índice…',
  'search.typeToStart': 'Comece a digitar.',
  'search.empty': 'Nada para {{ query }}.',
  'search.resultsLabel': 'Resultados da busca',
  'search.resultCount': '{count, plural, one {1 resultado} other {# resultados}}',
  'search.showingFirst': 'Exibindo {{ shown }} de {{ total }}.',
  'search.clear': 'Limpar',
};

const EN: Translation = {
  'app.title': 'Pokédex',
  'app.skipToContent': 'Skip to content',
  'app.footerPoweredBy': 'Data from',
  'app.footerSourceLabel': 'PokéAPI',
  'common.retry': 'Try again',
  'common.loading': 'Loading',
  'list.title': 'Pokédex',
  'list.empty': 'No Pokémon to show.',
  'list.prev': 'Previous',
  'list.next': 'Next',
  'list.pageOf': 'Page {{ page }} of {{ total }}',
  'list.paginationLabel': 'Pagination',
  'list.cardAriaLabel': '{{ name }}, {{ number }}',
  'list.count': '{count, plural, one {1 Pokémon} other {# Pokémon}}',
  'detail.back': 'Back',
  'detail.height': 'Height',
  'detail.weight': 'Weight',
  'detail.baseExperience': 'Base experience',
  'detail.types': 'Types',
  'detail.abilities': 'Abilities',
  'detail.hiddenAbility': '(hidden)',
  'detail.stats': 'Stats',
  'detail.statTotal': 'Total',
  'detail.shinyToggle': 'Show shiny',
  'detail.normalToggle': 'Show normal',
  'detail.evolutionChain': 'Evolution chain',
  'detail.evolutionChainEmpty': 'This Pokémon does not evolve.',
  'detail.flavorText': 'Description',
  'detail.stat.hp': 'HP',
  'detail.stat.attack': 'Attack',
  'detail.stat.defense': 'Defense',
  'detail.stat.special-attack': 'Sp. Atk',
  'detail.stat.special-defense': 'Sp. Def',
  'detail.stat.speed': 'Speed',
  'search.title': 'Search Pokémon',
  'search.placeholder': 'Type a name',
  'search.hint': 'Search by name.',
  'search.loadingIndex': 'Preparing index…',
  'search.typeToStart': 'Start typing.',
  'search.empty': 'Nothing for {{ query }}.',
  'search.resultsLabel': 'Search results',
  'search.resultCount': '{count, plural, one {1 result} other {# results}}',
  'search.showingFirst': 'Showing {{ shown }} of {{ total }}.',
  'search.clear': 'Clear',
};

@Injectable({ providedIn: 'root' })
class InMemoryTranslocoLoader implements TranslocoLoader {
  getTranslation(lang: string): Observable<Translation> {
    if (lang === 'pt-BR') return of(PT_BR);
    if (lang === 'en') return of(EN);
    return of({});
  }
}

/**
 * Drop-in replacement for `provideTranslocoConfig()` in unit specs.
 * Skips HttpClient entirely, so tests don't need to flush translation
 * responses through HttpTestingController.
 */
export const provideTranslocoForTesting = (): EnvironmentProviders =>
  makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: [...SUPPORTED_LANGS],
        defaultLang: DEFAULT_LANG,
        fallbackLang: DEFAULT_LANG,
        reRenderOnLangChange: true,
        prodMode: true,
      },
      loader: InMemoryTranslocoLoader,
    }),
    provideTranslocoMessageformat(),
  ]);
