# Z Connect Analytics 12.3 — importação de carteira

- importa clientes diretamente do relatório PDF do SIGGMA;
- aceita também planilhas XLSX/XLSM e arquivos CSV;
- reconstrói razão social, endereço e demais campos quebrados em várias linhas no PDF;
- apresenta prévia com novos, atualizações, ignorados e erros antes de salvar;
- localiza duplicidades por CPF/CNPJ, código interno ou nome normalizado;
- permite atualizar cadastros existentes ou ignorá-los;
- cria backup automático da carteira antes de qualquer atualização em lote;
- limita cada operação a 2.000 clientes e mantém o escopo da carteira por usuário;
- acrescenta CPF/CNPJ, UF, endereço, rota e dias sem compra ao Cliente 360;
- não inclui credenciais nem dados de clientes no pacote de distribuição.

## Publicação obrigatória

1. Substitua o código da implantação do Google Apps Script por `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js` e publique uma nova versão mantendo o mesmo URL.
2. Publique o restante do projeto na Vercel.
3. Entre novamente no Analytics e teste inicialmente com uma página ou uma planilha pequena.

Planilhas no formato antigo `.xls` devem ser salvas como `.xlsx` antes da importação.
