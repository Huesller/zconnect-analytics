# P0 - Reset producao Analytics

Data: 2026-06-21

## Escopo preservado

- Catálogo não alterado.
- Coleta de eventos não alterada.
- Contrato de dados não alterado.
- Dashboard mantido no desenho atual, com ajustes pontuais de operação e apresentação.

## Ajustes aplicados

- O botão **Limpar dados de teste** chama o Apps Script com `action=clear_events`.
- O painel envia `pin` quando `VITE_ANALYTICS_ADMIN_PIN` está configurado.
- Sem `VITE_ANALYTICS_ADMIN_PIN`, o reset fica liberado temporariamente para apresentação.
- O botão fica desabilitado durante a limpeza para impedir duplo clique.
- Durante a limpeza, o botão mostra estado `Limpando...` com loading.
- Em sucesso, o dashboard zera os eventos no estado local, atualiza a leitura e mostra o toast `Dados de teste limpos com sucesso`.
- Em falha, mostra o toast `Erro ao limpar dados. Verifique Apps Script/PIN` e mantém erro claro no painel.
- A tela mostra `Última atualização: HH:mm` após atualizar e após reset.
- Empty state padronizado:
  - Geral: `Nenhum evento registrado no período.`
  - Listas: `Sem dados no período.`
- Textos comerciais revisados para usar cotação, cotações WhatsApp, valor cotado e oportunidades.
- Modais mantidos com abertura por cards, scroll interno, botão fechar e fechamento por ESC.

## Apps Script

Arquivo: `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js`

- `clear_events` valida `ANALYTICS_ADMIN_PIN` quando a Script Property existe.
- Se `ANALYTICS_ADMIN_PIN` não existir, o reset é permitido.
- A limpeza preserva a linha 1 da aba `EVENTS`.
- As linhas abaixo do cabeçalho são removidas com `deleteRows(2, rowsToDelete)`.
- O retorno inclui `clearedRows` para facilitar conferência operacional.

## Validação executada

- `npm.cmd install`: OK, 0 vulnerabilidades.
- `npm.cmd run build`: OK, build Vite concluído.
- `npm.cmd run dev`: OK, servidor Vite iniciado em `http://localhost:5173/`.
- `Invoke-WebRequest http://localhost:5173/`: OK, HTTP 200.
- Varredura textual sem ocorrências de termos comerciais proibidos em `src`, docs e arquivos raiz relevantes.

## Arquivos alterados

- `src/main.jsx`
- `src/styles.css`
- `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js`
- `docs/SPRINT-ANALYTICS-GO-LIVE.md`
- `docs/P0-RESET-PRODUCAO-ANALYTICS.md`

## Publicação

1. Publicar o conteúdo atualizado de `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js` no Apps Script.
2. Se desejar exigir PIN no endpoint, configurar a Script Property `ANALYTICS_ADMIN_PIN`.
3. Se desejar pedir PIN no painel, configurar `VITE_ANALYTICS_ADMIN_PIN`.
4. Fazer o deploy do Analytics com o build gerado.
