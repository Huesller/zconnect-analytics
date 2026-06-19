# Fluxo seguro de preço e estoque

## Regra comercial fixa

O catálogo usa preço cheio com IPI vindo do sistema e aplica política fixa equivalente a 45%:

```txt
preço catálogo = preço cheio com IPI × 0,55
```

Exemplo:

```txt
R$ 189,17 × 0,55 = R$ 104,05
```

O arredondamento é feito para cima no centavo para não vender abaixo da política.

## Comando geral

Use quando quiser atualizar produtos, imagens e preços:

```bash
npm run scrape
```

Antes de rodar, deixe o sistema sem desconto operacional para que o preço cheio com IPI seja capturado corretamente.

## Comando diário

Use para atualizar estoque/disponibilidade sem alterar os preços já publicados:

```bash
npm run estoque
```

## Importante

- `catalog.js`, `catalog.css` e `cart.js` agora são atualizados pelo npm para garantir que todos os catálogos e links de consultor recebam o visual novo.
- `textos.js` e `consultores.js` continuam preservados como configuração manual.
