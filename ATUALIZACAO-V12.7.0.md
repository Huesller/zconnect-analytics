# Atualização V12.7.0 — identidade, cotação PDF e fechamento comercial

## O que mudou

- Mesclagem permanente de clientes no Cliente 360. O nome alternativo vira um alias e os próximos eventos do catálogo são associados ao cadastro oficial.
- Importação de cotação PDF dentro da aba **Carrinho e cotações** do Cliente 360.
- O mesmo número de cotação atualiza a cotação existente e incrementa sua versão.
- Encerramento como **Pedido fechado** ou **Perdido** sincroniza funil, atividade comercial, cotação, reservas e indicadores de carrinho.
- Consultores só podem mesclar ou alterar clientes pertencentes à própria carteira.

## Publicação obrigatória

Esta versão altera o frontend, a API segura e o Apps Script. Publique os três componentes:

1. Substitua o projeto no repositório/Vercel pelos arquivos desta pasta e faça o deploy.
2. No Google Apps Script conectado à planilha, substitua todo o código por `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js`.
3. Clique em **Implantar > Gerenciar implantações > Editar > Nova versão > Implantar**.
4. Mantenha a URL da implantação na variável `ANALYTICS_API_URL` da Vercel.
5. Abra o Analytics, atualize com `Ctrl + F5` e teste com uma cotação real.

As abas `CRM_ALIASES`, `CRM_QUOTES` e `CRM_QUOTE_ITEMS` serão criadas automaticamente na primeira utilização.

## Teste recomendado

1. Abra o cliente cadastrado completo no Cliente 360.
2. Em **Resumo**, escolha a identidade duplicada do catálogo e clique em **Mesclar neste cliente**.
3. Em **Carrinho e cotações**, importe o PDF.
4. Importe novamente outro PDF com o mesmo número para confirmar a atualização.
5. Escolha **Pedido fechado** ou **Perdido** no funil e confirme que o carrinho desaparece dos ativos.
