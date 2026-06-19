# Sprint 6 — Performance Pass

## Foco
Reduzir travamentos percebidos na rolagem, digitação da busca e abertura do modal.

## Alterações
- Busca usando `useDeferredValue` para diminuir bloqueio enquanto o usuário digita.
- Produtos recebem índice normalizado no carregamento, evitando normalização repetida em cada busca.
- Redução do PAGE_SIZE de 30 para 25 para diminuir DOM/renderização por página mantendo grid 5x5.
- Imagens com `decoding="async"` nos cards.
- Remoção de `backdrop-filter` de elementos repetidos como cards, carrinho e rails.
- `content-visibility` e `contain` nos cards para melhorar scroll.
- Sombras mais leves nos elementos repetidos.
- Modal/backdrop com menor custo de pintura.

## Regras preservadas
- Preço com IPI
- Carrinho obrigatório
- WhatsApp
- Consultor por querystring
- Política comercial legacy
