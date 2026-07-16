# Atualização 12.5.4 — importação XLSX segura

## Correções

- A leitura de XLSX/XLSM agora aceita células vazias sem gerar o erro `reading 'trim'`.
- A estrutura da planilha consolidada com cabeçalho na quarta linha é reconhecida.
- A coluna `Página` não é interpretada como `Dias sem comprar`.
- Ao atualizar um cliente existente, o valor zero de dias sem comprar passa a substituir dados incorretos de importações antigas.

## Publicação

1. Publique esta versão do site.
2. Substitua o código do Google Apps Script pelo arquivo `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js` e publique uma nova implantação.
3. Importe a planilha usando **Atualizar cadastro existente** para corrigir também os clientes já cadastrados.

