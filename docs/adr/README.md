# Architecture Decision Records (ADRs)

Este diretório guarda decisões arquiteturais relevantes. Cada decisão vira um
arquivo numerado e imutável: uma vez aceito, um ADR não é editado — caso a
decisão seja revertida, cria-se um novo ADR com status `Superseded by ADR-XXXX`.

## Por que ADRs

Decisões viram código rapidamente; o "porquê" se perde. ADRs capturam o
contexto, as alternativas consideradas e os trade-offs no momento em que a
decisão foi tomada, permitindo que decisões futuras sejam informadas em vez de
re-discutidas do zero.

## Estrutura

- `0001-architecture-decisions-log.md` — meta-ADR sobre como usamos ADRs
- `template.md` — modelo a copiar para cada novo registro

## Quando criar

Crie um ADR sempre que a decisão:

- Atravessa fronteiras (afeta múltiplos módulos/features)
- Restringe ou habilita opções futuras
- Tem alternativas razoáveis que foram conscientemente descartadas
- É contraintuitiva ou poderia ser questionada em um code review

Decisões locais (nomear uma variável, escolher uma helper) **não** precisam de
ADR.
