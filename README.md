# Z Connect Comercial 12.9.0

Central comercial da Z Automotiva: CRM, Cliente 360, funil, tarefas, cotações, inteligência de produtos e integração com o catálogo online.

## Instalação

1. Execute `npm install`.
2. Copie `.env.example` para `.env.local` e preencha as variáveis.
3. Execute `npm test` e `npm run build`.
4. Publique na Vercel.
5. Atualize o Google Apps Script com `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js` e crie uma nova implantação do Web App.

## Versão 12.9.0

- Nova classificação comercial de anotações.
- Demanda não atendida cadastrada manualmente no Cliente 360.
- Identificação por código ou descrição usando o snapshot do catálogo.
- Código, descrição, marca e estoque preenchidos quando o produto existe.
- Origem, quantidade e observação preservadas.
- Demanda manual incluída em Interesses, Produtos e Demanda x estoque.
- Pesquisas do catálogo continuam separadas da demanda manual.
- Salvamento otimista para anotações e demandas, com reversão em caso de erro.
- Persistência própria na aba `CRM_DEMANDS` e escopo por vendedor.
- Tags comerciais fixas, múltiplas e filtráveis.
- Saída segura do funil com motivo, sem excluir o cliente.
- Relatório de ocorrências e recorrências por cliente com exportação Excel.

Consulte `PUBLICACAO-V12.9.0.md` antes de publicar.
