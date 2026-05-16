import { Injectable } from '@angular/core';
import { provideTransloco, type Translation, type TranslocoLoader } from '@jsverse/transloco';
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
  'nav.list': 'Listagem',
  'nav.search': 'Busca',
  'language.label': 'Idioma',
  'language.pt-BR': 'Português',
  'language.en': 'Inglês',
  'theme.label': 'Tema',
  'theme.light': 'Claro',
  'theme.dark': 'Escuro',
  'theme.system': 'Sistema',
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
};

const EN: Translation = {
  'app.title': 'Pokédex',
  'app.skipToContent': 'Skip to content',
  'common.retry': 'Try again',
  'common.loading': 'Loading',
  'list.title': 'Pokédex',
  'list.empty': 'No Pokémon to show.',
  'list.prev': 'Previous',
  'list.next': 'Next',
  'list.pageOf': 'Page {{ page }} of {{ total }}',
  'list.paginationLabel': 'Pagination',
  'list.cardAriaLabel': '{{ name }}, {{ number }}',
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
export const provideTranslocoForTesting = () =>
  provideTransloco({
    config: {
      availableLangs: [...SUPPORTED_LANGS],
      defaultLang: DEFAULT_LANG,
      fallbackLang: DEFAULT_LANG,
      reRenderOnLangChange: true,
      prodMode: true,
    },
    loader: InMemoryTranslocoLoader,
  });
