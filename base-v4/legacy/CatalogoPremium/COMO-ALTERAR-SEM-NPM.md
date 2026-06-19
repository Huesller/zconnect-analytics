# Como alterar textos e visual sem rodar npm

A partir desta versão, o catálogo publicado usa arquivos externos em:

```text
catalogo-gerado/assets/
├── catalog.css
├── catalog.js
├── cart.js
└── textos.js
```

## Alterar frases da busca, faixa de confiança e textos comerciais

Edite:

```text
catalogo-gerado/assets/textos.js
```

Exemplo:

```js
window.Z_TEXTOS = {
  searchKicker: '🚗 Encontre sua peça',
  searchTitle: 'Pesquise por código, descrição, marca ou referência.',
  searchSubtitle: 'Adicione ao pedido e envie diretamente ao seu consultor.'
};
```

Depois suba:

```powershell
git add .
git commit -m "altera textos do catalogo"
git push
```

Não precisa rodar `npm run scrape`.

## Alterar cores, tamanho da busca, cards e visual

Edite:

```text
catalogo-gerado/assets/catalog.css
```

Depois suba:

```powershell
git add .
git commit -m "altera visual do catalogo"
git push
```

Não precisa rodar `npm run scrape`.

## Quando ainda precisa rodar npm?

Use:

```powershell
npm run scrape
```

somente quando precisar atualizar:

- produtos;
- preços;
- imagens;
- catálogos;
- consultores no `scraper.js`;
- estrutura HTML gerada em `ui/generate-html.js`.

## Importante

Se você alterar `ui/catalog.css`, `ui/catalog.js`, `ui/textos.js` ou `cart/cart.js`, precisa rodar `npm run scrape` para copiar essas mudanças para `catalogo-gerado/assets`.

Para mudanças rápidas do site online, altere diretamente os arquivos dentro de:

```text
catalogo-gerado/assets/
```


## Alterar consultores e representante fixo

Edite `catalogo-gerado/assets/consultores.js` para alterar nome, WhatsApp e política comercial dos consultores sem rodar npm.

Link fixo do representante: `/?consultor=representante`.
