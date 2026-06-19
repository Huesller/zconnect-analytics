# CHANGELOG V8 - Analytics por Empresa

## Implementado

- Dashboard passou a reconhecer `empresa`, `companyName` e `clientId`.
- Filtro por empresa.
- Lista de empresas identificadas.
- Jornada por cliente/empresa.
- Detecção de carrinho abandonado.
- Ranking de empresas.
- Ranking de empresas que mais enviaram WhatsApp.
- Exportação CSV com empresa e clientId.
- Cards/KPIs mais compactos.
- Visual refinado para reduzir informações grandes demais.
- `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js` com novas colunas:
  - clientId
  - companyName
  - empresa
  - company
  - searchTimeMs
  - resultsCount

## Importante

Atualize o Apps Script usando o arquivo:

`GOOGLE_APPS_SCRIPT_V3_CLIENTES.js`

Depois publique uma nova implantação no Google Apps Script.
