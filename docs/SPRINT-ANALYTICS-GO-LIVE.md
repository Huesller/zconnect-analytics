# Sprint Analytics Go Live - Z Connect

## Objetivo

Finalizar o contrato de eventos entre o catalogo publicado e o Analytics, exibindo dados reais por empresa, busca, produto e consultor, com reset administrativo para limpar dados de teste.

## Eventos implementados

Todos os eventos do contrato passam a considerar `companyName`, `consultant`, `event` e `timestamp`.

- `page_view`: acesso identificado por empresa e consultor.
- `search`: busca com `query` e `resultsCount`.
- `search_no_results`: busca sem resultado direto nem sugestao.
- `product_open`: abertura de produto com codigo, nome, marca e preco.
- `add_to_cart`: item adicionado com produto, quantidade e preco.
- `remove_from_cart`: item removido com produto, quantidade e preco.
- `clear_cart`: carrinho limpo com `itemsCount` e `cartTotal`.
- `whatsapp_quote`: cotacao/orcamento/negociacao via WhatsApp, com `itemsCount`, `cartTotal` e `products`.

Importante: `whatsapp_quote` nao e venda. O dashboard trata como cotacao WhatsApp.

## Arquivos alterados

Analytics:

- `src/main.jsx`: dashboard reconstruido para o contrato novo, normalizacao de aliases, rankings, funil, CSV e reset.
- `src/styles.css`: estilos complementares para administracao, eventos recentes e novos dots de eventos.
- `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js`: novos campos, aliases antigos, serializacao segura de `products` e acao de limpeza.
- `docs/SPRINT-ANALYTICS-GO-LIVE.md`: este relatorio.

Catalogo:

- `src/main.jsx`: eventos principais alinhados ao contrato novo.
- `src/App.tsx`: componente legado alinhado aos nomes novos para evitar regressao futura.
- `src/analytics/track.js`: helper legado reforcado com `companyName`, `timestamp`, `itemsCount`, `cartTotal` e `products`.

## Dashboard implementado

Resumo geral:

- acessos
- buscas
- buscas sem resultado
- produtos abertos
- produtos adicionados
- produtos removidos
- carrinhos limpos
- cotacoes WhatsApp

Empresas:

- clientes mais ativos
- clientes que mais pesquisaram
- clientes que mais enviaram cotacoes
- valor total cotado

Buscas:

- top buscas
- buscas sem resultado
- buscas por empresa
- buscas recentes

Produtos:

- mais abertos
- mais adicionados
- mais removidos
- mais cotados

Consultores:

- acessos por consultor
- buscas por consultor
- cotacoes por consultor
- valor total cotado por consultor

Funil:

- acessos
- buscas
- produtos abertos
- adicionados ao carrinho
- cotacoes WhatsApp

## Reset implementado

Botao criado: `Limpar dados de teste`.

Regras implementadas:

- pede confirmacao com o texto: `Tem certeza que deseja apagar todos os dados de analytics?`
- limpa todos os eventos salvos no Apps Script via acao `clear_events`
- atualiza o dashboard imediatamente apos limpar
- se `VITE_ANALYTICS_ADMIN_PIN` existir, exige o PIN no painel antes de chamar o reset
- se nao houver PIN configurado, o botao fica liberado somente em ambiente local/dev

Observacao operacional: para protecao tambem no Apps Script, configurar a Script Property `ANALYTICS_ADMIN_PIN` com o mesmo valor de `VITE_ANALYTICS_ADMIN_PIN`.

## Apps Script

`GOOGLE_APPS_SCRIPT_V3_CLIENTES.js` agora suporta:

- gravacao de `timestamp`
- gravacao de `consultant` e `consultor`
- gravacao de `companyName`, `empresa` e `company`
- gravacao de `itemsCount`
- gravacao de `cartTotal`
- gravacao de `products` como JSON/string segura
- leitura normalizada dos eventos
- acao `clear_events`, com aliases `reset` e `clear`

Aliases antigos normalizados:

- `whatsapp_order` => `whatsapp_quote`
- `whatsapp_checkout` => `whatsapp_quote`
- `view_product` => `product_open`
- `sem_resultado` => `search_no_results`
- `search_no_result` => `search_no_results`

## Como testar

1. Publicar o `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js` atualizado no Apps Script.
2. Garantir que o Analytics usa `VITE_ANALYTICS_API_URL` apontando para o Web App publicado.
3. Se desejar PIN no painel, configurar `VITE_ANALYTICS_ADMIN_PIN`.
4. Se desejar protecao tambem no endpoint, configurar Script Property `ANALYTICS_ADMIN_PIN`.
5. Abrir o catalogo publicado.
6. Informar a empresa `TESTE`.
7. Pesquisar `PARACHOQUE HB20`.
8. Abrir um produto.
9. Adicionar ao carrinho.
10. Remover um item.
11. Limpar carrinho.
12. Adicionar novamente.
13. Finalizar no WhatsApp.
14. Abrir o Analytics, clicar em `Atualizar` e confirmar os eventos no dashboard.

## Comandos executados

Analytics:

```bash
npm.cmd install
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1 --port 5198 --strictPort
```

Catalogo:

```bash
npm.cmd install
npm.cmd run build
```

## Resultado da validacao

Analytics:

- `npm.cmd install`: concluiu com 0 vulnerabilidades.
- `npm.cmd run build`: sucesso com Vite v8.0.16.
- `npm.cmd run dev`: Vite iniciou em `http://127.0.0.1:5198/`.
- Checagem local: `DEV_OK status=200`.
- Processo dev encerrado apos validacao.

Catalogo:

- `npm.cmd install`: concluiu, mantendo 2 vulnerabilidades herdadas do projeto (1 moderada, 1 alta).
- `npm.cmd run build`: sucesso com Vite v5.4.21.

## Riscos restantes

- O reset fica realmente protegido no endpoint somente se a Script Property `ANALYTICS_ADMIN_PIN` for configurada no Apps Script.
- A confirmacao de eventos reais depende da publicacao do Apps Script atualizado e do deploy do Catalogo com os ajustes de contrato.
- O Catálogo tem vulnerabilidades herdadas em dependencias; nao foram corrigidas agora para evitar troca de versoes fora do foco deste sprint.
- Falhas de rede no envio do Catalogo continuam sendo silenciosas para nao quebrar a experiencia do cliente.
