# Z Automotiva — Catálogo Estático

Projeto configurado para gerar o catálogo localmente e publicar na Vercel apenas a pasta `catalogo-gerado`.

## Como atualizar produtos

```powershell
npm install
npx playwright install chromium
npm run scrape
git add .
git commit -m "atualiza catalogo"
git push
```

## Vercel

Configuração recomendada:

- Framework Preset: Other
- Build Command: vazio
- Install Command: vazio
- Output Directory: `catalogo-gerado`

O arquivo `vercel.json` já aponta para `catalogo-gerado`.

## Gerar link especial com desconto/acréscimo

Abra no site publicado:

```text
/admin.html
```

Escolha consultor, tipo de ajuste e percentual. O sistema gera um link com token oculto na URL, por exemplo:

```text
?oferta=TOKEN
```

O percentual não aparece de forma explícita na URL. O cliente abre o link, vê os preços recalculados, usa busca/filtros/carrinho normalmente e envia para o WhatsApp do consultor selecionado.

## Observação importante

A ocultação do percentual é uma obfuscação no front-end, suficiente para uso comercial comum. Para sigilo absoluto, seria necessário backend com banco de dados e autenticação.

## Painel comercial local

O painel de geração de links especiais agora fica fora de `catalogo-gerado`, no arquivo:

```text
painel-comercial-local.html
```

Como a Vercel publica apenas `catalogo-gerado`, esse painel não fica disponível para clientes no site.

Use assim:

1. Abra `painel-comercial-local.html` no seu computador.
2. Informe a URL pública do catálogo na Vercel.
3. Escolha consultor, desconto/acréscimo e percentual.
4. Clique em gerar link.
5. Envie apenas o link gerado para o cliente.

O cliente verá os preços recalculados pelo token `oferta`, sem o percentual aparecer diretamente na URL.

## Versão comercial v3

Inclui melhorias de usabilidade para cliente final:

- Modal de detalhes do produto
- Botão copiar código
- Compartilhar produto específico
- Destaque de produto via link
- Pedido rápido por código e quantidade
- Filtros rápidos por catálogo
- Botão "Não encontrei minha peça"
- Carrinho mobile flutuante
- Subtotal do pedido
- Campo de observação no pedido
- Selo "Preço com IPI incluso"
- Mensagem de WhatsApp mais completa

Fluxo de atualização:

```powershell
npm install
npx playwright install chromium
npm run scrape
git add .
git commit -m "atualiza catalogo"
git push
```

A Vercel deve continuar configurada com:

- Build Command: vazio
- Install Command: vazio
- Output Directory: catalogo-gerado


## Como alterar sem npm

Veja o arquivo `COMO-ALTERAR-SEM-NPM.md`.
