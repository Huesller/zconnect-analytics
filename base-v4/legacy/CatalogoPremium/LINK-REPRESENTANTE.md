# Link fixo do representante

Foi adicionada uma configuração externa de consultores em:

`catalogo-gerado/assets/consultores.js`

## Link fixo do representante

Depois de publicar na Vercel, use:

`https://SEU-SITE.vercel.app/?consultor=representante`

Exemplo:

`https://zautomotiva-catalogopremium.vercel.app/?consultor=representante`

Ao abrir esse link:

- aparece apenas o WhatsApp do representante;
- o banner mostra atendimento exclusivo do representante;
- os preços são recalculados pela política comercial configurada;
- não precisa gerar link especial no painel;
- não precisa rodar `npm run scrape` para alterar nome, telefone ou política do representante.

## Política comercial configurada

O catálogo atual considera política de 45%.

O representante foi configurado para política de 50%.

O sistema calcula automaticamente:

`preço_atual × ((100 - 50) / (100 - 45))`

Ou seja:

`preço_atual × 0,9090909`

## Alterar depois sem npm

Abra:

`catalogo-gerado/assets/consultores.js`

E edite:

```js
representante: {
  id: 'representante',
  nome: 'Representante Externo',
  whatsapp: '55DDDNUMERO',
  ajusteTipo: 'politicaDesconto',
  descontoBaseAtual: 45,
  descontoDestino: 50
}
```

Depois faça apenas:

```powershell
git add .
git commit -m "altera representante"
git push
```

Use `npm run scrape` somente quando precisar atualizar produtos, preços, imagens ou catálogos.
