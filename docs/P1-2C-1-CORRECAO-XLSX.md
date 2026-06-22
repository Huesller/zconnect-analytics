# P1.2C.1 — Correção Exportação Executiva XLSX

## Problema

O relatório executivo era gerado com extensão `.xls`, mas o conteúdo interno não era um arquivo Excel real. O Microsoft Excel exibia aviso de incompatibilidade de formato e depois indicava arquivo corrompido.

## Correção

A exportação executiva passou a gerar um `.xlsx` real, usando a estrutura OpenXML compactada em ZIP diretamente no navegador.

## Entregue

- Geração de arquivo `.xlsx` verdadeiro.
- Múltiplas abas preservadas:
  - Resumo Executivo
  - Produtos Mais Quentes
  - Produtos Mais Cotados
  - Demandas Sem Resultado
  - Empresas
  - Consultores
  - Empresas Adormecidas
  - Dados Gráficos
  - Eventos Brutos
- Download com MIME type correto:
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Nome de arquivo corrigido para `.xlsx`.
- CSV bruto mantido separado.

## Validação

Executado:

```bash
npm install
npm run build
```

Resultado:

- instalação OK
- build OK
