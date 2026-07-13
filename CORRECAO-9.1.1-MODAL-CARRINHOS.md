# Analytics 9.1.1 — correção do modal de carrinhos

## Problema corrigido

Ao clicar em **Carrinhos ativos**, **Peças reservadas** ou na tabela de carrinhos, o evento do clique era recebido como se fosse o título do modal. O React tentava renderizar esse objeto e a aplicação ficava apenas com o fundo preto.

## Correção

- O modal de reservas agora aceita somente títulos em texto.
- Cliques diretos usam automaticamente o título `Carrinhos ativos agora`.
- O gerenciador geral de modais também valida o título para impedir que um erro semelhante derrube a tela inteira.

## Publicação

Publique somente esta pasta `ZConnect-Analytics` no mesmo projeto do Analytics na Vercel. Não é necessário republicar o catálogo nem o Google Apps Script.

Depois da publicação, atualize a página com `Ctrl + F5` e clique novamente em **Carrinhos ativos**.
