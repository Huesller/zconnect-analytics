# Sprint 3 - Favoritos, histórico, relacionados e carrinho compartilhável

## Entregue nesta sprint

### Favoritos
Cada produto ganhou a ação `♡ Favoritar`.
Os favoritos ficam salvos no navegador do cliente em `localStorage`.

Bloco exibido no catálogo:

```txt
❤️ Seus favoritos
```

### Vistos recentemente
Quando o cliente abre detalhes de uma peça ou adiciona ao pedido, o produto entra no histórico local.

Bloco exibido:

```txt
🕘 Vistos recentemente
```

### Produtos relacionados
Dentro do modal de detalhes agora existe o bloco:

```txt
Produtos relacionados
```

A sugestão considera:
- mesmo catálogo;
- mesma montadora/marca;
- palavras parecidas na descrição.

### Link compartilhável do carrinho
O carrinho ganhou o botão:

```txt
Copiar link do carrinho
```

Ele gera uma URL com os itens atuais. Quando outra pessoa abre o link, o carrinho é restaurado automaticamente.

Uso recomendado:
- cliente envia orçamento para sócio/comprador;
- consultor compartilha uma lista pronta;
- comprador salva o pedido para concluir depois.

### Ajuste extra
Os chips de produtos em tendência agora também fazem busca ao clicar.

## Feature flags

As novas funções podem ser desligadas em `window.Z_FEATURES`:

```js
window.Z_FEATURES = {
  favorites: true,
  history: true,
  cartShare: true,
  relatedProducts: true
};
```

## Arquivos alterados

```txt
ui/catalog.js
ui/catalog.css
catalogo-gerado/assets/catalog.js
catalogo-gerado/assets/catalog.css
```

## Validação feita

```bash
node --check ui/catalog.js
node --check catalogo-gerado/assets/catalog.js
```

## Observações

Favoritos e histórico são locais do dispositivo do cliente.
Eles não vão para o dashboard porque não representam pedido real.

O link de carrinho compartilhável usa os dados do próprio carrinho na URL.
Para pedidos muito grandes, a URL pode ficar longa. Em uma sprint futura, dá para trocar por link curto salvo em banco/API.
