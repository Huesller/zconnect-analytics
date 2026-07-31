# Z Connect Comercial 12.10.3

Central comercial da Z Automotiva: CRM, Cliente 360, funil, tarefas, cotações, inteligência de produtos e integração com o catálogo online.

## Instalação

1. Execute `npm install`.
2. Copie `.env.example` para `.env.local` e preencha as variáveis.
3. Execute `npm test` e `npm run build`.
4. Publique na Vercel.
5. Atualize o Google Apps Script com `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js` e crie uma nova implantação do Web App.

## Novos acessos de consultor

O gerador seguro `scripts/generate-multiuser-config.mjs` inclui os usuários `almir` e `gabriel`. Execute `node scripts/generate-multiuser-config.mjs`, defina senhas temporárias fortes e atualize a variável sensível `ANALYTICS_USERS_JSON` na Vercel. As senhas nunca ficam gravadas no projeto.

- `almir` enxerga somente os dados do consultor `almir`.
- `gabriel` enxerga os dados identificados como `gabriel` ou `gabriel-zatt`.

## Versão 12.10.3

- Filtro diário e por data específica na Central de anotações.
- Filtro por data específica e período personalizado nos Relatórios.
- Indicadores e exportações respeitam o período selecionado.

## Versão 12.10.2

- Nova tag fixa `Fora do perfil`.
- Ao salvar um cliente com essa tag, ele sai automaticamente do funil ativo sem perder cadastro ou histórico.
- A tag está disponível no filtro da carteira de clientes.

## Versão 12.10.1

- Acesso individual de CRM para Almir e Gabriel Zatt.
- Escopo comercial isolado por consultor.
- Integração com os links individuais do catálogo e com o painel de valores especiais.

## Versão 12.10.0

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
- Funil reservado às oportunidades com atividade comercial real.
- Ganhos e perdas preservados nos relatórios e no Cliente 360, fora do Kanban ativo.
- Tarefas com data e horário, resposta visual imediata e histórico por cliente.
- Escritas mais rápidas sem retirar as validações de segurança por vendedor.

Consulte `PUBLICACAO-V12.10.0.md` antes de publicar.
