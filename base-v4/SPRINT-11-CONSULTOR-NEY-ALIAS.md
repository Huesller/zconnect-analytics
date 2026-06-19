# Sprint 11 — Consultor Ney / Alias Ivoney

## Objetivo
Remover Ivoney como consultor visível e consolidar tudo em Ney.

## Alterações
- `?consultor=ivoney` continua funcionando por compatibilidade.
- Internamente `ivoney` agora resolve para `ney`.
- JSON público de consultores não exibe mais `ivoney`.
- Gerador do catálogo não recria mais `ivoney`.
- Redirect legado `/ivoney` aponta para `?consultor=ney`.
- Analytics futuro deve registrar tudo como `consultor=ney`.

## Regras preservadas
- Links antigos com `?consultor=ivoney` não quebram.
- WhatsApp e telefone permanecem os mesmos do Ney.
- Layout permanece locked.
