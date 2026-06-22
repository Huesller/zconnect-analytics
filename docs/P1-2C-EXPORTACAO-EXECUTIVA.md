# P1.2C — Exportação Executiva

## Objetivo

Refinar a exportação do Z Connect Analytics para uso gerencial, evitando que o proprietário precise tratar eventos crus manualmente.

## Implementado

- Botão **Relatório executivo** no topo do dashboard.
- Exportação Excel compatível `.xls` com múltiplas abas.
- Exportação respeitando os filtros atuais:
  - período
  - consultor
  - empresa
- Exportação CSV bruta mantida, agora com nome explícito: **CSV bruto**.
- Exportação individual dentro dos modais: **Exportar lista**.
- Abas geradas no relatório executivo:
  - Resumo Executivo
  - Produtos Quentes
  - Produtos Cotados
  - Demandas Sem Resultado
  - Empresas
  - Consultores
  - Empresas Adormecidas
  - Dados Gráficos
  - Eventos Brutos

## Observação sobre gráficos

A exportação inclui uma aba chamada **Dados Gráficos** com bases prontas para gráficos no Excel:

- Funil comercial
- Top 10 produtos quentes
- Top 10 empresas
- Top 10 consultores

Essa abordagem evita dependências externas e mantém o build simples e estável.

## Arquivos alterados

- `src/main.jsx`
- `src/styles.css`
- `docs/P1-2C-EXPORTACAO-EXECUTIVA.md`

## Validação

Executado:

```bash
npm install
npm run build
```

Resultado:

```txt
Build OK
```
