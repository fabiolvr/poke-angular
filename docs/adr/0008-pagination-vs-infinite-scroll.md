# ADR-0008: Paginação clássica (offset/limit) em vez de scroll infinito

- **Status**: Accepted
- **Data**: 2026-05-16
- **Decisores**: Tech Lead

## Contexto

A listagem precisa percorrer ~1.300 espécies (mais variantes de forma,
≈ 1.500 entradas no índice completo da PokéAPI). A escolha clássica
é paginação ou scroll infinito.

O plano explicitamente pede deep-linking (URL reflete a página atual)
e preservação de estado ao voltar de uma rota de detalhe.

## Decisão

**Paginação clássica**, `pageSize = 20`, URL `?page=N` é a fonte da
verdade.

Implementação:

- `parsePageParam` clampa `?page=` para inteiro ≥ 1; valores
  inválidos caem para 1.
- `rxResource` reage ao signal de página; o `cacheInterceptor`
  garante que voltar a uma página já visitada não dispare requests.
- `<a [routerLink]="['./']" [queryParams]="{page: ...}">` para
  Prev/Next mantém semântica de anchor (middle-click, back/forward,
  screen readers).
- Effect detecta `?page=` além do total e redireciona com
  `replaceUrl: true` para a última página real.

## Alternativas Consideradas

- **Scroll infinito (`IntersectionObserver`)** — descartado:
  - Acessibilidade pior: foco se perde ao injetar itens dinamicamente,
    leitores de tela não conseguem anunciar "fim da página".
  - Deep-linking complexo: precisa serializar offset visível na URL.
  - Preservação de scroll ao voltar de detalhe vira hack.
  - Bom para feeds sociais (consumo passivo), ruim para catálogo
    enumerável.
- **Virtual scroll (`@angular/cdk/scrolling`)** — descartado:
  over-engineering para 1.500 entradas; o ganho de performance só
  aparece em listas de 10k+ itens densos.
- **Cursor-based pagination** — descartado: a PokéAPI já expõe
  `count`, `next`, `previous` em offset/limit — não há razão para
  reinventar.

## Consequências

### Positivas

- `/?page=5` é shareable; usuário pode bookmark.
- Foco do teclado é previsível: Tab percorre 20 cards, depois chega
  ao Prev/Next.
- Voltar de uma rota de detalhe restaura a página exata (URL +
  cache = render instantâneo).
- Lighthouse a11y fica fácil: nenhum truque de listbox virtualizado.

### Negativas / Trade-offs

- UX um pouco mais "tradicional" — não há o efeito viral de "scroll
  forever". Aceitável para catálogo finito.
- Usuário não consegue ver 50 cards de uma vez sem clicar Próxima 2x.
  Aceitável dado o foco em deep-linking.

### Neutras / Implicações futuras

- Trocar para scroll infinito **adicionalmente** é possível sem
  refatorar (manter `?page=` como ponto de entrada, anexar páginas
  conforme scroll). Não é prioridade.

## Referências

- `src/app/features/pokemon-list/feature/pokemon-list.page.ts`
- `src/app/features/pokemon-list/util/page-param.ts`
- `src/app/features/pokemon-list/util/page-param.spec.ts`
- `src/app/features/pokemon-list/data-access/pokemon-http.repository.ts`
